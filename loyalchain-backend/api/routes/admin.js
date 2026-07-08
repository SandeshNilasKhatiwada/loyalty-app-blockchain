const express = require("express");
const router = express.Router();
const prisma = require("../services/prisma");
const blockchain = require("../services/blockchain");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

// 1. List all merchants with PENDING status
router.get("/merchants/pending", auth, admin, async (req, res) => {
  try {
    const merchants = await prisma.merchant.findMany({
      where: { kybStatus: "PENDING" },
      include: {
        user: {
          select: {
            walletAddress: true,
            phone: true,
            email: true,
            displayName: true,
          },
        },
      },
    });
    res.json({ merchants });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch pending merchants" });
  }
});

// 2. Approve a merchant (deploy token, update DB, add to registry)
router.patch("/merchants/:id/approve", auth, admin, async (req, res) => {
  const { id } = req.params;
  const { tokenName, tokenSymbol } = req.body; // optional custom name/symbol

  try {
    // 2.1 – Fetch merchant
    const merchant = await prisma.merchant.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!merchant) {
      return res.status(404).json({ error: "Merchant not found" });
    }

    if (merchant.kybStatus === "APPROVED") {
      return res.status(400).json({ error: "Merchant already approved" });
    }

    const merchantWallet = merchant.user.walletAddress;

    // 2.2 – Generate token name and symbol
    const name = tokenName || `${merchant.businessName} Loyalty Token`;
    const symbol =
      tokenSymbol || merchant.businessName.slice(0, 5).toUpperCase();

    // 2.3 – Deploy LoyalToken via Factory contract
    console.log(`Deploying token for merchant ${merchantWallet}...`);
    const tokenAddress = await blockchain.deployTokenForMerchant(
      merchantWallet,
      name,
      symbol,
    );
    console.log(`Token deployed at: ${tokenAddress}`);

    // 2.4 – Add merchant to on-chain Registry
    await blockchain.addMerchantToRegistry(merchantWallet, tokenAddress);
    console.log("Merchant added to registry");

    // 2.5 – Update merchant in database
    const updatedMerchant = await prisma.merchant.update({
      where: { id },
      data: {
        kybStatus: "APPROVED",
        tokenContract: tokenAddress,
      },
    });

    // 2.6 – (Optional) Record the deployment as a "TOPUP" transaction with amount 0
    await prisma.transaction.create({
      data: {
        txHash: "DEPLOYMENT", // we don't have a tx hash for the deployment itself (we could get it)
        type: "DEPLOY",
        fromAddress: merchantWallet,
        toAddress: tokenAddress,
        amount: "0",
        tokenContract: tokenAddress,
        merchantId: merchant.id,
      },
    });

    res.json({
      success: true,
      merchant: updatedMerchant,
      tokenAddress,
    });
  } catch (err) {
    console.error("Approval error:", err);
    res.status(500).json({
      error: "Merchant approval failed",
      details: err.message,
    });
  }
});

// 3. Reject a merchant (optional)
router.patch("/merchants/:id/reject", auth, admin, async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  try {
    const merchant = await prisma.merchant.update({
      where: { id },
      data: {
        kybStatus: "REJECTED",
        // we could store rejection reason in a separate field (add to schema later)
      },
    });
    res.json({ success: true, merchant });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Rejection failed" });
  }
});

module.exports = router;
