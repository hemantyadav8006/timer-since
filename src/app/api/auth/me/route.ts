import { NextResponse } from "next/server";
import connectMongo from "@/lib/mongodb";
import { User } from "@/models/User";
import { clearAuthCookie, getCurrentUserId } from "@/lib/auth";

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json(
        { error: "Not authenticated." },
        { status: 401 },
      );
    }

    await connectMongo();
    const user = await User.findById(userId)
      .select("_id email name preferences")
      .lean();

    if (!user) {
      await clearAuthCookie();
      return NextResponse.json({ error: "Session invalid." }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        _id: user._id.toString(),
        email: user.email,
        name: user.name,
        preferences: user.preferences,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to check auth." },
      { status: 500 },
    );
  }
}
