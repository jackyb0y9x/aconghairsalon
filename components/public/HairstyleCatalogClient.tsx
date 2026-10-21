'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Search,
  Filter,
  X,
  Heart,
  Sparkles,
  Calendar,
  SlidersHorizontal,
  ChevronDown,
  RotateCcw,
} from 'lucide-react';
import { formatVND } from '@/lib/utils';

export interface HairstyleItem {
  id: string;
  name: string;
  title?: string;
  slug: string;
  summary?: string | null;
  description?: string;
  coverImageUrl?: string;
  galleryImages?: string[];
  gender: string;
  length: string;
  style?: string;
  styleVibe?: string;
  faceShape?: string;
  suitableFaces?: string[];
  texture?: string;
  suitableTexture?: string[];
  careLevel?: string;
  careEffort?: string;
  price?: number;
  priceRefMin?: number;
  priceRefMax?: number;
  isTrending?: boolean;
  isFeatured?: boolean;
  viewCount?: number;
  tags?: string[];
  features?: string[];
}

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
}

interface HairstyleCatalogClientProps {
  initialHairstyles: HairstyleItem[];
  categories?: CategoryItem[];
}

export function HairstyleCatalogClient({
  initialHairstyles,
  categories = [],
}: HairstyleCatalogClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read current filters from URL
  const currentGender = searchParams.get('gender') || 'ALL';
  const currentLength = searchParams.get('length') || 'ALL';
  const currentFace = searchParams.get('faceShape') || 'ALL';
  const currentTexture = searchParams.get('texture') || 'ALL';
  const currentCare = searchParams.get('careEffort') || searchParams.get('careLevel') || 'ALL';
  const currentStyle = searchParams.get('style') || searchParams.get('styleVibe') || 'ALL';
  const currentSearch = searchParams.get('search') || searchParams.get('q') || '';
  const currentSort = searchParams.get('sort') || 'newest';

  // Local state for instant search input
  const [searchInput, setSearchInput] = useState(currentSearch);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);

  // Load favorites from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('lumiere_favorites');
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, []);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = favorites.includes(id)
      ? favorites.filter((fid) => fid !== id)
      : [...favorites, id];
    setFavorites(next);
    try {
      localStorage.setItem('lumiere_favorites', JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  // Helper to push updated search params to URL
  const updateUrlParam = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, val]) => {
      if (!val || val === 'ALL' || val === '') {
        params.delete(key);
      } else {
        params.set(key, val);
      }
    });
    const queryString = params.toString();
    const target = queryString ? `/hairstyles?${queryString}` : '/hairstyles';
    router.push(target, { scroll: false });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUrlParam({ search: searchInput });
  };

  const handleResetFilters = () => {
    setSearchInput('');
    router.push('/hairstyles', { scroll: false });
  };

  // 6D Client-Side Filtering
  const filteredHairstyles = useMemo(() => {
    return initialHairstyles.filter((h) => {
      // 1. Gender
      if (currentGender !== 'ALL') {
        const hg = (h.gender || '').toUpperCase();
        if (currentGender === 'UNISEX' && hg !== 'UNISEX') return false;
        if (currentGender !== 'UNISEX' && hg !== currentGender && hg !== 'UNISEX') return false;
      }

      // 2. Length
      if (currentLength !== 'ALL') {
        const hl = (h.length || '').toUpperCase();
        if (currentLength === 'SHORT' && hl !== 'SHORT' && hl !== 'VERY_SHORT') return false;
        if (currentLength === 'LONG' && hl !== 'LONG' && hl !== 'EXTRA_LONG') return false;
        if (currentLength === 'MEDIUM' && hl !== 'MEDIUM') return false;
      }

      // 3. Face Shape
      if (currentFace !== 'ALL') {
        const faces = Array.isArray(h.suitableFaces)
          ? h.suitableFaces.map((f) => f.toUpperCase())
          : [(h.faceShape || '').toUpperCase()];
        if (!faces.includes(currentFace) && !faces.includes('ALL')) return false;
      }

      // 4. Hair Texture
      if (currentTexture !== 'ALL') {
        const textures = Array.isArray(h.suitableTexture)
          ? h.suitableTexture.map((t) => t.toUpperCase())
          : [(h.texture || '').toUpperCase()];
        if (!textures.includes(currentTexture) && !textures.includes('ALL')) return false;
      }

      // 5. Care Effort
      if (currentCare !== 'ALL') {
        const hc = (h.careEffort || h.careLevel || '').toUpperCase();
        if (currentCare === 'LOW' && hc !== 'LOW' && hc !== 'EASY') return false;
        if (currentCare === 'HIGH' && hc !== 'HIGH') return false;
        if (currentCare === 'MEDIUM' && hc !== 'MEDIUM') return false;
      }

      // 6. Style Vibe
      if (currentStyle !== 'ALL') {
        const hs = (h.style || h.styleVibe || '').toUpperCase();
        if (hs !== currentStyle) return false;
      }

      // Search keyword
      if (currentSearch.trim()) {
        const q = currentSearch.toLowerCase().trim();
        const title = (h.title || h.name || '').toLowerCase();
        const summary = (h.summary || '').toLowerCase();
        const desc = (h.description || '').toLowerCase();
        const tags = (h.tags || []).join(' ').toLowerCase();
        if (!title.includes(q) && !summary.includes(q) && !desc.includes(q) && !tags.includes(q)) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (currentSort === 'popular') return (b.viewCount || 0) - (a.viewCount || 0);
      if (currentSort === 'price_asc') return (a.price || a.priceRefMin || 0) - (b.price || b.priceRefMin || 0);
      if (currentSort === 'price_desc') return (b.price || b.priceRefMin || 0) - (a.price || a.priceRefMin || 0);
      if (currentSort === 'trending') return (b.isTrending ? 1 : 0) - (a.isTrending ? 1 : 0);
      return 0; // Default order
    });
  }, [
    initialHairstyles,
    currentGender,
    currentLength,
    currentFace,
    currentTexture,
    currentCare,
    currentStyle,
    currentSearch,
    currentSort,
  ]);

  // Check if any filter is active
  const hasActiveFilters =
    currentGender !== 'ALL' ||
    currentLength !== 'ALL' ||
    currentFace !== 'ALL' ||
    currentTexture !== 'ALL' ||
    currentCare !== 'ALL' ||
    currentStyle !== 'ALL' ||
    Boolean(currentSearch);

  return (
    <div className="space-y-8">
      {/* Search & Top Action Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-salon-charcoal/80 border border-salon-gold/20 shadow-luxury-dark">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Tìm theo tên kiểu tóc, phong cách..."
            className="w-full pl-10 pr-10 py-2.5 rounded-full bg-salon-noir border border-salon-gold/30 text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-salon-gold transition"
          />
          <Search className="w-4 h-4 text-salon-gold absolute left-3.5 top-1/2 -translate-y-1/2" />
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                updateUrlParam({ search: null });
              }}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </form>

        {/* Sort & Mobile Filter Toggle */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          {/* Mobile Filter Button */}
          <button
            onClick={() => setIsMobileFilterOpen(true)}
            className="lg:hidden flex items-center gap-2 px-4 py-2.5 rounded-full bg-salon-gold/15 border border-salon-gold/30 text-salon-gold-light text-xs font-semibold hover:bg-salon-gold/25 transition"
          >
            <Filter className="w-3.5 h-3.5 text-salon-gold" />
            <span>Bộ Lọc (6 Tiêu Chí)</span>
          </button>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-400 hidden sm:inline">Sắp xếp:</span>
            <div className="relative">
              <select
                value={currentSort}
                onChange={(e) => updateUrlParam({ sort: e.target.value })}
                className="appearance-none pl-3 pr-8 py-2 rounded-full bg-salon-noir border border-salon-gold/30 text-xs font-medium text-white focus:outline-none focus:border-salon-gold transition cursor-pointer"
              >
                <option value="newest">Mới Nhất</option>
                <option value="trending">Thịnh Hành</option>
                <option value="popular">Xem Nhiều Nhất</option>
                <option value="price_asc">Giá: Thấp đến Cao</option>
                <option value="price_desc">Giá: Cao đến Thấp</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-salon-gold absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout: Sidebar + Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Desktop Filter Sidebar (1 col) */}
        <aside className="hidden lg:block space-y-6 bg-salon-charcoal/60 rounded-2xl p-6 border border-salon-gold/20 h-fit sticky top-24">
          <div className="flex items-center justify-between pb-4 border-b border-salon-gold/15">
            <div className="flex items-center gap-2 text-salon-gold-light font-serif font-bold text-base">
              <SlidersHorizontal className="w-4 h-4 text-salon-gold" />
              <span>Bộ Lọc Đa Tiêu Chí</span>
            </div>
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="text-xs text-neutral-400 hover:text-salon-gold flex items-center gap-1 transition"
                title="Đặt lại toàn bộ bộ lọc"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Đặt lại</span>
              </button>
            )}
          </div>

          {/* 1. Gender Target */}
          <div className="space-y-2.5">
            <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
              1. Đối Tượng
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'ALL', label: 'Tất Cả' },
                { id: 'FEMALE', label: 'Nữ' },
                { id: 'MALE', label: 'Nam' },
                { id: 'UNISEX', label: 'Unisex' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => updateUrlParam({ gender: opt.id })}
                  className={`py-1.5 px-3 rounded-lg text-xs font-medium transition text-center ${
                    currentGender === opt.id
                      ? 'bg-salon-gold text-salon-noir font-bold shadow-sm'
                      : 'bg-salon-noir/60 text-neutral-400 hover:text-white border border-white/5'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Hair Length */}
          <div className="space-y-2.5">
            <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
              2. Độ Dài Tóc
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'ALL', label: 'Tất Cả' },
                { id: 'SHORT', label: 'Ngắn' },
                { id: 'MEDIUM', label: 'Ngang Vai' },
                { id: 'LONG', label: 'Dài' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => updateUrlParam({ length: opt.id })}
                  className={`py-1.5 px-3 rounded-lg text-xs font-medium transition text-center ${
                    currentLength === opt.id
                      ? 'bg-salon-gold text-salon-noir font-bold shadow-sm'
                      : 'bg-salon-noir/60 text-neutral-400 hover:text-white border border-white/5'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Face Shape */}
          <div className="space-y-2.5">
            <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
              3. Dáng Khuôn Mặt
            </label>
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'ALL', label: 'Tất cả' },
                { id: 'OVAL', label: 'Trái xoan' },
                { id: 'ROUND', label: 'Tròn' },
                { id: 'SQUARE', label: 'Vuông' },
                { id: 'HEART', label: 'Trái tim' },
                { id: 'DIAMOND', label: 'Kim cương' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => updateUrlParam({ faceShape: opt.id })}
                  className={`py-1 px-2.5 rounded-full text-xs transition ${
                    currentFace === opt.id
                      ? 'bg-salon-gold/25 text-salon-gold-light border border-salon-gold font-semibold'
                      : 'bg-salon-noir/60 text-neutral-400 hover:text-white border border-white/5'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Hair Texture */}
          <div className="space-y-2.5">
            <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
              4. Chất Tóc
            </label>
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'ALL', label: 'Tất cả' },
                { id: 'STRAIGHT', label: 'Thẳng mượt' },
                { id: 'WAVY', label: 'Gợn sóng' },
                { id: 'THICK', label: 'Dày cứng' },
                { id: 'FINE', label: 'Mảnh xẹp' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => updateUrlParam({ texture: opt.id })}
                  className={`py-1 px-2.5 rounded-full text-xs transition ${
                    currentTexture === opt.id
                      ? 'bg-salon-gold/25 text-salon-gold-light border border-salon-gold font-semibold'
                      : 'bg-salon-noir/60 text-neutral-400 hover:text-white border border-white/5'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 5. Care Effort */}
          <div className="space-y-2.5">
            <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
              5. Mức Độ Chăm Sóc
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'ALL', label: 'Tất cả' },
                { id: 'LOW', label: 'Dễ' },
                { id: 'MEDIUM', label: 'Vừa' },
                { id: 'HIGH', label: 'Cầu kỳ' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => updateUrlParam({ careEffort: opt.id })}
                  className={`py-1.5 px-2 rounded-lg text-xs font-medium transition text-center ${
                    currentCare === opt.id
                      ? 'bg-salon-gold text-salon-noir font-bold'
                      : 'bg-salon-noir/60 text-neutral-400 hover:text-white border border-white/5'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 6. Style Vibe */}
          <div className="space-y-2.5">
            <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
              6. Phong Cách (Vibe)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'ALL', label: 'Tất cả' },
                { id: 'KOREAN', label: 'Hàn Quốc' },
                { id: 'JAPANESE', label: 'Nhật Bản' },
                { id: 'CLASSIC', label: 'Cổ Điển' },
                { id: 'BUSINESS', label: 'Công Sở' },
                { id: 'STREETWEAR', label: 'Cá Tính' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => updateUrlParam({ style: opt.id })}
                  className={`py-1 px-2.5 rounded-full text-xs transition ${
                    currentStyle === opt.id
                      ? 'bg-salon-gold/25 text-salon-gold-light border border-salon-gold font-semibold'
                      : 'bg-salon-noir/60 text-neutral-400 hover:text-white border border-white/5'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Hairstyles Grid & Active Filters (3 cols) */}
        <div className="lg:col-span-3 space-y-6">
          {/* Active Filter Pills Bar */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-salon-charcoal/40 border border-salon-gold/15 text-xs">
              <span className="text-neutral-400">Đang lọc theo:</span>

              {currentGender !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-salon-gold/15 text-salon-gold-light border border-salon-gold/30">
                  <span>Giới tính: {currentGender === 'FEMALE' ? 'Nữ' : currentGender === 'MALE' ? 'Nam' : 'Unisex'}</span>
                  <button onClick={() => updateUrlParam({ gender: null })}>
                    <X className="w-3 h-3 hover:text-white" />
                  </button>
                </span>
              )}

              {currentLength !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-salon-gold/15 text-salon-gold-light border border-salon-gold/30">
                  <span>Độ dài: {currentLength}</span>
                  <button onClick={() => updateUrlParam({ length: null })}>
                    <X className="w-3 h-3 hover:text-white" />
                  </button>
                </span>
              )}

              {currentFace !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-salon-gold/15 text-salon-gold-light border border-salon-gold/30">
                  <span>Mặt: {currentFace}</span>
                  <button onClick={() => updateUrlParam({ faceShape: null })}>
                    <X className="w-3 h-3 hover:text-white" />
                  </button>
                </span>
              )}

              {currentTexture !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-salon-gold/15 text-salon-gold-light border border-salon-gold/30">
                  <span>Chất tóc: {currentTexture}</span>
                  <button onClick={() => updateUrlParam({ texture: null })}>
                    <X className="w-3 h-3 hover:text-white" />
                  </button>
                </span>
              )}

              {currentCare !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-salon-gold/15 text-salon-gold-light border border-salon-gold/30">
                  <span>Chăm sóc: {currentCare}</span>
                  <button onClick={() => updateUrlParam({ careEffort: null })}>
                    <X className="w-3 h-3 hover:text-white" />
                  </button>
                </span>
              )}

              {currentStyle !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-salon-gold/15 text-salon-gold-light border border-salon-gold/30">
                  <span>Phong cách: {currentStyle}</span>
                  <button onClick={() => updateUrlParam({ style: null })}>
                    <X className="w-3 h-3 hover:text-white" />
                  </button>
                </span>
              )}

              {currentSearch && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-salon-gold/15 text-salon-gold-light border border-salon-gold/30">
                  <span>Từ khóa: &quot;{currentSearch}&quot;</span>
                  <button onClick={() => { setSearchInput(''); updateUrlParam({ search: null }); }}>
                    <X className="w-3 h-3 hover:text-white" />
                  </button>
                </span>
              )}

              <button
                onClick={handleResetFilters}
                className="text-salon-gold hover:underline font-semibold ml-auto"
              >
                Xóa tất cả
              </button>
            </div>
          )}

          {/* Results Count */}
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>
              Tìm thấy <strong className="text-salon-gold-light">{filteredHairstyles.length}</strong> kiểu tóc phù hợp
            </span>
          </div>

          {/* Grid of Cards */}
          {filteredHairstyles.length === 0 ? (
            <div className="text-center py-16 bg-salon-charcoal/40 rounded-3xl border border-salon-gold/15 p-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-salon-gold/10 text-salon-gold mx-auto flex items-center justify-center">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="font-serif font-bold text-xl text-white">
                Không tìm thấy kiểu tóc phù hợp
              </h3>
              <p className="text-neutral-400 text-sm max-w-md mx-auto">
                Hãy thử nới lỏng các tiêu chí lọc hoặc tìm kiếm với từ khóa khác để khám phá các mẫu tóc thời thượng.
              </p>
              <button
                onClick={handleResetFilters}
                className="px-6 py-2.5 rounded-full bg-salon-gold text-salon-noir font-bold text-xs hover:bg-salon-gold-hover transition shadow-sm"
              >
                Xóa tất cả bộ lọc
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredHairstyles.map((style) => {
                const title = style.title || style.name;
                const price = style.price || style.priceRefMin || 350000;
                const image = style.coverImageUrl || '/images/default-hair.jpg';
                const isFav = favorites.includes(style.id);

                return (
                  <div
                    key={style.id}
                    className="group rounded-2xl overflow-hidden bg-salon-charcoal border border-salon-gold/20 hover:border-salon-gold/60 transition-all duration-300 hover:shadow-gold-glow flex flex-col justify-between hover:-translate-y-1.5"
                  >
                    {/* Image Area */}
                    <div className="relative aspect-[4/5] overflow-hidden bg-neutral-900">
                      <div
                        className="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform duration-500"
                        style={{ backgroundImage: `url('${image}')` }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-salon-charcoal via-transparent to-transparent opacity-90" />

                      {/* Top Badges & Favorite Heart */}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-salon-noir/80 text-salon-gold-light border border-salon-gold/30 backdrop-blur-sm">
                          {style.gender === 'FEMALE' ? 'Nữ' : style.gender === 'MALE' ? 'Nam' : 'Unisex'}
                        </span>

                        <button
                          onClick={(e) => toggleFavorite(style.id, e)}
                          className={`p-2 rounded-full backdrop-blur-md transition ${
                            isFav
                              ? 'bg-rose-500/20 text-rose-500 border border-rose-500/40'
                              : 'bg-salon-noir/70 text-white/70 hover:text-rose-400 border border-white/10'
                          }`}
                          aria-label="Lưu vào danh sách yêu thích"
                        >
                          <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-500' : ''}`} />
                        </button>
                      </div>

                      {/* Price Indicator */}
                      <div className="absolute bottom-3 left-3 right-3">
                        <span className="text-[11px] text-neutral-300">Giá tham khảo từ</span>
                        <div className="text-lg font-bold text-salon-gold font-serif">
                          {formatVND(price)}
                        </div>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <Link href={`/hairstyles/${style.slug}`} className="hover:text-salon-gold transition">
                          <h3 className="font-serif font-bold text-lg text-white group-hover:text-salon-gold-light transition line-clamp-1">
                            {title}
                          </h3>
                        </Link>
                        {style.summary && (
                          <p className="text-xs text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                            {style.summary}
                          </p>
                        )}
                      </div>

                      {/* Pills: Face shape + Care */}
                      <div className="flex flex-wrap gap-1 text-[11px]">
                        {style.suitableFaces && style.suitableFaces.length > 0 && (
                          <span className="px-2 py-0.5 rounded bg-white/5 text-neutral-300 border border-white/5">
                            Mặt {style.suitableFaces[0]}
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded bg-salon-gold/10 text-salon-gold-light border border-salon-gold/20">
                          {style.careEffort === 'LOW' ? 'Dễ chăm sóc' : style.careEffort === 'HIGH' ? 'Cầu kỳ' : 'Vừa phải'}
                        </span>
                      </div>

                      {/* CTAs */}
                      <div className="pt-2 border-t border-white/5 space-y-2">
                        <Link
                          href={`/booking?hairstyleId=${style.id}`}
                          className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-salon-gold hover:bg-salon-gold-hover text-salon-noir text-xs font-bold transition shadow-gold-subtle"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Đặt Lịch Ngay</span>
                        </Link>

                        <Link
                          href={`/hairstyles/${style.slug}`}
                          className="block text-center text-xs text-neutral-400 hover:text-salon-gold transition pt-1"
                        >
                          Chi tiết & hướng dẫn tạo kiểu →
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filter Slide-out Drawer */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex justify-end">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsMobileFilterOpen(false)}
          />
          <div className="relative z-10 w-full max-w-sm bg-salon-charcoal border-l border-salon-gold/20 h-full flex flex-col p-6 overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-salon-gold/15">
              <span className="font-serif font-bold text-lg text-salon-gold-light">
                Bộ Lọc Kiểu Tóc
              </span>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="p-2 text-neutral-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="py-6 space-y-6">
              {/* Gender */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-neutral-300">Đối Tượng</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {['ALL', 'FEMALE', 'MALE', 'UNISEX'].map((g) => (
                    <button
                      key={g}
                      onClick={() => {
                        updateUrlParam({ gender: g });
                        setIsMobileFilterOpen(false);
                      }}
                      className={`py-2 px-3 rounded-lg text-xs font-medium text-center ${
                        currentGender === g ? 'bg-salon-gold text-salon-noir font-bold' : 'bg-salon-noir text-neutral-300'
                      }`}
                    >
                      {g === 'ALL' ? 'Tất Cả' : g === 'FEMALE' ? 'Nữ' : g === 'MALE' ? 'Nam' : 'Unisex'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Length */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-neutral-300">Độ Dài Tóc</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {['ALL', 'SHORT', 'MEDIUM', 'LONG'].map((l) => (
                    <button
                      key={l}
                      onClick={() => {
                        updateUrlParam({ length: l });
                        setIsMobileFilterOpen(false);
                      }}
                      className={`py-2 px-3 rounded-lg text-xs font-medium text-center ${
                        currentLength === l ? 'bg-salon-gold text-salon-noir font-bold' : 'bg-salon-noir text-neutral-300'
                      }`}
                    >
                      {l === 'ALL' ? 'Tất Cả' : l === 'SHORT' ? 'Ngắn' : l === 'MEDIUM' ? 'Ngang Vai' : 'Dài'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-salon-gold/15">
              <button
                onClick={() => {
                  handleResetFilters();
                  setIsMobileFilterOpen(false);
                }}
                className="w-full py-3 rounded-xl border border-salon-gold/40 text-salon-gold-light text-xs font-bold"
              >
                Xóa Bộ Lọc
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
