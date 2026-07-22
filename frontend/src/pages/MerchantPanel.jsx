import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDesc } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input, Label } from "../components/ui/input";
import { Badge } from "../components/ui/table";
import { points, merchant as merchantApi, transactions, analytics } from "../services/endpoints";
import { Award, Gift, Coins, TrendingUp, Users, CheckCircle, AlertCircle, Store } from "lucide-react";

const TABS = [
  { key: "overview", label: "Overview", icon: TrendingUp },
  { key: "award", label: "Award Points", icon: Award },
  { key: "redeem", label: "Redeem Points", icon: Gift },
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
  const [awardWa, setAwardWa] = useState("");
  const [awardAmt, setAwardAmt] = useState("");
  const [awardLoading, setAwardLoading] = useState(false);

  // Redeem state
  const [redeemWa, setRedeemWa] = useState("");
  const [redeemAmt, setRedeemAmt] = useState("");
  const [redeemLoading, setRedeemLoading] = useState(false);

  // TopUp state
  const [topupAmt, setTopupAmt] = useState("");
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

  const awardPoints = async () => {
    if (!awardWa || !awardAmt) { setError("Fill all fields"); return; }
    setAwardLoading(true); setError(""); setSuccess("");
    try {
      const r = await points.award({ customerWallet: awardWa, amount: awardAmt.toString() });
      setSuccess(`Awarded ${awardAmt} points!`);
      setAwardWa(""); setAwardAmt("");
      loadOverview();
    } catch (e) { setError(e.response?.data?.error || "Failed to award points"); }
    setAwardLoading(false);
  };

  const redeemPoints = async () => {
    if (!redeemWa || !redeemAmt) { setError("Fill all fields"); return; }
    setRedeemLoading(true); setError(""); setSuccess("");
    try {
      let tc = "0x0000000000000000000000000000000000000001";
      if (merchantData?.tokenContract) tc = merchantData.tokenContract;
      const r = await points.redeem({ customerWallet: redeemWa, amount: redeemAmt.toString(), tokenContract: tc });
      setSuccess(`Redeemed ${redeemAmt} points!`);
      setRedeemWa(""); setRedeemAmt("");
      loadOverview();
    } catch (e) { setError(e.response?.data?.error || "Redemption failed"); }
    setRedeemLoading(false);
  };

  const buyTokens = async () => {
    if (!topupAmt || +topupAmt <= 0) { setError("Enter amount"); return; }
    setTopupLoading(true); setError(""); setSuccess(""); setTopupResult(null);
    try {
      const r = await merchantApi.topup({ amountNPR: +topupAmt });
      setTopupResult(r.data);
      setSuccess(`Purchased tokens!`);
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
          <div className="grid gap-4 md:grid-cols-3">
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
                  <Badge variant="success">Active</Badge>
                  <p className="text-xs text-gray-500 mt-1">Token: {merchantData.tokenSymbol || "-"}</p>
                </div>
                <div className="text-right text-sm text-gray-500">
                  <p>Rate: 1 NPR = {merchantData.exchangeRate || 100} pts</p>
                  <p>Fee: {merchantData.feeRate || 5}%</p>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
            <CardContent>
              {recentTxs.length === 0 ? (
                <p className="text-gray-500 text-sm py-8 text-center">No activity yet. Start by awarding points!</p>
              ) : (
                <div className="space-y-2">
                  {recentTxs.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <span className="text-sm font-medium">{tx.type === "AWARD" ? "Awarded" : tx.type === "REDEEM" ? "Redeemed" : tx.type}</span>
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
          <CardHeader><CardTitle>Award Points</CardTitle><CardDesc>Give loyalty points to a customer</CardDesc></CardHeader>
          <CardContent className="space-y-4 max-w-md">
            <div><Label>Customer Wallet Address</Label><Input placeholder="0x..." value={awardWa} onChange={(e) => setAwardWa(e.target.value)} /></div>
            <div><Label>Points to Award</Label><Input type="number" placeholder="100" value={awardAmt} onChange={(e) => setAwardAmt(e.target.value)} /></div>
            <Button className="w-full" onClick={awardPoints} disabled={awardLoading}>
              <Award className="w-4 h-4 mr-1" />{awardLoading ? "Processing..." : "Award Points"}
            </Button>
          </CardContent>
        </Card>
      )}

      {tab === "redeem" && (
        <Card>
          <CardHeader><CardTitle>Redeem Points</CardTitle><CardDesc>Deduct points from a customer</CardDesc></CardHeader>
          <CardContent className="space-y-4 max-w-md">
            <div><Label>Customer Wallet Address</Label><Input placeholder="0x..." value={redeemWa} onChange={(e) => setRedeemWa(e.target.value)} /></div>
            <div><Label>Points to Redeem</Label><Input type="number" placeholder="100" value={redeemAmt} onChange={(e) => setRedeemAmt(e.target.value)} /></div>
            <Button className="w-full" onClick={redeemPoints} disabled={redeemLoading}>
              <Gift className="w-4 h-4 mr-1" />{redeemLoading ? "Processing..." : "Redeem Points"}
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
                <p className="text-xs">Fee: {topupResult.fee}</p>
              </div>
            )}
            <div>
              <Label>Amount (NPR)</Label>
              <div className="relative mt-1">
                <Coins className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input type="number" placeholder="1000" value={topupAmt} onChange={(e) => { setTopupAmt(e.target.value); setTopupResult(null); }} className="pl-10" />
              </div>
            </div>
            <p className="text-xs text-gray-500">~{parseInt(topupAmt || "0") * 95 / 100} tokens after 5% fee</p>
            <Button className="w-full" onClick={buyTokens} disabled={topupLoading}>
              <Coins className="w-4 h-4 mr-1" />{topupLoading ? "Processing..." : "Buy Tokens"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
