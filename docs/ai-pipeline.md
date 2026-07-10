# AI Journaling Pipeline

## Main Route

The main pipeline runs in `POST /api/journal/analyze`.

The client submits text from `JournalWorkspace`. The route:

1. Requires an authenticated user.
2. Validates the request with `JournalAnalyzeRequestSchema`.
3. Creates a `JournalEntry`.
4. Runs safety classification.
5. Logs a `SafetyEvent` when needed.
6. If high-risk or reflective flow is blocked, stores a grounded response and grounding prompt.
7. Otherwise runs structured entry analysis.
8. Generates the guide response and symbolic prompt.
9. Stores `EntryAnalysis`, `AvatarResponse`, and `GeneratedPrompt` for compatibility.
10. Updates `PatternMemory`.
11. Checks level/stage progression.
12. Optionally records metadata-only LangSmith observability when enabled.
13. Returns all data to the journal UI.

## OpenAI Model Configuration

The main reflective model is configured in `packages/ai/src/openai.ts`:

```ts
export const reflectiveModel = process.env.OPENAI_MODEL ?? "gpt-5-mini"
```

If `OPENAI_MODEL` is not set, the app uses `gpt-5-mini`.

When `OPENAI_API_KEY` is missing or placeholder-like, several AI helpers return deterministic local fallback output so the app remains usable for local demos.

## LangSmith Observability

LangSmith integration is optional and disabled by default. It lives in `packages/ai/src/langsmith-observability.ts` and wraps the Inner Council service boundary in `runCouncilReflection()`.

When enabled, the app sends metadata-only traces:

- request id, user/session ids, input hash, input mode, and feature flags
- safety severity, flags, and classification latency
- analysis level, intensity, pattern count, and latency
- RAG source mode, selected source ids/titles, rank, score, matched terms/fields, and source policy version
- prompt key/version/source and model
- pilot validation status, failed rules, warnings, citation coverage, and evidence coverage

The sanitizer blocks raw journal text, raw feedback notes, source chunk text, display excerpts, prompt content, full council output, messages, synthesis, and observer payloads from leaving the application.

LangSmith linkage is stored under `GenerationTrace.outputJson.langsmith`; no schema columns are required. Internal `GenerationTrace` records remain the canonical trace source.

Environment:

```env
LANGSMITH_TRACING="false"
LANGSMITH_API_KEY=""
LANGSMITH_PROJECT="inner-avatar-dev"
LANGSMITH_ENDPOINT=""
LANGSMITH_SAMPLE_RATE="1"
LANGSMITH_METADATA_ONLY="true"
LANGCHAIN_API_KEY=""
LANGCHAIN_TRACING_V2="false"
LANGCHAIN_PROJECT="inner-avatar-dev"
```

Use `node .yarn/releases/yarn-4.cjs test:langsmith` to verify no-op behavior and sanitizer coverage without calling the external service.

## LangGraph Decision

LangGraph is not part of the current runtime. The Inner Council pipeline is still a typed service orchestration with explicit persistence, validation, audit, and review boundaries.

Revisit LangGraph when the product needs graph-native capabilities such as:

- resumable multi-step agent state across independent user/admin turns
- durable retries and branch-specific tool execution
- explicit human-in-the-loop graph nodes beyond the current admin review queues
- long-running autonomous workflows that should not live inside a single request/response path

## Safety Classifier

`classifyJournalSafety()` checks for:

- self-harm or suicide language
- harm to others
- abuse/coercion
- psychosis-like destabilization
- severe dissociation
- crisis language

Safety output includes:

- `severity`: `none`, `low`, `medium`, or `high`
- flags
- recommended action
- user-facing message
- `allowReflectiveFlow`

High severity blocks normal symbolic reflection and returns a grounded support response.

## Entry Analysis

`analyzeEntry()` returns structured data validated by Zod:

- emotional signals
- language markers
- behavioral patterns
- contradiction signals
- avoidance signals
- suggested level
- safety flags
- summary

This structured output is persisted in `EntryAnalysis` and used by downstream generation.

## Guide Response

`generateAvatarResponse()` is the compatibility generator for short guide reflection fields:

- opening line
- mirror
- pattern name
- contradiction
- Socratic question
- integration step
- closing line

The system prompt explicitly avoids therapy claims, diagnosis, certainty, and destabilizing language.

## Generated Prompt

`generateSymbolicPrompt()` creates a grounded journaling prompt with:

- title
- context
- materials/preparation
- execution
- integration
- level
- target pattern

For medium/high safety states, prompts stay at Level 1 and are grounding-oriented.

## Pattern Memory

`updatePatternMemory()` records up to three behavioral patterns from an analysis when confidence is at least `0.55`.

Existing active patterns increment `evidenceCount`, update confidence, update `lastSeenAt`, and merge evidence examples. New patterns create `PatternMemory` rows.

## Progression

`checkAndAdvanceProgression()` updates two independent concepts:

- `currentLevel`: sliding-window reflection depth. Three of the last five analyses must exceed the current level to advance one step.
- `avatarStage`: cumulative milestone progression. Thresholds are `[5, 12, 22, 35]` qualifying analyses for stages 2 through 5.

The UI shows level/stage changes after a journal reflection.

## Safety Positioning

The app is reflective journaling, not therapy. Do not add copy or model instructions that claim diagnosis, treatment, clinical insight, or certainty about the user.
