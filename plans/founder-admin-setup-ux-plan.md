# Founder Admin Setup UX Phase Plan

## Summary
Remove the current founder setup blocker by making Carl/Maria configuration fully admin-driven instead of env-dependent. The app already has generic participant setup, but the next phase should make the intended path obvious: enter Carl and Maria emails once, create/update the founder participant records, link existing accounts if present, show exact next actions, and keep first-session execution separate from any impersonation or account creation.

## Key Changes
- Preserve unrelated dirty files: root `package.json`, `docs/setup-and-deployment.md`, root `scripts/`, and `sources/`.
- Preserve and intentionally stage the already saved `/plans/founder-first-sessions-execution-plan.md` if committing this phase.
- Add a dedicated “Carl/Maria Setup” panel on `/admin/calibration/setup`:
  - Inputs: Carl email, Maria email, optional reviewer emails, required admin reason.
  - Action uses the signed-in admin as the audit actor and calls `setupFounderCalibrationParticipants()`.
  - Missing accounts remain `userId=null`; do not create users, passwords, sessions, onboarding records, or consent records.
- Tighten setup readiness:
  - `runFounderCalibrationSetupReport()` should explicitly require one active `carl` participant and one active `maria` participant.
  - Report should include role-level status for Carl and Maria: configured, linked account, onboarding complete, consent present, session present, feedback note present, ready/golden review present.
  - If only one founder is configured, readiness remains blocked with the exact missing role.
- Improve admin guidance:
  - Show a top “Next Step” summary with role-specific actions: add participant, have founder register, sync account, complete onboarding, run journal scenario, leave note, review, mark golden.
  - Keep safe links to `/register`, `/login`, `/onboarding`, `/journal`, and `/calibration/live`; no impersonation links.
  - Keep the existing generic participant form as an advanced/manual fallback.
- Update runbook:
  - Prefer admin setup over env setup.
  - Keep env setup as optional CLI fallback for local/dev automation only.

## Public Interfaces And Types
- Add admin action `setupFounderCalibrationPairAction(formData)` that accepts Carl/Maria emails, optional reviewers, and reason.
- Extend founder setup report with role readiness:
  - `requiredRoles: { carl: RoleReadiness; maria: RoleReadiness }`
  - `missingRequiredRoles: Array<"carl" | "maria">`
- Reuse existing models and audit logging. No schema migration, no new route API, no prompt changes, no RAG changes, and no Zustand.

## Test Plan
- Setup/report tests:
  - Readiness fails when Carl is missing, Maria is missing, either role is paused, or only reviewer/other participants exist.
  - Readiness reports configured-but-unlinked founders as “needs registration.”
  - Active Carl and Maria participants with linked accounts produce role-level next actions.
  - Report contains no raw journal text or raw feedback note content.
- Admin action tests:
  - Requires admin and reason.
  - Upserts Carl/Maria participants with lowercased emails.
  - Links existing users by email and leaves missing accounts unlinked.
  - Writes audit logs with email, role, linked-user flag, and no raw journal text.
- UI checks:
  - `/admin/calibration/setup` shows the Carl/Maria setup panel, role readiness, safe links, and generic fallback form.
  - Paused participants and demo users remain excluded from founder calibration mode.
- Regression checks:
  - Prisma validate/generate.
  - AI tests, founder setup report, founder calibration report, comparison report.
  - Web/admin/ChatGPT typechecks.
  - Targeted lint.
  - Web/admin builds and ChatGPT app tests/build.

## Assumptions
- The next development step is to remove the env/email setup friction before asking Carl and Maria to run sessions.
- Admins may configure founder participants but still cannot impersonate, create passwords, create sessions, or bypass onboarding/consent.
- First real sessions and prompt/source tuning remain separate follow-up phases.
- Product-doctrine RAG remains narrow; manuscripts, vector DB, public beta, invite expansion, ChatGPT parity, dynamic council roles, and automatic prompt/source changes remain out of scope.
