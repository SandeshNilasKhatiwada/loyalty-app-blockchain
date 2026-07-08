const prisma = require("../services/prisma");

module.exports = async (req, res, next) => {
  try {
    // Get the user from the JWT (already attached by auth middleware)
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { walletAddress: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if wallet is in admin list
    const adminWallets =
      process.env.ADMIN_WALLETS?.split(",").map((w) => w.trim()) || [];
    const isAdmin = adminWallets.includes(user.walletAddress);

    if (!isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    // Attach admin flag
    req.user.isAdmin = true;
    next();
  } catch (err) {
    console.error("Admin middleware error:", err);
    res.status(500).json({ error: "Admin check failed" });
  }
};
