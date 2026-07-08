const express = require("express");
const router = express.Router();
const prisma = require("../services/prisma");
const auth = require("../middleware/auth");

// Get transaction history for the authenticated user (customer or merchant)
router.get("/", auth, async (req, res) => {
  const { limit = 20, offset = 0 } = req.query;

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get transactions where the user is either sender or receiver
    const transactions = await prisma.transaction.findMany({
      where: {
        OR: [
          { fromAddress: user.walletAddress },
          { toAddress: user.walletAddress },
        ],
      },
      orderBy: { timestamp: "desc" },
      take: parseInt(limit),
      skip: parseInt(offset),
    });

    const total = await prisma.transaction.count({
      where: {
        OR: [
          { fromAddress: user.walletAddress },
          { toAddress: user.walletAddress },
        ],
      },
    });

    res.json({
      transactions,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total,
      },
    });
  } catch (err) {
    console.error("Transaction history error:", err);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

// Also allow fetching by wallet address (for admin or cross-wallet views)
router.get("/:walletAddress", auth, async (req, res) => {
  const { walletAddress } = req.params;
  const { limit = 20, offset = 0 } = req.query;

  // Only allow if user is either the wallet owner or an admin
  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
  });

  if (user.walletAddress !== walletAddress && !req.user.isAdmin) {
    return res.status(403).json({ error: "Access denied" });
  }

  try {
    const transactions = await prisma.transaction.findMany({
      where: {
        OR: [{ fromAddress: walletAddress }, { toAddress: walletAddress }],
      },
      orderBy: { timestamp: "desc" },
      take: parseInt(limit),
      skip: parseInt(offset),
    });

    res.json({ transactions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

module.exports = router;
