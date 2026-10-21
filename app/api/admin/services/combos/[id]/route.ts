import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateAdminRequest } from '@/lib/auth';
import { logAuditEvent } from '@/services/audit';
import { ServiceComboUpdateSchema, serializeServiceCombo } from '@/lib/validations/content';
import { memoryStore } from '@/lib/memory-store';
import { slugify } from '@/lib/utils';
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
  let combo: any;
  try {
    combo = await prisma.serviceCombo.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        services: {
          include: {
            category: true,
          },
        },
      },
    });
  } catch {
    combo = memoryStore.findComboById(id) || memoryStore.combos.find((c) => c.slug === id);
  }

  if (!combo) {
    return NextResponse.json({ error: 'Service combo not found' }, { status: 404 });
  }

  return NextResponse.json(serializeServiceCombo(combo));
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
    existing = await prisma.serviceCombo.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        services: true,
      },
    });
  } catch {
    existing = memoryStore.findComboById(id) || memoryStore.combos.find((c) => c.slug === id);
  }

  if (!existing) {
    return NextResponse.json({ error: 'Service combo not found' }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const parseResult = ServiceComboUpdateSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: 'Dữ liệu combo không hợp lệ', details: parseResult.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const input = parseResult.data;
  const title = input.title || input.name;
  let slug = existing.slug;
  if (input.slug) {
    slug = slugify(input.slug);
  } else if (title && title !== existing.title) {
    slug = slugify(title);
  }

  const pkgPrice = input.packagePrice !== undefined ? Number(input.packagePrice) : existing.packagePrice;
  const origPrice = input.originalPrice !== undefined ? Number(input.originalPrice) : existing.originalPrice;
  const savingsPercent =
    input.savingsPercent !== undefined
      ? input.savingsPercent
      : origPrice > 0
      ? Math.round(((origPrice - pkgPrice) / origPrice) * 100)
      : existing.savingsPercent;

  const updateData: any = {};
  if (title !== undefined) updateData.title = title;
  if (slug !== undefined) updateData.slug = slug;
  if (input.description !== undefined) updateData.description = input.description;
  updateData.packagePrice = pkgPrice;
  updateData.originalPrice = origPrice;
  if (input.durationMinutes !== undefined) updateData.durationMinutes = input.durationMinutes;
  updateData.savingsPercent = savingsPercent;
  if (input.imageUrl !== undefined) updateData.imageUrl = input.imageUrl;
  if (input.isActive !== undefined) updateData.isActive = input.isActive;
  if (input.isFeatured !== undefined) updateData.isFeatured = input.isFeatured;
  if (input.displayOrder !== undefined) updateData.displayOrder = input.displayOrder;

  if (input.serviceIds && Array.isArray(input.serviceIds)) {
    updateData.services = {
      set: input.serviceIds.map((srvId) => ({ id: srvId })),
    };
  }

  let updatedCombo: any;
  try {
    updatedCombo = await prisma.serviceCombo.update({
      where: { id: existing.id },
      data: updateData,
      include: {
        services: {
          include: {
            category: true,
          },
        },
      },
    });
  } catch {
    updatedCombo = memoryStore.updateCombo(existing.id, updateData);
  }

  await logAuditEvent({
    userId: auth.user.id,
    userEmail: auth.user.email,
    userName: auth.user.fullName,
    userRole: auth.user.role.name,
    action: 'UPDATE',
    entity: 'SERVICE_COMBO',
    entityId: existing.id,
    details: {
      before: { title: existing.title, packagePrice: existing.packagePrice },
      after: { title: updatedCombo.title, packagePrice: updatedCombo.packagePrice },
    },
    ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
    userAgent: request.headers.get('user-agent'),
  });

  safeRevalidatePath('/services');
  safeRevalidatePath('/admin/services');
  safeRevalidatePath('/');
  safeRevalidatePath('/booking');

  return NextResponse.json(serializeServiceCombo(updatedCombo));
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
    existing = await prisma.serviceCombo.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
    });
  } catch {
    existing = memoryStore.findComboById(id) || memoryStore.combos.find((c) => c.slug === id);
  }

  if (!existing) {
    return NextResponse.json({ error: 'Service combo not found' }, { status: 404 });
  }

  try {
    await prisma.serviceCombo.delete({ where: { id: existing.id } });
  } catch {
    memoryStore.deleteCombo(existing.id);
  }

  await logAuditEvent({
    userId: auth.user.id,
    userEmail: auth.user.email,
    userName: auth.user.fullName,
    userRole: auth.user.role.name,
    action: 'DELETE',
    entity: 'SERVICE_COMBO',
    entityId: existing.id,
    details: { title: existing.title },
    ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
    userAgent: request.headers.get('user-agent'),
  });

  safeRevalidatePath('/services');
  safeRevalidatePath('/admin/services');
  safeRevalidatePath('/');
  safeRevalidatePath('/booking');

  return NextResponse.json({ success: true, id: existing.id });
}
