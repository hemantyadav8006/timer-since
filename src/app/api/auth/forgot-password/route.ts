import { NextResponse } from "next/server";
import connectMongo from "@/lib/mongodb";
import { User } from "@/models/User";
import { createAndStoreCode, canResendCode } from "@/lib/auth-codes";
import { sendPasswordResetCode } from "@/lib/email";

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

    const successMessage = {
      ok: true,
      message: "If an account exists, a verification code was sent.",
    };

    if (!user) {
      return NextResponse.json(successMessage);
    }

    const resend = await canResendCode(normalizedEmail, "password_reset");
    if (!resend.allowed) {
      return NextResponse.json(
        {
          error: `Please wait ${resend.retryAfterSeconds}s before requesting a new code.`,
        },
        { status: 429 },
      );
    }

    const code = await createAndStoreCode(normalizedEmail, "password_reset");
    await sendPasswordResetCode(normalizedEmail, code);

    return NextResponse.json(successMessage);
  } catch (err) {
    console.error("Forgot password error:", err);
    return NextResponse.json(
      { error: "Failed to process request." },
      { status: 500 },
    );
  }
}
