import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePrivy } from "@privy-io/react-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDesc } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input, Label } from "../components/ui/input";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";

export default function Login() {
  const { login: appLogin, user } = useAuth();
  const { login: privyLogin, logout: privyLogout, authenticated, user: privyUser, getAccessToken } = usePrivy();
  const navigate = useNavigate();
  const [step, setStep] = useState("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [regNo, setRegNo] = useState("");

  useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
  }, [user]);

  useEffect(() => {
    if (!authenticated || !privyUser || step !== "login") return;
    setStep("choose-role");
  }, [authenticated, privyUser, step]);

  const submitChoice = async (isMerchant) => {
    setLoading(true);
    setError("");
    try {
      const token = await getAccessToken();
      const body = { token };
      if (isMerchant) {
        if (!businessName.trim()) { setError("Business name is required"); setLoading(false); return; }
        body.businessName = businessName.trim();
        body.registrationNo = regNo.trim();
      }
      const r = await api.post("/auth/login", body);
      appLogin(r.data.token, r.data.user);
    } catch (e) {
      setError(e.response?.data?.error || "Authentication failed");
      privyLogout();
      setStep("login");
    }
    setLoading(false);
  };

  const reset = () => {
    privyLogout();
    setStep("login");
    setBusinessName("");
    setRegNo("");
    setError("");
  };

  if (step === "choose-role") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <CardTitle>LoyalChain</CardTitle>
            <CardDesc>Choose your account type</CardDesc>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
            <Button className="w-full" onClick={() => submitChoice(false)} disabled={loading}>
              {loading ? "Signing in..." : "Regular User"}
            </Button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-gray-500">or</span></div>
            </div>
            <div className="space-y-3">
              <Label>Business Name</Label>
              <Input placeholder="Your business name" value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
              <Label>Registration No. (optional)</Label>
              <Input placeholder="REG-..." value={regNo} onChange={(e) => setRegNo(e.target.value)} />
              <Button className="w-full" variant="outline" onClick={() => submitChoice(true)} disabled={loading}>
                {loading ? "Creating merchant..." : "Sign Up as Merchant"}
              </Button>
            </div>
            <p className="text-xs text-center">
              <button onClick={reset} className="text-blue-600 hover:underline">Use a different email</button>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

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
