const router = require("express").Router();
const prisma = require("../services/prisma");
const blockchain = require("../services/blockchain");
const auth = require("../middleware/auth");

router.post("/award", auth, async (req, res) => {
  const { customerWallet, amount } = req.body;
  if (!customerWallet || !amount) return res.status(400).json({ error: "customerWallet and amount required" });
  try {
    const user = req.user;
    if (!user.isMerchant) return res.status(403).json({ error: "Merchants only" });
    const merchant = await prisma.merchant.findUnique({ where: { userId: user.id } });
    if (!merchant || merchant.kybStatus !== "APPROVED") return res.status(403).json({ error: "Merchant not approved" });
    if (!merchant.tokenContract) return res.status(400).json({ error: "No token deployed" });

    let customer = await prisma.user.findUnique({ where: { walletAddress: customerWallet } });
    if (!customer) customer = await prisma.user.create({ data: { walletAddress: customerWallet } });

    const tx = await blockchain.mintTokens(merchant.tokenContract, customerWallet, amount.toString());
    await prisma.transaction.create({
      data: { txHash: tx.hash || "MOCK:" + Date.now(), type: "AWARD", fromAddress: user.walletAddress, toAddress: customerWallet, amount: amount.toString(), tokenContract: merchant.tokenContract, merchantId: merchant.id, userId: customer.id },
    });
    res.json({ success: true, txHash: tx.hash, amount: amount.toString() });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/redeem", auth, async (req, res) => {
  const { customerWallet, amount, tokenContract } = req.body;
  if (!customerWallet || !amount || !tokenContract) return res.status(400).json({ error: "Missing fields" });
  try {
    const user = req.user;
    if (!user.isMerchant) return res.status(403).json({ error: "Merchants only" });
    const merchant = await prisma.merchant.findUnique({ where: { userId: user.id } });
    if (!merchant || merchant.kybStatus !== "APPROVED") return res.status(403).json({ error: "Merchant not approved" });
    if (merchant.tokenContract !== tokenContract) return res.status(400).json({ error: "Token mismatch" });

    const balance = await blockchain.getBalance(tokenContract, customerWallet);
    if (BigInt(balance) < BigInt(amount)) return res.status(400).json({ error: "Insufficient balance" });

    const tx = await blockchain.burnFromCustomer(tokenContract, customerWallet, amount.toString());
    await prisma.transaction.create({
      data: { txHash: tx.hash || "MOCK:" + Date.now(), type: "REDEEM", fromAddress: customerWallet, toAddress: user.walletAddress, amount: amount.toString(), tokenContract, merchantId: merchant.id },
    });
    res.json({ success: true, txHash: tx.hash, amount });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get("/balance/:walletAddress", async (req, res) => {
  const { tokenContract } = req.query;
  if (!tokenContract) return res.status(400).json({ error: "tokenContract query param required" });
  const balance = await blockchain.getBalance(tokenContract, req.params.walletAddress);
  res.json({ walletAddress: req.params.walletAddress, tokenContract, balance: balance.toString() });
});

router.get("/merchant-token", auth, async (req, res) => {
  const user = req.user;
  if (!user.isMerchant) return res.status(403).json({ error: "Merchants only" });
  const merchant = await prisma.merchant.findUnique({ where: { userId: user.id } });
  if (!merchant) return res.status(404).json({ error: "Merchant not found" });
  let balance = "0";
  if (merchant.tokenContract) balance = await blockchain.getBalance(merchant.tokenContract, user.walletAddress);
  res.json({ merchant: { ...merchant, balance: balance.toString() } });
});

router.get("/history", auth, async (req, res) => {
  const transactions = await prisma.transaction.findMany({
    where: { OR: [{ fromAddress: req.user.walletAddress }, { toAddress: req.user.walletAddress }] },
    orderBy: { createdAt: "desc" }, take: 50,
  });
  res.json({ transactions });
});

module.exports = router;
