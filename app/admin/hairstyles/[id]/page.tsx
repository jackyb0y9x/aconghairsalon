import React from 'react';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { serializeHairstyle } from '@/lib/validations/content';
import { HairstyleForm } from '@/components/admin/HairstyleForm';
import { DEFAULT_HAIRSTYLES, DEFAULT_CATEGORIES } from '@/lib/public-data';

export const metadata = {
  title: 'Chỉnh Sửa Kiểu Tóc | Công Nguyễn Hair Salon CMS',
};

export const dynamic = 'force-dynamic';

interface Props {
  params: {
    id: string;
  };
}

export default async function EditHairstylePage({ params }: Props) {
  await requireAdmin(['SUPER_ADMIN', 'CONTENT_ADMIN']);

  let hairstyle: any = null;
  let categories: any[] = [];

  try {
    [hairstyle, categories] = await Promise.all([
      prisma.hairstyle.findUnique({
        where: { id: params.id },
        include: { category: true },
      }),
      prisma.category.findMany({
        select: { id: true, name: true },
        orderBy: { displayOrder: 'asc' },
      }),
    ]);
  } catch (err) {
    const found = DEFAULT_HAIRSTYLES.find((h) => h.id === params.id || h.slug === params.id);
    if (found) {
      hairstyle = {
        ...found,
        category: { id: 'cat-featured', name: 'Kiểu Tóc Nổi Bật' },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
    categories = DEFAULT_CATEGORIES.map((c: any) => ({ id: c.id, name: c.name }));
  }

  if (!hairstyle) {
    notFound();
  }

  const initialData = serializeHairstyle(hairstyle);

  return <HairstyleForm initialData={initialData as any} categories={categories} />;
}
