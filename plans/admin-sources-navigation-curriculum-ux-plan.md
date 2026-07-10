# Admin Sources Navigation And Curriculum Review UX Plan

## Summary
Improve `/admin/sources` so it behaves like a usable CMS/review workspace instead of a long undifferentiated page. The immediate fixes are: make page sections easy to jump between, make curriculum preview honest about how many records exist, and provide filters so admins can review the full year without being misled by the current first-40 display cap.

## Key Changes
- Add a sticky in-page section nav near the top of `/admin/sources` for overview, import batches, source documents, chunk review, and curriculum preview.
- Add clearer section summaries explaining document-level review, rights review, chunk/content review, and curriculum review.
- Replace the hardcoded first-40 curriculum preview with URL-driven filters for month, publish state, and limit.
- Show displayed and matching curriculum counts so capped previews are explicit.
- Preserve existing server actions, reason requirements, audit behavior, and DB-backed state.

## Test Plan
- Admin sources page renders section nav and all anchors target the correct sections.
- Curriculum preview shows correct total/displayed counts and no longer implies only 40 days exist.
- Month, publish-state, and limit filters work through query params.
- Curriculum save redirects back to `#curriculum-preview` and preserves active filters.
- Existing document, rights grant, and chunk actions still submit correctly.
- Run `test:admin`, `typecheck`, `lint`, and `build:admin`.

## Assumptions
- This belongs on the existing admin feedback PR branch.
- The imported curriculum data is valid; the Month 2 Day 9 cutoff was caused by the previous `take: 40`.
- URL query params are the right state mechanism for this admin page.
