import { Link, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import PageHeader from "@/components/PageHeader";
import { useApp, formatMoney } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { hasProductImage } from "@/lib/product-image";

export default function Cart() {
  const { cart, products, updateCartQty, removeFromCart, placeOrder, user, isStoreOpen } = useApp();
  const nav = useNavigate();

  const lines = cart
    .map((c) => {
      const p = products.find((x) => x.id === c.productId);
      return p ? { ...c, product: p } : null;
    })
    .filter((x): x is NonNullable<typeof x> => !!x);

  const total = lines.reduce((s, l) => s + l.product.price * l.quantity, 0);

  const checkout = () => {
    if (!isStoreOpen) return toast.error("Toko sedang tutup");
    if (!user) return nav("/auth");
    const order = placeOrder();
    if (!order) return toast.error("Pesanan gagal dibuat, periksa stok produk");
    toast.success(`Pesanan dibuat. ID ambil ${order.pickupId}`);
    nav(`/orders/${order.id}`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-6 sm:py-10 pb-[calc(5rem+env(safe-area-inset-bottom))] space-y-6">
        <PageHeader title="Keranjang" backTo="/" />

        {lines.length === 0 ? (
          <div className="surface-card border border-border/60 rounded-2xl p-12 text-center">
            <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground mb-4">Keranjang masih kosong.</p>
            <Link to="/"><Button>Lihat produk</Button></Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[1fr_360px] gap-6">
            <div className="space-y-3">
              {lines.map((l) => (
                <div key={l.productId} className="surface-card border border-border/60 rounded-2xl p-3 sm:p-4">
                  <div className="flex gap-3 sm:items-center">
                    {hasProductImage(l.product) && (
                      <img
                        src={l.product.image}
                        alt={l.product.name}
                        className="h-20 w-20 shrink-0 rounded-xl object-cover"
                        loading="lazy"
                        width={80}
                        height={80}
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="font-display font-semibold leading-tight break-words">{l.product.name}</div>
                          <div className="text-sm text-muted-foreground font-mono">{formatMoney(l.product.price)}</div>
                        </div>
                        <Button size="icon" variant="ghost" className="shrink-0 -mr-2 -mt-1" onClick={() => removeFromCart(l.productId)}>
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3 sm:mt-2 sm:justify-start sm:gap-4">
                        <div className="flex items-center gap-1 bg-secondary rounded-full p-0.5">
                          <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full" onClick={() => updateCartQty(l.productId, l.quantity - 1)}>
                            <Minus className="h-3.5 w-3.5" />
                          </Button>
                          <span className="w-7 text-center text-sm font-bold font-mono">{l.quantity}</span>
                          <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full" disabled={l.quantity >= l.product.stock} onClick={() => updateCartQty(l.productId, l.quantity + 1)}>
                            <Plus className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        <div className="font-mono font-bold text-right sm:ml-auto">{formatMoney(l.product.price * l.quantity)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <aside className="surface-card border border-border/60 rounded-2xl p-6 h-fit sticky top-24 space-y-4">
              <h2 className="font-display font-bold text-lg">Ringkasan pesanan</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground"><span>Item</span><span className="font-mono">{lines.reduce((s, l) => s + l.quantity, 0)}</span></div>
                <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span className="font-mono">{formatMoney(total)}</span></div>
                <div className="flex justify-between text-muted-foreground"><span>Biaya ambil</span><span className="font-mono text-primary">Gratis</span></div>
              </div>
              <div className="border-t border-border pt-4 flex justify-between items-baseline">
                <span className="text-sm uppercase tracking-wider text-muted-foreground font-mono">Total</span>
                <span className="font-display font-bold text-2xl">{formatMoney(total)}</span>
              </div>
              <Button size="lg" className="w-full font-bold" onClick={checkout}>
                Buat pesanan
              </Button>
              {!isStoreOpen && (
                <p className="text-xs text-destructive text-center">
                  Toko sedang tutup, jadi checkout dinonaktifkan.
                </p>
              )}
              <p className="text-xs text-muted-foreground text-center">
                Bayar di toko saat mengambil pesanan. Kami akan memberi tahu saat pesanan siap.
              </p>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
