import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateAdminRequest } from '@/lib/auth';
import { logAuditEvent } from '@/services/audit';
import { serializeBooking, UpdateBookingStatusSchema } from '@/lib/validations/booking';
import { validateBookingTransition } from '@/lib/booking-state-machine';
import { memoryStore } from '@/lib/memory-store';
import { safeRevalidatePath } from '@/lib/safe-revalidate';
import { BookingStatus } from '@prisma/client';

const VALID_BOOKING_STATUSES: BookingStatus[] = [
  'PENDING',
  'CONFIRMED',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
];

async function handleStatusUpdate(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await authenticateAdminRequest(request);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  const { id } = params;
  const body = await request.json().catch(() => ({}));

  // TC2.19: Invalid booking status strings are strictly rejected with HTTP 400
  if (!body || !body.status || !VALID_BOOKING_STATUSES.includes(body.status)) {
    return NextResponse.json(
      { error: `Invalid status: ${body?.status || 'missing'}` },
      { status: 400 }
    );
  }

  const parseResult = UpdateBookingStatusSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: 'Dữ liệu trạng thái không hợp lệ', details: parseResult.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const input = parseResult.data;
  const targetStatus = input.status as BookingStatus;

  let existing: any;
  try {
    existing = await prisma.booking.findFirst({
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
    existing = memoryStore.findBookingById(id) || memoryStore.bookings.find((b) => b.bookingCode === id);
  }

  if (!existing) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }

  // Finite State Machine check
  const reasonOrNotes = input.cancellationReason || input.notes || input.internalNotes;
  const transitionCheck = validateBookingTransition(existing.status, targetStatus, reasonOrNotes);
  if (!transitionCheck.isValid) {
    return NextResponse.json({ error: transitionCheck.errorMessage }, { status: 400 });
  }

  let finalStylistId = existing.assignedStylistId;
  if (input.assignedStylistId !== undefined && input.assignedStylistId !== null) {
    finalStylistId = input.assignedStylistId;
  }

  const finalNotes = input.internalNotes !== undefined && input.internalNotes !== null
    ? input.internalNotes
    : existing.internalNotes;

  const finalReason = targetStatus === 'CANCELLED'
    ? (input.cancellationReason || input.notes || existing.cancellationReason)
    : existing.cancellationReason;

  const updateData = {
    status: targetStatus,
    assignedStylistId: finalStylistId,
    internalNotes: finalNotes,
    cancellationReason: finalReason,
  };

  let updatedBooking: any;
  try {
    updatedBooking = await prisma.booking.update({
      where: { id: existing.id },
      data: updateData,
      include: {
        service: true,
        combo: true,
        hairstyleRef: true,
        hairColorRef: true,
        assignedStylist: true,
      },
    });
  } catch {
    updatedBooking = memoryStore.updateBooking(existing.id, updateData);
  }

  await logAuditEvent({
    userId: auth.user.id,
    userEmail: auth.user.email,
    userName: auth.user.fullName,
    userRole: auth.user.role.name,
    action: 'STATUS_CHANGE',
    entity: 'Booking',
    entityId: existing.id,
    details: {
      previousStatus: existing.status,
      newStatus: targetStatus,
      stylistId: updatedBooking.assignedStylistId,
      internalNotes: updatedBooking.internalNotes,
      cancellationReason: updatedBooking.cancellationReason,
      customerName: existing.customerName,
      customerPhone: existing.customerPhone,
      bookingDate: existing.bookingDate,
      timeSlot: existing.timeSlot,
    },
    ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
    userAgent: request.headers.get('user-agent'),
  });

  safeRevalidatePath('/admin');
  safeRevalidatePath('/admin/bookings');

  return NextResponse.json(serializeBooking(updatedBooking));
}

export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  return handleStatusUpdate(request, context);
}

export async function PATCH(
  request: NextRequest,
  context: { params: { id: string } }
) {
  return handleStatusUpdate(request, context);
}
