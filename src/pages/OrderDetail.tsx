import { useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { toPng } from "html-to-image";
import Header from "@/components/Header";
import { useApp, formatMoney } from "@/lib/store";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Download, ArrowLeft, Check, Clock, Package, Bell } from "lucide-react";
import { toast } from "sonner";

export default function OrderDetail() {
  const { id } = useParams();
  const order = useApp((s) => s.orders.find((o) => o.id === id));
  const storeName = useApp((s) => s.storeName);
  const ref = useRef<HTMLDivElement>(null);
  const orderDate = new Date(order?.createdAt ?? Date.now());

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="container py-20 text-center">
          <p className="text-muted-foreground">Pesanan tidak ditemukan.</p>
          <Link to="/orders"><Button variant="link">Kembali ke pesanan saya</Button></Link>
        </main>
      </div>
    );
  }

  const download = async () => {
    if (!ref.current) return;
    try {
      const width = 320;
      const height = Math.ceil(ref.current.scrollHeight);
      const dataUrl = await toPng(ref.current, {
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        width,
        height,
        style: {
          width: `${width}px`,
          height: `${height}px`,
          margin: "0",
          boxSizing: "border-box",
        },
      });
      const link = document.createElement("a");
      link.download = `${storeName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${order.pickupId}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("Struk berhasil diunduh");
    } catch {
      toast.error("Struk gagal dibuat");
    }
  };

  const steps: { label: string; icon: any; done: boolean }[] = [
    { label: "Dibuat", icon: Check, done: true },
    { label: "Diproses", icon: Package, done: ["Preparing", "Ready", "Completed"].includes(order.status) },
    { label: "Siap", icon: Bell, done: ["Ready", "Completed"].includes(order.status) },
    { label: "Diambil", icon: Check, done: order.status === "Completed" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-10 max-w-3xl">
        <Link to="/orders" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Kembali ke pesanan
        </Link>

        <div className="surface-card border border-border/60 rounded-3xl p-6 md:p-8 space-y-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground font-mono">ID ambil</div>
              <div className="text-4xl font-display font-bold tracking-wider mt-1">{order.pickupId}</div>
              <div className="text-sm text-muted-foreground mt-1">Tunjukkan kode ini saat mengambil pesanan</div>
            </div>
            <StatusBadge status={order.status} />
          </div>

          {/* Progress */}
          <div className="grid grid-cols-4 gap-2">
            {steps.map((s, i) => (
              <div key={i} className="flex flex-col items-center gap-2 text-center">
                <div className={`h-10 w-10 rounded-full grid place-items-center transition-colors ${s.done ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                  <s.icon className="h-5 w-5" />
                </div>
                <span className={`text-xs font-semibold ${s.done ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</span>
              </div>
            ))}
          </div>

          {/* Receipt block (used for image download) */}
          <div ref={ref} className="bg-white text-zinc-900 rounded-2xl p-4 font-mono text-sm w-[320px] min-w-[320px] max-w-[320px] mx-auto box-border overflow-hidden">
            <div className="text-center border-b border-dashed border-zinc-300 pb-4 mb-4">
              <div className="font-bold text-lg leading-tight break-words" style={{ fontFamily: "Space Grotesk, sans-serif" }}>{storeName}</div>
              <div className="text-xs text-zinc-500">Struk pesanan</div>
            </div>
            <div className="grid grid-cols-[92px_minmax(0,1fr)] gap-x-3 gap-y-1 text-xs mb-4">
              <span className="text-zinc-500">ID ambil</span><span className="text-right font-bold break-words">{order.pickupId}</span>
              <span className="text-zinc-500">Tanggal pesan</span><span className="text-right break-words">{orderDate.toLocaleDateString("id-ID")}</span>
              <span className="text-zinc-500">Jam pesan</span><span className="text-right break-words">{orderDate.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</span>
              <span className="text-zinc-500">Pelanggan</span><span className="text-right break-words">{order.customerName}</span>
              <span className="text-zinc-500">Telepon</span><span className="text-right break-words">{order.customerPhone}</span>
            </div>
            <div className="border-t border-dashed border-zinc-300 pt-3 space-y-1.5">
              {order.items.map((i) => (
                <div key={i.productId} className="grid grid-cols-[1fr_auto] gap-3 items-start">
                  <span className="min-w-0 break-words">{i.quantity}× {i.name}</span>
                  <span className="shrink-0">{formatMoney(i.price * i.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-dashed border-zinc-300 mt-3 pt-3 flex justify-between font-bold text-base">
              <span>Total</span>
              <span>{formatMoney(order.total)}</span>
            </div>
            <div className="text-center text-xs text-zinc-500 mt-4 pt-3 border-t border-dashed border-zinc-300 break-words">
              Bayar di toko saat pesanan diambil. Terima kasih.
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={download} className="font-bold">
              <Download className="h-4 w-4 mr-2" /> Unduh struk
            </Button>
            {order.status !== "Ready" && order.status !== "Completed" && (
              <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" /> Kami akan memberi tahu saat pesanan siap
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
