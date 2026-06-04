import { useMemo, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import PageHeader from "@/components/PageHeader";
import { useApp, formatMoney } from "@/lib/store";
import { cn } from "@/lib/utils";
import StatusBadge from "@/components/StatusBadge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, ChevronRight, CheckCircle2, Circle } from "lucide-react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import type { Order, OrderStatus } from "@/lib/types";
import { toast } from "sonner";

const statuses: OrderStatus[] = ["Pending", "Preparing", "Ready", "Completed"];
const statusLabels: Record<OrderStatus | "All", string> = {
  All: "Semua",
  Pending: "Menunggu",
  Preparing: "Diproses",
  Ready: "Siap",
  Completed: "Selesai",
};

export default function AdminOrders() {
  const { orders, setOrderStatus, markPaid, updateOrderItemChecked } = useApp();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"All" | OrderStatus>("All");
  const [open, setOpen] = useState<Order | null>(null);

  const filtered = useMemo(
    () =>
      orders.filter((o) => {
        if (filter !== "All" && o.status !== filter) return false;
        if (!q) return true;
        const s = q.toLowerCase();
        return (
          o.pickupId.toLowerCase().includes(s) ||
          o.customerName.toLowerCase().includes(s) ||
          o.customerPhone.toLowerCase().includes(s)
        );
      }),
    [orders, q, filter]
  );

  const changeStatus = async (order: Order, status: OrderStatus) => {
    try {
      await setOrderStatus(order.id, status);
      setOpen({ ...order, status });
      toast.success(`Status menjadi ${statusLabels[status]}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Status gagal diperbarui");
    }
  };

  const completePayment = async (order: Order) => {
    try {
      await markPaid(order.id);
      setOpen({ ...order, paid: true, status: "Completed" });
      toast.success("Pesanan dibayar dan selesai");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Pesanan gagal diperbarui");
    }
  };

  const toggleItemChecked = async (order: Order, productId: string, checked: boolean) => {
    try {
      await updateOrderItemChecked(order.id, productId, checked);
      setOpen({
        ...order,
        items: order.items.map((i) => (i.productId === productId ? { ...i, checked } : i)),
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal memperbarui item");
    }
  };

  const canMarkReady = (order: Order) => {
    return order.status === "Preparing" && order.items.every((i) => i.checked);
  };

  return (
    <AdminLayout>
      <main className="container py-6 sm:py-10 space-y-6">
        <PageHeader
          title="Pesanan aktif"
          subtitle={`${orders.length} total · ${orders.filter(o => o.status === "Pending").length} menunggu`}
          backTo="/admin"
        />
        <div className="flex flex-col md:flex-row gap-3 md:items-center">
          <div className="relative md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Cari ID ambil, nama, atau telepon..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-10 h-11 bg-secondary/50" />
          </div>
          <div className="flex gap-1 bg-secondary/40 p-1 rounded-full">
            {(["All", ...statuses] as const).map((s) => (
              <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${filter === s ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                {statusLabels[s]}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="surface-card border border-border/60 rounded-2xl p-12 text-center text-muted-foreground">
            Tidak ada pesanan yang cocok.
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map((o) => (
              <button key={o.id} onClick={() => setOpen(o)} className="text-left surface-card border border-border/60 rounded-2xl p-4 hover:border-primary/40 transition-all hover:-translate-y-0.5 group">
                <div className="flex flex-wrap items-center gap-4 justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Ambil</div>
                      <div className="font-display font-bold text-lg tracking-wider">{o.pickupId}</div>
                    </div>
                    <div className="hidden sm:block h-10 w-px bg-border" />
                    <div>
                      <div className="font-semibold">{o.customerName}</div>
                      <div className="text-xs text-muted-foreground font-mono">{o.customerPhone} · {new Date(o.createdAt).toLocaleTimeString("id-ID")}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-mono font-bold text-lg">{formatMoney(o.total)}</div>
                      <div className="text-xs text-muted-foreground">{o.items.length} item</div>
                    </div>
                    <StatusBadge status={o.status} />
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        <Sheet open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
          <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
            {open && (
              <>
                <SheetHeader>
                  <SheetTitle className="font-display tracking-wider text-2xl">{open.pickupId}</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <StatusBadge status={open.status} />
                    <span className="text-xs text-muted-foreground font-mono">{new Date(open.createdAt).toLocaleString("id-ID")}</span>
                  </div>

                  <div className="surface-card border border-border/60 rounded-xl p-4 space-y-1 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Pelanggan</span><span className="font-semibold">{open.customerName}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Telepon</span><span className="font-mono">{open.customerPhone}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="font-mono text-xs">{open.customerEmail}</span></div>
                  </div>

                  <div>
                    <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">Item</div>
                    <div className="space-y-2">
                      {open.items.map((i) => (
                        <div key={i.productId} className="flex items-center justify-between text-sm py-2 border-b border-border/60">
                          <div className="flex items-center gap-3">
                            {open.status === "Preparing" ? (
                              <Checkbox
                                id={`item-${i.productId}`}
                                checked={!!i.checked}
                                onCheckedChange={(checked) => toggleItemChecked(open, i.productId, !!checked)}
                                className="shrink-0"
                              />
                            ) : i.checked ? (
                              <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                            ) : (
                              <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
                            )}
                            <span className={i.checked ? "line-through text-muted-foreground" : ""}>
                              {i.quantity}× {i.name}
                            </span>
                          </div>
                          <span className="font-mono">{formatMoney(i.price * i.quantity)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between font-bold pt-2">
                        <span>Total</span>
                        <span className="font-mono text-lg">{formatMoney(open.total)}</span>
                      </div>
                    </div>
                  </div>

                  {open.status === "Preparing" && (
                    <div className="bg-muted/30 rounded-xl p-4">
                      <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">
                        Progress
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>
                          {open.items.filter((i) => i.checked).length} / {open.items.length} item dicek
                        </span>
                        <span className={canMarkReady(open) ? "text-green-600 font-semibold" : "text-muted-foreground"}>
                          {canMarkReady(open) ? "Siap ditandai" : "Centang semua item"}
                        </span>
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">Ubah status</div>
                    <div className="grid grid-cols-2 gap-2">
                      {statuses.map((s) => {
                        const isDisabled = s === "Ready" && !canMarkReady(open) && open.status === "Preparing";
                        const isReadyStatus = s === "Ready";
                        return (
                          <Button
                            key={s}
                            variant={open.status === s ? "default" : "secondary"}
                            onClick={() => !isDisabled && void changeStatus(open, s)}
                            className={cn("font-bold", isDisabled && "opacity-50 cursor-not-allowed")}
                            disabled={isDisabled}
                          >
                            {statusLabels[s]}
                          </Button>
                        );
                      })}
                    </div>
                    {open.status === "Preparing" && !canMarkReady(open) && (
                      <p className="text-xs text-muted-foreground mt-2 text-center">
                        Centang semua item untuk bisa menandai "Siap"
                      </p>
                    )}
                  </div>

                  {!open.paid && (
                    <Button size="lg" className="w-full font-bold" onClick={() => void completePayment(open)}>
                      Tandai dibayar & selesai
                    </Button>
                  )}
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      </main>
    </AdminLayout>
  );
}
