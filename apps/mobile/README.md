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

For Android emulator access to the host web app, use:

```bash
flutter run --dart-define=INNER_COUNCIL_API_BASE_URL=http://10.0.2.2:3000
```

## Current State

- Flutter scaffold is in place for iOS and Android.
- The first screen is a branded mobile foundation screen.
- Native keyboard dictation is the first-pass dictation strategy.
- Backend auth/journal/council API integration is the next implementation phase.
- Wearables are intentionally deferred.
