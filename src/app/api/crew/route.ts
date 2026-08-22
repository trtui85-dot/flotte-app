import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const crew = await prisma.crewMember.findMany({ include: { _count: { select: { tripCrews: true } } }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(crew);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const member = await prisma.crewMember.create({ data: { name: body.name, phone: body.phone, notes: body.notes } });
  return NextResponse.json(member, { status: 201 });
}
