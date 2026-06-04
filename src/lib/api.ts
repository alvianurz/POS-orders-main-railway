import type { User, Customer, Order } from "./types";
import type { CartItem, OrderStatus, Product } from "./types";

export type CatalogState = {
  products: Product[];
  categories: string[];
  storeName: string;
  appIcon: string | null;
  isStoreOpen: boolean;
};

type AuthResponse = {
  user: User | null;
  message?: string;
};

async function requestAuth(path: string, options: RequestInit = {}) {
  const response = await fetch(path, {
    credentials: "include",
    headers: { "content-type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const data = (await response.json()) as AuthResponse;
  if (!response.ok) throw new Error(data.message || "Permintaan gagal.");
  return data;
}

export const authApi = {
  session: () => requestAuth("/api/auth/session"),
  signIn: (email: string, password: string) =>
    requestAuth("/api/auth/signin", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  register: (payload: { name: string; phone: string; email: string; password: string }) =>
    requestAuth("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  signOut: () =>
    requestAuth("/api/auth/signout", {
      method: "POST",
      body: JSON.stringify({}),
    }),
};

async function requestCatalog<T>(path: string, options: RequestInit = {}) {
  const response = await fetch(path, {
    cache: "no-store",
    headers: { "content-type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const data = (await response.json()) as T & { message?: string };
  if (!response.ok) throw new Error(data.message || "Permintaan gagal.");
  return data;
}

export const catalogApi = {
  get: () => requestCatalog<CatalogState>("/api/catalog"),
  bootstrap: (payload: CatalogState) =>
    requestCatalog<CatalogState>("/api/catalog/bootstrap", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  save: (payload: CatalogState) =>
    requestCatalog<CatalogState>("/api/catalog", {
      method: "PUT",
      body: JSON.stringify(payload),
      credentials: "include",
    }),
};

async function requestOrders<T>(path: string, options: RequestInit = {}) {
  const response = await fetch(path, {
    cache: "no-store",
    credentials: "include",
    headers: { "content-type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const data = (await response.json()) as T & { message?: string };
  if (!response.ok) throw new Error(data.message || "Permintaan gagal.");
  return data;
}

export const orderApi = {
  list: () => requestOrders<{ orders: Order[] }>("/api/orders"),
  create: (payload: { items: CartItem[] }) =>
    requestOrders<{ order: Order; catalog: CatalogState }>("/api/orders", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  update: (id: string, payload: { status?: OrderStatus; paid?: boolean; items?: Array<{ productId: string; checked: boolean }> }) =>
    requestOrders<{ order: Order }>("/api/orders/" + encodeURIComponent(id), {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
};

async function requestCustomers<T>(path: string, options: RequestInit = {}) {
  const response = await fetch(path, {
    cache: "no-store",
    credentials: "include",
    headers: { "content-type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const data = (await response.json()) as T & { message?: string };
  if (!response.ok) throw new Error(data.message || "Permintaan gagal.");
  return data;
}

export const customerApi = {
  list: () => requestCustomers<{ customers: Customer[] }>("/api/customers"),
  get: (id: string) =>
    requestCustomers<{ customer: Customer; orders: Order[] }>(
      "/api/customers/" + encodeURIComponent(id)
    ),
};
