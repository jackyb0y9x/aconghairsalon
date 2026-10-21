import React from 'react';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { HairstyleForm } from '@/components/admin/HairstyleForm';
import { DEFAULT_CATEGORIES } from '@/lib/public-data';

export const metadata = {
  title: 'Thêm Kiểu Tóc Mới | Công Nguyễn Hair Salon CMS',
};

export const dynamic = 'force-dynamic';

export default async function NewHairstylePage() {
  await requireAdmin(['SUPER_ADMIN', 'CONTENT_ADMIN']);

  let categories: any[] = [];
  try {
    categories = await prisma.category.findMany({
      select: { id: true, name: true },
      orderBy: { displayOrder: 'asc' },
    });
  } catch (err) {
    categories = DEFAULT_CATEGORIES.map((c: any) => ({ id: c.id, name: c.name }));
  }

  return <HairstyleForm categories={categories} />;
}
