import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Bell, Check } from "lucide-react";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Notification {
  id: string;
  type: "new_order";
  pickupId: string;
  customerName: string;
  total: number;
  read: boolean;
  timestamp: number;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const orders = useApp((s) => s.orders);

  // Listen for new orders from SSE via store
  useEffect(() => {
    // Check for new orders that aren't in our notifications
    const recentOrders = orders
      .filter((o) => o.createdAt > Date.now() - 60000) // Last minute
      .slice(0, 5);

    const newNotifications: Notification[] = recentOrders.map((order) => ({
      id: order.id,
      type: "new_order" as const,
      pickupId: order.pickupId,
      customerName: order.customerName,
      total: order.total,
      read: false,
      timestamp: order.createdAt,
    }));

    if (newNotifications.length > 0) {
      setNotifications((prev) => {
        const existingIds = new Set(prev.map((n) => n.id));
        const fresh = newNotifications.filter((n) => !existingIds.has(n.id));
        return [...fresh, ...prev].slice(0, 20); // Keep last 20
      });
    }
  }, [orders]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    if (diff < 60000) return "Baru saja";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m lalu`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}j lalu`;
    return new Date(timestamp).toLocaleDateString("id-ID");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-4 py-2 border-b">
          <span className="font-semibold">Notifikasi</span>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs h-7">
              <Check className="h-3 w-3 mr-1" />
              Tandai semua
            </Button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Tidak ada notifikasi
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={cn(
                  "flex flex-col items-start gap-1 p-4 cursor-pointer",
                  !notification.read && "bg-primary/5"
                )}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-semibold text-sm">{notification.pickupId}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatTime(notification.timestamp)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Pesanan baru dari <span className="font-medium text-foreground">{notification.customerName}</span>
                </p>
                {!notification.read && (
                  <span className="h-2 w-2 rounded-full bg-primary mt-1" />
                )}
              </DropdownMenuItem>
            ))}
          </div>
        )}

        <div className="border-t p-2">
          <Link to="/admin/orders">
            <Button variant="ghost" className="w-full text-sm">
              Lihat semua pesanan
            </Button>
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}