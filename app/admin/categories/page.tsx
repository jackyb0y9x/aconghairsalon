import React from 'react';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { serializeCategory } from '@/lib/validations/content';
import { CategoriesManagementClient } from '@/components/admin/CategoriesManagementClient';
import { DEFAULT_CATEGORIES } from '@/lib/public-data';

export const metadata = {
  title: 'Quản Lý Danh Mục | Công Nguyễn Hair Salon CMS',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminCategoriesPage() {
  await requireAdmin(['SUPER_ADMIN', 'CONTENT_ADMIN']);

  let categories: any[] = [];
  try {
    categories = await prisma.category.findMany({
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
  } catch (err) {
    console.warn('[Admin Categories] DB offline, using default fallback data');
    categories = DEFAULT_CATEGORIES.map((c: any, idx: number) => ({
      ...c,
      id: c.id || `cat-${idx + 1}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      _count: { hairstyles: 5, services: 3, articles: 2 },
    }));
  }

  const initialCategories = categories.map(serializeCategory);

  return <CategoriesManagementClient initialCategories={initialCategories} />;
}
