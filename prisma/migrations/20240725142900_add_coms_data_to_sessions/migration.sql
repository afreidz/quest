/*
  Warnings:

  - Added the required column `moderatorComsId` to the `Session` table without a default value. This is not possible if the table is not empty.
  - Added the required column `roomComsId` to the `Session` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "moderatorComsId" TEXT NOT NULL,
ADD COLUMN     "roomComsId" TEXT NOT NULL;
