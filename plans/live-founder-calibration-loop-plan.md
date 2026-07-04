# Live Founder Calibration Loop Phase Plan

## Summary
Build the next phase around making Carl and Maria's real calibration sessions easier to run, compare, and convert into actionable tuning evidence. This phase does not broaden RAG, invite more users, add vectors, enable manuscripts, or automate prompt changes. It strengthens the human loop: choose a calibration scenario, run a session, capture structured feedback, compare against prior golden examples, and decide whether the output is ready, needs prompt tuning, needs source repair, or needs embodiment refinement.

## Key Changes
- Add a live calibration cockpit:
  - Add `/admin/calibration/live` or a focused section on `/admin/calibration`.
  - Show Carl/Maria-only recent sessions, guided scenario type, feedback note status, source mode, prompt version, latest review label, and next action.
  - Keep raw journal text hidden by default; use council output, notes, source traces, prompt version, and review reasons.

- Make calibration sessions easier to classify:
  - Add scenario tags for the existing guided prompts: `voice_test`, `source_grounding_test`, `embodiment_test`, `no_source_fallback_test`, `intensity_boundary_test`.
  - Persist the selected scenario as privacy-safe metadata on `PilotEvent.properties` and/or `GenerationTrace.outputJson.calibration`, not raw journal text.
  - Include scenario tags in founder calibration reports and action queues.

- Improve comparison against golden examples:
  - Add `runFounderCalibrationComparison()` that groups sessions by scenario and compares latest reviewed sessions against ready/golden examples.
  - Report output should include `{ checkedAt, scenarioCoverage, promptVersions, goldenExamples, unresolvedIssues, nextActions }`.
  - No model scoring or automatic quality claims; comparison is evidence organization for human review.

- Tighten admin review actions:
  - Add quick review actions for `ready`, `voice_wrong`, `source_unsupported`, `too_generic`, `too_intense`, `embodiment_weak`, and `prompt_regression`.
  - Require reviewer reason and write audit logs.
  - Add optional related prompt version and related golden example id fields in review metadata.

- Keep prompt/source changes manual:
  - Do not auto-edit `council.system`.
  - Do not auto-approve source chunks.
  - Link prompt/voice issues to `/admin/prompts` and source issues to `/admin/sources`, but leave the decision with the admin.

## Public Interfaces And Types
- Add `FounderCalibrationScenario` union:
  - `voice_test`
  - `source_grounding_test`
  - `embodiment_test`
  - `no_source_fallback_test`
  - `intensity_boundary_test`
  - `freeform`
- Add optional `calibrationScenario` to journal/council submission metadata.
- Add `runFounderCalibrationComparison()` returning `{ checkedAt, scenarioCoverage, promptVersions, goldenExamples, unresolvedIssues, nextActions }`.
- Add script `packages/ai/scripts/run-founder-calibration-comparison.ts` and package command `report:founder-calibration-comparison`.
- Reuse existing models: `CouncilSession`, `CouncilSessionFeedback`, `QualityReview`, `GenerationTrace`, `PilotEvent`, `PromptTemplate`, and `AuditLog`.

## Test Plan
- Scenario capture:
  - Guided calibration prompts submit a scenario tag.
  - Scenario metadata contains no raw journal text.
  - Freeform sessions default to `freeform`.

- Reports and comparison:
  - Comparison report groups sessions by scenario.
  - Golden examples are included by id, prompt version, scenario, and review label only.
  - Raw journal text and raw feedback notes are not included in machine-readable reports unless already explicitly allowed elsewhere.

- Admin workflow:
  - Live calibration cockpit shows recent Carl/Maria sessions and next actions.
  - Review actions require reason and create `QualityReview` plus `AuditLog`.
  - Prompt/voice issues link to `/admin/prompts`; source issues link to `/admin/sources`.

- Regression:
  - Existing safety/RAG behavior remains unchanged.
  - Founder calibration fixtures and regression still pass.
  - Prompt version remains present on council traces.
  - Release checks: Prisma validate/generate, AI tests, RAG evals, pilot evals, founder calibration fixtures, founder calibration regression, founder calibration comparison, founder calibration report, web/admin/ChatGPT typechecks, targeted lint, web/admin builds, ChatGPT app build/tests.

## Assumptions
- Carl and Maria remain the only real calibration users.
- The goal is faster human calibration, not broader pilot expansion.
- Prompt and source changes remain manual and reviewed.
- Existing `PromptTemplate`, `QualityReview`, `GenerationTrace`, and `AuditLog` are sufficient; no schema migration by default.
- RAG remains product-doctrine-only; manuscripts, vector DB, embeddings, public beta, ChatGPT parity, and dynamic council roles remain out of scope.
