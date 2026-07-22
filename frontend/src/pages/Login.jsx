import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePrivy } from "@privy-io/react-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDesc } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";

export default function Login() {
  const { login: appLogin, user } = useAuth();
  const { login: privyLogin, logout: privyLogout, authenticated, user: privyUser, getAccessToken } = usePrivy();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) { navigate("/dashboard", { replace: true }); }
  }, [user]);

  useEffect(() => {
    if (!authenticated || !privyUser) return;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const token = await getAccessToken();
        const r = await api.post("/auth/login", { token });
        appLogin(r.data.token, r.data.user);
      } catch (e) {
        setError(e.response?.data?.error || "Authentication failed");
        privyLogout();
      }
      setLoading(false);
    })();
  }, [authenticated, privyUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <CardTitle>LoyalChain</CardTitle>
          <CardDesc>Blockchain-powered loyalty platform</CardDesc>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
          <p className="text-sm text-gray-600 text-center">Sign in with your email to get started.</p>
          <Button className="w-full" onClick={privyLogin} disabled={loading}>
            {loading ? "Signing in..." : "Continue with Email"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
