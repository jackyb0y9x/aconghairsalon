import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateAdminRequest } from '@/lib/auth';
import { logAuditEvent } from '@/services/audit';
import { ServiceComboCreateSchema, serializeServiceCombo } from '@/lib/validations/content';
import { memoryStore } from '@/lib/memory-store';
import { slugify } from '@/lib/utils';
import { safeRevalidatePath } from '@/lib/safe-revalidate';

export async function GET(request: NextRequest) {
  const auth = await authenticateAdminRequest(request);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  let combos: any[] = [];
  try {
    combos = await prisma.serviceCombo.findMany({
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
      include: {
        services: {
          include: {
            category: true,
          },
        },
      },
    });
  } catch {
    combos = memoryStore.findCombos();
  }

  return NextResponse.json(combos.map(serializeServiceCombo));
}

export async function POST(request: NextRequest) {
  const auth = await authenticateAdminRequest(request);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  const user = auth.user;
  const body = await request.json().catch(() => ({}));
  const parseResult = ServiceComboCreateSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: 'Dữ liệu combo không hợp lệ', details: parseResult.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const input = parseResult.data;
  const title = (input.title || input.name || '') as string;
  const slug = slugify(input.slug || title);

  const pkgPrice = Number(input.packagePrice);
  const origPrice = Number(input.originalPrice);
  const savingsPercent =
    input.savingsPercent !== undefined
      ? input.savingsPercent
      : origPrice > 0
      ? Math.round(((origPrice - pkgPrice) / origPrice) * 100)
      : 0;

  const comboData = {
    title,
    slug,
    description: input.description,
    packagePrice: pkgPrice,
    originalPrice: origPrice,
    durationMinutes: input.durationMinutes,
    savingsPercent,
    imageUrl: input.imageUrl || null,
    isActive: input.isActive ?? true,
    isFeatured: input.isFeatured ?? false,
    displayOrder: input.displayOrder ?? 0,
    serviceIds: input.serviceIds,
  };

  let newCombo: any;
  try {
    newCombo = await prisma.serviceCombo.create({
      data: {
        title,
        slug,
        description: input.description,
        packagePrice: pkgPrice,
        originalPrice: origPrice,
        durationMinutes: input.durationMinutes,
        savingsPercent,
        imageUrl: input.imageUrl || null,
        isActive: input.isActive ?? true,
        isFeatured: input.isFeatured ?? false,
        displayOrder: input.displayOrder ?? 0,
        services: {
          connect: input.serviceIds.map((id) => ({ id })),
        },
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
    newCombo = memoryStore.createCombo(comboData);
  }

  await logAuditEvent({
    userId: user.id,
    userEmail: user.email,
    userName: user.fullName,
    userRole: user.role.name,
    action: 'CREATE',
    entity: 'SERVICE_COMBO',
    entityId: newCombo.id,
    details: { title: newCombo.title, packagePrice: pkgPrice, savingsPercent },
    ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
    userAgent: request.headers.get('user-agent'),
  });

  safeRevalidatePath('/services');
  safeRevalidatePath('/admin/services');
  safeRevalidatePath('/');
  safeRevalidatePath('/booking');

  return NextResponse.json(serializeServiceCombo(newCombo), { status: 201 });
}
