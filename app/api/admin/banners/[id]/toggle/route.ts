import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateAdminRequest } from '@/lib/auth';
import { logAuditEvent } from '@/services/audit';
import { serializeBanner } from '@/lib/validations/content';
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
    existing = await prisma.banner.findUnique({ where: { id } });
  } catch {
    existing = memoryStore.findBannerById(id);
  }

  if (!existing) {
    return NextResponse.json({ error: 'Banner not found' }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const newActive = typeof body.isActive === 'boolean' ? body.isActive : !existing.isActive;

  let updated: any;
  try {
    updated = await prisma.banner.update({
      where: { id },
      data: { isActive: newActive },
    });
  } catch {
    updated = memoryStore.updateBanner(id, { isActive: newActive });
  }

  await logAuditEvent({
    userId: auth.user.id,
    userEmail: auth.user.email,
    userName: auth.user.fullName,
    userRole: auth.user.role.name,
    action: 'STATUS_CHANGE',
    entity: 'BANNER',
    entityId: id,
    details: { field: 'isActive', from: existing.isActive, to: newActive },
    ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
    userAgent: request.headers.get('user-agent'),
  });

  safeRevalidatePath('/');
  safeRevalidatePath('/admin/banners');

  return NextResponse.json(serializeBanner(updated));
}

export const POST = PATCH;
