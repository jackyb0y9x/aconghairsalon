'use client';

import React, { useState } from 'react';
import {
  SplitSquareVertical,
  Plus,
  Search,
  Edit2,
  Trash2,
  Star,
  RefreshCw,
  Scissors,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import { BeforeAfterModal, BeforeAfterData } from './BeforeAfterModal';

interface Props {
  initialItems: any[];
  services: { id: string; title: string }[];
  hairstyles: { id: string; title: string }[];
  stylists: { id: string; fullName: string }[];
}

export function BeforeAfterManagementClient({
  initialItems,
  services,
  hairstyles,
  stylists,
}: Props) {
  const [items, setItems] = useState<any[]>(initialItems);
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState<'ALL' | 'FEMALE' | 'MALE' | 'UNISEX'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShowcase, setEditingShowcase] = useState<BeforeAfterData | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/before-after');
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (err) {
      console.error('Failed to load showcases:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFeatured = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/before-after/${id}/feature`, { method: 'PATCH' });
      if (res.ok) {
        const updated = await res.json();
        setItems((prev) =>
          prev.map((item) => (item.id === id ? { ...item, isFeatured: updated.isFeatured } : item))
        );
      }
    } catch (err) {
      console.error('Failed to toggle featured:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa showcase này?')) return;
    setIsDeletingId(id);
    try {
      const res = await fetch(`/api/admin/before-after/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setItems((prev) => prev.filter((item) => item.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete showcase:', err);
    } finally {
      setIsDeletingId(null);
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(search.toLowerCase()));

    if (genderFilter !== 'ALL' && item.customerGender !== genderFilter) return false;
    return matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-salon-gold/15">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-salon-gold mb-1">
            <SplitSquareVertical className="w-3.5 h-3.5" />
            <span>Biến Hóa Thực Tế</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-salon-ivory">
            Quản Lý Before & After Showcases
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Minh chứng năng lực tay nghề: hiển thị hình ảnh trước và sau khi làm tóc của khách hàng thực tế.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingShowcase(null);
            setIsModalOpen(true);
          }}
          className="px-4 py-2 bg-salon-gold text-salon-noir font-semibold rounded-lg hover:bg-salon-gold/90 transition-colors flex items-center gap-2 text-sm shadow-md shadow-salon-gold/10 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Showcase Mới</span>
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
            placeholder="Tìm theo tiêu đề, mô tả kỹ thuật..."
            className="w-full bg-salon-noir border border-salon-gold/20 rounded-lg pl-9 pr-3 py-1.5 text-sm text-salon-ivory focus:outline-none focus:border-salon-gold"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-salon-gold/20 bg-salon-noir p-0.5 text-xs font-medium">
            <button
              onClick={() => setGenderFilter('ALL')}
              className={`px-3 py-1 rounded-md transition-colors ${
                genderFilter === 'ALL' ? 'bg-salon-gold text-salon-noir font-bold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Tất cả ({items.length})
            </button>
            <button
              onClick={() => setGenderFilter('FEMALE')}
              className={`px-3 py-1 rounded-md transition-colors ${
                genderFilter === 'FEMALE' ? 'bg-salon-gold text-salon-noir font-bold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Nữ
            </button>
            <button
              onClick={() => setGenderFilter('MALE')}
              className={`px-3 py-1 rounded-md transition-colors ${
                genderFilter === 'MALE' ? 'bg-salon-gold text-salon-noir font-bold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Nam
            </button>
          </div>

          <button
            onClick={fetchItems}
            disabled={loading}
            className="p-2 border border-salon-gold/20 rounded-lg text-zinc-400 hover:text-salon-gold transition-colors"
            title="Làm mới"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Grid of Showcases */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.length === 0 ? (
          <div className="col-span-full py-12 text-center text-zinc-400 bg-salon-charcoal rounded-xl border border-salon-gold/15">
            Chưa có showcase nào phù hợp.
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-salon-charcoal rounded-xl border border-salon-gold/20 overflow-hidden shadow-lg flex flex-col justify-between hover:border-salon-gold/50 transition-all"
            >
              <div>
                {/* Before / After Dual Image Container */}
                <div className="grid grid-cols-2 h-44 border-b border-salon-gold/20 relative">
                  <div className="relative h-full overflow-hidden border-r border-salon-gold/20 bg-black">
                    <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-black/70 text-zinc-300 border border-white/20 z-10 backdrop-blur-sm">
                      Trước (Before)
                    </span>
                    <img
                      src={item.beforeImageUrl}
                      alt="Before"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                  <div className="relative h-full overflow-hidden bg-black">
                    <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-salon-gold/90 text-salon-noir font-bold z-10 backdrop-blur-sm">
                      Sau (After)
                    </span>
                    <img
                      src={item.afterImageUrl}
                      alt="After"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                </div>

                {/* Content Details */}
                <div className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-serif font-bold text-salon-ivory text-base line-clamp-1">
                      {item.title}
                    </h3>
                    <button
                      onClick={() => handleToggleFeatured(item.id)}
                      className={`p-1 rounded transition-colors ${
                        item.isFeatured ? 'text-amber-400 hover:text-amber-300' : 'text-zinc-600 hover:text-zinc-400'
                      }`}
                      title={item.isFeatured ? 'Đang nổi bật trang chủ' : 'Bật nổi bật'}
                    >
                      <Star className={`w-4 h-4 ${item.isFeatured ? 'fill-amber-400' : ''}`} />
                    </button>
                  </div>

                  {item.description && (
                    <p className="text-xs text-zinc-400 line-clamp-2">{item.description}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-1.5 pt-2">
                    {item.service && (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-salon-noir text-salon-gold border border-salon-gold/20 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        <span className="line-clamp-1">{item.service.title}</span>
                      </span>
                    )}
                    {item.hairstyle && (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-salon-noir text-zinc-300 border border-zinc-700 flex items-center gap-1">
                        <Scissors className="w-3 h-3" />
                        <span className="line-clamp-1">{item.hairstyle.title}</span>
                      </span>
                    )}
                    {item.stylist && (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-salon-noir text-emerald-300 border border-emerald-500/20 flex items-center gap-1">
                        <UserCheck className="w-3 h-3" />
                        <span>{item.stylist.fullName}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-3 border-t border-salon-gold/10 bg-salon-noir/30 flex items-center justify-between">
                <span className="text-xs text-zinc-500 font-mono">Thứ tự: {item.displayOrder ?? 0}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingShowcase(item);
                      setIsModalOpen(true);
                    }}
                    className="p-1.5 text-zinc-400 hover:text-salon-gold transition-colors"
                    title="Sửa"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={isDeletingId === item.id}
                    className="p-1.5 text-zinc-400 hover:text-rose-400 transition-colors"
                    title="Xóa"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <BeforeAfterModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        showcase={editingShowcase}
        services={services}
        hairstyles={hairstyles}
        stylists={stylists}
        onSaved={fetchItems}
      />
    </div>
  );
}
