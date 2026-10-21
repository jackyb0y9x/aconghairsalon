import React from 'react';
import Link from 'next/link';
import { Scissors, Waves, Palette, Sparkles, ArrowRight } from 'lucide-react';

export function QuickCategories() {
  const categories = [
    {
      id: 'cat-cut',
      title: 'Cắt Tạo Kiểu Master',
      subtitle: 'Tỉa layer chuyển động, Wolf Cut, French Bob, Fade Undercut',
      icon: Scissors,
      href: '/hairstyles',
      imageUrl: 'https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&w=600&q=80',
      badge: 'Khuyên Dùng',
    },
    {
      id: 'cat-perm',
      title: 'Uốn Sóng & Định Hình',
      subtitle: 'Uốn sóng lơi Hàn Quốc, Hippie phóng khoáng, Textured Perm',
      icon: Waves,
      href: '/services',
      imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80',
      badge: 'Hot Trend',
    },
    {
      id: 'cat-color',
      title: 'Nhuộm Balayage & Tẩy',
      subtitle: 'Nâu tây lạnh, xám khói, pastel bảo vệ liên kết Olaplex',
      icon: Palette,
      href: '/colors',
      imageUrl: 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=600&q=80',
      badge: 'Chính Hãng',
    },
    {
      id: 'cat-treatment',
      title: 'Phục Hồi & Dưỡng Sinh',
      subtitle: 'Nano Keratin phủ lụa, gội đầu dưỡng sinh bấm huyệt Đông y',
      icon: Sparkles,
      href: '/services',
      imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80',
      badge: 'Thư Giãn',
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-salon-noir relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <span className="inline-block px-4 py-1 rounded-full border border-salon-gold/30 bg-salon-gold/10 text-salon-gold-light text-xs font-semibold tracking-widest uppercase">
            Signature Atelier Services
          </span>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-white tracking-tight">
            Danh Mục Dịch Vụ <span className="gold-text-gradient">Đặc Tuyển</span>
          </h2>
          <p className="text-neutral-400 text-sm md:text-base font-light">
            Trải nghiệm dịch vụ chăm sóc tóc chuẩn Haute Coiffure được cá nhân hóa cho từng chất tóc và đường nét gương mặt.
          </p>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.id}
                href={cat.href}
                className="group relative rounded-2xl overflow-hidden bg-salon-charcoal/80 border border-salon-gold/20 hover:border-salon-gold/60 transition-all duration-300 hover:shadow-gold-glow flex flex-col justify-between p-6 hover:-translate-y-1.5"
              >
                {/* Background subtle image with overlay */}
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-15 group-hover:opacity-25 transition-opacity duration-500"
                  style={{ backgroundImage: `url('${cat.imageUrl}')` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-salon-charcoal via-salon-charcoal/80 to-transparent" />

                {/* Content */}
                <div className="relative z-10 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-salon-gold/15 border border-salon-gold/30 flex items-center justify-center text-salon-gold group-hover:bg-salon-gold group-hover:text-salon-noir transition duration-300">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-salon-gold/20 text-salon-gold-light border border-salon-gold/30">
                      {cat.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-serif font-bold text-xl text-white group-hover:text-salon-gold-light transition">
                      {cat.title}
                    </h3>
                    <p className="text-xs text-neutral-400 mt-2 line-clamp-2 leading-relaxed">
                      {cat.subtitle}
                    </p>
                  </div>
                </div>

                {/* Card Footer Link */}
                <div className="relative z-10 pt-6 mt-4 border-t border-white/5 flex items-center justify-between text-xs font-semibold text-salon-gold group-hover:text-salon-gold-light transition">
                  <span>Khám phá dịch vụ</span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
