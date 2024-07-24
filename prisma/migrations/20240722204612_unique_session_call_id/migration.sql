/*
  Warnings:

  - A unique constraint covering the columns `[callId]` on the table `Session` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Session_callId_key" ON "Session"("callId");
