# Founder Calibration Prompt Tuning Phase Plan

## Summary
Build the next phase around turning Carl/Maria calibration evidence into controlled improvements. The priority is not more gates or broader RAG; it is a tight loop: run real sessions, mark golden examples or issues, revise the council prompt through versioned admin templates, and run regression checks so prompt changes do not break safety, source grounding, or Maria-inspired voice boundaries.

## Key Changes
- Add a real council prompt tuning path:
  - Use existing `PromptTemplate` and `AuditLog`; no schema migration by default.
  - Add active template keys for council generation, starting with `council.system`.
  - Keep the current hardcoded council prompt as the fallback default when no active template exists.
  - Persist the active prompt key/version into `GenerationTrace.promptVersion` for council runs.

- Wire prompt templates into council generation:
  - Add a small prompt-resolution service in `packages/ai` that reads the active `PromptTemplate`, validates minimum safety/identity guardrails, and returns `{ key, version, content, source }`.
  - `runCouncilReflection()` resolves the prompt before council generation and passes it into `generateCouncilRun()`.
  - `generateCouncilRun()` uses the resolved prompt content plus existing role/source/safety context; it must still enforce shape, citations, safety, and "not Maria / not therapy / not channeling" constraints.

- Upgrade admin calibration into tuning workflow:
  - On `/admin/calibration`, group sessions into `ready`, `voice`, `source`, `prompt`, and `embodiment` queues as today, but add links/actions to the prompt-template editor when the next action is prompt or voice tuning.
  - On `/admin/prompts`, show the latest calibration themes and golden examples relevant to `council.system`.
  - Require admin reason for prompt updates; audit metadata must include prompt key, old version, new version, and related calibration session ids if provided.

- Add golden-example regression checks:
  - Extend founder calibration fixtures into `runFounderCalibrationRegression()`.
  - Regression input includes static fixtures plus golden examples from `QualityReview.label = ready`.
  - The runner validates one Integrator question, no prohibited claims, concise council voices, safe medium/high handling, no unsupported citations, and no missing prompt version.
  - Add package script `test:founder-calibration-regression`.

- Keep scope conservative:
  - Do not add vector DB, embeddings, manuscript retrieval, public beta, dynamic council roles, or ChatGPT parity.
  - Do not auto-apply prompt changes from feedback.
  - Do not expose raw journal text in admin calibration summaries by default.
  - Product-doctrine RAG remains narrow and active only through the existing gate.

## Public Interfaces And Types
- Add `resolveCouncilPromptTemplate(input)` returning `{ key, version, content, source: "db" | "fallback" }`.
- Extend `generateCouncilRun()` options with `promptTemplate?: { key: string; version: number; content: string }`.
- Add `runFounderCalibrationRegression()` returning `{ passed, cases, failedCases, promptVersion, goldenExampleCount, recommendations }`.
- Add script `packages/ai/scripts/run-founder-calibration-regression.ts` and package command `test:founder-calibration-regression`.
- Reuse existing models: `PromptTemplate`, `QualityReview`, `GenerationTrace`, `AuditLog`, `CouncilSession`, and `CouncilSessionFeedback`.

## Test Plan
- Prompt resolution:
  - Falls back to the default council prompt when no active template exists.
  - Uses active `PromptTemplate` when present.
  - Rejects or blocks templates missing required guardrails: not Maria, not therapy, no channeling, exactly one Integrator question, concise council roles.
  - Writes prompt key/version into council `GenerationTrace`.

- Calibration regression:
  - Static fixtures pass.
  - Golden examples are included without exposing raw journal text in reports.
  - Prompt changes cannot pass if they introduce "Maria says," channeling, diagnosis, certainty, unsupported citations, multiple Integrator questions, or too-intense medium-safety language.

- Admin workflow:
  - Prompt updates require admin and reason.
  - Audit logs include prompt key/version and related calibration session ids.
  - `/admin/calibration` links prompt/voice issue queues to prompt tuning.
  - `/admin/prompts` shows calibration themes and golden examples without raw journal text.

- Release checks:
  - Prisma validate/generate.
  - AI tests, RAG evals, pilot evals, founder calibration fixtures, founder calibration regression, founder calibration report.
  - Web/admin/ChatGPT typechecks.
  - Targeted lint.
  - Web/admin builds and ChatGPT app build/tests.

## Assumptions
- Default emphasis is prompt tuning, because the last phase created guided founder calibration but not the mechanism to safely improve prompts from that evidence.
- Carl and Maria remain the only real calibration users.
- Existing `PromptTemplate` is enough for this phase; prompt version history is represented by version increments plus audit logs.
- Golden examples are review labels, not training data.
- Formal expansion readiness remains separate from founder calibration readiness.
