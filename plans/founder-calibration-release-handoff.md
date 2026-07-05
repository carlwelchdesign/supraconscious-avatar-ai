# Founder Calibration Release Handoff

## Branch State
- Branch: `main`
- Current checked commit: run `git log -1 --oneline`
- Remote: pushed to `git@github.com:carlwelchdesign/supraconscious-avatar-ai.git`
- Deployment: Vercel remains the production path; Docker/Compose are available for portable runtime testing.

## Summary
This branch implements the Maria-grounded Inner Council, policy-first RAG governance/activation gates, internal pilot governance, founder calibration setup, guided founder sessions, admin calibration review, prompt calibration safety checks, and the Carl/Maria first-session launch path.

The repo-side code path is verified and deployed-oriented hardening has been added. The live launch gate is expected to remain blocked until Carl and Maria complete real onboarding, consent, first guided sessions, feedback notes, and admin review.

## Key Product Surfaces
- Web first-session flow: `/onboarding`, `/journal`, `/journal/[entryId]`, `/dashboard`
- Admin setup: `/calibration/setup`
- Admin live review: `/calibration/live`
- Admin council workbench: `/council`
- Admin source readiness/review: `/sources`, `/sources/readiness`
- Admin pilot operations: `/pilot`
- Admin prompt tuning: `/prompts`
- Admin runtime health: `/health`
- Web/admin readiness probes: `/api/health`

## Primary Commands
```bash
yarn dev:founder-calibration
yarn smoke:founder-local --web-url http://localhost:3000 --admin-url http://localhost:3001 --passes 3
yarn packet:founder-calibration --web-url http://localhost:3000 --admin-url http://localhost:3001
yarn check:founder-calibration-launch
yarn verify:founder-calibration-code
```

## Verification Evidence
`yarn verify:founder-calibration-code` passed after adding the verifier command. It runs:
- Prisma generate
- Auth tests
- AI tests
- RAG evals
- Pilot evals
- Internal RAG smoke
- Founder calibration fixtures
- Founder calibration regression
- Founder setup/report/comparison reports
- Typecheck
- Lint
- Web build
- Admin build
- ChatGPT app build
- ChatGPT app tests

Additional recent checks:
- `yarn check:founder-calibration-launch` correctly exits blocked with the current Carl/Maria evidence blockers.
- `yarn smoke:founder-local --web-url http://localhost:3000 --admin-url http://localhost:3001 --passes 3` checks local web/admin handoff routes and protected-route login redirects before founder use.
- `yarn packet:founder-calibration --web-url http://localhost:3000 --admin-url http://localhost:3001` prints the local app command, admin setup/review links, founder handoff text, blockers, and after-session review commands.
- Admin `/health` now exposes runtime configuration, founder launch gate status, auth abuse pressure, and voice usage pressure.
- Web/admin `/api/health` check Postgres and return `503` when database readiness fails.
- Docker Compose defines healthchecks for web, admin, and ChatGPT/MCP.
- Docker build context excludes `.env*`, key files, `.DS_Store`, and local `sources/` corpus files.

## Current Live Blockers
- `carlwelchdesign+supra@gmail.com` is configured, linked, onboarded, consented, and has saved founder calibration sessions.
- `carlwelchdesign+supra@gmail.com` needs one specific calibration feedback note.
- `carlwelchdesign+supra@gmail.com` needs one ready/golden review or a specific issue review.
- `meliatsaroucha@gmail.com` is configured and linked.
- `meliatsaroucha@gmail.com` needs onboarding.
- `meliatsaroucha@gmail.com` needs current required pilot consent records.
- `meliatsaroucha@gmail.com` needs one guided calibration session.

These blockers should not be bypassed with admin impersonation, password creation, direct session creation, or manual consent/session inserts.

## Current Operator Steps
- Confirm Vercel env vars from `docs/setup-and-deployment.md`.
- Confirm admin `/health` shows expected runtime configuration.
- Open admin `/calibration/setup` and copy the Full Launch Packet.
- Send Carl the latest-session feedback-note link from the launch packet.
- Send Maria the onboarding/consent link from the launch packet.
- Review sessions in `/calibration/live` without raw journal text by default.
- Mark strong sessions `ready`/golden or assign a voice/source/prompt/intensity/embodiment issue.
- Re-run `yarn check:founder-calibration-launch` after Carl and Maria complete the real actions.
