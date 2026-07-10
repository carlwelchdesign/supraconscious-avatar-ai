# Guide Stage CMS Integration Plan

## Summary
Make `/admin/guide-stages` a real CMS surface for the user-facing guide/avatar stage experience. The web app will read active `AvatarStageConfig` records from the database, fall back to built-in defaults for any missing stage, and use admin-managed copy across the guide page, dashboard/sidebar labels, journal workspace, and saved journal pages.

## Key Changes
- Add a shared guide-stage config helper with built-in defaults for stages 1-5 and database merge behavior.
- Store extra CMS fields in `AvatarStageConfig.metadata`: `trait`, `guideEyebrow`, `guideTitle`, `guideTitleEmphasis`, `guideIntro`, `timelineTitle`, `currentLabel`, and `completedLabel`.
- Expand `/admin/guide-stages` into a CMS editor for all visible guide-stage copy.
- Wire the web app to use CMS-backed stage names, descriptions, traits, and guide-page copy.
- Keep numeric stage progression and AI prompt-stage constants unchanged.

## Test Plan
- Helper tests cover missing DB config, partial overrides, inactive rows, invalid stage normalization, and metadata fallback.
- Admin tests cover saving CMS metadata and audit-safe fields.
- Web checks verify guide, dashboard/sidebar, journal workspace, and saved journal views use CMS-backed stage labels.
- Run `test:admin`, `test:web`, `typecheck`, `lint`, `build:web`, and `build:admin`.

## Assumptions
- Implement from current `main`.
- No schema migration; use existing `metadata`.
- CMS controls visible guide-stage copy, not progression thresholds or AI generation behavior.
