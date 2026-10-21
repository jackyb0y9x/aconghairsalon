import React from 'react';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { serializeHairstyle } from '@/lib/validations/content';
import { HairstylesManagementClient } from '@/components/admin/HairstylesManagementClient';
import { DEFAULT_HAIRSTYLES, DEFAULT_CATEGORIES } from '@/lib/public-data';

export const metadata = {
  title: 'Quản Lý Kiểu Tóc | Công Nguyễn Hair Salon CMS',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminHairstylesPage() {
  await requireAdmin(['SUPER_ADMIN', 'CONTENT_ADMIN']);

  let hairstyles: any[] = [];
  let categories: any[] = [];

  try {
    [hairstyles, categories] = await Promise.all([
      prisma.hairstyle.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          category: true,
        },
      }),
      prisma.category.findMany({
        select: { id: true, name: true },
        orderBy: { displayOrder: 'asc' },
      }),
    ]);
  } catch (err) {
    console.warn('[Admin Hairstyles] DB offline, using default fallback data');
    hairstyles = DEFAULT_HAIRSTYLES.map((h, idx) => ({
      ...h,
      id: h.id || `hs-${idx + 1}`,
      category: { id: 'cat-featured', name: 'Kiểu Tóc Nổi Bật' },
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    categories = DEFAULT_CATEGORIES.map((c: any) => ({ id: c.id, name: c.name }));
  }

  const initialHairstyles = hairstyles.map(serializeHairstyle);

  return (
    <HairstylesManagementClient
      initialHairstyles={initialHairstyles}
      categories={categories}
    />
  );
}
