const router = require("express").Router();
const multer = require("multer");
const path = require("path");
const prisma = require("../services/prisma");
const { sign } = require("../services/jwt");
const { jwtVerify, createRemoteJWKSet, errors } = require("jose");
const blockchain = require("../services/blockchain");
const auth = require("../middleware/auth");

const privyJWKS = createRemoteJWKSet(new URL(`https://auth.privy.io/api/v1/apps/${process.env.PRIVY_APP_ID}/jwks.json`));

const storage = multer.diskStorage({
  destination: path.join(__dirname, "../uploads"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_")),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

function isCompactJWS(token) {
  return typeof token === "string" && token.split(".").length === 3;
}

async function verifyPrivyToken(privyToken) {
  if (!isCompactJWS(privyToken)) throw new Error("Not a compact JWS");
  const { payload } = await jwtVerify(privyToken, privyJWKS, { issuer: "privy.io", audience: process.env.PRIVY_APP_ID });
  return payload;
}

router.post("/register", upload.fields([{ name: "citizenshipPhoto", maxCount: 1 }, { name: "documents", maxCount: 5 }]), async (req, res) => {
  try {
    const { token: privyToken, role, businessName, registrationNo, name: userName } = req.body;
    if (!privyToken) return res.status(400).json({ error: "Auth token required" });
    if (!role || !["user", "merchant", "admin"].includes(role)) return res.status(400).json({ error: "Valid role required (user/merchant/admin)" });

    const payload = await verifyPrivyToken(privyToken);
    let user = await prisma.user.findUnique({ where: { privyUserId: payload.sub } });
    if (!user) {
      user = await prisma.user.create({
        data: { privyUserId: payload.sub, walletAddress: payload.wallet || payload.wallets?.[0]?.address || null, email: payload.email || null, name: userName || payload.email || null },
      });
    }

    if (role === "admin") {
      return res.status(403).json({ error: "Admin accounts can only be created by other admins" });
    }

    if (role === "merchant") {
      if (!businessName) return res.status(400).json({ error: "Business name required for merchants" });
      if (user.isMerchant) return res.status(400).json({ error: "Already a merchant" });

      const citizenshipPhoto = req.files?.citizenshipPhoto?.[0]?.filename || null;
      const documents = req.files?.documents?.map((f) => f.filename) || [];

      await prisma.merchant.create({
        data: {
          userId: user.id, businessName, registrationNo: registrationNo || "",
          citizenshipPhoto, documents: JSON.stringify(documents),
          kybStatus: "PENDING", exchangeRate: 100, feeRate: 5,
        },
      });
      user = await prisma.user.update({ where: { id: user.id }, data: { isMerchant: true } });
    }

    const token = sign({ userId: user.id, walletAddress: user.walletAddress, isMerchant: user.isMerchant });
    const fullUser = await prisma.user.findUnique({ where: { id: user.id }, include: { merchant: true } });
    res.json({ token, user: fullUser });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: err.message || "Registration failed" });
  }
});

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
      const payload = await verifyPrivyToken(privyToken);
      let user = await prisma.user.findUnique({ where: { privyUserId: payload.sub } });
      if (!user) {
        user = await prisma.user.create({ data: { privyUserId: payload.sub, walletAddress: payload.wallet || payload.wallets?.[0]?.address || null, email: payload.email || null } });
      }
      if (user.status && user.status !== "ACTIVE") {
        return res.status(403).json({ error: `Account ${user.status.toLowerCase()}` });
      }
      return res.json({ token: sign({ userId: user.id, walletAddress: user.walletAddress, isMerchant: user.isMerchant }), user });
    }
    if (!walletAddress) return res.status(400).json({ error: "Provide walletAddress or token" });
    const user = await prisma.user.findUnique({ where: { walletAddress } });
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.status && user.status !== "ACTIVE") {
      return res.status(403).json({ error: `Account ${user.status.toLowerCase()}` });
    }
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
