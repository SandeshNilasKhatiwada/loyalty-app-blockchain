import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDesc } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input, Label } from "../components/ui/input";
import { Badge } from "../components/ui/table";
import { adminApi } from "../services/endpoints";
import { Shield, CheckCircle, XCircle, Store, Users, Activity, RefreshCw, Coins, DollarSign, Building, Clock, Loader } from "lucide-react";

const TABS = [
  { key: "pending", label: "Pending Approvals", icon: Clock },
  { key: "merchants", label: "All Merchants", icon: Store },
  { key: "topup", label: "Buy Tokens", icon: Coins },
  { key: "stats", label: "Stats", icon: Activity },
];

export default function AdminPanel() {
  const [tab, setTab] = useState("pending");
  const [stats, setStats] = useState(null);
  const [pending, setPending] = useState([]);
  const [merchants, setMerchants] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => { load(); }, []);

  const load = async () => {
    setError("");
    try {
      const [sr, pr, mr] = await Promise.all([
        adminApi.stats().catch(() => null),
        adminApi.pending().catch(() => ({ data: { merchants: [] } })),
        adminApi.merchants().catch(() => ({ data: { merchants: [] } })),
      ]);
      if (sr) setStats(sr.data.stats);
      setPending(pr.data.merchants);
      setMerchants(mr.data.merchants);
    } catch { setError("Failed to load data"); }
  };

  const approve = async (id) => {
    try { await adminApi.approve(id); load(); } catch (e) { setError(e.response?.data?.error || "Approve failed"); }
  };
  const reject = async (id) => {
    try { await adminApi.reject(id); load(); } catch {}
  };

  const statusBadge = (status) => {
    const m = { APPROVED: "success", PENDING: "warning", REJECTED: "danger" };
    return <Badge variant={m[status] || "secondary"}>{status || "N/A"}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Shield className="w-5 h-5" />Admin Panel</h1>
        <Button size="sm" variant="outline" onClick={load}><RefreshCw className="w-3 h-3 mr-1" />Refresh</Button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

      <div className="flex gap-2 flex-wrap">
        {TABS.map((t) => (
          <Button key={t.key} variant={tab === t.key ? "default" : "outline"} size="sm" onClick={() => setTab(t.key)}>
            <t.icon className="w-4 h-4 mr-1" />{t.label}
          </Button>
        ))}
      </div>

      {tab === "stats" && stats && (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <Card><CardContent className="pt-4 flex items-center gap-3"><Building className="w-6 h-6 text-blue-500" /><div><p className="text-2xl font-bold">{stats.totalMerchants}</p><p className="text-xs text-gray-500">Total Merchants</p></div></CardContent></Card>
          <Card><CardContent className="pt-4 flex items-center gap-3"><CheckCircle className="w-6 h-6 text-green-500" /><div><p className="text-2xl font-bold">{stats.approvedMerchants}</p><p className="text-xs text-gray-500">Approved</p></div></CardContent></Card>
          <Card><CardContent className="pt-4 flex items-center gap-3"><Clock className="w-6 h-6 text-orange-500" /><div><p className="text-2xl font-bold">{stats.pendingMerchants}</p><p className="text-xs text-gray-500">Pending</p></div></CardContent></Card>
          <Card><CardContent className="pt-4 flex items-center gap-3"><Store className="w-6 h-6 text-purple-500" /><div><p className="text-2xl font-bold">{stats.totalCustomers}</p><p className="text-xs text-gray-500">Customers</p></div></CardContent></Card>
        </div>
      )}

      {tab === "pending" && (
        <Card>
          <CardHeader><CardTitle>Pending Merchant Approvals ({pending.length})</CardTitle></CardHeader>
          <CardContent>
            {pending.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No pending approvals</p>
            ) : (
              <div className="space-y-3">
                {pending.map((m) => (
                  <div key={m.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="space-y-1">
                      <p className="font-medium">{m.businessName}</p>
                      <p className="text-xs text-gray-500">{m.email} {m.phone ? `| ${m.phone}` : ""} {m.country ? `| ${m.country}` : ""}</p>
                      {m.legalBusinessName && <p className="text-xs text-gray-400">Legal: {m.legalBusinessName}</p>}
                      {m.website && <p className="text-xs text-gray-400">{m.website}</p>}
                      <p className="text-xs text-gray-400">Registered: {new Date(m.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" onClick={() => approve(m.id)}><CheckCircle className="w-3 h-3 mr-1" />Approve</Button>
                      <Button size="sm" variant="destructive" onClick={() => reject(m.id)}><XCircle className="w-3 h-3 mr-1" />Reject</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {tab === "merchants" && (
        <Card>
          <CardHeader><CardTitle>All Merchants</CardTitle></CardHeader>
          <CardContent>
            {merchants.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No merchants registered</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-500">
                      <th className="pb-2 font-medium">Business</th>
                      <th className="pb-2 font-medium hidden sm:table-cell">Email</th>
                      <th className="pb-2 font-medium">Status</th>
                      <th className="pb-2 font-medium hidden md:table-cell">Plan</th>
                      <th className="pb-2 font-medium hidden md:table-cell">Balance</th>
                      <th className="pb-2 font-medium hidden sm:table-cell">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {merchants.map((m) => (
                      <tr key={m.id} className="border-b last:border-0">
                        <td className="py-2 pr-4 font-medium">{m.businessName}</td>
                        <td className="py-2 pr-4 hidden sm:table-cell text-gray-500 text-xs">{m.email}</td>
                        <td className="py-2 pr-4">{statusBadge(m.kybStatus)}</td>
                        <td className="py-2 pr-4 hidden md:table-cell text-xs">{m.plan}</td>
                        <td className="py-2 pr-4 hidden md:table-cell font-mono text-xs">{parseInt(m.tokenBalance || "0").toLocaleString()}</td>
                        <td className="py-2 hidden sm:table-cell text-gray-500 text-xs">{new Date(m.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {tab === "topup" && <AdminTopup merchants={merchants} />}
    </div>
  );
}

function AdminTopup({ merchants }) {
  const [selectedId, setSelectedId] = useState("");
  const [amountNPR, setAmountNPR] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const approved = merchants.filter((m) => m.kybStatus === "APPROVED");

  const buyTokens = async () => {
    if (!selectedId || !amountNPR || +amountNPR <= 0) { setError("Select merchant and enter amount"); return; }
    setLoading(true); setError(""); setResult(null);
    try {
      const r = await adminApi.topup(selectedId, { amountNPR: +amountNPR });
      setResult(r.data);
    } catch (e) { setError(e.response?.data?.error || "Top-up failed"); }
    setLoading(false);
  };

  const selected = approved.find((m) => m.id === selectedId);

  return (
    <Card>
      <CardHeader><CardTitle>Buy Tokens for Merchant</CardTitle><CardDesc>Purchase loyalty tokens on behalf of a merchant</CardDesc></CardHeader>
      <CardContent className="space-y-4 max-w-md">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
        {result && (
          <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg text-sm space-y-1">
            <p className="font-medium">Purchase complete!</p>
            <p>NPR {result.amountNPR} → {result.netTokens} tokens for {result.merchant?.businessName}</p>
            <p className="text-xs">Fee: {result.fee} tokens deducted</p>
          </div>
        )}
        <div>
          <Label>Select Merchant</Label>
          <select
            className="w-full mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
            value={selectedId}
            onChange={(e) => { setSelectedId(e.target.value); setResult(null); }}
          >
            <option value="">-- Select --</option>
            {approved.map((m) => (
              <option key={m.id} value={m.id}>{m.businessName} ({m.email})</option>
            ))}
          </select>
        </div>
        {selected && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700 space-y-1">
            <p><strong>{selected.businessName}</strong></p>
            <p>Current Balance: {parseInt(selected.tokenBalance || "0").toLocaleString()} tokens</p>
            <p>Rate: 1 NPR = {(selected.exchangeRate || 100) / 100} pts | Fee: {selected.feeRate || 5}%</p>
          </div>
        )}
        <div>
          <Label>Amount (NPR)</Label>
          <div className="relative mt-1">
            <DollarSign className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <Input type="number" placeholder="1000" value={amountNPR} onChange={(e) => { setAmountNPR(e.target.value); setResult(null); }} className="pl-10" />
          </div>
        </div>
        {selected && amountNPR && (
          <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
            <p>Gross tokens: {Math.floor((+amountNPR * (selected.exchangeRate || 100)) / 100).toLocaleString()}</p>
            <p>Fee ({(selected.feeRate || 5)}%): -{Math.floor(Math.floor((+amountNPR * (selected.exchangeRate || 100)) / 100) * (selected.feeRate || 5) / 100).toLocaleString()}</p>
            <p className="font-semibold">Net tokens: {Math.floor(Math.floor((+amountNPR * (selected.exchangeRate || 100)) / 100) * (100 - (selected.feeRate || 5)) / 100).toLocaleString()}</p>
          </div>
        )}
        <Button className="w-full" onClick={buyTokens} disabled={loading || !selectedId}>
          <Coins className="w-4 h-4 mr-1" />{loading ? "Processing..." : "Buy Tokens"}
        </Button>
      </CardContent>
    </Card>
  );
}
