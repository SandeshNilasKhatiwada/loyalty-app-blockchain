import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDesc } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input, Label } from "../components/ui/input";
import { Badge } from "../components/ui/table";
import { useAuth } from "../contexts/AuthContext";
import { admin } from "../services/endpoints";
import { Shield, CheckCircle, XCircle } from "lucide-react";
import { useEffect } from "react";

export default function Admin() {
  const [tab, setTab] = useState("pending");
  const [pending, setPending] = useState([]);
  const [merchants, setMerchants] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const [sr, pr, mr] = await Promise.all([admin.stats(), admin.pending(), admin.merchants()]);
      setStats(sr.data.stats);
      setPending(pr.data.merchants);
      setMerchants(mr.data.merchants);
    } catch {}
  };

  const approve = async (id, name) => {
    await admin.approve(id, { tokenName: `${name} Token`, tokenSymbol: name.slice(0, 5).toUpperCase() });
    load();
  };
  const reject = async (id) => { await admin.reject(id); load(); };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2"><Shield className="w-5 h-5" />Admin</h1>
      {stats && <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="pt-6"><p className="text-2xl font-bold">{stats.users}</p><p className="text-xs text-gray-500">Users</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-2xl font-bold">{stats.merchants}</p><p className="text-xs text-gray-500">Merchants</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-2xl font-bold">{stats.approved}</p><p className="text-xs text-gray-500">Approved</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-2xl font-bold">{stats.transactions}</p><p className="text-xs text-gray-500">TXs</p></CardContent></Card>
      </div>}
      <div className="flex gap-2"><Button variant={tab === "pending" ? "default" : "outline"} onClick={() => setTab("pending")}>Pending ({pending.length})</Button><Button variant={tab === "all" ? "default" : "outline"} onClick={() => setTab("all")}>All</Button></div>
      {tab === "pending" && <Card><CardHeader><CardTitle>Pending Approvals</CardTitle></CardHeader><CardContent>{pending.length === 0 ? <p className="text-gray-500 text-center py-8">None</p> : pending.map(m => <div key={m.id} className="flex justify-between items-center p-3 border-b last:border-0"><div><p className="font-medium">{m.businessName}</p><p className="text-xs text-gray-500">{m.user.walletAddress?.slice(0, 10)}... | {new Date(m.createdAt).toLocaleDateString()}</p></div><div className="flex gap-2"><Button size="sm" onClick={() => approve(m.id, m.businessName)}><CheckCircle className="w-3 h-3 mr-1" />Approve</Button><Button size="sm" variant="destructive" onClick={() => reject(m.id)}><XCircle className="w-3 h-3 mr-1" />Reject</Button></div></div>)}</CardContent></Card>}
    </div>
  );
}
