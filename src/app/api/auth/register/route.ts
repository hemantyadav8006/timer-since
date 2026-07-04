import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectMongo from "@/lib/mongodb";
import { User } from "@/models/User";
import { createToken, setAuthCookie } from "@/lib/auth";

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

    const existing = await User.findOne({ email: email.toLowerCase() }).lean();
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      email: email.toLowerCase().trim(),
      passwordHash,
      name: name.trim(),
      preferences: { theme: "emerald", language: "en", reducedMotion: false },
    });

    const token = await createToken(user._id.toString(), user.email);
    await setAuthCookie(token);

    return NextResponse.json(
      {
        user: {
          _id: user._id.toString(),
          email: user.email,
          name: user.name,
          preferences: user.preferences,
        },
        token,
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to register." },
      { status: 500 },
    );
  }
}
