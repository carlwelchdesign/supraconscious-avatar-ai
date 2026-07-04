# Internal Pilot Iteration And Quality Loop Plan

## Summary
Build the next phase around learning from the now-running internal pilot before adding higher-risk scope. The goal is to improve session quality, reviewer workflow, user feedback capture, operational visibility, and pilot decision-making while keeping RAG off by default and keeping manuscripts unretrievable.

## Key Changes
- Preserve current branch hygiene:
  - Keep unrelated dirty files untouched: root `package.json`, `docs/setup-and-deployment.md`, root `scripts/`, and `sources/`.
  - Start from the committed pilot launch state: `db1343f Harden internal pilot launch readiness`.
- Improve pilot review workflow:
  - Expand `/admin/pilot` from launch readiness into a daily pilot operations view.
  - Show recent sessions, feedback needing review, unsupported-source reports, too-intense/not-accurate feedback, safety escalations, and quality-review status.
  - Add reviewer actions for pilot sessions: mark reviewed, label outcome, add reason, flag as pilot blocker, or clear blocker.
  - Keep raw journal text hidden by default; require explicit reveal reason and audit log.
- Strengthen feedback and quality loops:
  - Convert session feedback into an actionable queue, not just counts.
  - Add feedback-driven review states for sessions: `needs_review`, `reviewed`, `blocked`, `cleared`.
  - Track whether feedback was addressed by admin review.
  - Add a lightweight pilot quality scorecard: helpful rate, too-intense rate, unclear rate, unsupported-source rate, Gate save rate, first-session completion, safety bypass rate.
- Improve user pilot experience:
  - Add clearer post-session state on dashboard: feedback submitted, Gate saved, session under review if reported.
  - Add a simple “what changed?” pilot note when feedback is submitted, without promising model retraining.
  - Keep the Inner Council flow unchanged unless review findings indicate a specific issue.
- Add pilot decision artifacts:
  - Add an admin-readable pilot recap report generator with privacy-safe metrics only.
  - Include readiness status, cohort funnel, quality labels, feedback mix, safety review status, source mode rates, and open blockers.
  - Add runbook updates for daily review cadence and go/no-go criteria.
- Keep scope conservative:
  - Do not enable `rag_enabled` in this phase.
  - Do not add vector DB, embeddings, broad manuscript retrieval, dynamic council roles, external beta support, or ChatGPT parity.
  - Keep ChatGPT app legacy analysis-only unless a separate parity plan is approved.

## Public Interfaces And Types
- Add or reuse a pilot report contract:
  - `runPilotIterationReport()` returns `{ checkedAt, cohortMetrics, feedbackMetrics, qualityQueue, safetyQueue, sourceModeMetrics, blockers, recommendations }`.
- Add admin actions for quality review updates and feedback disposition.
- Reuse existing models where possible: `CouncilSessionFeedback`, `QualityReview`, `SafetyEvent`, `PilotEvent`, and `GenerationTrace`.
- Add schema only if feedback disposition cannot be represented cleanly with existing `QualityReview` metadata.

## Test Plan
- Admin pilot queue shows feedback needing review and does not expose raw journal text by default.
- Feedback actions create audit records and update review/disposition state.
- Quality blocker labels cause launch readiness to fail; clearing blockers restores readiness.
- Pilot report contains metadata only and no raw journal text.
- Dashboard accurately shows feedback submitted and Gate saved states.
- Existing safety tests continue to pass: high-risk entries bypass council/RAG, medium-risk avoids intense confrontation.
- Release checks: Prisma validate/generate, AI tests, pilot evals, launch readiness, web/admin/ChatGPT typechecks, targeted lint, web/admin/ChatGPT builds.

## Assumptions
- The immediate goal is to learn from the internal pilot, not to expand product surface.
- RAG remains off until pilot quality and review workflows are stable.
- Manuscripts and external manuscript PDFs remain blocked.
- Full privacy lifecycle hardening is still deferred, but this phase must not weaken existing privacy controls.
