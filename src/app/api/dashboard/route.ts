import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const [totalBoats, activeTrips, completedTrips, allSales, allExpenses, recentTrips, inventory] = await Promise.all([
    prisma.boat.count(),
    prisma.trip.count({ where: { status: { in: ["preparing", "at_sea", "returned"] } } }),
    prisma.trip.count({ where: { status: "closed" } }),
    prisma.sale.aggregate({ _sum: { totalAmount: true } }),
    prisma.expense.aggregate({ _sum: { amount: true } }),
    prisma.trip.findMany({ take: 5, orderBy: { departureDate: "desc" }, include: { boat: true } }),
    prisma.inventory.findMany({ include: { fishCategory: true, fishQuality: true } }),
  ]);

  const totalRevenue = allSales._sum.totalAmount || 0;
  const totalExpenses = allExpenses._sum.amount || 0;
  const netProfit = totalRevenue - totalExpenses;

  const allPayments = await prisma.payment.aggregate({ _sum: { amount: true } });
  const totalCrewPayments = allPayments._sum.amount || 0;

  const unsoldStockValue = inventory.reduce((sum: number, inv: { caught: number; sold: number }) => {
    const remaining = inv.caught - inv.sold;
    return sum + remaining * 0;
  }, 0);

  const outstandingDebt = 0;

  return NextResponse.json({
    totalBoats,
    activeTrips,
    completedTrips,
    totalRevenue,
    totalExpenses,
    totalCrewPayments,
    netProfit,
    unsoldStockValue,
    outstandingDebt,
    recentTrips,
  });
}
