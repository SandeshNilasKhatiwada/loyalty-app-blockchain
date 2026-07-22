const test = require("node:test");
const assert = require("node:assert");
const prisma = require("../services/prisma");

test("database is connected", async () => {
  const result = await prisma.$queryRaw`SELECT 1 as val`;
  assert.equal(result[0].val, 1);
});

test("can create and find user", async () => {
  const wa = `0x${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
  const user = await prisma.user.create({ data: { walletAddress: wa, email: "test@test.com" } });
  assert.ok(user.id);
  assert.equal(user.walletAddress, wa);
  const found = await prisma.user.findUnique({ where: { walletAddress: wa } });
  assert.equal(found.id, user.id);
  await prisma.user.delete({ where: { id: user.id } });
});
