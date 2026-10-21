import React from 'react';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { serializeBooking } from '@/lib/validations/booking';
import { BookingsManagementClient } from '@/components/admin/BookingsManagementClient';
import { DEFAULT_STYLISTS } from '@/lib/public-data';

export const metadata = {
  title: 'Vận Hành Lịch Hẹn | Công Nguyễn Hair Salon CMS',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminBookingsPage() {
  await requireAdmin(['SUPER_ADMIN', 'BOOKING_STAFF']);

  let bookings: any[] = [];
  let stylists: any[] = [];

  try {
    [bookings, stylists] = await Promise.all([
      prisma.booking.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          service: true,
          combo: true,
          hairstyleRef: true,
          hairColorRef: true,
          assignedStylist: true,
        },
      }),
      prisma.user.findMany({
        where: {
          isStylist: true,
          isActive: true,
        },
        select: {
          id: true,
          fullName: true,
          specialties: true,
        },
        orderBy: { fullName: 'asc' },
      }),
    ]);
  } catch (err) {
    console.warn('[Admin Bookings] DB offline, using empty/fallback list');
    bookings = [];
    stylists = DEFAULT_STYLISTS.map((st: any) => ({
      id: st.id,
      fullName: st.name,
      specialties: st.specialties || ['Stylist'],
    }));
  }

  const initialBookings = bookings.map(serializeBooking);

  return (
    <BookingsManagementClient
      initialBookings={initialBookings}
      stylists={stylists}
    />
  );
}
