import { NextResponse } from "next/server";
import { clearAuthCookie } from "@/lib/auth";

export async function POST() {
  try {
    await clearAuthCookie();
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Failed to log out." }, { status: 500 });
  }
}
