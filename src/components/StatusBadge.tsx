import type { OrderStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const map: Record<OrderStatus, { label: string; cls: string }> = {
  Pending: { label: "Menunggu", cls: "bg-muted text-muted-foreground" },
  Preparing: { label: "Diproses", cls: "bg-warning/15 text-[hsl(var(--warning))]" },
  Ready: { label: "Siap", cls: "bg-primary/20 text-primary animate-pulse-glow" },
  Completed: { label: "Selesai", cls: "bg-success/15 text-[hsl(var(--success))]" },
};

export default function StatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  const s = map[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
        s.cls,
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {s.label}
    </span>
  );
}
