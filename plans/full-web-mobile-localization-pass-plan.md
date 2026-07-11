# Full Web + Mobile Localization Pass

## Summary
Complete static localization across every user-facing web app page and current Flutter mobile screen for `en`, `es`, `el`, `fr`, `de`, and `zh-Hans`. Keep the existing language behavior: selected language wins, then device/browser locale, then English. Do not add locale-prefixed URLs or runtime auto-translation.

## Key Changes
- Expand the web `next-intl` catalogs for onboarding, patterns, guide, saved session detail, pricing, auth/account flows, settings/privacy, journal workspace/detail, voice controls, common buttons, empty states, and user-facing errors.
- Replace remaining hardcoded web UI strings with locale-aware messages in server and client components, including onboarding consent, patterns feedback, guide timeline, saved session feedback/embodiment/detail sections, pricing CTAs/states, account email/password/privacy flows, and modal/confirmation copy.
- Expand Flutter ARB catalogs and replace remaining mobile hardcoded strings across landing, auth, onboarding, tabs, journal, saved sessions, saved session detail, patterns, guide, settings, empty states, and errors.
- Keep AI-generated historical content unchanged. Continue sending the selected language into new AI calls and only localize static UI plus local fallback copy.
- Keep machine-readable API codes stable; localize only messages that are shown directly to users.

## Acceptance Criteria
- Selecting Greek or Chinese on the landing page carries through login, onboarding, dashboard, journal, pricing, account, saved session, patterns, guide, and mobile screens without requiring a manual reload.
- No visible static English remains on the named user-facing pages when a non-English language is selected, except brand names, user content, historical AI content, email addresses, and intentional technical labels.
- The language picker includes all MVP languages plus Chinese with clean labels/flags, and the selected language remains cached for logged-out and logged-in users.
- Message catalogs have parity so missing translation keys fail tests.

## Test Plan
- Web: add catalog parity checks, run typecheck, lint, tests, and production build.
- Web smoke: verify Greek and Chinese flows from landing to login to onboarding/dashboard to journal, plus pricing/account/saved-session/patterns/guide pages.
- Mobile: regenerate localization, run Flutter analyze and tests, and add widget coverage for English plus one non-English locale.
- Build: run Android debug build; run iOS simulator debug build if local simulator tooling is available.
- Regression: verify selected language still drives future AI response language and does not retroactively translate saved AI content.

## Assumptions
- "Every single app page" means user-facing web and current Flutter mobile surfaces, not admin/CMS/RAG/governance tooling.
- Static in-repo translations are acceptable for this pass; professional translation review can follow.
- Chinese means Simplified Chinese `zh-Hans`; Traditional Chinese is deferred.
- URL routing remains unchanged for MVP.
