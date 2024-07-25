/*
  Warnings:

  - You are about to drop the column `callId` on the `Session` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[roomComsId]` on the table `Session` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Session_callId_key";

-- AlterTable
ALTER TABLE "Session" DROP COLUMN "callId";

-- CreateIndex
CREATE UNIQUE INDEX "Session_roomComsId_key" ON "Session"("roomComsId");
