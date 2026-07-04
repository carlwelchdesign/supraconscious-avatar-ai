# Guided Carl/Maria Calibration Session Plan

## Summary
Build the next phase around actually using the app with Carl and Maria, not adding more gates. The goal is a guided calibration mode that makes each real session produce useful evidence: what felt right, what felt unlike Maria's work, what source grounding failed, and which responses are good enough to become "golden examples." This keeps formal expansion gates intact but stops letting demo/smoke review debt block founder calibration.

## Key Changes
- Preserve unrelated dirty files: root `package.json`, `docs/setup-and-deployment.md`, root `scripts/`, and `sources/`.
- Add a founder calibration mode in the web app:
  - Show a lightweight calibration banner for non-demo users explaining that feedback notes are expected.
  - Add suggested calibration prompts for Carl/Maria: voice test, source-grounding test, embodiment test, no-source fallback test, too-intense boundary test.
  - Add quick note templates beside feedback: "voice mismatch," "source unsupported," "too generic," "too intense," "good enough," and "Maria would phrase it this way."
- Improve saved session calibration:
  - On saved journal entries, show prior feedback notes and whether the session has been marked ready, blocked, voice issue, source issue, or prompt issue.
  - Add a clear "Use as golden example" admin review path through existing `QualityReview`.
- Extend `/admin/calibration` from review to action:
  - Add grouped action queues: ready examples, voice fixes, source fixes, prompt fixes, embodiment fixes.
  - Show recommended next action for each group: edit prompt, review source chunk, mark source unsupported, keep as golden example, or retry with revised input.
  - Keep raw journal text hidden by default; use only notes, council output, source traces, and review reasons.
- Add a calibration fixture runner:
  - `runFounderCalibrationFixtures()` runs a small deterministic set of local fixtures through council validation without creating real journal rows.
  - Fixtures cover Maria voice, source grounding, no-source fallback, embodiment clarity, and intensity boundaries.
  - Add script `test:founder-calibration`.
- Update founder calibration report:
  - Add `goldenExamples`, `actionQueues`, `calibrationCoverage`, and `nextRecommendedAction`.
  - Keep demo/smoke sessions excluded by default and allow `FOUNDER_CALIBRATION_EMAILS` override.
  - Treat expansion readiness as separate from founder calibration readiness.

## Public Interfaces And Types
- Add `runFounderCalibrationFixtures()` returning `{ passed, cases, failedCases, recommendations }`.
- Extend `runFounderCalibrationReport()` to return `{ goldenExamples, actionQueues, calibrationCoverage, nextRecommendedAction }`.
- Reuse existing models: `CouncilSession`, `CouncilSessionFeedback`, `QualityReview`, `GenerationTrace`, `AuditLog`.
- No schema changes by default; store calibration status in `QualityReview.label` and `QualityReview.metadata`.

## Test Plan
- Founder calibration banner and prompt suggestions appear only for non-demo/founder calibration users.
- Live and saved feedback notes persist and do not appear in `PilotEvent.properties`.
- Saved entries show calibration review state without exposing raw admin-only data.
- Admin calibration queues group sessions by voice/source/prompt/embodiment/ready labels.
- "Use as golden example" writes `QualityReview` and `AuditLog` with no raw journal text.
- Founder calibration fixtures pass and remain separate from persisted smoke sessions.
- Existing safety/RAG behavior remains unchanged: high-risk bypass, medium-risk excludes sensitive chunks, manuscripts remain unretrievable.
- Release checks: Prisma validate/generate, AI tests, RAG evals, pilot evals, founder calibration fixtures, founder calibration report, web/admin/ChatGPT typechecks, targeted lint, web/admin/ChatGPT builds.

## Assumptions
- Carl and Maria are the only real users for this phase; demo/smoke sessions are operational noise.
- The fastest path is structured real-session calibration, not more pilot expansion automation.
- Product-doctrine RAG remains active and narrow.
- Manuscripts, vector DB, embeddings, public beta, invite-code self-service, ChatGPT parity, and dynamic council roles remain out of scope.
- Safety, privacy, and rights guardrails stay in place, but formal expansion gates do not block Carl/Maria calibration.
