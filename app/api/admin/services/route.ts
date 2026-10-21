import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateAdminRequest } from '@/lib/auth';
import { logAuditEvent } from '@/services/audit';
import { ServiceCreateSchema, serializeService } from '@/lib/validations/content';
import { memoryStore } from '@/lib/memory-store';
import { slugify } from '@/lib/utils';
import { safeRevalidatePath } from '@/lib/safe-revalidate';

async function getOrCreateServiceCategory(categoryNameOrId?: string): Promise<string> {
  try {
    if (categoryNameOrId) {
      // Check if it's a UUID
      const byId = await prisma.category.findUnique({ where: { id: categoryNameOrId } });
      if (byId) return byId.id;

      // Check by name or slug
      const byName = await prisma.category.findFirst({
        where: {
          type: 'SERVICE',
          OR: [
            { name: { equals: categoryNameOrId, mode: 'insensitive' } },
            { slug: { equals: slugify(categoryNameOrId), mode: 'insensitive' } },
          ],
        },
      });
      if (byName) return byName.id;

      // Create new category with this name
      const created = await prisma.category.create({
        data: {
          name: categoryNameOrId,
          slug: slugify(categoryNameOrId) + '-' + Math.floor(100 + Math.random() * 900),
          type: 'SERVICE',
          description: `Dịch vụ chuyên biệt ${categoryNameOrId}`,
        },
      });
      return created.id;
    }

    // Default fallback
    const firstServiceCat = await prisma.category.findFirst({
      where: { type: 'SERVICE' },
    });
    if (firstServiceCat) return firstServiceCat.id;

    const createdDefault = await prisma.category.create({
      data: {
        name: 'Dịch Vụ Tạo Kiểu',
        slug: 'dich-vu-tao-kieu',
        type: 'SERVICE',
        description: 'Các dịch vụ chăm sóc và tạo mẫu tóc chuyên nghiệp',
      },
    });
    return createdDefault.id;
  } catch {
    return 'cat-default';
  }
}

export async function GET(request: NextRequest) {
  const auth = await authenticateAdminRequest(request);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search');
  const categoryId = searchParams.get('categoryId');
  const isActive = searchParams.get('isActive');
  const isPopular = searchParams.get('isPopular');

  const where: any = {};
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { shortSummary: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (categoryId) where.categoryId = categoryId;
  if (isActive !== null && isActive !== undefined && isActive !== '') {
    where.isActive = isActive === 'true';
  }
  if (isPopular !== null && isPopular !== undefined && isPopular !== '') {
    where.isPopular = isPopular === 'true';
  }

  let services: any[] = [];
  try {
    services = await prisma.service.findMany({
      where,
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
      include: {
        category: true,
        hairstyles: true,
        combos: true,
      },
    });
  } catch {
    services = memoryStore.findServices();
  }

  return NextResponse.json(services.map(serializeService));
}

export async function POST(request: NextRequest) {
  const auth = await authenticateAdminRequest(request);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  const user = auth.user;
  const body = await request.json().catch(() => ({}));
  const parseResult = ServiceCreateSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: 'Dữ liệu dịch vụ không hợp lệ', details: parseResult.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const input = parseResult.data;
  const title = (input.title || input.name || '') as string;
  const slug = slugify(input.slug || title);

  const categoryId = await getOrCreateServiceCategory(input.categoryId || input.category);

  const priceMin = input.priceMin !== undefined ? Number(input.priceMin) : input.minPrice !== undefined ? Number(input.minPrice) : 0;
  const priceMax = input.priceMax !== undefined && input.priceMax !== null
    ? Number(input.priceMax)
    : input.maxPrice !== undefined && input.maxPrice !== null
    ? Number(input.maxPrice)
    : null;

  const serviceData = {
    title,
    slug,
    shortSummary: input.shortSummary || null,
    description: input.description,
    durationMinutes: input.durationMinutes,
    priceMin,
    priceMax,
    preCareAdvice: input.preCareAdvice || null,
    postCareAdvice: input.postCareAdvice || null,
    imageUrl: input.imageUrl || null,
    isPopular: input.isPopular ?? false,
    isActive: input.isActive ?? true,
    displayOrder: input.displayOrder ?? 0,
    categoryId,
  };

  let newService: any;
  try {
    newService = await prisma.service.create({
      data: serviceData,
      include: {
        category: true,
      },
    });
  } catch {
    newService = memoryStore.createService(serviceData);
  }

  await logAuditEvent({
    userId: user.id,
    userEmail: user.email,
    userName: user.fullName,
    userRole: user.role.name,
    action: 'CREATE',
    entity: 'SERVICE',
    entityId: newService.id,
    details: { title: newService.title, priceMin, durationMinutes: newService.durationMinutes },
    ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
    userAgent: request.headers.get('user-agent'),
  });

  safeRevalidatePath('/services');
  safeRevalidatePath('/admin/services');
  safeRevalidatePath('/');

  return NextResponse.json(serializeService(newService), { status: 201 });
}
