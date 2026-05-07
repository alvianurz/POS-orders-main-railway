import { useState } from "react";
import Header from "@/components/Header";
import PageHeader from "@/components/PageHeader";
import { useApp, formatMoney } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, AlertTriangle, Minus, Tag, X } from "lucide-react";
import type { Category, Product } from "@/lib/types";
import { toast } from "sonner";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const empty = (cat: string): Product => ({
  id: "", name: "", price: 0, category: cat, image: "", stock: 0, description: "",
});

export default function AdminProducts() {
  const {
    products, categories, upsertProduct, deleteProduct, adjustStock,
    addCategory, renameCategory, removeCategory,
  } = useApp();
  const [editing, setEditing] = useState<Product | null>(null);
  const [open, setOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [newCat, setNewCat] = useState("");
  const [renaming, setRenaming] = useState<{ from: string; to: string } | null>(null);

  const startNew = () => {
    setEditing({ ...empty(categories[0] ?? "Roti"), id: "p_" + Date.now().toString(36) });
    setOpen(true);
  };
  const startEdit = (p: Product) => { setEditing(p); setOpen(true); };

  const save = () => {
    if (!editing) return;
    if (!editing.name || editing.price <= 0) return toast.error("Nama dan harga wajib diisi");
    upsertProduct({ ...editing, image: editing.image || "/placeholder.svg" });
    toast.success("Produk tersimpan");
    setOpen(false);
  };

  const handleAddCat = () => {
    const v = newCat.trim();
    if (!v) return;
    if (categories.some((c) => c.toLowerCase() === v.toLowerCase())) {
      return toast.error("Kategori sudah ada");
    }
    addCategory(v);
    setNewCat("");
    toast.success("Kategori ditambahkan");
  };

  const handleRemoveCat = (name: string) => {
    if (products.some((p) => p.category === name)) {
      return toast.error("Pindahkan produk dari kategori ini sebelum menghapus");
    }
    removeCategory(name);
    toast.success("Kategori dihapus");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-6 sm:py-10 space-y-6">
        <PageHeader
          title="Produk & stok"
          subtitle={`${products.length} produk · ${products.filter((p) => p.stock <= 5).length} stok rendah · ${categories.length} kategori`}
          backTo="/admin"
          actions={
            <>
              <Button variant="secondary" onClick={() => setCatOpen(true)} className="font-bold">
                <Tag className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Kategori</span>
              </Button>
              <Button onClick={startNew} className="font-bold">
                <Plus className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Produk baru</span>
              </Button>
            </>
          }
        />
        <div className="surface-card border border-border/60 rounded-2xl overflow-hidden">
          <div className="md:hidden divide-y divide-border/60">
            {products.map((p) => (
              <div key={p.id} className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <img src={p.image} alt="" className="h-14 w-14 rounded-lg object-cover shrink-0" loading="lazy" width={56} height={56} />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold leading-snug">{p.name}</div>
                    <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{p.description}</div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-full bg-secondary px-2 py-1 font-medium">{p.category}</span>
                      <span className="font-mono font-semibold">{formatMoney(p.price)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1 bg-secondary rounded-full p-0.5">
                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full" onClick={() => adjustStock(p.id, -1)} aria-label={`Kurangi stok ${p.name}`}>
                      <Minus className="h-3.5 w-3.5" />
                    </Button>
                    <span className={`font-mono font-bold w-10 text-center ${p.stock === 0 ? "text-destructive" : p.stock <= 5 ? "text-[hsl(var(--warning))]" : ""}`}>
                      {p.stock}
                    </span>
                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full" onClick={() => adjustStock(p.id, 1)} aria-label={`Tambah stok ${p.name}`}>
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                    {p.stock <= 5 && <AlertTriangle className="h-3.5 w-3.5 ml-1 text-[hsl(var(--warning))]" />}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button size="icon" variant="ghost" onClick={() => startEdit(p)} aria-label={`Edit ${p.name}`}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => { deleteProduct(p.id); toast.success("Produk dihapus"); }} aria-label={`Hapus ${p.name}`}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/40">
                <tr className="text-left">
                  <th className="p-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">Produk</th>
                  <th className="p-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">Kategori</th>
                  <th className="p-3 font-mono text-xs uppercase tracking-wider text-muted-foreground text-right">Harga</th>
                  <th className="p-3 font-mono text-xs uppercase tracking-wider text-muted-foreground text-center">Stok</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-t border-border/60">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <img src={p.image} alt="" className="h-10 w-10 rounded-lg object-cover" loading="lazy" width={40} height={40} />
                        <div>
                          <div className="font-semibold">{p.name}</div>
                          <div className="text-xs text-muted-foreground line-clamp-1">{p.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-muted-foreground">{p.category}</td>
                    <td className="p-3 text-right font-mono">{formatMoney(p.price)}</td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => adjustStock(p.id, -1)}><Minus className="h-3.5 w-3.5" /></Button>
                        <span className={`font-mono font-bold w-8 text-center ${p.stock === 0 ? "text-destructive" : p.stock <= 5 ? "text-[hsl(var(--warning))]" : ""}`}>
                          {p.stock}
                        </span>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => adjustStock(p.id, 1)}><Plus className="h-3.5 w-3.5" /></Button>
                        {p.stock <= 5 && <AlertTriangle className="h-3.5 w-3.5 ml-1 text-[hsl(var(--warning))]" />}
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <Button size="icon" variant="ghost" onClick={() => startEdit(p)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => { deleteProduct(p.id); toast.success("Produk dihapus"); }}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing && products.find(p => p.id === editing.id) ? "Edit produk" : "Produk baru"}</DialogTitle></DialogHeader>
            {editing && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Nama</Label>
                  <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Deskripsi</Label>
                  <Textarea rows={2} value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label>Harga</Label>
                    <Input type="number" step="0.01" value={editing.price} onChange={(e) => setEditing({ ...editing, price: +e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Stok</Label>
                    <Input type="number" value={editing.stock} onChange={(e) => setEditing({ ...editing, stock: +e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Kategori</Label>
                    <Select value={editing.category} onValueChange={(v) => setEditing({ ...editing, category: v as Category })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>URL gambar</Label>
                  <Input value={editing.image} onChange={(e) => setEditing({ ...editing, image: e.target.value })} placeholder="/placeholder.svg" />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Batal</Button>
              <Button onClick={save}>Simpan produk</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={catOpen} onOpenChange={setCatOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Kelola kategori</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Nama kategori baru"
                  value={newCat}
                  onChange={(e) => setNewCat(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddCat()}
                />
                <Button onClick={handleAddCat} className="shrink-0">
                  <Plus className="h-4 w-4 mr-1" /> Tambah
                </Button>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto">
                {categories.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Belum ada kategori.</p>
                ) : (
                  categories.map((c) => {
                    const usage = products.filter((p) => p.category === c).length;
                    const isRenaming = renaming?.from === c;
                    return (
                      <div key={c} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/40">
                        {isRenaming ? (
                          <Input
                            autoFocus
                            value={renaming.to}
                            onChange={(e) => setRenaming({ ...renaming, to: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                renameCategory(renaming.from, renaming.to);
                                setRenaming(null);
                                toast.success("Kategori diganti");
                              }
                              if (e.key === "Escape") setRenaming(null);
                            }}
                            className="h-8"
                          />
                        ) : (
                          <button
                            onClick={() => setRenaming({ from: c, to: c })}
                            className="flex-1 text-left font-semibold text-sm hover:text-primary truncate"
                          >
                            {c}
                          </button>
                        )}
                        <span className="text-xs text-muted-foreground font-mono shrink-0">{usage}</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 shrink-0"
                          onClick={() => handleRemoveCat(c)}
                          disabled={usage > 0}
                          aria-label="Hapus kategori"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Ketuk nama kategori untuk mengganti nama. Kategori yang masih berisi produk tidak bisa dihapus.
              </p>
            </div>
            <DialogFooter>
              <Button onClick={() => setCatOpen(false)}>Selesai</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
