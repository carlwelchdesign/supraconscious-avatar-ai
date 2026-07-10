# Mobile Integration And Local Preview Enablement Plan

## Summary
Continue the Flutter mobile foundation with an API/auth-first integration slice and local preview setup. The mobile app should authenticate against stable mobile JSON routes, discover session/onboarding state, submit journal reflections through existing council APIs, and run locally on Android emulator and macOS desktop. iOS remains pending installation of an Xcode Simulator runtime.

## Key Changes
- Add mobile-safe backend routes under `/api/mobile/*` for register, login, logout, session bootstrap, onboarding consent, reflection preferences, and saved session detail.
- Reuse existing cookie-backed web sessions, auth rate limiting, consent constants, pilot event logging, journal access policy, and privacy-safe response patterns.
- Split the Flutter app into a Riverpod-backed bootstrap flow with auth, consent, and ready dashboard states, plus a cookie-aware HTTP client.
- Add macOS Flutter platform support for local desktop preview only; Android and iOS remain the release targets.
- Configure Android emulator `inner_avatar_android_35` for local preview and document the correct backend URLs per platform.

## Test Plan
- Backend contract tests cover mobile session states and saved-session privacy behavior.
- Flutter tests cover unauthenticated, onboarding-required, and ready bootstrap states plus council response parsing.
- Run `flutter test`, `flutter analyze`, `flutter build macos --debug`, and `flutter build apk --debug`.
- Verify Android emulator launch with `flutter run -d emulator-5554 --dart-define=INNER_COUNCIL_API_BASE_URL=http://10.0.2.2:3000`.
- Verify macOS launch with `flutter run -d macos --dart-define=INNER_COUNCIL_API_BASE_URL=http://localhost:3000`.

## Assumptions
- Email/password remains the first mobile auth path; Apple/Google sign-in is deferred.
- Cookie-backed sessions are acceptable for this first Flutter integration pass.
- Android emulator uses `http://10.0.2.2:3000`; macOS and iOS Simulator use `http://localhost:3000`.
- iOS local preview requires installing an iOS Simulator runtime through Xcode Settings > Platforms before `flutter run -d ios` will work.
- macOS support is for fast local preview and is not part of the App Store release scope.
