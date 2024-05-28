-- DropForeignKey
ALTER TABLE "Revision" DROP CONSTRAINT "Revision_checklistId_fkey";

-- DropForeignKey
ALTER TABLE "Revision" DROP CONSTRAINT "Revision_surveyId_fkey";

-- AlterTable
ALTER TABLE "Revision" ALTER COLUMN "surveyId" DROP NOT NULL,
ALTER COLUMN "checklistId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Revision" ADD CONSTRAINT "Revision_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Revision" ADD CONSTRAINT "Revision_checklistId_fkey" FOREIGN KEY ("checklistId") REFERENCES "Survey"("id") ON DELETE SET NULL ON UPDATE CASCADE;
