const express = require("express");
const router = express.Router();
const prisma = require("../services/prisma");
const auth = require("../middleware/auth");

// Login with Privy JWT
router.post("/login", async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ error: "Token required" });
  }

  try {
    const { jwtVerify } = require("jose");
    const secret = new TextEncoder().encode(process.env.PRIVY_APP_SECRET);
    const { payload } = await jwtVerify(token, secret, {
      issuer: "privy.io",
      audience: process.env.PRIVY_APP_ID,
    });

    const privyUserId = payload.sub;
    const walletAddress = payload.wallet || payload.wallets?.[0]?.address;

    let user = await prisma.user.findUnique({
      where: { privyUserId },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          privyUserId,
          walletAddress,
          email: payload.email || null,
          name: payload.name || null,
        },
      });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        email: user.email,
        name: user.name,
        isMerchant: user.isMerchant,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(401).json({ error: "Invalid token" });
  }
});

// Get current user (protected)
router.get("/me", auth, (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      walletAddress: req.user.walletAddress,
      email: req.user.email,
      name: req.user.name,
      isMerchant: req.user.isMerchant,
    },
  });
});

module.exports = router;
