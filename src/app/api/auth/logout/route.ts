import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set("flotte-token", "", { path: "/", maxAge: 0 });
  response.cookies.set("flotte-refresh", "", { path: "/", maxAge: 0 });
  return response;
}
