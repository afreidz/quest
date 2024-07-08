/*
  Warnings:

  - You are about to drop the column `imageURL` on the `Question` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Question" DROP COLUMN "imageURL";

-- AlterTable
ALTER TABLE "QuestionGroup" ADD COLUMN     "imageURL" TEXT;
