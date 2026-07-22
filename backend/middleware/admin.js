const prisma = require("../services/prisma");

module.exports = async (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: "Unauthenticated" });
  const wallets = (process.env.ADMIN_WALLETS || "").split(",").map(w => w.trim());
  if (!wallets.includes(req.user.walletAddress)) {
    return res.status(403).json({ error: "Admin only" });
  }
  req.user.isAdmin = true;
  next();
};
