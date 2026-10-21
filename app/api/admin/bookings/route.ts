import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateAdminRequest } from '@/lib/auth';
import { serializeBooking } from '@/lib/validations/booking';
import { memoryStore } from '@/lib/memory-store';
import { BookingStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  const auth = await authenticateAdminRequest(request);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get('status');
  const search = searchParams.get('search');
  const date = searchParams.get('date');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const stylistId = searchParams.get('stylistId');
  const format = searchParams.get('format');
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10)));
  const skip = (page - 1) * pageSize;

  const where: any = {};

  if (statusParam && statusParam !== 'ALL') {
    where.status = statusParam as BookingStatus;
  }

  if (search) {
    where.OR = [
      { customerName: { contains: search, mode: 'insensitive' } },
      { customerPhone: { contains: search, mode: 'insensitive' } },
      { bookingCode: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (date) {
    const parts = date.split('-').map(Number);
    where.bookingDate = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  } else if (startDate || endDate) {
    where.bookingDate = {};
    if (startDate) {
      const parts = startDate.split('-').map(Number);
      where.bookingDate.gte = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    }
    if (endDate) {
      const parts = endDate.split('-').map(Number);
      where.bookingDate.lte = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    }
  }

  if (stylistId) {
    where.assignedStylistId = stylistId;
  }

  let total = 0;
  let pendingCount = 0;
  let bookings: any[] = [];

  try {
    const [t, pc, b] = await Promise.all([
      prisma.booking.count({ where }),
      prisma.booking.count({ where: { status: 'PENDING' } }),
      prisma.booking.findMany({
        where,
        orderBy: [{ bookingDate: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: pageSize,
        include: {
          service: true,
          combo: true,
          hairstyleRef: true,
          hairColorRef: true,
          assignedStylist: true,
        },
      }),
    ]);
    total = t;
    pendingCount = pc;
    bookings = b;
  } catch {
    bookings = memoryStore.findBookings();
    total = bookings.length;
    pendingCount = bookings.filter((x) => x.status === 'PENDING').length;
  }

  const serializedList = bookings.map(serializeBooking);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (format === 'paginated') {
    return NextResponse.json({
      bookings: serializedList,
      pagination: {
        total,
        page,
        pageSize,
        totalPages,
      },
      stats: {
        pendingCount,
      },
    });
  }

  return NextResponse.json(serializedList, {
    headers: {
      'X-Total-Count': total.toString(),
      'X-Page': page.toString(),
      'X-Page-Size': pageSize.toString(),
      'X-Total-Pages': totalPages.toString(),
      'X-Pending-Count': pendingCount.toString(),
    },
  });
}
