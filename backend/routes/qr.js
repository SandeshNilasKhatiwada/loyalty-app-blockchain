const router = require("express").Router();
const crypto = require("crypto");
const { ethers } = require("ethers");
const redis = require("../services/redis");
const auth = require("../middleware/auth");

router.post("/nonce", auth, async (req, res) => {
  const nonce = crypto.randomUUID();
  await redis.setex(`qr:nonce:${nonce}`, 60, JSON.stringify({ walletAddress: req.user.walletAddress, used: false }));
  res.json({ success: true, nonce, walletAddress: req.user.walletAddress, expiresAt: Date.now() + 60000 });
});

router.post("/validate", auth, async (req, res) => {
  const { walletAddress, nonce, signature, data } = req.body;
  if (!walletAddress || !nonce || !signature || !data) return res.status(400).json({ error: "Missing fields" });
  try {
    const raw = await redis.get(`qr:nonce:${nonce}`);
    if (!raw) return res.status(400).json({ error: "Invalid/expired nonce" });
    const stored = JSON.parse(raw);
    if (stored.used) return res.status(400).json({ error: "Already used" });
    const recovered = ethers.verifyMessage(data, signature);
    if (recovered.toLowerCase() !== walletAddress.toLowerCase()) return res.status(403).json({ error: "Invalid signature" });
    await redis.setex(`qr:nonce:${nonce}`, 60, JSON.stringify({ ...stored, used: true }));
    res.json({ success: true, walletAddress, data: JSON.parse(data) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
