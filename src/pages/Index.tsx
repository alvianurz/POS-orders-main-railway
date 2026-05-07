import { Navigate } from "react-router-dom";
import { useApp } from "@/lib/store";
import Shop from "./Shop";

export default function Index() {
  const user = useApp((s) => s.user);
  if (user?.role === "admin") return <Navigate to="/admin" replace />;
  return <Shop />;
}
