import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateAdminRequest } from '@/lib/auth';
import { serializeBooking } from '@/lib/validations/booking';
import { memoryStore } from '@/lib/memory-store';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await authenticateAdminRequest(request);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  const { id } = params;
  let booking: any;
  try {
    booking = await prisma.booking.findFirst({
      where: {
        OR: [{ id }, { bookingCode: id }],
      },
      include: {
        service: true,
        combo: true,
        hairstyleRef: true,
        hairColorRef: true,
        assignedStylist: true,
      },
    });
  } catch {
    booking = memoryStore.findBookingById(id) || memoryStore.bookings.find((b) => b.bookingCode === id);
  }

  if (!booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }

  let auditHistory: any[] = [];
  try {
    auditHistory = await prisma.auditLog.findMany({
      where: {
        entityType: 'Booking',
        entityId: booking.id,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  } catch {
    auditHistory = [];
  }

  const serialized = serializeBooking(booking);

  return NextResponse.json({
    ...serialized,
    auditHistory: auditHistory.map((log) => ({
      id: log.id,
      action: log.action,
      actorName: log.actorName,
      actorRole: log.actorRole,
      details: log.details,
      createdAt: log.createdAt ? new Date(log.createdAt).toISOString() : new Date().toISOString(),
    })),
  });
}
