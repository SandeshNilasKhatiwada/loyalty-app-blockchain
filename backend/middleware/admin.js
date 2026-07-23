module.exports = async (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: "Unauthenticated" });
  if (req.user.isAdmin) {
    req.user.isAdmin = true;
    return next();
  }
  const wallets = (process.env.ADMIN_WALLETS || "").split(",").map(w => w.trim());
  if (wallets.includes(req.user.walletAddress)) {
    req.user.isAdmin = true;
    return next();
  }
  return res.status(403).json({ error: "Admin only" });
};
