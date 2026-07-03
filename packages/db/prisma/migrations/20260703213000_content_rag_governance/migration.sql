-- AlterTable
ALTER TABLE "SourceDocument" ADD COLUMN     "importBatchId" TEXT;

-- CreateTable
CREATE TABLE "SourceImportBatch" (
    "id" TEXT NOT NULL,
    "initiatedById" TEXT,
    "sourceRoot" TEXT NOT NULL,
    "parserVersion" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "importedCount" INTEGER NOT NULL DEFAULT 0,
    "skippedCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "errorLog" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "SourceImportBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SourceRightsGrant" (
    "id" TEXT NOT NULL,
    "sourceDocumentId" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "grantType" TEXT NOT NULL DEFAULT 'provided_by_owner',
    "allowedUses" JSONB NOT NULL,
    "quoteAllowed" BOOLEAN NOT NULL DEFAULT false,
    "attributionRequired" BOOLEAN NOT NULL DEFAULT false,
    "attributionText" TEXT,
    "status" TEXT NOT NULL DEFAULT 'needs_review',
    "reviewerId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "reason" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SourceRightsGrant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SourceImportBatch_status_idx" ON "SourceImportBatch"("status");

-- CreateIndex
CREATE INDEX "SourceImportBatch_initiatedById_idx" ON "SourceImportBatch"("initiatedById");

-- CreateIndex
CREATE INDEX "SourceImportBatch_createdAt_idx" ON "SourceImportBatch"("createdAt");

-- CreateIndex
CREATE INDEX "SourceRightsGrant_sourceDocumentId_idx" ON "SourceRightsGrant"("sourceDocumentId");

-- CreateIndex
CREATE INDEX "SourceRightsGrant_status_idx" ON "SourceRightsGrant"("status");

-- CreateIndex
CREATE INDEX "SourceRightsGrant_reviewerId_idx" ON "SourceRightsGrant"("reviewerId");

-- CreateIndex
CREATE INDEX "SourceDocument_importBatchId_idx" ON "SourceDocument"("importBatchId");

-- AddForeignKey
ALTER TABLE "SourceDocument" ADD CONSTRAINT "SourceDocument_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "SourceImportBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceImportBatch" ADD CONSTRAINT "SourceImportBatch_initiatedById_fkey" FOREIGN KEY ("initiatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceRightsGrant" ADD CONSTRAINT "SourceRightsGrant_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "SourceDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
