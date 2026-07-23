import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((c) => {
  const t = localStorage.getItem("loyalchain_token");
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});

api.interceptors.response.use(
  (r) => r,
  (e) => {
    if (e.response?.status === 401) {
      localStorage.removeItem("loyalchain_token");
      localStorage.removeItem("loyalchain_type");
      window.location.href = "/login";
    }
    return Promise.reject(e);
  },
);

export default api;
