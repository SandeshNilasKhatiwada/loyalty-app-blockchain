import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/table";
import { Button } from "../components/ui/button";
import { points, transactions, analytics, admin as adminApi } from "../services/endpoints";
import { Coins, Award, Gift, TrendingUp, Users, Store, Shield, Activity, CheckCircle, UserX, Clock, ArrowRight, BadgeCheck } from "lucide-react";

function UserDashboard() {
  const { user } = useAuth();
  const [balance, setBalance] = useState("0");
  const [txs, setTxs] = useState([]);

  useEffect(() => {
    points.balance().then(r => setBalance(r.data.balance)).catch(() => {});
    points.history().then(r => setTxs((r.data.transactions || []).filter(t => t.type === "AWARD" || t.type === "REDEEM"))).catch(() => {});
  }, []);

  const earned = txs.filter(t => t.type === "AWARD").reduce((s, t) => s + (parseInt(t.amount) || 0), 0);
  const redeemed = txs.filter(t => t.type === "REDEEM").reduce((s, t) => s + (parseInt(t.amount) || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome{user?.name ? `, ${user.name}` : ""}!</h1>
        <p className="text-sm text-gray-500">{user?.email || ""}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-6 text-center">
            <Coins className="w-10 h-10 text-blue-500 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Your Points Balance</p>
            <p className="text-4xl font-bold text-blue-700">{parseInt(balance || "0").toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-1">Use at any merchant in the network</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Award className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Total Earned</p>
            <p className="text-2xl font-bold">{earned.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Gift className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Total Redeemed</p>
            <p className="text-2xl font-bold">{redeemed.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <BadgeCheck className="w-6 h-6 text-blue-500" />
            <div>
              <p className="text-sm font-medium text-blue-800">How to earn points?</p>
              <p className="text-xs text-blue-600">Share your email <strong>{user?.email}</strong> with any merchant when you pay them. They will award you points!</p>
            </div>
          </div>
          <Button size="sm" variant="outline" className="shrink-0" onClick={() => { navigator.clipboard?.writeText(user?.email || ""); }}>
            Copy Email
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><TrendingUp className="w-4 h-4" />Points Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {txs.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <Store className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No points activity yet</p>
              <p className="text-xs mt-1">Visit a merchant and share your email to start earning!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {txs.slice(0, 15).map(tx => (
                <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant={tx.type === "AWARD" ? "success" : "danger"}>
                      {tx.type === "AWARD" ? "Earned" : "Redeemed"}
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

function MerchantDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [merchant, setMerchant] = useState(null);
  const [txs, setTxs] = useState([]);

  const merchantStatus = user?.merchant?.kybStatus || merchant?.kybStatus;

  useEffect(() => {
    Promise.all([
      analytics.merchant().catch(() => null),
      points.merchantToken().catch(() => null),
      transactions.list({ limit: 10 }).catch(() => null),
    ]).then(([ar, mr, tr]) => {
      setStats(ar?.data?.analytics || null);
      setMerchant(mr?.data?.merchant || null);
      setTxs(tr?.data?.transactions || []);
    });
  }, []);

  const tokenBalance = merchant?.tokenBalance || stats?.tokenBalance || "0";

  if (merchantStatus === "PENDING") {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Merchant Dashboard</h1>
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="pt-6 text-center">
            <Clock className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-yellow-800">Registration Pending</h2>
            <p className="text-sm text-yellow-700 mt-1 max-w-md mx-auto">
              Your merchant application is under review. You'll be able to buy tokens and operate once an admin approves your account.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (merchantStatus === "REJECTED") {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Merchant Dashboard</h1>
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-6 text-center">
            <UserX className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-red-800">Registration Rejected</h2>
            <p className="text-sm text-red-700 mt-1">Your merchant application was not approved. Contact the admin for more information.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{merchant?.businessName || "Merchant Dashboard"}</h1>
        <p className="text-sm text-gray-500">{user?.email || ""}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-green-50 border-green-200">
          <CardContent className="pt-4 flex items-center gap-3">
            <Coins className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-xs text-gray-500">Token Balance</p>
              <p className="text-xl font-bold">{parseInt(tokenBalance).toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200">
          <CardContent className="pt-4 flex items-center gap-3">
            <Award className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-xs text-gray-500">Points Awarded</p>
              <p className="text-xl font-bold">{parseInt(stats?.totalAwarded || "0").toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-200">
          <CardContent className="pt-4 flex items-center gap-3">
            <Gift className="w-8 h-8 text-red-500" />
            <div>
              <p className="text-xs text-gray-500">Points Redeemed</p>
              <p className="text-xl font-bold">{parseInt(stats?.totalRedeemed || "0").toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-200">
          <CardContent className="pt-4 flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-xs text-gray-500">Customers</p>
              <p className="text-xl font-bold">{stats?.uniqueCustomers || 0}</p>
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
          <span className="text-xs">Accept Redeem</span>
        </Button>
        <Button onClick={() => navigate("/merchant")} variant="secondary" className="h-20 flex-col gap-1">
          <Coins className="w-5 h-5" />
          <span className="text-xs">Buy Tokens</span>
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
        <CardContent>
          {txs.length === 0 ? (
            <p className="text-gray-500 text-sm py-8 text-center">No activity yet</p>
          ) : (
            <div className="space-y-2">
              {txs.slice(0, 10).map(tx => (
                <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <span className="text-sm font-medium">{tx.type}</span>
                    <span className="text-xs text-gray-500 ml-2">{new Date(tx.createdAt).toLocaleString()}</span>
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

function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [pending, setPending] = useState([]);
  const [txs, setTxs] = useState([]);

  useEffect(() => {
    Promise.all([
      adminApi.stats().catch(() => null),
      adminApi.pending().catch(() => ({ data: { merchants: [] } })),
      transactions.list({ limit: 10 }).catch(() => null),
    ]).then(([sr, pr, tr]) => {
      if (sr) setStats(sr.data.stats);
      setPending(pr.data.merchants || []);
      setTxs(tr?.data?.transactions || []);
    });
  }, []);

  if (!stats) return <div className="text-center py-10 text-gray-400">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Shield className="w-5 h-5" />Admin Dashboard</h1>
        <p className="text-sm text-gray-500">Platform overview</p>
      </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-purple-50 border-purple-200">
          <CardContent className="pt-4 flex items-center gap-3">
            <Users className="w-8 h-8 text-purple-500" />
            <div>
              <p className="text-xs text-gray-500">Total Users</p>
              <p className="text-2xl font-bold">{stats.totalUsers}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 border-blue-200">
          <CardContent className="pt-4 flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-xs text-gray-500">Active Users</p>
              <p className="text-2xl font-bold">{stats.users}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-50 border-red-200">
          <CardContent className="pt-4 flex items-center gap-3">
            <UserX className="w-8 h-8 text-red-500" />
            <div>
              <p className="text-xs text-gray-500">Blocked/Suspended</p>
              <p className="text-2xl font-bold">{stats.blockedUsers || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-50 border-orange-200">
          <CardContent className="pt-4 flex items-center gap-3">
            <Store className="w-8 h-8 text-orange-500" />
            <div>
              <p className="text-xs text-gray-500">Total Merchants</p>
              <p className="text-2xl font-bold">{stats.merchants}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 border-green-200">
          <CardContent className="pt-4 flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-xs text-gray-500">Approved Merchants</p>
              <p className="text-2xl font-bold">{stats.approved}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-gray-50 border-gray-200">
          <CardContent className="pt-4 flex items-center gap-3">
            <Activity className="w-8 h-8 text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">Transactions</p>
              <p className="text-2xl font-bold">{stats.transactions}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {pending.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-4 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-yellow-600" />
              <div>
                <p className="font-semibold text-yellow-800">{pending.length} Merchant{pending.length > 1 ? "s" : ""} Pending Approval</p>
                <p className="text-xs text-yellow-700">Review and approve merchant applications</p>
              </div>
            </div>
            <Button size="sm" onClick={() => navigate("/admin")}>
              Review <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3 grid-cols-2 md:grid-cols-3">
        <Button onClick={() => navigate("/admin")} variant="outline" className="h-20 flex-col gap-1">
          <Store className="w-5 h-5" />
          <span className="text-xs">All Merchants</span>
        </Button>
        <Button onClick={() => navigate("/admin")} variant="outline" className="h-20 flex-col gap-1">
          <Users className="w-5 h-5" />
          <span className="text-xs">User Management</span>
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Recent Transactions</CardTitle></CardHeader>
        <CardContent>
          {txs.length === 0 ? (
            <p className="text-gray-500 text-sm py-8 text-center">No transactions yet</p>
          ) : (
            <div className="space-y-2">
              {txs.slice(0, 10).map(tx => (
                <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant={tx.type === "TOPUP" ? "success" : tx.type === "AWARD" ? "success" : tx.type === "REDEEM" ? "danger" : "secondary"}>{tx.type}</Badge>
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

export default function Dashboard() {
  const { user } = useAuth();
  if (!user) return null;

  if (user.isAdmin) return <AdminDashboard />;
  if (user.isMerchant) return <MerchantDashboard />;
  return <UserDashboard />;
}
