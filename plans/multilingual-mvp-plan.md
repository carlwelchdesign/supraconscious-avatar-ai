# Multilingual MVP: Mobile, Web, And AI Response Language

## Summary
Add multilingual support for English, Spanish, Greek, French, and German across the Flutter app, the Next.js web app, and all user-facing AI response flows. Use Flutter's official `gen-l10n`/ARB localization path for mobile and `next-intl` for the Next.js App Router. Store each user's chosen language in their account, with chosen language taking precedence over device/browser locale. Do not use IP/GPS language inference for MVP.

## Key Changes
- Add a shared supported-language model: `en`, `es`, `el`, `fr`, `de`, with display names and AI-facing language names.
- Add `preferredLanguage` to `User`, defaulting to `en`, plus a Prisma migration.
- Add language selection to mobile Settings and web Settings.
- Keep existing URLs unchanged for MVP; use locale context/cookies/user preference rather than locale-prefixed routes.
- Localize the Flutter app with `gen-l10n`/ARB files and the web app with `next-intl` catalogs.
- Resolve AI response language from authenticated user preference, then supported device/browser locale, then English.
- Pass resolved language into user-facing AI generators and localized fallback responses.

## Test Plan
- Backend/web: preference default/persistence, session metadata, AI prompt language instructions, localized safety/local fallback responses, existing auth/journal/council/mobile tests.
- Flutter: localization generation, widget tests in English and at least one non-English locale, settings language picker, translated static UI with generated AI text preserved.
- Verification: `test:web`, web typecheck, `flutter pub get`, `flutter analyze`, `flutter test`, Android debug build, iOS simulator debug build when available.

## Assumptions
- Full web UI localization is in scope for MVP, but localized URL routing is deferred.
- User-chosen language wins over origin/device/browser.
- No IP geolocation, GPS permission, or location-derived language inference in MVP.
- Historical saved sessions stay in their originally generated language.
