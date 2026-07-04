CREATE TABLE "VoiceUsageBucket" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VoiceUsageBucket_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "VoiceUsageBucket_userId_scope_windowStart_key" ON "VoiceUsageBucket"("userId", "scope", "windowStart");
CREATE INDEX "VoiceUsageBucket_scope_windowStart_idx" ON "VoiceUsageBucket"("scope", "windowStart");
CREATE INDEX "VoiceUsageBucket_userId_idx" ON "VoiceUsageBucket"("userId");

ALTER TABLE "VoiceUsageBucket" ADD CONSTRAINT "VoiceUsageBucket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
