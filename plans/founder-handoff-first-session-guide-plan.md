# Founder Handoff And First-Session Guide Plan

## Summary
Make the first Carl/Maria calibration sessions easy to run after admin setup. The admin can now configure Carl and Maria, but there is still no founder-facing handoff surface. This phase adds a lightweight, non-invite handoff guide: participant-specific next steps, copyable links, short instructions, and first-session expectations. It does not create accounts, send emails, impersonate users, add magic links, change prompts, or expand RAG.

## Key Changes
- Preserve unrelated dirty files: root `package.json`, `docs/setup-and-deployment.md`, root `scripts/`, and `sources/`.
- Add a founder handoff panel on `/admin/calibration/setup`:
  - For Carl and Maria, show a compact “send this to founder” block with their current next action, safe app links, and a short checklist.
  - Include copyable text for: register/login, complete onboarding, open `/journal`, choose the suggested guided scenario, submit feedback type, and leave a note.
  - If a founder account is not linked, show registration as the primary action; if linked but onboarding is incomplete, show onboarding; if ready, show journal.
- Add participant-safe first-session guidance:
  - On `/journal`, active founder participants should see a short “first calibration session” reminder until they have at least one completed scenario with a feedback note.
  - The reminder should name the suggested scenario and say that feedback notes are expected for Carl/Maria calibration.
  - Keep the existing guided prompt buttons; no multi-route state or Zustand.
- Extend setup report minimally:
  - Add `handoffText` and `primaryHandoffHref` to Carl/Maria role readiness output.
  - Keep report metadata-only; no raw journal text or feedback note content.
- Update runbook:
  - Add exact admin handoff steps: configure Carl/Maria, copy the handoff text, have each founder register/login, complete onboarding, run one guided scenario, leave feedback note, then review in `/calibration/live`.

## Public Interfaces And Types
- Extend existing founder setup report role readiness with:
  - `primaryHandoffHref: string | null`
  - `handoffText: string`
- No schema migration.
- No new auth flow, email system, magic links, invite codes, prompt templates, feature flags, RAG behavior, or Zustand store.
- Reuse existing admin setup actions, journal founder calibration mode, and quality review workflow.

## Test Plan
- Setup/report tests:
  - Missing account produces registration handoff text and `/register` primary link.
  - Linked account with incomplete onboarding produces onboarding handoff text and `/onboarding` primary link.
  - Founder with onboarding complete but no session produces journal handoff text and `/journal` primary link.
  - Founder with session but no feedback note asks for feedback note.
  - Report contains no raw journal text or raw feedback note content.
- UI tests:
  - `/admin/calibration/setup` shows Carl/Maria handoff blocks and safe links without impersonation.
  - `/journal` shows first-session reminder only for active founder participants who still need first-session evidence.
  - Demo users, paused participants, and non-founders do not see founder handoff reminders.
- Regression checks:
  - Prisma validate/generate.
  - Auth redirect tests.
  - AI tests, founder setup report, founder calibration report, comparison report.
  - Web/admin/ChatGPT typechecks.
  - Targeted lint.
  - Web/admin builds and ChatGPT app tests/build.

## Assumptions
- The immediate bottleneck is founder handoff clarity, not more setup machinery.
- Admins will manually send/copy instructions; no email delivery or invite-link system is added.
- Carl and Maria remain the only real calibration users.
- First real session review and prompt/source tuning remain follow-up phases after evidence exists.
- Product-doctrine RAG remains narrow; manuscripts, vector DB, public beta, invite expansion, ChatGPT parity, dynamic council roles, and automatic prompt/source changes remain out of scope.
