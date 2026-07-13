# GraphRAG Runtime Integration Plan

## Summary

Turn the current admin reasoning graph and approved ontology into a real GraphRAG layer for Inner Council generation. Use the existing Postgres/source corpus/ontology stack for this slice, not a new graph database or Microsoft GraphRAG pipeline yet. Approved ontology neighborhoods should help the AI reason across Maria's materials while every user-facing claim remains source-backed, traceable, feature-flagged, and reviewable.

## Key Changes

- Keep graph generation and ontology curation admin-only; only approved ontology records may enter runtime AI prompts.
- Upgrade ontology retrieval from simple term matching into a GraphRAG context builder that starts from journal text plus analysis signals, retrieves approved concepts/clusters/outcomes/evidence, expands approved relationship hops, ranks paths, and returns compact context plus trace metadata.
- Integrate GraphRAG into council generation behind `ontology_rag_enabled`, preserving existing `rag_enabled` source retrieval as the baseline.
- Boost or supplement source retrieval with ontology evidence chunk IDs, then pass both source context and GraphRAG context into council generation.
- Extend prompt/runtime validation so source citations still reference approved retrieved chunks and no unreviewed graph candidates enter public responses.
- Write ontology retrieval traces and include GraphRAG metadata in existing RAG events/review surfaces.

## Interfaces And Data

- Add AI package types for `GraphRagContext`, `GraphRagConcept`, `GraphRagRelationship`, `GraphRagPath`, and `GraphRagRetrievalTrace`.
- Extend council generation options with optional `graphRagContext`.
- Extend source retrieval helpers with source chunk ID boosting for ontology evidence.
- Keep `ontology_rag_enabled` defaulted to `false`.

## Test Plan

- AI retrieval tests cover disabled behavior, approved-only records, relationship-hop expansion, path ranking, evidence source chunk IDs, and deduplication.
- Council tests cover prompt payload behavior, fallback on ontology retrieval failure, high-safety omission, and existing source citation enforcement.
- Trace/review tests cover ontology retrieval `GenerationTrace` data and admin labels for ontology-assisted sessions.
- Verification: AI tests/typecheck, admin typecheck/lint, web typecheck, web build, and local smoke with `rag_enabled=true` and `ontology_rag_enabled=true`.

## Assumptions

- Use current Postgres, Prisma, approved source chunks, and approved ontology tables.
- Do not introduce Neo4j, Microsoft GraphRAG, or another graph database in this slice.
- GraphRAG is runtime assistance only after admin curation; generated graph runs remain drafts.
- Public AI responses remain source-grounded, multilingual, safety-aware, and privacy-preserving.
