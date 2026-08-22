import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const expenses = await prisma.expense.findMany({ where: { tripId: id }, include: { expenseCategory: true }, orderBy: { date: "desc" } });
  return NextResponse.json(expenses);
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await request.json();
  const expense = await prisma.expense.create({
    data: {
      tripId: id,
      expenseCategoryId: body.expenseCategoryId,
      amount: body.amount,
      date: body.date ? new Date(body.date) : new Date(),
      description: body.description,
    },
  });
  return NextResponse.json(expense, { status: 201 });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  if (!body.expenseId) return NextResponse.json({ error: "Missing expenseId" }, { status: 400 });
  await prisma.expense.delete({ where: { id: body.expenseId } });
  return NextResponse.json({ ok: true });
}
