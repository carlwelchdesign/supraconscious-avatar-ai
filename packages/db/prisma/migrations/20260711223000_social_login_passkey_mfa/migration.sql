ALTER TABLE "Session" ADD COLUMN "authMethod" TEXT NOT NULL DEFAULT 'password';
ALTER TABLE "Session" ADD COLUMN "mfaVerifiedAt" TIMESTAMP(3);
ALTER TABLE "Session" ADD COLUMN "mfaMethod" TEXT;

CREATE TABLE "OAuthAccount" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "emailVerified" BOOLEAN NOT NULL DEFAULT false,
  "profile" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OAuthAccount_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WebAuthnCredential" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "credentialId" TEXT NOT NULL,
  "publicKey" BYTEA NOT NULL,
  "counter" BIGINT NOT NULL DEFAULT 0,
  "transports" TEXT[],
  "deviceLabel" TEXT NOT NULL,
  "backedUp" BOOLEAN NOT NULL DEFAULT false,
  "credentialDeviceType" TEXT,
  "lastUsedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WebAuthnCredential_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PendingAuthChallenge" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "tokenHash" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "scope" TEXT NOT NULL DEFAULT 'web',
  "authMethod" TEXT,
  "challenge" TEXT NOT NULL,
  "redirectTo" TEXT NOT NULL DEFAULT '/dashboard',
  "metadata" JSONB,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PendingAuthChallenge_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RecoveryCode" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "codeHash" TEXT NOT NULL,
  "usedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RecoveryCode_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OAuthAccount_provider_providerAccountId_key" ON "OAuthAccount"("provider", "providerAccountId");
CREATE INDEX "OAuthAccount_userId_idx" ON "OAuthAccount"("userId");
CREATE INDEX "OAuthAccount_provider_email_idx" ON "OAuthAccount"("provider", "email");

CREATE UNIQUE INDEX "WebAuthnCredential_credentialId_key" ON "WebAuthnCredential"("credentialId");
CREATE INDEX "WebAuthnCredential_userId_idx" ON "WebAuthnCredential"("userId");
CREATE INDEX "WebAuthnCredential_lastUsedAt_idx" ON "WebAuthnCredential"("lastUsedAt");

CREATE UNIQUE INDEX "PendingAuthChallenge_tokenHash_key" ON "PendingAuthChallenge"("tokenHash");
CREATE INDEX "PendingAuthChallenge_userId_idx" ON "PendingAuthChallenge"("userId");
CREATE INDEX "PendingAuthChallenge_type_idx" ON "PendingAuthChallenge"("type");
CREATE INDEX "PendingAuthChallenge_expiresAt_idx" ON "PendingAuthChallenge"("expiresAt");
CREATE INDEX "PendingAuthChallenge_usedAt_idx" ON "PendingAuthChallenge"("usedAt");

CREATE UNIQUE INDEX "RecoveryCode_codeHash_key" ON "RecoveryCode"("codeHash");
CREATE INDEX "RecoveryCode_userId_idx" ON "RecoveryCode"("userId");
CREATE INDEX "RecoveryCode_usedAt_idx" ON "RecoveryCode"("usedAt");

ALTER TABLE "OAuthAccount" ADD CONSTRAINT "OAuthAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WebAuthnCredential" ADD CONSTRAINT "WebAuthnCredential_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PendingAuthChallenge" ADD CONSTRAINT "PendingAuthChallenge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RecoveryCode" ADD CONSTRAINT "RecoveryCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
