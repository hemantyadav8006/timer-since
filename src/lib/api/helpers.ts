/**
 * Shared API fetch helpers with consistent error handling.
 */

import { handleAuthFailure } from "@/lib/api/http";

type ApiResult<T> = T | { error: string };

function parseError(data: unknown, status: number): string {
  if (typeof data === "object" && data !== null && "error" in data) {
    return (data as { error: string }).error;
  }
  return `Request failed (${status})`;
}

export async function apiGet<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  const data = (await res.json()) as ApiResult<T>;
  handleAuthFailure(res);
  if (!res.ok || (data && typeof data === "object" && "error" in data)) {
    throw new Error(parseError(data, res.status));
  }
  return data as T;
}

export async function apiPost<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as ApiResult<T>;
  handleAuthFailure(res);
  if (!res.ok || (data && typeof data === "object" && "error" in data)) {
    throw new Error(parseError(data, res.status));
  }
  return data as T;
}

export async function apiPut<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as ApiResult<T>;
  handleAuthFailure(res);
  if (!res.ok || (data && typeof data === "object" && "error" in data)) {
    throw new Error(parseError(data, res.status));
  }
  return data as T;
}

export async function apiDelete<T>(url: string): Promise<T> {
  const res = await fetch(url, { method: "DELETE" });
  const data = (await res.json()) as ApiResult<T>;
  handleAuthFailure(res);
  if (!res.ok || (data && typeof data === "object" && "error" in data)) {
    throw new Error(parseError(data, res.status));
  }
  return data as T;
}
