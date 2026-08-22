import { NextResponse } from "next/server";
import { verifyToken, signAccessToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const store = await cookies();
    const refreshToken = store.get("flotte-refresh")?.value;
    if (!refreshToken) return NextResponse.json({ error: "No refresh token" }, { status: 401 });

    const payload = verifyToken(refreshToken);
    if (!payload) return NextResponse.json({ error: "Invalid refresh token" }, { status: 401 });

    const newPayload = { userId: payload.userId, phone: payload.phone, name: payload.name, role: payload.role };
    const accessToken = signAccessToken(newPayload);

    const response = NextResponse.json({ user: newPayload, accessToken });
    response.cookies.set("flotte-token", accessToken, {
      httpOnly: true, path: "/", sameSite: "lax", secure: true, maxAge: 900,
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
