/*
  Warnings:

  - You are about to drop the `SessionClip` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "RecordingType" AS ENUM ('FULL', 'CLIP');

-- DropForeignKey
ALTER TABLE "SessionClip" DROP CONSTRAINT "SessionClip_recordingId_fkey";

-- DropForeignKey
ALTER TABLE "SessionClip" DROP CONSTRAINT "SessionClip_sessionId_fkey";

-- AlterTable
ALTER TABLE "SessionRecording" ADD COLUMN     "duration" DOUBLE PRECISION,
ADD COLUMN     "offset" DOUBLE PRECISION,
ADD COLUMN     "type" "RecordingType" NOT NULL DEFAULT 'FULL';

-- AlterTable
ALTER TABLE "TranscriptionSegment" ALTER COLUMN "duration" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "offset" SET DATA TYPE DOUBLE PRECISION;

-- DropTable
DROP TABLE "SessionClip";
