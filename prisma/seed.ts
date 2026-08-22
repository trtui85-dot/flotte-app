import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const adminCode = await bcrypt.hash("admin123", 10);
  const userCode = await bcrypt.hash("1234", 10);

  await prisma.user.createMany({
    data: [
      { phone: "00000000", code: adminCode, name: "Admin", role: "admin" },
      { phone: "43227748", code: userCode, name: "Capitaine Moulaye", role: "user" },
      { phone: "12345678", code: userCode, name: "Utilisateur Test", role: "user" },
    ],
    skipDuplicates: true,
  });

  // Fish categories
  const [thiof, capVert, criterion, julia, requin] = await Promise.all([
    prisma.fishCategory.create({ data: { name: "الثيوف", defaultUnit: "kg", defaultPrice: 2500 } }),
    prisma.fishCategory.create({ data: { name: "كاب فيرط", defaultUnit: "kg", defaultPrice: 1800 } }),
    prisma.fishCategory.create({ data: { name: "الكريطون", defaultUnit: "kg", defaultPrice: 1200 } }),
    prisma.fishCategory.create({ data: { name: "الجوليا", defaultUnit: "kg", defaultPrice: 900 } }),
    prisma.fishCategory.create({ data: { name: "القرش", defaultUnit: "kg", defaultPrice: 600 } }),
  ]);

  // Fish quality
  const [qualA, qualB, qualC] = await Promise.all([
    prisma.fishQuality.create({ data: { name: "جودة عالية" } }),
    prisma.fishQuality.create({ data: { name: "جودة متوسطة" } }),
    prisma.fishQuality.create({ data: { name: "جودة منخفضة" } }),
  ]);

  // Expense categories
  const [fuel, food, maintenance, port] = await Promise.all([
    prisma.expenseCategory.create({ data: { name: "الوقود" } }),
    prisma.expenseCategory.create({ data: { name: "الطعام" } }),
    prisma.expenseCategory.create({ data: { name: "الصيانة" } }),
    prisma.expenseCategory.create({ data: { name: "رسو الميناء" } }),
  ]);

  // Boats
  const [boat1, boat2] = await Promise.all([
    prisma.boat.create({ data: { name: "ال前景", captainName: "مولاي", registrationNum: "MR-001", status: "active" } }),
    prisma.boat.create({ data: { name: "نجمة الصيد", captainName: "بوبه", registrationNum: "MR-002", status: "active" } }),
  ]);

  // Crew
  const [crew1, crew2, crew3] = await Promise.all([
    prisma.crewMember.create({ data: { name: "أحمد", phone: "43001122" } }),
    prisma.crewMember.create({ data: { name: "محمد", phone: "43003344" } }),
    prisma.crewMember.create({ data: { name: "علي", phone: "43005566" } }),
  ]);

  // Buyers
  const [buyer1, buyer2] = await Promise.all([
    prisma.buyer.create({ data: { name: "محل السمك الكبير", phone: "44001122" } }),
    prisma.buyer.create({ data: { name: "مطعم البحار", phone: "44003344" } }),
  ]);

  // Closed trip
  const trip1 = await prisma.trip.create({
    data: {
      boatId: boat1.id,
      captainName: "مولاي",
      departureDate: new Date("2026-08-10"),
      expectedReturnDate: new Date("2026-08-12"),
      actualReturnDate: new Date("2026-08-12"),
      status: "closed",
      crewPaymentMethod: "gross",
    },
  });

  await prisma.tripCrew.createMany({
    data: [
      { tripId: trip1.id, crewMemberId: crew1.id, paymentType: "percentage", percentage: 10 },
      { tripId: trip1.id, crewMemberId: crew2.id, paymentType: "percentage", percentage: 8 },
    ],
  });

  await prisma.catch.createMany({
    data: [
      { tripId: trip1.id, fishCategoryId: thiof.id, fishQualityId: qualA.id, quantity: 200, unit: "kg", estimatedPrice: 2500 },
      { tripId: trip1.id, fishCategoryId: capVert.id, fishQualityId: qualB.id, quantity: 150, unit: "kg", estimatedPrice: 1800 },
    ],
  });

  await prisma.expense.createMany({
    data: [
      { tripId: trip1.id, expenseCategoryId: fuel.id, amount: 85000, description: "وقود الرحلة" },
      { tripId: trip1.id, expenseCategoryId: food.id, amount: 15000 },
      { tripId: trip1.id, expenseCategoryId: port.id, amount: 5000 },
    ],
  });

  const sale1 = await prisma.sale.create({
    data: { tripId: trip1.id, buyerId: buyer1.id, fishCategoryId: thiof.id, fishQualityId: qualA.id, quantity: 180, salePrice: 3000, totalAmount: 540000 },
  });

  await prisma.payment.create({ data: { saleId: sale1.id, amount: 400000 } });

  await prisma.inventory.upsert({
    where: { fishCategoryId_fishQualityId: { fishCategoryId: thiof.id, fishQualityId: qualA.id } },
    update: { caught: { increment: 200 }, sold: { increment: 180 } },
    create: { fishCategoryId: thiof.id, fishQualityId: qualA.id, caught: 200, sold: 180, unit: "kg" },
  });

  // Active trip
  const trip2 = await prisma.trip.create({
    data: {
      boatId: boat2.id,
      captainName: "بوبه",
      departureDate: new Date("2026-08-20"),
      expectedReturnDate: new Date("2026-08-23"),
      status: "at_sea",
      crewPaymentMethod: "after_expenses",
    },
  });

  await prisma.tripCrew.create({
    data: { tripId: trip2.id, crewMemberId: crew3.id, paymentType: "percentage", percentage: 12 },
  });

  await prisma.setting.createMany({
    data: [
      { key: "companyName", value: "شركة الصيد الموريتانية" },
    ],
    skipDuplicates: true,
  });

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
