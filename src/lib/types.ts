export type Category = string;

export interface Product {
  id: string;
  name: string;
  price: number;
  category: Category;
  image: string;
  stock: number;
  description?: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
}

export type OrderStatus = "Pending" | "Preparing" | "Ready" | "Completed";

export interface Order {
  id: string;
  pickupId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  items: { productId: string; name: string; price: number; quantity: number }[];
  total: number;
  status: OrderStatus;
  createdAt: number;
  paid: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "customer" | "admin";
}
