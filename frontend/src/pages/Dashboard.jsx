import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/table";
import { Button } from "../components/ui/button";
import { points, transactions, analytics } from "../services/endpoints";
import { Wallet, Coins, RefreshCw, ArrowUpRight, ArrowDownRight, Users, Award, Gift } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const [bal, setBal] = useState("0");
  const [txs, setTxs] = useState([]);
  const [mt, setMt] = useState(null);
  const [merchantAnalytics, setMerchantAnalytics] = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      if (user?.isMerchant) {
        const [tr, mr, ar] = await Promise.all([
          transactions.list({ limit: 15 }),
          points.merchantToken(),
          analytics.merchant().catch(() => null),
        ]);
        setTxs(tr.data.transactions || []);
        setMt(mr.data.merchant);
        setMerchantAnalytics(ar?.data?.analytics || null);
      } else {
        const [tr, br] = await Promise.all([
          transactions.list({ limit: 15 }),
          user?.walletAddress ? points.balance(user.walletAddress).catch(() => null) : null,
        ]);
        setTxs(tr.data.transactions || []);
        if (br?.data?.balance !== undefined) setBal(br.data.balance);
      }
    } catch {}
  };

  const txIcon = (t) => {
    if (t === "AWARD" || t === "TOPUP") return <ArrowDownRight className="w-4 h-4 text-green-600" />;
    if (t === "REDEEM" || t === "SWAP") return <ArrowUpRight className="w-4 h-4 text-red-600" />;
    return <RefreshCw className="w-4 h-4 text-blue-600" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-gray-500">{user?.email || user?.walletAddress?.slice(0, 14)}...</p>
        </div>
        <div className="flex gap-2">
          <Link to="/swap"><Button size="sm"><RefreshCw className="w-3 h-3 mr-1" />Swap</Button></Link>
          <Button size="sm" variant="outline" onClick={load}><RefreshCw className="w-3 h-3 mr-1" />Refresh</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Wallet className="w-4 h-4" />Wallet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-500 truncate font-mono">{user?.walletAddress || "Email-only account"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Coins className="w-4 h-4" />Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{parseInt(bal || "0").toLocaleString()}</p>
            <p className="text-xs text-gray-500">{mt?.tokenSymbol || "LOYAL"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={user?.isMerchant ? "success" : "secondary"}>
              {user?.isMerchant ? "Merchant" : "Customer"}
            </Badge>
            {user?.isAdmin && <Badge variant="default" className="ml-2">Admin</Badge>}
            <p className="text-xs text-gray-500 mt-1">{mt?.kybStatus === "APPROVED" ? "KYB Approved" : mt?.kybStatus || ""}</p>
          </CardContent>
        </Card>
      </div>

      {user?.isMerchant && merchantAnalytics && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-green-200">
            <CardContent className="pt-4 flex items-center gap-3">
              <Award className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-xs text-gray-500">Awarded</p>
                <p className="text-lg font-bold">{parseInt(merchantAnalytics.totalAwarded || "0").toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-red-200">
            <CardContent className="pt-4 flex items-center gap-3">
              <Gift className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-xs text-gray-500">Redeemed</p>
                <p className="text-lg font-bold">{parseInt(merchantAnalytics.totalRedeemed || "0").toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-blue-200">
            <CardContent className="pt-4 flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-xs text-gray-500">Customers</p>
                <p className="text-lg font-bold">{merchantAnalytics.uniqueCustomers || 0}</p>
              </div>
            </CardContent>
          </Card>
        </div>
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
                    {txIcon(tx.type)}
                    <div>
                      <div className="text-sm font-medium">{tx.type}</div>
                      <div className="text-xs text-gray-500">{new Date(tx.createdAt).toLocaleString()}</div>
                    </div>
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
        <Link to="/redeem"><Button variant="outline"><Gift className="w-4 h-4 mr-1" />Redeem Points</Button></Link>
        {user?.isMerchant && (
          <>
            <Link to="/topup"><Button variant="secondary"><Coins className="w-4 h-4 mr-1" />Buy Tokens</Button></Link>
            <Link to="/merchant"><Button variant="secondary"><Award className="w-4 h-4 mr-1" />Award Points</Button></Link>
          </>
        )}
      </div>
    </div>
  );
}
