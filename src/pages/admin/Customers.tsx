import { useState, useMemo } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import PageHeader from "@/components/PageHeader";
import { useApp, formatMoney } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Users, TrendingUp, ShoppingBag, Phone, Mail, ChevronUp, ChevronDown } from "lucide-react";

type SortKey = "name" | "totalOrders" | "totalSpent" | "lastOrderAt";

export default function AdminCustomers() {
  const orders = useApp((s) => s.orders);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("totalSpent");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const customers = useMemo(() => {
    const map: Record<string, { name: string; email: string; phone: string; totalOrders: number; totalSpent: number; lastOrderAt: number | null }> = {};

    for (const order of orders) {
      const email = order.customerEmail.toLowerCase();
      if (!map[email]) {
        map[email] = { name: order.customerName, email, phone: order.customerPhone || "", totalOrders: 0, totalSpent: 0, lastOrderAt: null };
      }
      map[email].totalOrders += 1;
      map[email].totalSpent += order.total;
      if (!map[email].lastOrderAt || order.createdAt > map[email].lastOrderAt) {
        map[email].lastOrderAt = order.createdAt;
      }
    }

    return Object.values(map);
  }, [orders]);

  const filteredCustomers = useMemo(() => {
    let result = customers;

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.includes(q)
      );
    }

    // Sort
    result = [...result].sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;

      switch (sortKey) {
        case "name":
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case "totalOrders":
          aVal = a.totalOrders;
          bVal = b.totalOrders;
          break;
        case "totalSpent":
          aVal = a.totalSpent;
          bVal = b.totalSpent;
          break;
        case "lastOrderAt":
          aVal = a.lastOrderAt || 0;
          bVal = b.lastOrderAt || 0;
          break;
        default:
          aVal = a.totalSpent;
          bVal = b.totalSpent;
      }

      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [customers, search, sortKey, sortDir]);

  const stats = useMemo(() => ({
    total: customers.length,
    totalRevenue: customers.reduce((s, c) => s + c.totalSpent, 0),
    avgSpent: customers.length > 0 ? Math.round(customers.reduce((s, c) => s + c.totalSpent, 0) / customers.length) : 0,
  }), [customers]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ChevronDown className="h-3 w-3 opacity-30" />;
    return sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />;
  };

  return (
    <AdminLayout>
      <main className="container py-6 sm:py-10 space-y-6">
        <PageHeader
          title="Pelanggan"
          subtitle={`${filteredCustomers.length} dari ${stats.total} pelanggan`}
          backTo="/admin"
        />

        {/* Stats - Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div className="surface-card border border-border/60 rounded-2xl p-4 sm:p-5">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span className="text-xs font-mono uppercase tracking-wider">Total Pelanggan</span>
            </div>
            <div className="font-display font-bold text-2xl sm:text-3xl mt-2">{stats.total}</div>
          </div>
          <div className="surface-card border border-border/60 rounded-2xl p-4 sm:p-5">
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs font-mono uppercase tracking-wider">Total Belanja</span>
            </div>
            <div className="font-display font-bold text-2xl sm:text-3xl mt-2">{formatMoney(stats.totalRevenue)}</div>
          </div>
          <div className="surface-card border border-border/60 rounded-2xl p-4 sm:p-5 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <ShoppingBag className="h-4 w-4" />
              <span className="text-xs font-mono uppercase tracking-wider">Rata-rata Belanja</span>
            </div>
            <div className="font-display font-bold text-2xl sm:text-3xl mt-2">{formatMoney(stats.avgSpent)}</div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama, email, atau telepon..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-11 bg-secondary/50"
          />
        </div>

        {/* Table */}
        <div className="surface-card border border-border/60 rounded-2xl overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/40">
                <tr>
                  <th
                    className="p-3 text-left text-xs font-mono uppercase tracking-wider text-muted-foreground cursor-pointer hover:text-foreground"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center gap-1">
                      Pelanggan <SortIcon col="name" />
                    </div>
                  </th>
                  <th
                    className="p-3 text-right text-xs font-mono uppercase tracking-wider text-muted-foreground cursor-pointer hover:text-foreground"
                    onClick={() => handleSort("totalOrders")}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Pesanan <SortIcon col="totalOrders" />
                    </div>
                  </th>
                  <th
                    className="p-3 text-right text-xs font-mono uppercase tracking-wider text-muted-foreground cursor-pointer hover:text-foreground"
                    onClick={() => handleSort("totalSpent")}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Total Belanja <SortIcon col="totalSpent" />
                    </div>
                  </th>
                  <th
                    className="p-3 text-right text-xs font-mono uppercase tracking-wider text-muted-foreground cursor-pointer hover:text-foreground"
                    onClick={() => handleSort("lastOrderAt")}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Terakhir Beli <SortIcon col="lastOrderAt" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredCustomers.map((c, i) => (
                  <tr key={i} className="hover:bg-secondary/30 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary shrink-0">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold truncate">{c.name}</div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{c.email}</span>
                            {c.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{c.phone}</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <Badge variant="secondary">{c.totalOrders} pesanan</Badge>
                    </td>
                    <td className="p-3 text-right font-mono font-semibold">{formatMoney(c.totalSpent)}</td>
                    <td className="p-3 text-right text-muted-foreground text-sm">
                      {c.lastOrderAt ? new Date(c.lastOrderAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-border/60">
            {filteredCustomers.map((c, i) => (
              <div key={i} className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-lg shrink-0">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-base">{c.name}</div>
                    <div className="text-xs text-muted-foreground">{c.email}</div>
                    {c.phone && <div className="text-xs text-muted-foreground">{c.phone}</div>}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">{c.totalOrders} pesanan</Badge>
                  <span className="font-mono font-semibold text-lg">{formatMoney(c.totalSpent)}</span>
                </div>
                {c.lastOrderAt && (
                  <div className="text-xs text-muted-foreground">
                    Terakhir: {new Date(c.lastOrderAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredCustomers.length === 0 && (
            <div className="p-12 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                {search ? "Tidak ada pelanggan yang cocok dengan pencarian" : "Belum ada data pelanggan"}
              </p>
            </div>
          )}
        </div>
      </main>
    </AdminLayout>
  );
}