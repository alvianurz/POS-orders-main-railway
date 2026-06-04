import React, { useEffect, useRef, useCallback } from "react";
import { useApp } from "@/lib/store";
import { toast } from "sonner";

interface Notification {
  type: "connected" | "new_order" | "order_update";
  role?: string;
  order?: {
    id: string;
    pickupId: string;
    customerName: string;
    total: number;
    itemCount: number;
  };
  orderId?: string;
  pickupId?: string;
  customerEmail?: string;
  status?: string;
  previousStatus?: string;
}

export function useNotifications() {
  const eventSourceRef = useRef<EventSource | null>(null);
  const { user, orders, refreshOrders } = useApp();

  const connect = useCallback(() => {
    if (!user || eventSourceRef.current) return;

    const eventSource = new EventSource("/api/notifications/stream", {
      withCredentials: true,
    });

    eventSource.onmessage = (event) => {
      try {
        const notification: Notification = JSON.parse(event.data);

        switch (notification.type) {
          case "connected":
            console.log("SSE connected as", notification.role);
            break;

          case "new_order":
            // Show toast notification for admin
            if (user.role === "admin") {
              toast.success(
                <div className="flex flex-col gap-1">
                  <span className="font-bold">Pesanan baru!</span>
                  <span className="text-sm font-normal">
                    {notification.order?.pickupId} - {notification.order?.customerName}
                  </span>
                </div>,
                { duration: 5000 }
              );
              // Refresh orders to update the list
              refreshOrders();
            }
            break;

          case "order_update":
            // For customers - show status update toast
            if (user.role === "customer") {
              const statusMessages: Record<string, string> = {
                Pending: "Pesanan sedang menunggu",
                Preparing: "Pesanan sedang diproses",
                Ready: "Pesanan siap diambil!",
                Completed: "Pesanan telah selesai",
              };
              const message = statusMessages[notification.status || ""] || "Status pesanan diperbarui";
              toast.success(
                <div className="flex flex-col gap-1">
                  <span className="font-bold">{notification.pickupId}</span>
                  <span className="text-sm font-normal">{message}</span>
                </div>,
                { duration: 5000 }
              );
              // Refresh orders
              refreshOrders();
            }
            break;
        }
      } catch (err) {
        console.error("Failed to parse notification:", err);
      }
    };

    eventSource.onerror = () => {
      console.error("SSE connection error, reconnecting...");
      eventSource.close();
      eventSourceRef.current = null;
      // Reconnect after 3 seconds
      setTimeout(connect, 3000);
    };

    eventSourceRef.current = eventSource;
  }, [user, refreshOrders]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (user) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [user, connect, disconnect]);

  return { connect, disconnect };
}