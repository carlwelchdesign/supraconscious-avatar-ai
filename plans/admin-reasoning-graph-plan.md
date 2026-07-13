# Admin Reasoning Graph, Built In-House

## Summary
Build an admin-only, InfraNodus-inspired reasoning graph for Maria/source materials without using InfraNodus services. The graph maps approved source chunks into concept networks, clusters, bridge concepts, structural gaps, and source-backed reasoning paths so admins can inspect what the corpus actually supports before any future GraphRAG use.

## Key Changes
- Add durable reasoning graph tables for runs, nodes, edges, clusters, insights, and source evidence links.
- Add a deterministic graph builder in the AI package that extracts concepts from approved source chunks, creates weighted co-occurrence edges, computes graph metrics, detects clusters, and proposes structural gap questions.
- Add AI-assisted interpretation only as an optional layer; deterministic graph structure and source evidence come first.
- Add an admin `/reasoning-graph` page with a corpus selector, generate action, graph canvas, cluster sidebar, selected node/edge evidence detail, and gaps/bridge insights.
- Keep admin UI English-only and keep the graph admin-only for v1.

## Test Plan
- AI tests cover stable node/edge generation, edge weight accumulation, metric persistence shape, gap candidates, and evidence requirements.
- Admin tests cover page/action helpers, status handling, and audit-safe metadata.
- Verification: AI/admin tests, typecheck, lint, admin build, and local smoke at `/reasoning-graph`.

## Assumptions
- Maria’s materials are represented by the existing approved `SourceDocument`, `SourceSection`, and `SourceChunk` corpus.
- The first version validates and explores the material; it does not change public AI responses.
- Approved graph neighborhoods can feed future GraphRAG after explicit review.
