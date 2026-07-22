import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/table";
import { Button } from "../components/ui/button";
import { points, transactions, analytics } from "../services/endpoints";
import { Coins, Repeat, Award, Gift, TrendingUp, Users, Store } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bal, setBal] = useState("0");
  const [txs, setTxs] = useState([]);
  const [merchantAnalytics, setMerchantAnalytics] = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const tr = transactions.list({ limit: 10 }).catch(() => ({ data: { transactions: [] } }));
      if (user?.isMerchant) {
        const [txData, ar] = await Promise.all([
          tr,
          analytics.merchant().catch(() => null),
        ]);
        setTxs(txData.data.transactions || []);
        setMerchantAnalytics(ar?.data?.analytics || null);
      } else {
        const txData = await tr;
        setTxs(txData.data.transactions || []);
        if (user?.walletAddress) {
          const br = await points.balance(user.walletAddress).catch(() => null);
          if (br?.data?.balance !== undefined) setBal(br.data.balance);
        }
      }
    } catch {}
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Welcome back{user?.name ? `, ${user.name}` : ""}!
        </h1>
        <p className="text-sm text-gray-500">{user?.email || ""}</p>
      </div>

      {user?.isMerchant ? (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-green-200 bg-gradient-to-br from-green-50">
              <CardContent className="pt-4 flex items-center gap-3">
                <Award className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-xs text-gray-500">Points Awarded</p>
                  <p className="text-xl font-bold">{parseInt(merchantAnalytics?.totalAwarded || "0").toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-red-200 bg-gradient-to-br from-red-50">
              <CardContent className="pt-4 flex items-center gap-3">
                <Gift className="w-8 h-8 text-red-500" />
                <div>
                  <p className="text-xs text-gray-500">Points Redeemed</p>
                  <p className="text-xl font-bold">{parseInt(merchantAnalytics?.totalRedeemed || "0").toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-blue-200 bg-gradient-to-br from-blue-50">
              <CardContent className="pt-4 flex items-center gap-3">
                <Users className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-xs text-gray-500">Active Customers</p>
                  <p className="text-xl font-bold">{merchantAnalytics?.uniqueCustomers || 0}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
            <Button onClick={() => navigate("/merchant")} className="h-20 flex-col gap-1">
              <Award className="w-5 h-5" />
              <span className="text-xs">Award Points</span>
            </Button>
            <Button onClick={() => navigate("/merchant")} variant="outline" className="h-20 flex-col gap-1">
              <Gift className="w-5 h-5" />
              <span className="text-xs">Redeem</span>
            </Button>
            <Button onClick={() => navigate("/merchant")} variant="secondary" className="h-20 flex-col gap-1">
              <Coins className="w-5 h-5" />
              <span className="text-xs">Buy Tokens</span>
            </Button>
            <Link to="/swap">
              <Button variant="outline" className="h-20 w-full flex-col gap-1">
                <Repeat className="w-5 h-5" />
                <span className="text-xs">Swap</span>
              </Button>
            </Link>
          </div>
        </>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="pt-6 text-center">
                <Coins className="w-10 h-10 text-blue-500 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Your Points Balance</p>
                <p className="text-4xl font-bold text-blue-700">{parseInt(bal || "0").toLocaleString()}</p>
                <p className="text-xs text-gray-400 mt-1">LOYAL tokens</p>
              </CardContent>
            </Card>
            <Card className="border-gray-200">
              <CardContent className="pt-6 space-y-3 text-center">
                <Gift className="w-10 h-10 text-purple-500 mx-auto mb-2" />
                <p className="font-semibold">Redeem Your Points</p>
                <p className="text-sm text-gray-500">Use your loyalty points for rewards</p>
                <Link to="/swap">
                  <Button className="w-full"><Repeat className="w-4 h-4 mr-1" />Swap Tokens</Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {user?.walletAddress && (
            <Card>
              <CardContent className="py-3 text-xs text-gray-400 text-center">
                Wallet: {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}
              </CardContent>
            </Card>
          )}
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><TrendingUp className="w-4 h-4" />Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {txs.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <Store className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No activity yet</p>
              {!user?.isMerchant && <p className="text-xs mt-1">Visit a merchant to start earning points!</p>}
            </div>
          ) : (
            <div className="space-y-2">
              {txs.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant={tx.type === "AWARD" || tx.type === "TOPUP" ? "success" : tx.type === "REDEEM" ? "danger" : "secondary"}>
                      {tx.type}
                    </Badge>
                    <span className="text-xs text-gray-500">{new Date(tx.createdAt).toLocaleString()}</span>
                  </div>
                  <span className="font-medium">{tx.amount} pts</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
