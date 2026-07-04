CREATE TABLE "AuthRateLimitBucket" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "scope" TEXT NOT NULL,
    "bucketKey" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuthRateLimitBucket_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AuthRateLimitBucket_scope_bucketKey_windowStart_key" ON "AuthRateLimitBucket"("scope", "bucketKey", "windowStart");
CREATE INDEX "AuthRateLimitBucket_scope_windowStart_idx" ON "AuthRateLimitBucket"("scope", "windowStart");
CREATE INDEX "AuthRateLimitBucket_userId_idx" ON "AuthRateLimitBucket"("userId");

ALTER TABLE "AuthRateLimitBucket" ADD CONSTRAINT "AuthRateLimitBucket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
