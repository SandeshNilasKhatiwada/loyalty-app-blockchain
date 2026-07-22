/**
 * Seed the admin user.
 * Run: node scripts/seed-admin.js
 */
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
require("dotenv").config();

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const adminWallet = (process.env.ADMIN_WALLETS || "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266").split(",")[0].trim();

  let user = await prisma.user.findUnique({ where: { walletAddress: adminWallet } });
  if (!user) {
    user = await prisma.user.create({
      data: { walletAddress: adminWallet, email: "admin@loyalchain.io", name: "Admin", isAdmin: true, status: "ACTIVE" },
    });
    console.log("✅ Admin user created:", user.email);
  } else {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { isAdmin: true, status: "ACTIVE" },
    });
    console.log("✅ Admin user updated:", user.email);
  }

  await prisma.$disconnect();
  console.log("Admin seed complete.");
}

main().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
