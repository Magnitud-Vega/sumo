/*
  Warnings:

  - Added the required column `bankAccount` to the `GroupOrder` table without a default value. This is not possible if the table is not empty.
  - Added the required column `bankDoc` to the `GroupOrder` table without a default value. This is not possible if the table is not empty.
  - Added the required column `bankHolder` to the `GroupOrder` table without a default value. This is not possible if the table is not empty.
  - Added the required column `bankName` to the `GroupOrder` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyName` to the `GroupOrder` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyWhatsapp` to the `GroupOrder` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "GroupOrder" ADD COLUMN     "bankAccount" TEXT NOT NULL,
ADD COLUMN     "bankDoc" TEXT NOT NULL,
ADD COLUMN     "bankHolder" TEXT NOT NULL,
ADD COLUMN     "bankName" TEXT NOT NULL,
ADD COLUMN     "companyName" TEXT NOT NULL,
ADD COLUMN     "companyWhatsapp" TEXT NOT NULL;
