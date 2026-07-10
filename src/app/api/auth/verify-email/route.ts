import { NextResponse } from "next/server";
import connectMongo from "@/lib/mongodb";
import { User } from "@/models/User";
import { verifyStoredCode } from "@/lib/auth-codes";
import { createToken, setAuthCookie } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: "Email and verification code are required." },
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

    if (user.emailVerified) {
      return NextResponse.json(
        { error: "Email is already verified. Please log in." },
        { status: 400 },
      );
    }

    const result = await verifyStoredCode(
      normalizedEmail,
      "email_verification",
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

    user.emailVerified = true;
    await user.save();

    const token = await createToken(user._id.toString(), user.email);
    await setAuthCookie(token);

    return NextResponse.json({
      user: {
        _id: user._id.toString(),
        email: user.email,
        name: user.name,
        preferences: user.preferences,
      },
    });
  } catch (err) {
    console.error("Verify email error:", err);
    return NextResponse.json(
      { error: "Failed to verify email." },
      { status: 500 },
    );
  }
}
