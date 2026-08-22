import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const trip = await prisma.trip.findUnique({
    where: { id },
    include: {
      boat: true,
      tripCrews: { include: { crewMember: true } },
      catches: { include: { fishCategory: true, fishQuality: true } },
      expenses: { include: { expenseCategory: true } },
      sales: { include: { buyer: true, fishCategory: true, fishQuality: true, payments: true } },
    },
  });
  if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(trip);
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await request.json();

  const data: Record<string, unknown> = {};
  if (body.status) data.status = body.status;
  if (body.captainName !== undefined) data.captainName = body.captainName;
  if (body.notes !== undefined) data.notes = body.notes;
  if (body.actualReturnDate) data.actualReturnDate = new Date(body.actualReturnDate);

  if (body.status === "closed") {
    data.actualReturnDate = data.actualReturnDate || new Date();
    const trip = await prisma.trip.findUnique({ where: { id }, select: { boatId: true } });
    if (trip?.boatId) {
      await prisma.boat.update({ where: { id: trip.boatId }, data: { status: "active" } });
    }
  }

  if (body.status === "at_sea") {
    const trip = await prisma.trip.findUnique({ where: { id }, select: { boatId: true } });
    if (trip?.boatId) {
      await prisma.boat.update({ where: { id: trip.boatId }, data: { status: "in_trip" } });
    }
  }

  const trip = await prisma.trip.update({ where: { id }, data });
  return NextResponse.json(trip);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const trip = await prisma.trip.findUnique({ where: { id }, select: { boatId: true } });
  await prisma.trip.delete({ where: { id } });
  if (trip?.boatId) {
    await prisma.boat.update({ where: { id: trip.boatId }, data: { status: "active" } });
  }
  return NextResponse.json({ ok: true });
}
