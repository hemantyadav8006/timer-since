import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectMongo from "@/lib/mongodb";
import { User } from "@/models/User";
import { verifyStoredCode, invalidateCodes } from "@/lib/auth-codes";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { email, code, newPassword } = await req.json();

    if (!email || !code || !newPassword) {
      return NextResponse.json(
        { error: "Email, code, and new password are required." },
        { status: 400 },
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 },
      );
    }

    await connectMongo();

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or code." },
        { status: 400 },
      );
    }

    const result = await verifyStoredCode(
      normalizedEmail,
      "password_reset",
      String(code),
    );

    if (!result.ok) {
      return NextResponse.json(
        {
          error: result.error,
          attemptsLeft: result.attemptsLeft,
        },
        { status: 400 },
      );
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();
    await invalidateCodes(normalizedEmail, "password_reset");

    return NextResponse.json({
      ok: true,
      message: "Password updated successfully.",
    });
  } catch (err) {
    console.error("Reset password error:", err);
    return NextResponse.json(
      { error: "Failed to reset password." },
      { status: 500 },
    );
  }
}
