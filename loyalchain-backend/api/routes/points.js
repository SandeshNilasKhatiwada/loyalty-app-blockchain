const express = require("express");
const router = express.Router();
const prisma = require("../services/prisma");
const blockchain = require("../services/blockchain");
const auth = require("../middleware/auth");

// 1. Award points to a customer (merchant only)
router.post("/award", auth, async (req, res) => {
  const { customerWallet, amount, purchaseAmount } = req.body;

  // Validate input
  if (!customerWallet || !amount) {
    return res
      .status(400)
      .json({ error: "customerWallet and amount are required" });
  }

  if (isNaN(amount) || BigInt(amount) <= 0) {
    return res.status(400).json({ error: "Amount must be a positive number" });
  }

  try {
    // 1.1 – Get the authenticated user
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });

    if (!user || !user.isMerchant) {
      return res.status(403).json({ error: "Only merchants can award points" });
    }

    // 1.2 – Get the merchant record
    const merchant = await prisma.merchant.findUnique({
      where: { userId: user.id },
    });

    if (!merchant) {
      return res.status(404).json({ error: "Merchant profile not found" });
    }

    if (merchant.kybStatus !== "APPROVED") {
      return res.status(403).json({ error: "Merchant is not approved yet" });
    }

    const tokenAddress = merchant.tokenContract;
    if (!tokenAddress) {
      return res
        .status(400)
        .json({ error: "Merchant token not deployed. Please contact admin." });
    }

    // 1.3 – Check if customer exists (optional – create if not)
    let customer = await prisma.user.findUnique({
      where: { walletAddress: customerWallet },
    });

    if (!customer) {
      // Auto-create customer account (optional)
      customer = await prisma.user.create({
        data: {
          walletAddress: customerWallet,
          displayName: `Customer-${customerWallet.slice(0, 6)}`,
        },
      });
    }

    // 1.4 – Mint tokens on-chain
    console.log(`Minting ${amount} tokens to ${customerWallet}...`);
    const tx = await blockchain.mintTokens(
      tokenAddress,
      customerWallet,
      amount,
    );
    console.log(`Transaction hash: ${tx.hash}`);

    // 1.5 – Save transaction in database
    await prisma.transaction.create({
      data: {
        txHash: tx.hash,
        type: "AWARD",
        fromAddress: user.walletAddress,
        toAddress: customerWallet,
        amount: amount.toString(),
        tokenContract: tokenAddress,
        merchantId: merchant.id,
      },
    });

    // 1.6 – (Optional) Check for active campaigns and award bonus points
    // We'll implement campaign logic later

    res.json({
      success: true,
      txHash: tx.hash,
      amount: amount.toString(),
      customerWallet,
    });
  } catch (err) {
    console.error("Award error:", err);
    res.status(500).json({
      error: "Failed to award points",
      details: err.message,
    });
  }
});

// 2. Get token balance for a wallet (any authenticated user)
router.get("/balance/:walletAddress", auth, async (req, res) => {
  const { walletAddress } = req.params;
  const { tokenContract } = req.query; // optional – if not provided, get all balances?

  if (!walletAddress) {
    return res.status(400).json({ error: "walletAddress is required" });
  }

  try {
    // If tokenContract is provided, get that specific balance
    if (tokenContract) {
      const balance = await blockchain.getBalance(tokenContract, walletAddress);
      return res.json({
        walletAddress,
        tokenContract,
        balance: balance.toString(),
      });
    }

    // If no tokenContract, get balances for all merchants the user has interacted with
    // For simplicity, we'll just return a message
    res.json({
      message: "Please provide tokenContract query parameter",
      example: "/balance/0x123?tokenContract=0x456",
    });
  } catch (err) {
    console.error("Balance error:", err);
    res.status(500).json({ error: "Failed to fetch balance" });
  }
});

// 3. Get merchant's own token info
router.get("/merchant/token", auth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });

    if (!user || !user.isMerchant) {
      return res.status(403).json({ error: "Only merchants can access this" });
    }

    const merchant = await prisma.merchant.findUnique({
      where: { userId: user.id },
    });

    if (!merchant) {
      return res.status(404).json({ error: "Merchant profile not found" });
    }

    // Get on-chain balance of merchant's own token
    let balance = "0";
    if (merchant.tokenContract) {
      balance = await blockchain.getBalance(
        merchant.tokenContract,
        user.walletAddress,
      );
    }

    res.json({
      merchant: {
        id: merchant.id,
        businessName: merchant.businessName,
        kybStatus: merchant.kybStatus,
        tokenContract: merchant.tokenContract,
        balance: balance.toString(),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch merchant info" });
  }
});

// 4. Redeem points (customer spends points at merchant)
router.post("/redeem", auth, async (req, res) => {
  const { customerWallet, amount, tokenContract, nonce } = req.body;

  if (!customerWallet || !amount || !tokenContract || !nonce) {
    return res.status(400).json({
      error:
        "Missing required fields: customerWallet, amount, tokenContract, nonce",
    });
  }

  try {
    // 4.1 – Get authenticated merchant
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });

    if (!user || !user.isMerchant) {
      return res.status(403).json({ error: "Only merchants can redeem" });
    }

    const merchant = await prisma.merchant.findUnique({
      where: { userId: user.id },
    });

    if (!merchant || merchant.kybStatus !== "APPROVED") {
      return res.status(403).json({ error: "Merchant not approved" });
    }

    // 4.2 – Validate that the token contract matches the merchant's token
    if (merchant.tokenContract !== tokenContract) {
      return res
        .status(400)
        .json({ error: "Token contract does not match merchant" });
    }

    // 4.3 – Check customer balance
    const balance = await blockchain.getBalance(tokenContract, customerWallet);
    if (BigInt(balance) < BigInt(amount)) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    // 4.4 – Optional: validate that the nonce was indeed generated and unused
    // We already validated it in /api/qr/validate, but we can double-check Redis
    const storedRaw = await redis.get(`qr:nonce:${nonce}`);
    if (!storedRaw) {
      return res.status(400).json({ error: "Invalid nonce" });
    }
    const stored = JSON.parse(storedRaw);
    if (stored.used !== true) {
      return res.status(400).json({ error: "Nonce not validated yet" });
    }

    // 4.5 – Burn tokens from customer's wallet (platform wallet calls burnFrom)
    console.log(`Burning ${amount} tokens from ${customerWallet}...`);
    const tx = await blockchain.burnFromCustomer(
      tokenContract,
      customerWallet,
      amount,
    );
    console.log(`Transaction hash: ${tx.hash}`);

    // 4.6 – Save transaction in database
    await prisma.transaction.create({
      data: {
        txHash: tx.hash,
        type: "REDEEM",
        fromAddress: customerWallet,
        toAddress: user.walletAddress, // merchant wallet
        amount: amount.toString(),
        tokenContract: tokenContract,
        merchantId: merchant.id,
      },
    });

    // 4.7 – (Optional) apply discount in merchant's POS – handled off-chain

    res.json({
      success: true,
      txHash: tx.hash,
      amount: amount.toString(),
      customerWallet,
    });
  } catch (err) {
    console.error("Redemption error:", err);
    res.status(500).json({ error: "Redemption failed", details: err.message });
  }
});

module.exports = router;
