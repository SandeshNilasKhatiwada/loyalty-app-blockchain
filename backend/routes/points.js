const router = require("express").Router();
const prisma = require("../services/prisma");
const auth = require("../middleware/auth");

// Get customer points balance by email
router.get("/balance/:email", async (req, res) => {
  const customer = await prisma.customer.findUnique({ where: { email: req.params.email } });
  if (!customer) return res.json({ balance: "0", found: false });
  res.json({ balance: customer.pointsBalance.toString(), found: true, name: customer.name });
});

// Get current user/merchant info
router.get("/me", auth, async (req, res) => {
  if (req.merchant) {
    return res.json({ type: "merchant", merchant: req.merchant });
  }
  if (req.user) {
    return res.json({ type: "user", user: req.user });
  }
  res.status(404).json({ error: "Not found" });
});

module.exports = router;
