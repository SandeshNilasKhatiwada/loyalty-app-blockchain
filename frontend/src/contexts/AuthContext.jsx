import { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("loyalchain_token");
    const saved = localStorage.getItem("loyalchain_user");
    if (token && saved) {
      setUser(JSON.parse(saved));
      api.get("/auth/me").then((r) => {
        setUser(r.data.user);
        localStorage.setItem("loyalchain_user", JSON.stringify(r.data.user));
        setLoading(false);
      }).catch(() => { logout(); setLoading(false); });
    } else {
      setLoading(false);
    }
  }, []);

  const login = (token, data) => {
    localStorage.setItem("loyalchain_token", token);
    localStorage.setItem("loyalchain_user", JSON.stringify(data));
    setUser(data);
  };

  const logout = () => {
    localStorage.removeItem("loyalchain_token");
    localStorage.removeItem("loyalchain_user");
    setUser(null);
  };

  return <Ctx.Provider value={{ user, loading, login, logout }}>{children}</Ctx.Provider>;
}

export const useAuth = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth needs AuthProvider");
  return c;
};
