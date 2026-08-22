import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const boatId = url.searchParams.get("boatId");

  const where: Record<string, unknown> = {};
  if (status && status !== "all") where.status = status;
  if (boatId) where.boatId = boatId;

  const trips = await prisma.trip.findMany({
    where,
    include: { boat: true, _count: { select: { catches: true, expenses: true, sales: true } } },
    orderBy: { departureDate: "desc" },
  });
  return NextResponse.json(trips);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const { crewMembers, ...tripData } = body;

  const trip = await prisma.trip.create({
    data: {
      boatId: tripData.boatId,
      captainName: tripData.captainName,
      departureDate: tripData.departureDate ? new Date(tripData.departureDate) : new Date(),
      expectedReturnDate: tripData.expectedReturnDate ? new Date(tripData.expectedReturnDate) : null,
      crewPaymentMethod: tripData.crewPaymentMethod || "gross",
      notes: tripData.notes,
    },
  });

  if (Array.isArray(crewMembers) && crewMembers.length > 0) {
    await prisma.tripCrew.createMany({
      data: crewMembers.map((c: { crewMemberId: string; paymentType?: string; fixedAmount?: number; percentage?: number }) => ({
        tripId: trip.id,
        crewMemberId: c.crewMemberId,
        paymentType: c.paymentType || "percentage",
        fixedAmount: c.fixedAmount || null,
        percentage: c.percentage || null,
      })),
    });
  }

  if (tripData.boatId) {
    await prisma.boat.update({ where: { id: tripData.boatId }, data: { status: "in_trip" } });
  }

  return NextResponse.json(trip, { status: 201 });
}
