import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDesc } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input, Label } from "../components/ui/input";
import { Badge } from "../components/ui/table";
import { points, merchant as merchantApi, transactions, analytics } from "../services/endpoints";
import { Award, Gift, Coins, TrendingUp, Users, CheckCircle, AlertCircle, Store, Wallet, CreditCard, Landmark } from "lucide-react";

const PAY_METHODS = [
  { key: "esewa", label: "eSewa", icon: CreditCard },
  { key: "paypal", label: "PayPal", icon: Wallet },
  { key: "direct", label: "Direct Transfer", icon: Landmark },
];

const TABS = [
  { key: "overview", label: "Overview", icon: TrendingUp },
  { key: "award", label: "Award Points", icon: Award },
  { key: "redeem", label: "Accept Redeem", icon: Gift },
  { key: "topup", label: "Buy Tokens", icon: Coins },
];

export default function MerchantPanel() {
  const [tab, setTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [merchantData, setMerchantData] = useState(null);
  const [recentTxs, setRecentTxs] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Award state
  const [awardEmail, setAwardEmail] = useState("");
  const [awardAmt, setAwardAmt] = useState("");
  const [awardLoading, setAwardLoading] = useState(false);

  // Redeem state
  const [redeemEmail, setRedeemEmail] = useState("");
  const [redeemAmt, setRedeemAmt] = useState("");
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [customerBalance, setCustomerBalance] = useState(null);

  // TopUp state
  const [topupAmt, setTopupAmt] = useState("");
  const [topupMethod, setTopupMethod] = useState("esewa");
  const [topupLoading, setTopupLoading] = useState(false);
  const [topupResult, setTopupResult] = useState(null);

  useEffect(() => { loadOverview(); }, []);

  const loadOverview = async () => {
    try {
      const [ar, mr, tr] = await Promise.all([
        analytics.merchant().catch(() => null),
        merchantApi.status().catch(() => null),
        transactions.list({ limit: 10 }).catch(() => null),
      ]);
      setStats(ar?.data?.analytics || null);
      setMerchantData(mr?.data?.merchant || null);
      setRecentTxs(tr?.data?.transactions || []);
    } catch {}
  };

  const checkCustomerBalance = async () => {
    if (!redeemEmail) { setCustomerBalance(null); return; }
    try {
      const r = await points.balanceByEmail(redeemEmail);
      setCustomerBalance(r.data);
    } catch { setCustomerBalance(null); }
  };

  useEffect(() => { checkCustomerBalance(); }, [redeemEmail]);

  const awardPoints = async () => {
    if (!awardEmail || !awardAmt) { setError("Fill all fields"); return; }
    setAwardLoading(true); setError(""); setSuccess("");
    try {
      const r = await points.award({ customerEmail: awardEmail, amount: awardAmt.toString() });
      setSuccess(`Awarded ${awardAmt} points to ${awardEmail}!`);
      setAwardEmail(""); setAwardAmt("");
      loadOverview();
    } catch (e) { setError(e.response?.data?.error || "Failed to award points"); }
    setAwardLoading(false);
  };

  const redeemPoints = async () => {
    if (!redeemEmail || !redeemAmt) { setError("Fill all fields"); return; }
    setRedeemLoading(true); setError(""); setSuccess("");
    try {
      const r = await points.redeem({ customerEmail: redeemEmail, amount: redeemAmt.toString() });
      setSuccess(`Redeemed ${redeemAmt} points from ${redeemEmail}!`);
      setRedeemEmail(""); setRedeemAmt(""); setCustomerBalance(null);
      loadOverview();
    } catch (e) { setError(e.response?.data?.error || "Redemption failed"); }
    setRedeemLoading(false);
  };

  const buyTokens = async () => {
    if (!topupAmt || +topupAmt <= 0) { setError("Enter amount"); return; }
    setTopupLoading(true); setError(""); setSuccess(""); setTopupResult(null);
    try {
      const r = await merchantApi.topup({ amountNPR: +topupAmt, method: topupMethod });
      setTopupResult(r.data);
      setSuccess(`Purchased ${r.data.netTokens} tokens via ${topupMethod}!`);
      setTopupAmt("");
      loadOverview();
    } catch (e) { setError(e.response?.data?.error || "Top-up failed"); }
    setTopupLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Store className="w-6 h-6 text-blue-600" />
        <h1 className="text-2xl font-bold">Merchant Panel</h1>
      </div>

      <div className="flex gap-2 flex-wrap">
        {TABS.map((t) => (
          <Button key={t.key} variant={tab === t.key ? "default" : "outline"} size="sm" onClick={() => { setTab(t.key); setError(""); setSuccess(""); }}>
            <t.icon className="w-4 h-4 mr-1" />{t.label}
          </Button>
        ))}
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4 shrink-0" />{success}</div>}

      {tab === "overview" && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="bg-gradient-to-br from-green-50 border-green-200">
              <CardContent className="pt-4 flex items-center gap-3">
                <Coins className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-xs text-gray-500">Token Balance</p>
                  <p className="text-lg font-bold">{parseInt(merchantData?.tokenBalance || stats?.tokenBalance || "0").toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-green-200">
              <CardContent className="pt-4 flex items-center gap-3">
                <Award className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-xs text-gray-500">Points Awarded</p>
                  <p className="text-lg font-bold">{parseInt(stats?.totalAwarded || "0").toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-red-200">
              <CardContent className="pt-4 flex items-center gap-3">
                <Gift className="w-8 h-8 text-red-500" />
                <div>
                  <p className="text-xs text-gray-500">Points Redeemed</p>
                  <p className="text-lg font-bold">{parseInt(stats?.totalRedeemed || "0").toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-blue-200">
              <CardContent className="pt-4 flex items-center gap-3">
                <Users className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-xs text-gray-500">Customers</p>
                  <p className="text-lg font-bold">{stats?.uniqueCustomers || 0}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {merchantData && (
            <Card>
              <CardContent className="pt-4 flex items-center justify-between flex-wrap gap-4">
                <div>
                  <p className="font-semibold">{merchantData.businessName}</p>
                  <Badge variant="success">{merchantData.kybStatus}</Badge>
                  <p className="text-xs text-gray-500 mt-1">Token: {merchantData.tokenSymbol || "-"}</p>
                </div>
                <div className="text-right text-sm text-gray-500">
                  <p>Rate: 1 NPR = {(merchantData.exchangeRate || 100) / 100} pts</p>
                  <p>Fee: {merchantData.feeRate || 5}%</p>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
            <CardContent>
              {recentTxs.length === 0 ? (
                <p className="text-gray-500 text-sm py-8 text-center">No activity yet</p>
              ) : (
                <div className="space-y-2">
                  {recentTxs.slice(0, 10).map((tx) => (
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
      )}

      {tab === "award" && (
        <Card>
          <CardHeader><CardTitle>Award Points</CardTitle><CardDesc>Give loyalty points to a customer who paid you</CardDesc></CardHeader>
          <CardContent className="space-y-4 max-w-md">
            <div>
              <Label>Customer Email</Label>
              <Input type="email" placeholder="customer@example.com" value={awardEmail} onChange={(e) => setAwardEmail(e.target.value)} />
            </div>
            <div>
              <Label>Points to Award</Label>
              <Input type="number" placeholder="100" value={awardAmt} onChange={(e) => setAwardAmt(e.target.value)} />
            </div>
            <div className="text-xs text-gray-500">
              Your balance: {parseInt(merchantData?.tokenBalance || stats?.tokenBalance || "0").toLocaleString()} tokens
            </div>
            <Button className="w-full" onClick={awardPoints} disabled={awardLoading}>
              <Award className="w-4 h-4 mr-1" />{awardLoading ? "Processing..." : "Award Points"}
            </Button>
          </CardContent>
        </Card>
      )}

      {tab === "redeem" && (
        <Card>
          <CardHeader><CardTitle>Accept Redemption</CardTitle><CardDesc>Accept points from a customer (works across all merchants)</CardDesc></CardHeader>
          <CardContent className="space-y-4 max-w-md">
            <div>
              <Label>Customer Email</Label>
              <Input type="email" placeholder="customer@example.com" value={redeemEmail} onChange={(e) => setRedeemEmail(e.target.value)} />
            </div>
            {customerBalance && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-sm">
                Customer balance: <strong>{parseInt(customerBalance.balance).toLocaleString()}</strong> points
                {!customerBalance.found && <span className="text-red-500 ml-2">(not registered)</span>}
              </div>
            )}
            <div>
              <Label>Points to Redeem</Label>
              <Input type="number" placeholder="100" value={redeemAmt} onChange={(e) => setRedeemAmt(e.target.value)} />
            </div>
            <Button className="w-full" onClick={redeemPoints} disabled={redeemLoading}>
              <Gift className="w-4 h-4 mr-1" />{redeemLoading ? "Processing..." : "Accept Redemption"}
            </Button>
          </CardContent>
        </Card>
      )}

      {tab === "topup" && (
        <Card>
          <CardHeader><CardTitle>Buy Tokens</CardTitle><CardDesc>Purchase loyalty tokens for your business</CardDesc></CardHeader>
          <CardContent className="space-y-4 max-w-md">
            {topupResult && (
              <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg text-sm space-y-1">
                <p className="font-medium">Purchase complete!</p>
                <p>NPR {topupResult.amountNPR} → {topupResult.netTokens} tokens</p>
                <p className="text-xs">Fee included | Method: {topupResult.method}</p>
              </div>
            )}
            <div>
              <Label>Amount (NPR)</Label>
              <div className="relative mt-1">
                <Coins className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input type="number" placeholder="1000" value={topupAmt} onChange={(e) => { setTopupAmt(e.target.value); setTopupResult(null); }} className="pl-10" />
              </div>
            </div>
            <div>
              <Label>Payment Method</Label>
              <div className="grid grid-cols-3 gap-2 mt-1">
                {PAY_METHODS.map((m) => (
                  <button
                    key={m.key}
                    onClick={() => setTopupMethod(m.key)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-lg border text-xs font-medium transition-colors ${topupMethod === m.key ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                  >
                    <m.icon className="w-5 h-5" />
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-xs text-gray-500">~{parseInt(topupAmt || "0") * 95 / 100} tokens after 5% fee</p>
            <Button className="w-full" onClick={buyTokens} disabled={topupLoading}>
              <Coins className="w-4 h-4 mr-1" />{topupLoading ? "Processing..." : `Pay with ${PAY_METHODS.find(m => m.key === topupMethod)?.label || topupMethod}`}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
