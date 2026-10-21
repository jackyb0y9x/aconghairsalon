import React from 'react';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { serializeArticle } from '@/lib/validations/content';
import { ArticleEditor } from '@/components/admin/ArticleEditor';
import { DEFAULT_ARTICLES, DEFAULT_CATEGORIES } from '@/lib/public-data';

export const metadata = {
  title: 'Chỉnh Sửa Bài Viết | Công Nguyễn Hair Salon CMS',
};

export const dynamic = 'force-dynamic';

interface Props {
  params: {
    id: string;
  };
}

export default async function EditArticlePage({ params }: Props) {
  await requireAdmin(['SUPER_ADMIN', 'CONTENT_ADMIN', 'EDITOR']);

  let article: any = null;
  let categories: any[] = [];

  try {
    [article, categories] = await Promise.all([
      prisma.article.findUnique({
        where: { id: params.id },
        include: {
          category: true,
          author: {
            select: { id: true, fullName: true, avatarUrl: true },
          },
        },
      }),
      prisma.category.findMany({
        select: { id: true, name: true },
        orderBy: { displayOrder: 'asc' },
      }),
    ]);
  } catch (err) {
    const found = DEFAULT_ARTICLES.find((a) => a.id === params.id || a.slug === params.id);
    if (found) {
      article = {
        ...found,
        category: { id: 'cat-news', name: 'Xu Hướng & Chăm Sóc' },
        author: { id: 'usr-1', fullName: 'Công Nguyễn Editorial', avatarUrl: null },
        createdAt: new Date(),
        updatedAt: new Date(),
        publishedAt: new Date(),
      };
    }
    categories = DEFAULT_CATEGORIES.map((c: any) => ({ id: c.id, name: c.name }));
  }

  if (!article) {
    notFound();
  }

  const initialData = serializeArticle(article);

  return <ArticleEditor initialData={initialData as any} categories={categories} />;
}
