import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Swap from "./pages/Swap";
import TopUp from "./pages/TopUp";
import MerchantPanel from "./pages/MerchantPanel";
import Admin from "./pages/Admin";
import Redemption from "./pages/Redemption";
import Layout from "./components/Layout";

function P({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/dashboard" element={<P><Layout><Dashboard /></Layout></P>} />
      <Route path="/swap" element={<P><Layout><Swap /></Layout></P>} />
      <Route path="/topup" element={<P><Layout><TopUp /></Layout></P>} />
      <Route path="/merchant" element={<P><Layout><MerchantPanel /></Layout></P>} />
      <Route path="/redeem" element={<P><Layout><Redemption /></Layout></P>} />
      <Route path="/admin" element={<P><Layout><Admin /></Layout></P>} />
      <Route path="/" element={<Navigate to="/dashboard" />} />
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}
