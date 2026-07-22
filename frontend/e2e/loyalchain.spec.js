import { test, expect } from "@playwright/test";

const WALLET = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
const BASE = "http://localhost:4000/api";

let authToken, authUser;

test.beforeAll(async ({ request }) => {
  await request.post("http://localhost:4000/api/test/reset");
  const r = await request.post(`${BASE}/auth/signup`, {
    data: { walletAddress: WALLET, email: "test@demo.com", name: "Test User" },
  });
  const b = await r.json();
  authToken = b.token;
  authUser = b.user;
});

test.describe("Backend API Health", () => {
  test("health endpoint returns ok", async ({ request }) => {
    const r = await request.get(`${BASE}/health`);
    expect(r.ok()).toBeTruthy();
    const b = await r.json();
    expect(b.ok).toBe(true);
  });

  test("root returns LoyalChain API", async ({ request }) => {
    const r = await request.get(`http://localhost:4000/`);
    const b = await r.json();
    expect(b.status).toBe("LoyalChain API");
  });
});

test.describe("Auth Flow", () => {
  test("signup creates user", async ({ request }) => {
    const r = await request.post(`${BASE}/auth/signup`, {
      data: { walletAddress: WALLET, email: "test@demo.com", name: "Test User" },
    });
    expect(r.ok()).toBeTruthy();
    const b = await r.json();
    expect(b.token).toBeTruthy();
    expect(b.user.walletAddress).toBe(WALLET);
  });

  test("login returns token", async ({ request }) => {
    const r = await request.post(`${BASE}/auth/login`, {
      data: { walletAddress: WALLET },
    });
    expect(r.ok()).toBeTruthy();
    const b = await r.json();
    expect(b.token).toBeTruthy();
  });

  test("get /me returns user", async ({ request }) => {
    const r = await request.post(`${BASE}/auth/login`, {
      data: { walletAddress: WALLET },
    });
    const b = await r.json();
    const mr = await request.get(`${BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${b.token}` },
    });
    expect(mr.ok()).toBeTruthy();
    const mb = await mr.json();
    expect(mb.user.walletAddress).toBe(WALLET);
  });

  test("invalid wallet returns 404", async ({ request }) => {
    const r = await request.post(`${BASE}/auth/login`, {
      data: { walletAddress: "0x0000000000000000000000000000000000000000" },
    });
    expect(r.status()).toBe(404);
  });
});

const MERCHANT_WALLET = "0x1111111111111111111111111111111111111111";

test.describe("Merchant Flow", () => {
  let token, merchantId;

  test.beforeAll(async ({ request }) => {
    const r = await request.post(`${BASE}/auth/signup`, {
      data: { walletAddress: MERCHANT_WALLET, email: "merchant@demo.com", name: "Merchant User" },
    });
    const b = await r.json();
    token = b.token;
  });

  test("merchant signup creates pending merchant", async ({ request }) => {
    const r = await request.post(`${BASE}/auth/merchant-signup`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { businessName: "Test Store", registrationNo: "REG-001" },
    });
    expect(r.ok()).toBeTruthy();
    const b = await r.json();
    expect(b.merchant.kybStatus).toBe("PENDING");
    merchantId = b.merchant.id;
  });

  test("non-admin cannot access admin routes", async ({ request }) => {
    const r = await request.get(`${BASE}/admin/merchants/pending`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(r.status()).toBe(403);
  });

  test("merchant status returns details", async ({ request }) => {
    const r = await request.get(`${BASE}/merchant/status`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(r.ok()).toBeTruthy();
    const b = await r.json();
    expect(b.merchant.businessName).toBe("Test Store");
  });

  test("points award fails for non-approved merchant", async ({ request }) => {
    const r = await request.post(`${BASE}/points/award`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { customerWallet: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", amount: "50" },
    });
    expect(r.status()).toBe(403);
    const b = await r.json();
    expect(b.error).toContain("not approved");
  });
});

test.describe("Swap & Transactions", () => {
  let token;

  test.beforeAll(async ({ request }) => {
    const r = await request.post(`${BASE}/auth/signup`, {
      data: { walletAddress: WALLET },
    });
    const b = await r.json();
    token = b.token;
  });

  test("swap quote returns mock data", async ({ request }) => {
    const r = await request.post(`${BASE}/swap/quote`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { tokenIn: "0x0000000000000000000000000000000000000001", tokenOut: "0x0000000000000000000000000000000000000002", amountIn: "100" },
    });
    expect(r.ok()).toBeTruthy();
    const b = await r.json();
    expect(b.quote.amountOut).toBeTruthy();
  });

  test("swap execute returns tx hash", async ({ request }) => {
    const r = await request.post(`${BASE}/swap/execute`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { tokenIn: "0x0000000000000000000000000000000000000001", tokenOut: "0x0000000000000000000000000000000000000002", amountIn: "100", amountOutMin: "95" },
    });
    expect(r.ok()).toBeTruthy();
    const b = await r.json();
    expect(b.swap.hash).toBeTruthy();
  });

  test("transactions list is paginated", async ({ request }) => {
    const r = await request.get(`${BASE}/transactions`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(r.ok()).toBeTruthy();
    const b = await r.json();
    expect(b.pagination).toBeTruthy();
    expect(typeof b.pagination.total).toBe("number");
  });
});

test.describe("Frontend Pages", () => {
  test("login page loads", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("text=LoyalChain")).toBeVisible();
    await expect(page.locator("text=Continue with Email")).toBeVisible();
  });

  test("login redirects when already authenticated", async ({ page, context }) => {
    await context.addInitScript((d) => {
      localStorage.setItem("loyalchain_token", d.token);
      localStorage.setItem("loyalchain_user", JSON.stringify(d.user));
    }, { token: authToken, user: authUser });
    await page.goto("/login");
    await expect(page).toHaveURL(/dashboard/);
  });

  test("dashboard shows wallet info", async ({ page, context }) => {
    await context.addInitScript((d) => {
      localStorage.setItem("loyalchain_token", d.token);
      localStorage.setItem("loyalchain_user", JSON.stringify(d.user));
    }, { token: authToken, user: authUser });
    await page.goto("/dashboard");
    await expect(page.locator("text=Dashboard")).toBeVisible();
    await expect(page.locator(`text=${WALLET.slice(0, 10)}`)).toBeVisible();
  });

  test("swap page loads after login", async ({ page, context }) => {
    await context.addInitScript((d) => {
      localStorage.setItem("loyalchain_token", d.token);
      localStorage.setItem("loyalchain_user", JSON.stringify(d.user));
    }, { token: authToken, user: authUser });
    await page.goto("/swap");
    await expect(page.locator("text=Swap Tokens")).toBeVisible();
    await expect(page.locator("text=Get Quote")).toBeVisible();
  });
});
