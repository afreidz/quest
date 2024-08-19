-- AlterTable
ALTER TABLE "SessionRecording" ADD COLUMN     "ended" TIMESTAMP(3),
ALTER COLUMN "started" DROP NOT NULL;
