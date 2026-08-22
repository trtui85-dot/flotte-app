import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const settings = await prisma.setting.findMany();
  const obj: Record<string, string> = {};
  settings.forEach((s: { key: string; value: string }) => { obj[s.key] = s.value; });
  return NextResponse.json(obj);
}

export async function PUT(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();

  for (const [key, value] of Object.entries(body)) {
    await prisma.setting.upsert({ where: { key }, update: { value: String(value) }, create: { key, value: String(value) } });
  }

  return NextResponse.json({ ok: true });
}
