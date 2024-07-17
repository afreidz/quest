/*
  Warnings:

  - You are about to drop the column `checklistId` on the `Revision` table. All the data in the column will be lost.
  - You are about to drop the column `surveyId` on the `Revision` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[surveyRevisionId]` on the table `Survey` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[checklistRevisionId]` on the table `Survey` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Revision" DROP CONSTRAINT "Revision_checklistId_fkey";

-- DropForeignKey
ALTER TABLE "Revision" DROP CONSTRAINT "Revision_surveyId_fkey";

-- DropIndex
DROP INDEX "Revision_checklistId_key";

-- DropIndex
DROP INDEX "Revision_surveyId_key";

-- AlterTable
ALTER TABLE "Revision" DROP COLUMN "checklistId",
DROP COLUMN "surveyId";

-- AlterTable
ALTER TABLE "Survey" ADD COLUMN     "checklistRevisionId" TEXT,
ADD COLUMN     "surveyRevisionId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Survey_surveyRevisionId_key" ON "Survey"("surveyRevisionId");

-- CreateIndex
CREATE UNIQUE INDEX "Survey_checklistRevisionId_key" ON "Survey"("checklistRevisionId");

-- AddForeignKey
ALTER TABLE "Survey" ADD CONSTRAINT "Survey_surveyRevisionId_fkey" FOREIGN KEY ("surveyRevisionId") REFERENCES "Revision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Survey" ADD CONSTRAINT "Survey_checklistRevisionId_fkey" FOREIGN KEY ("checklistRevisionId") REFERENCES "Revision"("id") ON DELETE CASCADE ON UPDATE CASCADE;
