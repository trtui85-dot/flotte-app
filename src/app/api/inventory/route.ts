import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const inventory = await prisma.inventory.findMany({ include: { fishCategory: true, fishQuality: true }, orderBy: { updatedAt: "desc" } });
  return NextResponse.json(inventory);
}
