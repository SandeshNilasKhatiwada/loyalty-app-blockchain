import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { usePrivy } from "@privy-io/react-auth";
import { useAuth } from "../contexts/AuthContext";
import { cn } from "../lib/utils";
import {
  LayoutDashboard, Store, Shield, Menu, X, LogOut, Repeat, Users, BadgeCheck, Clock,
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
  const merchantStatus = user?.merchant?.kybStatus;

  const navItems = [];

  if (isAdmin) {
    navItems.push({ to: "/dashboard", label: "Dashboard", icon: LayoutDashboard });
    navItems.push({ to: "/admin", label: "Admin Panel", icon: Shield });
  }

  if (isMerchant) {
    navItems.push({ to: "/dashboard", label: "Dashboard", icon: LayoutDashboard });
    navItems.push({ to: "/merchant", label: "Merchant Panel", icon: Store });
  }

  if (isUser) {
    navItems.push({ to: "/dashboard", label: "Dashboard", icon: LayoutDashboard });
    navItems.push({ to: "/merchants", label: "Find Merchants", icon: Store });
  }

  const handleLogout = async () => {
    setSidebarOpen(false);
    if (ready) await privyLogout();
    appLogout();
    navigate("/login", { replace: true });
  };

  const active = (to) => location.pathname === to || (to !== "/" && location.pathname.startsWith(to));

  const roleBadge = () => {
    if (isAdmin) return { label: "Admin", color: "bg-purple-100 text-purple-800" };
    if (isMerchant) return { label: merchantStatus === "APPROVED" ? "Merchant" : "Pending Merchant", color: merchantStatus === "APPROVED" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800" };
    return { label: "User", color: "bg-blue-100 text-blue-800" };
  };
  const badge = roleBadge();

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

        <div className="border-t border-gray-200 p-3 space-y-3">
          <div className="px-3 flex items-center gap-2">
            <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", badge.color)}>
              {badge.label === "Pending Merchant" ? <Clock className="w-3 h-3 mr-1" /> : <BadgeCheck className="w-3 h-3 mr-1" />}
              {badge.label}
            </span>
          </div>
          <div className="px-3 text-xs text-gray-500 truncate">{user?.email || ""}</div>
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
          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full mr-2 bg-gray-100 text-gray-700">
            {badge.label}
          </span>
          <span className="text-sm text-gray-500 truncate max-w-[160px] hidden sm:block">
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
