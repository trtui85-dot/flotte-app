import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sales = await prisma.sale.findMany({ where: { tripId: id }, include: { buyer: true, fishCategory: true, fishQuality: true, payments: true }, orderBy: { date: "desc" } });
  return NextResponse.json(sales);
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await request.json();

  const inv = await prisma.inventory.findUnique({
    where: { fishCategoryId_fishQualityId: { fishCategoryId: body.fishCategoryId, fishQualityId: body.fishQualityId } },
  });
  const remaining = (inv?.caught || 0) - (inv?.sold || 0);
  if (body.quantity > remaining) {
    return NextResponse.json({ error: `Insufficient stock (remaining: ${remaining})` }, { status: 400 });
  }

  const sale = await prisma.sale.create({
    data: {
      tripId: id,
      buyerId: body.buyerId,
      fishCategoryId: body.fishCategoryId,
      fishQualityId: body.fishQualityId,
      quantity: body.quantity,
      salePrice: body.salePrice,
      totalAmount: body.quantity * body.salePrice,
    },
  });

  await prisma.inventory.update({
    where: { fishCategoryId_fishQualityId: { fishCategoryId: body.fishCategoryId, fishQualityId: body.fishQualityId } },
    data: { sold: { increment: body.quantity } },
  });

  if (body.paymentAmount && body.paymentAmount > 0) {
    await prisma.payment.create({ data: { saleId: sale.id, amount: body.paymentAmount } });
  }

  return NextResponse.json(sale, { status: 201 });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  if (!body.saleId) return NextResponse.json({ error: "Missing saleId" }, { status: 400 });

  const existing = await prisma.sale.findUnique({ where: { id: body.saleId } });
  if (existing) {
    await prisma.inventory.update({
      where: { fishCategoryId_fishQualityId: { fishCategoryId: existing.fishCategoryId, fishQualityId: existing.fishQualityId } },
      data: { sold: { decrement: existing.quantity } },
    });
    await prisma.payment.deleteMany({ where: { saleId: body.saleId } });
  }
  await prisma.sale.delete({ where: { id: body.saleId } });
  return NextResponse.json({ ok: true });
}
