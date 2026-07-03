# RAG Activation Gate Phase Plan

## Summary
Activate policy-first RAG only after hardening keyword retrieval, source approval invariants, quote safety, eval gates, and admin readiness workflow. This phase does not add embeddings/vector DB. `rag_enabled` remains false by default and can only be enabled through a dedicated readiness process after approved-source evals pass.

## Key Changes
- Upgrade keyword retrieval with deterministic scoring, matched terms, matched fields, rank, allowed use, and source policy version.
- Centralize source eligibility checks for document state, chunk state, rights grant status, allowed uses, expiry/revocation, quote permission, attribution, and safety intensity.
- Fix source mode semantics: use `rag` only when eligible chunks are selected; use `none` or `no_eligible_source` otherwise.
- Gate direct quote display on both chunk `quote_safe` and an approved rights grant with `direct_quote_display` plus `quoteAllowed=true`.
- Harden admin chunk approval and RAG activation with server-side readiness checks, reasons, super-admin requirement, and audit logs.
- Add section-aware product doctrine import, keyword-RAG eval runner, admin readiness dashboard, saved-entry source provenance, and clearer provenance/feedback copy.

## Test Plan
- Policy/retrieval tests for approved, blocked, deprecated, missing-rights, revoked, expired, sensitive-medium, quote-restricted, and quote-display cases.
- Journal/RAG tests for flag off/on behavior, no eligible source trace, high-risk bypass, medium safety filtering, and citation limiting.
- Admin/governance tests for chunk approval guards and super-admin RAG activation guards.
- UI/review tests for live and saved provenance, readiness blockers, trace review metadata, and pattern feedback confirmation copy.
- Release checks: Prisma validate/generate, AI tests and RAG eval runner, web/admin typecheck and lint, web/admin builds, ChatGPT app tests.

## Assumptions
- Retrieval remains keyword-based in this phase.
- `rag_enabled` remains false until readiness and eval gates pass.
- Initial RAG allowlist is product doctrine only; manuscripts remain registered but unretrievable.
- Direct quote display is off unless rights grant and chunk permission explicitly allow it.
- Existing dirty root/deployment/source files are unrelated and must not be staged.
