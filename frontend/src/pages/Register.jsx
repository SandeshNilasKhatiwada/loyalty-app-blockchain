import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { usePrivy } from "@privy-io/react-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDesc } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input, Label } from "../components/ui/input";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import { User, Store, ShieldCheck, ArrowLeft, Upload, CheckCircle, AlertCircle, ArrowRight } from "lucide-react";

const ROLES = [
  { key: "user", label: "Regular User", icon: User, desc: "Earn and redeem loyalty points" },
  { key: "merchant", label: "Merchant", icon: Store, desc: "Create and manage your own loyalty program" },
  { key: "admin", label: "Admin", icon: ShieldCheck, desc: "Platform administrator" },
];

export default function Register() {
  const { login: appLogin, user } = useAuth();
  const { login: privyLogin, logout: privyLogout, authenticated, user: privyUser, getAccessToken } = usePrivy();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const docsInputRef = useRef(null);

  const [step, setStep] = useState("role");
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Merchant form
  const [businessName, setBusinessName] = useState("");
  const [regNo, setRegNo] = useState("");
  const [userName, setUserName] = useState("");
  const [citizenshipFile, setCitizenshipFile] = useState(null);
  const [docFiles, setDocFiles] = useState([]);

  useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
  }, [user]);

  useEffect(() => {
    if (!authenticated || !privyUser || step !== "auth") return;
    submitRegistration();
  }, [authenticated, privyUser, step]);

  const selectRole = (r) => {
    setRole(r);
    setStep("auth");
    privyLogin();
  };

  const submitRegistration = async () => {
    setLoading(true);
    setError("");
    try {
      const token = await getAccessToken();
      const formData = new FormData();
      formData.append("token", token);
      formData.append("role", role);
      if (userName) formData.append("name", userName);

      if (role === "merchant") {
        if (!businessName.trim()) { setError("Business name is required"); setLoading(false); privyLogout(); setStep("role"); return; }
        formData.append("businessName", businessName.trim());
        formData.append("registrationNo", regNo.trim());
        if (citizenshipFile) formData.append("citizenshipPhoto", citizenshipFile);
        docFiles.forEach((f) => formData.append("documents", f));
      }

      const r = await api.post("/auth/register", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      appLogin(r.data.token, r.data.user);
      setSuccess("Account created successfully!");
    } catch (e) {
      setError(e.response?.data?.error || "Registration failed");
      privyLogout();
      setStep("role");
    }
    setLoading(false);
  };

  const backToRole = () => {
    privyLogout();
    setStep("role");
    setRole(null);
    setError("");
  };

  if (step === "role") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 px-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <Link to="/" className="text-blue-600 font-bold text-lg flex items-center justify-center gap-1 mb-2"><ArrowLeft className="w-4 h-4" />Back</Link>
            <CardTitle>Create your account</CardTitle>
            <CardDesc>Choose how you want to use LoyalChain</CardDesc>
          </CardHeader>
          <CardContent className="space-y-3">
            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
            {ROLES.map((r) => (
              <button
                key={r.key}
                onClick={() => selectRole(r.key)}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <r.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">{r.label}</p>
                  <p className="text-sm text-gray-500">{r.desc}</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-300 shrink-0" />
              </button>
            ))}
            <p className="text-xs text-center text-gray-400 pt-2">
              Already have an account? <Link to="/login" className="text-blue-600 hover:underline">Sign in</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "auth" && role === "merchant") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <button onClick={backToRole} className="text-sm text-blue-600 hover:underline flex items-center gap-1 justify-center mb-2"><ArrowLeft className="w-3 h-3" />Change role</button>
            <CardTitle>Merchant Registration</CardTitle>
            <CardDesc>Fill in your business details</CardDesc>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</div>}
            {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4" />{success}</div>}

            <div><Label>Business Name *</Label><Input placeholder="Your business name" value={businessName} onChange={(e) => setBusinessName(e.target.value)} /></div>
            <div><Label>Registration Number</Label><Input placeholder="REG-001" value={regNo} onChange={(e) => setRegNo(e.target.value)} /></div>
            <div><Label>Your Name</Label><Input placeholder="Full name" value={userName} onChange={(e) => setUserName(e.target.value)} /></div>

            <div>
              <Label>Citizenship Photo</Label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="mt-1 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-400 transition-colors"
              >
                <Upload className="w-6 h-6 mx-auto text-gray-400 mb-1" />
                <p className="text-sm text-gray-500">{citizenshipFile ? citizenshipFile.name : "Click to upload"}</p>
                <input ref={fileInputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => setCitizenshipFile(e.target.files?.[0] || null)} />
              </div>
            </div>

            <div>
              <Label>Additional Documents</Label>
              <div
                onClick={() => docsInputRef.current?.click()}
                className="mt-1 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-400 transition-colors"
              >
                <Upload className="w-6 h-6 mx-auto text-gray-400 mb-1" />
                <p className="text-sm text-gray-500">{docFiles.length > 0 ? `${docFiles.length} file(s) selected` : "Click to upload (optional)"}</p>
                <input ref={docsInputRef} type="file" multiple accept="image/*,.pdf" className="hidden" onChange={(e) => setDocFiles(Array.from(e.target.files || []))} />
              </div>
            </div>

            <Button className="w-full" onClick={submitRegistration} disabled={loading}>
              {loading ? "Creating merchant account..." : "Create Merchant Account"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Auth step - waiting for Privy
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
