import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Swap from "./pages/Swap";
import MerchantPanel from "./pages/MerchantPanel";
import Admin from "./pages/Admin";
import Merchants from "./pages/Merchants";
import ApplyMerchant from "./pages/ApplyMerchant";
import SidebarLayout from "./components/SidebarLayout";

function P({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Landing />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<P><SidebarLayout><Dashboard /></SidebarLayout></P>} />
      <Route path="/swap" element={<P><SidebarLayout><Swap /></SidebarLayout></P>} />
      <Route path="/merchant" element={<P><SidebarLayout><MerchantPanel /></SidebarLayout></P>} />
      <Route path="/merchants" element={<P><SidebarLayout><Merchants /></SidebarLayout></P>} />
      <Route path="/admin" element={<P><SidebarLayout><Admin /></SidebarLayout></P>} />
      <Route path="/apply-merchant" element={<ApplyMerchant />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
