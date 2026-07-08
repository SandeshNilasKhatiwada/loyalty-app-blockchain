const express = require("express");
const router = express.Router();
const prisma = require("../services/prisma");
const { signToken } = require("../services/jwt");

// 1. Customer Signup (create user by wallet address)
router.post("/signup", async (req, res) => {
  const { walletAddress, phone, email, displayName } = req.body;

  if (!walletAddress) {
    return res.status(400).json({ error: "walletAddress is required" });
  }

  try {
    let user = await prisma.user.findUnique({
      where: { walletAddress },
    });

    if (!user) {
      user = await prisma.user.create({
        data: { walletAddress, phone, email, displayName },
      });
    }

    const token = signToken({
      userId: user.id,
      walletAddress: user.walletAddress,
      isMerchant: user.isMerchant,
    });

    res.json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Signup failed" });
  }
});

// 2. Merchant Signup (with KYB info)
router.post("/merchant-signup", async (req, res) => {
  const {
    walletAddress,
    businessName,
    registrationNumber,
    phone,
    email,
    displayName,
  } = req.body;

  if (!walletAddress || !businessName) {
    return res
      .status(400)
      .json({ error: "walletAddress and businessName are required" });
  }

  try {
    // Create or update user
    let user = await prisma.user.findUnique({
      where: { walletAddress },
    });

    if (!user) {
      user = await prisma.user.create({
        data: { walletAddress, phone, email, displayName, isMerchant: true },
      });
    } else {
      // Upgrade to merchant if not already
      if (!user.isMerchant) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { isMerchant: true },
        });
      }
    }

    // Create merchant record (KYB pending)
    let merchant = await prisma.merchant.findUnique({
      where: { userId: user.id },
    });

    if (!merchant) {
      merchant = await prisma.merchant.create({
        data: {
          userId: user.id,
          businessName,
          registrationNumber,
          kybStatus: "PENDING",
        },
      });
    }

    const token = signToken({
      userId: user.id,
      walletAddress: user.walletAddress,
      isMerchant: true,
      merchantId: merchant.id,
    });

    res.json({ token, user, merchant });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Merchant signup failed" });
  }
});

// 3. Login (by wallet address)
router.post("/login", async (req, res) => {
  const { walletAddress } = req.body;

  if (!walletAddress) {
    return res.status(400).json({ error: "walletAddress required" });
  }

  const user = await prisma.user.findUnique({
    where: { walletAddress },
  });

  if (!user) {
    return res
      .status(404)
      .json({ error: "User not found. Please signup first." });
  }

  const token = signToken({
    userId: user.id,
    walletAddress: user.walletAddress,
    isMerchant: user.isMerchant,
  });

  res.json({ token, user });
});

module.exports = router;

