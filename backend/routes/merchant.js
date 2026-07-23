const router = require("express").Router();
const prisma = require("../services/prisma");
const auth = require("../middleware/auth");

function isMerchant(req, res) {
  if (!req.user.isMerchant) { res.status(403).json({ error: "Merchants only" }); return false; }
  return true;
}

async function getMerchant(userId) {
  return prisma.merchant.findUnique({ where: { userId } });
}

// ── Existing topup ──
router.post("/topup", auth, async (req, res) => {
  const { amountNPR, method } = req.body;
  if (!amountNPR || amountNPR <= 0) return res.status(400).json({ error: "Valid amountNPR required" });
  const paymentMethod = method || "direct";
  if (!["esewa", "paypal", "stripe", "direct"].includes(paymentMethod)) {
    return res.status(400).json({ error: "Invalid method. Use esewa, paypal, stripe, or direct" });
  }
  try {
    if (!isMerchant(req, res)) return;
    const merchant = await getMerchant(req.user.id);
    if (!merchant || merchant.kybStatus !== "APPROVED") return res.status(403).json({ error: "Not approved" });

    const tokenAmount = Math.floor(amountNPR * (merchant.exchangeRate || 100) / 100);
    const fee = Math.floor(tokenAmount * (merchant.feeRate || 5) / 100);
    const net = tokenAmount - fee;
    if (net <= 0) return res.status(400).json({ error: "Amount too small" });

    const [tx] = await prisma.$transaction([
      prisma.transaction.create({
        data: {
          txHash: "TOPUP:" + Date.now() + ":" + Math.random().toString(36).slice(2, 8),
          type: "TOPUP",
          fromAddress: req.user.email || req.user.walletAddress || "merchant",
          toAddress: "system",
          amount: net.toString(),
          merchantId: merchant.id,
          userId: req.user.id,
        },
      }),
      prisma.merchant.update({
        where: { id: merchant.id },
        data: { tokenBalance: { increment: BigInt(net) } },
      }),
    ]);

    res.json({ success: true, txHash: tx.txHash, amountNPR, fee, netTokens: net.toString(), method: paymentMethod });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Stripe payment intent ──
router.post("/create-payment-intent", auth, async (req, res) => {
  const { amountNPR } = req.body;
  if (!amountNPR || amountNPR <= 0) return res.status(400).json({ error: "Valid amountNPR required" });
  try {
    if (!isMerchant(req, res)) return;
    const merchant = await getMerchant(req.user.id);
    if (!merchant || merchant.kybStatus !== "APPROVED") return res.status(403).json({ error: "Not approved" });

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey || !stripeKey.startsWith("sk_")) {
      return res.json({ mock: true, clientSecret: null, amount: amountNPR, message: "Stripe not configured. Tokens will be credited in mock mode." });
    }

    const stripe = require("stripe")(stripeKey);
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amountNPR * 100),
      currency: "usd",
      metadata: { merchantId: merchant.id, userId: req.user.id },
    });

    res.json({ clientSecret: paymentIntent.client_secret, amount: amountNPR, mock: false });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Confirm payment (called after successful Stripe/PayPal payment) ──
router.post("/confirm-payment", auth, async (req, res) => {
  const { amountNPR, method, paymentId } = req.body;
  if (!amountNPR || amountNPR <= 0) return res.status(400).json({ error: "Valid amountNPR required" });
  try {
    if (!isMerchant(req, res)) return;
    const merchant = await getMerchant(req.user.id);
    if (!merchant || merchant.kybStatus !== "APPROVED") return res.status(403).json({ error: "Not approved" });

    const tokenAmount = Math.floor(amountNPR * (merchant.exchangeRate || 100) / 100);
    const fee = Math.floor(tokenAmount * (merchant.feeRate || 5) / 100);
    const net = tokenAmount - fee;
    if (net <= 0) return res.status(400).json({ error: "Amount too small" });

    const [tx] = await prisma.$transaction([
      prisma.transaction.create({
        data: {
          txHash: paymentId || ("TOPUP:" + Date.now() + ":" + Math.random().toString(36).slice(2, 8)),
          type: "TOPUP",
          fromAddress: req.user.email || req.user.walletAddress || "merchant",
          toAddress: "system",
          amount: net.toString(),
          merchantId: merchant.id,
          userId: req.user.id,
        },
      }),
      prisma.merchant.update({
        where: { id: merchant.id },
        data: { tokenBalance: { increment: BigInt(net) } },
      }),
    ]);

    res.json({ success: true, txHash: tx.txHash, amountNPR, fee, netTokens: net.toString(), method: method || "stripe" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Merchant status ──
router.get("/status", auth, async (req, res) => {
  const merchant = await prisma.merchant.findUnique({ where: { userId: req.user.id } });
  if (!merchant) return res.json({ merchant: null });
  res.json({
    merchant: {
      ...merchant,
      tokenBalance: (merchant.tokenBalance || "0").toString(),
    },
  });
});

// ── Customers who received points from this merchant ──
router.get("/customers", auth, async (req, res) => {
  try {
    if (!isMerchant(req, res)) return;
    const merchant = await getMerchant(req.user.id);
    if (!merchant) return res.status(404).json({ error: "Merchant not found" });

    const awards = await prisma.transaction.findMany({
      where: { merchantId: merchant.id, type: "AWARD" },
      include: { user: { select: { email: true, name: true, pointsBalance: true } } },
      orderBy: { createdAt: "desc" },
    });

    const customerMap = {};
    for (const tx of awards) {
      if (!tx.user) continue;
      const cid = tx.user.email || tx.userId;
      if (!customerMap[cid]) {
        customerMap[cid] = {
          email: tx.user.email || "unknown",
          name: tx.user.name || "",
          totalAwarded: 0,
          totalRedeemed: 0,
          lastAward: tx.createdAt,
          user: tx.user,
        };
      }
      customerMap[cid].totalAwarded += parseInt(tx.amount) || 0;
      if (tx.createdAt > customerMap[cid].lastAward) customerMap[cid].lastAward = tx.createdAt;
    }

    const redeems = await prisma.transaction.findMany({
      where: { merchantId: merchant.id, type: "REDEEM" },
      include: { user: { select: { email: true } } },
    });

    for (const tx of redeems) {
      if (!tx.user) continue;
      const cid = tx.user.email || tx.userId;
      if (customerMap[cid]) {
        customerMap[cid].totalRedeemed += parseInt(tx.amount) || 0;
      }
    }

    res.json({ customers: Object.values(customerMap) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Request award (customer-facing, but called by merchant on behalf) ──
router.post("/request-award", auth, async (req, res) => {
  const { customerEmail, amount } = req.body;
  if (!customerEmail || !amount) return res.status(400).json({ error: "customerEmail and amount required" });
  try {
    if (!isMerchant(req, res)) return;
    const merchant = await getMerchant(req.user.id);
    if (!merchant || merchant.kybStatus !== "APPROVED") return res.status(403).json({ error: "Not approved" });
    const customer = await prisma.user.findUnique({ where: { email: customerEmail } });
    if (!customer) return res.status(404).json({ error: "Customer not found" });

    const pending = await prisma.pendingAward.create({
      data: { merchantId: merchant.id, customerId: customer.id, amount: amount.toString() },
    });
    res.json({ success: true, pendingAward: pending });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── List pending awards for merchant ──
router.get("/pending-awards", auth, async (req, res) => {
  try {
    if (!isMerchant(req, res)) return;
    const merchant = await getMerchant(req.user.id);
    if (!merchant) return res.status(404).json({ error: "Merchant not found" });

    const pending = await prisma.pendingAward.findMany({
      where: { merchantId: merchant.id, status: "PENDING" },
      include: { customer: { select: { email: true, name: true, pointsBalance: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json({ pendingAwards: pending });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Approve a pending award ──
router.post("/approve-award", auth, async (req, res) => {
  const { pendingAwardId } = req.body;
  if (!pendingAwardId) return res.status(400).json({ error: "pendingAwardId required" });
  try {
    if (!isMerchant(req, res)) return;
    const merchant = await getMerchant(req.user.id);
    if (!merchant || merchant.kybStatus !== "APPROVED") return res.status(403).json({ error: "Not approved" });

    const pending = await prisma.pendingAward.findUnique({
      where: { id: pendingAwardId },
      include: { customer: true },
    });
    if (!pending || pending.merchantId !== merchant.id) return res.status(404).json({ error: "Pending award not found" });
    if (pending.status !== "PENDING") return res.status(400).json({ error: "Already processed" });

    const pts = parseInt(pending.amount);
    if (BigInt(merchant.tokenBalance || 0) < BigInt(pts)) {
      return res.status(400).json({ error: "Insufficient token balance" });
    }

    await prisma.$transaction([
      prisma.pendingAward.update({ where: { id: pending.id }, data: { status: "APPROVED" } }),
      prisma.transaction.create({
        data: {
          txHash: "AWARD:" + Date.now() + ":" + Math.random().toString(36).slice(2, 8),
          type: "AWARD",
          fromAddress: req.user.email || req.user.walletAddress || "merchant",
          toAddress: pending.customer.email || pending.customer.walletAddress || "customer",
          amount: pending.amount,
          merchantId: merchant.id,
          userId: pending.customer.id,
        },
      }),
      prisma.merchant.update({ where: { id: merchant.id }, data: { tokenBalance: { decrement: BigInt(pts) } } }),
      prisma.user.update({ where: { id: pending.customer.id }, data: { pointsBalance: { increment: BigInt(pts) } } }),
    ]);

    res.json({ success: true, amount: pending.amount, customer: pending.customer.email });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Reject a pending award ──
router.post("/reject-award", auth, async (req, res) => {
  const { pendingAwardId } = req.body;
  if (!pendingAwardId) return res.status(400).json({ error: "pendingAwardId required" });
  try {
    if (!isMerchant(req, res)) return;
    const merchant = await getMerchant(req.user.id);
    if (!merchant) return res.status(404).json({ error: "Merchant not found" });
    const pending = await prisma.pendingAward.findUnique({ where: { id: pendingAwardId } });
    if (!pending || pending.merchantId !== merchant.id) return res.status(404).json({ error: "Pending award not found" });
    await prisma.pendingAward.update({ where: { id: pending.id }, data: { status: "REJECTED" } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Delete merchant account ──
router.delete("/account", auth, async (req, res) => {
  try {
    if (!isMerchant(req, res)) return;
    const merchant = await getMerchant(req.user.id);
    if (!merchant) return res.status(404).json({ error: "Merchant not found" });
    await prisma.$transaction([
      prisma.pendingAward.deleteMany({ where: { merchantId: merchant.id } }),
      prisma.transaction.deleteMany({ where: { merchantId: merchant.id } }),
      prisma.merchant.delete({ where: { id: merchant.id } }),
      prisma.user.update({ where: { id: req.user.id }, data: { isMerchant: false } }),
    ]);
    res.json({ success: true, message: "Merchant account deleted" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
