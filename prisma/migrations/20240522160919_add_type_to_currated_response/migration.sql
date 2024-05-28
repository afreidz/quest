/*
  Warnings:

  - Added the required column `type` to the `CurratedResponse` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CurratedResponse" ADD COLUMN     "type" "SurveyType" NOT NULL;
