import { PrismaClient, RoleName, CostLineType, OpsStatus, PackageStatus } from "@prisma/client";
import { hash } from "bcryptjs";
import { mockBookings, mockPackages } from "../src/lib/mockData";

const prisma = new PrismaClient();

const BOOKING_TYPE_MAP: Record<string, "En_option" | "Confirmee"> = {
  "En option": "En_option",
  "Confirmée": "Confirmee",
  "Confirmee": "Confirmee",
};

async function main() {
  const roles = await Promise.all(
    (["administrator", "travel_designer", "sales_agent", "viewer"] as RoleName[]).map((name) =>
      prisma.role.upsert({
        where: { name },
        update: {},
        create: { name },
      })
    )
  );
  const roleMap = new Map(roles.map((role) => [role.name, role.id]));

  const passwordHash = await hash("password", 10);

  const users = [
    { username: "admin", name: "Admin", role: "administrator" as RoleName },
    { username: "designer", name: "Designer", role: "travel_designer" as RoleName },
    { username: "sales", name: "Sales Agent", role: "sales_agent" as RoleName },
    { username: "viewer", name: "Viewer", role: "viewer" as RoleName },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { username: user.username },
      update: {
        name: user.name,
        roleId: roleMap.get(user.role),
      },
      create: {
        username: user.username,
        name: user.name,
        passwordHash,
        roleId: roleMap.get(user.role),
      },
    });
  }

  const destinations = await prisma.destination.createMany({
    data: [
      {
        country: "Portugal",
        city: "Lisbon",
        tags: ["city-break", "culture"],
        seasonality: "spring-summer",
        bestMonths: ["April", "May", "June"],
        segmentFit: "couples, short-breaks",
        riskLevel: "low",
      },
      {
        country: "Algeria",
        city: "Djanet",
        tags: ["adventure", "desert"],
        seasonality: "autumn-winter",
        bestMonths: ["November", "December"],
        segmentFit: "adventure, premium",
        riskLevel: "medium",
      },
    ],
    skipDuplicates: true,
  });

  const destinationList = await prisma.destination.findMany();
  const portugal = destinationList.find((d) => d.country === "Portugal");
  const algeria = destinationList.find((d) => d.country === "Algeria");
  const destinationMap = new Map(destinationList.map((dest) => [dest.country.toLowerCase(), dest.id]));

  if (portugal) {
    await prisma.visaRule.upsert({
      where: { id: "visa-portugal" },
      update: {},
      create: {
        id: "visa-portugal",
        destinationId: portugal.id,
        requirements: { checklist: ["passport valid", "return ticket"] },
        processingDays: 7,
        difficultyScore: 2,
        lastUpdated: new Date(),
      },
    });

    await prisma.event.createMany({
      data: [
        {
          destinationId: portugal.id,
          name: "Lisbon Food Week",
          startDate: new Date("2025-06-10"),
          endDate: new Date("2025-06-17"),
          type: "festival",
          impactScore: 3,
        },
      ],
      skipDuplicates: true,
    });
  }

  if (algeria) {
    await prisma.visaRule.upsert({
      where: { id: "visa-algeria-south" },
      update: {},
      create: {
        id: "visa-algeria-south",
        destinationId: algeria.id,
        requirements: { checklist: ["authorization form", "passport scans"] },
        processingDays: 12,
        difficultyScore: 4,
        lastUpdated: new Date(),
      },
    });
  }

  for (const pkg of mockPackages) {
    const created = await prisma.package.upsert({
      where: { id: pkg.id },
      update: {
        status: pkg.status === "published" ? PackageStatus.published : PackageStatus.draft,
        general: pkg.general,
        flights: pkg.flights,
        accommodations: pkg.accommodations,
        pricing: pkg.pricing,
        agencyCommissions: pkg.agencyCommissions,
        content: pkg.content,
        itinerary: pkg.itinerary,
        metadata: {
          destinationId: destinationMap.get(pkg.flights.destination.toLowerCase()) ?? null,
        },
      },
      create: {
        id: pkg.id,
        status: pkg.status === "published" ? PackageStatus.published : PackageStatus.draft,
        general: pkg.general,
        flights: pkg.flights,
        accommodations: pkg.accommodations,
        pricing: pkg.pricing,
        agencyCommissions: pkg.agencyCommissions,
        content: pkg.content,
        itinerary: pkg.itinerary,
        metadata: {
          destinationId: destinationMap.get(pkg.flights.destination.toLowerCase()) ?? null,
        },
      },
    });

    if (pkg.opsProject?.groups?.length) {
      for (const group of pkg.opsProject.groups) {
        const departure = await prisma.departure.upsert({
          where: { id: group.id },
          update: {
            flightLabel: group.flightLabel,
            airline: group.airline ?? null,
            departureDate: group.departureDate ? new Date(group.departureDate) : null,
            returnDate: group.returnDate ? new Date(group.returnDate) : null,
            status: group.status === "validated" ? OpsStatus.validated : OpsStatus.pending_validation,
            validationDate: group.validationDate ? new Date(group.validationDate) : null,
          },
          create: {
            id: group.id,
            packageId: created.id,
            flightLabel: group.flightLabel,
            airline: group.airline ?? null,
            departureDate: group.departureDate ? new Date(group.departureDate) : null,
            returnDate: group.returnDate ? new Date(group.returnDate) : null,
            status: group.status === "validated" ? OpsStatus.validated : OpsStatus.pending_validation,
            validationDate: group.validationDate ? new Date(group.validationDate) : null,
          },
        });

        for (const supplier of group.suppliers ?? []) {
          const sup = await prisma.supplier.upsert({
            where: { name: supplier.name },
            update: {},
            create: {
              name: supplier.name,
              type: "misc",
            },
          });

          await prisma.supplierLink.create({
            data: {
              supplierId: sup.id,
              departureId: departure.id,
              packageId: created.id,
              notes: supplier.contact ?? null,
              cost: supplier.cost ?? null,
              deadline: supplier.deadline ? new Date(supplier.deadline) : null,
            },
          });
        }

        for (const cost of group.costs ?? []) {
          await prisma.costLine.create({
            data: {
              departureId: departure.id,
              packageId: created.id,
              type: CostLineType.misc,
              label: cost.label,
              amount: cost.amount,
              dueDate: cost.dueDate ? new Date(cost.dueDate) : null,
              paid: Boolean(cost.paid),
            },
          });
        }

        for (const timeline of group.timeline ?? []) {
          await prisma.opsTimelineItem.create({
            data: {
              departureId: departure.id,
              title: timeline.title,
              date: timeline.date ? new Date(timeline.date) : null,
              note: timeline.note ?? null,
              kind: timeline.kind ?? null,
            },
          });
        }
      }
    }
  }

  for (const booking of mockBookings) {
    await prisma.booking.upsert({
      where: { id: booking.id },
      update: {
        packageId: booking.packageId,
        bookingType: BOOKING_TYPE_MAP[booking.bookingType] ?? "En_option",
        reservedUntil: booking.reservedUntil ? new Date(booking.reservedUntil) : null,
        rooms: booking.rooms,
        paxTotal: booking.paxTotal,
        uploads: booking.uploads,
        payment: booking.payment,
        status: booking.bookingType === "Confirmée" ? "confirmed" : "draft",
      },
      create: {
        id: booking.id,
        packageId: booking.packageId,
        bookingType: BOOKING_TYPE_MAP[booking.bookingType] ?? "En_option",
        reservedUntil: booking.reservedUntil ? new Date(booking.reservedUntil) : null,
        rooms: booking.rooms,
        paxTotal: booking.paxTotal,
        uploads: booking.uploads,
        payment: booking.payment,
        status: booking.bookingType === "Confirmée" ? "confirmed" : "draft",
      },
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
