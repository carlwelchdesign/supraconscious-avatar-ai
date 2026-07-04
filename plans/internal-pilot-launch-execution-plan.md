# Internal Pilot Launch Execution Plan

## Summary
Move from pilot-ready code to a usable internal pilot environment. This phase focuses on applying migrations, cleaning branch state, seeding the pilot cohort, approving a small content allowlist, and running the launch readiness gate until it passes. It does not add new AI behavior, vector search, broad manuscript retrieval, or external beta support.

## Key Changes
- Stabilize the current work:
  - Preserve unrelated dirty files: root `package.json`, `docs/setup-and-deployment.md`, root `scripts/`, and `sources/`.
  - Review and stage only intentional pilot-launch files.
  - Create a clean commit or branch containing the pilot launch hardening work before adding more scope.
- Apply and verify database readiness:
  - Run the latest Prisma migration against the intended local/dev database.
  - Confirm pilot tables and fields exist: `PilotCohort`, `PilotEnrollment`, `PilotEvent`, `ConsentEvent`, `QualityReview`, `CouncilSessionFeedback`, and `SafetyEvent.reviewStatus`.
  - Rerun the launch readiness command and confirm the blocker changes from `database_schema_not_ready` to real operational blockers.
- Seed the internal pilot:
  - Use the pilot seed command with explicit internal pilot emails.
  - Confirm the cohort appears in `/admin/pilot`.
  - Confirm enrolled users are gated by onboarding until consent is complete.
- Activate a narrow content allowlist:
  - Import/register sources if needed.
  - Approve product doctrine chunks and current-month curriculum only.
  - Keep manuscripts registered but unretrievable.
  - Verify source rights support paraphrase generation.
  - Keep `rag_enabled=false` unless the dedicated RAG activation gate passes.
- Run launch checks and smoke test:
  - Run Prisma validate/generate, AI tests, RAG evals, pilot evals, launch readiness, web/admin/ChatGPT typechecks, and builds.
  - Complete one manual pilot smoke: onboarding consent, journal submission, council result, feedback, Embodiment Gate save, dashboard status, and admin metric update.
  - Confirm admin views do not expose raw journal text by default.

## Public Interfaces And Types
- Use the existing `runPilotLaunchReadiness()` report as the launch gate.
- Use the existing pilot seed command for controlled cohort setup.
- No new major data models are planned in this phase.
- Any additional admin actions should reuse existing audit logging and reviewer-reason patterns.

## Test Plan
- Launch readiness fails before migrations and passes schema preflight after migrations.
- Readiness blocks launch until cohort, enrolled users, consent, source allowlist, and evals are ready.
- High-risk entries bypass council and RAG.
- Medium-risk entries avoid sensitive chunks.
- Pilot events contain no raw journal text.
- Admin `/pilot` renders both not-migrated and migrated states safely.
- Web/admin/ChatGPT builds remain passing.

## Assumptions
- This is still an internal pilot, not an external beta.
- No vector DB, embeddings, broad manuscript RAG, dynamic council roles, or marketplace/community features are included.
- Full privacy lifecycle hardening remains deferred.
- The next product expansion should wait until the internal pilot runs cleanly end to end.
