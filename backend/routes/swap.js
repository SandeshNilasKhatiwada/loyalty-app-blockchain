const router = require("express").Router();
const prisma = require("../services/prisma");
const uniswap = require("../services/uniswap");
const auth = require("../middleware/auth");

router.post("/quote", auth, async (req, res) => {
  const { tokenIn, tokenOut, amountIn, slippage } = req.body;
  if (!tokenIn || !tokenOut || !amountIn) return res.status(400).json({ error: "Missing fields" });
  try {
    const quote = await uniswap.getQuote(tokenIn, tokenOut, amountIn, slippage || 0.5);
    res.json({ success: true, quote });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/execute", auth, async (req, res) => {
  const { tokenIn, tokenOut, amountIn, amountOutMin, slippage } = req.body;
  if (!tokenIn || !tokenOut || !amountIn) return res.status(400).json({ error: "Missing fields" });
  try {
    const result = await uniswap.executeSwap(req.user.walletAddress, tokenIn, tokenOut, amountIn, amountOutMin, slippage || 0.5);
    await prisma.transaction.create({
      data: { txHash: result.hash, type: "SWAP", fromAddress: req.user.walletAddress, toAddress: process.env.UNISWAP_ROUTER_ADDRESS || "router", amount: amountIn.toString(), tokenContract: tokenIn, userId: req.user.id },
    });
    res.json({ success: true, swap: result });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
