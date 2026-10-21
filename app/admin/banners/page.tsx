import React from 'react';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { serializeBanner } from '@/lib/validations/content';
import { BannersManagementClient } from '@/components/admin/BannersManagementClient';
import { DEFAULT_BANNERS } from '@/lib/public-data';

export const metadata = {
  title: 'Quản Lý Banner Trang Chủ | Công Nguyễn Hair Salon CMS',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminBannersPage() {
  await requireAdmin(['SUPER_ADMIN', 'CONTENT_ADMIN']);

  let banners: any[] = [];
  try {
    banners = await prisma.banner.findMany({
      orderBy: { displayOrder: 'asc' },
    });
  } catch (err) {
    console.warn('[Admin Banners] DB offline, using default fallback data');
    banners = DEFAULT_BANNERS.map((b, idx) => ({
      ...b,
      id: b.id || `banner-${idx + 1}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  }

  const initialBanners = banners.map(serializeBanner);

  return <BannersManagementClient initialBanners={initialBanners} />;
}
