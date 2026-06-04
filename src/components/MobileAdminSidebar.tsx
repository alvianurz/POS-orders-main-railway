import { useState, useEffect } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useTheme } from "next-themes";
import {
  LayoutDashboard,
  Store,
  Receipt,
  Users,
  Settings2,
  Sun,
  Moon,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import { useApp } from "@/lib/store";
import { DEFAULT_APP_ICON, DEFAULT_STORE_NAME } from "@/lib/brand";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { to: "/admin", label: "Analitik", icon: LayoutDashboard },
  { to: "/admin/products", label: "Produk", icon: Store },
  { to: "/admin/orders", label: "Pesanan", icon: Receipt },
  { to: "/admin/customers", label: "Pelanggan", icon: Users },
  { to: "/admin/settings", label: "Pengaturan", icon: Settings2 },
];

interface MobileAdminSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function MobileAdminSidebar({ open, onClose }: MobileAdminSidebarProps) {
  const { pathname } = useLocation();
  const { theme, setTheme } = useTheme();
  const { appIcon, storeName } = useApp();
  const iconHref = appIcon || DEFAULT_APP_ICON;
  const displayName = storeName.trim() || DEFAULT_STORE_NAME;

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent side="left" className="w-72 p-0 flex flex-col">
        <SheetHeader className="border-b border-border px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 shrink-0 rounded-xl bg-gradient-primary overflow-hidden grid place-items-center font-display font-bold text-primary-foreground glow-primary">
                <img src={iconHref} alt="" className="h-full w-full object-cover" />
              </div>
              <SheetTitle className="font-display text-lg font-bold tracking-tight">
                {displayName}
              </SheetTitle>
            </div>
            <SheetClose asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </SheetClose>
          </div>
        </SheetHeader>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map((item) => {
            const isActive =
              item.to === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.to);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/admin"}
                onClick={onClose}
                className="block"
              >
                <div
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all",
                    "hover:bg-secondary hover:text-foreground",
                    isActive
                      ? "bg-primary text-primary-foreground font-medium"
                      : "text-muted-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span>{item.label}</span>
                </div>
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-border p-3 space-y-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5 shrink-0" />
            ) : (
              <Moon className="h-5 w-5 shrink-0" />
            )}
            <span>{theme === "dark" ? "Mode Terang" : "Mode Gelap"}</span>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Hook to manage sidebar state
export function useSidebarState(defaultCollapsed = false) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setIsMobileOpen(false);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const toggle = () => {
    if (isMobile) {
      setIsMobileOpen((prev) => !prev);
    } else {
      setIsCollapsed((prev) => !prev);
    }
  };

  const closeMobile = () => setIsMobileOpen(false);

  return {
    isCollapsed,
    isMobile,
    isMobileOpen,
    toggle,
    setCollapsed: setIsCollapsed,
    closeMobile,
  };
}