-- AlterTable
ALTER TABLE "Merchant" ADD COLUMN     "citizenshipPhoto" TEXT,
ADD COLUMN     "documents" TEXT,
ADD COLUMN     "tokenBalance" BIGINT NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isAdmin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pointsBalance" BIGINT NOT NULL DEFAULT 0,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'ACTIVE',
ALTER COLUMN "walletAddress" DROP NOT NULL;
