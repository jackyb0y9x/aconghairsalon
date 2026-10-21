import React from 'react';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { serializeBeforeAfter } from '@/lib/validations/content';
import { BeforeAfterManagementClient } from '@/components/admin/BeforeAfterManagementClient';
import { DEFAULT_BEFORE_AFTERS, DEFAULT_SERVICES, DEFAULT_HAIRSTYLES, DEFAULT_STYLISTS } from '@/lib/public-data';

export const metadata = {
  title: 'Before & After Showcases | Công Nguyễn Hair Salon CMS',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminBeforeAfterPage() {
  await requireAdmin(['SUPER_ADMIN', 'CONTENT_ADMIN']);

  let items: any[] = [];
  let services: any[] = [];
  let hairstyles: any[] = [];
  let stylists: any[] = [];

  try {
    [items, services, hairstyles, stylists] = await Promise.all([
      prisma.beforeAfter.findMany({
        orderBy: [{ isFeatured: 'desc' }, { displayOrder: 'asc' }, { createdAt: 'desc' }],
        include: {
          service: { select: { id: true, title: true, slug: true } },
          hairstyle: { select: { id: true, title: true, slug: true } },
          stylist: { select: { id: true, fullName: true, avatarUrl: true } },
        },
      }),
      prisma.service.findMany({
        where: { isActive: true },
        select: { id: true, title: true },
        orderBy: { title: 'asc' },
      }),
      prisma.hairstyle.findMany({
        where: { isActive: true },
        select: { id: true, title: true },
        orderBy: { title: 'asc' },
      }),
      prisma.user.findMany({
        where: { isStylist: true, isActive: true },
        select: { id: true, fullName: true },
        orderBy: { fullName: 'asc' },
      }),
    ]);
  } catch (err) {
    console.warn('[Admin BeforeAfter] DB offline, using default fallback data');
    items = DEFAULT_BEFORE_AFTERS.map((b: any, idx: number) => ({
      ...b,
      id: b.id || `ba-${idx + 1}`,
      service: { id: 'srv-1', title: 'Uốn Sóng & Phục Hồi', slug: 'uon-song-phuc-hoi' },
      hairstyle: { id: 'hs-1', title: 'Layer Nữ Bồng Bềnh', slug: 'layer-nu-bong-benh' },
      stylist: { id: 'st-1', fullName: 'Công Nguyễn', avatarUrl: null },
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    services = DEFAULT_SERVICES.map((s: any) => ({ id: s.id, title: s.title }));
    hairstyles = DEFAULT_HAIRSTYLES.map((h: any) => ({ id: h.id, title: h.title }));
    stylists = DEFAULT_STYLISTS.map((st: any) => ({ id: st.id, fullName: st.name }));
  }

  const initialItems = items.map(serializeBeforeAfter);

  return (
    <BeforeAfterManagementClient
      initialItems={initialItems}
      services={services}
      hairstyles={hairstyles}
      stylists={stylists}
    />
  );
}
