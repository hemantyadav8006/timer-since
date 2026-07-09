export const LOGIN_PATH = "/login";
export const DASHBOARD_PATH = "/dashboard";

export const PUBLIC_PAGE_PREFIXES = [LOGIN_PATH, "/share"];

export const PUBLIC_API_PREFIXES = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout",
  "/api/share",
];

export const PROTECTED_API_PREFIXES = [
  "/api/timers",
  "/api/entries",
  "/api/analytics",
  "/api/export",
];

export function isPublicPage(pathname: string): boolean {
  return PUBLIC_PAGE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function isProtectedApi(pathname: string): boolean {
  return PROTECTED_API_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function isPublicApi(pathname: string): boolean {
  return (
    pathname.startsWith("/api/auth/") ||
    PUBLIC_API_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    )
  );
}
