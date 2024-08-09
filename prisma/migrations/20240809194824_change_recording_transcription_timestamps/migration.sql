/*
  Warnings:

  - You are about to drop the column `timestamp` on the `SessionRecording` table. All the data in the column will be lost.
  - You are about to drop the column `time` on the `TranscriptionSegment` table. All the data in the column will be lost.
  - Added the required column `started` to the `SessionRecording` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SessionRecording" DROP COLUMN "timestamp",
ADD COLUMN     "started" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "TranscriptionSegment" DROP COLUMN "time",
ADD COLUMN     "end" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "start" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
