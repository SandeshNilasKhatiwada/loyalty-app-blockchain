import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import Landing from "./pages/Landing";
import MerchantAuth from "./pages/MerchantAuth";
import AdminLogin from "./pages/AdminLogin";
import MerchantDashboard from "./pages/MerchantDashboard";
import AdminPanel from "./pages/AdminPanel";
import SidebarLayout from "./components/SidebarLayout";

function AppShell({ children }) {
  return <SidebarLayout>{children}</SidebarLayout>;
}

export default function App() {
  const { merchant, user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;

  return (
    <Routes>
      <Route path="/" element={user || merchant ? <Navigate to="/dashboard" /> : <Landing />} />
      <Route path="/merchant/login" element={merchant ? <Navigate to="/merchant/dashboard" /> : <MerchantAuth />} />
      <Route path="/admin/login" element={user?.isAdmin ? <Navigate to="/admin" /> : <AdminLogin />} />
      <Route path="/dashboard" element={<AppShell><DashboardContent /></AppShell>} />
      <Route path="/merchant/dashboard" element={merchant ? <AppShell><MerchantDashboard /></AppShell> : <Navigate to="/merchant/login" />} />
      <Route path="/admin" element={user?.isAdmin ? <AppShell><AdminPanel /></AppShell> : <Navigate to="/admin/login" />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function DashboardContent() {
  const { user, merchant } = useAuth();
  if (user?.isAdmin) return <AdminPanel />;
  if (merchant) return <MerchantDashboard />;
  return (
    <div className="text-center py-20">
      <h1 className="text-2xl font-bold text-gray-700">Welcome</h1>
      <p className="text-gray-500 mt-2">Use the sidebar to navigate</p>
    </div>
  );
}
