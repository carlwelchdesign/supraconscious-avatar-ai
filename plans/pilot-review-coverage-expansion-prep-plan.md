# Pilot Review Coverage And Expansion Prep Phase Plan

## Summary
Build the next phase around clearing the blocker created by the expansion gate: source-grounded and no-source sessions need fast, privacy-safe human review before inviting the next 3-5 internal users. This phase improves review throughput and evidence quality; it does not expand users automatically, broaden RAG, add vectors, enable manuscripts, or launch beta.

## Key Changes
- Preserve unrelated dirty files: root `package.json`, `docs/setup-and-deployment.md`, root `scripts/`, and `sources/`.
- Add `runPilotReviewCoverageReport()` to summarize review coverage, review backlog, priority order, negative/source feedback, pilot blockers, safety queue, and whether expansion is review-blocked.
- Add a review coverage report script and package command.
- Improve `/admin/pilot` review operations with prioritized queue items, direct focused council links, selected sources/chunks, validation warnings, feedback types, review disposition, and raw-text-hidden status.
- Improve `/admin/council` as a review workbench with filters, privacy-safe quick review, and selected-session batch review.
- Keep review coverage explicit: sessions count as reviewed only when an admin records a `QualityReview`.

## Public Interfaces And Types
- Add `runPilotReviewCoverageReport()` returning `{ checkedAt, coverage, prioritizedQueue, blockers, warnings, recommendations }`.
- Add `packages/ai/scripts/run-pilot-review-coverage-report.ts` and package script `report:pilot-review-coverage`.
- Reuse `CouncilSession`, `GenerationTrace`, `CouncilSessionFeedback`, `QualityReview`, `SafetyEvent`, and `AuditLog`.
- Add admin actions `reviewPilotSessionFromCouncilAction(formData)` and `batchReviewPilotSessionsAction(formData)`.
- No schema changes.

## Test Plan
- Review coverage report contains no raw journal text.
- Prioritized queue orders safety/validation/source feedback before routine unreviewed RAG/no-source sessions.
- Coverage math counts `rag` and `no_eligible_source` sessions and treats sessions with at least one `QualityReview` as reviewed.
- Single-session and batch review require admin reason and create audit logs.
- Expansion readiness messaging shows remaining review work needed to reach 80%.
- Existing RAG behavior remains unchanged.
