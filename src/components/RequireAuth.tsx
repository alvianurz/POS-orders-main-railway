import { Navigate } from "react-router-dom";
import { useApp } from "@/lib/store";

export function RequireAuth({ children, admin }: { children: JSX.Element; admin?: boolean }) {
  const user = useApp((s) => s.user);
  if (!user) return <Navigate to="/auth" replace />;
  if (admin && user.role !== "admin") return <Navigate to="/" replace />;
  return children;
}
