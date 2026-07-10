# Mobile Session Experience Parity Plan

## Summary
Recover the mobile parity work from PR #6 onto `main`, then deepen the mobile saved-session experience so the app feels much closer to the website for the core reflection loop.

## Key Changes
- Branch from current `main`, restore PR #6's mobile landing/tabbed-app/API work, and keep the recovery explicit in this branch.
- Extend saved-session detail JSON with avatar response fields, council messages, feedback summaries, embodiment responses, and selected source summaries.
- Update Flutter saved-session detail to show the full journal entry, council reflection fields, council voices, source grounding, feedback status, feedback submission, and embodiment-gate save.
- Add a simple native Guide tab with current guide stage, tone/intensity/trait, and a compact stage timeline.
- Keep billing portal, account deletion, admin/CMS/RAG governance, and custom audio capture out of this slice.

## Test Plan
- Backend tests cover enriched saved-session response and confirm private/internal fields stay out of mobile JSON.
- Flutter tests cover landing recovery, ready shell, saved-session detail parsing, feedback, embodiment, and guide tab presence.
- Verify with `test:web`, web `typecheck`, `flutter analyze`, `flutter test`, Android debug build, iOS simulator debug build, and simulator smoke where available.

## Assumptions
- Mobile parity means core reflection-practice parity, not every web/admin/account-management surface.
- Existing web access checks, feedback route, embodiment route, and privacy behavior remain the source of truth.
