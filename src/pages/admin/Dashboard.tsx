import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "@/components/AdminLayout";
import PageHeader from "@/components/PageHeader";
import { AnalyticsFilters } from "@/components/AnalyticsFilters";
import type { AnalyticsFilters as FilterType } from "@/components/AnalyticsFilters";
import StatusBadge from "@/components/StatusBadge";
import { useApp, formatMoney } from "@/lib/store";
import { hasProductImage } from "@/lib/product-image";
import {
  AlertTriangle,
  ArrowUpRight,
  Boxes,
  Package,
  Receipt,
  ShoppingBag,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { subDays, startOfDay, endOfDay } from "date-fns";

const PIE_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(var(--warning))",
  "hsl(var(--success))",
  "hsl(var(--destructive))",
  "hsl(var(--muted-foreground))",
];

const statusLabels = {
  Pending: "Menunggu",
  Preparing: "Diproses",
  Ready: "Siap diambil",
  Completed: "Selesai",
};

const chartTooltipStyle = {
  background: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  fontSize: 12,
};

// Default 7 days filter
const defaultFilters: FilterType = {
  dateRange: {
    start: startOfDay(subDays(new Date(), 6)),
    end: endOfDay(new Date()),
  },
  preset: "7days",
  categories: [],
  products: [],
};

export default function AdminDashboard() {
  const { orders, products, categories } = useApp();
  const [filters, setFilters] = useState<FilterType>(defaultFilters);

  // Filter orders based on analytics filters
  const filteredOrders = useMemo(() => {
    const start = filters.dateRange.start.getTime();
    const end = filters.dateRange.end.getTime();

    let result = orders.filter((o) => o.createdAt >= start && o.createdAt <= end);

    // Filter by category
    if (filters.categories.length > 0) {
      result = result.filter((order) => {
        return order.items.some((item) => {
          const product = products.find((p) => p.id === item.productId);
          return product && filters.categories.includes(product.category);
        });
      });
    }

    // Filter by product
    if (filters.products.length > 0) {
      result = result.filter((order) => {
        return order.items.some((item) => filters.products.includes(item.productId));
      });
    }

    return result;
  }, [orders, filters, products]);

  const stats = useMemo(() => {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const week = new Date(today);
    week.setDate(week.getDate() - 6);
    const month = new Date(today);
    month.setDate(month.getDate() - 29);

    const todayOrders = filteredOrders.filter((o) => o.createdAt >= today.getTime());
    const yesterdayOrders = filteredOrders.filter((o) => o.createdAt >= yesterday.getTime() && o.createdAt < today.getTime());
    const weekOrders = filteredOrders.filter((o) => o.createdAt >= week.getTime());
    const monthOrders = filteredOrders.filter((o) => o.createdAt >= month.getTime());
    const paidOrders = filteredOrders.filter((o) => o.paid);
    const openOrders = filteredOrders.filter((o) => o.status !== "Completed");

    const revenue = filteredOrders.reduce((s, o) => s + o.total, 0);
    const revenueToday = todayOrders.reduce((s, o) => s + o.total, 0);
    const revenueYesterday = yesterdayOrders.reduce((s, o) => s + o.total, 0);
    const revenueWeek = weekOrders.reduce((s, o) => s + o.total, 0);
    const revenueMonth = monthOrders.reduce((s, o) => s + o.total, 0);
    const unitsSold = filteredOrders.reduce((s, o) => s + o.items.reduce((n, i) => n + i.quantity, 0), 0);
    const avgOrder = filteredOrders.length ? revenue / filteredOrders.length : 0;
    const avgItems = filteredOrders.length ? unitsSold / filteredOrders.length : 0;
    const stockValue = products.reduce((s, p) => s + p.price * p.stock, 0);
    const completedRate = filteredOrders.length ? (filteredOrders.filter((o) => o.status === "Completed").length / filteredOrders.length) * 100 : 0;
    const paymentRate = filteredOrders.length ? (paidOrders.length / filteredOrders.length) * 100 : 0;
    const revenueChange = revenueYesterday ? ((revenueToday - revenueYesterday) / revenueYesterday) * 100 : revenueToday ? 100 : 0;

    const productMap: Record<string, { name: string; qty: number; revenue: number }> = {};
    const customerMap: Record<string, { name: string; email: string; orders: number; revenue: number }> = {};
    const categoryMap: Record<string, number> = {};
    const statusMap: Record<keyof typeof statusLabels, number> = {
      Pending: 0,
      Preparing: 0,
      Ready: 0,
      Completed: 0,
    };

    filteredOrders.forEach((order) => {
      statusMap[order.status] += 1;
      const customerKey = order.customerEmail;
      customerMap[customerKey] = customerMap[customerKey] || {
        name: order.customerName,
        email: order.customerEmail,
        orders: 0,
        revenue: 0,
      };
      customerMap[customerKey].orders += 1;
      customerMap[customerKey].revenue += order.total;

      order.items.forEach((item) => {
        productMap[item.productId] = productMap[item.productId] || { name: item.name, qty: 0, revenue: 0 };
        productMap[item.productId].qty += item.quantity;
        productMap[item.productId].revenue += item.price * item.quantity;
        const product = products.find((p) => p.id === item.productId);
        const category = product?.category ?? "Lainnya";
        categoryMap[category] = (categoryMap[category] || 0) + item.price * item.quantity;
      });
    });

    // Daily chart based on filter range
    const daysCount = Math.min(7, Math.ceil((filters.dateRange.end.getTime() - filters.dateRange.start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    const daily = [];
    for (let i = daysCount - 1; i >= 0; i--) {
      const day = new Date(filters.dateRange.end);
      day.setDate(day.getDate() - i);
      const next = new Date(day);
      next.setDate(next.getDate() + 1);
      const dayOrders = filteredOrders.filter((o) => o.createdAt >= day.getTime() && o.createdAt < next.getTime());
      daily.push({
        hari: day.toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" }),
        pendapatan: dayOrders.reduce((s, o) => s + o.total, 0),
        pesanan: dayOrders.length,
      });
    }

    const hourly = Array.from({ length: 12 }, (_, index) => {
      const start = index * 2;
      const end = start + 1;
      return {
        jam: `${String(start).padStart(2, "0")}-${String(end).padStart(2, "0")}`,
        pesanan: filteredOrders.filter((o) => {
          const hour = new Date(o.createdAt).getHours();
          return hour >= start && hour <= end;
        }).length,
      };
    });

    return {
      avgItems,
      avgOrder,
      categoryData: Object.entries(categoryMap).map(([name, value]) => ({ name, value })),
      completedRate,
      daily,
      hourly,
      lowStock: products.filter((p) => p.stock <= 5),
      monthOrders: monthOrders.length,
      openOrders,
      paymentRate,
      paidOrders: paidOrders.length,
      recentOrders: [...filteredOrders].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5),
      revenue,
      revenueChange,
      revenueMonth,
      revenueToday,
      revenueWeek,
      statusData: Object.entries(statusMap).map(([key, value]) => ({
        name: statusLabels[key as keyof typeof statusLabels],
        value,
      })),
      stockValue,
      topCustomers: Object.values(customerMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5),
      topProducts: Object.values(productMap).sort((a, b) => b.revenue - a.revenue).slice(0, 6),
      unitsSold,
    };
  }, [filteredOrders, products, filters]);

  const hasOrders = filteredOrders.length > 0;

  return (
    <AdminLayout>
      <main className="container py-6 sm:py-10 space-y-6 sm:space-y-8">
        <PageHeader
          title="Analitik toko"
          subtitle={`${filteredOrders.length} pesanan · ${formatMoney(stats.revenue)} pendapatan dalam periode ini`}
          backTo="/"
        />

        {/* Analytics Filters */}
        <AnalyticsFilters
          categories={categories}
          products={products}
          onFiltersChange={setFilters}
          initialFilters={defaultFilters}
        />

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
          <Stat label="Pendapatan hari ini" value={formatMoney(stats.revenueToday)} helper={`${stats.revenueChange.toFixed(0)}% vs kemarin`} icon={Wallet} accent />
          <Stat label="Pendapatan 7 hari" value={formatMoney(stats.revenueWeek)} helper={`${stats.monthOrders} pesanan dalam 30 hari`} icon={TrendingUp} />
          <Stat label="Rata-rata pesanan" value={formatMoney(stats.avgOrder)} helper={`${stats.avgItems.toFixed(1)} item per pesanan`} icon={ArrowUpRight} />
          <Stat label="Nilai stok" value={formatMoney(stats.stockValue)} helper={`${products.length} produk aktif`} icon={Boxes} />
          <Stat label="Total pendapatan" value={formatMoney(stats.revenue)} helper={`${stats.unitsSold} item terjual`} icon={Receipt} />
          <Stat label="Pesanan terbuka" value={String(stats.openOrders.length)} helper={`${stats.completedRate.toFixed(0)}% selesai`} icon={ShoppingBag} />
          <Stat label="Pembayaran" value={`${stats.paymentRate.toFixed(0)}%`} helper={`${stats.paidOrders} pesanan sudah dibayar`} icon={Wallet} />
          <Stat label="Stok rendah" value={String(stats.lowStock.length)} helper="Perlu ditinjau segera" icon={AlertTriangle} />
        </div>

        <div className="grid xl:grid-cols-3 gap-4 sm:gap-6">
          <Panel className="xl:col-span-2">
            <div className="flex items-center justify-between mb-4 gap-2">
              <h2 className="font-display font-bold text-base sm:text-lg">Pendapatan & pesanan</h2>
              <span className="hidden sm:inline text-xs font-mono text-muted-foreground">{formatMoney(stats.revenueWeek)}</span>
            </div>
            <div className="h-64">
              {hasOrders ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.daily} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="hari" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => `${Number(v) / 1000}rb`} />
                    <Tooltip contentStyle={chartTooltipStyle} formatter={(value, name) => name === "pendapatan" ? formatMoney(Number(value)) : value} />
                    <Area type="monotone" dataKey="pendapatan" name="pendapatan" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#revenue)" />
                    <Area type="monotone" dataKey="pesanan" name="pesanan" stroke="hsl(var(--accent))" strokeWidth={2} fill="transparent" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart />
              )}
            </div>
          </Panel>

          <Panel>
            <h2 className="font-display font-bold text-base sm:text-lg mb-4">Status pesanan</h2>
            <div className="h-64">
              {hasOrders ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={stats.statusData.filter((s) => s.value > 0)} dataKey="value" nameKey="name" innerRadius={48} outerRadius={78} paddingAngle={3}>
                      {stats.statusData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart />
              )}
            </div>
          </Panel>

          <Panel className="xl:col-span-2">
            <h2 className="font-display font-bold text-base sm:text-lg mb-4">Pendapatan per kategori</h2>
            <div className="h-64">
              {stats.categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.categoryData} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => `${Number(v) / 1000}rb`} />
                    <Tooltip contentStyle={chartTooltipStyle} formatter={(value) => formatMoney(Number(value))} />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart />
              )}
            </div>
          </Panel>

          <Panel>
            <h2 className="font-display font-bold text-base sm:text-lg mb-4">Jam ramai</h2>
            <div className="h-64">
              {hasOrders ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.hourly} margin={{ top: 5, right: 8, left: -24, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="jam" stroke="hsl(var(--muted-foreground))" fontSize={10} interval={1} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Bar dataKey="pesanan" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart />
              )}
            </div>
          </Panel>
        </div>

        <div className="grid xl:grid-cols-3 gap-4 sm:gap-6">
          <Panel>
            <h2 className="font-display font-bold text-base sm:text-lg mb-4">Produk terlaris</h2>
            <RankedList
              empty="Belum ada penjualan."
              rows={stats.topProducts.map((p) => ({ label: p.name, meta: `${p.qty} terjual · ${formatMoney(p.revenue)}`, value: p.revenue }))}
            />
          </Panel>

          <Panel>
            <h2 className="font-display font-bold text-base sm:text-lg mb-4">Pelanggan teratas</h2>
            <RankedList
              empty="Belum ada pelanggan."
              rows={stats.topCustomers.map((c) => ({ label: c.name, meta: `${c.orders} pesanan · ${formatMoney(c.revenue)}`, value: c.revenue }))}
            />
          </Panel>

          <Panel>
            <div className="flex items-center justify-between mb-4 gap-2">
              <h2 className="font-display font-bold text-base sm:text-lg truncate">Stok rendah</h2>
              <Link to="/admin/products" className="text-xs text-primary hover:underline shrink-0">Kelola</Link>
            </div>
            {stats.lowStock.length === 0 ? (
              <p className="text-sm text-muted-foreground">Semua stok masih aman.</p>
            ) : (
              <div className="space-y-2">
                {stats.lowStock.slice(0, 6).map((p) => (
                  <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg bg-secondary/40">
                    {hasProductImage(p) && (
                      <img src={p.image} alt="" className="h-10 w-10 shrink-0 rounded-md object-cover" loading="lazy" width={40} height={40} />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate text-sm">{p.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{p.category}</div>
                    </div>
                    <div className={`flex items-center gap-1 text-sm font-bold font-mono shrink-0 ${p.stock === 0 ? "text-destructive" : "text-[hsl(var(--warning))]"}`}>
                      <AlertTriangle className="h-3.5 w-3.5" />
                      {p.stock}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>

        <Panel>
          <div className="flex items-center justify-between mb-4 gap-2">
            <h2 className="font-display font-bold text-base sm:text-lg">Pesanan terbaru</h2>
            <Link to="/admin/orders" className="text-xs text-primary hover:underline shrink-0">Lihat semua</Link>
          </div>
          {stats.recentOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada pesanan.</p>
          ) : (
            <div className="space-y-2">
              {stats.recentOrders.map((order) => (
                <Link key={order.id} to="/admin/orders" className="flex items-center justify-between gap-3 rounded-xl bg-secondary/35 p-3 hover:bg-secondary/60">
                  <div className="min-w-0">
                    <div className="font-display font-bold tracking-wider">{order.pickupId}</div>
                    <div className="text-xs text-muted-foreground truncate">{order.customerName} · {new Date(order.createdAt).toLocaleString("id-ID")}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono font-bold">{formatMoney(order.total)}</div>
                    <StatusBadge status={order.status} className="mt-1" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Panel>
      </main>
    </AdminLayout>
  );
}

function Stat({ label, value, helper, icon: Icon, accent }: { label: string; value: string; helper: string; icon: LucideIcon; accent?: boolean }) {
  return (
    <div className={`surface-card border border-border/60 rounded-2xl p-4 sm:p-5 ${accent ? "ring-1 ring-primary/40" : ""}`}>
      <div className="flex items-center justify-between text-muted-foreground gap-2">
        <span className="text-[10px] sm:text-xs uppercase tracking-wider font-mono truncate">{label}</span>
        <Icon className={`h-4 w-4 shrink-0 ${accent ? "text-primary" : ""}`} />
      </div>
      <div className="font-display font-bold text-xl sm:text-2xl mt-2 tracking-tight truncate">{value}</div>
      <div className="text-xs text-muted-foreground mt-1 truncate">{helper}</div>
    </div>
  );
}

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`surface-card border border-border/60 rounded-2xl p-4 sm:p-6 ${className}`}>
      {children}
    </div>
  );
}

function RankedList({ rows, empty }: { rows: { label: string; meta: string; value: number }[]; empty: string }) {
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">{empty}</p>;
  const max = Math.max(...rows.map((row) => row.value), 1);
  return (
    <div className="space-y-3">
      {rows.map((row, index) => (
        <div key={row.label} className="space-y-1.5">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 shrink-0 rounded-lg bg-secondary grid place-items-center font-mono font-bold text-sm">{index + 1}</div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold truncate">{row.label}</div>
              <div className="text-xs text-muted-foreground truncate">{row.meta}</div>
            </div>
          </div>
          <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
            <div className="h-full bg-gradient-primary" style={{ width: `${(row.value / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="h-full grid place-items-center text-center text-muted-foreground">
      <div>
        <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Data akan muncul setelah ada pesanan.</p>
      </div>
    </div>
  );
}