const test = require("node:test");
const assert = require("node:assert");
const { getQuote, executeSwap } = require("../services/uniswap");

const LOYAL = "0x0000000000000000000000000000000000000001";
const USDC = "0x0000000000000000000000000000000000000002";
const SENDER = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

test("uniswap getQuote returns mock data", async () => {
  const q = await getQuote(LOYAL, USDC, "100");
  assert.ok(q.amountOut);
  assert.ok(q.amountOutMin);
});

test("uniswap executeSwap returns tx hash", async () => {
  const r = await executeSwap(SENDER, LOYAL, USDC, "100", "95");
  assert.ok(r.hash);
  assert.equal(r.status, "CONFIRMED");
});
