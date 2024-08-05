/*
  Warnings:

  - You are about to drop the column `roomComsId` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `serverId` on the `SessionRecording` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Session_roomComsId_key";

-- DropIndex
DROP INDEX "SessionRecording_serverId_key";

-- AlterTable
ALTER TABLE "Session" DROP COLUMN "roomComsId";

-- AlterTable
ALTER TABLE "SessionRecording" DROP COLUMN "serverId";
