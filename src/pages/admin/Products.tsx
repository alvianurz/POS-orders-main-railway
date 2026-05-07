import { useMemo, useState } from "react";
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
import { Plus, Pencil, Trash2, AlertTriangle, Minus, Tag, X, FileUp, FileDown, Download } from "lucide-react";
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
  const [importOpen, setImportOpen] = useState(false);
  const [newCat, setNewCat] = useState("");
  const [renaming, setRenaming] = useState<{ from: string; to: string } | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [search, setSearch] = useState("");

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

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => {
      const haystack = [
        p.name,
        p.category,
        p.description ?? "",
        String(p.price),
        String(p.stock),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [products, search]);

  const exportCsv = (mode: "products" | "template") => {
    const headers = ["id", "name", "category", "price", "stock", "description", "image"];
    const rows = mode === "products"
      ? products.map((p) => [p.id, p.name, p.category, String(p.price), String(p.stock), p.description ?? "", p.image ?? ""])
      : [["", "Contoh Produk", "Roti", "25000", "12", "Deskripsi singkat produk", "/placeholder.svg"]];

    const csv = [headers, ...rows].map((row) => row.map(escapeCsvValue).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = mode === "products" ? "daftar-produk.csv" : "template-produk.csv";
    link.click();
    URL.revokeObjectURL(url);
    toast.success(mode === "products" ? "CSV produk berhasil diunduh" : "Template CSV berhasil diunduh");
  };

  const importCsv = async () => {
    if (!importFile) {
      toast.error("Pilih file CSV terlebih dahulu");
      return;
    }

    try {
      const text = await importFile.text();
      const rows = parseCsv(text);
      if (rows.length < 2) {
        toast.error("File CSV belum berisi data produk");
        return;
      }

      const headers = rows[0].map((cell) => normalizeHeader(cell));
      const required = ["name", "category", "price", "stock"];
      const missing = required.filter((key) => !headers.includes(key));
      if (missing.length > 0) {
        toast.error(`Kolom wajib belum lengkap: ${missing.join(", ")}`);
        return;
      }

      const categorySet = new Set(categories.map((category) => category.toLowerCase()));
      let importedCount = 0;

      for (const row of rows.slice(1)) {
        if (row.every((cell) => cell.trim() === "")) continue;

        const record = Object.fromEntries(headers.map((header, index) => [header, row[index]?.trim() ?? ""]));
        const name = record.name;
        const category = record.category;
        const price = Number(record.price);
        const stock = Number(record.stock);

        if (!name || !category || Number.isNaN(price) || Number.isNaN(stock) || price <= 0 || stock < 0) {
          continue;
        }

        if (!categorySet.has(category.toLowerCase())) {
          addCategory(category);
          categorySet.add(category.toLowerCase());
        }

        const nextProduct: Product = {
          id: record.id || `p_${Date.now().toString(36)}_${importedCount}`,
          name,
          category,
          price,
          stock,
          description: record.description || "",
          image: record.image || "/placeholder.svg",
        };

        upsertProduct(nextProduct);
        importedCount += 1;
      }

      if (importedCount === 0) {
        toast.error("Tidak ada baris produk yang berhasil diimpor");
        return;
      }

      setImportFile(null);
      setImportOpen(false);
      toast.success(`${importedCount} produk berhasil diimpor`);
    } catch {
      toast.error("File CSV tidak dapat dibaca");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-6 sm:py-10 space-y-6">
        <PageHeader
          title="Produk & stok"
          subtitle={`${filteredProducts.length} dari ${products.length} produk · ${products.filter((p) => p.stock <= 5).length} stok rendah · ${categories.length} kategori`}
          backTo="/admin"
          actions={
            <>
              <Button variant="secondary" onClick={() => setCatOpen(true)} className="font-bold">
                <Tag className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Kategori</span>
              </Button>
              <Button variant="secondary" onClick={() => exportCsv("products")} className="font-bold">
                <FileDown className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Ekspor CSV</span>
              </Button>
              <Button variant="secondary" onClick={() => setImportOpen(true)} className="font-bold">
                <FileUp className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Impor CSV</span>
              </Button>
              <Button onClick={startNew} className="font-bold">
                <Plus className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Produk baru</span>
              </Button>
            </>
          }
        />
        <div className="surface-card border border-border/60 rounded-2xl p-4 sm:p-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="product-search" className="text-sm font-semibold">
              Cari item
            </Label>
            <Input
              id="product-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama, kategori, deskripsi, harga, atau stok..."
              className="h-12"
            />
            <p className="text-xs text-muted-foreground">
              Ketik kata kunci untuk menemukan item dengan cepat.
            </p>
          </div>
        </div>
        <div className="surface-card border border-border/60 rounded-2xl overflow-hidden">
          <div className="md:hidden divide-y divide-border/60">
            {filteredProducts.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">Tidak ada item yang cocok.</div>
            ) : filteredProducts.map((p) => (
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
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      Tidak ada item yang cocok.
                    </td>
                  </tr>
                ) : filteredProducts.map((p) => (
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

        <Dialog open={importOpen} onOpenChange={setImportOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Impor daftar produk dari CSV</DialogTitle>
            </DialogHeader>
            <div className="space-y-5">
              <div className="rounded-xl border border-border/60 bg-secondary/30 p-4 space-y-3">
                <div className="font-semibold">Langkah cepat</div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>1. Unduh template CSV agar format kolom sesuai.</p>
                  <p>2. Isi data produk di spreadsheet atau Excel.</p>
                  <p>3. Simpan sebagai file CSV, lalu unggah di sini.</p>
                </div>
                <Button type="button" variant="secondary" onClick={() => exportCsv("template")} className="gap-2">
                  <Download className="h-4 w-4" />
                  Unduh template CSV
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="product-csv">File CSV produk</Label>
                <Input
                  id="product-csv"
                  type="file"
                  accept=".csv,text/csv"
                  onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
                />
                <p className="text-xs text-muted-foreground">
                  Kolom wajib: <span className="font-mono">name, category, price, stock</span>. Kolom opsional: <span className="font-mono">id, description, image</span>.
                </p>
                {importFile && (
                  <div className="text-sm font-medium">
                    File terpilih: {importFile.name}
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-border/60 p-4">
                <div className="text-xs uppercase tracking-wider font-mono text-muted-foreground mb-2">Contoh isi</div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[520px] text-sm">
                    <thead>
                      <tr className="text-left border-b border-border/60">
                        <th className="py-2 pr-3">name</th>
                        <th className="py-2 pr-3">category</th>
                        <th className="py-2 pr-3">price</th>
                        <th className="py-2 pr-3">stock</th>
                        <th className="py-2 pr-3">description</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="text-muted-foreground">
                        <td className="py-2 pr-3">Croissant Cokelat</td>
                        <td className="py-2 pr-3">Roti</td>
                        <td className="py-2 pr-3">28000</td>
                        <td className="py-2 pr-3">18</td>
                        <td className="py-2 pr-3">Isi cokelat lembut</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setImportOpen(false)}>Batal</Button>
              <Button onClick={importCsv}>Impor sekarang</Button>
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

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "_");
}

function escapeCsvValue(value: string) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function parseCsv(input: string) {
  const rows: string[][] = [];
  let current = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const next = input[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(current);
      current = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(current);
      rows.push(row);
      row = [];
      current = "";
      continue;
    }

    current += char;
  }

  if (current !== "" || row.length > 0) {
    row.push(current);
    rows.push(row);
  }

  return rows;
}
