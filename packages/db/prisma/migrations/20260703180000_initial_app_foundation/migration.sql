-- Baseline tables that existed before the Inner Council migration history.
-- This migration is defensive because some early environments were created with
-- db push before checked-in migrations existed.

CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL DEFAULT '',
  "name" TEXT,
  "role" TEXT NOT NULL DEFAULT 'user',
  "emailVerified" BOOLEAN NOT NULL DEFAULT false,
  "avatarTone" TEXT NOT NULL DEFAULT 'balanced',
  "intensityLevel" INTEGER NOT NULL DEFAULT 3,
  "currentLevel" INTEGER NOT NULL DEFAULT 1,
  "avatarStage" INTEGER NOT NULL DEFAULT 1,
  "safetyModeEnabled" BOOLEAN NOT NULL DEFAULT true,
  "patternMemoryEnabled" BOOLEAN NOT NULL DEFAULT false,
  "onboardingComplete" BOOLEAN NOT NULL DEFAULT false,
  "topicsToAvoid" JSONB,
  "voiceEnabled" BOOLEAN NOT NULL DEFAULT false,
  "voiceAutoPlay" BOOLEAN NOT NULL DEFAULT false,
  "voiceInputDefault" TEXT NOT NULL DEFAULT 'text',
  "voiceGender" TEXT NOT NULL DEFAULT 'female',
  "voiceStyle" TEXT NOT NULL DEFAULT 'warm',
  "voiceSpeed" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Session" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "scope" TEXT NOT NULL DEFAULT 'web',
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AuditLog" (
  "id" TEXT NOT NULL,
  "actorId" TEXT,
  "action" TEXT NOT NULL,
  "targetType" TEXT,
  "targetId" TEXT,
  "reason" TEXT,
  "metadata" JSONB,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PromptTemplate" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "content" TEXT NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PromptTemplate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "FeatureFlag" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "description" TEXT,
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FeatureFlag_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AvatarStageConfig" (
  "id" TEXT NOT NULL,
  "stage" INTEGER NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AvatarStageConfig_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "JournalEntry" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "rawText" TEXT NOT NULL,
  "inputMode" TEXT NOT NULL DEFAULT 'text',
  "isDraft" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "JournalEntry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "EntryAnalysis" (
  "id" TEXT NOT NULL,
  "journalEntryId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "emotionalSignals" JSONB NOT NULL,
  "languageMarkers" JSONB NOT NULL,
  "behavioralPatterns" JSONB NOT NULL,
  "contradictionSignals" JSONB,
  "avoidanceSignals" JSONB,
  "intensityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "suggestedLevel" INTEGER NOT NULL DEFAULT 1,
  "safetyFlags" JSONB NOT NULL,
  "summary" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EntryAnalysis_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AvatarResponse" (
  "id" TEXT NOT NULL,
  "journalEntryId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "openingLine" TEXT,
  "mirror" TEXT,
  "patternName" TEXT,
  "contradiction" TEXT,
  "socraticQuestion" TEXT,
  "integrationStep" TEXT,
  "closingLine" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AvatarResponse_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "GeneratedPrompt" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "journalEntryId" TEXT,
  "level" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "context" TEXT NOT NULL,
  "materials" TEXT,
  "execution" TEXT NOT NULL,
  "integration" TEXT NOT NULL,
  "targetPattern" TEXT,
  "userResponse" TEXT,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GeneratedPrompt_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PatternMemory" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "journalEntryId" TEXT,
  "patternType" TEXT NOT NULL,
  "patternLabel" TEXT NOT NULL,
  "evidenceCount" INTEGER NOT NULL DEFAULT 1,
  "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "examples" JSONB,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PatternMemory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "SafetyEvent" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "journalEntryId" TEXT,
  "severity" TEXT NOT NULL,
  "flags" JSONB NOT NULL,
  "recommendedAction" TEXT,
  "resolved" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SafetyEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Subscription" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "stripeCustomerId" TEXT,
  "stripeSubscriptionId" TEXT,
  "stripePriceId" TEXT,
  "plan" TEXT NOT NULL DEFAULT 'free',
  "status" TEXT NOT NULL DEFAULT 'inactive',
  "currentPeriodStart" TIMESTAMP(3),
  "currentPeriodEnd" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "Session_tokenHash_key" ON "Session"("tokenHash");
CREATE INDEX IF NOT EXISTS "Session_userId_idx" ON "Session"("userId");
CREATE INDEX IF NOT EXISTS "Session_scope_idx" ON "Session"("scope");
CREATE INDEX IF NOT EXISTS "Session_expiresAt_idx" ON "Session"("expiresAt");
CREATE INDEX IF NOT EXISTS "AuditLog_actorId_idx" ON "AuditLog"("actorId");
CREATE INDEX IF NOT EXISTS "AuditLog_action_idx" ON "AuditLog"("action");
CREATE INDEX IF NOT EXISTS "AuditLog_targetType_targetId_idx" ON "AuditLog"("targetType", "targetId");
CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
CREATE UNIQUE INDEX IF NOT EXISTS "PromptTemplate_key_key" ON "PromptTemplate"("key");
CREATE INDEX IF NOT EXISTS "PromptTemplate_active_idx" ON "PromptTemplate"("active");
CREATE INDEX IF NOT EXISTS "PromptTemplate_createdById_idx" ON "PromptTemplate"("createdById");
CREATE UNIQUE INDEX IF NOT EXISTS "FeatureFlag_key_key" ON "FeatureFlag"("key");
CREATE INDEX IF NOT EXISTS "FeatureFlag_enabled_idx" ON "FeatureFlag"("enabled");
CREATE UNIQUE INDEX IF NOT EXISTS "AvatarStageConfig_stage_key" ON "AvatarStageConfig"("stage");
CREATE INDEX IF NOT EXISTS "AvatarStageConfig_active_idx" ON "AvatarStageConfig"("active");
CREATE INDEX IF NOT EXISTS "JournalEntry_userId_idx" ON "JournalEntry"("userId");
CREATE INDEX IF NOT EXISTS "JournalEntry_createdAt_idx" ON "JournalEntry"("createdAt");
CREATE UNIQUE INDEX IF NOT EXISTS "EntryAnalysis_journalEntryId_key" ON "EntryAnalysis"("journalEntryId");
CREATE INDEX IF NOT EXISTS "EntryAnalysis_userId_idx" ON "EntryAnalysis"("userId");
CREATE INDEX IF NOT EXISTS "EntryAnalysis_createdAt_idx" ON "EntryAnalysis"("createdAt");
CREATE UNIQUE INDEX IF NOT EXISTS "AvatarResponse_journalEntryId_key" ON "AvatarResponse"("journalEntryId");
CREATE INDEX IF NOT EXISTS "AvatarResponse_userId_idx" ON "AvatarResponse"("userId");
CREATE INDEX IF NOT EXISTS "AvatarResponse_createdAt_idx" ON "AvatarResponse"("createdAt");
CREATE INDEX IF NOT EXISTS "GeneratedPrompt_userId_idx" ON "GeneratedPrompt"("userId");
CREATE INDEX IF NOT EXISTS "GeneratedPrompt_createdAt_idx" ON "GeneratedPrompt"("createdAt");
CREATE INDEX IF NOT EXISTS "PatternMemory_userId_idx" ON "PatternMemory"("userId");
CREATE INDEX IF NOT EXISTS "PatternMemory_patternType_idx" ON "PatternMemory"("patternType");
CREATE INDEX IF NOT EXISTS "PatternMemory_lastSeenAt_idx" ON "PatternMemory"("lastSeenAt");
CREATE INDEX IF NOT EXISTS "SafetyEvent_userId_idx" ON "SafetyEvent"("userId");
CREATE INDEX IF NOT EXISTS "SafetyEvent_severity_idx" ON "SafetyEvent"("severity");
CREATE INDEX IF NOT EXISTS "SafetyEvent_createdAt_idx" ON "SafetyEvent"("createdAt");
CREATE UNIQUE INDEX IF NOT EXISTS "Subscription_stripeCustomerId_key" ON "Subscription"("stripeCustomerId");
CREATE UNIQUE INDEX IF NOT EXISTS "Subscription_stripeSubscriptionId_key" ON "Subscription"("stripeSubscriptionId");
CREATE INDEX IF NOT EXISTS "Subscription_userId_idx" ON "Subscription"("userId");
CREATE INDEX IF NOT EXISTS "Subscription_stripeCustomerId_idx" ON "Subscription"("stripeCustomerId");

DO $$ BEGIN
  ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "PromptTemplate" ADD CONSTRAINT "PromptTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "EntryAnalysis" ADD CONSTRAINT "EntryAnalysis_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "JournalEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "EntryAnalysis" ADD CONSTRAINT "EntryAnalysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "AvatarResponse" ADD CONSTRAINT "AvatarResponse_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "JournalEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "AvatarResponse" ADD CONSTRAINT "AvatarResponse_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "GeneratedPrompt" ADD CONSTRAINT "GeneratedPrompt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "GeneratedPrompt" ADD CONSTRAINT "GeneratedPrompt_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "JournalEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "PatternMemory" ADD CONSTRAINT "PatternMemory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "PatternMemory" ADD CONSTRAINT "PatternMemory_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "JournalEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "SafetyEvent" ADD CONSTRAINT "SafetyEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "SafetyEvent" ADD CONSTRAINT "SafetyEvent_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "JournalEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
