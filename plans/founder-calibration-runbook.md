# Founder Calibration Runbook

## Setup
- Configure the launch env values before running the setup command:
  - `FOUNDER_CALIBRATION_CARL_EMAIL`
  - `FOUNDER_CALIBRATION_MARIA_EMAIL`
  - `FOUNDER_CALIBRATION_REVIEWER_EMAILS` when reviewers should also be tracked
  - `FOUNDER_CALIBRATION_SETUP_ACTOR_EMAIL` when audit logging should attach to an existing admin user
- Run `pnpm --filter @inner-avatar/ai setup:founder-calibration` to upsert founder participants and link any existing user accounts by email.
- In admin, open `/calibration/setup`.
- Confirm Carl and Maria appear as founder calibration participants with role `carl` and `maria`.
- Have each founder register through the normal web app and complete onboarding consent.
- Use `Sync user` on the setup page if a participant was added before the account existed.

## Session Cadence
- Have each founder register or log in through their own account; admins do not create passwords, create sessions, or impersonate founders.
- Complete onboarding if the setup page shows it as pending.
- Open `/journal` as the founder account.
- Run one guided calibration scenario at a time: voice, source grounding, embodiment, no-source fallback, and intensity boundary.
- Leave a short feedback note when anything feels off, unsupported, too generic, too intense, or good enough.

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
