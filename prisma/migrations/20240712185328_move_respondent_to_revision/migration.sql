/*
  Warnings:

  - You are about to drop the `_RespondentToSystem` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_RespondentToSystem" DROP CONSTRAINT "_RespondentToSystem_A_fkey";

-- DropForeignKey
ALTER TABLE "_RespondentToSystem" DROP CONSTRAINT "_RespondentToSystem_B_fkey";

-- DropTable
DROP TABLE "_RespondentToSystem";
