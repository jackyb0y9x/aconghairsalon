import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CreateBookingSchema, serializeBooking } from '@/lib/validations/booking';
import { memoryStore } from '@/lib/memory-store';
import { logAuditEvent } from '@/services/audit';
import { safeRevalidatePath } from '@/lib/safe-revalidate';
import { BookingStatus } from '@prisma/client';

const inFlightIdempotencyMap = new Map<string, Promise<NextResponse>>();

function generateBookingCode(): string {
  const digits = Math.floor(100000 + Math.random() * 900000).toString();
  return `BK${digits}`;
}

async function getUniqueBookingCode(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = generateBookingCode();
    let existing: any = null;
    try {
      existing = await prisma.booking.findUnique({ where: { bookingCode: code } });
    } catch {
      existing = memoryStore.bookings.find((b) => b.bookingCode === code);
    }
    if (!existing) return code;
  }
  return `BK${Date.now().toString().slice(-6)}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    if (body.timeSlot !== undefined && body.bookingTime === undefined) {
      body.bookingTime = body.timeSlot;
    }
    if (body.bookingTime !== undefined && body.timeSlot === undefined) {
      body.timeSlot = body.bookingTime;
    }

    const parseResult = CreateBookingSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Dữ liệu đặt lịch không hợp lệ',
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const input = parseResult.data;

    const executeCreateBooking = async (): Promise<NextResponse> => {
      // 1. Anti-duplicate submission check (Idempotency Lock)
      if (input.idempotencyKey) {
        let existing: any = null;
        try {
          existing = await prisma.booking.findUnique({
            where: { idempotencyKey: input.idempotencyKey },
            include: {
              service: true,
              combo: true,
              hairstyleRef: true,
              hairColorRef: true,
              assignedStylist: true,
            },
          });
        } catch {
          existing = memoryStore.findBookingByIdempotency(input.idempotencyKey);
        }
        if (existing) {
          return NextResponse.json(serializeBooking(existing), { status: 200 });
        }
      }

      // 2. Generate unique bookingCode matching /^BK\d{6}$/
      const bookingCode = await getUniqueBookingCode();

      const parts = input.bookingDate.split('-').map(Number);
      const bookingDate = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));

      // 3. Resolve service existence if provided
      let serviceId: string | null = null;
      let comboId: string | null = null;

      if (input.serviceId) {
        try {
          const srv = await prisma.service.findFirst({
            where: {
              OR: [{ id: input.serviceId }, { slug: input.serviceId }],
            },
          });
          if (srv) {
            serviceId = srv.id;
          } else {
            const combo = await prisma.serviceCombo.findFirst({
              where: {
                OR: [{ id: input.serviceId }, { slug: input.serviceId }],
              },
            });
            if (combo) {
              comboId = combo.id;
            } else {
              const memSrv = memoryStore.findServiceById(input.serviceId) || memoryStore.services.find((s) => s.slug === input.serviceId);
              if (memSrv) {
                serviceId = memSrv.id;
              } else {
                const memCombo = memoryStore.findComboById(input.serviceId) || memoryStore.combos.find((c) => c.slug === input.serviceId);
                if (memCombo) {
                  comboId = memCombo.id;
                } else {
                  serviceId = input.serviceId;
                }
              }
            }
          }
        } catch {
          const memSrv = memoryStore.findServiceById(input.serviceId) || memoryStore.services.find((s) => s.slug === input.serviceId);
          if (memSrv) {
            serviceId = memSrv.id;
          } else {
            const memCombo = memoryStore.findComboById(input.serviceId) || memoryStore.combos.find((c) => c.slug === input.serviceId);
            if (memCombo) {
              comboId = memCombo.id;
            } else {
              serviceId = input.serviceId;
            }
          }
        }
      }

      // 4. Resolve hairstyleRefId
      let hairstyleRefId: string | null = null;
      if (input.hairstyleId) {
        try {
          const hs = await prisma.hairstyle.findFirst({
            where: {
              OR: [{ id: input.hairstyleId }, { slug: input.hairstyleId }],
            },
          });
          hairstyleRefId = hs ? hs.id : (memoryStore.findHairstyleById(input.hairstyleId)?.id || input.hairstyleId);
        } catch {
          const memHs = memoryStore.findHairstyleById(input.hairstyleId) || memoryStore.hairstyles.find((h) => h.slug === input.hairstyleId);
          hairstyleRefId = memHs ? memHs.id : input.hairstyleId;
        }
      }

      // 5. Resolve hairColorRefId
      let hairColorRefId: string | null = null;
      if (input.hairColorId) {
        try {
          const hc = await prisma.hairColor.findFirst({
            where: {
              OR: [{ id: input.hairColorId }, { code: input.hairColorId }],
            },
          });
          hairColorRefId = hc ? hc.id : (memoryStore.findHairColorById(input.hairColorId)?.id || input.hairColorId);
        } catch {
          const memColor = memoryStore.findHairColorById(input.hairColorId) || memoryStore.hairColors.find((c) => c.code === input.hairColorId);
          hairColorRefId = memColor ? memColor.id : input.hairColorId;
        }
      }

      // 6. Resolve stylist
      let assignedStylistId: string | null = null;
      if (input.stylistId) {
        try {
          const stylist = await prisma.user.findFirst({
            where: {
              id: input.stylistId,
              isStylist: true,
              isActive: true,
            },
          });
          assignedStylistId = stylist ? stylist.id : input.stylistId;
        } catch {
          assignedStylistId = input.stylistId;
        }
      }

      const timeSlot = input.bookingTime || (input as any).timeSlot || '14:30';

      const bookingPayload = {
        bookingCode,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        customerEmail: input.customerEmail || null,
        bookingDate,
        timeSlot,
        serviceId,
        comboId,
        hairstyleRefId,
        hairColorRefId,
        assignedStylistId,
        status: 'PENDING' as BookingStatus,
        notes: input.notes || null,
        idempotencyKey: input.idempotencyKey || null,
      };

      let newBooking: any;
      try {
        newBooking = await prisma.booking.create({
          data: bookingPayload,
          include: {
            service: true,
            combo: true,
            hairstyleRef: true,
            hairColorRef: true,
            assignedStylist: true,
          },
        });
      } catch {
        newBooking = memoryStore.createBooking({
          ...bookingPayload,
          bookingDate: input.bookingDate,
        });
      }

      await logAuditEvent({
        action: 'CREATE',
        entity: 'Booking',
        entityId: newBooking.id,
        details: {
          source: 'PUBLIC_WEBSITE',
          customerName: newBooking.customerName,
          customerPhone: newBooking.customerPhone,
          bookingDate: input.bookingDate,
          timeSlot: input.bookingTime,
        },
        ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
        userAgent: request.headers.get('user-agent'),
      });

      safeRevalidatePath('/admin');
      safeRevalidatePath('/admin/bookings');

      return NextResponse.json(serializeBooking(newBooking), { status: 201 });
    };

    if (input.idempotencyKey) {
      if (inFlightIdempotencyMap.has(input.idempotencyKey)) {
        const inFlightPromise = inFlightIdempotencyMap.get(input.idempotencyKey)!;
        const res = await inFlightPromise;
        return res.clone();
      }

      const creationPromise = executeCreateBooking();
      inFlightIdempotencyMap.set(input.idempotencyKey, creationPromise);
      try {
        const res = await creationPromise;
        return res.clone();
      } finally {
        inFlightIdempotencyMap.delete(input.idempotencyKey);
      }
    }

    return await executeCreateBooking();
  } catch (err: any) {
    // Handle Prisma unique constraint race on idempotencyKey
    if (err?.code === 'P2002' && err?.meta?.target?.includes('idempotencyKey')) {
      const body = await request.clone().json().catch(() => ({}));
      if (body.idempotencyKey) {
        let existing: any = null;
        try {
          existing = await prisma.booking.findUnique({
            where: { idempotencyKey: body.idempotencyKey },
            include: {
              service: true,
              combo: true,
              hairstyleRef: true,
              hairColorRef: true,
              assignedStylist: true,
            },
          });
        } catch {
          existing = memoryStore.findBookingByIdempotency(body.idempotencyKey);
        }
        if (existing) {
          return NextResponse.json(serializeBooking(existing), { status: 200 });
        }
      }
    }

    console.error('Error creating public booking:', err);
    return NextResponse.json(
      { error: err.message || 'Lỗi khi tạo lịch hẹn' },
      { status: 500 }
    );
  }
}
