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
  saveReflectionSession
} from "./tools/index.js"
import { authMiddleware, safetyMiddleware, type AuthenticatedRequest } from "./middleware/index.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
export const app = express()
const PORT = Number(process.env.CHATGPT_APP_PORT) || 3002

// Middleware
app.use(helmet())
app.use(cors({
  origin: [
    'https://chat.openai.com',
    'https://chatgpt.com',
    process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : false
  ].filter(Boolean),
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
app.use('/widget', express.static(path.join(__dirname, 'widget')))

// Health check
app.get('/health', (req, res) => {
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
        description: 'Generates a short Inner Avatar reflection for a journal entry.',
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
        description: 'Saves the journal entry, analysis, Avatar response, and generated prompt as one reflection session.',
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
        result = await createJournalEntry(input)
        break
      case 'analyze_journal_entry':
        result = await analyzeJournalEntry(input)
        break
      case 'generate_avatar_reflection':
        result = await generateAvatarReflection(input)
        break
      case 'generate_personalized_prompt':
        result = await generatePersonalizedPrompt(input)
        break
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

// Widget resources
app.use('/widget', express.static(path.join(__dirname, 'widget')))

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  void req
  void next
  console.error('Server error:', err)
  res.status(500).json({ error: 'Internal server error' })
})

export function startChatGptApp(port: number = Number(process.env.CHATGPT_APP_PORT) || 3002) {
  return app.listen(port, () => {
    console.log(`ChatGPT App MCP server running on port ${port}`)
    console.log(`Health check: http://localhost:${port}/health`)
    console.log(`MCP tools: http://localhost:${port}/mcp/tools`)
  })
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  startChatGptApp(PORT)
}
