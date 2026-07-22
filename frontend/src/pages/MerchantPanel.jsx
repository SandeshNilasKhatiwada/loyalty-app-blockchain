import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDesc } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input, Label } from "../components/ui/input";
import { points } from "../services/endpoints";
import { Award, CheckCircle, AlertCircle } from "lucide-react";

export default function MerchantPanel() {
  const [wa, setWa] = useState("");
  const [amt, setAmt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const award = async () => {
    if (!wa || !amt) { setError("Fill all fields"); return; }
    setLoading(true); setError(""); setSuccess("");
    try {
      const r = await points.award({ customerWallet: wa, amount: amt.toString() });
      setSuccess(`Awarded ${amt} pts! TX: ${r.data.txHash?.slice(0, 20)}...`);
      setWa(""); setAmt("");
    } catch (e) { setError(e.response?.data?.error || "Failed"); }
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <Card>
        <CardHeader className="text-center"><CardTitle>Award Points</CardTitle><CardDesc>Merchant: issue loyalty points</CardDesc></CardHeader>
        <CardContent className="space-y-4">
          {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</div>}
          {success && <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4" />{success}</div>}
          <div><Label>Customer Wallet</Label><Input placeholder="0x..." value={wa} onChange={(e) => setWa(e.target.value)} /></div>
          <div><Label>Points</Label><Input type="number" placeholder="100" value={amt} onChange={(e) => setAmt(e.target.value)} /></div>
          <Button className="w-full" onClick={award} disabled={loading}><Award className="w-4 h-4 mr-1" />{loading ? "..." : "Award Points"}</Button>
        </CardContent>
      </Card>
    </div>
  );
}
