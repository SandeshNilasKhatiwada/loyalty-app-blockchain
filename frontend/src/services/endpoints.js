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
  balance: (wa, tc) => api.get(`/points/balance/${wa}`, { params: { tokenContract: tc } }),
  history: () => api.get("/points/history"),
  merchantToken: () => api.get("/points/merchant-token"),
};

export const merchant = {
  topup: (d) => api.post("/merchant/topup", d),
  status: () => api.get("/merchant/status"),
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
};
