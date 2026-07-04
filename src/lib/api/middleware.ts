/**
 * Server-side API route helpers for auth and validation.
 */

import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";

/**
 * Extracts and verifies the current user. Returns userId or an error response.
 */
export async function requireAuth(): Promise<
  { userId: string } | { error: NextResponse }
> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return {
      error: NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      ),
    };
  }
  return { userId };
}

/**
 * Allowlist-based field picker. Returns a new object containing only
 * the keys present in `allowed`. Prevents mass-assignment attacks.
 */
export function pickFields<T extends Record<string, unknown>>(
  body: T,
  allowed: string[],
): Partial<T> {
  const result: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) {
      result[key] = body[key];
    }
  }
  return result as Partial<T>;
}
