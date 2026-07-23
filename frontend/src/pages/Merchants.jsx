import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { merchants as merchantsApi } from "../services/endpoints";
import { Store, Search } from "lucide-react";
import { Input } from "../components/ui/input";

export default function Merchants() {
  const [list, setList] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    merchantsApi.public().then(r => setList(r.data.merchants || [])).catch(() => {});
  }, []);

  const filtered = list.filter(m =>
    m.businessName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Store className="w-6 h-6" />Find Merchants</h1>
        <p className="text-sm text-gray-500">Visit any of these merchants to earn or redeem points</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search merchants..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-400">
            <Store className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No approved merchants yet</p>
            <p className="text-xs mt-1">Check back later!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(m => (
            <Card key={m.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-3">
                  <Store className="w-6 h-6" />
                </div>
                <h3 className="font-semibold">{m.businessName}</h3>
                {m.tokenSymbol && (
                  <p className="text-xs text-gray-400 mt-1">Token: {m.tokenSymbol}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
