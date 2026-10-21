import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateAdminRequest } from '@/lib/auth';
import { logAuditEvent } from '@/services/audit';
import { ArticleCreateSchema, serializeArticle } from '@/lib/validations/content';
import { memoryStore } from '@/lib/memory-store';
import { slugify } from '@/lib/utils';
import { safeRevalidatePath } from '@/lib/safe-revalidate';

export async function GET(request: NextRequest) {
  const auth = await authenticateAdminRequest(request);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search');
  const categoryId = searchParams.get('categoryId');
  const status = searchParams.get('status');

  const where: any = {};
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { excerpt: { contains: search, mode: 'insensitive' } },
      { content: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (categoryId) where.categoryId = categoryId;
  if (status === 'PUBLISHED') where.isPublished = true;
  if (status === 'DRAFT') where.isPublished = false;

  let articles: any[] = [];
  try {
    articles = await prisma.article.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        author: {
          select: { id: true, fullName: true, avatarUrl: true },
        },
      },
    });
  } catch {
    articles = memoryStore.findArticles();
  }

  return NextResponse.json(articles.map(serializeArticle));
}

export async function POST(request: NextRequest) {
  const auth = await authenticateAdminRequest(request);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  const user = auth.user;
  const body = await request.json().catch(() => ({}));
  const parseResult = ArticleCreateSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: 'Dữ liệu bài viết không hợp lệ', details: parseResult.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const input = parseResult.data;
  const slug = slugify(input.slug || input.title);
  const isPublished = input.isPublished || Boolean(input.published);

  const authorId = input.authorId || user.id;

  const metaTitle = input.metaTitle || input.seoTitle || input.title;
  const metaDescription = input.metaDescription || input.seoDescription || input.excerpt;

  const articleData = {
    title: input.title,
    slug,
    excerpt: input.excerpt,
    content: input.content,
    coverImageUrl: input.coverImageUrl,
    tags: input.tags || [],
    metaTitle,
    metaDescription,
    metaKeywords: input.metaKeywords || null,
    authorId,
    categoryId: input.categoryId || null,
    isPublished,
    publishedAt: isPublished ? new Date() : null,
  };

  let newArticle: any;
  try {
    newArticle = await prisma.article.create({
      data: articleData,
      include: {
        category: true,
        author: {
          select: { id: true, fullName: true, avatarUrl: true },
        },
      },
    });
  } catch {
    newArticle = memoryStore.createArticle(articleData);
  }

  await logAuditEvent({
    userId: user.id,
    userEmail: user.email,
    userName: user.fullName,
    userRole: user.role.name,
    action: 'CREATE',
    entity: 'ARTICLE',
    entityId: newArticle.id,
    details: { title: newArticle.title, isPublished: newArticle.isPublished },
    ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
    userAgent: request.headers.get('user-agent'),
  });

  safeRevalidatePath('/blog');
  safeRevalidatePath('/admin/articles');
  safeRevalidatePath('/');

  return NextResponse.json(serializeArticle(newArticle), { status: 201 });
}
