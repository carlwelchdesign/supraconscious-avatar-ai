# Internal RAG Activation Phase Plan

## Summary
Activate policy-first RAG for the internal pilot only, using the already approved product-doctrine allowlist. This phase flips `rag_enabled` only through the activation gate, validates source-grounded council runs end to end, and adds monitoring and rollback controls before any broader user or source expansion.

## Key Changes
- Preserve branch hygiene: keep unrelated dirty files untouched, including root `package.json`, `docs/setup-and-deployment.md`, root `scripts/`, and `sources/`.
- Activate narrow RAG with approved product-doctrine chunks only.
- Keep July curriculum as Threshold display content, not retrieval chunks unless explicitly chunked and reviewed later.
- Keep manuscripts and external manuscript PDFs blocked and unretrievable.
- Run the existing RAG activation gate with current eval metadata and rollback criteria before setting `rag_enabled=true`.
- Do not enable vector DB, embeddings, broad source retrieval, direct quote display, or manuscript retrieval.
- Add a small internal RAG smoke report for Inner Council, Embodiment Gate, architecture-of-self, and no-source fallback cases.
- Confirm `sourceMode=rag` only when eligible chunks are selected, no-source fallback remains clear, retrieval traces are recorded, and citations remain limited to selected chunks.
- Extend admin readiness and pilot monitoring with activation metadata, RAG/no-source rate, unsupported-source reports, retrieval trace count, selected source titles, and rollback criteria.
- Add a clear super-admin rollback path to set `rag_enabled=false`.
- Keep live and saved session provenance source-grounded only when approved chunks were selected.
- Update the pilot runbook with RAG activation checklist, smoke prompts, rollback criteria, daily monitoring, and unsupported-source handling.

## Public Interfaces And Types
- Reuse `retrieveCouncilContext()`, `GenerationTrace`, `CouncilSession.sourceMode`, `runPilotLaunchReadiness()`, and `runPilotIterationReport()`.
- Add `activatePolicyFirstRag()` and `rollbackPolicyFirstRag()` so admin actions and operational scripts share one activation gate.
- Add `runInternalRagSmoke()` returning `{ passed, cases, selectedSources, noSourceCases, failedCases }`.
- Use existing `FeatureFlag` and `AuditLog` for activation and rollback state.
- No new major schema models are planned.

## Test Plan
- `rag_enabled=false` still produces `sourceMode=none` and no retrieval.
- After activation, matching internal pilot entries produce `sourceMode=rag` and selected approved product-doctrine chunks.
- Non-matching entries produce `sourceMode=no_eligible_source` with no misleading provenance.
- Blocked manuscripts, external PDFs, missing-rights chunks, sensitive chunks for medium safety, and unapproved chunks are not retrieved.
- Retrieved citations are limited to selected chunk ids.
- Unsupported-source feedback appears in the pilot quality queue.
- RAG rollback disables retrieval immediately.
- Release checks: Prisma validate/generate, AI tests, RAG evals, pilot evals, launch readiness, pilot iteration report, web/admin/ChatGPT typechecks, targeted lint, web/admin/ChatGPT builds.

## Assumptions
- Activation is internal pilot only.
- Initial RAG source scope is approved product doctrine only.
- Direct quote display remains off unless both rights and chunk quote safety explicitly allow it.
- Manuscripts remain blocked.
- Vector search, embeddings, broad Maria source retrieval, external beta, dynamic council roles, and ChatGPT parity remain out of scope.
