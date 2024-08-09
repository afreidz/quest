/*
  Warnings:

  - Added the required column `recordingId` to the `TranscriptionSegment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TranscriptionSegment" ADD COLUMN     "recordingId" TEXT NOT NULL,
ALTER COLUMN "end" DROP DEFAULT,
ALTER COLUMN "end" SET DATA TYPE TEXT,
ALTER COLUMN "start" DROP DEFAULT,
ALTER COLUMN "start" SET DATA TYPE TEXT;

-- AddForeignKey
ALTER TABLE "TranscriptionSegment" ADD CONSTRAINT "TranscriptionSegment_recordingId_fkey" FOREIGN KEY ("recordingId") REFERENCES "SessionRecording"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
