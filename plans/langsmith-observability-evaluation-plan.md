# LangSmith Observability And Evaluation Plan

## Summary
Add LangSmith as an optional, privacy-safe observability and evaluation layer around the existing Inner Council AI pipeline. The product database remains the source of truth through `GenerationTrace`, `CouncilSession`, RAG traces, pilot events, and admin reviews. LangSmith is used for external run visibility, latency/debug metadata, regression datasets, and future evaluation reports. Do not add LangGraph in this phase.

Default data policy: **metadata only**. No raw journal text, raw feedback notes, raw source chunk text, or full council outputs are sent to LangSmith.

## Key Changes
- Add `langsmith` to `packages/ai` and add opt-in environment flags for tracing, project, endpoint, sample rate, and metadata-only mode.
- Add an AI observability module in `packages/ai` that no-ops when disabled, sanitizes payloads, wraps runs with non-blocking LangSmith calls, and never lets LangSmith failures break a user reflection.
- Instrument `runCouncilReflection()` at the existing service boundary for safety, analysis, retrieval, prompt resolution, council generation, validation, trace persistence, and memory-update decision.
- Store LangSmith linkage inside existing `GenerationTrace.outputJson.langsmith`, not new columns.
- Add a LangSmith observability check script and package/root scripts.
- Show LangSmith trace metadata on the existing admin Council Review trace list when present.

## Public Interfaces And Types
- Add exported helpers from `@inner-avatar/ai`:
  - `isLangSmithEnabled()`
  - `sanitizeLangSmithMetadata(input)`
  - `withLangSmithRun(name, metadata, fn)`
  - `runLangSmithObservabilityCheck()`
- Add internal types:
  - `LangSmithTraceContext`
  - `LangSmithRunMetadata`
  - `SanitizedLangSmithPayload`
  - `LangSmithTraceLink`
- No database migration, user-facing route changes, RAG behavior changes, prompt changes, source approval changes, founder calibration changes, mobile changes, or auth changes.

## Test Plan
- Unit tests cover disabled no-op behavior, missing API key behavior, sanitizer redaction, safe metadata preservation, and mocked trace metadata.
- Integration checks confirm council reflection still succeeds when LangSmith is disabled or fails.
- Existing safety/RAG tests continue to verify high-risk bypass, approved-source policy, and rights-aware retrieval.
- Release checks:
  - `node .yarn/releases/yarn-4.cjs test:ai`
  - `node .yarn/releases/yarn-4.cjs test:rag`
  - `node .yarn/releases/yarn-4.cjs test:pilot`
  - `node .yarn/releases/yarn-4.cjs test:founder-calibration-regression`
  - `node .yarn/releases/yarn-4.cjs typecheck`
  - `node .yarn/releases/yarn-4.cjs lint`
  - `node .yarn/releases/yarn-4.cjs build:web`
  - `node .yarn/releases/yarn-4.cjs build:admin`
  - `node .yarn/releases/yarn-4.cjs build:chatgpt`

## Assumptions
- LangSmith is valuable now for observability and regression evidence; LangGraph is deferred until orchestration needs true graph state, retries, branching, or human-in-the-loop execution beyond the current service flow.
- Metadata-only tracing is the required default.
- Production tracing remains off until a LangSmith API key, project, and privacy review are configured.
- Existing `GenerationTrace` remains the canonical internal trace record.
- LangSmith must be optional infrastructure, not a runtime dependency for successful reflections.
