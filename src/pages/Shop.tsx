import { useMemo, useState } from "react";
import { useTheme } from "next-themes";
import Header from "@/components/Header";
import ProductCard from "@/components/ProductCard";
import FloatingCartButton from "@/components/FloatingCartButton";
import LoginPrompt, { useLoginPromptStore } from "@/components/LoginPrompt";
import { useApp } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Search, Sparkles } from "lucide-react";
import type { Category } from "@/lib/types";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DEFAULT_STORE_NAME } from "@/lib/brand";

export default function Shop() {
  const { products, user, categories: storeCats, storeName, isStoreOpen } = useApp();
  const { theme } = useTheme();
  const categories: ("Semua" | Category)[] = ["Semua", ...storeCats];
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<(typeof categories)[number]>("Semua");
  const displayName = storeName.trim() || DEFAULT_STORE_NAME;
  const { isOpen, productName, closeLoginPrompt } = useLoginPromptStore();

  const filtered = useMemo(
    () =>
      products.filter(
        (p) =>
          (cat === "Semua" || p.category === cat) &&
          p.name.toLowerCase().includes(q.toLowerCase())
      ),
    [products, q, cat]
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <LoginPrompt open={isOpen} onOpenChange={closeLoginPrompt} productName={productName || undefined} />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border/60">
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 left-1/4 h-[500px] w-[500px] rounded-full bg-primary/20 blur-[140px]" />
            <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-accent/20 blur-[140px]" />
          </div>
          <div className="container py-14 md:py-20 grid gap-10 items-center md:grid-cols-[minmax(0,0.95fr)_minmax(320px,1.05fr)]">
            <div className="space-y-5 animate-slide-up">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary border border-border text-xs font-mono uppercase tracking-wider">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                {isStoreOpen ? displayName : "Toko sedang tutup"}
              </div>
              <h1 className="text-5xl md:text-6xl font-display font-bold tracking-tighter leading-[0.95]">
                Pesan dulu.<br />
                <span className="text-primary">Ambil</span> dalam menit.
              </h1>
              <p className="text-lg text-muted-foreground max-w-md">
                {isStoreOpen
                  ? "Pilih produk, buat pesanan, lalu ambil saat sudah siap. Lebih cepat dan lebih rapi."
                  : "Saat ini toko sedang tutup. Pelanggan belum bisa membuat pesanan baru."}
              </p>
              {!user && isStoreOpen && (
                <div className="flex gap-3">
                  <Link to="/auth"><Button size="lg" className="font-bold">Mulai</Button></Link>
                  <a href="#shop"><Button size="lg" variant="secondary" className="font-bold">Lihat produk</Button></a>
                </div>
              )}
              {!isStoreOpen && (
                <div className="inline-flex items-center rounded-full border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive font-medium">
                  Toko tutup sementara
                </div>
              )}
            </div>
            <div className="relative mx-auto w-full max-w-[560px] animate-slide-up">
              <img
                src={theme === "light" ? "/brand/illustration lightmode.svg" : "/brand/illustration.svg"}
                alt=""
                className="h-auto w-full object-contain"
                width={1080}
                height={718}
                loading="eager"
              />
            </div>
          </div>
        </section>

        {/* Shop */}
        <section id="shop" className="container py-10 pb-[calc(5rem+env(safe-area-inset-bottom))] space-y-6">
          {!isStoreOpen && (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              Toko sedang tutup. Produk masih dapat dilihat, tetapi pemesanan dinonaktifkan.
            </div>
          )}
          <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
            <h2 className="text-2xl font-display font-bold">Belanja produk</h2>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari produk..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pl-10 h-11 bg-secondary/50 border-border"
              />
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-2 -mx-1 px-1">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                  cat === c
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-foreground hover:bg-secondary/70"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground">Produk tidak ditemukan.</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Floating Cart Button for guest checkout reminder */}
      <FloatingCartButton />
    </div>
  );
}
