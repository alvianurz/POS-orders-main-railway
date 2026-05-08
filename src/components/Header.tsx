import { useEffect } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { ShoppingCart, Bell, LogOut, LayoutDashboard, Store, Receipt, HelpCircle, Settings2, type LucideIcon } from "lucide-react";
import { useApp } from "@/lib/store";
import { DEFAULT_APP_ICON, DEFAULT_STORE_NAME } from "@/lib/brand";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { authApi } from "@/lib/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Header() {
  const { user, cart, signOut, notifications, markNotificationsRead, appIcon, storeName, isStoreOpen } = useApp();
  const cartCount = cart.reduce((s, c) => s + c.quantity, 0);
  const unread = notifications.filter((n) => !n.read).length;
  const { pathname } = useLocation();
  const isAdmin = user?.role === "admin";
  const displayName = storeName.trim() || DEFAULT_STORE_NAME;
  const iconHref = appIcon || DEFAULT_APP_ICON;

  const handleSignOut = async () => {
    try {
      await authApi.signOut();
    } finally {
      signOut();
    }
  };

  useEffect(() => {
    let linkEl = document.querySelector("link[rel='icon']") as HTMLLinkElement | null;
    if (!linkEl) {
      linkEl = document.createElement("link");
      linkEl.rel = "icon";
      document.head.appendChild(linkEl);
    }
    linkEl.href = iconHref;
    document.title = `${displayName} - Pre-order & Pickup`;
  }, [displayName, iconHref]);

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/92 shadow-[0_12px_40px_rgba(0,0,0,0.18)] backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between gap-2 sm:gap-4">
        <Link to="/" className="flex items-center gap-2 group min-w-0">
          <div className="h-9 w-9 shrink-0 rounded-xl bg-gradient-primary overflow-hidden grid place-items-center font-display font-bold text-primary-foreground glow-primary group-hover:scale-105 transition-transform">
            <img src={iconHref} alt="" className="h-full w-full object-cover" />
          </div>
          <div className="hidden min-w-0 leading-none xs:block sm:block">
            <div className="max-w-[9rem] truncate font-display text-lg font-bold tracking-tight sm:max-w-[14rem]">{displayName}</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-mono">Pre-order</div>
          </div>
        </Link>

        {user && (
          <nav className="hidden lg:flex items-center gap-1 rounded-2xl border border-border/70 bg-secondary/45 p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
            {isAdmin ? (
              <>
                <NavTab to="/admin" label="Analitik" icon={LayoutDashboard} />
                <NavTab to="/admin/products" label="Produk" icon={Store} />
                <NavTab to="/admin/orders" label="Pesanan" icon={Receipt} />
                <NavTab to="/admin/settings" label="Pengaturan" icon={Settings2} />
              </>
            ) : (
              <>
                <NavTab to="/" label="Belanja" icon={Store} />
                <NavTab to="/orders" label="Pesanan Saya" icon={Receipt} />
              </>
            )}
          </nav>
        )}

        <div className="flex items-center gap-2">
          <a
            href="https://wa.me/15555555555"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex"
          >
            <Button variant="ghost" size="sm" className="gap-1.5">
              <HelpCircle className="h-4 w-4" /> Bantuan
            </Button>
          </a>

          {user && !isAdmin && (
            <Link to="/cart" aria-label="Cart">
              <Button variant="secondary" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-primary text-primary-foreground text-[11px] font-bold grid place-items-center">
                    {cartCount}
                  </span>
                )}
              </Button>
            </Link>
          )}

          {!isAdmin && !isStoreOpen && (
            <Badge variant="outline" className="hidden sm:inline-flex border-destructive/30 text-destructive">
              Toko tutup
            </Badge>
          )}

          {user && (
            <DropdownMenu onOpenChange={(o) => o && markNotificationsRead()}>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {unread > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary animate-pulse-glow" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notifikasi</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground text-center">Tidak ada notifikasi baru</div>
                ) : (
                  notifications.slice(0, 8).map((n) => (
                    <DropdownMenuItem key={n.id} className="flex-col items-start gap-0.5 py-2">
                      <div className="text-sm">{n.message}</div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {new Date(n.ts).toLocaleTimeString()}
                      </div>
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <div className="h-7 w-7 rounded-full bg-secondary grid place-items-center text-xs font-semibold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline">{user.name.split(" ")[0]}</span>
                  {isAdmin && <Badge variant="outline" className="text-[10px]">ADMIN</Badge>}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" /> Keluar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            pathname !== "/auth" && (
              <Link to="/auth">
                <Button variant="default">Masuk</Button>
              </Link>
            )
          )}
        </div>
      </div>

      {user && (
        <nav className="lg:hidden border-t border-border/70 container flex items-center gap-1 overflow-x-auto py-2">
          {isAdmin ? (
            <>
              <NavTab to="/admin" label="Analitik" icon={LayoutDashboard} compact />
              <NavTab to="/admin/products" label="Produk" icon={Store} compact />
              <NavTab to="/admin/orders" label="Pesanan" icon={Receipt} compact />
              <NavTab to="/admin/settings" label="Pengaturan" icon={Settings2} compact />
            </>
          ) : (
            <>
              <NavTab to="/" label="Belanja" icon={Store} compact />
              <NavTab to="/orders" label="Pesanan Saya" icon={Receipt} compact />
            </>
          )}
        </nav>
      )}
    </header>
  );
}

function NavTab({ to, label, icon: Icon, compact = false }: { to: string; label: string; icon: LucideIcon; compact?: boolean }) {
  return (
    <NavLink
      to={to}
      end={to === "/admin" || to === "/"}
      className={({ isActive }) =>
        `flex items-center ${compact ? "justify-center px-3 py-2 min-w-11" : "gap-2 px-4 py-2"} rounded-xl text-sm font-semibold transition-all ${
          isActive
            ? "bg-background text-foreground shadow-sm ring-1 ring-border/80"
            : "text-muted-foreground hover:text-foreground hover:bg-background/60"
        }`
      }
      aria-label={label}
    >
      <Icon className="h-4 w-4" />
      {!compact && label}
    </NavLink>
  );
}
