const router = require("express").Router();
const prisma = require("../services/prisma");
const auth = require("../middleware/auth");

router.get("/", auth, async (req, res) => {
  const { limit = 20, offset = 0 } = req.query;
  const where = { OR: [{ fromAddress: req.user.walletAddress }, { toAddress: req.user.walletAddress }] };
  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({ where, orderBy: { createdAt: "desc" }, take: +limit, skip: +offset }),
    prisma.transaction.count({ where }),
  ]);
  res.json({ transactions, pagination: { limit: +limit, offset: +offset, total } });
});

router.get("/:walletAddress", auth, async (req, res) => {
  if (req.user.walletAddress !== req.params.walletAddress && !req.user.isAdmin) {
    return res.status(403).json({ error: "Access denied" });
  }
  const { limit = 20, offset = 0 } = req.query;
  const where = { OR: [{ fromAddress: req.params.walletAddress }, { toAddress: req.params.walletAddress }] };
  const transactions = await prisma.transaction.findMany({ where, orderBy: { createdAt: "desc" }, take: +limit, skip: +offset });
  res.json({ transactions });
});

module.exports = router;
