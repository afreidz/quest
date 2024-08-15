/*
  Warnings:

  - A unique constraint covering the columns `[respondentId,revisionId]` on the table `Session` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Session_respondentId_revisionId_key" ON "Session"("respondentId", "revisionId");
