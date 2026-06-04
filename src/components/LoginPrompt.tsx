import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { create } from "zustand";
import { useApp } from "@/lib/store";
import { authApi } from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

interface LoginPromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName?: string;
}

export default function LoginPrompt({ open, onOpenChange, productName }: LoginPromptProps) {
  const nav = useNavigate();
  const setUser = useApp((s) => s.setUser);
  const refreshOrders = useApp((s) => s.refreshOrders);
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error("Email dan kata sandi wajib diisi");

    try {
      setLoading(true);
      const data = await authApi.signIn(form.email, form.password);
      if (!data.user) throw new Error("Sesi tidak ditemukan.");
      setUser(data.user);
      await refreshOrders();
      toast.success(data.user.role === "admin" ? "Selamat datang, admin" : "Berhasil masuk");
      onOpenChange(false);
      nav(data.user.role === "admin" ? "/admin" : "/cart");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal masuk");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-display font-bold">
            Masuk untuk melanjutkan
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {productName && (
            <div className="rounded-xl bg-secondary/50 p-3 text-sm text-muted-foreground">
              Kamu ingin menambahkan <span className="font-semibold text-foreground">{productName}</span> ke keranjang. Masuk terlebih dahulu untuk checkout.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                type="email"
                placeholder="nama@email.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="login-password">Kata sandi</Label>
              <div className="relative">
                <Input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Kata sandi"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="pr-10"
                  disabled={loading}
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

            <Button type="submit" size="lg" className="w-full font-bold" disabled={loading}>
              {loading ? "Memproses..." : "Masuk"}
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground">
            Belum punya akun?{" "}
            <button
              onClick={() => {
                onOpenChange(false);
                nav("/auth");
              }}
              className="text-primary font-semibold hover:underline"
            >
              Daftar di sini
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Zustand store to manage login prompt state
interface LoginPromptState {
  isOpen: boolean;
  productName: string | null;
  openLoginPrompt: (productName?: string) => void;
  closeLoginPrompt: () => void;
}

export const useLoginPromptStore = create<LoginPromptState>((set) => ({
  isOpen: false,
  productName: null,
  openLoginPrompt: (productName) => set({ isOpen: true, productName: productName || null }),
  closeLoginPrompt: () => set({ isOpen: false, productName: null }),
}));