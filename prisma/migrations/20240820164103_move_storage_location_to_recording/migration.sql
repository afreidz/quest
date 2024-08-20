/*
  Warnings:

  - You are about to drop the column `storageLocationId` on the `Session` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Session" DROP COLUMN "storageLocationId";

-- AlterTable
ALTER TABLE "SessionRecording" ADD COLUMN     "storageLocationId" TEXT;
