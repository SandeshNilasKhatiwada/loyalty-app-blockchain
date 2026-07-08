const express = require("express");
const router = express.Router();
const prisma = require("../services/prisma");
const blockchain = require("../services/blockchain");
const auth = require("../middleware/auth");

// 1. Merchant top-up (buy tokens)
router.post("/topup", auth, async (req, res) => {
  const { amountNPR } = req.body; // amount in Nepali Rupees

  // Validate
  if (!amountNPR || isNaN(amountNPR) || amountNPR <= 0) {
    return res.status(400).json({ error: "Valid amountNPR is required" });
  }

  try {
    // 1.1 – Get authenticated user
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });

    if (!user || !user.isMerchant) {
      return res.status(403).json({ error: "Only merchants can top-up" });
    }

    // 1.2 – Get merchant record
    const merchant = await prisma.merchant.findUnique({
      where: { userId: user.id },
    });

    if (!merchant || merchant.kybStatus !== "APPROVED") {
      return res.status(403).json({ error: "Merchant not approved" });
    }

    const tokenAddress = merchant.tokenContract;
    if (!tokenAddress) {
      return res.status(400).json({ error: "Token contract not deployed" });
    }

    // 1.3 – Calculate tokens based on exchange rate (e.g., 1 token = 1 NPR)
    // In real scenario, you'd have configurable rate per merchant
    const exchangeRate = 1; // 1 NPR = 1 token
    const tokenAmount = Math.floor(amountNPR * exchangeRate);

    // Deduct platform fee (e.g., 5%)
    const fee = Math.floor(tokenAmount * 0.05);
    const netTokens = tokenAmount - fee;

    if (netTokens <= 0) {
      return res.status(400).json({ error: "Amount too small after fees" });
    }

    // 1.4 – Simulate payment gateway (eSewa/Khalti) – we'll just mock success
    // In production, you'd call payment gateway API and wait for webhook
    const paymentSuccess = true; // mock

    if (!paymentSuccess) {
      return res.status(402).json({ error: "Payment failed" });
    }

    // 1.5 – Mint tokens to merchant's wallet
    console.log(
      `Minting ${netTokens} tokens to merchant ${user.walletAddress}...`,
    );
    const tx = await blockchain.mintTokens(
      tokenAddress,
      user.walletAddress,
      netTokens.toString(),
    );
    console.log(`Transaction hash: ${tx.hash}`);

    // 1.6 – Save transaction
    await prisma.transaction.create({
      data: {
        txHash: tx.hash,
        type: "TOPUP",
        fromAddress: "platform", // or platform wallet
        toAddress: user.walletAddress,
        amount: netTokens.toString(),
        tokenContract: tokenAddress,
        merchantId: merchant.id,
      },
    });

    // 1.7 – (Optional) record the payment info in a separate Payment table – we'll skip for now

    res.json({
      success: true,
      txHash: tx.hash,
      amountNPR,
      fee,
      netTokens: netTokens.toString(),
      tokenContract: tokenAddress,
    });
  } catch (err) {
    console.error("Top-up error:", err);
    res.status(500).json({ error: "Top-up failed", details: err.message });
  }
});

module.exports = router;
