# Guide Stage Translation Admin Plan

## Summary
Allow admins to provide localized copy for the five guide stages. Store translations in the existing guide-stage metadata JSON so no database migration is required.

## Scope
- Add language-aware guide-stage config resolution with English fallback.
- Add admin form fields for English, Spanish, Greek, French, German, and Simplified Chinese.
- Preserve existing English stage columns for backwards compatibility.
- Use selected user language in web and mobile guide-stage readers.
- Add tests for localized stage metadata and fallback behavior.

## Verification
- AI package tests.
- Web tests and typecheck.
- Admin typecheck.
