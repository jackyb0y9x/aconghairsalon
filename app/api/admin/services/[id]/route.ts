import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateAdminRequest } from '@/lib/auth';
import { logAuditEvent } from '@/services/audit';
import { ServiceUpdateSchema, serializeService } from '@/lib/validations/content';
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
  let service: any;
  try {
    service = await prisma.service.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        category: true,
        hairstyles: true,
        combos: true,
      },
    });
  } catch {
    service = memoryStore.findServiceById(id) || memoryStore.services.find((s) => s.slug === id);
  }

  if (!service) {
    return NextResponse.json({ error: 'Service not found' }, { status: 404 });
  }

  return NextResponse.json(serializeService(service));
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
    existing = await prisma.service.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        category: true,
      },
    });
  } catch {
    existing = memoryStore.findServiceById(id) || memoryStore.services.find((s) => s.slug === id);
  }

  if (!existing) {
    return NextResponse.json({ error: 'Service not found' }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const parseResult = ServiceUpdateSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: 'Dữ liệu dịch vụ không hợp lệ', details: parseResult.error.flatten().fieldErrors },
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

  const priceMin = input.priceMin !== undefined ? Number(input.priceMin) : input.minPrice !== undefined ? Number(input.minPrice) : existing.priceMin;
  const priceMax = input.priceMax !== undefined
    ? (input.priceMax !== null ? Number(input.priceMax) : null)
    : input.maxPrice !== undefined
    ? (input.maxPrice !== null ? Number(input.maxPrice) : null)
    : existing.priceMax;

  const updateData: any = {};
  if (title !== undefined) updateData.title = title;
  if (slug !== undefined) updateData.slug = slug;
  if (input.shortSummary !== undefined) updateData.shortSummary = input.shortSummary;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.durationMinutes !== undefined) updateData.durationMinutes = input.durationMinutes;
  updateData.priceMin = priceMin;
  updateData.priceMax = priceMax;
  if (input.preCareAdvice !== undefined) updateData.preCareAdvice = input.preCareAdvice;
  if (input.postCareAdvice !== undefined) updateData.postCareAdvice = input.postCareAdvice;
  if (input.imageUrl !== undefined) updateData.imageUrl = input.imageUrl;
  if (input.isPopular !== undefined) updateData.isPopular = input.isPopular;
  if (input.isActive !== undefined) updateData.isActive = input.isActive;
  if (input.showOnHome !== undefined) updateData.showOnHome = input.showOnHome;
  if (input.displayOrder !== undefined) updateData.displayOrder = input.displayOrder;
  if (input.categoryId !== undefined) updateData.categoryId = input.categoryId;

  let updatedService: any;
  try {
    updatedService = await prisma.service.update({
      where: { id: existing.id },
      data: updateData,
      include: {
        category: true,
      },
    });
  } catch {
    updatedService = memoryStore.updateService(existing.id, updateData);
  }

  await logAuditEvent({
    userId: auth.user.id,
    userEmail: auth.user.email,
    userName: auth.user.fullName,
    userRole: auth.user.role.name,
    action: 'UPDATE',
    entity: 'SERVICE',
    entityId: existing.id,
    details: {
      before: { title: existing.title, priceMin: existing.priceMin },
      after: { title: updatedService.title, priceMin: updatedService.priceMin },
    },
    ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
    userAgent: request.headers.get('user-agent'),
  });

  safeRevalidatePath('/services');
  safeRevalidatePath('/admin/services');
  safeRevalidatePath('/');
  safeRevalidatePath('/booking');

  return NextResponse.json(serializeService(updatedService));
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
    existing = await prisma.service.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
    });
  } catch {
    existing = memoryStore.findServiceById(id) || memoryStore.services.find((s) => s.slug === id);
  }

  if (!existing) {
    return NextResponse.json({ error: 'Service not found' }, { status: 404 });
  }

  try {
    await prisma.service.delete({ where: { id: existing.id } });
  } catch {
    memoryStore.deleteService(existing.id);
  }

  await logAuditEvent({
    userId: auth.user.id,
    userEmail: auth.user.email,
    userName: auth.user.fullName,
    userRole: auth.user.role.name,
    action: 'DELETE',
    entity: 'SERVICE',
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
