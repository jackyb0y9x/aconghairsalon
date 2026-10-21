'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Clock,
  Calendar,
  Sparkles,
  ChevronDown,
  Search,
  CheckCircle,
  HelpCircle,
  ShieldCheck,
} from 'lucide-react';
import { formatVND, formatPriceRange, formatDuration } from '@/lib/utils';

export interface ServiceItem {
  id: string;
  title: string;
  name?: string;
  slug: string;
  shortSummary?: string | null;
  description: string;
  durationMinutes: number;
  priceMin?: number;
  minPrice?: number;
  priceMax?: number | null;
  maxPrice?: number | null;
  category?: string;
  categoryId?: string | null;
  categoryDetails?: { id: string; name: string; slug: string } | null;
  preCareAdvice?: string | null;
  postCareAdvice?: string | null;
  imageUrl?: string | null;
  isPopular?: boolean;
}

export interface ComboItem {
  id: string;
  title: string;
  name?: string;
  slug: string;
  description: string;
  packagePrice: number;
  originalPrice: number;
  durationMinutes: number;
  savingsPercent?: number;
  imageUrl?: string | null;
  isFeatured?: boolean;
  services?: Array<{ id: string; title: string }>;
}

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
}

interface ServicesCatalogClientProps {
  categories?: CategoryItem[];
  services: ServiceItem[];
  combos?: ComboItem[];
}

export function ServicesCatalogClient({
  categories = [],
  services,
}: ServicesCatalogClientProps) {
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCareId, setExpandedCareId] = useState<string | null>(null);

  const filteredServices = useMemo(() => {
    return services.filter((srv) => {
      // Category Tab filter
      if (activeTab !== 'ALL') {
        const catName = srv.categoryDetails?.name || srv.category || '';
        const catSlug = srv.categoryDetails?.slug || '';
        if (
          !catName.toLowerCase().includes(activeTab.toLowerCase()) &&
          !catSlug.toLowerCase().includes(activeTab.toLowerCase())
        ) {
          return false;
        }
      }

      // Search keyword filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const title = (srv.title || srv.name || '').toLowerCase();
        const desc = srv.description.toLowerCase();
        const summary = (srv.shortSummary || '').toLowerCase();
        if (!title.includes(q) && !desc.includes(q) && !summary.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [services, activeTab, searchQuery]);

  const tabs = [
    { id: 'ALL', label: 'Tất Cả Dịch Vụ' },
    { id: 'Cắt', label: 'Cắt & Tạo Kiểu' },
    { id: 'Uốn', label: 'Uốn Sóng & Nâng Phồng' },
    { id: 'Nhuộm', label: 'Nhuộm & Tẩy Olaplex' },
    { id: 'Phục hồi', label: 'Chăm Sóc & Phục Hồi' },
  ];

  return (
    <div className="space-y-10">
      {/* Search & Tabs Filter Bar */}
      <div className="space-y-6">
        {/* Search Input */}
        <div className="max-w-md mx-auto relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm dịch vụ làm tóc, uốn nhuộm, phục hồi..."
            className="w-full pl-11 pr-4 py-3 rounded-full bg-salon-charcoal/80 border border-salon-gold/30 text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-salon-gold shadow-luxury-dark transition"
          />
          <Search className="w-4 h-4 text-salon-gold absolute left-4 top-1/2 -translate-y-1/2" />
        </div>

        {/* Tab Pills */}
        <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-5 rounded-full text-xs font-semibold transition whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-salon-gold text-salon-noir shadow-gold-subtle font-bold'
                  : 'bg-salon-charcoal/80 text-neutral-300 hover:text-white border border-white/5 hover:border-salon-gold/40'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Services Grid */}
      <section className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => {
              const pMin = Number(service.priceMin ?? service.minPrice ?? 0);
              const pMax = service.priceMax ?? service.maxPrice ? Number(service.priceMax ?? service.maxPrice) : null;
              const isCareOpen = expandedCareId === service.id;
              const title = service.title || service.name;

              return (
                <div
                  key={service.id}
                  className="rounded-2xl overflow-hidden bg-salon-charcoal border border-salon-gold/20 hover:border-salon-gold/50 transition-all duration-300 hover:shadow-gold-glow flex flex-col justify-between p-6 space-y-4 hover:-translate-y-1"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-salon-gold/10 text-salon-gold border border-salon-gold/25">
                        {service.categoryDetails?.name || service.category || 'Dịch Vụ Salon'}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-xs text-neutral-400">
                        <Clock className="w-3.5 h-3.5 text-salon-gold" />
                        <span>{formatDuration(service.durationMinutes)}</span>
                      </span>
                    </div>

                    <h3 className="font-serif font-bold text-lg text-white">
                      {title}
                    </h3>

                    {service.shortSummary && (
                      <p className="text-xs text-neutral-400 leading-relaxed font-light">
                        {service.shortSummary}
                      </p>
                    )}

                    <p className="text-xs text-neutral-300 leading-relaxed font-light line-clamp-3">
                      {service.description}
                    </p>

                    {/* Pre-Care & Post-Care Accordion */}
                    {(service.preCareAdvice || service.postCareAdvice) && (
                      <div className="pt-2 border-t border-white/5">
                        <button
                          onClick={() => setExpandedCareId(isCareOpen ? null : service.id)}
                          className="flex items-center justify-between w-full text-left text-xs text-salon-gold hover:text-salon-gold-light transition"
                        >
                          <span className="flex items-center gap-1.5">
                            <HelpCircle className="w-3.5 h-3.5" />
                            <span>Lưu ý chuẩn bị & chăm sóc</span>
                          </span>
                          <ChevronDown
                            className={`w-3.5 h-3.5 transform transition-transform ${isCareOpen ? 'rotate-180' : ''}`}
                          />
                        </button>

                        {isCareOpen && (
                          <div className="mt-3 p-3 rounded-xl bg-salon-noir/80 border border-white/5 space-y-2 text-[11px] text-neutral-300 leading-relaxed animate-fadeIn">
                            {service.preCareAdvice && (
                              <div>
                                <span className="font-semibold text-salon-gold-light block mb-0.5">
                                  Chuẩn bị trước khi làm:
                                </span>
                                <p className="text-neutral-400 font-light">{service.preCareAdvice}</p>
                              </div>
                            )}
                            {service.postCareAdvice && (
                              <div>
                                <span className="font-semibold text-salon-gold-light block mb-0.5">
                                  Chăm sóc sau dịch vụ:
                                </span>
                                <p className="text-neutral-400 font-light">{service.postCareAdvice}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Bottom: Transparent Price & CTA */}
                  <div className="pt-4 border-t border-white/5 flex items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] text-neutral-400 block">Chi phí:</span>
                      <div className="text-base font-bold text-salon-gold font-serif">
                        {formatPriceRange(pMin, pMax)}
                      </div>
                    </div>

                    <Link
                      href={`/booking?serviceId=${service.id}`}
                      className="inline-flex items-center gap-1.5 py-2.5 px-4 rounded-xl bg-salon-gold hover:bg-salon-gold-hover text-salon-noir font-bold text-xs shadow-sm transition"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Đặt Lịch</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

      {/* Empty Search Fallback */}
      {filteredServices.length === 0 && (
        <div className="text-center py-16 bg-salon-charcoal/40 rounded-3xl border border-salon-gold/15 p-8 space-y-3">
          <p className="text-neutral-400 text-sm">
            Không tìm thấy dịch vụ nào phù hợp với từ khóa &quot;{searchQuery}&quot;.
          </p>
          <button
            onClick={() => { setSearchQuery(''); setActiveTab('ALL'); }}
            className="text-xs text-salon-gold hover:underline font-semibold"
          >
            Xem lại tất cả dịch vụ
          </button>
        </div>
      )}
    </div>
  );
}
