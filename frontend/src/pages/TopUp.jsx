import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDesc } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input, Label } from "../components/ui/input";
import { merchant } from "../services/endpoints";
import { DollarSign, CheckCircle, AlertCircle } from "lucide-react";

export default function TopUp() {
  const [amt, setAmt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const buy = async () => {
    if (!amt || +amt <= 0) { setError("Enter amount"); return; }
    setLoading(true); setError(""); setResult(null);
    try {
      const r = await merchant.topup({ amountNPR: +amt });
      setResult(r.data);
      setAmt("");
    } catch (e) { setError(e.response?.data?.error || "Top-up failed"); }
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <Card>
        <CardHeader className="text-center"><CardTitle>Buy Tokens</CardTitle><CardDesc>Purchase loyalty tokens for your business</CardDesc></CardHeader>
        <CardContent className="space-y-4">
          {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</div>}
          {result && <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm space-y-1"><div className="flex items-center gap-2"><CheckCircle className="w-4 h-4" />Top-up OK!</div><p>NPR {result.amountNPR} → {result.netTokens} tokens</p><p>Fee: {result.fee}</p></div>}
          <div>
            <Label>Amount (NPR)</Label>
            <div className="relative mt-1"><DollarSign className="absolute left-3 top-3 w-4 h-4 text-gray-400" /><Input type="number" placeholder="1000" value={amt} onChange={(e) => setAmt(e.target.value)} className="pl-10" /></div>
          </div>
          <p className="text-xs text-gray-500">~{parseInt(amt || "0") * 95 / 100} tokens after 5% fee</p>
          <Button className="w-full" onClick={buy} disabled={loading}>{loading ? "Processing..." : "Pay with eSewa"}</Button>
        </CardContent>
      </Card>
    </div>
  );
}
