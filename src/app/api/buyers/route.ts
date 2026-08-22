import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const buyers = await prisma.buyer.findMany({ include: { _count: { select: { sales: true } } }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(buyers);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const buyer = await prisma.buyer.create({ data: { name: body.name, phone: body.phone, notes: body.notes } });
  return NextResponse.json(buyer, { status: 201 });
}
