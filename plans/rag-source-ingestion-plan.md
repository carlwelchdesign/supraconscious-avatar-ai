# RAG Source Ingestion Plan

## Summary
Maria's materials are not ingested as one flat text pile. The corpus is split into structured curriculum content, product doctrine/spec material, and manuscript source chunks with provenance and review states.

## Source Types
- Monthly curriculum docs: parsed into `CurriculumDay` objects with month, day, theme, quote, frame of thought, and Socratic question.
- Product doctrine docs: parsed into small semantic sections for concepts such as Observer, Inner Council, Embodiment Gate, Avatar Intelligence, and Becoming Loop.
- Manuscripts: parsed into page/section-aware chunks for retrieval grounding.
- Images: registered as source assets with rights/use metadata.

## Lifecycle States
- `imported`: extracted, not trusted.
- `parsed`: structure detected.
- `needs_review`: extraction, rights, duplication, or safety issue needs review.
- `approved`: available for internal retrieval.
- `approved_curriculum`: safe for direct product display.
- `deprecated`: superseded by a newer source.
- `blocked`: excluded from generation and display.

## Retrieval Rules
- Retrieve only approved source chunks.
- Prefer paraphrase over direct quotation.
- Direct quotes require explicit quote approval metadata.
- High-risk safety states bypass symbolic retrieval.
- Generation traces store selected chunks, scores, prompt version, model, and output.

## First Implementation
1. Add source registry models.
2. Add deterministic monthly curriculum parser.
3. Add source/chunk models and basic import script.
4. Add admin source review surface.
5. Wire approved context into council generation behind `rag_enabled`.
