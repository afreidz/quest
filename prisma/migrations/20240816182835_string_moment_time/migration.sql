-- AlterTable
ALTER TABLE "KeyMoment" ADD COLUMN     "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "time" DROP DEFAULT,
ALTER COLUMN "time" SET DATA TYPE TEXT;
