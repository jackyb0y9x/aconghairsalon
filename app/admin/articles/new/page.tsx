import React from 'react';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ArticleEditor } from '@/components/admin/ArticleEditor';
import { DEFAULT_CATEGORIES } from '@/lib/public-data';

export const metadata = {
  title: 'Soạn Thảo Bài Viết Mới | Công Nguyễn Hair Salon CMS',
};

export const dynamic = 'force-dynamic';

export default async function NewArticlePage() {
  await requireAdmin(['SUPER_ADMIN', 'CONTENT_ADMIN', 'EDITOR']);

  let categories: any[] = [];
  try {
    categories = await prisma.category.findMany({
      select: { id: true, name: true },
      orderBy: { displayOrder: 'asc' },
    });
  } catch (err) {
    categories = DEFAULT_CATEGORIES.map((c: any) => ({ id: c.id, name: c.name }));
  }

  return <ArticleEditor categories={categories} />;
}
