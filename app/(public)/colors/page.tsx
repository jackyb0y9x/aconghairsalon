import React from 'react';
import { Metadata } from 'next';
import { getPublicColors } from '@/lib/public-data';
import { ColorCatalogClient } from '@/components/public/ColorCatalogClient';

export const metadata: Metadata = {
  title: 'Bảng Màu Nhuộm & Tư Vấn Sắc Tố Da | Công Nguyễn Hair Salon',
  description: 'Khám phá bảng màu nhuộm tóc cao cấp không amoniac: Nâu tây lạnh, khói sữa ánh rêu, đỏ rượu vang. Tư vấn chọn màu chuẩn undertone da cùng kỹ thuật bảo vệ liên kết Olaplex.',
  openGraph: {
    title: 'Bảng Màu Nhuộm & Tư Vấn Sắc Tố Da | Công Nguyễn Hair Salon',
    description: 'Bảng màu nhuộm tóc cao cấp không amoniac, chuẩn undertone da.',
  },
};

export const revalidate = 60; // ISR cache 60s

export default async function ColorsPage() {
  const colorData = await getPublicColors();

  return (
    <div className="min-h-screen bg-salon-noir text-salon-ivory transition-colors duration-300">
      {/* Hero Header */}
      <section className="relative pt-24 pb-12 px-4 sm:px-6 lg:px-8 border-b border-salon-gold/15 overflow-hidden">
        <div className="max-w-7xl mx-auto text-center relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-salon-gold/30 bg-salon-gold/10 text-salon-gold-light text-xs font-semibold uppercase tracking-widest">
            Haute Color Atelier
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold gold-text-gradient">
            Bảng Màu Nhuộm & Tư Vấn Tone Da
          </h1>
          <p className="text-neutral-300 max-w-2xl mx-auto text-sm md:text-base font-light leading-relaxed">
            Nghệ thuật hòa sắc tinh tế với 100% thuốc nhuộm Organic cao cấp không Amoniac, tích hợp tinh chất Olaplex bảo vệ liên kết keratin cho mái tóc bóng mượt đa chiều.
          </p>
        </div>
      </section>

      {/* Main Interactive Catalog */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <ColorCatalogClient initialColors={colorData.colors} />
      </main>
    </div>
  );
}
