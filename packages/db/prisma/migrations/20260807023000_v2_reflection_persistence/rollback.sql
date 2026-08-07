-- Manual rollback for FCA-023. Run only after confirming no V2 data must be retained.
-- No legacy table or row is modified by either direction.

ALTER TABLE "GenerationTrace" DROP CONSTRAINT IF EXISTS "GenerationTrace_reflectionSessionId_fkey";
ALTER TABLE "QualityReview" DROP CONSTRAINT IF EXISTS "QualityReview_reflectionSessionId_fkey";
ALTER TABLE "PilotEvent" DROP CONSTRAINT IF EXISTS "PilotEvent_reflectionSessionId_fkey";

DROP TABLE IF EXISTS "CuratedPromptAssignment";
DROP TABLE IF EXISTS "CuratedPromptDimension";
DROP TABLE IF EXISTS "CuratedPrompt";
DROP TABLE IF EXISTS "ReflectionCorrection";
DROP TABLE IF EXISTS "ReflectionCapacityProfile";
DROP TABLE IF EXISTS "GuideSynthesis";
DROP TABLE IF EXISTS "DimensionReflection";
DROP TABLE IF EXISTS "ReflectionSession";
DROP TABLE IF EXISTS "DoctrineVersion";

ALTER TABLE "GenerationTrace" DROP COLUMN IF EXISTS "reflectionSessionId";
ALTER TABLE "QualityReview" DROP COLUMN IF EXISTS "reflectionSessionId";
ALTER TABLE "PilotEvent" DROP COLUMN IF EXISTS "reflectionSessionId";
