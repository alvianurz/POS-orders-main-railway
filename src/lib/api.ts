import type { User } from "./types";

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
