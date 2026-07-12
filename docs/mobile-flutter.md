# Flutter Mobile App

The mobile path adds a Flutter client for Apple App Store and Google Play while keeping the existing web, admin/CMS, ChatGPT/MCP, PostgreSQL, and AI/RAG services as the system of record.

## Product Direction

- First mobile release: iPhone, Android phones, iPad, and Android tablets.
- Deferred: Apple Watch, Wear OS, and other wearables.
- Dictation default: use native keyboard dictation first; add in-app speech-to-text only after mobile usage proves the need.
- Admin/CMS, source review, prompt tuning, RAG governance, founder calibration, and operational dashboards stay in the existing web/admin apps.

## Local Tooling

Flutter is installed outside the repository. Use the root scripts below before working on `apps/mobile`.

Recommended local checks:

```bash
node .yarn/releases/yarn-4.cjs mobile:check
node .yarn/releases/yarn-4.cjs mobile:doctor
node .yarn/releases/yarn-4.cjs mobile:pub-get
node .yarn/releases/yarn-4.cjs mobile:analyze
node .yarn/releases/yarn-4.cjs mobile:test
node .yarn/releases/yarn-4.cjs mobile:build:android
```

`mobile:check` verifies that `flutter` is available on `PATH`. `mobile:doctor` runs Flutter's own environment diagnostics after that preflight passes.

## Local Preview

Run Flutter preview commands from `apps/mobile`.

Start the backend separately from the repository root before testing authenticated flows:

```bash
node .yarn/releases/yarn-4.cjs dev:web
```

Android emulator preview uses the host-loopback alias:

```bash
cd apps/mobile
flutter emulators --launch inner_avatar_android_35
flutter run -d emulator-5554 --dart-define=INNER_COUNCIL_API_BASE_URL=http://10.0.2.2:3000
```

When `INNER_COUNCIL_API_BASE_URL` is omitted, the app automatically uses `http://10.0.2.2:3000` on Android emulator and `http://localhost:3000` on iOS Simulator/macOS. A connection-refused message on iOS Simulator or macOS usually means the web backend is not running on port 3000.

macOS desktop preview is configured for fast local UI checks:

```bash
cd apps/mobile
flutter run -d macos --dart-define=INNER_COUNCIL_API_BASE_URL=http://localhost:3000
```

iOS Simulator preview uses localhost:

```bash
cd apps/mobile
flutter run -d ios --dart-define=INNER_COUNCIL_API_BASE_URL=http://localhost:3000
```

Current local setup notes:

- Android emulator `inner_avatar_android_35` is configured as the preview AVD.
- CocoaPods is installed for iOS/macOS plugin readiness.
- Xcode and the iOS 26.5 Simulator runtime are installed; `iPhone 17` is the verified local iOS preview device.
- The macOS target is for local preview only; iOS and Android remain the release targets.

## Workspace

The mobile app lives at `apps/mobile`.

It was scaffolded with:

```bash
flutter create apps/mobile \
  --org co.supraconscious \
  --project-name inner_council_mobile \
  --platforms=ios,android
```

After scaffolding, keep generated iOS and Android project files committed unless they contain local machine state. Do not commit secrets, provisioning profiles, signing certificates, keystores, or generated build outputs.

Current local setup note:

- Flutter and Android command-line tools are installed.
- Android SDK packages and licenses are accepted.
- Xcode exists, but iOS validation may require completing Xcode first-launch setup in the Xcode app or through Apple's interactive tooling.

## Architecture

Flutter should act as a stateless user client over explicit backend APIs:

- Auth/session state
- Current user and onboarding state
- Journal submission and Inner Council response
- Source/no-source provenance
- Council feedback and feedback notes
- Embodiment Gate save
- Saved session detail
- Pattern memory and privacy settings

The backend remains responsible for durable state, AI orchestration, safety checks, RAG eligibility, source provenance, prompt resolution, privacy rules, and audit-sensitive admin workflows.

## First MVP Screens

- Login/register
- Onboarding and consent gate
- Dashboard
- Journal entry with native keyboard dictation support
- Inner Council result
- Feedback type and optional note
- Embodiment Gate save
- Saved session detail
- Patterns
- Settings and privacy controls

## Release Path

1. Complete Xcode first-launch setup for iOS validation.
2. Configure Google/Apple OAuth client IDs, native package identifiers, associated domains, and signing fingerprints before testing social login or native passkeys outside local preview.
3. Build the MVP screens against the backend.
4. Add release signing and CI for iOS and Android.
5. Run TestFlight and Google Play internal testing with Carl and Maria before any public release.

## Mobile Auth

The app keeps cookie-backed sessions for MVP. Email/password login, Google login, and Apple login call mobile JSON endpoints. If a user has enrolled a passkey or YubiKey, the backend returns `status: "mfa_required"` and the client must complete passkey verification before the final session cookie is issued.

Native passkeys require the production domain association files to match the signed app identifiers:

- iOS bundle: `co.supraconscious.innerCouncilMobile`
- Android package: `co.supraconscious.inner_council_mobile`

Simulator support can be limited by platform WebAuthn behavior; verify the production association files before TestFlight or Play internal testing.

## Store Readiness

Before public App Store or Google Play release, prepare:

- App icons, splash screen, screenshots, and preview copy.
- Privacy policy and support URLs.
- Apple privacy nutrition labels.
- Google Play Data Safety form.
- AI-generated content and wellness/safety review notes.
- iOS archive/TestFlight workflow.
- Android App Bundle/internal testing workflow.

## Wearables

Do not include wearables in the first mobile milestone.

Future wearable scope should be a companion experience only:

- daily prompt glance
- short voice reflection capture
- reminder/notification controls
- saved micro-shift review

The full Inner Council reading and review experience should remain phone/tablet-first.
