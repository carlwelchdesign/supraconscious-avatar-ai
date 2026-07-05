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
  message: 'Too many requests from this IP, please try again later.'
})
app.use('/api/', limiter)

// Serve widget static files
app.get('/widget/config.js', (req, res) => {
  void req
  const webAppUrl = normalizeBaseUrl(process.env.INNER_AVATAR_WEB_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000')
  res
    .type('application/javascript')
    .send(`window.INNER_AVATAR_WIDGET_CONFIG = ${JSON.stringify({ webAppUrl })};`)
})
app.use('/widget', express.static(path.join(__dirname, 'widget')))

// Health check
app.get('/health', (req, res) => {
  void req
  res.set('Cache-Control', 'no-store')
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// MCP tools endpoint
app.get('/mcp/tools', (req, res) => {
  res.json({
    tools: [
      {
        name: 'create_journal_entry',
        description: 'Creates a journal entry for the authenticated user.',
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
        description: 'Analyzes a journal entry for emotional signals, language patterns, contradictions, and safety flags.',
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
        description: 'Generates a short Supraconscious guide reflection for a journal entry.',
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
        description: 'Generates a symbolic but grounded journaling prompt based on the user\'s entry and detected pattern.',
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
        description: 'Runs the same Supraconscious Inner Council reflection flow used by the web journal, including safety handling, council voices, Integrator question, and source provenance.',
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
        description: 'Returns recent non-sensitive pattern summaries for the authenticated user.',
        inputSchema: {
          type: 'object',
          properties: {
            limit: { type: 'number' }
          }
        }
      },
      {
        name: 'save_reflection_session',
        description: 'Saves the journal entry, analysis, guide response, and generated prompt as one reflection session.',
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
          return res.status(401).json({ error: 'Authentication required' })
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
        return res.status(404).json({ error: 'Tool not found' })
    }

    res.json(result)
  } catch (error) {
    console.error('Tool execution error:', error)
    const message = error instanceof Error ? error.message : 'Tool execution failed'
    res.status(400).json({ error: message })
  }
})

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  void req
  void next
  console.error('Server error:', err)
  res.status(500).json({ error: 'Internal server error' })
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
