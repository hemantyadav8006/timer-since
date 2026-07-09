import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE_NAME, getUserIdFromToken } from "@/lib/auth-token";
import {
  DASHBOARD_PATH,
  LOGIN_PATH,
  isProtectedApi,
  isPublicPage,
} from "@/lib/auth-routes";

async function isAuthenticated(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const userId = await getUserIdFromToken(token);
  return !!userId;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authed = await isAuthenticated(request);

  if (pathname.startsWith("/api/")) {
    if (isProtectedApi(pathname) && !authed) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      );
    }
    return NextResponse.next();
  }

  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(authed ? DASHBOARD_PATH : LOGIN_PATH, request.url),
    );
  }

  if (pathname === LOGIN_PATH) {
    if (authed) {
      return NextResponse.redirect(new URL(DASHBOARD_PATH, request.url));
    }
    return NextResponse.next();
  }

  const authPages = ["/verify-email", "/forgot-password", "/reset-password"];
  if (authPages.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  if (!isPublicPage(pathname) && !authed) {
    const loginUrl = new URL(LOGIN_PATH, request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
