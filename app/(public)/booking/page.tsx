import React, { Suspense } from 'react';
import { Metadata } from 'next';
import {
  getPublicServices,
  getPublicStylists,
  getPublicHairstyles,
  getPublicColors,
} from '@/lib/public-data';
import { BookingWizardClient } from '@/components/public/BookingWizardClient';

export const metadata: Metadata = {
  title: 'Đặt Lịch Hẹn Trực Tuyến 24/7 | ACoong Hair Salon',
  description: 'Đặt lịch hẹn làm tóc nhanh chóng: Chọn dịch vụ cắt tóc thông thường hoặc nhuộm tẩy uốn, mẫu tóc tham khảo (tùy chọn), ngày giờ và thông tin liên hệ. Cam kết không chờ đợi, giữ chỗ chuẩn xác.',
  openGraph: {
    title: 'Đặt Lịch Hẹn Trực Tuyến 24/7 | ACoong Hair Salon',
    description: 'Đặt lịch hẹn làm tóc nhanh chóng tại ACoong Hair Salon.',
  },
};

export const revalidate = 0; // Dynamic booking wizard

export default async function BookingPage() {
  const [servicesData, stylists, hairstylesData, colorsData] = await Promise.all([
    getPublicServices(),
    getPublicStylists(),
    getPublicHairstyles({ pageSize: 10 }),
    getPublicColors(),
  ]);

  return (
    <div className="min-h-screen bg-salon-noir text-salon-ivory transition-colors duration-300">
      {/* Hero Header */}
      <section className="relative pt-24 pb-12 px-4 sm:px-6 lg:px-8 border-b border-salon-gold/15 overflow-hidden">
        <div className="max-w-7xl mx-auto text-center relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-salon-gold/30 bg-salon-gold/10 text-salon-gold-light text-xs font-semibold uppercase tracking-widest">
            Online Reservation Atelier
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold gold-text-gradient">
            Đặt Lịch Hẹn Trực Tuyến
          </h1>
          <p className="text-neutral-300 max-w-2xl mx-auto text-sm md:text-base font-light leading-relaxed">
            Chủ động lựa chọn dịch vụ yêu thích và khung giờ phù hợp với bạn. Salon cam kết giữ chỗ đúng hẹn và phục vụ tận tâm.
          </p>
        </div>
      </section>

      {/* Main Booking Wizard */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Suspense fallback={<div className="py-24 text-center text-salon-gold animate-pulse">Đang chuẩn bị giao diện đặt lịch...</div>}>
          <BookingWizardClient
            services={servicesData.services}
            combos={servicesData.combos}
            stylists={stylists}
            hairstyles={hairstylesData.items}
            colors={colorsData.colors}
          />
        </Suspense>
      </main>
    </div>
  );
}
