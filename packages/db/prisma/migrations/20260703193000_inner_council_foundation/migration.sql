-- CreateTable
CREATE TABLE "PatternMemoryFeedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "patternMemoryId" TEXT NOT NULL,
    "feedbackType" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PatternMemoryFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CouncilSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "journalEntryId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "observerSignal" JSONB NOT NULL,
    "safetySnapshot" JSONB NOT NULL,
    "sourceMode" TEXT NOT NULL DEFAULT 'none',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CouncilSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CouncilMessage" (
    "id" TEXT NOT NULL,
    "councilSessionId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "lens" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "evidence" JSONB,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "riskLevel" TEXT NOT NULL DEFAULT 'low',
    "abstained" BOOLEAN NOT NULL DEFAULT false,
    "abstainReason" TEXT,
    "sourceChunkIds" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CouncilMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CouncilSynthesis" (
    "id" TEXT NOT NULL,
    "councilSessionId" TEXT NOT NULL,
    "guideName" TEXT NOT NULL DEFAULT 'Supraconscious Guide',
    "openingLine" TEXT,
    "coreTension" TEXT,
    "integratorQuestion" TEXT NOT NULL,
    "integrationStep" TEXT NOT NULL,
    "closingLine" TEXT,
    "sourceChunkIds" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CouncilSynthesis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmbodimentGateResponse" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "journalEntryId" TEXT,
    "councilSessionId" TEXT,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmbodimentGateResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SourceDocument" (
    "id" TEXT NOT NULL,
    "importedById" TEXT,
    "title" TEXT NOT NULL,
    "author" TEXT,
    "work" TEXT,
    "sourceType" TEXT NOT NULL,
    "filePath" TEXT,
    "checksum" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "rightsStatus" TEXT NOT NULL DEFAULT 'needs_review',
    "reviewState" TEXT NOT NULL DEFAULT 'imported',
    "metadata" JSONB,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SourceDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SourceSection" (
    "id" TEXT NOT NULL,
    "sourceDocumentId" TEXT NOT NULL,
    "headingPath" JSONB,
    "sectionType" TEXT NOT NULL DEFAULT 'section',
    "pageStart" INTEGER,
    "pageEnd" INTEGER,
    "paragraphStart" INTEGER,
    "paragraphEnd" INTEGER,
    "canonicalText" TEXT NOT NULL,
    "reviewState" TEXT NOT NULL DEFAULT 'parsed',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SourceSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SourceChunk" (
    "id" TEXT NOT NULL,
    "sourceDocumentId" TEXT NOT NULL,
    "sourceSectionId" TEXT,
    "chunkText" TEXT NOT NULL,
    "quoteSafeExcerpt" TEXT,
    "tokenCount" INTEGER NOT NULL DEFAULT 0,
    "chunkKind" TEXT NOT NULL DEFAULT 'semantic',
    "sourcePriority" INTEGER NOT NULL DEFAULT 0,
    "conceptTags" JSONB,
    "councilRoleTags" JSONB,
    "safetyIntensity" TEXT NOT NULL DEFAULT 'normal',
    "quotePermission" TEXT NOT NULL DEFAULT 'paraphrase_only',
    "reviewState" TEXT NOT NULL DEFAULT 'parsed',
    "embedding" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SourceChunk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CurriculumDay" (
    "id" TEXT NOT NULL,
    "sourceDocumentId" TEXT,
    "month" INTEGER NOT NULL,
    "day" INTEGER NOT NULL,
    "theme" TEXT NOT NULL,
    "title" TEXT,
    "quote" TEXT,
    "frameOfThought" TEXT NOT NULL,
    "socraticQuestion" TEXT NOT NULL,
    "publishState" TEXT NOT NULL DEFAULT 'needs_review',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CurriculumDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GenerationTrace" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "councilSessionId" TEXT,
    "sourceChunkId" TEXT,
    "traceType" TEXT NOT NULL,
    "model" TEXT,
    "promptVersion" TEXT,
    "inputHash" TEXT,
    "outputJson" JSONB,
    "validationStatus" TEXT NOT NULL DEFAULT 'unreviewed',
    "latencyMs" INTEGER,
    "tokenUsage" JSONB,
    "fallbackReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GenerationTrace_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PatternMemoryFeedback_userId_idx" ON "PatternMemoryFeedback"("userId");

-- CreateIndex
CREATE INDEX "PatternMemoryFeedback_patternMemoryId_idx" ON "PatternMemoryFeedback"("patternMemoryId");

-- CreateIndex
CREATE INDEX "PatternMemoryFeedback_feedbackType_idx" ON "PatternMemoryFeedback"("feedbackType");

-- CreateIndex
CREATE UNIQUE INDEX "CouncilSession_journalEntryId_key" ON "CouncilSession"("journalEntryId");

-- CreateIndex
CREATE INDEX "CouncilSession_userId_idx" ON "CouncilSession"("userId");

-- CreateIndex
CREATE INDEX "CouncilSession_status_idx" ON "CouncilSession"("status");

-- CreateIndex
CREATE INDEX "CouncilSession_createdAt_idx" ON "CouncilSession"("createdAt");

-- CreateIndex
CREATE INDEX "CouncilMessage_councilSessionId_idx" ON "CouncilMessage"("councilSessionId");

-- CreateIndex
CREATE INDEX "CouncilMessage_role_idx" ON "CouncilMessage"("role");

-- CreateIndex
CREATE UNIQUE INDEX "CouncilSynthesis_councilSessionId_key" ON "CouncilSynthesis"("councilSessionId");

-- CreateIndex
CREATE INDEX "EmbodimentGateResponse_userId_idx" ON "EmbodimentGateResponse"("userId");

-- CreateIndex
CREATE INDEX "EmbodimentGateResponse_journalEntryId_idx" ON "EmbodimentGateResponse"("journalEntryId");

-- CreateIndex
CREATE INDEX "EmbodimentGateResponse_councilSessionId_idx" ON "EmbodimentGateResponse"("councilSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "SourceDocument_checksum_key" ON "SourceDocument"("checksum");

-- CreateIndex
CREATE INDEX "SourceDocument_sourceType_idx" ON "SourceDocument"("sourceType");

-- CreateIndex
CREATE INDEX "SourceDocument_reviewState_idx" ON "SourceDocument"("reviewState");

-- CreateIndex
CREATE INDEX "SourceDocument_rightsStatus_idx" ON "SourceDocument"("rightsStatus");

-- CreateIndex
CREATE INDEX "SourceSection_sourceDocumentId_idx" ON "SourceSection"("sourceDocumentId");

-- CreateIndex
CREATE INDEX "SourceSection_sectionType_idx" ON "SourceSection"("sectionType");

-- CreateIndex
CREATE INDEX "SourceSection_reviewState_idx" ON "SourceSection"("reviewState");

-- CreateIndex
CREATE INDEX "SourceChunk_sourceDocumentId_idx" ON "SourceChunk"("sourceDocumentId");

-- CreateIndex
CREATE INDEX "SourceChunk_sourceSectionId_idx" ON "SourceChunk"("sourceSectionId");

-- CreateIndex
CREATE INDEX "SourceChunk_reviewState_idx" ON "SourceChunk"("reviewState");

-- CreateIndex
CREATE INDEX "SourceChunk_chunkKind_idx" ON "SourceChunk"("chunkKind");

-- CreateIndex
CREATE INDEX "CurriculumDay_publishState_idx" ON "CurriculumDay"("publishState");

-- CreateIndex
CREATE INDEX "CurriculumDay_theme_idx" ON "CurriculumDay"("theme");

-- CreateIndex
CREATE UNIQUE INDEX "CurriculumDay_month_day_key" ON "CurriculumDay"("month", "day");

-- CreateIndex
CREATE INDEX "GenerationTrace_userId_idx" ON "GenerationTrace"("userId");

-- CreateIndex
CREATE INDEX "GenerationTrace_councilSessionId_idx" ON "GenerationTrace"("councilSessionId");

-- CreateIndex
CREATE INDEX "GenerationTrace_traceType_idx" ON "GenerationTrace"("traceType");

-- CreateIndex
CREATE INDEX "GenerationTrace_validationStatus_idx" ON "GenerationTrace"("validationStatus");

-- AddForeignKey
ALTER TABLE "PatternMemoryFeedback" ADD CONSTRAINT "PatternMemoryFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatternMemoryFeedback" ADD CONSTRAINT "PatternMemoryFeedback_patternMemoryId_fkey" FOREIGN KEY ("patternMemoryId") REFERENCES "PatternMemory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouncilSession" ADD CONSTRAINT "CouncilSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouncilSession" ADD CONSTRAINT "CouncilSession_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "JournalEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouncilMessage" ADD CONSTRAINT "CouncilMessage_councilSessionId_fkey" FOREIGN KEY ("councilSessionId") REFERENCES "CouncilSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouncilSynthesis" ADD CONSTRAINT "CouncilSynthesis_councilSessionId_fkey" FOREIGN KEY ("councilSessionId") REFERENCES "CouncilSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmbodimentGateResponse" ADD CONSTRAINT "EmbodimentGateResponse_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmbodimentGateResponse" ADD CONSTRAINT "EmbodimentGateResponse_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "JournalEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmbodimentGateResponse" ADD CONSTRAINT "EmbodimentGateResponse_councilSessionId_fkey" FOREIGN KEY ("councilSessionId") REFERENCES "CouncilSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceDocument" ADD CONSTRAINT "SourceDocument_importedById_fkey" FOREIGN KEY ("importedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceSection" ADD CONSTRAINT "SourceSection_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "SourceDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceChunk" ADD CONSTRAINT "SourceChunk_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "SourceDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceChunk" ADD CONSTRAINT "SourceChunk_sourceSectionId_fkey" FOREIGN KEY ("sourceSectionId") REFERENCES "SourceSection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurriculumDay" ADD CONSTRAINT "CurriculumDay_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "SourceDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GenerationTrace" ADD CONSTRAINT "GenerationTrace_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GenerationTrace" ADD CONSTRAINT "GenerationTrace_councilSessionId_fkey" FOREIGN KEY ("councilSessionId") REFERENCES "CouncilSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GenerationTrace" ADD CONSTRAINT "GenerationTrace_sourceChunkId_fkey" FOREIGN KEY ("sourceChunkId") REFERENCES "SourceChunk"("id") ON DELETE SET NULL ON UPDATE CASCADE;
