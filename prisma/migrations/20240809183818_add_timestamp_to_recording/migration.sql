/*
  Warnings:

  - Added the required column `timestamp` to the `SessionRecording` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SessionRecording" ADD COLUMN     "timestamp" TIMESTAMP(3) NOT NULL;
