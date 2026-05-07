import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApp } from "@/lib/store";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

export default function Auth() {
  const nav = useNavigate();
  const signIn = useApp((s) => s.signIn);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error("Email dan kata sandi wajib diisi");
    if (mode === "signup" && (!form.name || !form.phone))
      return toast.error("Lengkapi semua data terlebih dahulu");

    const isAdmin = form.email.toLowerCase() === "admin@quickpick.com";
    signIn({
      name: form.name || form.email.split("@")[0],
      email: form.email,
      phone: form.phone || "—",
      role: isAdmin ? "admin" : "customer",
    });
    toast.success(isAdmin ? "Selamat datang kembali, admin" : "Berhasil masuk");
    nav(isAdmin ? "/admin" : "/");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 grid place-items-center px-4 py-12 relative">
        <div className="absolute inset-0 -z-10 opacity-30">
          <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-primary/30 blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-accent/20 blur-[120px]" />
        </div>

        <div className="w-full max-w-md surface-card border border-border/60 rounded-3xl p-8 animate-slide-up">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-display font-bold tracking-tight">
              {mode === "signin" ? "Selamat datang" : "Buat akun"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {mode === "signin" ? "Pesan lebih cepat dan ambil tanpa antre." : "Daftar untuk memesan lebih awal dan mengambil saat siap."}
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === "signup" && (
              <>
                <div className="space-y-1.5">
                  <Label>Nama lengkap</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nama pelanggan" />
                </div>
                <div className="space-y-1.5">
                  <Label>Nomor telepon</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+62 812 3456 7890" />
                </div>
              </>
            )}
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="nama@email.com" />
            </div>
            <div className="space-y-1.5">
              <Label>Kata sandi</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Masukkan kata sandi"
                  className="pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 grid h-8 w-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full font-bold">
              {mode === "signin" ? "Masuk" : "Buat akun"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "signin" ? "Belum punya akun?" : "Sudah punya akun?"}{" "}
            <button
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="text-primary font-semibold hover:underline"
            >
              {mode === "signin" ? "Daftar" : "Masuk"}
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-border/60 text-xs text-muted-foreground text-center font-mono">
            Tips: gunakan <span className="text-primary">admin@quickpick.com</span> untuk masuk sebagai admin
          </div>
        </div>
      </main>
    </div>
  );
}
