import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { requireRole } from "../../../lib/apiAuth";
import { handleApiError } from "../../../lib/apiResponse";
import { bookingSchema } from "../../../lib/validation";
import { mapBookingTypeToDb, mapBookingTypeToUi } from "../../../lib/bookingUtils";
import { logAudit } from "../../../lib/audit";

export async function GET() {
  try {
    await requireRole(["administrator", "travel_designer", "sales_agent", "viewer"]);
    const bookings = await prisma.booking.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(
      bookings.map((booking) => ({
        ...booking,
        bookingType: mapBookingTypeToUi(booking.bookingType),
        reservedUntil: booking.reservedUntil?.toISOString().slice(0, 10),
      }))
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireRole(["administrator", "sales_agent"]);
    const payload = bookingSchema.parse(await request.json());
    const created = await prisma.booking.create({
      data: {
        packageId: payload.packageId,
        departureId: payload.departureId ?? null,
        bookingType: mapBookingTypeToDb(payload.bookingType),
        reservedUntil: payload.reservedUntil ? new Date(payload.reservedUntil) : null,
        rooms: payload.rooms,
        paxTotal: payload.paxTotal,
        uploads: payload.uploads,
        payment: payload.payment,
        status: payload.bookingType === "Confirmée" ? "confirmed" : "draft",
      },
    });

    await logAudit({
      entityType: "Booking",
      entityId: created.id,
      action: "create",
      actorId: session.user.id,
      afterJson: created,
    });

    return NextResponse.json(
      {
        ...created,
        bookingType: mapBookingTypeToUi(created.bookingType),
        reservedUntil: created.reservedUntil?.toISOString().slice(0, 10),
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
