import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/table";
import { Button } from "../components/ui/button";
import { points, transactions } from "../services/endpoints";
import { Wallet, Coins, RefreshCw, ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const [bal, setBal] = useState("0");
  const [txs, setTxs] = useState([]);
  const [mt, setMt] = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      if (user?.isMerchant) {
        const r = await points.merchantToken();
        setMt(r.data.merchant);
        setBal(r.data.merchant.balance);
      }
      const r = await transactions.list({ limit: 15 });
      setTxs(r.data.transactions || []);
    } catch {}
  };

  const Icon = (t) => {
    if (t === "AWARD" || t === "TOPUP") return <ArrowDownRight className="w-4 h-4 text-green-600" />;
    if (t === "REDEEM" || t === "SWAP") return <ArrowUpRight className="w-4 h-4 text-red-600" />;
    return <RefreshCw className="w-4 h-4 text-blue-600" />;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-gray-500">{user?.email || user?.walletAddress?.slice(0, 14)}...</p>
        </div>
        <div className="flex gap-2">
          <Link to="/swap"><Button size="sm"><RefreshCw className="w-3 h-3 mr-1" />Swap</Button></Link>
          <Button size="sm" variant="outline" onClick={load}>Refresh</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Wallet className="w-4 h-4" />Wallet</CardTitle></CardHeader><CardContent><p className="text-xs text-gray-500 truncate">{user?.walletAddress}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Coins className="w-4 h-4" />Balance</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{parseInt(bal || "0").toLocaleString()}</p><p className="text-xs text-gray-500">{mt?.tokenSymbol || "LOYAL"}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Status</CardTitle></CardHeader><CardContent><Badge variant={user?.isMerchant ? "success" : "secondary"}>{user?.isMerchant ? "Merchant" : "Customer"}</Badge><p className="text-xs text-gray-500 mt-1">{mt?.kybStatus === "APPROVED" ? "KYB Approved" : mt?.kybStatus || ""}</p></CardContent></Card>
      </div>

      {mt && mt.kybStatus !== "APPROVED" && (
        <Card className="border-yellow-200 bg-yellow-50"><CardContent className="py-3 text-sm text-yellow-800">Merchant status: <strong>{mt.kybStatus}</strong>. Wait for admin approval.</CardContent></Card>
      )}

      <Card>
        <CardHeader><CardTitle>Recent Transactions</CardTitle></CardHeader>
        <CardContent>
          {txs.length === 0 ? (
            <p className="text-gray-500 text-sm py-8 text-center">No transactions yet</p>
          ) : (
            <div className="space-y-2">
              {txs.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {Icon(tx.type)}
                    <div><div className="text-sm font-medium">{tx.type}</div><div className="text-xs text-gray-500">{new Date(tx.createdAt).toLocaleString()}</div></div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{tx.amount}</div>
                    <div className="text-xs text-gray-500">{tx.txHash?.slice(0, 10)}...</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3 flex-wrap">
        <Link to="/swap"><Button><RefreshCw className="w-4 h-4 mr-1" />Swap Tokens</Button></Link>
        <Link to="/redeem"><Button variant="outline">Redeem Points</Button></Link>
        {user?.isMerchant && <Link to="/topup"><Button variant="secondary">Buy Tokens</Button></Link>}
      </div>
    </div>
  );
}
