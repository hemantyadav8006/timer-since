import type { UserItem, UserApiResponse, AuthCheckResponse } from "@/types/timer";

export async function register(
  email: string,
  password: string,
  name: string,
): Promise<UserItem> {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name }),
  });
  const data = (await res.json()) as UserApiResponse;
  if (!res.ok || "error" in data) {
    throw new Error("error" in data ? data.error : "Failed to register.");
  }
  return data.user;
}

export async function login(
  email: string,
  password: string,
): Promise<UserItem> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = (await res.json()) as UserApiResponse;
  if (!res.ok || "error" in data) {
    throw new Error("error" in data ? data.error : "Failed to log in.");
  }
  return data.user;
}

export async function logout(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST" });
}

export async function checkAuth(): Promise<UserItem | null> {
  try {
    const res = await fetch("/api/auth/me", { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as AuthCheckResponse;
    if ("error" in data) return null;
    return data.user;
  } catch {
    return null;
  }
}
