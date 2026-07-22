const router = require("express").Router();
const prisma = require("../services/prisma");
const blockchain = require("../services/blockchain");
const auth = require("../middleware/auth");

router.post("/topup", auth, async (req, res) => {
  const { amountNPR } = req.body;
  if (!amountNPR || amountNPR <= 0) return res.status(400).json({ error: "Valid amountNPR required" });
  try {
    const user = req.user;
    if (!user.isMerchant) return res.status(403).json({ error: "Merchants only" });
    const merchant = await prisma.merchant.findUnique({ where: { userId: user.id } });
    if (!merchant || merchant.kybStatus !== "APPROVED") return res.status(403).json({ error: "Not approved" });
    if (!merchant.tokenContract) return res.status(400).json({ error: "No token deployed" });

    const tokenAmount = Math.floor(amountNPR * (merchant.exchangeRate || 100) / 100);
    const fee = Math.floor(tokenAmount * (merchant.feeRate || 5) / 100);
    const net = tokenAmount - fee;
    if (net <= 0) return res.status(400).json({ error: "Amount too small" });

    const tx = await blockchain.mintTokens(merchant.tokenContract, user.walletAddress, net.toString());
    await prisma.transaction.create({
      data: { txHash: tx.hash || "MOCK:" + Date.now(), type: "TOPUP", fromAddress: "platform", toAddress: user.walletAddress, amount: net.toString(), tokenContract: merchant.tokenContract, merchantId: merchant.id, userId: user.id },
    });
    res.json({ success: true, txHash: tx.hash, amountNPR, fee, netTokens: net.toString() });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get("/status", auth, async (req, res) => {
  const merchant = await prisma.merchant.findUnique({ where: { userId: req.user.id } });
  res.json({ merchant });
});

module.exports = router;
