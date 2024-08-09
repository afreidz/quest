/*
  Warnings:

  - You are about to drop the column `end` on the `TranscriptionSegment` table. All the data in the column will be lost.
  - You are about to drop the column `start` on the `TranscriptionSegment` table. All the data in the column will be lost.
  - Added the required column `durationNS` to the `TranscriptionSegment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `offsetNS` to the `TranscriptionSegment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TranscriptionSegment" DROP COLUMN "end",
DROP COLUMN "start",
ADD COLUMN     "durationNS" INTEGER NOT NULL,
ADD COLUMN     "offsetNS" INTEGER NOT NULL;
