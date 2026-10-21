import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateAdminRequest } from '@/lib/auth';
import { logAuditEvent } from '@/services/audit';
import { BeforeAfterUpdateSchema, serializeBeforeAfter } from '@/lib/validations/content';
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
  let item: any;
  try {
    item = await prisma.beforeAfter.findUnique({
      where: { id },
      include: {
        service: { select: { id: true, title: true, slug: true } },
        hairstyle: { select: { id: true, title: true, slug: true } },
        stylist: { select: { id: true, fullName: true, avatarUrl: true } },
      },
    });
  } catch {
    item = memoryStore.findBeforeAfterById(id);
  }

  if (!item) {
    return NextResponse.json({ error: 'Before/After showcase not found' }, { status: 404 });
  }

  return NextResponse.json(serializeBeforeAfter(item));
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
    existing = await prisma.beforeAfter.findUnique({ where: { id } });
  } catch {
    existing = memoryStore.findBeforeAfterById(id);
  }

  if (!existing) {
    return NextResponse.json({ error: 'Before/After showcase not found' }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const parseResult = BeforeAfterUpdateSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: 'Dữ liệu trước/sau không hợp lệ', details: parseResult.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const input = parseResult.data;
  const updateData = {
    title: input.title !== undefined ? input.title : existing.title,
    description: input.description !== undefined ? input.description : existing.description,
    beforeImageUrl: input.beforeImageUrl !== undefined ? input.beforeImageUrl : existing.beforeImageUrl,
    afterImageUrl: input.afterImageUrl !== undefined ? input.afterImageUrl : existing.afterImageUrl,
    customerGender: input.customerGender !== undefined ? input.customerGender : existing.customerGender,
    serviceId: input.serviceId !== undefined ? input.serviceId : existing.serviceId,
    hairstyleId: input.hairstyleId !== undefined ? input.hairstyleId : existing.hairstyleId,
    stylistId: input.stylistId !== undefined ? input.stylistId : existing.stylistId,
    isFeatured: input.isFeatured !== undefined ? input.isFeatured : existing.isFeatured,
    displayOrder: input.displayOrder !== undefined ? input.displayOrder : existing.displayOrder,
  };

  let updated: any;
  try {
    updated = await prisma.beforeAfter.update({
      where: { id },
      data: updateData,
      include: {
        service: { select: { id: true, title: true, slug: true } },
        hairstyle: { select: { id: true, title: true, slug: true } },
        stylist: { select: { id: true, fullName: true, avatarUrl: true } },
      },
    });
  } catch {
    updated = memoryStore.updateBeforeAfter(id, updateData);
  }

  await logAuditEvent({
    userId: auth.user.id,
    userEmail: auth.user.email,
    userName: auth.user.fullName,
    userRole: auth.user.role.name,
    action: 'UPDATE',
    entity: 'BEFORE_AFTER',
    entityId: id,
    details: {
      before: { title: existing.title, isFeatured: existing.isFeatured },
      after: { title: updated.title, isFeatured: updated.isFeatured },
    },
    ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
    userAgent: request.headers.get('user-agent'),
  });

  safeRevalidatePath('/before-after');
  safeRevalidatePath('/admin/before-after');
  safeRevalidatePath('/');

  return NextResponse.json(serializeBeforeAfter(updated));
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
    existing = await prisma.beforeAfter.findUnique({ where: { id } });
  } catch {
    existing = memoryStore.findBeforeAfterById(id);
  }

  if (!existing) {
    return NextResponse.json({ error: 'Before/After showcase not found' }, { status: 404 });
  }

  try {
    await prisma.beforeAfter.delete({ where: { id } });
  } catch {
    memoryStore.deleteBeforeAfter(id);
  }

  await logAuditEvent({
    userId: auth.user.id,
    userEmail: auth.user.email,
    userName: auth.user.fullName,
    userRole: auth.user.role.name,
    action: 'DELETE',
    entity: 'BEFORE_AFTER',
    entityId: id,
    details: { title: existing.title },
    ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
    userAgent: request.headers.get('user-agent'),
  });

  safeRevalidatePath('/before-after');
  safeRevalidatePath('/admin/before-after');
  safeRevalidatePath('/');

  return NextResponse.json({ success: true, id });
}
