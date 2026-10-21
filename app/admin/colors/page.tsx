import React from 'react';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { serializeHairColor } from '@/lib/validations/content';
import { ColorsManagementClient } from '@/components/admin/ColorsManagementClient';
import { DEFAULT_HAIR_COLORS } from '@/lib/public-data';

export const metadata = {
  title: 'Bảng Màu Nhuộm Swatches | Công Nguyễn Hair Salon CMS',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminColorsPage() {
  await requireAdmin(['SUPER_ADMIN', 'CONTENT_ADMIN']);

  let colors: any[] = [];
  try {
    colors = await prisma.hairColor.findMany({
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
    });
  } catch (err) {
    console.warn('[Admin Colors] DB offline, using default fallback data');
    colors = DEFAULT_HAIR_COLORS.map((c: any, idx: number) => ({
      ...c,
      id: c.id || `color-${idx + 1}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  }

  const initialColors = colors.map(serializeHairColor);

  return <ColorsManagementClient initialColors={initialColors} />;
}
