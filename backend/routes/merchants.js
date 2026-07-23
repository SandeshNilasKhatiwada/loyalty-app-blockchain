const router = require("express").Router();
const prisma = require("../services/prisma");

router.get("/public", async (req, res) => {
  const merchants = await prisma.merchant.findMany({
    where: { kybStatus: "APPROVED" },
    select: {
      id: true,
      businessName: true,
      tokenSymbol: true,
      tokenName: true,
    },
    orderBy: { businessName: "asc" },
  });
  res.json({ merchants });
});

module.exports = router;
