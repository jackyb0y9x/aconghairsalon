import React from 'react';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { memoryStore } from '@/lib/memory-store';
import { SiteSettingsForm } from '@/components/admin/SiteSettingsForm';
import { serializeSettings } from '@/lib/validations/settings';
import { Settings } from 'lucide-react';

export const metadata = {
  title: 'Cấu Hình Hệ Thống Salon | Công Nguyễn Hair Salon CMS',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminSettingsPage() {
  // 1. Server guard: chỉ duy nhất SUPER_ADMIN mới được phép truy cập
  await requireAdmin(['SUPER_ADMIN']);

  // 2. Nạp dữ liệu cấu hình hiện tại từ MemoryStore hoặc Database
  let setting: any = memoryStore.getSiteSettings();
  if (!setting) {
    try {
      setting = await prisma.siteSetting.findUnique({
        where: { id: 'default_setting' },
      });
      if (setting) {
        memoryStore.setSiteSettings(setting);
      }
    } catch (error) {
      console.warn('[Admin Settings Page] DB fetch warning:', error);
    }
  }

  const initialData = serializeSettings(setting) || {
    brandName: 'Công Nguyễn Hair Salon',
    brandSlogan: 'Định Hình Khí Chất - Tỏa Sáng Phong Cách',
    hotline: '0988 888 888',
    emailContact: 'contact@congnguyenhair.vn',
    address: 'Nguyệt Áng 3, An Khánh, Hải Phòng',
    openingHours: '08:30 - 20:30 Hàng ngày',
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="pb-4 border-b border-salon-gold/15">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-salon-gold mb-1">
          <Settings className="w-3.5 h-3.5" />
          <span>Hệ Thống Quản Trị Cốt Lõi</span>
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-salon-ivory">
          Cấu Hình Thương Hiệu & Thông Tin Salon
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Quản lý toàn bộ thông tin nhận diện thương hiệu, liên hệ, mạng xã hội, bản đồ và metadata SEO mặc định.
        </p>
      </div>

      {/* Form Editor with 5 Tabs */}
      <SiteSettingsForm initialData={initialData} />
    </div>
  );
}
