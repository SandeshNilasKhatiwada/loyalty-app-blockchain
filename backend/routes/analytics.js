const router = require("express").Router();
const prisma = require("../services/prisma");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

function sumAmounts(txs) {
  return txs.reduce((acc, t) => acc + (parseInt(t.amount) || 0), 0).toString();
}

router.get("/merchant", auth, async (req, res) => {
  const merchant = await prisma.merchant.findUnique({ where: { userId: req.user.id } });
  if (!merchant) return res.status(403).json({ error: "Not a merchant" });

  const [awards, redeems, customers, recentTxs] = await Promise.all([
    prisma.transaction.findMany({ where: { merchantId: merchant.id, type: "AWARD" } }),
    prisma.transaction.findMany({ where: { merchantId: merchant.id, type: "REDEEM" } }),
    prisma.transaction.groupBy({ by: ["fromAddress"], where: { merchantId: merchant.id, type: "AWARD" }, _count: { fromAddress: true } }),
    prisma.transaction.findMany({ where: { merchantId: merchant.id }, orderBy: { createdAt: "desc" }, take: 10 }),
  ]);

  res.json({
    analytics: {
      totalAwarded: sumAmounts(awards),
      totalRedeemed: sumAmounts(redeems),
      uniqueCustomers: customers.length,
      tokenBalance: (merchant.tokenBalance || "0").toString(),
      recentTransactions: recentTxs,
    },
  });
});

router.get("/admin", auth, admin, async (req, res) => {
  const [users, merchants, allTx, approved, awards, redeems, topups, swaps] = await Promise.all([
    prisma.user.count(),
    prisma.merchant.count(),
    prisma.transaction.count(),
    prisma.merchant.count({ where: { kybStatus: "APPROVED" } }),
    prisma.transaction.findMany({ where: { type: "AWARD" } }),
    prisma.transaction.findMany({ where: { type: "REDEEM" } }),
    prisma.transaction.findMany({ where: { type: "TOPUP" } }),
    prisma.transaction.count({ where: { type: "SWAP" } }),
  ]);

  res.json({
    analytics: {
      users, merchants, transactions: allTx, approvedMerchants: approved,
      totalAwarded: sumAmounts(awards),
      totalRedeemed: sumAmounts(redeems),
      totalTopup: sumAmounts(topups),
      totalSwaps: swaps,
    },
  });
});

module.exports = router;
