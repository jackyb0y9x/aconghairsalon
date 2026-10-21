import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateAdminRequest } from '@/lib/auth';
import { logAuditEvent } from '@/services/audit';
import { ArticleUpdateSchema, serializeArticle } from '@/lib/validations/content';
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
  let article: any;
  try {
    article = await prisma.article.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        category: true,
        author: {
          select: { id: true, fullName: true, avatarUrl: true },
        },
      },
    });
  } catch {
    article = memoryStore.findArticleById(id) || memoryStore.articles.find((a) => a.slug === id);
  }

  if (!article) {
    return NextResponse.json({ error: 'Article not found' }, { status: 404 });
  }

  return NextResponse.json(serializeArticle(article));
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
    existing = await prisma.article.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
    });
  } catch {
    existing = memoryStore.findArticleById(id) || memoryStore.articles.find((a) => a.slug === id);
  }

  if (!existing) {
    return NextResponse.json({ error: 'Article not found' }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const parseResult = ArticleUpdateSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: 'Dữ liệu cập nhật không hợp lệ', details: parseResult.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const input = parseResult.data;
  const title = input.title !== undefined ? input.title : existing.title;
  let slug = existing.slug;
  if (input.slug && input.slug !== existing.slug) {
    slug = slugify(input.slug);
  } else if (input.title && input.title !== existing.title) {
    slug = slugify(input.title);
  }

  const isPublished = input.isPublished !== undefined
    ? input.isPublished
    : input.published !== undefined
    ? input.published
    : existing.isPublished;

  const updateData: any = {};
  updateData.title = title;
  updateData.slug = slug;
  if (input.excerpt !== undefined) updateData.excerpt = input.excerpt;
  if (input.content !== undefined) updateData.content = input.content;
  if (input.coverImageUrl !== undefined) updateData.coverImageUrl = input.coverImageUrl;
  if (input.tags !== undefined) updateData.tags = input.tags;
  if (input.metaTitle !== undefined || input.seoTitle !== undefined) {
    updateData.metaTitle = input.metaTitle || input.seoTitle;
  }
  if (input.metaDescription !== undefined || input.seoDescription !== undefined) {
    updateData.metaDescription = input.metaDescription || input.seoDescription;
  }
  if (input.metaKeywords !== undefined) updateData.metaKeywords = input.metaKeywords;
  if (input.categoryId !== undefined) updateData.categoryId = input.categoryId;
  updateData.isPublished = isPublished;
  if (isPublished && !existing.publishedAt) {
    updateData.publishedAt = new Date();
  }

  let updatedArticle: any;
  try {
    updatedArticle = await prisma.article.update({
      where: { id: existing.id },
      data: updateData,
      include: {
        category: true,
        author: {
          select: { id: true, fullName: true, avatarUrl: true },
        },
      },
    });
  } catch {
    updatedArticle = memoryStore.updateArticle(existing.id, updateData);
  }

  await logAuditEvent({
    userId: auth.user.id,
    userEmail: auth.user.email,
    userName: auth.user.fullName,
    userRole: auth.user.role.name,
    action: 'UPDATE',
    entity: 'ARTICLE',
    entityId: existing.id,
    details: {
      before: { title: existing.title, isPublished: existing.isPublished },
      after: { title: updatedArticle.title, isPublished: updatedArticle.isPublished },
    },
    ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
    userAgent: request.headers.get('user-agent'),
  });

  safeRevalidatePath('/blog');
  safeRevalidatePath(`/blog/${existing.slug}`);
  safeRevalidatePath(`/blog/${updatedArticle.slug}`);
  safeRevalidatePath('/admin/articles');
  safeRevalidatePath('/');

  return NextResponse.json(serializeArticle(updatedArticle));
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
    existing = await prisma.article.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
    });
  } catch {
    existing = memoryStore.findArticleById(id) || memoryStore.articles.find((a) => a.slug === id);
  }

  if (!existing) {
    return NextResponse.json({ error: 'Article not found' }, { status: 404 });
  }

  try {
    await prisma.article.delete({ where: { id: existing.id } });
  } catch {
    memoryStore.deleteArticle(existing.id);
  }

  await logAuditEvent({
    userId: auth.user.id,
    userEmail: auth.user.email,
    userName: auth.user.fullName,
    userRole: auth.user.role.name,
    action: 'DELETE',
    entity: 'ARTICLE',
    entityId: existing.id,
    details: { title: existing.title },
    ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
    userAgent: request.headers.get('user-agent'),
  });

  safeRevalidatePath('/blog');
  safeRevalidatePath('/admin/articles');
  safeRevalidatePath('/');

  return NextResponse.json({ success: true, id: existing.id });
}
