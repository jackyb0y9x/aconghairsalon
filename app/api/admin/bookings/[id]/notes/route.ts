import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateAdminRequest } from '@/lib/auth';
import { logAuditEvent } from '@/services/audit';
import { serializeBooking } from '@/lib/validations/booking';
import { memoryStore } from '@/lib/memory-store';
import { safeRevalidatePath } from '@/lib/safe-revalidate';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await authenticateAdminRequest(request);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  const { id } = params;
  const body = await request.json().catch(() => ({}));
  const internalNotes = body.internalNotes !== undefined ? body.internalNotes : body.notes;

  if (internalNotes && typeof internalNotes === 'string' && internalNotes.length > 1000) {
    return NextResponse.json(
      { error: 'Ghi chú nội bộ tối đa 1000 ký tự' },
      { status: 400 }
    );
  }

  let existing: any;
  try {
    existing = await prisma.booking.findFirst({
      where: {
        OR: [{ id }, { bookingCode: id }],
      },
    });
  } catch {
    existing = memoryStore.findBookingById(id) || memoryStore.bookings.find((b) => b.bookingCode === id);
  }

  if (!existing) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }

  let updatedBooking: any;
  try {
    updatedBooking = await prisma.booking.update({
      where: { id: existing.id },
      data: { internalNotes: internalNotes || null },
      include: {
        service: true,
        combo: true,
        hairstyleRef: true,
        hairColorRef: true,
        assignedStylist: true,
      },
    });
  } catch {
    updatedBooking = memoryStore.updateBooking(existing.id, { internalNotes: internalNotes || null });
  }

  await logAuditEvent({
    userId: auth.user.id,
    userEmail: auth.user.email,
    userName: auth.user.fullName,
    userRole: auth.user.role.name,
    action: 'UPDATE',
    entity: 'Booking',
    entityId: existing.id,
    details: {
      action: 'UPDATE_INTERNAL_NOTES',
      notesSnippet: internalNotes ? internalNotes.substring(0, 50) : '',
    },
    ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
    userAgent: request.headers.get('user-agent'),
  });

  safeRevalidatePath('/admin');
  safeRevalidatePath('/admin/bookings');

  return NextResponse.json(serializeBooking(updatedBooking));
}
