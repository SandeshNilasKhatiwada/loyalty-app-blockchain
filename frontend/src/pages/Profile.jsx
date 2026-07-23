import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input, Label } from "../components/ui/input";
import { Badge } from "../components/ui/table";
import { useAuth } from "../contexts/AuthContext";
import { auth } from "../services/endpoints";
import { User, Mail, Phone, Wallet, Shield, Store, Coins, CheckCircle, AlertCircle, Save, Upload, Fingerprint, Camera } from "lucide-react";

export default function Profile() {
  const { user, login } = useAuth();
  const photoRef = useRef(null);
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [photoFile, setPhotoFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (!user) return null;

  const saveProfile = async () => {
    setSaving(true); setError(""); setSuccess("");
    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("phone", phone.trim());
      if (photoFile) formData.append("photo", photoFile);
      const r = await auth.updateProfile(formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      login(r.data.user);
      setSuccess("Profile updated & hashed on blockchain!");
      setPhotoFile(null);
    } catch (e) { setError(e.response?.data?.error || "Update failed"); }
    setSaving(false);
  };

  const roleBadge = () => {
    if (user.isAdmin) return { label: "Admin", color: "bg-purple-100 text-purple-800" };
    if (user.isMerchant) return { label: user.merchant?.kybStatus === "APPROVED" ? "Merchant" : "Pending Merchant", color: user.merchant?.kybStatus === "APPROVED" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800" };
    return { label: "User", color: "bg-blue-100 text-blue-800" };
  };
  const badge = roleBadge();

  const photoUrl = user.photo ? `http://localhost:4000/uploads/${user.photo}` : null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2"><User className="w-6 h-6" />My Profile</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {photoUrl ? (
              <img src={photoUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                <Camera className="w-5 h-5" />
              </div>
            )}
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</div>}
          {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4" />{success}</div>}

          <div className="flex items-center gap-4">
            {photoUrl ? (
              <img src={photoUrl} alt="" className="w-16 h-16 rounded-full object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                <Camera className="w-8 h-8" />
              </div>
            )}
            <div>
              <Button size="sm" variant="outline" onClick={() => photoRef.current?.click()}>
                <Upload className="w-3 h-3 mr-1" />Change Photo
              </Button>
              <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} />
              {photoFile && <p className="text-xs text-green-600 mt-1">{photoFile.name} selected</p>}
            </div>
          </div>

          <div>
            <Label>Full Name</Label>
            <div className="relative mt-1">
              <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="pl-10" />
            </div>
          </div>

          <div>
            <Label>Email</Label>
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
              <Mail className="w-4 h-4 text-gray-400" />
              {user.email || "Not set"}
            </div>
          </div>

          <div>
            <Label>Phone</Label>
            <div className="relative mt-1">
              <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+977 98XXXXXXXX" className="pl-10" />
            </div>
          </div>

          {user.walletAddress && (
            <div>
              <Label>Wallet</Label>
              <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2 font-mono">
                <Wallet className="w-4 h-4 text-gray-400" />
                {user.walletAddress.slice(0, 10)}...{user.walletAddress.slice(-6)}
              </div>
            </div>
          )}

          {user.dataHash && (
            <div>
              <Label className="flex items-center gap-1">
                <Fingerprint className="w-3 h-3 text-green-600" />
                <span className="text-green-700">Data Hash (on-chain)</span>
              </Label>
              <div className="flex items-center gap-2 text-xs text-gray-500 bg-green-50 rounded-lg px-3 py-2 font-mono break-all">
                {user.dataHash}
              </div>
            </div>
          )}

          <Button onClick={saveProfile} disabled={saving}>
            <Save className="w-4 h-4 mr-1" />{saving ? "Saving & Hashing..." : "Save & Verify on Blockchain"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Account Info</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2"><Shield className="w-4 h-4 text-gray-400" /><span className="text-sm">Role</span></div>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.color}`}>{badge.label}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-t border-gray-100">
            <div className="flex items-center gap-2"><Coins className="w-4 h-4 text-gray-400" /><span className="text-sm">Points Balance</span></div>
            <span className="font-semibold">{parseInt(user.pointsBalance || "0").toLocaleString()} pts</span>
          </div>
          <div className="flex items-center justify-between py-2 border-t border-gray-100">
            <div className="flex items-center gap-2"><Shield className="w-4 h-4 text-gray-400" /><span className="text-sm">Status</span></div>
            <Badge variant={user.status === "ACTIVE" ? "success" : "danger"}>{user.status}</Badge>
          </div>

          {user.merchant && (
            <>
              <hr />
              <p className="text-sm font-semibold flex items-center gap-2"><Store className="w-4 h-4" />Merchant Details</p>
              <div className="flex items-center justify-between py-1"><span className="text-sm text-gray-500">Business</span><span className="text-sm font-medium">{user.merchant.businessName}</span></div>
              {user.merchant.ownerName && <div className="flex items-center justify-between py-1"><span className="text-sm text-gray-500">Owner</span><span className="text-sm font-medium">{user.merchant.ownerName}</span></div>}
              <div className="flex items-center justify-between py-1"><span className="text-sm text-gray-500">KYB Status</span><Badge variant={user.merchant.kybStatus === "APPROVED" ? "success" : user.merchant.kybStatus === "PENDING" ? "warning" : "danger"}>{user.merchant.kybStatus}</Badge></div>
              {user.merchant.kycHash && (
                <div>
                  <Label className="flex items-center gap-1 text-xs"><Fingerprint className="w-3 h-3 text-green-600" /><span className="text-green-700">KYC Hash (on-chain)</span></Label>
                  <div className="text-xs text-gray-500 bg-green-50 rounded-lg px-3 py-2 font-mono break-all mt-1">{user.merchant.kycHash}</div>
                </div>
              )}
              {user.merchant.tokenSymbol && <div className="flex items-center justify-between py-1"><span className="text-sm text-gray-500">Token</span><span className="text-sm font-mono font-medium">{user.merchant.tokenSymbol}</span></div>}
              <div className="flex items-center justify-between py-1"><span className="text-sm text-gray-500">Token Balance</span><span className="font-semibold">{parseInt(user.merchant.tokenBalance || "0").toLocaleString()}</span></div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}