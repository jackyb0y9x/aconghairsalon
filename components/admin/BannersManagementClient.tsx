'use client';

import React, { useState } from 'react';
import {
  Image as ImageIcon,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ArrowUpDown,
  RefreshCw,
} from 'lucide-react';
import { BannerModal, BannerData } from './BannerModal';

interface Props {
  initialBanners: any[];
}

export function BannersManagementClient({ initialBanners }: Props) {
  const [banners, setBanners] = useState<any[]>(initialBanners);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<BannerData | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/banners');
      if (res.ok) {
        const data = await res.json();
        setBanners(data);
      }
    } catch (err) {
      console.error('Failed to load banners:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/banners/${id}/toggle`, { method: 'PATCH' });
      if (res.ok) {
        const updated = await res.json();
        setBanners((prev) =>
          prev.map((b) => (b.id === id ? { ...b, isActive: updated.isActive, active: updated.active } : b))
        );
      }
    } catch (err) {
      console.error('Failed to toggle banner:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa banner này?')) return;
    setIsDeletingId(id);
    try {
      const res = await fetch(`/api/admin/banners/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setBanners((prev) => prev.filter((b) => b.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete banner:', err);
    } finally {
      setIsDeletingId(null);
    }
  };

  const filteredBanners = banners.filter((b) => {
    const matchesSearch =
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      (b.subtitle && b.subtitle.toLowerCase().includes(search.toLowerCase()));

    if (activeFilter === 'ACTIVE') return matchesSearch && (b.isActive ?? b.active);
    if (activeFilter === 'INACTIVE') return matchesSearch && !(b.isActive ?? b.active);
    return matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-salon-gold/15">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-salon-gold mb-1">
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Truyền Thông & Quảng Bá</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-salon-ivory">
            Quản Lý Banner Trang Chủ
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Điều phối hero banners, thứ tự hiển thị, chương trình khuyến mãi và liên kết CTA.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingBanner(null);
            setIsModalOpen(true);
          }}
          className="px-4 py-2 bg-salon-gold text-salon-noir font-semibold rounded-lg hover:bg-salon-gold/90 transition-colors flex items-center gap-2 text-sm shadow-md shadow-salon-gold/10 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Banner Mới</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-salon-charcoal/60 p-4 rounded-xl border border-salon-gold/15">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tiêu đề, phụ đề..."
            className="w-full bg-salon-noir border border-salon-gold/20 rounded-lg pl-9 pr-3 py-1.5 text-sm text-salon-ivory focus:outline-none focus:border-salon-gold"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-salon-gold/20 bg-salon-noir p-0.5 text-xs font-medium">
            <button
              onClick={() => setActiveFilter('ALL')}
              className={`px-3 py-1 rounded-md transition-colors ${
                activeFilter === 'ALL' ? 'bg-salon-gold text-salon-noir' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Tất cả ({banners.length})
            </button>
            <button
              onClick={() => setActiveFilter('ACTIVE')}
              className={`px-3 py-1 rounded-md transition-colors ${
                activeFilter === 'ACTIVE' ? 'bg-salon-gold text-salon-noir' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Đang chạy
            </button>
            <button
              onClick={() => setActiveFilter('INACTIVE')}
              className={`px-3 py-1 rounded-md transition-colors ${
                activeFilter === 'INACTIVE' ? 'bg-salon-gold text-salon-noir' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Tắt
            </button>
          </div>

          <button
            onClick={fetchBanners}
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
                <th className="py-3.5 px-4 w-28">Hình ảnh</th>
                <th className="py-3.5 px-4">Tiêu đề & Phụ đề</th>
                <th className="py-3.5 px-4">Huy hiệu / CTA</th>
                <th className="py-3.5 px-4 text-center">Thứ tự</th>
                <th className="py-3.5 px-4 text-center">Trạng thái</th>
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-salon-gold/10">
              {filteredBanners.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-zinc-400">
                    Chưa có banner nào phù hợp với điều kiện tìm kiếm.
                  </td>
                </tr>
              ) : (
                filteredBanners.map((b) => (
                  <tr key={b.id} className="hover:bg-salon-noir/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="w-20 h-12 rounded-lg overflow-hidden border border-salon-gold/20 bg-black flex items-center justify-center">
                        <img
                          src={b.imageUrl}
                          alt={b.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-sm text-salon-gold-light">{b.title}</div>
                      {b.subtitle && <div className="text-xs text-zinc-300 line-clamp-2 mt-0.5">{b.subtitle}</div>}
                    </td>
                    <td className="py-3 px-4">
                      {b.badgeText && (
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-salon-gold/15 text-salon-gold border border-salon-gold/30 mb-1">
                          {b.badgeText}
                        </span>
                      )}
                      <div className="text-xs text-zinc-400 flex items-center gap-1">
                        <span>{b.ctaText || 'Khám phá'}</span>
                        <ExternalLink className="w-3 h-3 text-zinc-500" />
                        <span className="text-[11px] text-zinc-500 font-mono">({b.linkUrl || b.ctaLink})</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-salon-gold font-bold">
                      {b.displayOrder ?? b.order ?? 0}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggle(b.id)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                          b.isActive ?? b.active
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                        }`}
                      >
                        {b.isActive ?? b.active ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Hiển thị</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Tắt</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingBanner(b);
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 text-zinc-400 hover:text-salon-gold transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(b.id)}
                          disabled={isDeletingId === b.id}
                          className="p-1.5 text-zinc-400 hover:text-rose-400 transition-colors"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <BannerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        banner={editingBanner}
        onSaved={fetchBanners}
      />
    </div>
  );
}
