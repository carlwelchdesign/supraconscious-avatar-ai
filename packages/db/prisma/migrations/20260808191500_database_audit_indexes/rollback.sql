-- Run only after the redundant-index retirement rollback has restored the
-- original prefix indexes and query plans no longer depend on these indexes.
-- CONCURRENTLY avoids blocking normal table reads and writes while dropping them.

DROP INDEX CONCURRENTLY IF EXISTS "Session_userId_lastSeenAt_idx";
DROP INDEX CONCURRENTLY IF EXISTS "JournalEntry_userId_createdAt_idx";
DROP INDEX CONCURRENTLY IF EXISTS "GeneratedPrompt_journalEntryId_idx";
DROP INDEX CONCURRENTLY IF EXISTS "PatternMemory_userId_active_idx";
DROP INDEX CONCURRENTLY IF EXISTS "PatternMemory_journalEntryId_idx";
DROP INDEX CONCURRENTLY IF EXISTS "CouncilSession_userId_createdAt_idx";
DROP INDEX CONCURRENTLY IF EXISTS "ConsentEvent_userId_consentType_createdAt_idx";
DROP INDEX CONCURRENTLY IF EXISTS "CuratedPrompt_approvedById_idx";
DROP INDEX CONCURRENTLY IF EXISTS "SourceDocument_importedById_idx";
DROP INDEX CONCURRENTLY IF EXISTS "CurriculumDay_sourceDocumentId_idx";
DROP INDEX CONCURRENTLY IF EXISTS "CurriculumDay_month_publishState_day_idx";
DROP INDEX CONCURRENTLY IF EXISTS "GenerationTrace_councilSessionId_traceType_createdAt_idx";
DROP INDEX CONCURRENTLY IF EXISTS "GenerationTrace_sourceChunkId_idx";
DROP INDEX CONCURRENTLY IF EXISTS "SafetyEvent_reviewStatus_createdAt_idx";
DROP INDEX CONCURRENTLY IF EXISTS "SafetyEvent_journalEntryId_idx";
DROP INDEX CONCURRENTLY IF EXISTS "Subscription_userId_updatedAt_idx";
