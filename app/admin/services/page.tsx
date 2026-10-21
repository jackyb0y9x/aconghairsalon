import React from 'react';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { serializeService } from '@/lib/validations/content';
import { ServicesManagementClient } from '@/components/admin/ServicesManagementClient';
import { DEFAULT_SERVICES, DEFAULT_CATEGORIES } from '@/lib/public-data';

export const metadata = {
  title: 'Menu Dịch Vụ & Bảng Giá | Công Nguyễn Hair Salon CMS',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminServicesPage() {
  await requireAdmin(['SUPER_ADMIN', 'CONTENT_ADMIN']);

  let services: any[] = [];
  let categories: any[] = [];

  try {
    [services, categories] = await Promise.all([
      prisma.service.findMany({
        orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
        include: {
          category: true,
        },
      }),
      prisma.category.findMany({
        where: { type: 'SERVICE' },
        select: { id: true, name: true },
        orderBy: { displayOrder: 'asc' },
      }),
    ]);
  } catch (err) {
    console.warn('[Admin Services] DB offline, using default fallback data');
    services = DEFAULT_SERVICES.map((s, idx) => ({
      ...s,
      id: s.id || `srv-${idx + 1}`,
      category: { id: 'cat-service', name: 'Dịch Vụ Tạo Mẫu' },
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    categories = DEFAULT_CATEGORIES.map((c: any) => ({ id: c.id, name: c.name }));
  }

  const initialServices = services.map(serializeService);

  return <ServicesManagementClient initialServices={initialServices} categories={categories} />;
}
