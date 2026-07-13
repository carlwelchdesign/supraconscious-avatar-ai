# Reasoning Ontology Corpus Hygiene Plan

## Summary
Fix the ontology architecture so `/reasoning-ontology` represents curated Maria material, not every approved source in the system. The current issue is real: `Carl` appears because the graph generator defaults to `all approved sources`, including product-doctrine docs that contain founder/app examples. The fix is to add first-class corpus scoping, filter non-domain entities, expose source provenance in candidates, and supersede contaminated graph runs.

## Key Changes
- Add `SourceDocument.reasoningScope` with values: `maria_materials`, `product_doctrine`, `curriculum`, `reference_only`, and `excluded`.
- Backfill existing docs conservatively: manuscript to `maria_materials`, product doctrine to `product_doctrine`, curriculum to `curriculum`, and image/external to `excluded`.
- Update admin Sources so admins can change a document's reasoning scope with an audit reason.
- Default `/reasoning-graph` generation to `maria_materials`, not all approved sources.
- Keep explicit non-default graph scopes, but label them clearly.
- Exclude founder/admin/person terms, emails, timestamps, and noisy file/date labels from graph concepts and connected relationships.
- Show source provenance on ontology candidates and prevent non-Maria or noisy candidates from being promoted by accident.
- Supersede contaminated historical graph runs rather than deleting evidence.

## Test Plan
- AI tests for concept exclusion and graph edge filtering.
- Admin/type tests for source reasoning scope updates and candidate promotion guards.
- Verify graph generation defaults to `maria_materials`.
- Run AI tests/typecheck and admin typecheck/lint.

## Assumptions
- Product-doctrine docs remain available for product architecture review, but are not part of the default Maria ontology.
- Current noisy graph runs should be preserved as superseded audit history.
- The ontology should be strict: questionable candidates should be excluded before promotion.
