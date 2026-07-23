import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { usePrivy } from "@privy-io/react-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDesc } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import { ArrowLeft, LogIn } from "lucide-react";

export default function Login() {
  const { login: appLogin, user } = useAuth();
  const { login: privyLogin, authenticated, user: privyUser, getAccessToken } = usePrivy();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
  }, [user]);

  useEffect(() => {
    if (!authenticated || !privyUser || loading) return;
    doLogin();
  }, [authenticated, privyUser]);

  const doLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const token = await getAccessToken();
      const r = await api.post("/auth/login", { token });
      appLogin(r.data.token, r.data.user);
      setLoading(false);
    } catch (e) {
      setError(e.response?.data?.error || "Login failed");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <Link to="/" className="text-blue-600 font-bold text-lg flex items-center justify-center gap-1 mb-2"><ArrowLeft className="w-4 h-4" />Back</Link>
          <CardTitle>Welcome back</CardTitle>
          <CardDesc>Sign in to your LoyalChain account</CardDesc>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
          <Button className="w-full" onClick={privyLogin} disabled={loading}>
            <LogIn className="w-4 h-4 mr-2" />
            {loading ? "Signing in..." : "Continue with Email"}
          </Button>
          <p className="text-xs text-center text-gray-400">
            Don't have an account? <Link to="/register" className="text-blue-600 hover:underline">Create one</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
