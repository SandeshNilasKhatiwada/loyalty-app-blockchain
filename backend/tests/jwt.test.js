const test = require("node:test");
const assert = require("node:assert");
const { sign, verify } = require("../services/jwt");

test("JWT sign and verify", () => {
  const payload = { userId: "test-123", walletAddress: "0xabc" };
  const token = sign(payload);
  assert.ok(token);
  const decoded = verify(token);
  assert.equal(decoded.userId, "test-123");
  assert.equal(decoded.walletAddress, "0xabc");
});

test("JWT rejects bad token", () => {
  assert.throws(() => verify("bad-token"), /jwt/);
});
