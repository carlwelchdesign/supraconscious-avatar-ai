-- Pilot readiness: cohorting, consent, privacy-safe events, feedback, quality review, and safety review.

ALTER TABLE "SafetyEvent"
  ADD COLUMN "reviewStatus" TEXT NOT NULL DEFAULT 'unreviewed',
  ADD COLUMN "reviewerId" TEXT,
  ADD COLUMN "reviewReason" TEXT,
  ADD COLUMN "resolvedAt" TIMESTAMP(3);

CREATE TABLE "PilotCohort" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "description" TEXT,
  "startsAt" TIMESTAMP(3),
  "endsAt" TIMESTAMP(3),
  "createdById" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PilotCohort_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PilotEnrollment" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "pilotCohortId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'invited',
  "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "startedAt" TIMESTAMP(3),
  "completedFirstSessionAt" TIMESTAMP(3),
  "removedAt" TIMESTAMP(3),
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PilotEnrollment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PilotEvent" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "journalEntryId" TEXT,
  "councilSessionId" TEXT,
  "eventName" TEXT NOT NULL,
  "eventVersion" INTEGER NOT NULL DEFAULT 1,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "properties" JSONB,
  "inputHash" TEXT,
  "sourceMode" TEXT,
  "safetySeverity" TEXT,
  "featureFlags" JSONB,
  "requestId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PilotEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ConsentEvent" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "consentType" TEXT NOT NULL,
  "consentVersion" TEXT NOT NULL,
  "granted" BOOLEAN NOT NULL DEFAULT true,
  "reason" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ConsentEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "QualityReview" (
  "id" TEXT NOT NULL,
  "reviewerId" TEXT NOT NULL,
  "councilSessionId" TEXT,
  "generationTraceId" TEXT,
  "targetType" TEXT NOT NULL DEFAULT 'CouncilSession',
  "label" TEXT NOT NULL,
  "severity" TEXT NOT NULL DEFAULT 'normal',
  "reason" TEXT NOT NULL,
  "metadata" JSONB,
  "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "QualityReview_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CouncilSessionFeedback" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "councilSessionId" TEXT NOT NULL,
  "feedbackType" TEXT NOT NULL,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CouncilSessionFeedback_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SafetyEvent_reviewStatus_idx" ON "SafetyEvent"("reviewStatus");
CREATE INDEX "SafetyEvent_reviewerId_idx" ON "SafetyEvent"("reviewerId");
CREATE INDEX "PilotCohort_status_idx" ON "PilotCohort"("status");
CREATE INDEX "PilotCohort_createdById_idx" ON "PilotCohort"("createdById");
CREATE UNIQUE INDEX "PilotEnrollment_userId_pilotCohortId_key" ON "PilotEnrollment"("userId", "pilotCohortId");
CREATE INDEX "PilotEnrollment_userId_idx" ON "PilotEnrollment"("userId");
CREATE INDEX "PilotEnrollment_pilotCohortId_idx" ON "PilotEnrollment"("pilotCohortId");
CREATE INDEX "PilotEnrollment_status_idx" ON "PilotEnrollment"("status");
CREATE INDEX "PilotEvent_userId_idx" ON "PilotEvent"("userId");
CREATE INDEX "PilotEvent_journalEntryId_idx" ON "PilotEvent"("journalEntryId");
CREATE INDEX "PilotEvent_councilSessionId_idx" ON "PilotEvent"("councilSessionId");
CREATE INDEX "PilotEvent_eventName_idx" ON "PilotEvent"("eventName");
CREATE INDEX "PilotEvent_occurredAt_idx" ON "PilotEvent"("occurredAt");
CREATE INDEX "ConsentEvent_userId_idx" ON "ConsentEvent"("userId");
CREATE INDEX "ConsentEvent_consentType_idx" ON "ConsentEvent"("consentType");
CREATE INDEX "ConsentEvent_createdAt_idx" ON "ConsentEvent"("createdAt");
CREATE INDEX "QualityReview_reviewerId_idx" ON "QualityReview"("reviewerId");
CREATE INDEX "QualityReview_councilSessionId_idx" ON "QualityReview"("councilSessionId");
CREATE INDEX "QualityReview_generationTraceId_idx" ON "QualityReview"("generationTraceId");
CREATE INDEX "QualityReview_label_idx" ON "QualityReview"("label");
CREATE INDEX "QualityReview_severity_idx" ON "QualityReview"("severity");
CREATE INDEX "CouncilSessionFeedback_userId_idx" ON "CouncilSessionFeedback"("userId");
CREATE INDEX "CouncilSessionFeedback_councilSessionId_idx" ON "CouncilSessionFeedback"("councilSessionId");
CREATE INDEX "CouncilSessionFeedback_feedbackType_idx" ON "CouncilSessionFeedback"("feedbackType");

ALTER TABLE "SafetyEvent" ADD CONSTRAINT "SafetyEvent_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PilotCohort" ADD CONSTRAINT "PilotCohort_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PilotEnrollment" ADD CONSTRAINT "PilotEnrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PilotEnrollment" ADD CONSTRAINT "PilotEnrollment_pilotCohortId_fkey" FOREIGN KEY ("pilotCohortId") REFERENCES "PilotCohort"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PilotEvent" ADD CONSTRAINT "PilotEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PilotEvent" ADD CONSTRAINT "PilotEvent_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "JournalEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PilotEvent" ADD CONSTRAINT "PilotEvent_councilSessionId_fkey" FOREIGN KEY ("councilSessionId") REFERENCES "CouncilSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ConsentEvent" ADD CONSTRAINT "ConsentEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QualityReview" ADD CONSTRAINT "QualityReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QualityReview" ADD CONSTRAINT "QualityReview_councilSessionId_fkey" FOREIGN KEY ("councilSessionId") REFERENCES "CouncilSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QualityReview" ADD CONSTRAINT "QualityReview_generationTraceId_fkey" FOREIGN KEY ("generationTraceId") REFERENCES "GenerationTrace"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CouncilSessionFeedback" ADD CONSTRAINT "CouncilSessionFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CouncilSessionFeedback" ADD CONSTRAINT "CouncilSessionFeedback_councilSessionId_fkey" FOREIGN KEY ("councilSessionId") REFERENCES "CouncilSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
