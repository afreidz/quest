/*
  Warnings:

  - You are about to drop the column `durationNS` on the `TranscriptionSegment` table. All the data in the column will be lost.
  - You are about to drop the column `offsetNS` on the `TranscriptionSegment` table. All the data in the column will be lost.
  - Added the required column `duration` to the `TranscriptionSegment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `offset` to the `TranscriptionSegment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TranscriptionSegment" DROP COLUMN "durationNS",
DROP COLUMN "offsetNS",
ADD COLUMN     "duration" BIGINT NOT NULL,
ADD COLUMN     "offset" BIGINT NOT NULL;
