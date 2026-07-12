# Full Repo Localization Audit And Hardening Plan

## Summary
Perform a serious localization closure pass across every app in the repo: Flutter mobile, public web, admin, and ChatGPT/MCP app/widget. The goal is not another manual string sweep; it is to add automated coverage so missing translated UI strings cannot keep slipping through.

## Key Changes
- Create branch `codex/full-repo-localization-audit`, save this plan under `/plans`, implement, verify, commit, push, and open a PR.
- Add a repo-level localization audit script that fails on user-facing hardcoded strings in Flutter, public web, admin, and ChatGPT/widget code.
- Keep allowlists only for non-user-facing constants: API paths, JSON keys, enum values, CSS classes, telemetry labels, env vars, test fixture text, brand names, user content, and historical/generated AI content.
- Expand Flutter ARB files for all missing mobile strings, especially social login, passkey MFA, saved-session feedback/embodiment, guide, patterns, footer, and user-facing API errors.
- Expand public web `next-intl` catalogs for remaining hardcoded auth/passkey/MFA/settings/action strings.
- Add localization infrastructure to `apps/admin` using `next-intl` with `en`, `es`, `el`, `fr`, `de`, and `zh-Hans`.
- Localize admin user-facing pages, forms, tables, banners, empty states, validation/status messages, and login/proxy errors.
- Add lightweight localization to `apps/chatgpt-app` for widget UI, tool-facing labels/descriptions where surfaced to users, and public error messages using saved user language, request locale, or English fallback.
- Do not translate user-written journal entries, saved historical AI outputs, source excerpts, provider names, emails, IDs, or technical audit metadata.

## Enforcement
- Add catalog parity tests for web messages, admin messages, ChatGPT/widget messages, and Flutter ARB files.
- Add hardcoded-string tests that fail when new visible strings are introduced outside approved allowlists.
- Update existing widget tests to run at least one non-English Flutter locale through landing, auth/social buttons, MFA/passkey screen, journal, saved-session detail, patterns, guide, and settings.
- Add web/admin smoke-style tests or component-level assertions for Greek and Chinese where practical.

## Test Plan
- `yarn test:web`
- `yarn workspace @inner-avatar/web typecheck`
- `yarn workspace @inner-avatar/web lint`
- `yarn workspace @inner-avatar/admin typecheck`
- `yarn workspace @inner-avatar/admin lint`
- `yarn workspace @inner-avatar/chatgpt-app typecheck`
- `yarn workspace @inner-avatar/chatgpt-app lint`
- `yarn build:web`
- Admin production build
- ChatGPT app build
- `yarn mobile:analyze`
- `yarn mobile:test`
- `yarn mobile:build:android`
- `flutter build ios --simulator --debug --dart-define=INNER_COUNCIL_API_BASE_URL=http://localhost:3000` when local Xcode remains available

## Acceptance Criteria
- Selecting Greek or Chinese propagates through public web, logged-in app pages, auth/MFA/passkey flows, and Flutter mobile static UI without a manual reload.
- Admin app has language-aware UI for all visible static operational pages.
- ChatGPT widget and user-facing tool/error messages no longer rely on hardcoded English where locale is available.
- Automated tests fail if message catalogs fall out of parity.
- Automated audit fails on new visible hardcoded English strings unless explicitly allowlisted with a reason.
- No static English remains in non-English locales except brand names, user content, historical/generated AI content, source excerpts, provider names, emails, IDs, and intentional technical labels.

## Assumptions
- “All apps” means `apps/web`, `apps/mobile`, `apps/admin`, and `apps/chatgpt-app`.
- Admin/internal tooling should be localized too, even though it is lower priority than user-facing web/mobile.
- Static in-repo translations are acceptable for this pass; professional translation review can follow.
- AI-generated content should continue using the user’s selected language for new generations, but saved historical outputs are not retroactively translated.
