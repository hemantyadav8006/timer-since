/**
 * Server-side API route helpers for auth and validation.
 */

import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectMongo from "@/lib/mongodb";
import { getCurrentUserId } from "@/lib/auth";
import { Timer, type TimerDoc } from "@/models/Timer";
import { Entry } from "@/models/Entry";

type OwnedTimer = TimerDoc & { _id: mongoose.Types.ObjectId };

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

export async function requireTimerOwner(
  timerId: string,
  userId: string,
): Promise<{ timer: OwnedTimer } | { error: NextResponse }> {
  await connectMongo();
  const timer = await Timer.findById(timerId).lean();
  if (!timer) {
    return {
      error: NextResponse.json({ error: "Timer not found." }, { status: 404 }),
    };
  }
  if (timer.userId !== userId) {
    return {
      error: NextResponse.json({ error: "Forbidden." }, { status: 403 }),
    };
  }
  return { timer: timer as OwnedTimer };
}

export async function requireEntryOwner(
  entryId: string,
  userId: string,
): Promise<{ entry: Awaited<ReturnType<typeof Entry.findById>> } | { error: NextResponse }> {
  await connectMongo();
  const entry = await Entry.findById(entryId);
  if (!entry) {
    return {
      error: NextResponse.json({ error: "Entry not found." }, { status: 404 }),
    };
  }

  const timer = await Timer.findById(entry.timerId);
  if (!timer || timer.userId !== userId) {
    return {
      error: NextResponse.json({ error: "Forbidden." }, { status: 403 }),
    };
  }

  return { entry };
}

export async function requireTimerIdOwner(
  timerId: string,
  userId: string,
): Promise<{ ok: true } | { error: NextResponse }> {
  const result = await requireTimerOwner(timerId, userId);
  if ("error" in result) return result;
  return { ok: true };
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
