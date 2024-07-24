/*
  Warnings:

  - Added the required column `moderator` to the `Session` table without a default value. This is not possible if the table is not empty.
  - Added the required column `scheduled` to the `Session` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "completed" TIMESTAMP(3),
ADD COLUMN     "moderator" TEXT NOT NULL,
ADD COLUMN     "scheduled" TIMESTAMP(3) NOT NULL;
