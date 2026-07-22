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
  const tokenAddr = await blockchain.deployTokenForMerchant(merchant.user.walletAddress || "0x0", name, symbol);

  const updated = await prisma.merchant.update({
    where: { id: merchant.id },
    data: { kybStatus: "APPROVED", tokenContract: tokenAddr, tokenName: name, tokenSymbol: symbol },
  });

  await prisma.transaction.create({
    data: { txHash: "DEPLOY:" + Date.now(), type: "DEPLOY", fromAddress: merchant.user.walletAddress || "0x0", toAddress: tokenAddr, amount: "0", tokenContract: tokenAddr, merchantId: merchant.id },
  });

  res.json({ success: true, merchant: updated });
});

router.patch("/merchants/:id/reject", auth, admin, async (req, res) => {
  const merchant = await prisma.merchant.update({ where: { id: req.params.id }, data: { kybStatus: "REJECTED" } });
  res.json({ success: true, merchant });
});

router.get("/merchants", auth, admin, async (req, res) => {
  const merchants = await prisma.merchant.findMany({
    include: { user: { select: { walletAddress: true, email: true, name: true, isMerchant: true, isAdmin: true, status: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json({ merchants });
});

router.get("/users", auth, admin, async (req, res) => {
  const users = await prisma.user.findMany({
    include: { merchant: { select: { businessName: true, kybStatus: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json({ users });
});

router.patch("/users/:id/set-admin", auth, admin, async (req, res) => {
  const target = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!target) return res.status(404).json({ error: "User not found" });
  const updated = await prisma.user.update({
    where: { id: req.params.id },
    data: { isAdmin: true },
  });
  res.json({ success: true, user: updated });
});

router.patch("/users/:id/block", auth, admin, async (req, res) => {
  const target = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!target) return res.status(404).json({ error: "User not found" });
  const updated = await prisma.user.update({
    where: { id: req.params.id },
    data: { status: "BLOCKED" },
  });
  res.json({ success: true, user: updated });
});

router.patch("/users/:id/suspend", auth, admin, async (req, res) => {
  const target = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!target) return res.status(404).json({ error: "User not found" });
  const updated = await prisma.user.update({
    where: { id: req.params.id },
    data: { status: "SUSPENDED" },
  });
  res.json({ success: true, user: updated });
});

router.patch("/users/:id/activate", auth, admin, async (req, res) => {
  const target = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!target) return res.status(404).json({ error: "User not found" });
  const updated = await prisma.user.update({
    where: { id: req.params.id },
    data: { status: "ACTIVE" },
  });
  res.json({ success: true, user: updated });
});

router.delete("/users/:id", auth, admin, async (req, res) => {
  const target = await prisma.user.findUnique({ where: { id: req.params.id }, include: { merchant: true } });
  if (!target) return res.status(404).json({ error: "User not found" });
  await prisma.transaction.deleteMany({ where: { userId: req.params.id } });
  if (target.merchant) await prisma.merchant.delete({ where: { id: target.merchant.id } });
  await prisma.user.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

router.get("/stats", auth, admin, async (req, res) => {
  const [users, activeUsers, blockedUsers, merchants, transactions, approved] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { status: "ACTIVE" } }),
    prisma.user.count({ where: { status: { in: ["BLOCKED", "SUSPENDED"] } } }),
    prisma.merchant.count(),
    prisma.transaction.count(),
    prisma.merchant.count({ where: { kybStatus: "APPROVED" } }),
  ]);
  res.json({ stats: { users: activeUsers, totalUsers: users, blockedUsers, merchants, transactions, approved } });
});

module.exports = router;
