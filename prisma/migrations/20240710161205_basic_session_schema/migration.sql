-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "videoURL" TEXT,
    "serverRecordingId" TEXT,
    "respondentId" TEXT NOT NULL,
    "revisionId" TEXT NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KeyMoment" (
    "id" TEXT NOT NULL,
    "time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,

    CONSTRAINT "KeyMoment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TranscriptionSegment" (
    "id" TEXT NOT NULL,
    "time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "text" TEXT NOT NULL,
    "moderator" BOOLEAN,
    "speakerId" TEXT,
    "sessionId" TEXT NOT NULL,

    CONSTRAINT "TranscriptionSegment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Session_serverRecordingId_key" ON "Session"("serverRecordingId");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_respondentId_fkey" FOREIGN KEY ("respondentId") REFERENCES "Respondent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "Revision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KeyMoment" ADD CONSTRAINT "KeyMoment_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TranscriptionSegment" ADD CONSTRAINT "TranscriptionSegment_speakerId_fkey" FOREIGN KEY ("speakerId") REFERENCES "Respondent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TranscriptionSegment" ADD CONSTRAINT "TranscriptionSegment_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
