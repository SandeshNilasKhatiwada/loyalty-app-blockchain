import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDesc } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input, Label } from "../components/ui/input";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import { Store, Upload, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";

export default function ApplyMerchant() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const docsRef = useRef(null);

  const [businessName, setBusinessName] = useState("");
  const [ownerName, setOwnerName] = useState(user?.name || "");
  const [regNo, setRegNo] = useState("");
  const [citizenshipFile, setCitizenshipFile] = useState(null);
  const [docFiles, setDocFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const submit = async () => {
    if (!businessName.trim()) { setError("Business name is required"); return; }
    setLoading(true); setError("");
    try {
      const formData = new FormData();
      formData.append("businessName", businessName.trim());
      formData.append("ownerName", ownerName.trim());
      formData.append("registrationNo", regNo.trim());
      if (citizenshipFile) formData.append("citizenshipPhoto", citizenshipFile);
      docFiles.forEach((f) => formData.append("documents", f));
      await api.post("/auth/merchant-signup", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSuccess(true);
    } catch (e) {
      setError(e.response?.data?.error || "Application failed");
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-10 text-center space-y-4">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
            <h2 className="text-xl font-bold text-green-800">Application Submitted!</h2>
            <p className="text-sm text-gray-500">Your merchant application is under review. An admin will approve it shortly.</p>
            <Button onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <button onClick={() => navigate("/dashboard")} className="text-sm text-blue-600 hover:underline flex items-center gap-1 justify-center mb-2">
            <ArrowLeft className="w-3 h-3" />Back to Dashboard
          </button>
          <CardTitle className="flex items-center justify-center gap-2"><Store className="w-5 h-5" />Apply for Merchant</CardTitle>
          <CardDesc>Start your own loyalty program</CardDesc>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</div>}

          <div>
            <Label>Business Name *</Label>
            <Input placeholder="Your business name" value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
          </div>
          <div>
            <Label>Owner Name</Label>
            <Input placeholder="Full name" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} />
          </div>
          <div>
            <Label>Registration Number</Label>
            <Input placeholder="REG-001" value={regNo} onChange={(e) => setRegNo(e.target.value)} />
          </div>

          <div>
            <Label>Citizenship Photo</Label>
            <div onClick={() => fileRef.current?.click()} className="mt-1 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-400 transition-colors">
              <Upload className="w-6 h-6 mx-auto text-gray-400 mb-1" />
              <p className="text-sm text-gray-500">{citizenshipFile ? citizenshipFile.name : "Click to upload"}</p>
              <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => setCitizenshipFile(e.target.files?.[0] || null)} />
            </div>
          </div>

          <div>
            <Label>Additional Documents</Label>
            <div onClick={() => docsRef.current?.click()} className="mt-1 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-400 transition-colors">
              <Upload className="w-6 h-6 mx-auto text-gray-400 mb-1" />
              <p className="text-sm text-gray-500">{docFiles.length > 0 ? `${docFiles.length} file(s) selected` : "Click to upload (optional)"}</p>
              <input ref={docsRef} type="file" multiple accept="image/*,.pdf" className="hidden" onChange={(e) => setDocFiles(Array.from(e.target.files || []))} />
            </div>
          </div>

          <Button className="w-full" onClick={submit} disabled={loading}>
            {loading ? "Submitting..." : "Submit Application"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}