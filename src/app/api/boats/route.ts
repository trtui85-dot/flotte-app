import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const boats = await prisma.boat.findMany({ include: { _count: { select: { trips: true } } }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(boats);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const boat = await prisma.boat.create({ data: { name: body.name, registrationNum: body.registrationNum, captainName: body.captainName, notes: body.notes, status: body.status || "active" } });
  return NextResponse.json(boat, { status: 201 });
}
