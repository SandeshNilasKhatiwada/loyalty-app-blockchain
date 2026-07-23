import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDesc } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input, Label } from "../components/ui/input";
import { Badge } from "../components/ui/table";
import { points, merchant as merchantApi, transactions, analytics } from "../services/endpoints";
import { Award, Gift, Coins, TrendingUp, Users, CheckCircle, AlertCircle, Store, Wallet, CreditCard, Landmark, Clock, XCircle, Search, UserCheck, UserX, DollarSign, Loader, Fingerprint, Shield } from "lucide-react";

const PAY_METHODS = [
  { key: "stripe", label: "Stripe", icon: CreditCard },
  { key: "paypal", label: "PayPal", icon: Wallet },
  { key: "esewa", label: "eSewa", icon: Landmark },
  { key: "direct", label: "Direct Transfer", icon: DollarSign },
];

const TABS = [
  { key: "overview", label: "Overview", icon: TrendingUp },
  { key: "award", label: "Award Points", icon: Award },
  { key: "redeem", label: "Accept Redeem", icon: Gift },
  { key: "customers", label: "Customers", icon: Users },
  { key: "pending", label: "Pending Awards", icon: Clock },
  { key: "topup", label: "Buy Tokens", icon: Coins },
];

function CustomersTab({ merchantData }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    merchantApi.customers().then(r => setCustomers(r.data.customers || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-10 text-gray-400"><Loader className="w-6 h-6 mx-auto mb-2 animate-spin" />Loading customers...</div>;

  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><Users className="w-4 h-4" />Your Customers</CardTitle></CardHeader>
      <CardContent>
        {customers.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No customers yet</p>
            <p className="text-xs mt-1">Award points to customers and they will appear here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2 font-medium">Email</th>
                  <th className="pb-2 font-medium">Name</th>
                  <th className="pb-2 font-medium">Points Awarded</th>
                  <th className="pb-2 font-medium">Points Redeemed</th>
                  <th className="pb-2 font-medium">Balance</th>
                  <th className="pb-2 font-medium">Last Activity</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c, i) => (
                  <tr key={c.email || i} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-2 pr-4 text-xs font-medium">{c.email}</td>
                    <td className="py-2 pr-4 text-gray-500">{c.name || "-"}</td>
                    <td className="py-2 pr-4 text-green-600 font-medium">{c.totalAwarded.toLocaleString()}</td>
                    <td className="py-2 pr-4 text-red-600 font-medium">{c.totalRedeemed.toLocaleString()}</td>
                    <td className="py-2 pr-4 font-medium">{parseInt(c.user?.pointsBalance || "0").toLocaleString()}</td>
                    <td className="py-2 text-gray-400 text-xs">{new Date(c.lastAward).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PendingAwardsTab({ merchantData, loadOverview }) {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [awardEmail, setAwardEmail] = useState("");
  const [awardAmt, setAwardAmt] = useState("");
  const [awardLoading, setAwardLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadPending = async () => {
    try {
      const r = await merchantApi.pendingAwards();
      setPending(r.data.pendingAwards || []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { loadPending(); }, []);

  const requestAward = async () => {
    if (!awardEmail || !awardAmt) { setError("Fill all fields"); return; }
    setAwardLoading(true); setError(""); setSuccess("");
    try {
      await merchantApi.requestAward({ customerEmail: awardEmail, amount: awardAmt.toString() });
      setSuccess(`Award request for ${awardAmt} points sent to ${awardEmail}!`);
      setAwardEmail(""); setAwardAmt("");
      loadPending();
    } catch (e) { setError(e.response?.data?.error || "Request failed"); }
    setAwardLoading(false);
  };

  const approveAward = async (id) => {
    setError(""); setSuccess("");
    try {
      await merchantApi.approveAward({ pendingAwardId: id });
      setSuccess("Award approved and points transferred!");
      loadPending();
      if (loadOverview) loadOverview();
    } catch (e) { setError(e.response?.data?.error || "Approval failed"); }
  };

  const rejectAward = async (id) => {
    setError(""); setSuccess("");
    try {
      await merchantApi.rejectAward({ pendingAwardId: id });
      setSuccess("Award request rejected.");
      loadPending();
    } catch (e) { setError(e.response?.data?.error || "Rejection failed"); }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Award className="w-4 h-4" />Request Award for Customer</CardTitle><CardDesc>Create a pending award request for a customer, then approve it below</CardDesc></CardHeader>
        <CardContent className="space-y-4 max-w-md">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}
          {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4 shrink-0" />{success}</div>}
          <div>
            <Label>Customer Email</Label>
            <Input type="email" placeholder="customer@example.com" value={awardEmail} onChange={(e) => setAwardEmail(e.target.value)} />
          </div>
          <div>
            <Label>Points to Award</Label>
            <Input type="number" placeholder="100" value={awardAmt} onChange={(e) => setAwardAmt(e.target.value)} />
          </div>
          <Button className="w-full" onClick={requestAward} disabled={awardLoading}>
            <Clock className="w-4 h-4 mr-1" />{awardLoading ? "Submitting..." : "Create Award Request"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Pending Award Requests ({pending.length})</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-400"><Loader className="w-5 h-5 mx-auto mb-2 animate-spin" />Loading...</div>
          ) : pending.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No pending award requests</p>
              <p className="text-xs mt-1">Create a request above to send points to a customer</p>
            </div>
          ) : (
            <div className="space-y-2">
              {pending.map((pa) => (
                <div key={pa.id} className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div>
                    <p className="font-medium">{pa.customer?.email || "Unknown"}</p>
                    <p className="text-sm text-gray-500">{pa.amount} points • {new Date(pa.createdAt).toLocaleString()}</p>
                    <p className="text-xs text-gray-400">Balance: {parseInt(pa.customer?.pointsBalance || "0").toLocaleString()} pts</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => approveAward(pa.id)} disabled={parseInt(merchantData?.tokenBalance || "0") < parseInt(pa.amount)}>
                      <CheckCircle className="w-3 h-3 mr-1" />Approve
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => rejectAward(pa.id)}>
                      <XCircle className="w-3 h-3 mr-1" />Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {parseInt(merchantData?.tokenBalance || "0") < 1 && pending.length > 0 && (
            <p className="text-xs text-red-500 mt-2">Insufficient token balance to approve awards. Buy tokens first.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function TopUpTab({ merchantData, loadOverview }) {
  const [topupAmt, setTopupAmt] = useState("");
  const [topupMethod, setTopupMethod] = useState("stripe");
  const [topupLoading, setTopupLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [topupResult, setTopupResult] = useState(null);

  const buyTokens = async () => {
    if (!topupAmt || +topupAmt <= 0) { setError("Enter amount"); return; }
    setTopupLoading(true); setError(""); setSuccess(""); setTopupResult(null);
    try {
      if (topupMethod === "stripe") {
        const pi = await merchantApi.createPaymentIntent({ amountNPR: +topupAmt });
        if (pi.data.mock) {
          setSuccess(pi.data.message);
        }
      }
      const r = await merchantApi.confirmPayment({ amountNPR: +topupAmt, method: topupMethod, paymentId: "pay_" + Date.now() });
      setTopupResult(r.data);
      setSuccess(`Purchased ${r.data.netTokens} tokens via ${topupMethod}!`);
      setTopupAmt("");
      if (loadOverview) loadOverview();
    } catch (e) { setError(e.response?.data?.error || "Top-up failed"); }
    setTopupLoading(false);
  };

  return (
    <Card>
      <CardHeader><CardTitle>Buy Tokens</CardTitle><CardDesc>Purchase loyalty tokens for your business</CardDesc></CardHeader>
      <CardContent className="space-y-4 max-w-md">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</div>}
        {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4" />{success}</div>}
        {topupResult && (
          <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg text-sm space-y-1">
            <p className="font-medium">Purchase complete!</p>
            <p>NPR {topupResult.amountNPR} → {topupResult.netTokens} tokens</p>
            <p className="text-xs">Fee: {topupResult.fee} | Method: {topupResult.method} | TX: {topupResult.txHash?.slice(0, 20)}...</p>
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
          <div className="grid grid-cols-4 gap-2 mt-1">
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
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700 space-y-1">
          <p><strong>Exchange Rate:</strong> 1 NPR = {(merchantData?.exchangeRate || 100) / 100} pts</p>
          <p><strong>Platform Fee:</strong> {merchantData?.feeRate || 5}%</p>
          <p><strong>You Get:</strong> ~{Math.floor((parseInt(topupAmt || "0") * (merchantData?.exchangeRate || 100) / 100) * (100 - (merchantData?.feeRate || 5)) / 100).toLocaleString()} tokens</p>
        </div>
        <Button className="w-full" onClick={buyTokens} disabled={topupLoading}>
          <Coins className="w-4 h-4 mr-1" />{topupLoading ? "Processing..." : `Pay with ${PAY_METHODS.find(m => m.key === topupMethod)?.label || topupMethod}`}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function MerchantPanel() {
  const [tab, setTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [merchantData, setMerchantData] = useState(null);
  const [recentTxs, setRecentTxs] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [awardEmail, setAwardEmail] = useState("");
  const [awardAmt, setAwardAmt] = useState("");
  const [awardLoading, setAwardLoading] = useState(false);

  const [redeemEmail, setRedeemEmail] = useState("");
  const [redeemAmt, setRedeemAmt] = useState("");
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [customerBalance, setCustomerBalance] = useState(null);

  const merchantStatus = merchantData?.kybStatus;

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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Store className="w-6 h-6 text-blue-600" />
        <h1 className="text-2xl font-bold">Merchant Panel</h1>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4 shrink-0" />{success}</div>}

      {merchantData && merchantData.kybStatus === "PENDING" && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="pt-4 flex items-center gap-3">
            <Clock className="w-6 h-6 text-yellow-600 shrink-0" />
            <div>
              <p className="font-medium text-yellow-800">Application Pending</p>
              <p className="text-sm text-yellow-700">Your merchant registration is under review by the admin.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {merchantData && merchantData.kybStatus === "REJECTED" && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-4 flex items-center gap-3">
            <XCircle className="w-6 h-6 text-red-600 shrink-0" />
            <div>
              <p className="font-medium text-red-800">Application Rejected</p>
              <p className="text-sm text-red-700">Your merchant application was not approved. Contact the admin for details.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {(!merchantData || merchantData.kybStatus === "APPROVED") && (<>
      <div className="flex gap-2 flex-wrap">
        {TABS.map((t) => (
          <Button key={t.key} variant={tab === t.key ? "default" : "outline"} size="sm" onClick={() => { setTab(t.key); setError(""); setSuccess(""); }}>
            <t.icon className="w-4 h-4 mr-1" />{t.label}
          </Button>
        ))}
      </div>

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
                <div className="space-y-1">
                  <p className="font-semibold text-lg">{merchantData.businessName}</p>
                  {merchantData.ownerName && <p className="text-sm text-gray-500">Owner: {merchantData.ownerName}</p>}
                  <div className="flex gap-2 mt-1">
                    <Badge variant="success">{merchantData.kybStatus}</Badge>
                    {merchantData.tokenSymbol && <Badge variant="secondary">{merchantData.tokenSymbol}</Badge>}
                  </div>
                  {merchantData.kycHash && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-green-700">
                      <Fingerprint className="w-3 h-3" />
                      <span>KYC Verified on Blockchain</span>
                    </div>
                  )}
                </div>
                <div className="text-right text-sm text-gray-500 space-y-1">
                  <p>Rate: 1 NPR = {(merchantData.exchangeRate || 100) / 100} pts</p>
                  <p>Fee: {merchantData.feeRate || 5}%</p>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-4 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <XCircle className="w-6 h-6 text-red-500 shrink-0" />
                <div>
                  <p className="font-semibold text-red-800">Delete Merchant Account</p>
                  <p className="text-xs text-red-600">Remove your merchant status and all associated data. This cannot be undone.</p>
                </div>
              </div>
              <Button size="sm" variant="destructive" onClick={async () => {
                if (!confirm("Are you sure? This will delete your merchant account and all transactions.")) return;
                try {
                  await merchantApi.deleteAccount();
                  window.location.href = "/dashboard";
                } catch (e) { setError(e.response?.data?.error || "Delete failed"); }
              }}>
                <XCircle className="w-4 h-4 mr-1" />Delete Account
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
            <CardContent>
              {recentTxs.length === 0 ? (
                <p className="text-gray-500 text-sm py-8 text-center">No activity yet</p>
              ) : (
                <div className="space-y-2">
                  {recentTxs.slice(0, 10).map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Badge variant={tx.type === "TOPUP" ? "success" : tx.type === "AWARD" ? "success" : tx.type === "REDEEM" ? "danger" : "secondary"} className="shrink-0">
                          {tx.type}
                        </Badge>
                        <span className="text-xs text-gray-500">{new Date(tx.createdAt).toLocaleString()}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-medium">{tx.amount} pts</span>
                        <p className="text-xs text-gray-400">{tx.user?.email || ""}</p>
                      </div>
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
          <CardHeader><CardTitle>Award Points</CardTitle><CardDesc>Give loyalty points directly to a customer who paid you</CardDesc></CardHeader>
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
              Your balance: <strong>{parseInt(merchantData?.tokenBalance || stats?.tokenBalance || "0").toLocaleString()}</strong> tokens
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
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-sm flex items-center justify-between">
                <span>Customer balance:</span>
                <strong>{parseInt(customerBalance.balance).toLocaleString()} points</strong>
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

      {tab === "customers" && <CustomersTab merchantData={merchantData} />}

      {tab === "pending" && <PendingAwardsTab merchantData={merchantData} loadOverview={loadOverview} />}

      {tab === "topup" && <TopUpTab merchantData={merchantData} loadOverview={loadOverview} />}
      </>)}
    </div>
  );
}