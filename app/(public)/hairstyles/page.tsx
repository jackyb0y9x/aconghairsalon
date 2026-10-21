import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { getPublicHairstyles, getPublicServices } from '@/lib/public-data';
import { HairstyleCatalogClient } from '@/components/public/HairstyleCatalogClient';

export const metadata: Metadata = {
  title: 'Thư Viện Kiểu Tóc Thịnh Hành | Công Nguyễn Hair Salon',
  description: 'Khám phá 50+ kiểu tóc Nam & Nữ thịnh hành tại Việt Nam. Lọc đa tiêu chí theo khuôn mặt, chất tóc, độ dài và thử tóc trực quan AI.',
  openGraph: {
    title: 'Thư Viện Kiểu Tóc Thịnh Hành | Công Nguyễn Hair Salon',
    description: 'Khám phá 50+ kiểu tóc Nam & Nữ thịnh hành tại Việt Nam.',
  },
};

export const revalidate = 60; // ISR cache 60s

export default async function HairstylesPage() {
  const [hairstylesResult, servicesResult] = await Promise.all([
    getPublicHairstyles({ pageSize: 100 }),
    getPublicServices(),
  ]);

  return (
    <div className="min-h-screen bg-salon-noir text-salon-ivory transition-colors duration-300">
      {/* Hero Banner */}
      <section className="relative pt-24 pb-12 px-4 sm:px-6 lg:px-8 border-b border-salon-gold/15 overflow-hidden">
        <div className="max-w-7xl mx-auto text-center relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-salon-gold/30 bg-salon-gold/10 text-salon-gold-light text-xs font-semibold uppercase tracking-widest">
            Haute Coiffure Gallery
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold gold-text-gradient">
            Thư Viện Kiểu Tóc
          </h1>
          <p className="text-neutral-300 max-w-2xl mx-auto text-sm md:text-base font-light leading-relaxed">
            Tìm kiếm mẫu tóc định hình phong cách riêng của bạn. Lọc đa chiều theo đối tượng, dáng khuôn mặt, chất tóc và phong cách cá nhân.
          </p>
        </div>
      </section>

      {/* Main Interactive Catalog */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Suspense fallback={<div className="py-24 text-center text-salon-gold animate-pulse">Đang tải danh mục kiểu tóc...</div>}>
          <HairstyleCatalogClient
            initialHairstyles={hairstylesResult.items}
            categories={servicesResult.categories}
          />
        </Suspense>
      </main>
    </div>
  );
}
