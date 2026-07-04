# Founder Calibration Release Handoff

## Branch State
- Local branch: `codex/inner-council-stabilization`
- Base branch: `main`
- Current local branch position: `1bbf934 Document founder calibration launch operations`
- Ahead of `main`: 80 commits
- Remote branch: not pushed yet

## Summary
This branch implements the Maria-grounded Inner Council, policy-first RAG governance/activation gates, internal pilot governance, founder calibration setup, guided founder sessions, admin calibration review, prompt calibration safety checks, and the Carl/Maria first-session launch path.

The repo-side code path is verified. The live launch gate is expected to remain blocked until Carl and Maria complete real onboarding, consent, first guided sessions, feedback notes, and admin review.

## Key Product Surfaces
- Web first-session flow: `/onboarding`, `/journal`, `/journal/[entryId]`, `/dashboard`
- Admin setup: `/calibration/setup`
- Admin live review: `/calibration/live`
- Admin council workbench: `/council`
- Admin source readiness/review: `/sources`, `/sources/readiness`
- Admin pilot operations: `/pilot`
- Admin prompt tuning: `/prompts`

## Primary Commands
```bash
yarn dev:founder-calibration
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
- `yarn check:founder-calibration-launch` correctly exits blocked with Carl/Maria onboarding, consent, and session blockers.
- `yarn packet:founder-calibration --web-url http://localhost:3000 --admin-url http://localhost:3001` prints the local app command, admin setup/review links, founder handoff text, blockers, and after-session review commands.

## Current Live Blockers
- `carlwelchdesign@gmail.com` needs onboarding.
- `carlwelchdesign@gmail.com` needs current required pilot consent records.
- `carlwelchdesign@gmail.com` needs one guided calibration session.
- `meliatsaroucha@gmail.com` needs onboarding.
- `meliatsaroucha@gmail.com` needs current required pilot consent records.
- `meliatsaroucha@gmail.com` needs one guided calibration session.

These blockers should not be bypassed with admin impersonation, password creation, direct session creation, or manual consent/session inserts.

## Push And PR Steps
The local shell cannot push because GitHub HTTPS credentials are not configured and `gh` is not installed. From an authenticated terminal, run:

```bash
cd "/Users/carl.welch/Documents/Github Projects/inner-avatar-ai"
git push -u origin codex/inner-council-stabilization
```

Then open a PR:
- Base: `main`
- Compare: `codex/inner-council-stabilization`
- Suggested title: `Launch founder calibration Inner Council flow`

## Suggested PR Body
```markdown
## Summary
- Adds the Maria-grounded Inner Council flow, council persistence, safety boundaries, prompt/version checks, and policy-first RAG governance.
- Adds founder calibration setup, guided Carl/Maria first-session flow, feedback notes, admin live review, launch packet, and code verifier.
- Keeps live launch gated until Carl and Maria complete onboarding, consent, first guided sessions, feedback notes, and admin review.

## Verification
- yarn verify:founder-calibration-code
- yarn check:founder-calibration-launch
- yarn packet:founder-calibration --web-url http://localhost:3000 --admin-url http://localhost:3001

## Live Launch Notes
- Do not impersonate founders or bypass onboarding/consent.
- Start local apps with `yarn dev:founder-calibration`.
- Use `/calibration/setup` for handoff and `/calibration/live` for review.
```
