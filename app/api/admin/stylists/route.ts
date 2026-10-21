import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateAdminRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const auth = await authenticateAdminRequest(request);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  const stylists = await prisma.user.findMany({
    where: {
      isStylist: true,
      isActive: true,
    },
    select: {
      id: true,
      fullName: true,
      phone: true,
      avatarUrl: true,
      specialties: true,
      experienceYears: true,
      bio: true,
    },
    orderBy: { fullName: 'asc' },
  });

  return NextResponse.json(stylists);
}
