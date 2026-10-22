'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Plus,
  Search,
  Edit2,
  Trash2,
  Clock,
  Flame,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Eye,
  EyeOff,
} from 'lucide-react';
import { ServiceModal, ServiceData } from './ServiceModal';
import { formatVND, formatPriceRange, formatDuration } from '@/lib/utils';

interface Props {
  initialServices: any[];
  categories: { id: string; name: string }[];
}

export function ServicesManagementClient({ initialServices, categories }: Props) {
  const [services, setServices] = useState<any[]>(initialServices);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceData | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [togglingHomeId, setTogglingHomeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleToggleShowOnHome = async (s: any) => {
    const nextVal = s.showOnHome === false ? true : false;
    setTogglingHomeId(s.id);
    setServices((prev) =>
      prev.map((item) => (item.id === s.id ? { ...item, showOnHome: nextVal } : item))
    );
    try {
      await fetch(`/api/admin/services/${s.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ showOnHome: nextVal }),
      });
    } catch (err) {
      console.error('Failed to toggle showOnHome:', err);
      fetchServices();
    } finally {
      setTogglingHomeId(null);
    }
  };

  const fetchServices = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/services');
      if (res.ok) {
        const data = await res.json();
        setServices(data);
      }
    } catch (err) {
      console.error('Failed to load services:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa dịch vụ này?')) return;
    setIsDeletingId(id);
    try {
      const res = await fetch(`/api/admin/services/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setServices((prev) => prev.filter((s) => s.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete service:', err);
    } finally {
      setIsDeletingId(null);
    }
  };

  const filteredServices = services.filter((s) => {
    const titleStr = s.title || s.name || '';
    const descStr = s.description || '';
    const matchesSearch =
      titleStr.toLowerCase().includes(search.toLowerCase()) ||
      descStr.toLowerCase().includes(search.toLowerCase());

    if (categoryFilter !== 'ALL' && s.categoryId !== categoryFilter) return false;
    return matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-salon-gold/15">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-salon-gold mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Kỹ Thuật & Trải Nghiệm Khách Hàng</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-salon-ivory">
            Quản Lý Menu Dịch Vụ & Bảng Giá
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Thiết lập thời lượng, mức giá tối thiểu - tối đa, hướng dẫn chăm sóc trước và sau dịch vụ.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingService(null);
            setIsModalOpen(true);
          }}
          className="px-4 py-2 bg-salon-gold text-salon-noir font-semibold rounded-lg hover:bg-salon-gold/90 transition-colors flex items-center gap-2 text-sm shadow-md shadow-salon-gold/10 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Dịch Vụ Mới</span>
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
            placeholder="Tìm theo tên dịch vụ..."
            className="w-full bg-salon-noir border border-salon-gold/20 rounded-lg pl-9 pr-3 py-1.5 text-sm text-salon-ivory focus:outline-none focus:border-salon-gold"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-salon-noir border border-salon-gold/20 rounded-lg px-3 py-1.5 text-xs text-salon-ivory focus:outline-none focus:border-salon-gold"
          >
            <option value="ALL">Tất cả danh mục ({categories.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <button
            onClick={fetchServices}
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
                <th className="py-3.5 px-4">Tên dịch vụ</th>
                <th className="py-3.5 px-4">Chuyên mục</th>
                <th className="py-3.5 px-4 text-center">Thời lượng</th>
                <th className="py-3.5 px-4 text-right">Khung giá (VNĐ)</th>
                <th className="py-3.5 px-4 text-center">Hiện trang chủ</th>
                <th className="py-3.5 px-4 text-center">Nổi bật</th>
                <th className="py-3.5 px-4 text-center">Trạng thái</th>
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-salon-gold/10">
              {filteredServices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-zinc-400">
                    Chưa có dịch vụ nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredServices.map((s) => {
                  const title = s.title || s.name || '';
                  const categoryName = s.categoryDetails?.name || s.category?.name || s.category || 'Dịch vụ';
                  const priceStr = formatPriceRange(s.priceMin, s.priceMax);

                  return (
                    <tr key={s.id} className="hover:bg-salon-noir/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-salon-ivory">{title}</div>
                        {s.shortSummary && (
                          <div className="text-xs text-zinc-400 line-clamp-1">{s.shortSummary}</div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-salon-noir text-salon-gold border border-salon-gold/20">
                          {categoryName}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 text-xs text-zinc-300 font-mono">
                          <Clock className="w-3 h-3 text-zinc-400" />
                          <span>{s.durationMinutes}p</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-salon-gold font-bold">
                        {priceStr}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleShowOnHome(s)}
                          disabled={togglingHomeId === s.id}
                          title={s.showOnHome !== false ? 'Đang hiển thị giá ngoài trang chủ (Bấm để ẩn)' : 'Đang ẩn khỏi trang chủ (Bấm để hiển thị)'}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all border ${
                            s.showOnHome !== false
                              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25'
                              : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-zinc-300 hover:bg-zinc-700/60'
                          }`}
                        >
                          {s.showOnHome !== false ? (
                            <>
                              <Eye className="w-3.5 h-3.5 text-amber-400" />
                              <span>Hiện giá</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3.5 h-3.5 text-zinc-500" />
                              <span>Ẩn</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {s.isPopular ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            <Flame className="w-3 h-3 text-amber-400" />
                            <span>Hot</span>
                          </span>
                        ) : (
                          <span className="text-xs text-zinc-600">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {s.isActive ? (
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
                          <button
                            onClick={() => {
                              setEditingService(s);
                              setIsModalOpen(true);
                            }}
                            className="p-1.5 text-zinc-400 hover:text-salon-gold transition-colors"
                            title="Sửa"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(s.id)}
                            disabled={isDeletingId === s.id}
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

      <ServiceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        service={editingService}
        categories={categories}
        onSaved={fetchServices}
      />
    </div>
  );
}
