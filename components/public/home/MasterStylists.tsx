import React from 'react';
import Link from 'next/link';
import { Calendar, Award, Star } from 'lucide-react';

interface StylistItem {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
  experienceYears?: number | null;
  specialties?: string[];
  bio?: string | null;
}

interface MasterStylistsProps {
  stylists?: StylistItem[];
}

export function MasterStylists({ stylists = [] }: MasterStylistsProps) {
  if (stylists.length === 0) return null;

  return (
    <section className="py-16 md:py-24 bg-salon-charcoal/40 border-t border-salon-gold/15">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <span className="inline-block px-4 py-1 rounded-full border border-salon-gold/30 bg-salon-gold/10 text-salon-gold-light text-xs font-semibold tracking-widest uppercase">
            Artisans of Beauty
          </span>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-white tracking-tight">
            Đội Ngũ <span className="gold-text-gradient">Master Stylist</span>
          </h2>
          <p className="text-neutral-400 text-sm md:text-base font-light">
            Các chuyên gia tạo mẫu tóc giàu kinh nghiệm, đạt chứng chỉ quốc tế và luôn đón đầu xu hướng thẩm mỹ toàn cầu.
          </p>
        </div>

        {/* 3-4 Stylist Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {stylists.slice(0, 3).map((stylist) => (
            <div
              key={stylist.id}
              className="group rounded-2xl overflow-hidden bg-salon-charcoal border border-salon-gold/20 hover:border-salon-gold/60 transition-all duration-300 hover:shadow-gold-glow flex flex-col justify-between hover:-translate-y-1.5"
            >
              {/* Photo */}
              <div className="relative aspect-[4/5] overflow-hidden bg-neutral-900">
                <img
                  src={stylist.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80'}
                  alt={stylist.fullName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-salon-charcoal via-transparent to-transparent opacity-90" />

                {/* Experience Badge */}
                {stylist.experienceYears && (
                  <div className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold bg-salon-noir/80 text-salon-gold-light border border-salon-gold/40 backdrop-blur-md flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-salon-gold" />
                    <span>{stylist.experienceYears} năm kinh nghiệm</span>
                  </div>
                )}

                {/* Name Overlay */}
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="flex items-center gap-1 text-salon-gold text-xs mb-1">
                    <Star className="w-3.5 h-3.5 fill-salon-gold" />
                    <span>Master Stylist</span>
                  </div>
                  <h3 className="font-serif font-bold text-2xl text-white">
                    {stylist.fullName}
                  </h3>
                </div>
              </div>

              {/* Bio & Specialties */}
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  {stylist.bio && (
                    <p className="text-xs text-neutral-400 font-light leading-relaxed line-clamp-3">
                      {stylist.bio}
                    </p>
                  )}

                  {/* Specialties Pills */}
                  {stylist.specialties && stylist.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {stylist.specialties.map((spec, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-0.5 rounded-full text-[11px] bg-salon-gold/10 text-salon-gold-light border border-salon-gold/25"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action CTA */}
                <div className="pt-4 border-t border-white/5">
                  <Link
                    href={`/booking?stylistId=${stylist.id}`}
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-salon-gold/15 hover:bg-salon-gold text-salon-gold-light hover:text-salon-noir font-bold text-xs border border-salon-gold/30 transition shadow-sm"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Đặt Lịch Với Stylist</span>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
