const { jwtVerify } = require("jose");
const prisma = require("../services/prisma");

/**
 * Verify Privy JWT and attach user to request
 */
module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "No authorization header" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Invalid token format" });
  }

  try {
    // Verify JWT with Privy's app secret
    const secret = new TextEncoder().encode(process.env.PRIVY_APP_SECRET);
    const { payload } = await jwtVerify(token, secret, {
      issuer: "privy.io",
      audience: process.env.PRIVY_APP_ID,
    });

    // Privy payload structure
    const privyUserId = payload.sub;
    const walletAddress = payload.wallet || payload.wallets?.[0]?.address;

    if (!privyUserId || !walletAddress) {
      return res.status(401).json({ error: "Invalid Privy token" });
    }

    // Find or create user in database
    let user = await prisma.user.findUnique({
      where: { privyUserId },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          privyUserId,
          walletAddress,
          email: payload.email || null,
        },
      });
    } else {
      // Update wallet address if changed
      if (user.walletAddress !== walletAddress) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { walletAddress },
        });
      }
    }

    req.user = user;
    req.privyPayload = payload;
    next();
  } catch (err) {
    console.error("Auth error:", err);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};
