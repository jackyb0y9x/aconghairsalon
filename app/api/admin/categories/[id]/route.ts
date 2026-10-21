import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateAdminRequest } from '@/lib/auth';
import { logAuditEvent } from '@/services/audit';
import { CategoryUpdateSchema, serializeCategory } from '@/lib/validations/content';
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
  let category: any;
  try {
    category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { hairstyles: true, services: true, articles: true },
        },
      },
    });
  } catch {
    category = memoryStore.findCategoryById(id);
  }

  if (!category) {
    return NextResponse.json({ error: 'Category not found' }, { status: 404 });
  }

  return NextResponse.json(serializeCategory(category));
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
    existing = await prisma.category.findUnique({ where: { id } });
  } catch {
    existing = memoryStore.findCategoryById(id);
  }

  if (!existing) {
    return NextResponse.json({ error: 'Category not found' }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const parseResult = CategoryUpdateSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: 'Dữ liệu danh mục không hợp lệ', details: parseResult.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const input = parseResult.data;
  let finalSlug = existing.slug;
  if (input.slug && input.slug !== existing.slug) {
    finalSlug = slugify(input.slug);
    let slugConflict: any = null;
    try {
      slugConflict = await prisma.category.findFirst({
        where: { slug: finalSlug, id: { not: id } },
      });
    } catch {
      slugConflict = memoryStore.categories.find((c) => c.slug === finalSlug && c.id !== id);
    }
    if (slugConflict) {
      return NextResponse.json({ error: `Đường dẫn slug "${finalSlug}" đã tồn tại` }, { status: 409 });
    }
  }

  const updateData = {
    name: input.name !== undefined ? input.name : existing.name,
    slug: finalSlug,
    description: input.description !== undefined ? input.description : existing.description,
    type: input.type !== undefined ? input.type : existing.type,
    imageUrl: input.imageUrl !== undefined ? input.imageUrl : existing.imageUrl,
    displayOrder: input.displayOrder !== undefined ? input.displayOrder : existing.displayOrder,
    isActive: input.isActive !== undefined ? input.isActive : existing.isActive,
  };

  let updatedCategory: any;
  try {
    updatedCategory = await prisma.category.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: { hairstyles: true, services: true, articles: true },
        },
      },
    });
  } catch {
    updatedCategory = memoryStore.updateCategory(id, updateData);
  }

  await logAuditEvent({
    userId: auth.user.id,
    userEmail: auth.user.email,
    userName: auth.user.fullName,
    userRole: auth.user.role.name,
    action: 'UPDATE',
    entity: 'CATEGORY',
    entityId: id,
    details: {
      before: { name: existing.name, slug: existing.slug, type: existing.type },
      after: { name: updatedCategory.name, slug: updatedCategory.slug, type: updatedCategory.type },
    },
    ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
    userAgent: request.headers.get('user-agent'),
  });

  safeRevalidatePath('/admin/categories');

  return NextResponse.json(serializeCategory(updatedCategory));
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
    existing = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { hairstyles: true, services: true, articles: true },
        },
      },
    });
  } catch {
    existing = memoryStore.findCategoryById(id);
  }

  if (!existing) {
    return NextResponse.json({ error: 'Category not found' }, { status: 404 });
  }

  const childCount =
    (existing._count?.hairstyles || 0) +
    (existing._count?.services || 0) +
    (existing._count?.articles || 0);

  if (childCount > 0) {
    return NextResponse.json(
      { error: 'Không thể xóa danh mục đang chứa kiểu tóc, dịch vụ hoặc bài viết liên quan.' },
      { status: 400 }
    );
  }

  try {
    await prisma.category.delete({ where: { id } });
  } catch {
    memoryStore.deleteCategory(id);
  }

  await logAuditEvent({
    userId: auth.user.id,
    userEmail: auth.user.email,
    userName: auth.user.fullName,
    userRole: auth.user.role.name,
    action: 'DELETE',
    entity: 'CATEGORY',
    entityId: id,
    details: { name: existing.name },
    ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
    userAgent: request.headers.get('user-agent'),
  });

  safeRevalidatePath('/admin/categories');

  return NextResponse.json({ success: true, id });
}
