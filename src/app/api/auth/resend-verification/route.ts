import { NextResponse } from "next/server";
import connectMongo from "@/lib/mongodb";
import { User } from "@/models/User";
import { createAndStoreCode, canResendCode } from "@/lib/auth-codes";
import { sendVerificationCode } from "@/lib/email";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    await connectMongo();

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user || user.emailVerified) {
      return NextResponse.json({
        ok: true,
        message: "If eligible, a new code was sent.",
      });
    }

    const resend = await canResendCode(normalizedEmail, "email_verification");
    if (!resend.allowed) {
      return NextResponse.json(
        {
          error: `Please wait ${resend.retryAfterSeconds}s before requesting a new code.`,
        },
        { status: 429 },
      );
    }

    const code = await createAndStoreCode(
      normalizedEmail,
      "email_verification",
    );
    await sendVerificationCode(normalizedEmail, code, user.name);

    return NextResponse.json({
      ok: true,
      message: "If eligible, a new code was sent.",
    });
  } catch (err) {
    console.error("Resend verification error:", err);
    return NextResponse.json(
      { error: "Failed to resend verification code." },
      { status: 500 },
    );
  }
}
