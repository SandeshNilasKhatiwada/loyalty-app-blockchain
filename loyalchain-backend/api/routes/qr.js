const express = require("express");
const router = express.Router();
const { ethers } = require("ethers");
const crypto = require("crypto");
const redis = require("../services/redis");
const auth = require("../middleware/auth");

// 1. Generate a nonce for QR code
router.post("/nonce", auth, async (req, res) => {
  try {
    const walletAddress = req.user.walletAddress;
    const nonce = crypto.randomUUID();
    const expiresAt = Date.now() + 60000; // 60 seconds from now

    // Store in Redis with 60-second TTL
    await redis.setex(
      `qr:nonce:${nonce}`,
      60,
      JSON.stringify({ walletAddress, used: false }),
    );

    res.json({
      success: true,
      nonce,
      walletAddress,
      expiresAt,
    });
  } catch (err) {
    console.error("QR nonce generation error:", err);
    res.status(500).json({ error: "Failed to generate nonce" });
  }
});

// 2. Validate a scanned QR payload (called by merchant)
router.post("/validate", auth, async (req, res) => {
  const { walletAddress, nonce, signature, data } = req.body;

  if (!walletAddress || !nonce || !signature || !data) {
    return res.status(400).json({
      error: "Missing required fields: walletAddress, nonce, signature, data",
    });
  }

  try {
    // 2.1 – Check if nonce exists in Redis
    const storedRaw = await redis.get(`qr:nonce:${nonce}`);
    if (!storedRaw) {
      return res.status(400).json({ error: "Invalid or expired nonce" });
    }

    const stored = JSON.parse(storedRaw);

    // 2.2 – Verify the nonce hasn't been used already
    if (stored.used) {
      return res
        .status(400)
        .json({ error: "Nonce already used (replay attack prevented)" });
    }

    // 2.3 – Verify the signature matches the wallet address
    // The `data` is the stringified payload that the frontend signed
    const recoveredAddress = ethers.verifyMessage(data, signature);
    if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      return res.status(403).json({ error: "Invalid signature" });
    }

    // 2.4 – Mark nonce as used (prevent replay)
    await redis.setex(
      `qr:nonce:${nonce}`,
      60, // keep for a bit longer to track usage
      JSON.stringify({ ...stored, used: true }),
    );

    // 2.5 – Parse the data and return it to the merchant
    // The data should be JSON containing: { action, amount, merchantId, etc. }
    const parsedData = JSON.parse(data);

    res.json({
      success: true,
      walletAddress,
      data: parsedData,
    });
  } catch (err) {
    console.error("QR validation error:", err);
    res.status(500).json({
      error: "Validation failed",
      details: err.message,
    });
  }
});

module.exports = router;
