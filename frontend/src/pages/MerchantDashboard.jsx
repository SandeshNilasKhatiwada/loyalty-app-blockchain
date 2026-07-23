import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDesc } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input, Label } from "../components/ui/input";
import { Badge } from "../components/ui/table";
import { useAuth } from "../contexts/AuthContext";
import { merchantApi, points } from "../services/endpoints";
import { Store, Award, Gift, Coins, TrendingUp, Users, CheckCircle, AlertCircle, Clock, DollarSign, CreditCard, Wallet, Landmark, XCircle, Loader, RefreshCw, Mail } from "lucide-react";

const TABS = [
  { key: "overview", label: "Overview", icon: TrendingUp },
  { key: "award", label: "Award Points", icon: Award },
  { key: "customers", label: "Customers", icon: Users },
  { key: "topup", label: "Buy Tokens", icon: Coins },
];

export default function MerchantDashboard() {
  const { merchant } = useAuth();
  const [tab, setTab] = useState("overview");
  const [merchantData, setMerchantData] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    if (sessionId) {
      setProcessingPayment(true);
      setTab("topup");
      confirmPayment(sessionId);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const r = await merchantApi.status();
      setMerchantData(r.data.merchant);
    } catch {}
  };

  const confirmPayment = async (sessionId) => {
    try {
      const r = await merchantApi.checkoutSuccess({ sessionId });
      setSuccess(`Payment confirmed! ${r.data.netTokens} tokens added.`);
      load();
    } catch (e) {
      setError(e.response?.data?.error || "Payment confirmation failed");
    }
    setProcessingPayment(false);
  };

  if (!merchant) return null;
  const isPending = merchant?.kybStatus === "PENDING" || merchantData?.kybStatus === "PENDING";
  const isRejected = merchant?.kybStatus === "REJECTED" || merchantData?.kybStatus === "REJECTED";
  const isApproved = merchantData?.kybStatus === "APPROVED";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Store className="w-6 h-6 text-blue-600" />
        <h1 className="text-2xl font-bold">Merchant Dashboard</h1>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4" />{success}</div>}

      {processingPayment && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-4 flex items-center gap-3">
            <Loader className="w-6 h-6 animate-spin text-blue-600" />
            <div>
              <p className="font-medium text-blue-800">Processing your payment...</p>
              <p className="text-sm text-blue-700">Please wait while we confirm your Stripe payment.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {isPending && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="pt-4 flex items-center gap-3">
            <Clock className="w-6 h-6 text-yellow-600 shrink-0" />
            <div>
              <p className="font-medium text-yellow-800">Application Pending</p>
              <p className="text-sm text-yellow-700">Your merchant registration is under review. You'll be able to use the platform once approved.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {isRejected && (
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

      {isApproved && (
        <>
          <div className="flex gap-2 flex-wrap">
            {TABS.map((t) => (
              <Button key={t.key} variant={tab === t.key ? "default" : "outline"} size="sm" onClick={() => { setTab(t.key); setError(""); setSuccess(""); }}>
                <t.icon className="w-4 h-4 mr-1" />{t.label}
              </Button>
            ))}
          </div>

          {tab === "overview" && <OverviewTab merchantData={merchantData} load={load} />}
          {tab === "award" && <AwardTab merchantData={merchantData} load={load} />}
          {tab === "customers" && <CustomersTab />}
          {tab === "topup" && <TopUpTab merchantData={merchantData} load={load} />}
        </>
      )}
    </div>
  );
}

function OverviewTab({ merchantData, load }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-green-50 border-green-200">
          <CardContent className="pt-4 flex items-center gap-3">
            <Coins className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-xs text-gray-500">Token Balance</p>
              <p className="text-lg font-bold">{parseInt(merchantData?.tokenBalance || "0").toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-200">
          <CardContent className="pt-4 flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-xs text-gray-500">Rate</p>
              <p className="text-lg font-bold">1 NPR = {(merchantData?.exchangeRate || 100) / 100} pts</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-orange-200">
          <CardContent className="pt-4 flex items-center gap-3">
            <Award className="w-8 h-8 text-orange-500" />
            <div>
              <p className="text-xs text-gray-500">Fee</p>
              <p className="text-lg font-bold">{merchantData?.feeRate || 5}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-lg">{merchantData?.businessName}</p>
            <Badge variant="success">Approved</Badge>
          </div>
          <p className="text-sm text-gray-500">{merchantData?.email}</p>
          {merchantData?.phone && <p className="text-sm text-gray-500">{merchantData.phone}</p>}
          {merchantData?.country && <p className="text-sm text-gray-500">{merchantData.country} ({merchantData.currency})</p>}
          {merchantData?.website && <p className="text-sm text-blue-600">{merchantData.website}</p>}
          <p className="text-sm text-gray-400">Plan: {merchantData?.plan}</p>
        </CardContent>
      </Card>
    </div>
  );
}

function AwardTab({ merchantData, load }) {
  const [customerEmail, setCustomerEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [customerInfo, setCustomerInfo] = useState(null);

  useEffect(() => {
    if (!customerEmail) { setCustomerInfo(null); return; }
    points.balanceByEmail(customerEmail).then((r) => setCustomerInfo(r.data)).catch(() => setCustomerInfo(null));
  }, [customerEmail]);

  const awardPoints = async () => {
    if (!customerEmail || !amount || +amount <= 0) { setError("Fill all fields"); return; }
    if (+amount > parseInt(merchantData?.tokenBalance || "0")) { setError("Insufficient token balance"); return; }
    setLoading(true); setError(""); setSuccess("");
    try {
      const r = await merchantApi.award({ customerEmail, amount: amount.toString() });
      setSuccess(`Awarded ${amount} points to ${customerEmail}!`);
      setCustomerEmail(""); setAmount(""); setCustomerInfo(null);
      load();
    } catch (e) { setError(e.response?.data?.error || "Award failed"); }
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader><CardTitle>Award Loyalty Points</CardTitle><CardDesc>Send points to a customer by their email address</CardDesc></CardHeader>
      <CardContent className="space-y-4 max-w-md">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</div>}
        {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4" />{success}</div>}
        <div>
          <Label>Customer Email</Label>
          <div className="relative mt-1">
            <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <Input type="email" placeholder="customer@example.com" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} className="pl-10" />
          </div>
          {customerInfo && (
            <p className="text-xs mt-1 text-gray-500">
              {customerInfo.found ? `Existing customer • Balance: ${parseInt(customerInfo.balance).toLocaleString()} pts` : "New customer (will be created)"}
            </p>
          )}
        </div>
        <div>
          <Label>Points to Award</Label>
          <Input type="number" placeholder="100" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div className="text-xs text-gray-500">
          Your balance: <strong>{parseInt(merchantData?.tokenBalance || "0").toLocaleString()}</strong> tokens
        </div>
        <Button className="w-full" onClick={awardPoints} disabled={loading}>
          <Award className="w-4 h-4 mr-1" />{loading ? "Awarding..." : "Award Points"}
        </Button>
      </CardContent>
    </Card>
  );
}

function CustomersTab() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    merchantApi.customers().then((r) => setCustomers(r.data.customers || [])).catch(() => {}).finally(() => setLoading(false));
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
                  <th className="pb-2 font-medium">Current Balance</th>
                  <th className="pb-2 font-medium">Last Award</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c, i) => (
                  <tr key={c.email || i} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-2 pr-4 text-xs font-medium">{c.email}</td>
                    <td className="py-2 pr-4 text-gray-500">{c.name || "-"}</td>
                    <td className="py-2 pr-4 text-green-600 font-medium">{parseInt(c.totalAwarded).toLocaleString()}</td>
                    <td className="py-2 pr-4 font-medium">{parseInt(c.pointsBalance).toLocaleString()}</td>
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

function TopUpTab({ merchantData, load }) {
  const [amountNPR, setAmountNPR] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const buyTokens = async () => {
    if (!amountNPR || +amountNPR <= 0) { setError("Enter amount"); return; }
    setLoading(true); setError(""); setSuccess("");
    try {
      const r = await merchantApi.createCheckoutSession({ amountNPR: +amountNPR });
      window.location.href = r.data.url;
    } catch (e) { setError(e.response?.data?.error || "Failed to create checkout session"); }
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader><CardTitle>Buy Tokens</CardTitle><CardDesc>Purchase loyalty tokens via Stripe</CardDesc></CardHeader>
      <CardContent className="space-y-4 max-w-md">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</div>}
        {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4" />{success}</div>}
        <div>
          <Label>Amount (NPR)</Label>
          <div className="relative mt-1">
            <DollarSign className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <Input type="number" placeholder="1000" value={amountNPR} onChange={(e) => setAmountNPR(e.target.value)} className="pl-10" />
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700 space-y-1">
          <p><strong>Exchange Rate:</strong> 1 NPR = {(merchantData?.exchangeRate || 100) / 100} pts</p>
          <p><strong>Platform Fee:</strong> {merchantData?.feeRate || 5}%</p>
          <p><strong>You Get:</strong> ~{Math.floor((parseInt(amountNPR || "0") * (merchantData?.exchangeRate || 100) / 100) * (100 - (merchantData?.feeRate || 5)) / 100).toLocaleString()} tokens</p>
        </div>
        <Button className="w-full" onClick={buyTokens} disabled={loading}>
          <CreditCard className="w-4 h-4 mr-1" />{loading ? "Redirecting to Stripe..." : "Pay with Card"}
        </Button>
      </CardContent>
    </Card>
  );
}
