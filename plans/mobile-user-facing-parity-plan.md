# Mobile User-Facing Parity Plan

## Summary
Replace the current mobile auth-first shell with a native Flutter version of the website landing experience, then continue toward mobile parity for the core Inner Council user journey. Mobile parity means the reflective practice feels complete on phone, while admin/CMS/governance and heavier web-only operations stay out of scope.

## Key Changes
- Save this plan under `/plans`, create a `codex/mobile-user-facing-parity` branch, implement in focused slices, commit, push, and open a PR.
- Replace the unauthenticated mobile entry screen with a native Flutter landing page based on the website home page, using the bundled `echo-eye-cosmos` asset and native CTAs for create account and sign in.
- Move login/register into dedicated auth screens shown after the landing CTAs, not as the first screen.
- Keep `/api/mobile/session` as the app bootstrap source: unauthenticated users see landing, onboarding-required users see consent, and ready users enter the product flow.
- Define mobile parity as user-facing reflection areas: landing, auth, onboarding, dashboard, journal/council, feedback/embodiment, saved sessions, patterns, and reflection preferences.
- Keep admin/CMS/RAG governance/calibration, full billing portal UX, and custom audio capture out of mobile v1.

## API / Data Work
- Audit gaps between existing web routes and mobile client needs.
- Add mobile-safe JSON endpoints only where web behavior is still server-action/page-only, especially dashboard summary, saved-session list, pattern list, and pattern feedback.
- Reuse existing access rules, consent checks, privacy behavior, response builders, and event logging.
- Keep cookie-backed sessions for this slice.

## Flutter Work
- Add simple navigation for landing -> auth -> onboarding -> app.
- Split the current single mobile shell into focused native screens/components.
- Build a minimal ready-state app with dashboard summary, new journal entry path, council result display, saved session access, patterns, and settings entry points.
- Preserve Android, iOS Simulator, and macOS preview behavior.

## Test Plan
- Backend tests cover mobile session states and new mobile dashboard/pattern/session JSON builders.
- Flutter widget tests cover unauthenticated landing, auth CTA navigation, onboarding, and ready app shell.
- Verification commands: `flutter analyze`, `flutter test`, Android debug build, iOS simulator debug build, and local simulator/emulator smoke when available.

## Assumptions
- The mobile landing should be a native Flutter recreation, not a WebView.
- Mobile should prioritize the reflection practice over complete website feature parity.
- Website remains canonical for admin, governance, and complex account/billing operations for now.
- This branch stacks on top of the open mobile platform API defaults branch until that PR is merged.
