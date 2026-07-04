# Founder Calibration Runbook

## Setup
- In admin, open `/calibration/setup`.
- Use the Carl/Maria Setup panel to enter Carl's email, Maria's email, optional reviewer emails, and a setup reason.
- Confirm Carl and Maria appear as active founder calibration participants with roles `carl` and `maria`.
- Copy the founder handoff text for each person and send it manually; the app does not send email invites or create magic links.
- Have each founder register through the normal web app and complete onboarding consent.
- Use `Sync user` on the setup page if a participant was added before the account existed.

## CLI Fallback
- For local/dev automation only, configure the launch env values before running the setup command:
  - `FOUNDER_CALIBRATION_CARL_EMAIL`
  - `FOUNDER_CALIBRATION_MARIA_EMAIL`
  - `FOUNDER_CALIBRATION_REVIEWER_EMAILS` when reviewers should also be tracked
  - `FOUNDER_CALIBRATION_SETUP_ACTOR_EMAIL` when audit logging should attach to an existing admin user
- Run `pnpm --filter @inner-avatar/ai setup:founder-calibration` to upsert founder participants and link any existing user accounts by email.

## Session Cadence
- Have each founder register or log in through their own account; admins do not create passwords, create sessions, or impersonate founders.
- Complete onboarding if the setup page shows it as pending.
- Open `/journal` as the founder account.
- Use the preselected suggested scenario first, then run one guided calibration scenario at a time: voice, source grounding, embodiment, no-source fallback, and intensity boundary.
- Leave a short feedback note for every founder calibration feedback submission. The app requires a note for active founder participants so the calibration report has usable evidence.
- After each founder completes one session with a feedback note, review the session in `/calibration/live`.

## Review
- Open `/calibration/live`.
- Review each session without raw journal text.
- Mark strong sessions as `ready` / golden examples.
- Mark issues as voice, source, prompt, intensity, embodiment, or prompt regression.
- Return to `/calibration/setup` after the first run to confirm the next action changed from registration/onboarding/session capture to review or golden-example marking.

## Tuning Rules
- Prompt/source changes remain manual.
- Do not auto-edit `council.system` from feedback.
- Do not auto-approve source chunks.
- Keep RAG product-doctrine-only until a separate expansion plan is approved.
