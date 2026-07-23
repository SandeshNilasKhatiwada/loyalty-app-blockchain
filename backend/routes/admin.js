const router = require("express").Router();
const { ethers } = require("ethers");
const prisma = require("../services/prisma");
const blockchain = require("../services/blockchain");
const auth = require("../middleware/auth");

function requireAdmin(req, res, next) {
  if (!req.user || !req.user.isAdmin) return res.status(403).json({ error: "Admin only" });
  next();
}

// Get pending merchants
router.get("/merchants/pending", auth, requireAdmin, async (req, res) => {
  const merchants = await prisma.merchant.findMany({
    where: { kybStatus: "PENDING" },
    orderBy: { createdAt: "desc" },
  });
  res.json({ merchants });
});

// Approve merchant
router.patch("/merchants/:id/approve", auth, requireAdmin, async (req, res) => {
  const merchant = await prisma.merchant.findUnique({ where: { id: req.params.id } });
  if (!merchant) return res.status(404).json({ error: "Merchant not found" });
  if (merchant.kybStatus === "APPROVED") return res.status(400).json({ error: "Already approved" });

  const symbol = (merchant.businessName || "TKN").slice(0, 5).toUpperCase();
  const name = `${merchant.businessName} Token`;

  let tokenAddr = null;
  try {
    tokenAddr = await blockchain.deployTokenForMerchant(merchant.walletAddress || "0x0", name, symbol);
  } catch (e) {
    console.warn("Token deploy failed (mock mode):", e.message);
  }

  const updated = await prisma.merchant.update({
    where: { id: merchant.id },
    data: {
      kybStatus: "APPROVED",
      tokenContract: tokenAddr,
      isVerified: true,
    },
  });

  res.json({ success: true, merchant: updated });
});

// Reject merchant
router.patch("/merchants/:id/reject", auth, requireAdmin, async (req, res) => {
  const updated = await prisma.merchant.update({
    where: { id: req.params.id },
    data: { kybStatus: "REJECTED" },
  });
  res.json({ success: true, merchant: updated });
});

// Get all merchants
router.get("/merchants", auth, requireAdmin, async (req, res) => {
  const merchants = await prisma.merchant.findMany({
    orderBy: { createdAt: "desc" },
  });
  res.json({ merchants });
});

// Buy tokens for a merchant (admin)
router.post("/merchants/:id/topup", auth, requireAdmin, async (req, res) => {
  const { amountNPR } = req.body;
  if (!amountNPR || +amountNPR <= 0) return res.status(400).json({ error: "Invalid amount" });

  const merchant = await prisma.merchant.findUnique({ where: { id: req.params.id } });
  if (!merchant) return res.status(404).json({ error: "Merchant not found" });

  const exchangeRate = merchant.exchangeRate || 100;
  const feeRate = merchant.feeRate || 5;
  const grossTokens = Math.floor((+amountNPR * exchangeRate) / 100);
  const fee = Math.floor((grossTokens * feeRate) / 100);
  const netTokens = grossTokens - fee;

  const updated = await prisma.merchant.update({
    where: { id: merchant.id },
    data: { tokenBalance: { increment: BigInt(netTokens) } },
  });

  await prisma.transaction.create({
    data: {
      txHash: "TOPUP:" + Date.now() + ":" + merchant.id,
      type: "TOPUP",
      fromAddress: "admin",
      toAddress: merchant.email,
      amount: netTokens.toString(),
      merchantId: merchant.id,
    },
  });

  res.json({ success: true, netTokens, fee, amountNPR: +amountNPR, merchant: updated });
});

// Get stats
router.get("/stats", auth, requireAdmin, async (req, res) => {
  const [totalMerchants, approvedMerchants, pendingMerchants, totalCustomers, totalTransactions] = await Promise.all([
    prisma.merchant.count(),
    prisma.merchant.count({ where: { kybStatus: "APPROVED" } }),
    prisma.merchant.count({ where: { kybStatus: "PENDING" } }),
    prisma.customer.count(),
    prisma.transaction.count(),
  ]);
  res.json({ stats: { totalMerchants, approvedMerchants, pendingMerchants, totalCustomers, totalTransactions } });
});

module.exports = router;
