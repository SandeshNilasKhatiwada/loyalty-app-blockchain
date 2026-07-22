const router = require("express").Router();
const prisma = require("../services/prisma");
const blockchain = require("../services/blockchain");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

router.get("/merchants/pending", auth, admin, async (req, res) => {
  const merchants = await prisma.merchant.findMany({
    where: { kybStatus: "PENDING" },
    include: { user: { select: { walletAddress: true, email: true, name: true } } },
  });
  res.json({ merchants });
});

router.patch("/merchants/:id/approve", auth, admin, async (req, res) => {
  const merchant = await prisma.merchant.findUnique({ where: { id: req.params.id }, include: { user: true } });
  if (!merchant) return res.status(404).json({ error: "Not found" });
  if (merchant.kybStatus === "APPROVED") return res.status(400).json({ error: "Already approved" });

  const symbol = req.body.tokenSymbol || merchant.businessName.slice(0, 5).toUpperCase();
  const name = req.body.tokenName || `${merchant.businessName} Token`;
  const tokenAddr = await blockchain.deployTokenForMerchant(merchant.user.walletAddress, name, symbol);

  const updated = await prisma.merchant.update({
    where: { id: merchant.id },
    data: { kybStatus: "APPROVED", tokenContract: tokenAddr, tokenName: name, tokenSymbol: symbol },
  });

  await prisma.transaction.create({
    data: { txHash: "DEPLOY:" + Date.now(), type: "DEPLOY", fromAddress: merchant.user.walletAddress, toAddress: tokenAddr, amount: "0", tokenContract: tokenAddr, merchantId: merchant.id },
  });

  res.json({ success: true, merchant: updated });
});

router.patch("/merchants/:id/reject", auth, admin, async (req, res) => {
  const merchant = await prisma.merchant.update({ where: { id: req.params.id }, data: { kybStatus: "REJECTED" } });
  res.json({ success: true, merchant });
});

router.get("/merchants", auth, admin, async (req, res) => {
  const merchants = await prisma.merchant.findMany({
    include: { user: { select: { walletAddress: true, email: true, name: true, isMerchant: true, isAdmin: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json({ merchants });
});

router.get("/stats", auth, admin, async (req, res) => {
  const [users, merchants, transactions, approved] = await Promise.all([
    prisma.user.count(), prisma.merchant.count(), prisma.transaction.count(),
    prisma.merchant.count({ where: { kybStatus: "APPROVED" } }),
  ]);
  res.json({ stats: { users, merchants, transactions, approved } });
});

module.exports = router;
