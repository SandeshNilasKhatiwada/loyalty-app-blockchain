import api from "./api";

export const auth = {
  login: (d) => api.post("/auth/login", d),
  signup: (d) => api.post("/auth/signup", d),
  merchantSignup: (d) => api.post("/auth/merchant-signup", d),
  me: () => api.get("/auth/me"),
};

export const points = {
  award: (d) => api.post("/points/award", d),
  redeem: (d) => api.post("/points/redeem", d),
  balance: () => api.get("/points/balance"),
  balanceByEmail: (email) => api.get(`/points/balance/${encodeURIComponent(email)}`),
  history: () => api.get("/points/history"),
  merchantToken: () => api.get("/points/merchant-token"),
};

export const merchant = {
  topup: (d) => api.post("/merchant/topup", d),
  status: () => api.get("/merchant/status"),
  customers: () => api.get("/merchant/customers"),
  requestAward: (d) => api.post("/merchant/request-award", d),
  pendingAwards: () => api.get("/merchant/pending-awards"),
  approveAward: (d) => api.post("/merchant/approve-award", d),
  rejectAward: (d) => api.post("/merchant/reject-award", d),
  createPaymentIntent: (d) => api.post("/merchant/create-payment-intent", d),
  confirmPayment: (d) => api.post("/merchant/confirm-payment", d),
  deleteAccount: () => api.delete("/merchant/account"),
};

export const merchants = {
  public: () => api.get("/merchants/public"),
};

export const transactions = {
  list: (p) => api.get("/transactions", { params: p }),
  byWallet: (wa, p) => api.get(`/transactions/${wa}`, { params: p }),
};

export const swap = {
  quote: (d) => api.post("/swap/quote", d),
  execute: (d) => api.post("/swap/execute", d),
};

export const admin = {
  pending: () => api.get("/admin/merchants/pending"),
  merchants: () => api.get("/admin/merchants"),
  approve: (id, d) => api.patch(`/admin/merchants/${id}/approve`, d),
  reject: (id) => api.patch(`/admin/merchants/${id}/reject`),
  stats: () => api.get("/admin/stats"),
  users: () => api.get("/admin/users"),
  setAdmin: (id) => api.patch(`/admin/users/${id}/set-admin`),
  blockUser: (id) => api.patch(`/admin/users/${id}/block`),
  suspendUser: (id) => api.patch(`/admin/users/${id}/suspend`),
  activateUser: (id) => api.patch(`/admin/users/${id}/activate`),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
};

export const analytics = {
  merchant: () => api.get("/analytics/merchant"),
  admin: () => api.get("/analytics/admin"),
};
