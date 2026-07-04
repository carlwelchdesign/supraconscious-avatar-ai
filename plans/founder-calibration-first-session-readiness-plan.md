# Founder Calibration First-Session Readiness Plan

## Summary
Build the next phase around getting Carl and Maria into real calibration sessions with minimal friction. The app can already capture scenarios, feedback, reviews, prompt versions, and golden examples, but founder setup needs to be explicit instead of relying on hidden environment filters.

## Key Changes
- Add admin-managed founder calibration participants with role, status, linked user, reason, and audit history.
- Add shared founder filtering: active DB participants first, `FOUNDER_CALIBRATION_EMAILS` second, non-demo fallback only with setup warning.
- Add `/admin/calibration/setup` for account, onboarding, consent, session, feedback-note, scenario, and golden-example readiness.
- Show setup readiness inside `/admin/calibration/live`.
- Gate `/journal` founder calibration prompts to active founder participants or fallback founder matching.
- Add `runFounderCalibrationSetupReport()` and `report:founder-calibration-setup`.

## Test Plan
- Verify DB participants override env fallback and paused participants are excluded.
- Verify setup reports contain no raw journal text or raw feedback note text.
- Verify missing account, onboarding, consent, session, feedback note, and golden example states produce clear next actions.
- Verify admin participant actions require reason and write audit logs.
- Run Prisma validate/generate, AI tests, founder reports/evals, web/admin/ChatGPT typechecks, targeted lint, and builds.

## Assumptions
- Carl and Maria register through normal app flows; admins do not create passwords or impersonate users.
- Product-doctrine RAG remains narrow.
- Manuscripts, vectors, public beta, invite expansion, ChatGPT parity, and dynamic council roles stay out of scope.
