# Inner Council Mobile

Flutter client for the Supraconscious Inner Council mobile app.

This app targets iOS, Android, phones, and tablets. It is a user-facing client over the existing web/backend system; admin/CMS, RAG governance, source review, prompt tuning, and calibration workflows remain in the Next.js admin app.

## Commands

Run from the repository root:

```bash
node .yarn/releases/yarn-4.cjs mobile:check
node .yarn/releases/yarn-4.cjs mobile:doctor
node .yarn/releases/yarn-4.cjs mobile:pub-get
node .yarn/releases/yarn-4.cjs mobile:analyze
node .yarn/releases/yarn-4.cjs mobile:test
node .yarn/releases/yarn-4.cjs mobile:build:android
```

Run locally with a backend URL:

```bash
cd apps/mobile
flutter run --dart-define=INNER_COUNCIL_API_BASE_URL=http://localhost:3000
```

If no `INNER_COUNCIL_API_BASE_URL` is provided, the app uses `http://10.0.2.2:3000` on Android emulator and `http://localhost:3000` on iOS Simulator/macOS.

For Android emulator access to the host web app, you can also pass the URL explicitly:

```bash
flutter run --dart-define=INNER_COUNCIL_API_BASE_URL=http://10.0.2.2:3000
```

## Local Preview Targets

Run commands from `apps/mobile`. If you are already in `apps/mobile`, do not run `cd apps/mobile` again.

Start the web backend separately from the repository root before testing login or journal API flows:

```bash
node .yarn/releases/yarn-4.cjs dev:web
```

Android emulator:

```bash
flutter emulators --launch inner_avatar_android_35
flutter run -d emulator-5554 --dart-define=INNER_COUNCIL_API_BASE_URL=http://10.0.2.2:3000
```

macOS desktop preview:

```bash
flutter run -d macos --dart-define=INNER_COUNCIL_API_BASE_URL=http://localhost:3000
```

iOS Simulator:

```bash
flutter run -d ios --dart-define=INNER_COUNCIL_API_BASE_URL=http://localhost:3000
```

iOS requires an installed Xcode Simulator runtime. If `flutter doctor -v` reports that simulator runtimes cannot be listed, open Xcode and install an iOS runtime from Settings > Platforms.

## Current State

- Flutter scaffold is in place for iOS and Android.
- The first screen is a branded mobile foundation screen.
- Native keyboard dictation is the first-pass dictation strategy.
- Backend auth/journal/council API integration is the next implementation phase.
- Wearables are intentionally deferred.
