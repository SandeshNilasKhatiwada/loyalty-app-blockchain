-- AlterTable
ALTER TABLE "Merchant" ADD COLUMN     "ownerName" TEXT;

-- CreateTable
CREATE TABLE "PendingAward" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PendingAward_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PendingAward" ADD CONSTRAINT "PendingAward_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PendingAward" ADD CONSTRAINT "PendingAward_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
