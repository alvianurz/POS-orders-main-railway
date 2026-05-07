import { useApp } from "@/lib/store";
import type { Product } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Plus, Minus } from "lucide-react";
import { formatMoney } from "@/lib/store";

export default function ProductCard({ product }: { product: Product }) {
  const { cart, addToCart, updateCartQty, isStoreOpen } = useApp();
  const inCart = cart.find((c) => c.productId === product.id);
  const out = product.stock === 0;
  const low = product.stock > 0 && product.stock <= 5;

  return (
    <div className="group surface-card rounded-2xl overflow-hidden border border-border/60 hover:border-primary/40 transition-all hover:-translate-y-0.5">
      <div className="aspect-square bg-secondary/40 overflow-hidden relative">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          width={512}
          height={512}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {out && (
          <div className="absolute inset-0 grid place-items-center bg-background/70 backdrop-blur-sm">
            <span className="px-3 py-1 rounded-full bg-destructive text-destructive-foreground text-xs font-bold uppercase tracking-wider">
              Habis
            </span>
          </div>
        )}
        {low && !out && (
          <span className="absolute top-3 left-3 px-2 py-1 rounded-full bg-warning/20 text-warning text-[10px] font-bold uppercase tracking-wider backdrop-blur" style={{ color: 'hsl(var(--warning))' }}>
            Sisa {product.stock}
          </span>
        )}
        <span className="absolute top-3 right-3 px-2 py-1 rounded-full bg-background/70 backdrop-blur text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          {product.category}
        </span>
      </div>
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-display font-semibold text-base leading-tight">{product.name}</h3>
          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{product.description}</p>
        </div>
        <div className="flex items-center justify-between">
          <div className="font-mono font-bold text-lg">{formatMoney(product.price)}</div>
          {inCart ? (
            <div className="flex items-center gap-1 bg-secondary rounded-full p-0.5">
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 rounded-full"
                onClick={() => updateCartQty(product.id, inCart.quantity - 1)}
              >
                <Minus className="h-3.5 w-3.5" />
              </Button>
              <span className="text-sm font-bold font-mono w-6 text-center">{inCart.quantity}</span>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 rounded-full"
                disabled={inCart.quantity >= product.stock}
                onClick={() => updateCartQty(product.id, inCart.quantity + 1)}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
            disabled={out || !isStoreOpen}
            onClick={() => addToCart(product.id)}
            className="rounded-full font-semibold px-3 sm:px-4"
            aria-label={`Tambah ${product.name} ke keranjang`}
          >
              <Plus className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Tambah</span>
            </Button>
          )}
        </div>
        {!isStoreOpen && (
          <p className="text-xs text-destructive font-medium">Toko sedang tutup</p>
        )}
      </div>
    </div>
  );
}
