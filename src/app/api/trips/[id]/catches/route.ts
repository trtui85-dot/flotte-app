import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const catches = await prisma.catch.findMany({ where: { tripId: id }, include: { fishCategory: true, fishQuality: true }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(catches);
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await request.json();

  const catchItem = await prisma.catch.create({
    data: {
      tripId: id,
      fishCategoryId: body.fishCategoryId,
      fishQualityId: body.fishQualityId,
      quantity: body.quantity,
      unit: body.unit || "kg",
      estimatedPrice: body.estimatedPrice || null,
    },
  });

  await prisma.inventory.upsert({
    where: { fishCategoryId_fishQualityId: { fishCategoryId: body.fishCategoryId, fishQualityId: body.fishQualityId } },
    update: { caught: { increment: body.quantity } },
    create: { fishCategoryId: body.fishCategoryId, fishQualityId: body.fishQualityId, caught: body.quantity, sold: 0, unit: body.unit || "kg" },
  });

  return NextResponse.json(catchItem, { status: 201 });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  if (!body.catchId) return NextResponse.json({ error: "Missing catchId" }, { status: 400 });

  const existing = await prisma.catch.findUnique({ where: { id: body.catchId } });
  if (existing) {
    await prisma.inventory.update({
      where: { fishCategoryId_fishQualityId: { fishCategoryId: existing.fishCategoryId, fishQualityId: existing.fishQualityId } },
      data: { caught: { decrement: existing.quantity } },
    });
  }
  await prisma.catch.delete({ where: { id: body.catchId } });
  return NextResponse.json({ ok: true });
}
