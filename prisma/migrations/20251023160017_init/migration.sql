-- CreateEnum
CREATE TYPE "SplitStrategy" AS ENUM ('EVEN', 'WEIGHTED');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('OPEN', 'CLOSED', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LineStatus" AS ENUM ('PENDING', 'FINALIZED', 'PAID');

-- CreateEnum
CREATE TYPE "PayMethod" AS ENUM ('TC', 'TD', 'TRANSFER', 'CASH', 'QR');

-- CreateTable
CREATE TABLE "Menu" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Menu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuItem" (
    "id" TEXT NOT NULL,
    "menuId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priceGs" INTEGER NOT NULL,
    "category" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "MenuItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupOrder" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "menuId" TEXT NOT NULL,
    "deadlineTs" TIMESTAMP(3) NOT NULL,
    "deliveryCostGs" INTEGER NOT NULL DEFAULT 0,
    "minTotalGs" INTEGER,
    "minItems" INTEGER,
    "splitStrategy" "SplitStrategy" NOT NULL DEFAULT 'EVEN',
    "status" "Status" NOT NULL DEFAULT 'OPEN',
    "adminPin" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderLine" (
    "id" TEXT NOT NULL,
    "groupOrderId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "payMethod" "PayMethod" NOT NULL,
    "itemId" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "unitPriceGs" INTEGER NOT NULL,
    "qty" INTEGER NOT NULL,
    "note" TEXT,
    "subtotalGs" INTEGER NOT NULL,
    "deliveryShareGs" INTEGER NOT NULL DEFAULT 0,
    "totalGs" INTEGER NOT NULL DEFAULT 0,
    "status" "LineStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderLine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GroupOrder_slug_key" ON "GroupOrder"("slug");

-- AddForeignKey
ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "Menu"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupOrder" ADD CONSTRAINT "GroupOrder_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "Menu"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderLine" ADD CONSTRAINT "OrderLine_groupOrderId_fkey" FOREIGN KEY ("groupOrderId") REFERENCES "GroupOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
