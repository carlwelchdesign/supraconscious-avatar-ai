# Pilot Launch Hardening Phase Plan

## Summary
Prepare the Inner Council app for a controlled internal pilot with a small Maria-grounded content allowlist. This phase turns the existing pilot scaffolding into an operational launch candidate: seedable cohort setup, source readiness, end-to-end pilot smoke coverage, admin blocking checklist, pilot runbook, and tighter user/admin UX. It does not add vector search, broad manuscript retrieval, dynamic council roles, or external beta operations.

## Key Changes
- Add a deterministic pilot launch readiness report covering cohort status, enrollment, orientation, first-session completion, unresolved safety reviews, quality blockers, eval status, eligible source chunks, manuscript retrieval blockers, and feature flags.
- Add a single launch-readiness command and reuse the same report in `/admin/pilot`.
- Seed and review only a narrow internal pilot allowlist: product doctrine plus current-month curriculum. Manuscripts remain registered but unretrievable.
- Upgrade admin pilot operations from metric-only cards to a blocking checklist with links to source review, RAG readiness, council quality review, safety review, and cohort enrollment.
- Polish pilot UX copy for onboarding, journal step states, feedback saved states, source provenance, safety pause language, and dashboard return/continue prompts.
- Add pilot launch runbook documentation for setup, source approval, readiness, eval checks, monitoring, rollback, and support limits.
- Gate the ChatGPT app as legacy analysis-only during the internal pilot unless parity is explicitly prioritized.

## Public Interfaces And Types
- Add `runPilotLaunchReadiness()` returning `{ passed, checkedAt, blockers, warnings, metrics, latestEvalMetadata, sourceReadiness }`.
- Blockers include stable machine-readable codes and human-readable messages.
- Add a package command for pilot launch readiness checks.
- Reuse existing data models; no new persisted readiness model is required.

## Test Plan
- Readiness fails with no active cohort, no pilot users, incomplete orientation, unresolved safety reviews, pilot-blocker quality reviews, failed evals, missing allowlist content, or manuscript retrieval eligibility.
- Pilot events remain metadata-only and never store raw journal text.
- High-risk entries bypass council confrontation and RAG; medium-risk entries avoid sensitive chunks.
- Saved and live session provenance copy remains consistent.
- Admin dashboard shows cohort funnel, feedback mix, source-mode rates, safety queue, quality queue, and readiness blockers.
- Release checks: Prisma validate/generate, AI tests, RAG eval runner, pilot eval runner, launch readiness report, web/admin typecheck and lint, web/admin/ChatGPT builds.

## Assumptions
- Pilot audience is a small internal cohort with manual admin oversight.
- Product doctrine and current-month curriculum are the only content eligible for this pilot.
- Vector DB, embeddings, broad manuscript RAG, external beta support, marketplace/community, and dynamic council roles remain out of scope.
- Full account deletion and billing/customer deletion hardening remain deferred.
- Zustand is introduced only if transient route-to-route UI state becomes awkward.
