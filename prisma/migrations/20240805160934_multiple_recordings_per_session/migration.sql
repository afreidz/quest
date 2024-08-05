/*
  Warnings:

  - You are about to drop the column `serverRecordingId` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `videoURL` on the `Session` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Session_serverRecordingId_key";

-- AlterTable
ALTER TABLE "Session" DROP COLUMN "serverRecordingId",
DROP COLUMN "videoURL";

-- CreateTable
CREATE TABLE "SessionRecording" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionId" TEXT NOT NULL,
    "serverId" TEXT NOT NULL,
    "videoURL" TEXT,

    CONSTRAINT "SessionRecording_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SessionRecording_serverId_key" ON "SessionRecording"("serverId");

-- AddForeignKey
ALTER TABLE "SessionRecording" ADD CONSTRAINT "SessionRecording_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
