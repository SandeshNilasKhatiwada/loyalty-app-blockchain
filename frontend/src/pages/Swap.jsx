import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDesc } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input, Label } from "../components/ui/input";
import { Badge } from "../components/ui/table";
import { swap } from "../services/endpoints";
import { RefreshCw, ArrowDown, AlertCircle, CheckCircle } from "lucide-react";

const TOKENS = {
  LOYAL: { address: "0x0000000000000000000000000000000000000001", symbol: "LOYAL" },
  USDC: { address: "0x0000000000000000000000000000000000000002", symbol: "USDC" },
};

export default function Swap() {
  const [inT, setInT] = useState("LOYAL");
  const [outT, setOutT] = useState("USDC");
  const [amt, setAmt] = useState("");
  const [q, setQ] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const getQ = async () => {
    if (!amt || +amt <= 0) return;
    setLoading(true); setError("");
    try {
      const r = await swap.quote({ tokenIn: TOKENS[inT].address, tokenOut: TOKENS[outT].address, amountIn: amt });
      setQ(r.data.quote);
    } catch (e) { setError(e.response?.data?.error || "Quote failed"); }
    setLoading(false);
  };

  const exec = async () => {
    if (!q) return;
    setLoading(true); setError(""); setSuccess("");
    try {
      const r = await swap.execute({ tokenIn: TOKENS[inT].address, tokenOut: TOKENS[outT].address, amountIn: amt, amountOutMin: q.amountOutMin });
      setSuccess(`Swapped! TX: ${r.data.swap.hash.slice(0, 20)}...`);
      setQ(null); setAmt("");
    } catch (e) { setError(e.response?.data?.error || "Swap failed"); }
    setLoading(false);
  };

  const swapT = () => { setInT(outT); setOutT(inT); setQ(null); };

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <Card>
        <CardHeader className="text-center"><CardTitle>Swap Tokens</CardTitle><CardDesc>via Uniswap</CardDesc></CardHeader>
        <CardContent className="space-y-4">
          {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</div>}
          {success && <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4" />{success}</div>}
          <div>
            <Label>From</Label>
            <div className="flex gap-2 mt-1">
              <Input type="number" placeholder="0.0" value={amt} onChange={(e) => { setAmt(e.target.value); setQ(null); }} />
              <select className="w-24 rounded-lg border border-gray-300 px-2 text-sm" value={inT} onChange={(e) => { setInT(e.target.value); setQ(null); }}>
                {Object.keys(TOKENS).map((t) => <option key={t} value={t} disabled={t === outT}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-center"><Button variant="outline" size="icon" onClick={swapT}><ArrowDown className="w-4 h-4" /></Button></div>
          <div>
            <Label>To</Label>
            <div className="flex gap-2 mt-1">
              <Input type="number" placeholder="0.0" value={q?.amountOut || ""} readOnly className="bg-gray-50" />
              <select className="w-24 rounded-lg border border-gray-300 px-2 text-sm" value={outT} onChange={(e) => { setOutT(e.target.value); setQ(null); }}>
                {Object.keys(TOKENS).map((t) => <option key={t} value={t} disabled={t === inT}>{t}</option>)}
              </select>
            </div>
          </div>
          {q && <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1"><div className="flex justify-between"><span className="text-gray-500">Min received</span><span>{parseFloat(q.amountOutMin).toFixed(4)} {outT}</span></div><div className="flex justify-between"><span className="text-gray-500">Price impact</span><span>{q.priceImpact}%</span></div><Badge variant="outline">0.3% fee</Badge></div>}
          {!q ? <Button className="w-full" onClick={getQ} disabled={loading || !amt}>{loading ? "..." : "Get Quote"}</Button> : <Button className="w-full" onClick={exec}>{loading ? "Swapping..." : `Swap ${inT} → ${outT}`}</Button>}
        </CardContent>
      </Card>
    </div>
  );
}
