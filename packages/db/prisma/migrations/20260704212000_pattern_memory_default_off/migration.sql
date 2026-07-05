-- Pattern memory is an explicit opt-in privacy setting.
ALTER TABLE "User" ALTER COLUMN "patternMemoryEnabled" SET DEFAULT false;

-- Older rows may have inherited the previous default without a consent ledger event.
-- Keep memory enabled only when the latest pattern-memory consent is an explicit grant.
UPDATE "User" AS u
SET "patternMemoryEnabled" = false
WHERE u."patternMemoryEnabled" = true
  AND NOT EXISTS (
    SELECT 1
    FROM "ConsentEvent" AS c
    WHERE c."userId" = u."id"
      AND c."consentType" = 'pattern_memory'
      AND c."consentVersion" = 'pilot-readiness-v1'
      AND c."granted" = true
      AND c."createdAt" = (
        SELECT MAX(c2."createdAt")
        FROM "ConsentEvent" AS c2
        WHERE c2."userId" = u."id"
          AND c2."consentType" = 'pattern_memory'
      )
  );
