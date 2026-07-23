const { jwtVerify, createRemoteJWKSet } = require("jose");
const { verify } = require("../services/jwt");
const prisma = require("../services/prisma");

const privyJWKS = createRemoteJWKSet(new URL(`https://auth.privy.io/api/v1/apps/${process.env.PRIVY_APP_ID}/jwks.json`));
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "").toLowerCase();

function isCompactJWS(token) {
  return typeof token === "string" && token.split(".").length === 3;
}

async function autoPromoteAdmin(user) {
  if (!user.isAdmin && user.email && user.email.toLowerCase() === ADMIN_EMAIL) {
    user = await prisma.user.update({ where: { id: user.id }, data: { isAdmin: true } });
  }
  return user;
}

module.exports = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: "No token" });
  const token = header.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Bad format" });

  try {
    let user = null;
    let merchant = null;

    if (isCompactJWS(token)) {
      try {
        const { payload } = await jwtVerify(token, privyJWKS, { issuer: "privy.io", audience: process.env.PRIVY_APP_ID });
        user = await prisma.user.findUnique({ where: { privyUserId: payload.sub } });
        merchant = await prisma.merchant.findUnique({ where: { privyUserId: payload.sub } });
        if (!user && !merchant) {
          const email = payload.email || null;
          if (email && email.toLowerCase() === ADMIN_EMAIL) {
            user = await prisma.user.create({
              data: { privyUserId: payload.sub, email, name: payload.email || "Admin", isAdmin: true },
            });
          }
        }
        if (user && payload.email && !user.email) {
          user = await prisma.user.update({ where: { id: user.id }, data: { email: payload.email } });
          user = await autoPromoteAdmin(user);
        }
        if (merchant && payload.email && !merchant.email) {
          merchant = await prisma.merchant.update({ where: { id: merchant.id }, data: { email: payload.email } });
        }
        if (user) req.user = user;
        if (merchant) req.merchant = merchant;
        if (req.user) {
          if (req.user.status && req.user.status !== "ACTIVE") {
            return res.status(403).json({ error: `Account ${req.user.status.toLowerCase()}` });
          }
          return next();
        }
        if (req.merchant) {
          if (req.merchant.status && req.merchant.status !== "ACTIVE") {
            return res.status(403).json({ error: `Account ${req.merchant.status.toLowerCase()}` });
          }
          return next();
        }
      } catch (joseErr) {
        console.warn("Privy verify error:", joseErr.code || joseErr.message);
      }
    }

    const decoded = verify(token);
    if (decoded.type === "merchant") {
      merchant = await prisma.merchant.findUnique({ where: { id: decoded.merchantId } });
      if (!merchant) return res.status(401).json({ error: "Merchant not found" });
      if (merchant.status && merchant.status !== "ACTIVE") {
        return res.status(403).json({ error: `Account ${merchant.status.toLowerCase()}` });
      }
      req.merchant = merchant;
      return next();
    }
    user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) return res.status(401).json({ error: "User not found" });
    user = await autoPromoteAdmin(user);
    if (user.status && user.status !== "ACTIVE") {
      return res.status(403).json({ error: `Account ${user.status.toLowerCase()}` });
    }
    req.user = user;
    next();
  } catch { res.status(401).json({ error: "Invalid token" }); }
};
