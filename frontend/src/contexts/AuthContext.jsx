import { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [merchant, setMerchant] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem("loyalchain_token");
    const savedType = localStorage.getItem("loyalchain_type");
    if (savedToken) {
      setToken(savedToken);
      api.defaults.headers.common["Authorization"] = `Bearer ${savedToken}`;
      if (savedType === "merchant") {
        api.get("/merchant/status").then((r) => {
          setMerchant(r.data.merchant);
          setLoading(false);
        }).catch(() => { logout(); setLoading(false); });
      } else {
        api.get("/points/me").then(() => {
          setLoading(false);
        }).catch(() => { logout(); setLoading(false); });
      }
    } else {
      setLoading(false);
    }
  }, []);

  const login = (newToken, type, data) => {
    localStorage.setItem("loyalchain_token", newToken);
    localStorage.setItem("loyalchain_type", type);
    api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
    setToken(newToken);
    if (type === "merchant") {
      setMerchant(data);
      setUser(null);
    } else {
      setUser(data);
      setMerchant(null);
    }
  };

  const logout = () => {
    localStorage.removeItem("loyalchain_token");
    localStorage.removeItem("loyalchain_type");
    delete api.defaults.headers.common["Authorization"];
    setToken(null);
    setUser(null);
    setMerchant(null);
  };

  const isAdmin = user?.isAdmin;
  const isMerchant = merchant?.kybStatus === "APPROVED";
  const isPendingMerchant = merchant?.kybStatus === "PENDING";

  return (
    <Ctx.Provider value={{ user, merchant, token, loading, login, logout, isAdmin, isMerchant, isPendingMerchant }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth needs AuthProvider");
  return c;
};
