import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectMongo from "@/lib/mongodb";
import { User } from "@/models/User";
import { createAndStoreCode, canResendCode } from "@/lib/auth-codes";
import { sendVerificationCode } from "@/lib/email";

export const runtime = "nodejs";

async function sendVerificationEmail(
  email: string,
  name: string,
): Promise<NextResponse | null> {
  const resend = await canResendCode(email, "email_verification");
  if (!resend.allowed) {
    return NextResponse.json(
      {
        error: `Please wait ${resend.retryAfterSeconds}s before requesting a new code.`,
      },
      { status: 429 },
    );
  }

  const code = await createAndStoreCode(email, "email_verification");
  await sendVerificationCode(email, code, name);
  return null;
}

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Email, password, and name are required." },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 },
      );
    }

    await connectMongo();

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });

    if (existing) {
      if (existing.emailVerified) {
        return NextResponse.json(
          { error: "An account with this email already exists." },
          { status: 409 },
        );
      }

      existing.passwordHash = await bcrypt.hash(password, 12);
      existing.name = name.trim();
      await existing.save();

      const emailError = await sendVerificationEmail(
        normalizedEmail,
        existing.name,
      );
      if (emailError) return emailError;

      return NextResponse.json({
        needsVerification: true,
        email: normalizedEmail,
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      email: normalizedEmail,
      passwordHash,
      name: name.trim(),
      emailVerified: false,
      preferences: { theme: "emerald", language: "en", reducedMotion: false },
    });

    const emailError = await sendVerificationEmail(normalizedEmail, user.name);
    if (emailError) return emailError;

    return NextResponse.json(
      { needsVerification: true, email: normalizedEmail },
      { status: 201 },
    );
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json(
      { error: "Failed to register." },
      { status: 500 },
    );
  }
}
