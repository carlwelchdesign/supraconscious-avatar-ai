-- Repository query-pattern indexes identified by the database audit.
-- CONCURRENTLY keeps reads and writes available while PostgreSQL builds each index.
-- Keep concurrent creation isolated from any index-retirement operation so Prisma
-- can execute this migration outside a transaction as PostgreSQL requires.

CREATE INDEX CONCURRENTLY "Session_userId_lastSeenAt_idx"
  ON "Session"("userId", "lastSeenAt");

CREATE INDEX CONCURRENTLY "JournalEntry_userId_createdAt_idx"
  ON "JournalEntry"("userId", "createdAt");

CREATE INDEX CONCURRENTLY "GeneratedPrompt_journalEntryId_idx"
  ON "GeneratedPrompt"("journalEntryId");

CREATE INDEX CONCURRENTLY "PatternMemory_userId_active_idx"
  ON "PatternMemory"("userId", "active");

CREATE INDEX CONCURRENTLY "PatternMemory_journalEntryId_idx"
  ON "PatternMemory"("journalEntryId");

CREATE INDEX CONCURRENTLY "CouncilSession_userId_createdAt_idx"
  ON "CouncilSession"("userId", "createdAt");

CREATE INDEX CONCURRENTLY "ConsentEvent_userId_consentType_createdAt_idx"
  ON "ConsentEvent"("userId", "consentType", "createdAt");

CREATE INDEX CONCURRENTLY "CuratedPrompt_approvedById_idx"
  ON "CuratedPrompt"("approvedById");

CREATE INDEX CONCURRENTLY "SourceDocument_importedById_idx"
  ON "SourceDocument"("importedById");

CREATE INDEX CONCURRENTLY "CurriculumDay_sourceDocumentId_idx"
  ON "CurriculumDay"("sourceDocumentId");

CREATE INDEX CONCURRENTLY "CurriculumDay_month_publishState_day_idx"
  ON "CurriculumDay"("month", "publishState", "day");

CREATE INDEX CONCURRENTLY "GenerationTrace_councilSessionId_traceType_createdAt_idx"
  ON "GenerationTrace"("councilSessionId", "traceType", "createdAt");

CREATE INDEX CONCURRENTLY "GenerationTrace_sourceChunkId_idx"
  ON "GenerationTrace"("sourceChunkId");

CREATE INDEX CONCURRENTLY "SafetyEvent_reviewStatus_createdAt_idx"
  ON "SafetyEvent"("reviewStatus", "createdAt");

CREATE INDEX CONCURRENTLY "SafetyEvent_journalEntryId_idx"
  ON "SafetyEvent"("journalEntryId");

CREATE INDEX CONCURRENTLY "Subscription_userId_updatedAt_idx"
  ON "Subscription"("userId", "updatedAt");
