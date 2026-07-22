const router = require("express").Router();
const prisma = require("../services/prisma");
const auth = require("../middleware/auth");

router.post("/topup", auth, async (req, res) => {
  const { amountNPR, method } = req.body;
  if (!amountNPR || amountNPR <= 0) return res.status(400).json({ error: "Valid amountNPR required" });
  const paymentMethod = method || "direct";
  if (!["esewa", "paypal", "direct"].includes(paymentMethod)) {
    return res.status(400).json({ error: "Invalid method. Use esewa, paypal, or direct" });
  }
  try {
    const user = req.user;
    if (!user.isMerchant) return res.status(403).json({ error: "Merchants only" });
    const merchant = await prisma.merchant.findUnique({ where: { userId: user.id } });
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
          fromAddress: user.email || user.walletAddress || "merchant",
          toAddress: "system",
          amount: net.toString(),
          merchantId: merchant.id,
          userId: user.id,
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

module.exports = router;
