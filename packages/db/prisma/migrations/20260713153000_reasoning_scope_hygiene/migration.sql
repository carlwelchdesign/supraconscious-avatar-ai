-- Add explicit reasoning corpus scope separate from source type/retrieval eligibility.
ALTER TABLE "SourceDocument" ADD COLUMN "reasoningScope" TEXT NOT NULL DEFAULT 'excluded';

UPDATE "SourceDocument"
SET "reasoningScope" = CASE
  WHEN "sourceType" = 'manuscript' THEN 'maria_materials'
  WHEN "sourceType" = 'product_doctrine' THEN 'product_doctrine'
  WHEN "sourceType" = 'curriculum' THEN 'curriculum'
  ELSE 'excluded'
END;

CREATE INDEX "SourceDocument_reasoningScope_idx" ON "SourceDocument"("reasoningScope");

-- Preserve contaminated candidate history, but prevent broad all-source runs from powering ontology curation by default.
UPDATE "ReasoningGraphRun"
SET "status" = 'superseded',
    "metadata" = COALESCE("metadata", '{}'::jsonb) || jsonb_build_object(
      'supersededBy', 'reasoning-scope-hygiene',
      'supersededReason', 'All-source graph run included excluded founder/person concepts.'
    )
WHERE "status" = 'completed'
  AND "sourceScope" IN ('approved_sources', 'all')
  AND EXISTS (
    SELECT 1
    FROM "ReasoningGraphNode"
    WHERE "ReasoningGraphNode"."runId" = "ReasoningGraphRun"."id"
      AND lower("ReasoningGraphNode"."label") IN ('carl', 'maria')
  );
