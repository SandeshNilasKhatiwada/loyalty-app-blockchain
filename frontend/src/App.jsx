import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Swap from "./pages/Swap";
import TopUp from "./pages/TopUp";
import MerchantPanel from "./pages/MerchantPanel";
import Admin from "./pages/Admin";
import Redemption from "./pages/Redemption";

function P({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/dashboard" element={<P><Dashboard /></P>} />
      <Route path="/swap" element={<P><Swap /></P>} />
      <Route path="/topup" element={<P><TopUp /></P>} />
      <Route path="/merchant" element={<P><MerchantPanel /></P>} />
      <Route path="/redeem" element={<P><Redemption /></P>} />
      <Route path="/admin" element={<P><Admin /></P>} />
      <Route path="/" element={<Navigate to="/dashboard" />} />
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}
