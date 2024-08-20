/*
  Warnings:

  - You are about to drop the column `storageLocationId` on the `SessionRecording` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "SessionRecording" DROP COLUMN "storageLocationId";

-- CreateTable
CREATE TABLE "SessionClip" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "offset" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "recordingId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,

    CONSTRAINT "SessionClip_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SessionClip" ADD CONSTRAINT "SessionClip_recordingId_fkey" FOREIGN KEY ("recordingId") REFERENCES "SessionRecording"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionClip" ADD CONSTRAINT "SessionClip_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
