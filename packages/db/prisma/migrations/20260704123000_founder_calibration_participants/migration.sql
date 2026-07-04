CREATE TABLE "FounderCalibrationParticipant" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "userId" TEXT,
  "participantRole" TEXT NOT NULL DEFAULT 'other_founder',
  "status" TEXT NOT NULL DEFAULT 'active',
  "addedById" TEXT,
  "reason" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "FounderCalibrationParticipant_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FounderCalibrationParticipant_email_key" ON "FounderCalibrationParticipant"("email");
CREATE INDEX "FounderCalibrationParticipant_email_idx" ON "FounderCalibrationParticipant"("email");
CREATE INDEX "FounderCalibrationParticipant_userId_idx" ON "FounderCalibrationParticipant"("userId");
CREATE INDEX "FounderCalibrationParticipant_participantRole_idx" ON "FounderCalibrationParticipant"("participantRole");
CREATE INDEX "FounderCalibrationParticipant_status_idx" ON "FounderCalibrationParticipant"("status");
CREATE INDEX "FounderCalibrationParticipant_addedById_idx" ON "FounderCalibrationParticipant"("addedById");

ALTER TABLE "FounderCalibrationParticipant" ADD CONSTRAINT "FounderCalibrationParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FounderCalibrationParticipant" ADD CONSTRAINT "FounderCalibrationParticipant_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
