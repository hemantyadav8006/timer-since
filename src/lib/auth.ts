import { cookies } from "next/headers";
import {
  AUTH_COOKIE_NAME,
  createToken,
  verifyToken,
  getUserIdFromToken,
} from "@/lib/auth-token";

export { createToken, verifyToken, AUTH_COOKIE_NAME };

export async function setAuthCookie(token: string) {
  const jar = await cookies();
  jar.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60,
    path: "/",
  });
}

export async function clearAuthCookie() {
  const jar = await cookies();
  jar.set(AUTH_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
}

export async function getCurrentUserId(): Promise<string | null> {
  const jar = await cookies();
  return getUserIdFromToken(jar.get(AUTH_COOKIE_NAME)?.value);
}
