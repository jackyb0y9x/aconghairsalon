'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Scissors,
  Plus,
  Search,
  Edit2,
  Trash2,
  Sparkles,
  Flame,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { formatPriceRange } from '@/lib/utils';

interface Props {
  initialHairstyles: any[];
  categories: { id: string; name: string }[];
}

export function HairstylesManagementClient({ initialHairstyles, categories }: Props) {
  const [hairstyles, setHairstyles] = useState<any[]>(initialHairstyles);
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState<string>('ALL');
  const [lengthFilter, setLengthFilter] = useState<string>('ALL');
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchHairstyles = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/hairstyles');
      if (res.ok) {
        const data = await res.json();
        setHairstyles(data);
      }
    } catch (err) {
      console.error('Failed to load hairstyles:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa kiểu tóc này?')) return;
    setIsDeletingId(id);
    try {
      const res = await fetch(`/api/admin/hairstyles/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setHairstyles((prev) => prev.filter((h) => h.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete hairstyle:', err);
    } finally {
      setIsDeletingId(null);
    }
  };

  const filteredHairstyles = hairstyles.filter((h) => {
    const nameStr = h.title || h.name || '';
    const slugStr = h.slug || '';
    const matchesSearch =
      nameStr.toLowerCase().includes(search.toLowerCase()) ||
      slugStr.toLowerCase().includes(search.toLowerCase());

    if (genderFilter !== 'ALL' && h.gender !== genderFilter) return false;
    if (lengthFilter !== 'ALL' && h.length !== lengthFilter) return false;

    return matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-salon-gold/15">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-salon-gold mb-1">
            <Scissors className="w-3.5 h-3.5" />
            <span>Thư Viện Kiểu Tóc</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-salon-ivory">
            Quản Lý Bộ Sưu Tập Kiểu Tóc
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Quản lý catalog mẫu tóc đa chiều: giới tính, dáng mặt, độ chăm sóc, bộ ảnh gallery và giá tham khảo.
          </p>
        </div>

        <Link
          href="/admin/hairstyles/new"
          className="px-4 py-2 bg-salon-gold text-salon-noir font-semibold rounded-lg hover:bg-salon-gold/90 transition-colors flex items-center gap-2 text-sm shadow-md shadow-salon-gold/10 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Kiểu Tóc Mới</span>
        </Link>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-salon-charcoal/60 p-4 rounded-xl border border-salon-gold/15">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên mẫu, slug..."
            className="w-full bg-salon-noir border border-salon-gold/20 rounded-lg pl-9 pr-3 py-1.5 text-sm text-salon-ivory focus:outline-none focus:border-salon-gold"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
            className="bg-salon-noir border border-salon-gold/20 rounded-lg px-3 py-1.5 text-xs text-salon-ivory focus:outline-none focus:border-salon-gold"
          >
            <option value="ALL">Mọi giới tính</option>
            <option value="FEMALE">Nữ</option>
            <option value="MALE">Nam</option>
            <option value="UNISEX">Unisex</option>
          </select>

          <select
            value={lengthFilter}
            onChange={(e) => setLengthFilter(e.target.value)}
            className="bg-salon-noir border border-salon-gold/20 rounded-lg px-3 py-1.5 text-xs text-salon-ivory focus:outline-none focus:border-salon-gold"
          >
            <option value="ALL">Mọi độ dài</option>
            <option value="SHORT">Ngắn</option>
            <option value="MEDIUM">Ngang vai</option>
            <option value="LONG">Dài</option>
          </select>

          <button
            onClick={fetchHairstyles}
            disabled={loading}
            className="p-2 border border-salon-gold/20 rounded-lg text-zinc-400 hover:text-salon-gold transition-colors"
            title="Làm mới"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-salon-charcoal rounded-xl border border-salon-gold/20 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-salon-ivory">
            <thead className="bg-salon-noir/80 border-b border-salon-gold/20 text-xs font-semibold uppercase tracking-wider text-salon-gold">
              <tr>
                <th className="py-3.5 px-4 w-20">Ảnh</th>
                <th className="py-3.5 px-4">Tên kiểu tóc</th>
                <th className="py-3.5 px-4">Phân loại</th>
                <th className="py-3.5 px-4 text-right">Giá tham khảo</th>
                <th className="py-3.5 px-4 text-center">Độ chăm sóc</th>
                <th className="py-3.5 px-4 text-center">Trạng thái</th>
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-salon-gold/10">
              {filteredHairstyles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-zinc-400">
                    Chưa có kiểu tóc nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredHairstyles.map((h) => {
                  const title = h.title || h.name || '';
                  const img = h.coverImageUrl || h.images?.[0] || '/images/default-hair.jpg';
                  const galleryCount = (h.galleryImages?.length || 0) + (h.images?.length > 1 ? h.images.length - 1 : 0);
                  const priceStr = formatPriceRange(h.priceRefMin || h.price, h.priceRefMax || h.price);

                  return (
                    <tr key={h.id} className="hover:bg-salon-noir/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="w-14 h-14 rounded-lg overflow-hidden border border-salon-gold/20 bg-black relative">
                          <img
                            src={img}
                            alt={title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                          {galleryCount > 0 && (
                            <span className="absolute bottom-0 right-0 bg-black/70 text-[10px] text-salon-gold font-bold px-1 rounded-tl">
                              +{galleryCount}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-salon-ivory flex items-center gap-2">
                          <span>{title}</span>
                          {h.isTrending && (
                            <span className="p-0.5 rounded text-amber-400" title="Xu hướng">
                              <Flame className="w-3.5 h-3.5" />
                            </span>
                          )}
                          {h.isFeatured && (
                            <span className="p-0.5 rounded text-salon-gold" title="Nổi bật">
                              <Sparkles className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-zinc-400 font-mono line-clamp-1">{h.slug}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap items-center gap-1">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-salon-noir text-salon-gold border border-salon-gold/20">
                            {h.gender}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] text-zinc-300 bg-salon-noir border border-zinc-700">
                            {h.length}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] text-zinc-400 bg-salon-noir border border-zinc-700">
                            {h.styleVibe || h.style}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-salon-gold font-bold">
                        {priceStr}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-salon-noir text-zinc-300 border border-zinc-700">
                          {h.careLevel || h.careEffort}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {h.isActive ? (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Mở</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-zinc-500">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Tắt</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/hairstyles/${h.id}`}
                            className="p-1.5 text-zinc-400 hover:text-salon-gold transition-colors"
                            title="Chỉnh sửa"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(h.id)}
                            disabled={isDeletingId === h.id}
                            className="p-1.5 text-zinc-400 hover:text-rose-400 transition-colors"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
