/*
  Warnings:

  - You are about to alter the column `duration` on the `TranscriptionSegment` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `offset` on the `TranscriptionSegment` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.

*/
-- AlterTable
ALTER TABLE "TranscriptionSegment" ALTER COLUMN "duration" SET DATA TYPE INTEGER,
ALTER COLUMN "offset" SET DATA TYPE INTEGER;
