import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateAdminRequest } from '@/lib/auth';
import { logAuditEvent } from '@/services/audit';
import { serializeBeforeAfter } from '@/lib/validations/content';
import { memoryStore } from '@/lib/memory-store';
import { safeRevalidatePath } from '@/lib/safe-revalidate';

export async function PATCH(
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
  const newFeatured = typeof body.isFeatured === 'boolean' ? body.isFeatured : !existing.isFeatured;

  let updated: any;
  try {
    updated = await prisma.beforeAfter.update({
      where: { id },
      data: { isFeatured: newFeatured },
      include: {
        service: { select: { id: true, title: true, slug: true } },
        hairstyle: { select: { id: true, title: true, slug: true } },
        stylist: { select: { id: true, fullName: true, avatarUrl: true } },
      },
    });
  } catch {
    updated = memoryStore.updateBeforeAfter(id, { isFeatured: newFeatured });
  }

  await logAuditEvent({
    userId: auth.user.id,
    userEmail: auth.user.email,
    userName: auth.user.fullName,
    userRole: auth.user.role.name,
    action: 'STATUS_CHANGE',
    entity: 'BEFORE_AFTER',
    entityId: id,
    details: { field: 'isFeatured', from: existing.isFeatured, to: newFeatured },
    ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
    userAgent: request.headers.get('user-agent'),
  });

  safeRevalidatePath('/before-after');
  safeRevalidatePath('/admin/before-after');
  safeRevalidatePath('/');

  return NextResponse.json(serializeBeforeAfter(updated));
}

export const POST = PATCH;
