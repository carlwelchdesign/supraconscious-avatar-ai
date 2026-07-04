# Conservative Internal Pilot Expansion Gate Plan

## Summary
Build the next phase as a controlled internal pilot expansion, not beta launch. Admins may invite the next 3-5 internal users only after source-review coverage, safety, feedback, RAG, and readiness gates pass. RAG remains product-doctrine-only, and manuscripts/vector search/public beta stay out of scope.

## Key Changes
- Preserve unrelated dirty files: root `package.json`, `docs/setup-and-deployment.md`, root `scripts/`, and `sources/`.
- Add `runPilotExpansionReadiness()` to combine launch readiness, learning report, review coverage, unresolved feedback, safety queue, RAG status, unsupported-source reports, and cohort metrics into a pass/fail gate.
- Add an admin-only expansion workflow on `/admin/pilot` requiring a target cohort, 3-5 existing registered emails, reason, and passing readiness before enrolling users.
- Keep one-off enrollment as setup-only, requiring a reason and audit log.
- Store only metadata in expansion audit logs: cohort id, emails, batch size, readiness summary, admin reason, and enrollment results.
- Update the runbook with expansion cadence, batch-size defaults, pre-invite checks, post-batch monitoring, and rollback/pause criteria.

## Public Interfaces And Types
- Add `runPilotExpansionReadiness()` returning `{ passed, checkedAt, recommendedBatchSize, blockers, warnings, metrics, learningSummary }`.
- Add `packages/ai/scripts/run-pilot-expansion-readiness.ts` and package script `report:pilot-expansion`.
- Reuse existing pilot, feedback, trace, safety, quality review, enrollment, and audit models. No schema changes.

## Test Plan
- Expansion readiness fails for launch blockers, review coverage below 80%, unreviewed unsupported-source/negative feedback, pilot blockers, new unresolved safety items, missing RAG activation, or no active cohort.
- Expansion readiness passes with clean launch readiness, coverage >= 80%, no blocking feedback, no pilot blockers, no new unresolved safety items, and RAG activation metadata present.
- Admin expansion action requires admin, passing gate, 3-5 emails, valid active cohort, existing users, and reason.
- Expansion action writes audit logs and enrollment metadata without raw journal text.
- Existing RAG behavior remains unchanged.
