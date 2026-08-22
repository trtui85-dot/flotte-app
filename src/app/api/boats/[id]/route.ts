import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const boat = await prisma.boat.findUnique({
    where: { id },
    include: {
      trips: { orderBy: { departureDate: "desc" }, include: { _count: { select: { catches: true, expenses: true, sales: true } } } },
    },
  });
  if (!boat) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(boat);
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await request.json();
  const boat = await prisma.boat.update({ where: { id }, data: body });
  return NextResponse.json(boat);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await prisma.boat.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
