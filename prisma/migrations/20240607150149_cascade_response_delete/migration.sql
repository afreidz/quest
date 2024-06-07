-- DropForeignKey
ALTER TABLE "Response" DROP CONSTRAINT "Response_respondentId_fkey";

-- AddForeignKey
ALTER TABLE "Response" ADD CONSTRAINT "Response_respondentId_fkey" FOREIGN KEY ("respondentId") REFERENCES "Respondent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
