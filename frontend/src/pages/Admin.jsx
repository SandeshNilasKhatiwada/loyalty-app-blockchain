import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/table";
import { admin } from "../services/endpoints";
import { Shield, CheckCircle, XCircle, Users, Store, Activity } from "lucide-react";

export default function Admin() {
  const [tab, setTab] = useState("stats");
  const [pending, setPending] = useState([]);
  const [allMerchants, setAllMerchants] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const [sr, pr, mr] = await Promise.all([
        admin.stats(),
        admin.pending().catch(() => ({ data: { merchants: [] } })),
        admin.merchants().catch(() => ({ data: { merchants: [] } })),
      ]);
      setStats(sr.data.stats);
      setPending(pr.data.merchants);
      setAllMerchants(mr.data.merchants);
    } catch {}
  };

  const approve = async (id, name) => {
    try {
      await admin.approve(id, { tokenName: `${name} Token`, tokenSymbol: name.slice(0, 5).toUpperCase() });
      load();
    } catch {}
  };
  const reject = async (id) => { try { await admin.reject(id); load(); } catch {} };

  const statusBadge = (status) => {
    const m = { APPROVED: "success", PENDING: "warning", REJECTED: "danger" };
    return <Badge variant={m[status] || "secondary"}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2"><Shield className="w-5 h-5" />Admin Panel</h1>

      {stats && (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <Card>
            <CardContent className="pt-4 flex items-center gap-3">
              <Users className="w-6 h-6 text-blue-500" />
              <div><p className="text-2xl font-bold">{stats.users}</p><p className="text-xs text-gray-500">Users</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 flex items-center gap-3">
              <Store className="w-6 h-6 text-purple-500" />
              <div><p className="text-2xl font-bold">{stats.merchants}</p><p className="text-xs text-gray-500">Merchants</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-500" />
              <div><p className="text-2xl font-bold">{stats.approved}</p><p className="text-xs text-gray-500">Approved</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 flex items-center gap-3">
              <Activity className="w-6 h-6 text-orange-500" />
              <div><p className="text-2xl font-bold">{stats.transactions}</p><p className="text-xs text-gray-500">TXs</p></div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex gap-2">
        <Button variant={tab === "stats" ? "default" : "outline"} onClick={() => setTab("stats")}>Stats</Button>
        <Button variant={tab === "pending" ? "default" : "outline"} onClick={() => setTab("pending")}>Pending ({pending.length})</Button>
        <Button variant={tab === "all" ? "default" : "outline"} onClick={() => setTab("all")}>All Merchants</Button>
      </div>

      {tab === "pending" && (
        <Card>
          <CardHeader><CardTitle>Pending Approvals</CardTitle></CardHeader>
          <CardContent>
            {pending.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No pending merchants</p>
            ) : (
              <div className="space-y-2">
                {pending.map((m) => (
                  <div key={m.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{m.businessName}</p>
                      <p className="text-xs text-gray-500">{m.user?.email || m.user?.walletAddress?.slice(0, 10)}... | {new Date(m.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => approve(m.id, m.businessName)} disabled={m.kybStatus === "APPROVED"}>
                        <CheckCircle className="w-3 h-3 mr-1" />Approve
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => reject(m.id)}>
                        <XCircle className="w-3 h-3 mr-1" />Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {tab === "all" && (
        <Card>
          <CardHeader><CardTitle>All Merchants</CardTitle></CardHeader>
          <CardContent>
            {allMerchants.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No merchants</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-500">
                      <th className="pb-2 font-medium">Business</th>
                      <th className="pb-2 font-medium hidden sm:table-cell">Owner</th>
                      <th className="pb-2 font-medium hidden md:table-cell">Token</th>
                      <th className="pb-2 font-medium">Status</th>
                      <th className="pb-2 font-medium hidden sm:table-cell">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allMerchants.map((m) => (
                      <tr key={m.id} className="border-b last:border-0">
                        <td className="py-2 pr-4">{m.businessName}</td>
                        <td className="py-2 pr-4 hidden sm:table-cell text-gray-500">{m.user?.email || m.user?.walletAddress?.slice(0, 10)}...</td>
                        <td className="py-2 pr-4 hidden md:table-cell text-gray-500 font-mono text-xs">{m.tokenSymbol || "-"}</td>
                        <td className="py-2 pr-4">{statusBadge(m.kybStatus)}</td>
                        <td className="py-2 hidden sm:table-cell text-gray-500">{new Date(m.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
