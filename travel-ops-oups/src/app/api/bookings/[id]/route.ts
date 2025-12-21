import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { requireRole } from "../../../../lib/apiAuth";
import { handleApiError } from "../../../../lib/apiResponse";
import { mapBookingTypeToDb, mapBookingTypeToUi } from "../../../../lib/bookingUtils";
import { logAudit } from "../../../../lib/audit";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    await requireRole(["administrator", "travel_designer", "sales_agent", "viewer"]);
    const booking = await prisma.booking.findUnique({ where: { id: id } });
    if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({
      ...booking,
      bookingType: mapBookingTypeToUi(booking.bookingType),
      reservedUntil: booking.reservedUntil?.toISOString().slice(0, 10),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const session = await requireRole(["administrator", "sales_agent"]);
    const payload = (await request.json()) as {
      bookingType?: string;
      reservedUntil?: string | null;
      rooms?: unknown;
      paxTotal?: number;
      uploads?: unknown;
      payment?: unknown;
    };
    const existing = await prisma.booking.findUnique({ where: { id: id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const updated = await prisma.booking.update({
      where: { id: id },
      data: {
        bookingType: payload.bookingType ? mapBookingTypeToDb(payload.bookingType) : undefined,
        reservedUntil:
          payload.reservedUntil === null ? null : payload.reservedUntil ? new Date(payload.reservedUntil) : undefined,
        rooms: payload.rooms ?? undefined,
        paxTotal: payload.paxTotal ?? undefined,
        uploads: payload.uploads ?? undefined,
        payment: payload.payment ?? undefined,
      },
    });

    await logAudit({
      entityType: "Booking",
      entityId: updated.id,
      action: "update",
      actorId: session.user.id,
      beforeJson: existing,
      afterJson: updated,
    });

    return NextResponse.json({
      ...updated,
      bookingType: mapBookingTypeToUi(updated.bookingType),
      reservedUntil: updated.reservedUntil?.toISOString().slice(0, 10),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const session = await requireRole(["administrator", "sales_agent"]);
    const existing = await prisma.booking.findUnique({ where: { id: id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await prisma.booking.delete({ where: { id: id } });
    await logAudit({
      entityType: "Booking",
      entityId: id,
      action: "delete",
      actorId: session.user.id,
      beforeJson: existing,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}


