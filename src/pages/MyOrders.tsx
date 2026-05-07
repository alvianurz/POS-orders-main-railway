import { Link } from "react-router-dom";
import Header from "@/components/Header";
import PageHeader from "@/components/PageHeader";
import { useApp, formatMoney } from "@/lib/store";
import StatusBadge from "@/components/StatusBadge";
import { Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MyOrders() {
  const { orders, user } = useApp();
  const mine = orders.filter((o) => o.customerEmail === user?.email);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-6 sm:py-10 space-y-6">
        <PageHeader title="Pesanan saya" backTo="/" />

        {mine.length === 0 ? (
          <div className="surface-card border border-border/60 rounded-2xl p-12 text-center">
            <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground mb-4">Belum ada pesanan.</p>
            <Link to="/"><Button>Mulai belanja</Button></Link>
          </div>
        ) : (
          <div className="space-y-3">
            {mine.map((o) => (
              <Link key={o.id} to={`/orders/${o.id}`} className="block surface-card border border-border/60 rounded-2xl p-5 hover:border-primary/40 transition-colors">
                <div className="flex flex-wrap items-start gap-4 justify-between">
                  <div>
                    <div className="font-mono text-xs text-muted-foreground uppercase tracking-wider">ID ambil</div>
                    <div className="font-display font-bold text-xl tracking-wider">{o.pickupId}</div>
                    <div className="text-xs text-muted-foreground mt-1">{new Date(o.createdAt).toLocaleString()}</div>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={o.status} />
                    <div className="font-mono font-bold text-lg mt-2">{formatMoney(o.total)}</div>
                  </div>
                </div>
                <div className="mt-3 text-sm text-muted-foreground line-clamp-1">
                  {o.items.map((i) => `${i.quantity}× ${i.name}`).join(" · ")}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
