'use client';

import React, { useState } from 'react';
import {
  Palette,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Flame,
  AlertTriangle,
} from 'lucide-react';
import { ColorSwatchModal, ColorData } from './ColorSwatchModal';

interface Props {
  initialColors: any[];
}

export function ColorsManagementClient({ initialColors }: Props) {
  const [colors, setColors] = useState<any[]>(initialColors);
  const [search, setSearch] = useState('');
  const [toneFilter, setToneFilter] = useState<'ALL' | 'WARM' | 'COOL' | 'NEUTRAL'>('ALL');
  const [bleachFilter, setBleachFilter] = useState<'ALL' | 'BLEACH' | 'NO_BLEACH'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingColor, setEditingColor] = useState<ColorData | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchColors = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/colors');
      if (res.ok) {
        const data = await res.json();
        setColors(data);
      }
    } catch (err) {
      console.error('Failed to load colors:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa màu nhuộm này?')) return;
    setIsDeletingId(id);
    try {
      const res = await fetch(`/api/admin/colors/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setColors((prev) => prev.filter((c) => c.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete color:', err);
    } finally {
      setIsDeletingId(null);
    }
  };

  const filteredColors = colors.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.code && c.code.toLowerCase().includes(search.toLowerCase()));

    if (toneFilter !== 'ALL' && c.tone !== toneFilter) return false;
    if (bleachFilter === 'BLEACH' && !c.requiresBleach) return false;
    if (bleachFilter === 'NO_BLEACH' && c.requiresBleach) return false;

    return matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-salon-gold/15">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-salon-gold mb-1">
            <Palette className="w-3.5 h-3.5" />
            <span>Danh Mục Màu Nhuộm</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-salon-ivory">
            Quản Lý Bảng Màu Nhuộm Swatches
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Quản lý công thức màu, mã HEX chính/phụ, yêu cầu tẩy tóc và lưu ý chăm sóc giữ màu.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingColor(null);
            setIsModalOpen(true);
          }}
          className="px-4 py-2 bg-salon-gold text-salon-noir font-semibold rounded-lg hover:bg-salon-gold/90 transition-colors flex items-center gap-2 text-sm shadow-md shadow-salon-gold/10 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Màu Nhuộm Mới</span>
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
            placeholder="Tìm theo tên màu, mã công thức..."
            className="w-full bg-salon-noir border border-salon-gold/20 rounded-lg pl-9 pr-3 py-1.5 text-sm text-salon-ivory focus:outline-none focus:border-salon-gold"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Tone Filter */}
          <div className="flex rounded-lg border border-salon-gold/20 bg-salon-noir p-0.5 text-xs font-medium">
            <button
              onClick={() => setToneFilter('ALL')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                toneFilter === 'ALL' ? 'bg-salon-gold text-salon-noir font-bold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Tất cả tone
            </button>
            <button
              onClick={() => setToneFilter('WARM')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                toneFilter === 'WARM' ? 'bg-salon-gold text-salon-noir font-bold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Ấm
            </button>
            <button
              onClick={() => setToneFilter('COOL')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                toneFilter === 'COOL' ? 'bg-salon-gold text-salon-noir font-bold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Lạnh
            </button>
            <button
              onClick={() => setToneFilter('NEUTRAL')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                toneFilter === 'NEUTRAL' ? 'bg-salon-gold text-salon-noir font-bold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Trung tính
            </button>
          </div>

          {/* Bleach Filter */}
          <div className="flex rounded-lg border border-salon-gold/20 bg-salon-noir p-0.5 text-xs font-medium">
            <button
              onClick={() => setBleachFilter('ALL')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                bleachFilter === 'ALL' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Tẩy / Không
            </button>
            <button
              onClick={() => setBleachFilter('BLEACH')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                bleachFilter === 'BLEACH' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Cần tẩy
            </button>
            <button
              onClick={() => setBleachFilter('NO_BLEACH')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                bleachFilter === 'NO_BLEACH' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Không tẩy
            </button>
          </div>

          <button
            onClick={fetchColors}
            disabled={loading}
            className="p-2 border border-salon-gold/20 rounded-lg text-zinc-400 hover:text-salon-gold transition-colors"
            title="Làm mới"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Grid of Swatches */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredColors.length === 0 ? (
          <div className="col-span-full py-12 text-center text-zinc-400 bg-salon-charcoal rounded-xl border border-salon-gold/15">
            Không tìm thấy màu nhuộm nào phù hợp.
          </div>
        ) : (
          filteredColors.map((c) => {
            const hex = c.hexColor || c.hexCode || '#8B4513';
            const secHex = c.secondaryHex;

            return (
              <div
                key={c.id}
                className="bg-salon-charcoal rounded-xl border border-salon-gold/20 overflow-hidden hover:border-salon-gold/50 transition-all flex flex-col justify-between group shadow-lg"
              >
                <div>
                  {/* Swatch Header Visual */}
                  <div
                    className="h-24 w-full relative flex items-end p-3"
                    style={{
                      background: secHex
                        ? `linear-gradient(135deg, ${hex} 0%, ${secHex} 100%)`
                        : hex,
                    }}
                  >
                    {c.isTrending && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/70 text-amber-300 border border-amber-400/40 flex items-center gap-1 backdrop-blur-sm">
                        <Flame className="w-3 h-3 text-amber-400" />
                        <span>Trending</span>
                      </span>
                    )}

                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-black/60 text-white backdrop-blur-sm border border-white/20">
                      {hex.toUpperCase()}
                    </span>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-serif font-bold text-salon-ivory text-base group-hover:text-salon-gold transition-colors line-clamp-1">
                        {c.name}
                      </h3>
                      <span className="font-mono text-xs text-zinc-400 shrink-0">
                        {c.code}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-salon-noir text-salon-gold border border-salon-gold/20">
                        {c.tone === 'WARM' ? 'Ấm' : c.tone === 'COOL' ? 'Lạnh' : 'Trung tính'}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] text-zinc-300 bg-salon-noir border border-zinc-700">
                        {c.group}
                      </span>

                      {c.requiresBleach ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Tẩy x{c.bleachRounds || 1}</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                          Không tẩy
                        </span>
                      )}
                    </div>

                    {c.colorFadingAdvice && (
                      <p className="text-xs text-zinc-400 line-clamp-2 pt-1">
                        {c.colorFadingAdvice}
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="p-3 border-t border-salon-gold/10 bg-salon-noir/30 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {c.isActive ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Hoạt động</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-zinc-500">
                        <XCircle className="w-3 h-3" />
                        <span>Tắt</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingColor(c);
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 text-zinc-400 hover:text-salon-gold transition-colors"
                      title="Sửa"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      disabled={isDeletingId === c.id}
                      className="p-1.5 text-zinc-400 hover:text-rose-400 transition-colors"
                      title="Xóa"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <ColorSwatchModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        color={editingColor}
        onSaved={fetchColors}
      />
    </div>
  );
}
