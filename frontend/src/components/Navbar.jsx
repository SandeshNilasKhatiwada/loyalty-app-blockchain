import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { usePrivy } from "@privy-io/react-auth";
import { useAuth } from "../contexts/AuthContext";
import { LayoutDashboard, Repeat, Coins, Award, Gift, Shield, Menu, X, LogOut } from "lucide-react";
import { cn } from "../lib/utils";

const links = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["user", "merchant", "admin"] },
  { to: "/swap", label: "Swap", icon: Repeat, roles: ["user", "merchant", "admin"] },
  { to: "/topup", label: "Top Up", icon: Coins, roles: ["merchant"] },
  { to: "/merchant", label: "Award", icon: Award, roles: ["merchant"] },
  { to: "/redeem", label: "Redeem", icon: Gift, roles: ["merchant"] },
  { to: "/admin", label: "Admin", icon: Shield, roles: ["admin"] },
];

export default function Navbar() {
  const { user, logout: appLogout } = useAuth();
  const { logout: privyLogout, ready } = usePrivy();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const visible = links.filter((l) => {
    if (l.roles.includes("admin") && user?.isAdmin) return true;
    if (l.roles.includes("merchant") && user?.isMerchant) return true;
    if (l.roles.includes("user")) return true;
    return false;
  });

  const handleLogout = async () => {
    setOpen(false);
    if (ready) await privyLogout();
    appLogout();
    navigate("/login", { replace: true });
  };

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          <Link to="/dashboard" className="flex items-center gap-2 font-bold text-lg text-blue-600 shrink-0">
            <span className="text-xl">🪙</span>
            <span className="hidden sm:inline">LoyalChain</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {visible.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  location.pathname === l.to
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                )}
              >
                <l.icon className="w-4 h-4" />
                {l.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="hidden sm:block text-sm text-gray-500 truncate max-w-[140px]">
              {user?.email || user?.walletAddress?.slice(0, 10) || "User"}
            </span>
            <button
              onClick={handleLogout}
              className="hidden sm:inline-flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
            <button className="md:hidden p-2 rounded-lg hover:bg-gray-100" onClick={() => setOpen(!open)}>
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-2 space-y-1">
            {visible.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium",
                  location.pathname === l.to
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-50"
                )}
              >
                <l.icon className="w-4 h-4" />
                {l.label}
              </Link>
            ))}
            <hr className="my-2" />
            <div className="px-3 py-1 text-sm text-gray-500 truncate">{user?.email || ""}</div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
