import React from 'react';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { serializeArticle } from '@/lib/validations/content';
import { ArticlesManagementClient } from '@/components/admin/ArticlesManagementClient';
import { DEFAULT_ARTICLES, DEFAULT_CATEGORIES } from '@/lib/public-data';

export const metadata = {
  title: 'Quản Lý Bài Viết | Công Nguyễn Hair Salon CMS',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminArticlesPage() {
  await requireAdmin(['SUPER_ADMIN', 'CONTENT_ADMIN', 'EDITOR']);

  let articles: any[] = [];
  let categories: any[] = [];

  try {
    [articles, categories] = await Promise.all([
      prisma.article.findMany({
        orderBy: { createdAt: 'desc' },
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
    console.warn('[Admin Articles] DB offline, using default fallback data');
    articles = DEFAULT_ARTICLES.map((a, idx) => ({
      ...a,
      id: a.id || `art-${idx + 1}`,
      category: { id: 'cat-news', name: 'Xu Hướng & Chăm Sóc' },
      author: { id: 'usr-1', fullName: 'Công Nguyễn Editorial', avatarUrl: null },
      createdAt: new Date(),
      updatedAt: new Date(),
      publishedAt: new Date(),
    }));
    categories = DEFAULT_CATEGORIES.map((c: any) => ({ id: c.id, name: c.name }));
  }

  const initialArticles = articles.map(serializeArticle);

  return (
    <ArticlesManagementClient
      initialArticles={initialArticles}
      categories={categories}
    />
  );
}
