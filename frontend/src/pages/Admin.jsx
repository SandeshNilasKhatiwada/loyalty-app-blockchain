import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/table";
import { admin as adminApi } from "../services/endpoints";
import { Shield, CheckCircle, XCircle, Users, Store, Activity, UserCheck, UserX, Trash2, RefreshCw } from "lucide-react";

const TABS = [
  { key: "stats", label: "Stats", icon: Activity },
  { key: "merchants", label: "Merchants", icon: Store },
  { key: "users", label: "Users", icon: Users },
];

export default function Admin() {
  const [tab, setTab] = useState("stats");
  const [stats, setStats] = useState(null);
  const [pending, setPending] = useState([]);
  const [allMerchants, setAllMerchants] = useState([]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => { load(); }, []);

  const load = async () => {
    setError("");
    try {
      const [sr, pr, mr, ur] = await Promise.all([
        adminApi.stats().catch(() => null),
        adminApi.pending().catch(() => ({ data: { merchants: [] } })),
        adminApi.merchants().catch(() => ({ data: { merchants: [] } })),
        adminApi.users().catch(() => ({ data: { users: [] } })),
      ]);
      if (sr) setStats(sr.data.stats);
      setPending(pr.data.merchants);
      setAllMerchants(mr.data.merchants);
      setUsers(ur.data.users);
    } catch { setError("Failed to load data"); }
  };

  const approve = async (id, name) => {
    try {
      await adminApi.approve(id, { tokenName: `${name} Token`, tokenSymbol: name.slice(0, 5).toUpperCase() });
      load();
    } catch (e) { setError(e.response?.data?.error || "Approve failed"); }
  };
  const reject = async (id) => { try { await adminApi.reject(id); load(); } catch {} };

  const setAdmin = async (id) => { try { await adminApi.setAdmin(id); load(); } catch {} };
  const blockUser = async (id) => { try { await adminApi.blockUser(id); load(); } catch {} };
  const suspendUser = async (id) => { try { await adminApi.suspendUser(id); load(); } catch {} };
  const activateUser = async (id) => { try { await adminApi.activateUser(id); load(); } catch {} };
  const deleteUser = async (id) => {
    if (!confirm("Delete this user permanently?")) return;
    try { await adminApi.deleteUser(id); load(); } catch {}
  };

  const statusBadge = (status) => {
    const m = { APPROVED: "success", PENDING: "warning", REJECTED: "danger", ACTIVE: "success", SUSPENDED: "warning", BLOCKED: "danger" };
    return <Badge variant={m[status] || "secondary"}>{status}</Badge>;
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
          <Card><CardContent className="pt-4 flex items-center gap-3"><Users className="w-6 h-6 text-blue-500" /><div><p className="text-2xl font-bold">{stats.users}</p><p className="text-xs text-gray-500">Active Users</p></div></CardContent></Card>
          <Card><CardContent className="pt-4 flex items-center gap-3"><Store className="w-6 h-6 text-purple-500" /><div><p className="text-2xl font-bold">{stats.merchants}</p><p className="text-xs text-gray-500">Merchants</p></div></CardContent></Card>
          <Card><CardContent className="pt-4 flex items-center gap-3"><CheckCircle className="w-6 h-6 text-green-500" /><div><p className="text-2xl font-bold">{stats.approved}</p><p className="text-xs text-gray-500">Approved</p></div></CardContent></Card>
          <Card><CardContent className="pt-4 flex items-center gap-3"><Activity className="w-6 h-6 text-orange-500" /><div><p className="text-2xl font-bold">{stats.transactions}</p><p className="text-xs text-gray-500">TXs</p></div></CardContent></Card>
          <Card><CardContent className="pt-4 flex items-center gap-3"><UserX className="w-6 h-6 text-red-500" /><div><p className="text-2xl font-bold">{stats.blockedUsers || 0}</p><p className="text-xs text-gray-500">Blocked/Suspended</p></div></CardContent></Card>
          <Card><CardContent className="pt-4 flex items-center gap-3"><Users className="w-6 h-6 text-gray-500" /><div><p className="text-2xl font-bold">{stats.totalUsers || stats.users}</p><p className="text-xs text-gray-500">Total Users</p></div></CardContent></Card>
        </div>
      )}

      {tab === "merchants" && (
        <div className="space-y-4">
          {pending.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Pending Approval ({pending.length})</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {pending.map((m) => (
                  <div key={m.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div>
                      <p className="font-medium">{m.businessName}</p>
                      <p className="text-xs text-gray-500">{m.user?.email || m.user?.walletAddress?.slice(0, 10)}... {m.ownerName ? `| Owner: ${m.ownerName}` : ""} | {new Date(m.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => approve(m.id, m.businessName)}><CheckCircle className="w-3 h-3 mr-1" />Approve</Button>
                      <Button size="sm" variant="destructive" onClick={() => reject(m.id)}><XCircle className="w-3 h-3 mr-1" />Reject</Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle>All Merchants</CardTitle></CardHeader>
            <CardContent>
              {allMerchants.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No merchants registered</p>
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
        </div>
      )}

      {tab === "users" && (
        <Card>
          <CardHeader><CardTitle>User Management</CardTitle></CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No users</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-500">
                      <th className="pb-2 font-medium">Email</th>
                      <th className="pb-2 font-medium hidden sm:table-cell">Name</th>
                      <th className="pb-2 font-medium">Status</th>
                      <th className="pb-2 font-medium hidden md:table-cell">Role</th>
                      <th className="pb-2 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b last:border-0">
                        <td className="py-2 pr-4 text-xs">{u.email || u.walletAddress?.slice(0, 10)}...</td>
                        <td className="py-2 pr-4 hidden sm:table-cell text-gray-500">{u.name || "-"}</td>
                        <td className="py-2 pr-4">{statusBadge(u.status)}</td>
                        <td className="py-2 pr-4 hidden md:table-cell">
                          {u.isAdmin ? <Badge variant="default">Admin</Badge> : u.isMerchant ? <Badge variant="success">Merchant</Badge> : <Badge variant="secondary">User</Badge>}
                        </td>
                        <td className="py-2">
                          <div className="flex gap-1 flex-wrap">
                            {!u.isAdmin && <Button size="sm" variant="ghost" onClick={() => setAdmin(u.id)} title="Make Admin"><UserCheck className="w-3 h-3" /></Button>}
                            {u.status === "ACTIVE" && <Button size="sm" variant="ghost" onClick={() => suspendUser(u.id)} title="Suspend"><UserX className="w-3 h-3 text-yellow-600" /></Button>}
                            {u.status === "ACTIVE" && <Button size="sm" variant="ghost" onClick={() => blockUser(u.id)} title="Block"><XCircle className="w-3 h-3 text-red-600" /></Button>}
                            {(u.status === "SUSPENDED" || u.status === "BLOCKED") && <Button size="sm" variant="ghost" onClick={() => activateUser(u.id)} title="Activate"><CheckCircle className="w-3 h-3 text-green-600" /></Button>}
                            {!u.isAdmin && <Button size="sm" variant="ghost" onClick={() => deleteUser(u.id)} title="Delete"><Trash2 className="w-3 h-3 text-red-600" /></Button>}
                          </div>
                        </td>
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
