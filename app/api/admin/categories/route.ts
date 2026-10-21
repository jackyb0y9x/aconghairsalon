import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateAdminRequest } from '@/lib/auth';
import { logAuditEvent } from '@/services/audit';
import { CategoryCreateSchema, serializeCategory } from '@/lib/validations/content';
import { memoryStore } from '@/lib/memory-store';
import { slugify } from '@/lib/utils';
import { safeRevalidatePath } from '@/lib/safe-revalidate';
import { CategoryType } from '@prisma/client';

export async function GET(request: NextRequest) {
  const auth = await authenticateAdminRequest(request);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') as CategoryType | null;
  const search = searchParams.get('search');

  const where: any = {};
  if (type) {
    where.type = type;
  }
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  let categories: any[] = [];
  try {
    categories = await prisma.category.findMany({
      where,
      orderBy: { displayOrder: 'asc' },
      include: {
        _count: {
          select: {
            hairstyles: true,
            services: true,
            articles: true,
          },
        },
      },
    });
  } catch {
    categories = memoryStore.findCategories();
  }

  return NextResponse.json(categories.map(serializeCategory));
}

export async function POST(request: NextRequest) {
  const auth = await authenticateAdminRequest(request);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  const user = auth.user;
  const body = await request.json().catch(() => ({}));
  const parseResult = CategoryCreateSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: 'Dữ liệu danh mục không hợp lệ', details: parseResult.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const input = parseResult.data;
  const slug = input.slug ? slugify(input.slug) : slugify(input.name);

  let existingSlug: any = null;
  try {
    existingSlug = await prisma.category.findUnique({ where: { slug } });
  } catch {
    existingSlug = memoryStore.categories.find((c) => c.slug === slug);
  }

  if (existingSlug) {
    return NextResponse.json({ error: `Đường dẫn slug "${slug}" đã tồn tại` }, { status: 409 });
  }

  const categoryData = {
    name: input.name,
    slug,
    description: input.description || null,
    type: input.type,
    imageUrl: input.imageUrl || null,
    displayOrder: input.displayOrder,
    isActive: input.isActive,
  };

  let newCategory: any;
  try {
    newCategory = await prisma.category.create({
      data: categoryData,
      include: {
        _count: {
          select: {
            hairstyles: true,
            services: true,
            articles: true,
          },
        },
      },
    });
  } catch {
    newCategory = memoryStore.createCategory(categoryData);
  }

  await logAuditEvent({
    userId: user.id,
    userEmail: user.email,
    userName: user.fullName,
    userRole: user.role.name,
    action: 'CREATE',
    entity: 'CATEGORY',
    entityId: newCategory.id,
    details: { name: newCategory.name, type: newCategory.type, slug: newCategory.slug },
    ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
    userAgent: request.headers.get('user-agent'),
  });

  safeRevalidatePath('/admin/categories');

  return NextResponse.json(serializeCategory(newCategory), { status: 201 });
}
