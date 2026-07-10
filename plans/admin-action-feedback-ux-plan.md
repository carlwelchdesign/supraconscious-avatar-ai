# Admin Action Feedback UX Plan

## Summary
Improve admin server-action feedback across review/CMS pages without adding global state management. Use the existing Next.js server-action pattern, but make actions visibly pending, success/error feedback local enough to notice, and validation requirements clearer. Do not add Zustand or Redux for this; durable data already lives in the database and these are form submissions, not cross-route client state.

## Key Changes
- Add reusable admin form UX primitives:
  - `AdminStatusBanner` for success/error messages near the page heading.
  - `SubmitButton` client component using `useFormStatus()` for disabled/pending states.
  - compact `InlineActionHelp` text for forms with non-obvious required fields.
- Fix `/admin/sources` action feedback:
  - Make rights grant requirements explicit.
  - Default-check `paraphrase_generation` for new rights grants.
  - Redirect source actions with stable anchors.
  - Show richer rights grant rows.
- Normalize high-use admin server-action UX with pending-aware submit buttons.
- Preserve current server-action, audit, validation, and redirect patterns.

## Public Interfaces And Types
- Add shared admin UI components under `apps/admin/src/components/`.
- No database schema changes.
- No API changes.
- No Zustand/Redux.
- No changes to source approval policy, rights validation, RAG eligibility, or audit logging.

## Test Plan
- Source rights form invalid and saved states are visible.
- Rights grant rows show allowed uses and review metadata clearly.
- Submit buttons show pending labels and disable during submission.
- Status banners render for both `status` and `actionStatus` where compatibility is needed.
- Regression checks: `test:admin`, `typecheck`, `lint`, `build:admin`.

## Assumptions
- The core problem is missing visible action feedback, not missing global state management.
- Server actions remain the right pattern for admin/CMS-style mutations.
- Zustand should stay reserved for transient multi-step client flows.
