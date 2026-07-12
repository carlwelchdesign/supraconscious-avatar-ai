import express from "express"
import cors from "cors"
import helmet from "helmet"
import rateLimit from "express-rate-limit"
import path from "path"
import { fileURLToPath } from "url"
import { dirname } from "path"
import {
  createJournalEntry,
  analyzeJournalEntry,
  generateAvatarReflection,
  generatePersonalizedPrompt,
  getRecentPatterns,
  runInnerCouncilReflection,
  saveReflectionSession
} from "./tools/index.js"
import { authMiddleware, safetyMiddleware, type AuthenticatedRequest } from "./middleware/index.js"
import { logOperationalError, readPublicErrorMessage } from "./lib/errors.js"
import { buildHealthPayload, PUBLIC_NO_STORE_HEADERS } from "./lib/health-response.js"
import { chatGptMessages, readRequestLanguageHeader } from "./lib/localization.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
export const app = express()
const PORT = readServerPort()

// Middleware
app.use(helmet())
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true)
    callback(null, readCorsOrigins().includes(normalizeBaseUrl(origin)))
  },
  credentials: true
}))
app.use(express.json({ limit: '10mb' }))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: (req: express.Request) => chatGptMessages(readRequestLanguageHeader(req.headers["accept-language"])).rateLimit
})
app.use('/api/', limiter)

// Serve widget static files
app.get('/widget/config.js', (req, res) => {
  void req
  const webAppUrl = normalizeBaseUrl(process.env.INNER_AVATAR_WEB_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000')
  res
    .set(PUBLIC_NO_STORE_HEADERS)
    .type('application/javascript')
    .send(`window.INNER_AVATAR_WIDGET_CONFIG = ${JSON.stringify({ webAppUrl })};`)
})
app.use('/widget', express.static(path.join(__dirname, 'widget')))

// Health check
app.get('/health', (req, res) => {
  void req
  res.set(PUBLIC_NO_STORE_HEADERS)
  res.json(buildHealthPayload())
})

// MCP tools endpoint
app.get('/mcp/tools', (req, res) => {
  const t = chatGptMessages(readRequestLanguageHeader(req.headers["accept-language"]))
  res.set(PUBLIC_NO_STORE_HEADERS)
  res.json({
    tools: [
      {
        name: 'create_journal_entry',
        description: t.tools.create_journal_entry,
        inputSchema: {
          type: 'object',
          properties: {
            text: { type: 'string' },
            source: { type: 'string', enum: ['chatgpt'] },
            save: { type: 'boolean' }
          },
          required: ['text']
        }
      },
      {
        name: 'analyze_journal_entry',
        description: t.tools.analyze_journal_entry,
        inputSchema: {
          type: 'object',
          properties: {
            entryId: { type: 'string' },
            text: { type: 'string' }
          }
        }
      },
      {
        name: 'generate_avatar_reflection',
        description: t.tools.generate_avatar_reflection,
        inputSchema: {
          type: 'object',
          properties: {
            entryId: { type: 'string' },
            text: { type: 'string' },
            tone: { type: 'string', enum: ['gentle', 'balanced', 'direct'] }
          }
        }
      },
      {
        name: 'generate_personalized_prompt',
        description: t.tools.generate_personalized_prompt,
        inputSchema: {
          type: 'object',
          properties: {
            entryId: { type: 'string' },
            text: { type: 'string' },
            level: { type: 'number' },
            targetPattern: { type: 'string' }
          }
        }
      },
      {
        name: 'run_inner_council_reflection',
        description: t.tools.run_inner_council_reflection,
        inputSchema: {
          type: 'object',
          properties: {
            text: { type: 'string' },
            inputMode: { type: 'string', enum: ['text', 'voice'] },
            calibrationScenario: {
              type: 'string',
              enum: ['voice_test', 'source_grounding_test', 'embodiment_test', 'no_source_fallback_test', 'intensity_boundary_test', 'freeform']
            }
          },
          required: ['text']
        }
      },
      {
        name: 'get_recent_patterns',
        description: t.tools.get_recent_patterns,
        inputSchema: {
          type: 'object',
          properties: {
            limit: { type: 'number' }
          }
        }
      },
      {
        name: 'save_reflection_session',
        description: t.tools.save_reflection_session,
        inputSchema: {
          type: 'object',
          properties: {
            entryText: { type: 'string' },
            analysis: { type: 'object' },
            avatarResponse: { type: 'object' },
            generatedPrompt: { type: 'object' }
          },
          required: ['entryText', 'analysis', 'avatarResponse', 'generatedPrompt']
        }
      }
    ]
  })
})

// MCP tool execution endpoint
app.post('/mcp/tools/:toolName',
  authMiddleware,
  safetyMiddleware,
  async (req, res) => {
  try {
    const t = chatGptMessages(readRequestLanguageHeader(req.headers["accept-language"]))
    const { toolName } = req.params
    const input = req.body

    let result: unknown

    switch (toolName) {
      case 'create_journal_entry':
        result = await createJournalEntry(input, (req as AuthenticatedRequest).userId)
        break
      case 'analyze_journal_entry':
        result = await analyzeJournalEntry(input, (req as AuthenticatedRequest).userId)
        break
      case 'generate_avatar_reflection':
        result = await generateAvatarReflection(input, (req as AuthenticatedRequest).userId)
        break
      case 'generate_personalized_prompt':
        result = await generatePersonalizedPrompt(input, (req as AuthenticatedRequest).userId)
        break
      case 'run_inner_council_reflection':
      {
        const authenticatedUserId = (req as AuthenticatedRequest).userId
        if (!authenticatedUserId) {
          return res.status(401).json({ error: t.authRequired })
        }
        result = await runInnerCouncilReflection(input, authenticatedUserId)
        break
      }
      case 'get_recent_patterns':
        result = await getRecentPatterns(input, (req as AuthenticatedRequest).userId)
        break
      case 'save_reflection_session':
        result = await saveReflectionSession(input, (req as AuthenticatedRequest).userId)
        break
      default:
        return res.status(404).json({ error: t.toolNotFound })
    }

    res.json(result)
  } catch (error) {
    const t = chatGptMessages(readRequestLanguageHeader(req.headers["accept-language"]))
    logOperationalError('Tool execution error', error)
    res.status(400).json({ error: readPublicErrorMessage(error, t.toolExecutionFailed) })
  }
})

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  void next
  const t = chatGptMessages(readRequestLanguageHeader(req.headers["accept-language"]))
  logOperationalError('Server error', err)
  res.status(500).json({ error: t.internalServerError })
})

export function startChatGptApp(port: number = readServerPort()) {
  const server = app.listen(port, () => {
    const address = server.address()
    const actualPort = typeof address === 'string' ? port : address?.port ?? port
    console.log(`ChatGPT App MCP server running on port ${actualPort}`)
    console.log(`Health check: http://localhost:${actualPort}/health`)
    console.log(`MCP tools: http://localhost:${actualPort}/mcp/tools`)
  })
  return server
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  startChatGptApp(PORT)
}

function normalizeBaseUrl(value: string) {
  return value.replace(/\/+$/, '')
}

function readServerPort() {
  const port = Number(process.env.CHATGPT_APP_PORT ?? process.env.PORT)
  return Number.isFinite(port) && port > 0 ? port : 3002
}

function readCorsOrigins() {
  return Array.from(new Set([
    'https://chat.openai.com',
    'https://chatgpt.com',
    process.env.INNER_AVATAR_WEB_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_ADMIN_URL,
    process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : undefined,
  ].filter((origin): origin is string => Boolean(origin)).map(normalizeBaseUrl)))
}
