# Founder Calibration Runbook

## Setup
- Start the local founder calibration surfaces with `yarn dev:founder-calibration` when running the web and admin apps side by side.
- Run `yarn smoke:founder-local --web-url http://localhost:3000 --admin-url http://localhost:3001 --passes 3` after startup to confirm the web/admin login and protected founder routes are responding before sending handoff links.
- Before live founder use, run `yarn verify:founder-calibration-code` to check the code path, reports, evals, builds, and ChatGPT app tests. This verifies the code path; it does not require every live founder action to be complete.
- In admin, open `/calibration/setup`.
- Use the Carl/Maria Setup panel to enter Carl's email, Maria's email, optional reviewer emails, and a setup reason.
- Confirm Carl and Maria appear as active founder calibration participants with roles `carl` and `maria`.
- Copy the Full Launch Packet from `/calibration/setup`, or copy the individual founder handoff text for each person and send it manually. Protected links route through login with the founder email prefilled and the intended next step preserved.
- The app does not send email invites, create magic links, create passwords, create sessions, or impersonate founders.
- If a linked founder account cannot sign in, a super-admin may use the audited password reset in `/users`; do not create a duplicate account or bypass onboarding/consent.
- Optional CLI launch packet: run `yarn packet:founder-calibration --web-url http://localhost:3000 --admin-url http://localhost:3001` to print the start command, admin review links, Carl/Maria handoff messages, remaining founder actions, and after-session commands.
- Optional CLI handoff: run `yarn handoff:founder-calibration --web-url http://localhost:3000 --admin-url http://localhost:3001` to print the same next-step messages outside the admin UI.
- Have each founder register through the normal web app and complete onboarding consent.
- Active founder participants will see a founder calibration note on onboarding; after consent, the app redirects them to `/journal`.
- Use `Sync user` on the setup page if a participant was added before the account existed.

## CLI Fallback
- For local/dev automation only, configure the launch env values before running the setup command:
  - `FOUNDER_CALIBRATION_CARL_EMAIL`
  - `FOUNDER_CALIBRATION_MARIA_EMAIL`
  - `FOUNDER_CALIBRATION_REVIEWER_EMAILS` when reviewers should also be tracked
  - `FOUNDER_CALIBRATION_SETUP_ACTOR_EMAIL` when audit logging should attach to an existing admin user
- Run `yarn setup:founder-calibration` to upsert founder participants and link any existing user accounts by email.
- Verify setup with `yarn report:founder-calibration-setup`.
- Run `yarn check:founder-calibration-launch` when you want a strict check of remaining live founder actions. The check prints the current action list plus copyable Carl/Maria handoff actions and safe links.

## Session Cadence
- Have each founder register or log in through their own account; admins do not create passwords, create sessions, or impersonate founders.
- Complete onboarding if the setup page shows it as pending.
- On onboarding, confirm the founder understands the next step is one guided calibration reflection plus one feedback type.
- Open `/journal` as the founder account.
- Use the preselected suggested scenario first, then run one guided calibration scenario at a time: voice, source grounding, embodiment, no-source fallback, and intensity boundary.
- Choose one feedback type after every founder calibration session. Add a short written note only when there is a specific voice, source, intensity, embodiment, or phrasing detail to capture.
- Review sessions in `/calibration/live` only when feedback points to a specific issue or a strong reusable example.

## Review
- Open `/calibration/live`.
- Review each session without raw journal text.
- Mark strong sessions as `ready` / golden examples.
- Mark issues as voice, source, prompt, intensity, embodiment, or prompt regression.
- Return to `/calibration/setup` after the first run to confirm the next action changed from registration/onboarding/session capture to the next useful guided scenario.
- Verify calibration evidence with `yarn report:founder-calibration` and `yarn report:founder-calibration-comparison`.
- Rerun `yarn check:founder-calibration-launch` when you want a strict snapshot of remaining live founder actions.

## Tuning Rules
- Prompt/source changes remain manual.
- Do not auto-edit `council.system` from feedback.
- Do not auto-approve source chunks.
- Keep RAG product-doctrine-only until a separate expansion plan is approved.
