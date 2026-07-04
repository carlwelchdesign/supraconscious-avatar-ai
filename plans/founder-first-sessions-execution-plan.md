# Founder First Sessions Execution Plan

## Summary
Move from “first-session launch tooling exists” to actual Carl/Maria calibration evidence. This phase is operational and code-light: configure founder participants, verify account/onboarding readiness, run one guided session per founder, collect feedback notes, review the sessions, and mark the first usable golden example or issue. Do not add new AI behavior, prompt changes, schema, RAG scope, vectors, manuscripts, or broader users.

## Key Changes
- Preserve unrelated dirty files: root `package.json`, `docs/setup-and-deployment.md`, root `scripts/`, and `sources/`.
- Configure founder participants:
  - Use `FOUNDER_CALIBRATION_CARL_EMAIL` and `FOUNDER_CALIBRATION_MARIA_EMAIL`; optionally use `FOUNDER_CALIBRATION_SETUP_ACTOR_EMAIL` for audit attribution.
  - Run the existing founder setup command.
  - If either founder email is missing, stop and ask for the missing email values; do not hardcode them into repo files.
- Verify `/admin/calibration/setup`:
  - Confirm Carl and Maria appear as active founder participants.
  - Confirm linked account state, onboarding state, consent records, next action, and scenario checklist.
  - Use normal register/login/onboarding only; no impersonation, no password creation, no session creation.
- Run first real sessions:
  - Carl and Maria each run one guided scenario from `/journal`, starting with the suggested first scenario.
  - Each session must include a feedback type and a short feedback note.
  - Keep product-doctrine RAG narrow; no manuscript retrieval or source expansion.
- Review and label evidence:
  - Use `/admin/calibration/live` to review each session without raw journal text by default.
  - Mark each session as `ready`, `voice_wrong`, `source_unsupported`, `too_generic`, `too_intense`, `embodiment_weak`, or `prompt_regression`.
  - Mark at least one strong session as a golden example if one exists; otherwise record the specific issue blocking readiness.
- Update runbook only if the execution reveals a real missing operational step.

## Public Interfaces And Types
- Reuse existing interfaces:
  - `setupFounderCalibrationParticipants(input)`
  - `runFounderCalibrationSetupReport()`
  - `runFounderCalibrationReport()`
  - `runFounderCalibrationComparison()`
- No new models, migrations, route APIs, prompt templates, or feature flags.
- No Zustand or new client state.

## Test Plan
- Before session execution:
  - Founder setup report shows Carl and Maria configured or gives exact missing actions.
  - Active participants see founder calibration prompts in `/journal`.
  - Demo and paused users remain excluded.
- After first sessions:
  - Setup report shows session count and scenario completion for each founder.
  - Founder calibration report includes feedback notes as metadata only, not raw journal text.
  - Comparison report shows scenario coverage, prompt version, unresolved issues, and any golden examples.
  - Admin review creates `QualityReview` and `AuditLog` with required reason.
- Regression checks:
  - Prisma validate/generate.
  - AI tests, RAG evals, pilot evals.
  - Founder fixtures, regression, setup report, calibration report, and comparison report.
  - Web/admin/ChatGPT typechecks.
  - Web/admin builds and ChatGPT app tests/build.

## Assumptions
- The next phase is about real founder usage, not additional product polish.
- Carl and Maria are the only real calibration users.
- Founder emails come from environment/input, not committed repo files.
- Prompt/source tuning waits until at least one reviewed real session exists.
- Formal pilot expansion gates remain separate and do not block Carl/Maria calibration.
