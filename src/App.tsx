import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Auth from "./pages/Auth.tsx";
import Cart from "./pages/Cart.tsx";
import MyOrders from "./pages/MyOrders.tsx";
import OrderDetail from "./pages/OrderDetail.tsx";
import AdminDashboard from "./pages/admin/Dashboard.tsx";
import AdminProducts from "./pages/admin/Products.tsx";
import AdminOrders from "./pages/admin/Orders.tsx";
import AdminSettings from "./pages/admin/Settings.tsx";
import { RequireAuth } from "./components/RequireAuth.tsx";
import { authApi, catalogApi, orderApi } from "./lib/api.ts";
import { useApp } from "./lib/store.ts";

const queryClient = new QueryClient();

const App = () => {
  const setUser = useApp((s) => s.setUser);
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        const [session, catalog] = await Promise.all([authApi.session(), catalogApi.get()]);
        if (!alive) return;
        const local = useApp.getState();
        setUser(session.user);
        if (session.user) {
          const orderData = await orderApi.list();
          if (!alive) return;
          useApp.getState().hydrateOrders(orderData.orders);
        } else {
          useApp.getState().hydrateOrders([]);
        }
        if (catalog.products.length === 0 && local.products.length > 0) {
          const bootstrap = await catalogApi.bootstrap({
            products: local.products,
            categories: local.categories,
            storeName: local.storeName,
            appIcon: local.appIcon,
            isStoreOpen: local.isStoreOpen,
          });
          if (!alive) return;
          useApp.getState().hydrateCatalog(bootstrap);
        } else {
          useApp.getState().hydrateCatalog(catalog);
        }
      } catch {
        if (!alive) return;
        setUser(null);
      } finally {
        if (alive) setSessionChecked(true);
      }
    };

    load();

    const timer = window.setInterval(() => {
      const state = useApp.getState();
      void catalogApi.get().then((catalog) => {
        if (!alive) return;
        useApp.getState().hydrateCatalog(catalog);
      }).catch(() => undefined);
      if (state.user) {
        void orderApi.list().then((data) => {
          if (!alive) return;
          useApp.getState().hydrateOrders(data.orders);
        }).catch(() => undefined);
      }
    }, 15000);

    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, [setUser]);

  if (!sessionChecked) {
    return (
      <div className="min-h-screen grid place-items-center bg-background text-muted-foreground">
        Memuat sesi...
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/cart" element={<RequireAuth><Cart /></RequireAuth>} />
            <Route path="/orders" element={<RequireAuth><MyOrders /></RequireAuth>} />
            <Route path="/orders/:id" element={<RequireAuth><OrderDetail /></RequireAuth>} />
            <Route path="/admin" element={<RequireAuth admin><AdminDashboard /></RequireAuth>} />
            <Route path="/admin/products" element={<RequireAuth admin><AdminProducts /></RequireAuth>} />
            <Route path="/admin/orders" element={<RequireAuth admin><AdminOrders /></RequireAuth>} />
            <Route path="/admin/settings" element={<RequireAuth admin><AdminSettings /></RequireAuth>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
