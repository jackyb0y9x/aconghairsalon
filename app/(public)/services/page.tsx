import React from 'react';
import { Metadata } from 'next';
import { getPublicServices } from '@/lib/public-data';
import { ServicesCatalogClient } from '@/components/public/ServicesCatalogClient';
import { ShieldCheck, Award, Sparkles, Coffee } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Bảng Giá Dịch Vụ | Công Nguyễn Hair Salon',
  description: 'Khám phá danh mục dịch vụ cắt tóc tạo kiểu Master, uốn sóng lơi Hàn Quốc, nhuộm Balayage không amoniac, phục hồi Olaplex với bảng giá công khai, cam kết không phát sinh phụ phí ẩn.',
  openGraph: {
    title: 'Bảng Giá Dịch Vụ | Công Nguyễn Hair Salon',
    description: 'Bảng giá dịch vụ tạo mẫu tóc công khai, cam kết không phát sinh phụ phí ẩn.',
  },
};

export const revalidate = 60; // ISR cache 60s

export default async function ServicesPage() {
  const data = await getPublicServices();

  return (
    <div className="min-h-screen bg-salon-noir text-salon-ivory transition-colors duration-300">
      {/* Hero Header */}
      <section className="relative pt-24 pb-16 px-4 sm:px-6 lg:px-8 border-b border-salon-gold/15 overflow-hidden">
        <div className="max-w-7xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-salon-gold/30 bg-salon-gold/10 text-salon-gold-light text-xs font-semibold uppercase tracking-widest">
            Haute Coiffure Transparent Pricing
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold gold-text-gradient">
            Bảng Giá Dịch Vụ
          </h1>

          <p className="text-neutral-300 max-w-2xl mx-auto text-sm md:text-base font-light leading-relaxed">
            Mọi dịch vụ tại Atelier đều được định giá công khai, cam kết không phát sinh phụ phí ẩn. Quý khách luôn được chuyên gia tư vấn kỹ lưỡng và thống nhất chi phí trước khi thực hiện.
          </p>

          {/* 4 Guarantees Banner */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto text-left pt-6">
            <div className="p-4 rounded-2xl bg-salon-charcoal/80 border border-salon-gold/20 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-salon-gold/15 text-salon-gold flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-salon-gold-light">100% Chính Hãng</h4>
                <p className="text-[11px] text-neutral-400 font-light mt-0.5">Olaplex Mỹ, L’Oréal Pháp, Milbon Nhật.</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-salon-charcoal/80 border border-salon-gold/20 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-salon-gold/15 text-salon-gold flex items-center justify-center flex-shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-salon-gold-light">Bảo Hành 7 Ngày</h4>
                <p className="text-[11px] text-neutral-400 font-light mt-0.5">Chỉnh sửa form dáng, độ xoăn và màu miễn phí.</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-salon-charcoal/80 border border-salon-gold/20 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-salon-gold/15 text-salon-gold flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-salon-gold-light">Soi Da Đầu Vi Điểm</h4>
                <p className="text-[11px] text-neutral-400 font-light mt-0.5">Khảo sát mật độ và tủy tóc miễn phí trước khi làm.</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-salon-charcoal/80 border border-salon-gold/20 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-salon-gold/15 text-salon-gold flex items-center justify-center flex-shrink-0">
                <Coffee className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-salon-gold-light">Đặc Quyền Thư Giãn</h4>
                <p className="text-[11px] text-neutral-400 font-light mt-0.5">Trà hoa cúc, cafe Ý và bánh ngọt trà chiều.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Client Interactive Catalog */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <ServicesCatalogClient
          categories={data.categories}
          services={data.services}
        />
      </main>
    </div>
  );
}
