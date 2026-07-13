# Reasoning Ontology + GraphRAG Plan

## Summary
Evolve the admin reasoning graph from generated graph-run history into a curated reasoning ontology for Maria's materials. Generated graph runs remain draft analysis; approved ontology records become the durable source of truth for future GraphRAG-style reasoning.

## Key Changes
- Add durable ontology models for concepts, relationships, clusters, stakeholder outcomes, and source evidence.
- Add structured AI proposal support for typed relationships, gaps, bridges, and stakeholder paths with strict evidence validation.
- Add admin curation actions to promote graph nodes, graph edges, graph clusters, and graph insights into approved ontology records.
- Add an admin ontology page showing approved concepts, relationships, clusters, outcomes, and candidates from the latest graph run.
- Add feature-flagged ontology retrieval helpers for future council/journal prompts, without changing public AI responses yet.

## Test Plan
- AI tests for typed proposal validation and approved ontology retrieval gating.
- Admin typecheck/lint/build and local smoke for ontology curation.
- Web tests/typecheck/build to confirm public flows are unchanged.

## Assumptions
- V1 remains admin-only for generation and curation.
- Only approved ontology records can be retrieved for future AI context.
- Generated graph records are candidates, not canonical ontology.
