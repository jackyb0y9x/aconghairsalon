import React from 'react';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { serializeHairstyle } from '@/lib/validations/content';
import { HairstyleForm } from '@/components/admin/HairstyleForm';
import { DEFAULT_HAIRSTYLES, DEFAULT_CATEGORIES } from '@/lib/public-data';
import { memoryStore } from '@/lib/memory-store';
import { slugify } from '@/lib/utils';

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

  const candidateSlugs = [params.id, slugify(params.id)];
  const defaultMatch = DEFAULT_HAIRSTYLES.find(
    (h: any) => h.id === params.id || h.slug === params.id || slugify(h.name || h.title) === slugify(params.id)
  );
  if (defaultMatch) {
    if (defaultMatch.slug) candidateSlugs.push(defaultMatch.slug);
    candidateSlugs.push(slugify(defaultMatch.name || defaultMatch.title));
  }

  try {
    [hairstyle, categories] = await Promise.all([
      prisma.hairstyle.findFirst({
        where: {
          OR: [
            { id: params.id },
            { slug: { in: candidateSlugs } },
            ...(defaultMatch ? [{ title: defaultMatch.name || defaultMatch.title }] : []),
          ],
        },
        include: { category: true },
      }),
      prisma.category.findMany({
        select: { id: true, name: true },
        orderBy: { displayOrder: 'asc' },
      }),
    ]);
  } catch (err) {
    // Database query failed
  }

  if (!hairstyle) {
    if (defaultMatch) {
      hairstyle = {
        ...defaultMatch,
        category: defaultMatch.category || { id: 'cat-featured', name: 'Kiểu Tóc Nổi Bật' },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } else {
      hairstyle = memoryStore.findHairstyleById(params.id);
    }
  }

  if (!hairstyle) {
    hairstyle = {
      id: params.id,
      title: params.id,
      slug: slugify(params.id),
      category: { id: 'cat-featured', name: 'Kiểu Tóc Nổi Bật' },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  if (!categories || categories.length === 0) {
    categories = DEFAULT_CATEGORIES.map((c: any) => ({ id: c.id, name: c.name }));
  }

  const initialData = serializeHairstyle(hairstyle);

  return <HairstyleForm initialData={initialData as any} categories={categories} />;
}
