const router = require("express").Router();
const prisma = require("../services/prisma");
const auth = require("../middleware/auth");

function toInt(v) { return parseInt(v) || 0; }

router.post("/award", auth, async (req, res) => {
  try {
    const { customerEmail, customerWallet, amount } = req.body;
    if ((!customerEmail && !customerWallet) || !amount) {
      return res.status(400).json({ error: "customerEmail or customerWallet, and amount required" });
    }
    const user = req.user;
    if (!user.isMerchant) return res.status(403).json({ error: "Merchants only" });
    const merchant = await prisma.merchant.findUnique({ where: { userId: user.id } });
    if (!merchant || merchant.kybStatus !== "APPROVED") return res.status(403).json({ error: "Merchant not approved" });

    const pts = toInt(amount);
    if (pts <= 0) return res.status(400).json({ error: "Amount must be positive" });
    if (BigInt(merchant.tokenBalance || 0) < BigInt(pts)) {
      return res.status(400).json({ error: "Insufficient token balance. Buy tokens first." });
    }

    let customer;
    if (customerEmail) {
      customer = await prisma.user.findUnique({ where: { email: customerEmail } });
      if (!customer) return res.status(404).json({ error: "No user found with that email" });
    } else {
      customer = await prisma.user.findUnique({ where: { walletAddress: customerWallet } });
      if (!customer) return res.status(404).json({ error: "No user found with that wallet" });
    }

    const [awarded] = await prisma.$transaction([
      prisma.transaction.create({
        data: {
          txHash: "AWARD:" + Date.now() + ":" + Math.random().toString(36).slice(2, 8),
          type: "AWARD",
          fromAddress: user.email || user.walletAddress || "merchant",
          toAddress: customer.email || customer.walletAddress || "customer",
          amount: pts.toString(),
          merchantId: merchant.id,
          userId: customer.id,
        },
      }),
      prisma.merchant.update({ where: { id: merchant.id }, data: { tokenBalance: { decrement: BigInt(pts) } } }),
      prisma.user.update({ where: { id: customer.id }, data: { pointsBalance: { increment: BigInt(pts) } } }),
    ]);

    res.json({ success: true, amount: pts.toString(), customer: customer.email || customer.walletAddress, txHash: awarded.txHash });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/redeem", auth, async (req, res) => {
  try {
    const { customerEmail, amount } = req.body;
    if (!customerEmail || !amount) return res.status(400).json({ error: "customerEmail and amount required" });

    const user = req.user;
    if (!user.isMerchant) return res.status(403).json({ error: "Merchants only" });
    const merchant = await prisma.merchant.findUnique({ where: { userId: user.id } });
    if (!merchant || merchant.kybStatus !== "APPROVED") return res.status(403).json({ error: "Merchant not approved" });

    const customer = await prisma.user.findUnique({ where: { email: customerEmail } });
    if (!customer) return res.status(404).json({ error: "Customer not found" });

    const pts = toInt(amount);
    if (pts <= 0) return res.status(400).json({ error: "Amount must be positive" });
    if (BigInt(customer.pointsBalance || 0) < BigInt(pts)) {
      return res.status(400).json({ error: "Customer has insufficient points" });
    }

    const [redeemed] = await prisma.$transaction([
      prisma.transaction.create({
        data: {
          txHash: "REDEEM:" + Date.now() + ":" + Math.random().toString(36).slice(2, 8),
          type: "REDEEM",
          fromAddress: customer.email || customer.walletAddress || "customer",
          toAddress: user.email || user.walletAddress || "merchant",
          amount: pts.toString(),
          merchantId: merchant.id,
          userId: customer.id,
        },
      }),
      prisma.user.update({ where: { id: customer.id }, data: { pointsBalance: { decrement: BigInt(pts) } } }),
      prisma.merchant.update({ where: { id: merchant.id }, data: { tokenBalance: { increment: BigInt(pts) } } }),
    ]);

    res.json({ success: true, amount: pts.toString(), customer: customer.email, txHash: redeemed.txHash });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get("/balance", auth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  res.json({ balance: (user.pointsBalance || "0").toString() });
});

router.get("/balance/:email", auth, async (req, res) => {
  const customer = await prisma.user.findUnique({ where: { email: req.params.email } });
  res.json({ email: req.params.email, balance: (customer ? (customer.pointsBalance || "0") : "0").toString(), found: !!customer });
});

router.get("/history", auth, async (req, res) => {
  const user = req.user;
  let where;
  if (user.isAdmin) {
    where = {};
  } else if (user.isMerchant) {
    const merchant = await prisma.merchant.findUnique({ where: { userId: user.id } });
    where = merchant ? { merchantId: merchant.id } : { userId: user.id };
  } else {
    where = { userId: user.id };
  }
  const transactions = await prisma.transaction.findMany({
    where,
    include: {
      merchant: { select: { businessName: true } },
      user: { select: { email: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  res.json({ transactions });
});

router.get("/merchant-token", auth, async (req, res) => {
  const user = req.user;
  if (!user.isMerchant) return res.status(403).json({ error: "Merchants only" });
  const merchant = await prisma.merchant.findUnique({ where: { userId: user.id } });
  if (!merchant) return res.status(404).json({ error: "Merchant not found" });
  res.json({
    merchant: {
      ...merchant,
      tokenBalance: (merchant.tokenBalance || "0").toString(),
      balance: (merchant.tokenBalance || "0").toString(),
    },
  });
});

module.exports = router;
