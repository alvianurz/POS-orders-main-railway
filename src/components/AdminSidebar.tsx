import { Link, NavLink, useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import {
  LayoutDashboard,
  Store,
  Receipt,
  Users,
  Settings2,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  PanelLeft,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useApp } from "@/lib/store";
import { authApi } from "@/lib/api";
import { DEFAULT_APP_ICON, DEFAULT_STORE_NAME } from "@/lib/brand";
import { toast } from "sonner";

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

interface AdminSidebarProps {
  onToggle: (collapsed: boolean) => void;
  isCollapsed: boolean;
}

export function AdminSidebar({ onToggle, isCollapsed }: AdminSidebarProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { appIcon, storeName, signOut } = useApp();
  const iconHref = appIcon || DEFAULT_APP_ICON;
  const displayName = storeName.trim() || DEFAULT_STORE_NAME;

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    onToggle(newState);
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handleLogout = async () => {
    try {
      await authApi.signOut();
      signOut();
      toast.success("Berhasil keluar");
      navigate("/");
    } catch {
      toast.error("Gagal keluar");
    }
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        data-collapsed={isCollapsed}
        className={cn(
          "fixed left-0 top-0 z-50 flex h-svh flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 ease-in-out",
          isCollapsed ? "w-[72px]" : "w-64"
        )}
      >
        {/* Header / Logo */}
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
          <Link to="/admin" className="flex items-center gap-3 min-w-0 group">
            <div className="h-9 w-9 shrink-0 rounded-xl bg-gradient-primary overflow-hidden grid place-items-center font-display font-bold text-primary-foreground glow-primary group-hover:scale-105 transition-transform">
              <img src={iconHref} alt="" className="h-full w-full object-cover" />
            </div>
            <span
              className={cn(
                "font-display text-lg font-bold tracking-tight truncate transition-all duration-200",
                isCollapsed && "opacity-0 w-0"
              )}
            >
              {displayName}
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-1">
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
                className="block"
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all cursor-pointer",
                        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                          : "text-sidebar-foreground/70",
                        isCollapsed && "justify-center px-2"
                      )}
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      <span
                        className={cn(
                          "truncate transition-all duration-200",
                          isCollapsed && "opacity-0 w-0 absolute"
                        )}
                      >
                        {item.label}
                      </span>
                    </div>
                  </TooltipTrigger>
                  {isCollapsed && (
                    <TooltipContent side="right" sideOffset={10}>
                      {item.label}
                    </TooltipContent>
                  )}
                </Tooltip>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-3 space-y-1">
          {/* Theme Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className={cn(
                  "w-full justify-start gap-3 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
                  isCollapsed && "justify-center px-2"
                )}
              >
                {theme === "dark" ? (
                  <Sun className="h-5 w-5 shrink-0" />
                ) : (
                  <Moon className="h-5 w-5 shrink-0" />
                )}
                <span
                  className={cn(
                    "truncate transition-all duration-200",
                    isCollapsed && "opacity-0 w-0 absolute"
                  )}
                >
                  {theme === "dark" ? "Mode Terang" : "Mode Gelap"}
                </span>
              </Button>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right" sideOffset={10}>
                {theme === "dark" ? "Mode Terang" : "Mode Gelap"}
              </TooltipContent>
            )}
          </Tooltip>

          {/* Collapse Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSidebar}
                className={cn(
                  "w-full justify-start gap-3 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
                  isCollapsed && "justify-center px-2"
                )}
              >
                {isCollapsed ? (
                  <ChevronRight className="h-5 w-5 shrink-0" />
                ) : (
                  <ChevronLeft className="h-5 w-5 shrink-0" />
                )}
                <span
                  className={cn(
                    "truncate transition-all duration-200",
                    isCollapsed && "opacity-0 w-0 absolute"
                  )}
                >
                  Ciutkan
                </span>
              </Button>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right" sideOffset={10}>
                Perluas Sidebar
              </TooltipContent>
            )}
          </Tooltip>

          {/* Logout Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className={cn(
                  "w-full justify-start gap-3 text-sidebar-foreground/70 hover:text-destructive hover:bg-destructive/10",
                  isCollapsed && "justify-center px-2"
                )}
              >
                <LogOut className="h-5 w-5 shrink-0" />
                <span
                  className={cn(
                    "truncate transition-all duration-200",
                    isCollapsed && "opacity-0 w-0 absolute"
                  )}
                >
                  Keluar
                </span>
              </Button>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right" sideOffset={10}>
                Keluar
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  );
}

// Mobile sidebar trigger button component
export function MobileSidebarTrigger({
  onClick,
}: {
  onClick: () => void;
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className="md:hidden"
      aria-label="Buka menu"
    >
      <PanelLeft className="h-5 w-5" />
    </Button>
  );
}