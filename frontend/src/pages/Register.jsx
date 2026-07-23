import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { usePrivy } from "@privy-io/react-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDesc } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input, Label } from "../components/ui/input";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import { ArrowLeft, LogIn, Upload, User, Mail, Phone, CheckCircle, AlertCircle } from "lucide-react";

export default function Register() {
  const { login: appLogin, user } = useAuth();
  const { login: privyLogin, authenticated, user: privyUser, getAccessToken } = usePrivy();
  const navigate = useNavigate();
  const photoRef = useRef(null);

  const [step, setStep] = useState("form");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
  }, [user]);

  useEffect(() => {
    if (!authenticated || !privyUser || step !== "auth") return;
    doRegister();
  }, [authenticated, privyUser]);

  const startAuth = () => {
    setStep("auth");
    privyLogin();
  };

  const doRegister = async () => {
    setLoading(true);
    setError("");
    try {
      const token = await getAccessToken();
      const userEmail = privyUser?.email?.address || privyUser?.email || "";
      const formData = new FormData();
      formData.append("token", token);
      formData.append("name", name.trim());
      formData.append("phone", phone.trim());
      formData.append("email", userEmail);
      if (photoFile) formData.append("photo", photoFile);
      const r = await api.post("/auth/register", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      appLogin(r.data.token, r.data.user);
      setSuccess("Account created!");
      setTimeout(() => navigate("/dashboard"), 1000);
    } catch (e) {
      setError(e.response?.data?.error || "Registration failed");
      setStep("form");
      setLoading(false);
    }
  };

  if (step === "form") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 px-4 py-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Link to="/" className="text-blue-600 font-bold text-lg flex items-center justify-center gap-1 mb-2"><ArrowLeft className="w-4 h-4" />Back</Link>
            <CardTitle className="flex items-center justify-center gap-2"><User className="w-5 h-5" />Create Your Profile</CardTitle>
            <CardDesc>Fill in your details to get started</CardDesc>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</div>}

            <div>
              <Label>Full Name *</Label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input placeholder="Your full name" value={name} onChange={(e) => setName(e.target.value)} className="pl-10" />
              </div>
            </div>

            <div>
              <Label>Email</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input placeholder="email@example.com" value={privyUser?.email?.address || ""} disabled className="pl-10 bg-gray-50" />
              </div>
              <p className="text-xs text-gray-400 mt-1">You'll sign in with this email via Privy</p>
            </div>

            <div>
              <Label>Phone</Label>
              <div className="relative mt-1">
                <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input placeholder="+977 98XXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} className="pl-10" />
              </div>
            </div>

            <div>
              <Label>Profile Photo</Label>
              <div onClick={() => photoRef.current?.click()} className="mt-1 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-400 transition-colors">
                <Upload className="w-6 h-6 mx-auto text-gray-400 mb-1" />
                <p className="text-sm text-gray-500">{photoFile ? photoFile.name : "Click to upload photo"}</p>
                <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} />
              </div>
            </div>

            <Button className="w-full" onClick={startAuth} disabled={!name.trim()}>
              <LogIn className="w-4 h-4 mr-2" />
              Continue with Email
            </Button>
            <p className="text-xs text-center text-gray-400">
              Already have an account? <Link to="/login" className="text-blue-600 hover:underline">Sign in</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 px-4">
        <Card className="w-full max-w-sm">
          <CardContent className="py-10 text-center space-y-4">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
            <h2 className="text-xl font-bold text-green-800">{success}</h2>
            <p className="text-sm text-gray-500">Your data is secured on the blockchain.</p>
            <Button onClick={() => navigate("/dashboard")}>Go to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <Card className="w-full max-w-sm mx-4">
        <CardContent className="py-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-500">Signing in with your email...</p>
        </CardContent>
      </Card>
    </div>
  );
}