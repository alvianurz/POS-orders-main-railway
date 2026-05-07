import { useApp } from "@/lib/store";
import type { Product } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Plus, Minus } from "lucide-react";
import { formatMoney } from "@/lib/store";
import { hasProductImage } from "@/lib/product-image";

export default function ProductCard({ product }: { product: Product }) {
  const { cart, addToCart, updateCartQty, isStoreOpen } = useApp();
  const inCart = cart.find((c) => c.productId === product.id);
  const out = product.stock === 0;
  const low = product.stock > 0 && product.stock <= 5;
  const hasImage = hasProductImage(product);

  return (
    <div className={`group surface-card overflow-hidden border border-border/60 hover:border-primary/40 transition-all hover:-translate-y-0.5 ${hasImage ? "rounded-2xl" : "rounded-xl"}`}>
      {hasImage ? (
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
          <span className="absolute top-2 right-2 max-w-[calc(100%-1rem)] truncate rounded-full bg-background/70 px-2 py-1 text-[9px] font-mono uppercase leading-none tracking-[0.12em] backdrop-blur text-muted-foreground sm:top-3 sm:right-3 sm:text-[10px] sm:tracking-wider">
            {product.category}
          </span>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2 border-b border-border/60 bg-secondary/25 px-3 py-2">
          <span className="max-w-[70%] truncate rounded-full bg-secondary px-2 py-1 text-[9px] font-mono uppercase leading-none tracking-[0.12em] text-muted-foreground sm:text-[10px] sm:tracking-wider">
            {product.category}
          </span>
          <div className="flex items-center gap-1">
            {low && !out && (
              <span className="rounded-full bg-warning/20 px-2 py-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'hsl(var(--warning))' }}>
                Sisa {product.stock}
              </span>
            )}
            {out && (
              <span className="rounded-full bg-destructive px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-destructive-foreground">
                Habis
              </span>
            )}
          </div>
        </div>
      )}
      <div className={hasImage ? "p-4 space-y-3" : "p-3 space-y-2"}>
        <div>
          <h3 className={`font-display font-semibold leading-tight ${hasImage ? "text-base" : "text-sm"}`}>{product.name}</h3>
          <p className={`${hasImage ? "line-clamp-1" : "line-clamp-2"} text-xs text-muted-foreground mt-0.5`}>{product.description}</p>
        </div>
        <div className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${hasImage ? "" : "items-start"}`}>
          <div className={`w-full max-w-full break-words font-mono font-bold leading-none tracking-tight text-sm sm:text-base ${hasImage ? "md:text-lg" : "md:text-base"}`}>
            {formatMoney(product.price)}
          </div>
          {inCart ? (
            <div className="flex w-full items-center justify-between gap-1 rounded-full bg-secondary p-0.5 sm:w-auto sm:justify-start">
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
              className="w-full rounded-full font-semibold px-3 sm:w-auto sm:px-4"
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
