-- FCA-023: additive V2 reflection persistence.
-- Legacy Council, persona-stage, and generated-prompt records are intentionally untouched.

CREATE TABLE "DoctrineVersion" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "contentChecksum" TEXT NOT NULL,
    "approvalState" TEXT NOT NULL DEFAULT 'pending',
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "supersededAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DoctrineVersion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReflectionSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "journalEntryId" TEXT NOT NULL,
    "doctrineVersionId" TEXT NOT NULL,
    "capacityProfileVersion" INTEGER,
    "responseMode" TEXT NOT NULL DEFAULT 'guide',
    "status" TEXT NOT NULL DEFAULT 'completed',
    "safetySnapshot" JSONB NOT NULL,
    "selectorVersion" TEXT,
    "selectionPolicy" TEXT,
    "disabledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ReflectionSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DimensionReflection" (
    "id" TEXT NOT NULL,
    "reflectionSessionId" TEXT NOT NULL,
    "dimension" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL,
    "depth" INTEGER NOT NULL,
    "reasonCodes" JSONB NOT NULL,
    "evidenceRefs" JSONB NOT NULL,
    "observationText" TEXT,
    "tentativeInterpretation" TEXT,
    "evidenceSpans" JSONB,
    "confidence" DOUBLE PRECISION,
    "epistemicStatus" TEXT NOT NULL DEFAULT 'selected',
    "abstained" BOOLEAN NOT NULL DEFAULT false,
    "abstainReason" TEXT,
    "sourceChunkIds" JSONB,
    "disabledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DimensionReflection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GuideSynthesis" (
    "id" TEXT NOT NULL,
    "reflectionSessionId" TEXT NOT NULL,
    "guideName" TEXT NOT NULL DEFAULT 'Supraconscious Guide',
    "guideVersion" TEXT NOT NULL,
    "synthesisStatement" TEXT NOT NULL,
    "socraticQuestion" TEXT NOT NULL,
    "embodimentInvitation" TEXT,
    "sourceChunkIds" JSONB,
    "validationStatus" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "GuideSynthesis_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReflectionCapacityProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "doctrineVersionId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "noticingEvidence" JSONB,
    "storyFactEvidence" JSONB,
    "protectionEvidence" JSONB,
    "personaAwarenessEvidence" JSONB,
    "possibilityEvidence" JSONB,
    "consciousChoiceEvidence" JSONB,
    "embodimentEvidence" JSONB,
    "preferredDirectness" TEXT NOT NULL DEFAULT 'standard',
    "paused" BOOLEAN NOT NULL DEFAULT false,
    "simplified" BOOLEAN NOT NULL DEFAULT false,
    "rubricVersion" TEXT NOT NULL,
    "lastCorrectionAt" TIMESTAMP(3),
    "disabledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ReflectionCapacityProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReflectionCorrection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reflectionSessionId" TEXT,
    "dimension" TEXT,
    "correctionType" TEXT NOT NULL,
    "note" TEXT,
    "appliedAt" TIMESTAMP(3),
    "disabledAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ReflectionCorrection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CuratedPrompt" (
    "id" TEXT NOT NULL,
    "stableKey" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "modality" TEXT NOT NULL,
    "publicTitle" TEXT,
    "publicText" TEXT NOT NULL,
    "internalTechniqueName" TEXT,
    "sourceDocumentId" TEXT,
    "sourceWork" TEXT,
    "sourceLocator" TEXT,
    "rightsState" TEXT NOT NULL DEFAULT 'needs_review',
    "approvalState" TEXT NOT NULL DEFAULT 'pending',
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "safetyIntensity" TEXT NOT NULL DEFAULT 'low',
    "contraindications" JSONB,
    "language" TEXT NOT NULL DEFAULT 'en',
    "translationStatus" TEXT NOT NULL DEFAULT 'source',
    "active" BOOLEAN NOT NULL DEFAULT false,
    "supersededAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CuratedPrompt_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CuratedPromptDimension" (
    "id" TEXT NOT NULL,
    "curatedPromptId" TEXT NOT NULL,
    "dimension" TEXT NOT NULL,
    CONSTRAINT "CuratedPromptDimension_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CuratedPromptAssignment" (
    "id" TEXT NOT NULL,
    "reflectionSessionId" TEXT NOT NULL,
    "curatedPromptId" TEXT NOT NULL,
    "selectionReasonCode" TEXT NOT NULL,
    "selectedDimensions" JSONB NOT NULL,
    "safetyDecision" JSONB NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'selected',
    "userResponse" TEXT,
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CuratedPromptAssignment_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "PilotEvent" ADD COLUMN "reflectionSessionId" TEXT;
ALTER TABLE "QualityReview" ADD COLUMN "reflectionSessionId" TEXT;
ALTER TABLE "GenerationTrace" ADD COLUMN "reflectionSessionId" TEXT;

CREATE UNIQUE INDEX "DoctrineVersion_version_key" ON "DoctrineVersion"("version");
CREATE UNIQUE INDEX "DoctrineVersion_contentChecksum_key" ON "DoctrineVersion"("contentChecksum");
CREATE INDEX "DoctrineVersion_approvalState_idx" ON "DoctrineVersion"("approvalState");
CREATE INDEX "DoctrineVersion_approvedById_idx" ON "DoctrineVersion"("approvedById");
CREATE UNIQUE INDEX "ReflectionSession_journalEntryId_key" ON "ReflectionSession"("journalEntryId");
CREATE INDEX "ReflectionSession_userId_idx" ON "ReflectionSession"("userId");
CREATE INDEX "ReflectionSession_doctrineVersionId_idx" ON "ReflectionSession"("doctrineVersionId");
CREATE INDEX "ReflectionSession_status_idx" ON "ReflectionSession"("status");
CREATE INDEX "ReflectionSession_createdAt_idx" ON "ReflectionSession"("createdAt");
CREATE UNIQUE INDEX "DimensionReflection_reflectionSessionId_dimension_key" ON "DimensionReflection"("reflectionSessionId", "dimension");
CREATE UNIQUE INDEX "DimensionReflection_reflectionSessionId_displayOrder_key" ON "DimensionReflection"("reflectionSessionId", "displayOrder");
CREATE INDEX "DimensionReflection_dimension_idx" ON "DimensionReflection"("dimension");
CREATE INDEX "DimensionReflection_epistemicStatus_idx" ON "DimensionReflection"("epistemicStatus");
CREATE UNIQUE INDEX "GuideSynthesis_reflectionSessionId_key" ON "GuideSynthesis"("reflectionSessionId");
CREATE INDEX "GuideSynthesis_guideVersion_idx" ON "GuideSynthesis"("guideVersion");
CREATE INDEX "GuideSynthesis_validationStatus_idx" ON "GuideSynthesis"("validationStatus");
CREATE UNIQUE INDEX "ReflectionCapacityProfile_userId_key" ON "ReflectionCapacityProfile"("userId");
CREATE INDEX "ReflectionCapacityProfile_doctrineVersionId_idx" ON "ReflectionCapacityProfile"("doctrineVersionId");
CREATE INDEX "ReflectionCapacityProfile_disabledAt_idx" ON "ReflectionCapacityProfile"("disabledAt");
CREATE INDEX "ReflectionCorrection_userId_idx" ON "ReflectionCorrection"("userId");
CREATE INDEX "ReflectionCorrection_reflectionSessionId_idx" ON "ReflectionCorrection"("reflectionSessionId");
CREATE INDEX "ReflectionCorrection_dimension_idx" ON "ReflectionCorrection"("dimension");
CREATE INDEX "ReflectionCorrection_correctionType_idx" ON "ReflectionCorrection"("correctionType");
CREATE INDEX "ReflectionCorrection_deletedAt_idx" ON "ReflectionCorrection"("deletedAt");
CREATE UNIQUE INDEX "CuratedPrompt_stableKey_version_key" ON "CuratedPrompt"("stableKey", "version");
CREATE INDEX "CuratedPrompt_sourceDocumentId_idx" ON "CuratedPrompt"("sourceDocumentId");
CREATE INDEX "CuratedPrompt_modality_idx" ON "CuratedPrompt"("modality");
CREATE INDEX "CuratedPrompt_approvalState_idx" ON "CuratedPrompt"("approvalState");
CREATE INDEX "CuratedPrompt_active_idx" ON "CuratedPrompt"("active");
CREATE UNIQUE INDEX "CuratedPromptDimension_curatedPromptId_dimension_key" ON "CuratedPromptDimension"("curatedPromptId", "dimension");
CREATE INDEX "CuratedPromptDimension_dimension_idx" ON "CuratedPromptDimension"("dimension");
CREATE INDEX "CuratedPromptAssignment_reflectionSessionId_idx" ON "CuratedPromptAssignment"("reflectionSessionId");
CREATE INDEX "CuratedPromptAssignment_curatedPromptId_idx" ON "CuratedPromptAssignment"("curatedPromptId");
CREATE INDEX "CuratedPromptAssignment_state_idx" ON "CuratedPromptAssignment"("state");
CREATE INDEX "PilotEvent_reflectionSessionId_idx" ON "PilotEvent"("reflectionSessionId");
CREATE INDEX "QualityReview_reflectionSessionId_idx" ON "QualityReview"("reflectionSessionId");
CREATE INDEX "GenerationTrace_reflectionSessionId_idx" ON "GenerationTrace"("reflectionSessionId");

ALTER TABLE "DoctrineVersion" ADD CONSTRAINT "DoctrineVersion_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ReflectionSession" ADD CONSTRAINT "ReflectionSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReflectionSession" ADD CONSTRAINT "ReflectionSession_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "JournalEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReflectionSession" ADD CONSTRAINT "ReflectionSession_doctrineVersionId_fkey" FOREIGN KEY ("doctrineVersionId") REFERENCES "DoctrineVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DimensionReflection" ADD CONSTRAINT "DimensionReflection_reflectionSessionId_fkey" FOREIGN KEY ("reflectionSessionId") REFERENCES "ReflectionSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GuideSynthesis" ADD CONSTRAINT "GuideSynthesis_reflectionSessionId_fkey" FOREIGN KEY ("reflectionSessionId") REFERENCES "ReflectionSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReflectionCapacityProfile" ADD CONSTRAINT "ReflectionCapacityProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReflectionCapacityProfile" ADD CONSTRAINT "ReflectionCapacityProfile_doctrineVersionId_fkey" FOREIGN KEY ("doctrineVersionId") REFERENCES "DoctrineVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ReflectionCorrection" ADD CONSTRAINT "ReflectionCorrection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReflectionCorrection" ADD CONSTRAINT "ReflectionCorrection_reflectionSessionId_fkey" FOREIGN KEY ("reflectionSessionId") REFERENCES "ReflectionSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CuratedPrompt" ADD CONSTRAINT "CuratedPrompt_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "SourceDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CuratedPrompt" ADD CONSTRAINT "CuratedPrompt_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CuratedPromptDimension" ADD CONSTRAINT "CuratedPromptDimension_curatedPromptId_fkey" FOREIGN KEY ("curatedPromptId") REFERENCES "CuratedPrompt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CuratedPromptAssignment" ADD CONSTRAINT "CuratedPromptAssignment_reflectionSessionId_fkey" FOREIGN KEY ("reflectionSessionId") REFERENCES "ReflectionSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CuratedPromptAssignment" ADD CONSTRAINT "CuratedPromptAssignment_curatedPromptId_fkey" FOREIGN KEY ("curatedPromptId") REFERENCES "CuratedPrompt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PilotEvent" ADD CONSTRAINT "PilotEvent_reflectionSessionId_fkey" FOREIGN KEY ("reflectionSessionId") REFERENCES "ReflectionSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "QualityReview" ADD CONSTRAINT "QualityReview_reflectionSessionId_fkey" FOREIGN KEY ("reflectionSessionId") REFERENCES "ReflectionSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GenerationTrace" ADD CONSTRAINT "GenerationTrace_reflectionSessionId_fkey" FOREIGN KEY ("reflectionSessionId") REFERENCES "ReflectionSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
