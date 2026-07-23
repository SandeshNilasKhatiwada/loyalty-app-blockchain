import api from "./api";

export const adminApi = {
  login: (d) => api.post("/auth/admin/login", d),
  pending: () => api.get("/admin/merchants/pending"),
  merchants: () => api.get("/admin/merchants"),
  approve: (id) => api.patch(`/admin/merchants/${id}/approve`),
  reject: (id) => api.patch(`/admin/merchants/${id}/reject`),
  stats: () => api.get("/admin/stats"),
  topup: (id, d) => api.post(`/admin/merchants/${id}/topup`, d),
};

export const merchantApi = {
  register: (d) => api.post("/auth/merchant/register", d, { headers: { "Content-Type": "multipart/form-data" } }),
  login: (d) => api.post("/auth/merchant/login", d),
  status: () => api.get("/merchant/status"),
  award: (d) => api.post("/merchant/award", d),
  customers: () => api.get("/merchant/customers"),
  topup: (d) => api.post("/merchant/topup", d),
  createCheckoutSession: (d) => api.post("/merchant/create-checkout-session", d),
  checkoutSuccess: (d) => api.post("/merchant/checkout-success", d),
  refreshToken: () => api.post("/merchant/refresh-token"),
};

export const points = {
  balanceByEmail: (email) => api.get(`/points/balance/${encodeURIComponent(email)}`),
  me: () => api.get("/points/me"),
};
