-- AlterTable
ALTER TABLE "GroupOrder" ADD COLUMN     "cancelReason" TEXT,
ADD COLUMN     "closedAt" TIMESTAMP(3);
