import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { usePrivy } from "@privy-io/react-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDesc } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input, Label } from "../components/ui/input";
import { useAuth } from "../contexts/AuthContext";
import { adminApi } from "../services/endpoints";
import { Shield, LogIn, AlertCircle, ArrowLeft, Loader, Mail } from "lucide-react";

export default function AdminLogin() {
  const { login: appLogin, user } = useAuth();
  const { login: privyLogin, authenticated, user: privyUser, getAccessToken, ready } = usePrivy();
  const navigate = useNavigate();
  const authingRef = useRef(false);

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user?.isAdmin) navigate("/admin", { replace: true });
  }, [user]);

  useEffect(() => {
    if (!authingRef.current) return;
    if (!authenticated || !privyUser || !ready) return;
    authingRef.current = false;
    doLogin();
  }, [authenticated, privyUser, ready]);

  const startAuth = () => {
    setError("");
    authingRef.current = true;
    if (authenticated && privyUser && ready) {
      authingRef.current = false;
      doLogin();
    } else {
      privyLogin();
    }
  };

  const doLogin = async () => {
    setLoading(true); setError("");
    try {
      const token = await getAccessToken();
      const loginEmail = email.trim() || privyUser?.email?.address || "";
      const r = await adminApi.login({ token, email: loginEmail });
      appLogin(r.data.token, "admin", r.data.user);
      navigate("/admin");
    } catch (e) { setError(e.response?.data?.error || "Not authorized as admin"); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-purple-50 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <Link to="/" className="text-purple-600 font-bold text-lg flex items-center justify-center gap-1 mb-2"><ArrowLeft className="w-4 h-4" />Back</Link>
          <CardTitle className="flex items-center justify-center gap-2"><Shield className="w-5 h-5" />Admin Login</CardTitle>
          <CardDesc>Sign in with your admin email</CardDesc>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</div>}
          <div>
            <Label>Admin Email</Label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input type="email" placeholder="admin@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" />
            </div>
          </div>
          <Button className="w-full" onClick={startAuth} disabled={loading}>
            {loading ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : <LogIn className="w-4 h-4 mr-2" />}
            {loading ? "Verifying..." : "Continue with Email"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
