import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const modelMap: Record<string, unknown> = {
  fishCategories: prisma.fishCategory,
  fishQuality: prisma.fishQuality,
  expenseCategories: prisma.expenseCategory,
};

export async function GET(_request: Request, { params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const model = modelMap[category] as { findMany: (args?: unknown) => Promise<unknown> } | undefined;
  if (!model) return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  const items = await model.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(items);
}

export async function POST(request: Request, { params }: { params: Promise<{ category: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { category } = await params;
  const body = await request.json();

  if (category === "fishCategories") {
    const item = await prisma.fishCategory.create({ data: { name: body.name, defaultUnit: body.defaultUnit, defaultPrice: body.defaultPrice } });
    return NextResponse.json(item, { status: 201 });
  }
  if (category === "fishQuality") {
    const item = await prisma.fishQuality.create({ data: { name: body.name } });
    return NextResponse.json(item, { status: 201 });
  }
  if (category === "expenseCategories") {
    const item = await prisma.expenseCategory.create({ data: { name: body.name } });
    return NextResponse.json(item, { status: 201 });
  }
  return NextResponse.json({ error: "Invalid category" }, { status: 400 });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ category: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { category } = await params;
  const body = await request.json();

  if (category === "fishCategories") {
    await prisma.fishCategory.delete({ where: { id: body.id } });
    return NextResponse.json({ ok: true });
  }
  if (category === "fishQuality") {
    await prisma.fishQuality.delete({ where: { id: body.id } });
    return NextResponse.json({ ok: true });
  }
  if (category === "expenseCategories") {
    await prisma.expenseCategory.delete({ where: { id: body.id } });
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Invalid category" }, { status: 400 });
}
