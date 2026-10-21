import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateAdminRequest } from '@/lib/auth';
import { logAuditEvent } from '@/services/audit';
import { BannerUpdateSchema, serializeBanner } from '@/lib/validations/content';
import { memoryStore } from '@/lib/memory-store';
import { safeRevalidatePath } from '@/lib/safe-revalidate';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await authenticateAdminRequest(request);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  const { id } = params;
  let banner: any;
  try {
    banner = await prisma.banner.findUnique({ where: { id } });
  } catch {
    banner = memoryStore.findBannerById(id);
  }

  if (!banner) {
    return NextResponse.json({ error: 'Banner not found' }, { status: 404 });
  }

  return NextResponse.json(serializeBanner(banner));
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await authenticateAdminRequest(request);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  const { id } = params;
  let existing: any;
  try {
    existing = await prisma.banner.findUnique({ where: { id } });
  } catch {
    existing = memoryStore.findBannerById(id);
  }

  if (!existing) {
    return NextResponse.json({ error: 'Banner not found' }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const parseResult = BannerUpdateSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: 'Dữ liệu cập nhật không hợp lệ', details: parseResult.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const input = parseResult.data;
  const activeStatus = input.isActive ?? input.active ?? existing.isActive;
  const orderNum = input.displayOrder ?? input.order ?? existing.displayOrder;
  const link = input.linkUrl ?? input.ctaLink ?? existing.linkUrl;

  const updateData = {
    title: input.title !== undefined ? input.title : existing.title,
    subtitle: input.subtitle !== undefined ? input.subtitle : existing.subtitle,
    badgeText: input.badgeText !== undefined ? input.badgeText : existing.badgeText,
    imageUrl: input.imageUrl !== undefined ? input.imageUrl : existing.imageUrl,
    mobileImageUrl: input.mobileImageUrl !== undefined ? input.mobileImageUrl : existing.mobileImageUrl,
    linkUrl: link,
    ctaText: input.ctaText !== undefined ? input.ctaText : existing.ctaText,
    displayOrder: orderNum,
    isActive: activeStatus,
    startDate: input.startDate !== undefined ? (input.startDate ? new Date(input.startDate) : null) : existing.startDate,
    endDate: input.endDate !== undefined ? (input.endDate ? new Date(input.endDate) : null) : existing.endDate,
  };

  let updatedBanner: any;
  try {
    updatedBanner = await prisma.banner.update({
      where: { id },
      data: updateData,
    });
  } catch {
    updatedBanner = memoryStore.updateBanner(id, updateData);
  }

  await logAuditEvent({
    userId: auth.user.id,
    userEmail: auth.user.email,
    userName: auth.user.fullName,
    userRole: auth.user.role.name,
    action: 'UPDATE',
    entity: 'BANNER',
    entityId: id,
    details: {
      before: { title: existing.title, displayOrder: existing.displayOrder, isActive: existing.isActive },
      after: { title: updatedBanner.title, displayOrder: updatedBanner.displayOrder, isActive: updatedBanner.isActive },
    },
    ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
    userAgent: request.headers.get('user-agent'),
  });

  safeRevalidatePath('/');
  safeRevalidatePath('/admin/banners');

  return NextResponse.json(serializeBanner(updatedBanner));
}

export const PATCH = PUT;

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await authenticateAdminRequest(request);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  const { id } = params;
  let existing: any;
  try {
    existing = await prisma.banner.findUnique({ where: { id } });
  } catch {
    existing = memoryStore.findBannerById(id);
  }

  if (!existing) {
    return NextResponse.json({ error: 'Banner not found' }, { status: 404 });
  }

  try {
    await prisma.banner.delete({ where: { id } });
  } catch {
    memoryStore.deleteBanner(id);
  }

  await logAuditEvent({
    userId: auth.user.id,
    userEmail: auth.user.email,
    userName: auth.user.fullName,
    userRole: auth.user.role.name,
    action: 'DELETE',
    entity: 'BANNER',
    entityId: id,
    details: { title: existing.title },
    ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
    userAgent: request.headers.get('user-agent'),
  });

  safeRevalidatePath('/');
  safeRevalidatePath('/admin/banners');

  return NextResponse.json({ success: true, id });
}
