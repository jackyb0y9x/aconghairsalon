import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateAdminRequest } from '@/lib/auth';
import { logAuditEvent } from '@/services/audit';
import { BeforeAfterCreateSchema, serializeBeforeAfter } from '@/lib/validations/content';
import { memoryStore } from '@/lib/memory-store';
import { safeRevalidatePath } from '@/lib/safe-revalidate';
import { GenderTarget } from '@prisma/client';

export async function GET(request: NextRequest) {
  const auth = await authenticateAdminRequest(request);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search');
  const serviceId = searchParams.get('serviceId');
  const hairstyleId = searchParams.get('hairstyleId');
  const gender = searchParams.get('gender') as GenderTarget | null;
  const isFeatured = searchParams.get('isFeatured');

  const where: any = {};
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (serviceId) where.serviceId = serviceId;
  if (hairstyleId) where.hairstyleId = hairstyleId;
  if (gender) where.customerGender = gender;
  if (isFeatured !== null && isFeatured !== undefined && isFeatured !== '') {
    where.isFeatured = isFeatured === 'true';
  }

  let items: any[] = [];
  try {
    items = await prisma.beforeAfter.findMany({
      where,
      orderBy: [{ isFeatured: 'desc' }, { displayOrder: 'asc' }, { createdAt: 'desc' }],
      include: {
        service: { select: { id: true, title: true, slug: true } },
        hairstyle: { select: { id: true, title: true, slug: true } },
        stylist: { select: { id: true, fullName: true, avatarUrl: true } },
      },
    });
  } catch {
    items = memoryStore.findBeforeAfters();
  }

  return NextResponse.json(items.map(serializeBeforeAfter));
}

export async function POST(request: NextRequest) {
  const auth = await authenticateAdminRequest(request);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  const user = auth.user;
  const body = await request.json().catch(() => ({}));
  const parseResult = BeforeAfterCreateSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: 'Dữ liệu trước/sau không hợp lệ', details: parseResult.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const input = parseResult.data;
  const baData = {
    title: input.title,
    description: input.description || null,
    beforeImageUrl: input.beforeImageUrl,
    afterImageUrl: input.afterImageUrl,
    customerGender: (input.customerGender as GenderTarget) || 'UNISEX',
    serviceId: input.serviceId || null,
    hairstyleId: input.hairstyleId || null,
    stylistId: input.stylistId || null,
    isFeatured: input.isFeatured ?? false,
    displayOrder: input.displayOrder ?? 0,
  };

  let created: any;
  try {
    created = await prisma.beforeAfter.create({
      data: baData,
      include: {
        service: { select: { id: true, title: true, slug: true } },
        hairstyle: { select: { id: true, title: true, slug: true } },
        stylist: { select: { id: true, fullName: true, avatarUrl: true } },
      },
    });
  } catch {
    created = memoryStore.createBeforeAfter(baData);
  }

  await logAuditEvent({
    userId: user.id,
    userEmail: user.email,
    userName: user.fullName,
    userRole: user.role.name,
    action: 'CREATE',
    entity: 'BEFORE_AFTER',
    entityId: created.id,
    details: { title: created.title, serviceId: created.serviceId, stylistId: created.stylistId },
    ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
    userAgent: request.headers.get('user-agent'),
  });

  safeRevalidatePath('/before-after');
  safeRevalidatePath('/admin/before-after');
  safeRevalidatePath('/');

  return NextResponse.json(serializeBeforeAfter(created), { status: 201 });
}
