# Internal Pilot Learning Loop Phase Plan

## Summary
Build the next phase around learning from the internal pilot now that product-doctrine RAG is active. The goal is to make source-grounded sessions reviewable, measurable, and improvable before expanding users, manuscripts, vector search, or public beta scope.

## Key Changes
- Preserve unrelated dirty files: root `package.json`, `docs/setup-and-deployment.md`, root `scripts/`, and `sources/`.
- Keep RAG product-doctrine-only; manuscripts, vector DB, embeddings, dynamic council roles, ChatGPT parity, and external beta remain out of scope.
- Add a privacy-safe `runPilotLearningReport()` with RAG/source-mode rates, feedback mix, validation warnings, review coverage, unresolved blockers, selected source titles, and a RAG learning queue.
- Add a package script for the learning report.
- Add a RAG learning queue to admin pilot operations using existing `QualityReview` review/disposition actions.
- Improve source-grounding inspection with source titles, chunk ids, match reasons, citation/evidence coverage, fallback reasons, and paraphrase-only excerpt suppression.
- Keep raw journal text hidden by default in admin views.
- Improve pilot feedback copy so users understand feedback is reviewed by the pilot team and does not promise automatic model retraining.
- Update the pilot runbook with daily learning cadence, review coverage targets, rollback triggers, unsupported-source handling, and criteria for inviting more internal users.

## Public Interfaces And Types
- Add `runPilotLearningReport()` returning `{ checkedAt, sourceModeMetrics, feedbackMetrics, reviewCoverage, ragLearningQueue, safetyQueue, sourceGroundingMetrics, blockers, recommendations }`.
- Add `packages/ai/scripts/run-pilot-learning-report.ts` and `report:pilot-learning`.
- Reuse `CouncilSession`, `GenerationTrace`, `CouncilSessionFeedback`, `QualityReview`, `SafetyEvent`, `PilotEvent`, and `FeatureFlag`.
- No schema changes in this phase.

## Test Plan
- Learning report contains no raw journal text.
- RAG/no-source/source-mode counts are computed correctly.
- Unsupported-source and negative feedback appear in the learning queue.
- Review coverage and pilot blockers are derived from `QualityReview`.
- Admin queue shows unreviewed RAG sessions and source issue reports.
- Reviewer actions require a reason, create audit logs, and update review/disposition state.
- RAG behavior remains: matching entries use `sourceMode=rag`, no-match entries use `no_eligible_source`, high-risk entries bypass RAG/council, medium-risk entries avoid sensitive chunks, citations stay limited to selected chunks.
- Release checks: Prisma validate/generate, AI tests, RAG evals, pilot evals, internal RAG smoke, launch readiness, pilot iteration report, learning report, web/admin/ChatGPT typechecks, targeted lint, web/admin/ChatGPT builds.

## Assumptions
- Priority is internal-only pilot learning.
- Current RAG activation remains product-doctrine-only.
- Existing escalated historical safety items may remain consciously carried, but new unresolved safety items block expansion.
- Durable state remains server/database-backed; Zustand is unnecessary unless a route-transition UX problem appears.
