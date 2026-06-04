import { Link } from "react-router-dom";
import { useApp, formatMoney } from "@/lib/store";
import { ShoppingCart } from "lucide-react";

export default function FloatingCartButton() {
  const cart = useApp((s) => s.cart);
  const products = useApp((s) => s.products);
  const user = useApp((s) => s.user);
  const isStoreOpen = useApp((s) => s.isStoreOpen);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => {
    const product = products.find((p) => p.id === item.productId);
    return sum + (product?.price || 0) * item.quantity;
  }, 0);

  // Don't show if cart is empty or store is closed
  if (totalItems === 0 || !isStoreOpen) return null;

  return (
    <Link
      to="/cart"
      className="fixed bottom-6 right-6 z-40 flex items-center gap-3 rounded-2xl bg-primary text-primary-foreground px-4 py-3 shadow-lg hover:bg-primary/90 transition-all hover:scale-105 active:scale-100"
    >
      <div className="relative">
        <ShoppingCart className="h-6 w-6" />
        <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-accent-foreground text-xs font-bold">
          {totalItems}
        </span>
      </div>
      <div className="flex flex-col">
        <span className="text-xs font-medium opacity-90">Keranjang</span>
        <span className="font-display font-bold">{formatMoney(totalPrice)}</span>
      </div>
    </Link>
  );
}
