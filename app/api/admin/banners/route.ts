import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateAdminRequest } from '@/lib/auth';
import { logAuditEvent } from '@/services/audit';
import { BannerCreateSchema, serializeBanner } from '@/lib/validations/content';
import { memoryStore } from '@/lib/memory-store';
import { safeRevalidatePath } from '@/lib/safe-revalidate';

export async function GET(request: NextRequest) {
  const auth = await authenticateAdminRequest(request);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search');
  const active = searchParams.get('active');

  const where: any = {};
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { subtitle: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (active !== null && active !== undefined && active !== '') {
    where.isActive = active === 'true';
  }

  let banners: any[] = [];
  try {
    banners = await prisma.banner.findMany({
      where,
      orderBy: { displayOrder: 'asc' },
    });
  } catch {
    banners = memoryStore.findBanners(where);
  }

  return NextResponse.json(banners.map(serializeBanner));
}

export async function POST(request: NextRequest) {
  const auth = await authenticateAdminRequest(request);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  const user = auth.user;
  const body = await request.json().catch(() => ({}));
  const parseResult = BannerCreateSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: 'Dữ liệu banner không hợp lệ', details: parseResult.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const input = parseResult.data;
  const activeStatus = input.isActive ?? input.active ?? true;
  const orderNum = input.displayOrder ?? input.order ?? 0;
  const link = input.linkUrl ?? input.ctaLink ?? '/';

  const bannerData = {
    title: input.title,
    subtitle: input.subtitle || null,
    badgeText: input.badgeText || null,
    imageUrl: input.imageUrl,
    mobileImageUrl: input.mobileImageUrl || null,
    linkUrl: link,
    ctaText: input.ctaText || 'Khám phá ngay',
    displayOrder: orderNum,
    isActive: activeStatus,
    startDate: input.startDate ? new Date(input.startDate) : null,
    endDate: input.endDate ? new Date(input.endDate) : null,
  };

  let newBanner: any;
  try {
    newBanner = await prisma.banner.create({
      data: bannerData,
    });
  } catch {
    newBanner = memoryStore.createBanner(bannerData);
  }

  await logAuditEvent({
    userId: user.id,
    userEmail: user.email,
    userName: user.fullName,
    userRole: user.role.name,
    action: 'CREATE',
    entity: 'BANNER',
    entityId: newBanner.id,
    details: { title: newBanner.title, displayOrder: newBanner.displayOrder },
    ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
    userAgent: request.headers.get('user-agent'),
  });

  safeRevalidatePath('/');
  safeRevalidatePath('/admin/banners');

  return NextResponse.json(serializeBanner(newBanner), { status: 201 });
}
