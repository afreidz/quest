/*
  Warnings:

  - You are about to drop the column `systemId` on the `Respondent` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[email]` on the table `Respondent` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Respondent" DROP CONSTRAINT "Respondent_systemId_fkey";

-- DropIndex
DROP INDEX "Respondent_email_systemId_key";

-- AlterTable
ALTER TABLE "Respondent" DROP COLUMN "systemId";

-- CreateTable
CREATE TABLE "_RespondentToSystem" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_RespondentToSystem_AB_unique" ON "_RespondentToSystem"("A", "B");

-- CreateIndex
CREATE INDEX "_RespondentToSystem_B_index" ON "_RespondentToSystem"("B");

-- CreateIndex
CREATE UNIQUE INDEX "Respondent_email_key" ON "Respondent"("email");

-- AddForeignKey
ALTER TABLE "_RespondentToSystem" ADD CONSTRAINT "_RespondentToSystem_A_fkey" FOREIGN KEY ("A") REFERENCES "Respondent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RespondentToSystem" ADD CONSTRAINT "_RespondentToSystem_B_fkey" FOREIGN KEY ("B") REFERENCES "System"("id") ON DELETE CASCADE ON UPDATE CASCADE;
