const router = require("express").Router();
const prisma = require("../services/prisma");
const { sign } = require("../services/jwt");
const { jwtVerify, createRemoteJWKSet } = require("jose");
const auth = require("../middleware/auth");

const privyJWKS = createRemoteJWKSet(new URL(`https://auth.privy.io/api/v1/apps/${process.env.PRIVY_APP_ID}/jwks.json`));

router.post("/signup", async (req, res) => {
  const { walletAddress, email, name } = req.body;
  if (!walletAddress) return res.status(400).json({ error: "walletAddress is required" });
  try {
    let user = await prisma.user.findUnique({ where: { walletAddress } });
    if (!user) user = await prisma.user.create({ data: { walletAddress, email, name } });
    res.json({ token: sign({ userId: user.id, walletAddress: user.walletAddress, isMerchant: user.isMerchant }), user });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/login", async (req, res) => {
  const { walletAddress, token: privyToken } = req.body;
  try {
    if (privyToken) {
      const { payload } = await jwtVerify(privyToken, privyJWKS, { issuer: "privy.io", audience: process.env.PRIVY_APP_ID });
      let user = await prisma.user.findUnique({ where: { privyUserId: payload.sub } });
      if (!user) user = await prisma.user.create({ data: { privyUserId: payload.sub, walletAddress: payload.wallet || payload.wallets?.[0]?.address || null, email: payload.email || null } });
      return res.json({ token: sign({ userId: user.id, walletAddress: user.walletAddress, isMerchant: user.isMerchant }), user });
    }
    if (!walletAddress) return res.status(400).json({ error: "Provide walletAddress" });
    const user = await prisma.user.findUnique({ where: { walletAddress } });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ token: sign({ userId: user.id, walletAddress: user.walletAddress, isMerchant: user.isMerchant }), user });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/merchant-signup", auth, async (req, res) => {
  const { businessName, registrationNo } = req.body;
  if (!businessName) return res.status(400).json({ error: "businessName is required" });
  try {
    let merchant = await prisma.merchant.findUnique({ where: { userId: req.user.id } });
    if (merchant) return res.status(400).json({ error: "Already a merchant" });
    merchant = await prisma.merchant.create({
      data: { userId: req.user.id, businessName, registrationNo: registrationNo || "", kybStatus: "PENDING", exchangeRate: 100, feeRate: 5 },
    });
    await prisma.user.update({ where: { id: req.user.id }, data: { isMerchant: true } });
    res.json({ merchant });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get("/me", auth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id }, include: { merchant: true } });
  res.json({ user });
});

module.exports = router;
