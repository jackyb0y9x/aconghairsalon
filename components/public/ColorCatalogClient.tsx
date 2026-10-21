'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Calendar,
  ShieldCheck,
  Droplet,
  Info,
  ChevronDown,
  RotateCcw,
} from 'lucide-react';

export interface ColorItem {
  id: string;
  name: string;
  code?: string;
  hexCode?: string;
  hexColor?: string;
  secondaryHex?: string | null;
  tone: string;
  group?: string;
  brightness?: string;
  brightnessLevel?: number;
  requiresBleach?: boolean;
  bleachRounds?: number;
  skinSuitability?: string[];
  suitableSkinTones?: string[];
  maintenanceLevel?: string;
  maintenanceAdvice?: string | null;
  colorFadingAdvice?: string | null;
  isTrending?: boolean;
}

interface ColorCatalogClientProps {
  initialColors: ColorItem[];
}

export function ColorCatalogClient({ initialColors }: ColorCatalogClientProps) {
  const [selectedTone, setSelectedTone] = useState<'ALL' | 'WARM' | 'COOL' | 'NEUTRAL'>('ALL');
  const [selectedGroup, setSelectedGroup] = useState<string>('ALL');
  const [bleachFilter, setBleachFilter] = useState<'ALL' | 'NO_BLEACH' | 'REQUIRES_BLEACH'>('ALL');
  const [expandedColorId, setExpandedColorId] = useState<string | null>(null);

  const filteredColors = useMemo(() => {
    return initialColors.filter((color) => {
      // 1. Tone
      if (selectedTone !== 'ALL' && color.tone !== selectedTone) {
        return false;
      }
      // 2. Group
      if (selectedGroup !== 'ALL') {
        const grp = (color.group || '').toUpperCase();
        if (selectedGroup === 'BROWN' && !grp.includes('BROWN')) return false;
        if (selectedGroup === 'ASH' && !grp.includes('ASH')) return false;
        if (selectedGroup === 'BLONDE' && !grp.includes('BLONDE')) return false;
        if (selectedGroup === 'RED' && !grp.includes('RED')) return false;
      }
      // 3. Bleach
      if (bleachFilter === 'NO_BLEACH' && color.requiresBleach) return false;
      if (bleachFilter === 'REQUIRES_BLEACH' && !color.requiresBleach) return false;

      return true;
    });
  }, [initialColors, selectedTone, selectedGroup, bleachFilter]);

  const handleResetFilters = () => {
    setSelectedTone('ALL');
    setSelectedGroup('ALL');
    setBleachFilter('ALL');
  };

  const isFiltered = selectedTone !== 'ALL' || selectedGroup !== 'ALL' || bleachFilter !== 'ALL';

  return (
    <div className="space-y-12">
      {/* Consultative Skin Tone Matching Guide Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-salon-charcoal via-salon-charcoal/90 to-salon-noir border border-salon-gold/30 shadow-luxury-dark space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-salon-gold/20 pb-4">
          <div>
            <span className="text-xs font-semibold text-salon-gold uppercase tracking-widest">
              Consultative Expert Guide
            </span>
            <h2 className="text-2xl font-serif font-bold text-white mt-1">
              Bí Quyết Chọn Màu Nhuộm Theo Sắc Tố Da (Undertone)
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-1.5 rounded-full self-start md:self-auto">
            <ShieldCheck className="w-4 h-4" />
            <span>100% Thuốc nhuộm không Amoniac</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-neutral-300">
          <div className="p-4 rounded-2xl bg-salon-noir/70 border border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-salon-gold-light text-sm">Da Trắng Sáng</span>
              <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 text-[10px]">Cool Undertone</span>
            </div>
            <p className="text-neutral-400 font-light leading-relaxed">
              Tĩnh mạch cổ tay màu xanh lam/tím. Rất hợp với các tông màu lạnh như Xám Khói, Bạch Kim Nordic, Nâu Trà Sữa và Hồng Pastel.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-salon-noir/70 border border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-salon-gold-light text-sm">Da Trung Tính</span>
              <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px]">Neutral Undertone</span>
            </div>
            <p className="text-neutral-400 font-light leading-relaxed">
              Tĩnh mạch màu xanh lá pha xanh dương. Cực kỳ linh hoạt, phù hợp hoàn hảo với Nâu Tây Lạnh, Nâu Hạt Dẻ, Nâu Caramel và Rêu Khói.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-salon-noir/70 border border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-salon-gold-light text-sm">Da Ngăm / Bánh Mật</span>
              <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 text-[10px]">Warm Undertone</span>
            </div>
            <p className="text-neutral-400 font-light leading-relaxed">
              Tĩnh mạch màu xanh lá mạ. Tôn da nổi bật với Nâu Socola Trầm, Đỏ Rượu Cherry, Nâu Cà Phê và Đen Ánh Xanh Sapphire.
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Controls Bar */}
      <div className="p-6 rounded-2xl bg-salon-charcoal/70 border border-salon-gold/20 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-salon-gold uppercase tracking-wider">
              Lọc Bảng Màu:
            </span>
            {isFiltered && (
              <button
                onClick={handleResetFilters}
                className="text-xs text-neutral-400 hover:text-salon-gold flex items-center gap-1 transition ml-2"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Đặt lại</span>
              </button>
            )}
          </div>
          <span className="text-xs text-neutral-400">
            Hiển thị <strong className="text-salon-gold-light">{filteredColors.length}</strong> màu nhuộm
          </span>
        </div>

        {/* 1. Tone Tabs */}
        <div className="space-y-1.5">
          <span className="text-[11px] text-neutral-400 block">Sắc độ (Tone):</span>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'ALL', label: 'Tất Cả Tông' },
              { id: 'COOL', label: '❄️ Tông Lạnh (Cool)' },
              { id: 'WARM', label: '🔥 Tông Ấm (Warm)' },
              { id: 'NEUTRAL', label: '🌿 Tông Tự Nhiên (Neutral)' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTone(t.id as any)}
                className={`py-2 px-4 rounded-full text-xs font-medium transition ${
                  selectedTone === t.id
                    ? 'bg-salon-gold text-salon-noir font-bold shadow-sm'
                    : 'bg-salon-noir/80 text-neutral-300 hover:text-white border border-white/5'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Bleach Requirement Toggles */}
        <div className="space-y-1.5">
          <span className="text-[11px] text-neutral-400 block">Yêu cầu tẩy tóc:</span>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'ALL', label: 'Tất cả' },
              { id: 'NO_BLEACH', label: '🛡️ Không cần tẩy (Tóc bóng khỏe)' },
              { id: 'REQUIRES_BLEACH', label: '⚡ Cần tẩy / Nâng sáng Olaplex' },
            ].map((b) => (
              <button
                key={b.id}
                onClick={() => setBleachFilter(b.id as any)}
                className={`py-2 px-4 rounded-full text-xs font-medium transition ${
                  bleachFilter === b.id
                    ? 'bg-salon-gold/25 text-salon-gold-light border border-salon-gold font-semibold'
                    : 'bg-salon-noir/80 text-neutral-300 hover:text-white border border-white/5'
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Swatches Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredColors.map((color) => {
          const hex = color.hexCode || color.hexColor || '#59493E';
          const secHex = color.secondaryHex || hex;
          const isExpanded = expandedColorId === color.id;
          const advice = color.maintenanceAdvice || color.colorFadingAdvice;

          return (
            <div
              key={color.id}
              className="rounded-2xl overflow-hidden bg-salon-charcoal border border-salon-gold/20 hover:border-salon-gold/60 transition-all duration-300 hover:shadow-gold-glow flex flex-col justify-between p-5 space-y-4 hover:-translate-y-1"
            >
              {/* Swatch Header & Color Circle with realistic sheen */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-salon-noir text-salon-gold-light border border-salon-gold/30">
                    {color.code || 'CLR-LMR'}
                  </span>
                  {color.requiresBleach ? (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                      <Droplet className="w-3 h-3" />
                      <span>Cần tẩy</span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Không tẩy</span>
                    </span>
                  )}
                </div>

                {/* Swatch Pill with Metallic Sheen */}
                <div className="relative aspect-video rounded-xl overflow-hidden border border-white/20 shadow-inner flex items-center justify-center p-3">
                  <div
                    className="absolute inset-0"
                    style={{
                      background: `linear-gradient(135deg, ${hex} 0%, ${secHex} 50%, ${hex} 100%)`,
                    }}
                  />
                  {/* Sheen reflection highlight */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent pointer-events-none" />
                  <div className="relative z-10 text-center font-mono text-xs uppercase tracking-widest text-white/90 drop-shadow-md font-bold">
                    {hex}
                  </div>
                </div>

                {/* Title & Tone Info */}
                <div>
                  <h3 className="font-serif font-bold text-lg text-white">
                    {color.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-xs text-neutral-400">
                    <span>
                      {color.tone === 'COOL' ? 'Tông Lạnh' : color.tone === 'WARM' ? 'Tông Ấm' : 'Tông Tự Nhiên'}
                    </span>
                    <span>•</span>
                    <span>Độ sáng: {color.brightnessLevel || 6}/10</span>
                  </div>
                </div>

                {/* Suitable Skin Tones */}
                {color.suitableSkinTones && color.suitableSkinTones.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[11px] text-neutral-400 block">Hợp da:</span>
                    <div className="flex flex-wrap gap-1">
                      {color.suitableSkinTones.map((skin, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded text-[10px] bg-salon-noir text-neutral-300 border border-white/5"
                        >
                          {skin}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Expandable Care & Fading Advice */}
                {advice && (
                  <div className="pt-2 border-t border-white/5">
                    <button
                      onClick={() => setExpandedColorId(isExpanded ? null : color.id)}
                      className="flex items-center justify-between w-full text-left text-xs text-salon-gold hover:text-salon-gold-light transition"
                    >
                      <span className="flex items-center gap-1">
                        <Info className="w-3.5 h-3.5" />
                        <span>Lưu ý giữ màu & phai</span>
                      </span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {isExpanded && (
                      <p className="mt-2 text-xs text-neutral-400 leading-relaxed font-light p-2.5 rounded-lg bg-salon-noir/80 border border-white/5 animate-fadeIn">
                        {advice}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Card Action CTAs */}
              <div className="pt-2 border-t border-white/5">
                <Link
                  href={`/booking?hairColorId=${color.id}`}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-salon-gold hover:bg-salon-gold-hover text-salon-noir text-xs font-bold transition shadow-sm"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Đặt Nhuộm Màu Này</span>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
