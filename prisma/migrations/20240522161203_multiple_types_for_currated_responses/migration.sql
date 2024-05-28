/*
  Warnings:

  - You are about to drop the column `type` on the `CurratedResponse` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "CurratedResponse" DROP COLUMN "type",
ADD COLUMN     "types" "SurveyType"[];
