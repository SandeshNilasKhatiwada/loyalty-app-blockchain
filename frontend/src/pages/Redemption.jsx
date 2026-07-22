import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input, Label } from "../components/ui/input";
import { points, merchant as merchantApi } from "../services/endpoints";
import { Gift, CheckCircle, AlertCircle } from "lucide-react";

export default function Redemption() {
  const [wa, setWa] = useState("");
  const [amt, setAmt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const redeem = async () => {
    if (!wa || !amt) { setError("Fill all fields"); return; }
    setLoading(true); setError(""); setSuccess("");
    try {
      let tc = "0x0000000000000000000000000000000000000001";
      try {
        const mr = await merchantApi.status();
        if (mr.data.merchant?.tokenContract) tc = mr.data.merchant.tokenContract;
      } catch {}
      const r = await points.redeem({ customerWallet: wa, amount: amt.toString(), tokenContract: tc });
      setSuccess(`Redeemed ${amt}! TX: ${r.data.txHash?.slice(0, 20)}...`);
      setWa(""); setAmt("");
    } catch (e) { setError(e.response?.data?.error || "Redemption failed"); }
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader className="text-center"><CardTitle className="flex items-center justify-center gap-2"><Gift className="w-5 h-5" />Redeem Points</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</div>}
          {success && <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4" />{success}</div>}
          <div><Label>Customer Wallet</Label><Input placeholder="0x..." value={wa} onChange={(e) => setWa(e.target.value)} /></div>
          <div><Label>Points to Redeem</Label><Input type="number" placeholder="100" value={amt} onChange={(e) => setAmt(e.target.value)} /></div>
          <Button className="w-full" onClick={redeem} disabled={loading}>
            {loading ? "..." : "Redeem"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
