# Founder First-Session Launch Phase Plan

## Summary
Build the next phase around moving from “setup exists” to “Carl and Maria can run first calibration sessions today.” The current setup report is clean but blocked because no founder participants are configured. This phase adds a lightweight launch workflow: seed/configure Carl and Maria, verify account/onboarding readiness, provide direct first-session entry points, and capture the first real session evidence without impersonation or broader pilot expansion.

## Key Changes
- Add a founder launch setup command:
  - Add `packages/ai/scripts/setup-founder-calibration.ts` and package script `setup:founder-calibration`.
  - Inputs come from env: `FOUNDER_CALIBRATION_CARL_EMAIL`, `FOUNDER_CALIBRATION_MARIA_EMAIL`, optional `FOUNDER_CALIBRATION_REVIEWER_EMAILS`, and `FOUNDER_CALIBRATION_SETUP_ACTOR_EMAIL`.
  - Upsert founder participants, link existing users by email, keep missing accounts as “needs registration,” and write audit logs when an actor is available.
  - Do not create passwords, create sessions, impersonate users, or bypass onboarding.
- Add an admin first-session launch panel:
  - Extend `/admin/calibration/setup` with a “First Session Launch” section.
  - For each participant, show direct next action: register, complete onboarding, open journal, run a scenario, leave feedback note, review session, or mark golden.
  - Include copyable participant-safe links to `/register`, `/login`, `/onboarding`, and `/journal`; no admin impersonation.
  - Add scenario checklist status per founder: voice, source grounding, embodiment, no-source fallback, intensity boundary.
- Add first-session readiness report updates:
  - Extend `runFounderCalibrationSetupReport()` with `nextAction`, `nextActionHref`, and per-scenario completion for each participant.
  - Reuse the setup report command unless separate launch output becomes necessary.
  - Keep reports metadata-only: no raw journal text and no raw feedback note content.
- Improve founder user flow lightly:
  - On `/journal`, if founder calibration mode is active and no founder scenario has been completed yet, highlight the suggested first scenario.
  - Keep the current guided prompt buttons; do not introduce multi-route Zustand state unless the flow becomes awkward.
  - After feedback submission, make the confirmation copy explicit: “This note is for Carl/Maria calibration review and does not retrain the guide automatically.”
- Update runbook:
  - Add exact launch steps: configure env, run setup command, verify `/admin/calibration/setup`, have each founder register/login, complete onboarding, run one guided scenario, leave feedback note, review in `/admin/calibration/live`, mark ready or issue.
  - Keep prompt/source changes manual.

## Public Interfaces And Types
- Add `setupFounderCalibrationParticipants(input)` returning `{ created, updated, linked, missingAccounts, auditLogged }`.
- Extend participant readiness output with:
  - `nextAction: string`
  - `nextActionHref: string | null`
  - `scenarioStatus: Array<{ scenario, completed, sessionCount, hasReadyExample }>`
- Add package script `setup:founder-calibration`.
- Reuse existing models: `FounderCalibrationParticipant`, `User`, `CouncilSession`, `GenerationTrace`, `QualityReview`, and `AuditLog`.
- No new schema migration by default.

## Test Plan
- Setup command tests:
  - Upserts Carl/Maria participants from env input.
  - Links existing users by lowercased email.
  - Missing accounts remain participants with `userId=null`.
  - No passwords, sessions, or onboarding bypasses are created.
  - Audit logs include actor/reason when actor email resolves.
- Report/admin tests:
  - Setup report includes next action and scenario status without raw text or raw notes.
  - `/admin/calibration/setup` shows register/onboard/journal/review/mark-golden actions correctly.
  - Paused participants are excluded from launch readiness and journal calibration mode.
  - Demo users remain excluded.
- Founder flow tests:
  - Active founder sees guided calibration prompts.
  - First suggested scenario appears when no scenario has been completed.
  - Feedback confirmation copy appears after live and saved feedback.
  - Existing scenario capture, feedback notes, review labels, and golden-example flow still work.
- Regression checks:
  - Prisma validate/generate.
  - AI tests, RAG evals, pilot evals.
  - Founder fixtures, regression, comparison, setup report, and launch/setup command checks.
  - Web/admin/ChatGPT typechecks.
  - Targeted lint.
  - Web/admin builds and ChatGPT app tests/build.

## Assumptions
- The immediate goal is to get Carl and Maria through their first real sessions, not to tune prompts prematurely.
- Admins will not impersonate founders or create their passwords.
- Founder setup can be driven by env variables plus admin UI; no email sending/invite-code system is added in this phase.
- Product-doctrine RAG remains narrow. Manuscripts, vector DB, public beta, invite expansion, ChatGPT parity, dynamic council roles, and automatic prompt/source changes remain out of scope.
