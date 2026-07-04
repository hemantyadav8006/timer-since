import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectMongo from "@/lib/mongodb";
import { User } from "@/models/User";
import { createToken, setAuthCookie } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 },
      );
    }

    await connectMongo();

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 },
      );
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 },
      );
    }

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
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to log in." },
      { status: 500 },
    );
  }
}
