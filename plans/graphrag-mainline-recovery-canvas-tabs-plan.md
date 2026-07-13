# GraphRAG Mainline Recovery + Graph Canvas Tabs

## Summary

Recover the GraphRAG runtime work onto current `main`, then improve the admin reasoning graph visualization so the three graph views are shown as tabs instead of stacked canvases. Increase canvas height and make the primary Network 1 view easier to read with cluster-colored nodes and stronger connecting threads.

## Key Changes

- Reapply GraphRAG runtime commit `f1350f5` so `main` includes `GraphRagContext`, ontology evidence source boosting, council prompt context, `ontology_retrieval` traces, and admin Council Review visibility.
- Keep `ontology_rag_enabled` disabled by default.
- Replace stacked graph canvases with `Network 1`, `Network 2`, and `Network 3` tabs that render one canvas at a time.
- Increase canvas height for a more review-friendly admin surface.
- Improve Network 1 with stronger cluster-based node colors and more prominent edge threads scaled by edge weight/confidence.

## Test Plan

- `yarn workspace @inner-avatar/ai test`
- `yarn workspace @inner-avatar/ai typecheck`
- `yarn workspace @inner-avatar/admin typecheck`
- `yarn workspace @inner-avatar/admin lint`
- `yarn workspace @inner-avatar/web typecheck`
- `yarn build:web`
- Local smoke of `/reasoning-graph` to confirm tabs, one active canvas, taller canvas, stronger Network 1 colors/edges, and node selection.

## Assumptions

- The three graph tabs represent the existing top three connected components.
- Network 1 should receive the strongest visual treatment first.
- Admin remains English-only.
