# Content/RAG Governance Phase Plan

## Summary
Build policy-first RAG, not vector search yet. Maria's source material must become safely importable, reviewable, rights-aware, traceable, and ready for later embeddings. Keep `rag_enabled` off by default until source approval, retrieval policy, and eval gates are reliable.

## Key Changes
- Add deterministic source import and provenance with import batches, parser metadata, checksums, counts, and failure reporting.
- Add source rights governance with structured rights grants, approval reasons, allowed uses, quote permissions, reviewer metadata, and revocation fields.
- Extend admin source review to chunk-level inspection and audited updates for review state, quote permission, tags, safety intensity, and rights eligibility.
- Replace direct approved-source lookup with a rights-aware `retrieveCouncilContext()` service that returns selected chunks, match reasons, allowed use, source policy version, and ranks.
- Add citation validation so council outputs only cite retrieved chunks and unsupported source claims are removed or downgraded.
- Add user-facing provenance in journal results, with source titles and quote-safe excerpts only when approved for display.
- Add pattern memory feedback controls for helpful, not accurate, too intense, hide, and restore.

## Test Plan
- Import tests for stable checksums, duplicate avoidance, monthly curriculum parsing, and failed/skipped reporting.
- Retrieval tests for blocked, deprecated, needs-review, rights-missing, and quote-restricted chunks.
- Council/RAG tests for citation validation, single Integrator question, unsupported-claim handling, and complete generation traces.
- Admin/user tests for required review reasons, audit logs, pattern feedback, hide/restore behavior, and journal source provenance.
- Release checks: Prisma validate/generate, AI tests, web/admin typecheck and lint, web/admin builds, and ChatGPT app tests.

## Assumptions
- No vector DB or embeddings in this phase.
- Full user export/delete/consent ledger is deferred; source rights, audit, retrieval policy, and traceability are in scope.
- Manuscripts are registered before retrieval approval.
- `rag_enabled` remains off until review and eval gates pass.
