import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { usePrivy } from "@privy-io/react-auth";
import { useAuth } from "../contexts/AuthContext";
import { cn } from "../lib/utils";
import {
  LayoutDashboard, Store, Shield, Menu, X, LogOut, Coins, Gift, History, Users, CheckCircle,
} from "lucide-react";

export default function SidebarLayout({ children }) {
  const { user, logout: appLogout } = useAuth();
  const { logout: privyLogout, ready } = usePrivy();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isUser = !user?.isMerchant && !user?.isAdmin;
  const isMerchant = !!user?.isMerchant;
  const isAdmin = !!user?.isAdmin;

  const navItems = [];

  if (isUser || isMerchant) {
    navItems.push({ to: "/dashboard", label: "Dashboard", icon: LayoutDashboard });
  }

  if (isUser) {
    navItems.push({ to: "/merchants", label: "Find Merchants", icon: Store });
  }

  if (isMerchant) {
    navItems.push({ to: "/merchant", label: "Merchant Panel", icon: Store });
  }

  if (isAdmin) {
    navItems.push({ to: "/admin", label: "Admin", icon: Shield });
    navItems.push({ to: "/dashboard", label: "Dashboard", icon: LayoutDashboard });
  }

  const handleLogout = async () => {
    setSidebarOpen(false);
    if (ready) await privyLogout();
    appLogout();
    navigate("/login", { replace: true });
  };

  const active = (to) => location.pathname === to || (to !== "/" && location.pathname.startsWith(to));

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={cn(
        "fixed md:sticky top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200 flex flex-col transition-transform md:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full",
      )}>
        <div className="h-14 flex items-center gap-2 px-4 border-b border-gray-200 shrink-0">
          <span className="text-xl">🪙</span>
          <span className="font-bold text-lg text-blue-600">LoyalChain</span>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active(item.to)
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50",
              )}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-gray-200 p-3 space-y-2">
          <div className="px-3 py-2 text-xs text-gray-500 truncate">{user?.email || user?.walletAddress?.slice(0, 10) || "User"}</div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 h-14 flex items-center px-4 gap-3">
          <button className="md:hidden p-2 rounded-lg hover:bg-gray-100" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <span className="text-sm text-gray-500 truncate max-w-[200px] hidden sm:block">
            {user?.email || ""}
          </span>
          <button
            onClick={handleLogout}
            className="hidden sm:inline-flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
