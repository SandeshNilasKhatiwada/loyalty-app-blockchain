const { jwtVerify, createRemoteJWKSet } = require("jose");
const { verify } = require("../services/jwt");
const prisma = require("../services/prisma");

const privyJWKS = createRemoteJWKSet(new URL(`https://auth.privy.io/api/v1/apps/${process.env.PRIVY_APP_ID}/jwks.json`));

module.exports = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: "No token" });
  const token = header.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Bad format" });

  try {
    try {
      const { payload } = await jwtVerify(token, privyJWKS, { issuer: "privy.io", audience: process.env.PRIVY_APP_ID });
      let user = await prisma.user.findUnique({ where: { privyUserId: payload.sub } });
      if (!user) {
        const wa = payload.wallet || payload.wallets?.[0]?.address || null;
        user = await prisma.user.create({ data: { privyUserId: payload.sub, walletAddress: wa, email: payload.email || null } });
      }
      req.user = user;
      return next();
    } catch {}

    const decoded = verify(token);
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) return res.status(401).json({ error: "User not found" });
    req.user = user;
    next();
  } catch { res.status(401).json({ error: "Invalid token" }); }
};
