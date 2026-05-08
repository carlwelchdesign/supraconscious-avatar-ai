# ChatGPT App Implementation Task List

## Phase 1: Monorepo Setup and Package Creation

### 1.1 Create `apps/chatgpt-app` Package Structure
- [ ] Create directory `apps/chatgpt-app`
- [ ] Add `package.json` with dependencies:
  - Shared workspaces: `@inner-avatar/auth`, `@inner-avatar/ai`, `@inner-avatar/db`, `@inner-avatar/types`, `@inner-avatar/ui`
  - ChatGPT-specific: `openai`, `@openai/apps-sdk` (or equivalent MCP server tooling)
  - Runtime: `express`, `cors`, `helmet`, `express-rate-limit`
  - Dev: `@types/express`, `tsx`, `nodemon`
- [ ] Add `tsconfig.json` extending `@inner-avatar/config/tsconfig.base.json`
- [ ] Add basic directory structure: `src/`, `src/tools/`, `src/widget/`, `src/middleware/`
- [ ] Add `.gitignore` for build outputs

### 1.2 Update Root Monorepo Configuration
- [ ] Add root scripts in `package.json`:
  - `"dev:chatgpt": "turbo dev --filter=@inner-avatar/chatgpt-app"`
  - `"build:chatgpt": "turbo build --filter=@inner-avatar/chatgpt-app"`
  - `"start:chatgpt": "turbo start --filter=@inner-avatar/chatgpt-app"`
- [ ] Confirm `turbo.json` includes `apps/chatgpt-app` via `apps/*` glob
- [ ] Add environment variables to `.env.example`:
  - `OPENAI_API_KEY`
  - `DATABASE_URL`
  - `INNER_AVATAR_WEB_URL`
  - `INNER_AVATAR_API_URL`
  - `AUTH_SECRET`
  - `CHATGPT_APP_CLIENT_ID`
  - `CHATGPT_APP_CLIENT_SECRET`
  - `CHATGPT_APP_PORT=3002`

### 1.3 Set Up Basic MCP Server Entrypoint
- [ ] Create `src/server.ts` as Express server
- [ ] Add basic health check endpoint `/health`
- [ ] Add MCP tools registration endpoint `/mcp/tools`
- [ ] Add widget resource serving from `/widget/*`
- [ ] Configure CORS for ChatGPT domains
- [ ] Add basic error handling and logging

## Phase 2: MCP Tools Implementation

### 2.1 Implement Core Tool Handlers
- [ ] Create `src/tools/create-journal-entry.ts`
  - Input schema: `{ text: string, source: "chatgpt", save: boolean }`
  - Output schema: `{ entryId: string, saved: boolean }`
  - Use `@inner-avatar/db` to create journal entry
  - Handle anonymous vs authenticated logic
- [ ] Create `src/tools/analyze-journal-entry.ts`
  - Input schema: `{ entryId?: string, text?: string }`
  - Output schema: `{ safetyStatus: "clear"|"needs_grounding"|"crisis", emotionalSignals: string[], languagePatterns: string[], behavioralPatterns: string[], contradictions: string[], suggestedLevel: number, summary: string }`
  - Reuse `@inner-avatar/ai/classifyJournalSafety` and `analyzeEntry`
- [ ] Create `src/tools/generate-avatar-reflection.ts`
  - Input schema: `{ entryId?: string, text?: string, tone?: "gentle"|"balanced"|"direct" }`
  - Output schema: `{ openingLine?: string, mirror?: string, patternName?: string, contradiction?: string, socraticQuestion?: string, integrationStep?: string, closingLine?: string }`
  - Reuse `@inner-avatar/ai/generateAvatarResponse`
- [ ] Create `src/tools/generate-personalized-prompt.ts`
  - Input schema: `{ entryId?: string, text?: string, level?: number, targetPattern?: string }`
  - Output schema: `{ title: string, context: string, materialsAndPreparation: string, execution: string, integration: string }`
  - Reuse `@inner-avatar/ai/generateSymbolicPrompt`
- [ ] Create `src/tools/get-recent-patterns.ts`
  - Input schema: `{ limit?: number }`
  - Output schema: `{ patterns: Array<{ label: string, evidenceCount: number, lastSeenAt: string, summary: string }> }`
  - Require authentication; query PatternMemory from `@inner-avatar/db`
- [ ] Create `src/tools/save-reflection-session.ts`
  - Input schema: `{ entryText: string, analysis: object, avatarResponse: object, generatedPrompt: object }`
  - Output schema: `{ sessionId: string, saved: boolean }`
  - Require authentication; save to multiple DB tables

### 2.2 Add Middleware and Validation
- [ ] Create `src/middleware/auth.ts`
  - Support token-based auth for MCP calls
  - Fallback to anonymous mode for demo
  - Integrate with `@inner-avatar/auth`
- [ ] Create `src/middleware/rate-limit.ts`
  - Rate limit tool calls per user/IP
  - Use `express-rate-limit`
- [ ] Create `src/middleware/safety.ts`
  - Run safety classifier before every reflection tool
  - Override outputs for crisis/grounding states
- [ ] Add Zod validation for all tool inputs/outputs
- [ ] Add safe logging that omits sensitive journal content

### 2.3 Register Tools with MCP Server
- [ ] Update `src/server.ts` to register all 6 tools
- [ ] Add tool metadata without exposing sensitive data
- [ ] Test MCP endpoint returns valid tool definitions

## Phase 3: Widget Implementation

### 3.1 Create Widget Components
- [ ] Create `src/widget/index.html` as entry point
- [ ] Create `src/widget/styles.css` with requested palette:
  - Lavender, cream, gold, muted plum
  - Calm, spacious layout
  - Oval avatar stage icon
- [ ] Create `src/widget/journal-input.js` - Text input component
- [ ] Create `src/widget/avatar-reflection.js` - Display reflection card
- [ ] Create `src/widget/personalized-prompt.js` - Display prompt card
- [ ] Create `src/widget/save-button.js` - Save/continue actions
- [ ] Create `src/widget/link-to-app.js` - Link to full web app

### 3.2 Integrate Widget with MCP Tools
- [ ] Add JavaScript to call MCP tools from widget
- [ ] Handle auth flow for saving
- [ ] Display tool results in widget UI
- [ ] Add loading states and error handling

### 3.3 Serve Widget Resources
- [ ] Update `src/server.ts` to serve static widget files
- [ ] Add widget resource endpoints to MCP server
- [ ] Test widget loads correctly in browser

## Phase 4: Authentication and Security

### 4.1 Implement Auth Flow
- [ ] Create OAuth flow for connecting SaaS accounts
- [ ] Add token exchange endpoint `/auth/exchange`
- [ ] Store ChatGPT-specific session tokens
- [ ] Integrate with existing `@inner-avatar/auth` patterns

### 4.2 Enforce Access Controls
- [ ] Require auth for `save_reflection_session` and `get_recent_patterns`
- [ ] Allow anonymous for single reflection (no save)
- [ ] Add server-side auth validation to all tools
- [ ] Prevent data leakage in tool metadata/logs

### 4.3 Safety Enforcement
- [ ] Integrate safety classifier into all reflection tools
- [ ] Override outputs for crisis/grounding states
- [ ] Save SafetyEvent for authenticated crisis cases
- [ ] Test safety fallbacks with mock inputs

## Phase 5: Testing and Validation

### 5.1 Unit Tests
- [ ] Test each tool handler with valid/invalid inputs
- [ ] Test Zod schemas for all inputs/outputs
- [ ] Test auth middleware for anonymous/authenticated flows
- [ ] Test safety overrides for crisis/grounding

### 5.2 Integration Tests
- [ ] Test full MCP server startup
- [ ] Test tool calls via MCP protocol
- [ ] Test widget rendering and interactions
- [ ] Test anonymous vs authenticated user flows

### 5.3 End-to-End Tests
- [ ] Test rate limiting behavior
- [ ] Test malformed input handling
- [ ] Test safety classifier integration
- [ ] Test widget resource loading

## Phase 6: Deployment and Submission

### 6.1 Deployment Setup
- [ ] Add Dockerfile for `apps/chatgpt-app`
- [ ] Configure separate deployment pipeline
- [ ] Set up environment variables in deployment
- [ ] Test deployed MCP endpoint accessibility

### 6.2 Security and CORS
- [ ] Configure CORS for ChatGPT domains
- [ ] Add security headers with Helmet
- [ ] Validate auth callback URLs
- [ ] Confirm no sensitive data exposure

### 6.3 OpenAI Submission Prep
- [ ] Prepare app metadata:
  - Name: "Inner Avatar"
  - Description: "Turn journaling into pattern recognition with AI-powered reflections"
  - Privacy policy URL
  - Terms URL
  - OAuth details
- [ ] Create test account and demo prompts
- [ ] Prepare screenshots/widget previews
- [ ] Document safety behavior and data handling

## Verification Checklist

- [ ] `yarn dev:chatgpt` starts server successfully
- [ ] MCP endpoint returns valid tool definitions
- [ ] All tools validate inputs and return correct schemas
- [ ] Anonymous users can run one unsaved reflection
- [ ] Authenticated users can save sessions and view patterns
- [ ] Safety classifier runs and overrides for crisis/grounding
- [ ] Widget renders correctly and links to web app
- [ ] No admin features exposed
- [ ] No sensitive journal content in logs/metadata
- [ ] App ready for OpenAI review

## Decisions Made

- **Architecture**: Minimal Node.js/Express server for MCP + widget serving (not Next.js to keep focused)
- **Auth**: Dedicated token exchange flow (safer than cookie reuse for MCP)
- **Widget**: Self-contained HTML/CSS/JS (reuse `@inner-avatar/ui` styles but not components for simplicity)
- **Safety**: Strict enforcement - crisis blocks reflections, grounding limits to prompts only
- **Anonymous Mode**: One unsaved reflection only, no persistence