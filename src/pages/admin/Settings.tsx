import { useMemo, useState } from "react";
import Header from "@/components/Header";
import PageHeader from "@/components/PageHeader";
import { useApp } from "@/lib/store";
import { DEFAULT_APP_ICON, DEFAULT_STORE_NAME } from "@/lib/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ImageUp, Store, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminSettings() {
  const {
    storeName,
    appIcon,
    isStoreOpen,
    setStoreName,
    setAppIcon,
    setStoreOpen,
  } = useApp();
  const [nameDraft, setNameDraft] = useState(storeName);

  const title = useMemo(() => nameDraft.trim() || DEFAULT_STORE_NAME, [nameDraft]);

  const saveStoreName = () => {
    setStoreName(nameDraft);
    toast.success("Nama toko disimpan");
  };

  const onUpload = async (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Pilih file gambar");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setAppIcon(typeof reader.result === "string" ? reader.result : null);
      toast.success("Foto ikon app diperbarui");
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-6 sm:py-10 space-y-6">
        <PageHeader
          title="Pengaturan"
          subtitle="Atur nama toko, foto ikon app, dan status buka tutup toko."
          backTo="/admin"
        />
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="surface-card border border-border/60 rounded-2xl p-4 sm:p-6 space-y-6">
            <div className="flex items-center gap-2">
              <Store className="h-5 w-5 text-primary" />
              <h2 className="font-display font-bold text-base sm:text-lg">Identitas toko</h2>
            </div>

            <div className="space-y-2">
              <Label htmlFor="store-name">Nama toko</Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  id="store-name"
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  placeholder="Nama toko"
                />
                <Button onClick={saveStoreName} className="shrink-0">
                  Simpan
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Foto ikon app</Label>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="h-16 w-16 rounded-xl border border-border/60 bg-secondary overflow-hidden grid place-items-center shrink-0">
                  {appIcon ? (
                    <img src={appIcon || DEFAULT_APP_ICON} alt="Ikon app" className="h-full w-full object-cover" />
                  ) : (
                    <img src={DEFAULT_APP_ICON} alt="Ikon app" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <label className="inline-flex cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(e) => onUpload(e.target.files?.[0] ?? null)}
                    />
                    <span className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                      <ImageUp className="h-4 w-4" />
                      Unggah foto
                    </span>
                  </label>
                  {appIcon && (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setAppIcon(null)}
                      className="gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Hapus foto
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Ikon ini dipakai di header aplikasi dan favicon browser.
              </p>
            </div>
          </section>

          <section className="surface-card border border-border/60 rounded-2xl p-4 sm:p-6 space-y-6">
            <div className="flex items-center gap-2">
              <Switch checked={isStoreOpen} onCheckedChange={setStoreOpen} />
              <div>
                <h2 className="font-display font-bold text-base sm:text-lg">Buka tutup toko</h2>
                <p className="text-sm text-muted-foreground">
                  Saat toko tutup, pelanggan tidak bisa menambahkan item ke keranjang atau checkout.
                </p>
              </div>
            </div>

            <div className={`rounded-2xl border p-4 ${isStoreOpen ? "border-success/30 bg-success/10" : "border-destructive/30 bg-destructive/10"}`}>
              <div className="text-xs uppercase tracking-wider font-mono text-muted-foreground">Status saat ini</div>
              <div className={`mt-1 text-2xl font-display font-bold ${isStoreOpen ? "text-success" : "text-destructive"}`}>
                {isStoreOpen ? "Buka" : "Tutup"}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {isStoreOpen
                  ? "Pelanggan dapat berbelanja dan membuat pesanan."
                  : "Pelanggan hanya bisa melihat produk, tanpa bisa memesan."}
              </p>
            </div>

            <div className="rounded-2xl border border-border/60 p-4 bg-secondary/30">
              <div className="text-xs uppercase tracking-wider font-mono text-muted-foreground">Pratinjau struk</div>
              <div className="mt-2 rounded-xl bg-white p-4 text-center text-zinc-900 shadow-sm">
                <div className="text-lg font-bold break-words">{title}</div>
                <div className="text-xs text-zinc-500">Struk pesanan</div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
