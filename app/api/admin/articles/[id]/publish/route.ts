import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateAdminRequest } from '@/lib/auth';
import { logAuditEvent } from '@/services/audit';
import { serializeArticle } from '@/lib/validations/content';
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
  const newPublished = typeof body.isPublished === 'boolean' ? body.isPublished : !existing.isPublished;

  let updated: any;
  try {
    updated = await prisma.article.update({
      where: { id: existing.id },
      data: {
        isPublished: newPublished,
        publishedAt: newPublished ? (existing.publishedAt || new Date()) : existing.publishedAt,
      },
      include: {
        category: true,
        author: {
          select: { id: true, fullName: true, avatarUrl: true },
        },
      },
    });
  } catch {
    updated = memoryStore.updateArticle(existing.id, {
      isPublished: newPublished,
      publishedAt: newPublished ? (existing.publishedAt || new Date()) : existing.publishedAt,
    });
  }

  await logAuditEvent({
    userId: auth.user.id,
    userEmail: auth.user.email,
    userName: auth.user.fullName,
    userRole: auth.user.role.name,
    action: 'STATUS_CHANGE',
    entity: 'ARTICLE',
    entityId: existing.id,
    details: { field: 'isPublished', from: existing.isPublished, to: newPublished },
    ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
    userAgent: request.headers.get('user-agent'),
  });

  safeRevalidatePath('/blog');
  safeRevalidatePath(`/blog/${existing.slug}`);
  safeRevalidatePath('/admin/articles');
  safeRevalidatePath('/');

  return NextResponse.json(serializeArticle(updated));
}

export const POST = PATCH;
