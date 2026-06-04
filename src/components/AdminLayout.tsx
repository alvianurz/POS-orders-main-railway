import { ReactNode, useState, useEffect } from "react";
import { AdminSidebar, MobileSidebarTrigger } from "./AdminSidebar";
import { MobileAdminSidebar } from "./MobileAdminSidebar";
import { NotificationBell } from "./NotificationBell";
import { cn } from "@/lib/utils";

interface AdminLayoutProps {
  children: ReactNode;
  className?: string;
}

export function AdminLayout({ children, className }: AdminLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

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

  return (
    <div className="min-h-svh bg-background">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <AdminSidebar
          isCollapsed={isCollapsed}
          onToggle={setIsCollapsed}
        />
      )}

      {/* Mobile Sidebar */}
      {isMobile && (
        <MobileAdminSidebar
          open={isMobileOpen}
          onClose={() => setIsMobileOpen(false)}
        />
      )}

      {/* Main Content */}
      <main
        className={cn(
          "min-h-svh transition-all duration-300",
          !isMobile && (isCollapsed ? "ml-[72px]" : "ml-64"),
          className
        )}
      >
        {/* Mobile Header with hamburger */}
        {isMobile && (
          <header className="sticky top-0 z-40 border-b border-border/70 bg-background/92 backdrop-blur-xl">
            <div className="flex h-14 items-center justify-between gap-2 px-4">
              <div className="flex items-center gap-2">
                <MobileSidebarTrigger onClick={() => setIsMobileOpen(true)} />
                <span className="font-display font-bold text-sm">Admin Dashboard</span>
              </div>
              <NotificationBell />
            </div>
          </header>
        )}
        {children}
      </main>
    </div>
  );
}
