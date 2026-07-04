# Founder/Maria Calibration Sprint Plan

## Summary
Build the next phase for fast hands-on calibration with only Carl and Maria as real users. Replace pilot expansion caution as the immediate priority with a tighter feedback loop: run real sessions, capture specific feedback, review source grounding, tune prompts/source chunks, and produce a clear go/no-go signal for inviting anyone else. This does not add vector search, manuscripts, public beta, or broad user expansion.

## Key Changes
- Preserve unrelated dirty files: root `package.json`, `docs/setup-and-deployment.md`, root `scripts/`, and `sources/`.
- Add `runFounderCalibrationReport()` to summarize Carl/Maria sessions, feedback notes, source-grounding verdicts, prompt/version issues, open blockers, ready sessions, and recommended fixes.
- Add a report script and package command: `report:founder-calibration`.
- Add optional feedback notes to live and saved journal feedback; notes are stored on `CouncilSessionFeedback.note`, while pilot events only record `hasNote`.
- Add admin calibration review for Carl/Maria sessions with quick labels for voice/source/readiness issues using `QualityReview` and audit logs.
- Keep formal expansion gates intact, but make founder calibration separate from expansion readiness and smoke-session noise.

## Public Interfaces And Types
- `runFounderCalibrationReport()` returns `{ checkedAt, users, sessionMetrics, feedbackThemes, sourceGroundingIssues, promptIssues, readySessions, blockers, recommendations }`.
- Reuse `CouncilSession`, `CouncilSessionFeedback`, `QualityReview`, `GenerationTrace`, `PilotEvent`, and `AuditLog`.
- No schema changes.

## Test Plan
- Feedback notes persist from live and saved journal surfaces.
- Founder calibration report excludes raw journal text and excludes demo/smoke users by default.
- Feedback and review metadata are grouped into calibration themes without raw journal text.
- Admin calibration review requires a reason and writes `QualityReview` plus `AuditLog`.
- Existing RAG and safety behavior remains unchanged.
