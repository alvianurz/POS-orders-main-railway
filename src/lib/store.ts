import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, Order, OrderStatus, Product, User } from "./types";
import croissant from "@/assets/p-croissant.jpg";
import coldbrew from "@/assets/p-coldbrew.jpg";
import sourdough from "@/assets/p-sourdough.jpg";
import chocolate from "@/assets/p-chocolate.jpg";
import bananas from "@/assets/p-bananas.jpg";
import milk from "@/assets/p-milk.jpg";
import muffin from "@/assets/p-muffin.jpg";
import beans from "@/assets/p-beans.jpg";

const seedProducts: Product[] = [
  { id: "p1", name: "Croissant Mentega", price: 35000, category: "Roti", image: croissant, stock: 24, description: "Renyah, wangi mentega, dipanggang setiap hari." },
  { id: "p2", name: "Cold Brew 330ml", price: 45000, category: "Minuman", image: coldbrew, stock: 18, description: "Cold brew halus dengan ekstraksi 18 jam." },
  { id: "p3", name: "Roti Sourdough", price: 70000, category: "Roti", image: sourdough, stock: 9, description: "Fermentasi 24 jam dengan ragi alami." },
  { id: "p4", name: "Cokelat Hitam 70%", price: 50000, category: "Camilan", image: chocolate, stock: 42, description: "Cokelat single-origin dengan 70% kakao." },
  { id: "p5", name: "Pisang Organik", price: 22000, category: "Sayur & Buah", image: bananas, stock: 60, description: "Matang, segar, dan siap disantap." },
  { id: "p6", name: "Susu Segar 1L", price: 32000, category: "Kebutuhan Dapur", image: milk, stock: 3, description: "Susu lokal segar dalam botol kaca." },
  { id: "p7", name: "Muffin Blueberry", price: 38000, category: "Roti", image: muffin, stock: 14, description: "Muffin lembut dengan blueberry melimpah." },
  { id: "p8", name: "Biji Kopi Sangrai 250g", price: 140000, category: "Kebutuhan Dapur", image: beans, stock: 11, description: "Sangrai medium dengan aroma kakao." },
];

const seedCategories = ["Roti", "Minuman", "Camilan", "Kebutuhan Dapur", "Sayur & Buah"];

interface AppState {
  products: Product[];
  categories: string[];
  cart: CartItem[];
  orders: Order[];
  user: User | null;
  storeName: string;
  appIcon: string | null;
  isStoreOpen: boolean;
  notifications: { id: string; message: string; orderId?: string; read: boolean; ts: number }[];

  // auth
  setUser: (u: User | null) => void;
  signOut: () => void;

  // cart
  addToCart: (productId: string, qty?: number) => void;
  updateCartQty: (productId: string, qty: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;

  // orders
  placeOrder: () => Order | null;
  setOrderStatus: (id: string, status: OrderStatus) => void;
  markPaid: (id: string) => void;

  // products (admin)
  upsertProduct: (p: Product) => void;
  deleteProduct: (id: string) => void;
  adjustStock: (id: string, delta: number) => void;

  // categories (admin)
  addCategory: (name: string) => void;
  renameCategory: (oldName: string, newName: string) => void;
  removeCategory: (name: string) => void;

  // notifications
  markNotificationsRead: () => void;

  // settings
  setStoreName: (name: string) => void;
  setAppIcon: (icon: string | null) => void;
  setStoreOpen: (open: boolean) => void;
}

const genPickup = () =>
  "QP-" +
  Math.random().toString(36).slice(2, 5).toUpperCase() +
  "-" +
  Math.floor(100 + Math.random() * 900);

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      products: seedProducts,
      categories: seedCategories,
      cart: [],
      orders: [],
      user: null,
      storeName: "QuickPick POS",
      appIcon: null,
      isStoreOpen: true,
      notifications: [],

      setUser: (u) => set({ user: u }),
      signOut: () => set({ user: null, cart: [] }),

      addToCart: (productId, qty = 1) => {
        if (!get().isStoreOpen) return;
        const p = get().products.find((x) => x.id === productId);
        if (!p || p.stock <= 0) return;
        const cart = [...get().cart];
        const existing = cart.find((c) => c.productId === productId);
        const currentQty = existing?.quantity ?? 0;
        if (currentQty + qty > p.stock) return;
        if (existing) existing.quantity += qty;
        else cart.push({ productId, quantity: qty });
        set({ cart });
      },
      updateCartQty: (productId, qty) => {
        const p = get().products.find((x) => x.id === productId);
        if (!p) return;
        const cap = Math.min(qty, p.stock);
        if (cap <= 0) return get().removeFromCart(productId);
        set({
          cart: get().cart.map((c) => (c.productId === productId ? { ...c, quantity: cap } : c)),
        });
      },
      removeFromCart: (productId) =>
        set({ cart: get().cart.filter((c) => c.productId !== productId) }),
      clearCart: () => set({ cart: [] }),

      placeOrder: () => {
        const { cart, products, user, isStoreOpen } = get();
        if (!isStoreOpen || !cart.length || !user) return null;
        // validate stock
        for (const c of cart) {
          const p = products.find((x) => x.id === c.productId);
          if (!p || p.stock < c.quantity) return null;
        }
        const items = cart.map((c) => {
          const p = products.find((x) => x.id === c.productId)!;
          return { productId: p.id, name: p.name, price: p.price, quantity: c.quantity };
        });
        const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
        const order: Order = {
          id: "o_" + Date.now().toString(36),
          pickupId: genPickup(),
          customerName: user.name,
          customerPhone: user.phone,
          customerEmail: user.email,
          items,
          total,
          status: "Pending",
          createdAt: Date.now(),
          paid: false,
        };
        // reduce stock atomically
        const newProducts = products.map((p) => {
          const ci = cart.find((c) => c.productId === p.id);
          return ci ? { ...p, stock: p.stock - ci.quantity } : p;
        });
        set({
          products: newProducts,
          orders: [order, ...get().orders],
          cart: [],
        });
        return order;
      },
      setOrderStatus: (id, status) => {
        set({
          orders: get().orders.map((o) => (o.id === id ? { ...o, status } : o)),
        });
        if (status === "Ready") {
          const o = get().orders.find((x) => x.id === id);
          if (o) {
            set({
              notifications: [
                { id: "n_" + Date.now(), message: `Pesanan ${o.pickupId} siap diambil.`, orderId: id, read: false, ts: Date.now() },
                ...get().notifications,
              ],
            });
          }
        }
      },
      markPaid: (id) =>
        set({
          orders: get().orders.map((o) => (o.id === id ? { ...o, paid: true, status: "Completed" } : o)),
        }),

      upsertProduct: (p) => {
        const exists = get().products.find((x) => x.id === p.id);
        set({
          products: exists
            ? get().products.map((x) => (x.id === p.id ? p : x))
            : [...get().products, p],
        });
      },
      deleteProduct: (id) => set({ products: get().products.filter((p) => p.id !== id) }),
      adjustStock: (id, delta) =>
        set({
          products: get().products.map((p) =>
            p.id === id ? { ...p, stock: Math.max(0, p.stock + delta) } : p
          ),
        }),


      addCategory: (name) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        const cats = get().categories;
        if (cats.some((c) => c.toLowerCase() === trimmed.toLowerCase())) return;
        set({ categories: [...cats, trimmed] });
      },
      renameCategory: (oldName, newName) => {
        const trimmed = newName.trim();
        if (!trimmed) return;
        set({
          categories: get().categories.map((c) => (c === oldName ? trimmed : c)),
          products: get().products.map((p) => (p.category === oldName ? { ...p, category: trimmed } : p)),
        });
      },
      removeCategory: (name) => {
        if (get().products.some((p) => p.category === name)) return;
        set({ categories: get().categories.filter((c) => c !== name) });
      },

      markNotificationsRead: () =>
        set({ notifications: get().notifications.map((n) => ({ ...n, read: true })) }),

      setStoreName: (name) => set({ storeName: name.trim() || "QuickPick POS" }),
      setAppIcon: (icon) => set({ appIcon: icon }),
      setStoreOpen: (open) => set({ isStoreOpen: open }),
    }),
    {
      name: "quickpick-pos",
      partialize: (state) => ({
        products: state.products,
        categories: state.categories,
        cart: state.cart,
        orders: state.orders,
        storeName: state.storeName,
        appIcon: state.appIcon,
        isStoreOpen: state.isStoreOpen,
        notifications: state.notifications,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<AppState>;
        const merged = { ...current, ...p, user: null } as AppState;
        if (!merged.categories || merged.categories.length === 0) {
          const fromProducts = Array.from(new Set((merged.products ?? []).map((x) => x.category)));
          merged.categories = fromProducts.length ? fromProducts : seedCategories;
        }
        if (!merged.storeName) merged.storeName = "QuickPick POS";
        if (typeof merged.isStoreOpen !== "boolean") merged.isStoreOpen = true;
        if (!("appIcon" in merged)) merged.appIcon = null;
        return merged;
      },
    }
  )
);

export const formatMoney = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
