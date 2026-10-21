import React from 'react';
import { Star, CheckCircle, Quote } from 'lucide-react';

export function Testimonials() {
  const reviews = [
    {
      id: 'rev-1',
      name: 'Thùy Dung',
      role: 'Fashion Blogger',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
      rating: 5,
      service: 'Nhuộm Balayage & Uốn Sóng Lơi',
      comment: 'Sau nhiều lần nhuộm tẩy ở các salon khác bị khô xơ, mình thực sự ấn tượng khi đến Atelier. Tóc mềm bóng bất ngờ nhờ Olaplex, màu nâu tây lạnh tôn da tuyệt vời.',
    },
    {
      id: 'rev-2',
      name: 'Minh Trí',
      role: 'Creative Director',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      rating: 5,
      service: 'Combo Quý Ông Atelier',
      comment: 'Kỹ thuật fade và tỉa layer của Master Kenji rất chuẩn chỉ. Điểm đặc biệt là trước khi cắt mình được thử tóc AI trực quan, thấy ưng ý rồi mới chốt thực hiện.',
    },
    {
      id: 'rev-3',
      name: 'Khánh Linh',
      role: 'Marketing Lead',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      rating: 5,
      service: 'Cắt Layer & Phục Hồi Keratin',
      comment: 'Không gian sang trọng, dịch vụ chỉn chu từ ly trà hoa cúc đến sự tận tâm tư vấn. Đã 3 tuần trôi qua mà phom tóc layer ở nhà sấy vẫn bồng bềnh như vừa bước ra từ salon.',
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-salon-noir relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <span className="inline-block px-4 py-1 rounded-full border border-salon-gold/30 bg-salon-gold/10 text-salon-gold-light text-xs font-semibold tracking-widest uppercase">
            Client Voices
          </span>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-white tracking-tight">
            Khách Hàng Nói Gì Về <span className="gold-text-gradient">Trải Nghiệm Tại Atelier</span>
          </h2>
          <p className="text-neutral-400 text-sm md:text-base font-light">
            Sự hài lòng và tự tin của quý khách là thước đo chuẩn mực cho tay nghề và dịch vụ của chúng tôi.
          </p>
        </div>

        {/* 3 Review Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="rounded-2xl p-6 md:p-8 bg-salon-charcoal/80 border border-salon-gold/20 hover:border-salon-gold/50 transition-all duration-300 hover:shadow-gold-glow flex flex-col justify-between relative"
            >
              <Quote className="absolute top-6 right-6 w-10 h-10 text-salon-gold/10" />

              <div className="space-y-4 relative z-10">
                {/* 5 Stars */}
                <div className="flex items-center gap-1 text-salon-gold">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-salon-gold" />
                  ))}
                </div>

                {/* Comment */}
                <p className="text-neutral-300 text-sm font-light leading-relaxed italic">
                  &ldquo;{rev.comment}&rdquo;
                </p>

                {/* Service Badge */}
                <div className="pt-2">
                  <span className="inline-block text-[11px] font-medium px-2.5 py-1 rounded-full bg-salon-gold/10 text-salon-gold border border-salon-gold/20">
                    {rev.service}
                  </span>
                </div>
              </div>

              {/* Author */}
              <div className="flex items-center gap-3 pt-6 mt-4 border-t border-white/5 relative z-10">
                <img
                  src={rev.avatar}
                  alt={rev.name}
                  className="w-11 h-11 rounded-full object-cover border border-salon-gold/40"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-serif font-bold text-base text-white">
                      {rev.name}
                    </span>
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <span className="text-xs text-neutral-400 font-light">
                    {rev.role}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
