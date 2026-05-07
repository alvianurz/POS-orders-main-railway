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

const queryClient = new QueryClient();

const App = () => (
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

export default App;
