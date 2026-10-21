'use client';

import React, { useState } from 'react';
import {
  Tags,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Scissors,
  Sparkles,
  FileText,
} from 'lucide-react';
import { CategoryModal, CategoryData } from './CategoryModal';

interface Props {
  initialCategories: any[];
}

export function CategoriesManagementClient({ initialCategories }: Props) {
  const [categories, setCategories] = useState<any[]>(initialCategories);
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'HAIRSTYLE' | 'SERVICE' | 'ARTICLE'>('ALL');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryData | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, count: number) => {
    if (count > 0) {
      alert('Không thể xóa danh mục đang chứa kiểu tóc, dịch vụ hoặc bài viết liên quan.');
      return;
    }
    if (!confirm('Bạn có chắc chắn muốn xóa danh mục này?')) return;
    setIsDeletingId(id);
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setCategories((prev) => prev.filter((c) => c.id !== id));
      } else {
        const data = await res.json();
        alert(data.error || 'Lỗi khi xóa danh mục');
      }
    } catch (err) {
      console.error('Failed to delete category:', err);
    } finally {
      setIsDeletingId(null);
    }
  };

  const filteredCategories = categories.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.slug.toLowerCase().includes(search.toLowerCase());

    if (typeFilter !== 'ALL' && c.type !== typeFilter) return false;
    return matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-salon-gold/15">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-salon-gold mb-1">
            <Tags className="w-3.5 h-3.5" />
            <span>Cơ Cấu Phân Loại Taxonomy</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-salon-ivory">
            Quản Lý Danh Mục Hệ Thống
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Phân loại cây chuyên mục cho Kiểu tóc, Dịch vụ kỹ thuật và Bài viết cẩm nang.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingCategory(null);
            setIsModalOpen(true);
          }}
          className="px-4 py-2 bg-salon-gold text-salon-noir font-semibold rounded-lg hover:bg-salon-gold/90 transition-colors flex items-center gap-2 text-sm shadow-md shadow-salon-gold/10 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Danh Mục Mới</span>
        </button>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-salon-charcoal/60 p-4 rounded-xl border border-salon-gold/15">
        <div className="flex rounded-lg border border-salon-gold/20 bg-salon-noir p-0.5 text-xs font-medium overflow-x-auto">
          <button
            onClick={() => setTypeFilter('ALL')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              typeFilter === 'ALL' ? 'bg-salon-gold text-salon-noir font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Tất cả ({categories.length})
          </button>
          <button
            onClick={() => setTypeFilter('HAIRSTYLE')}
            className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              typeFilter === 'HAIRSTYLE' ? 'bg-salon-gold text-salon-noir font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Scissors className="w-3 h-3" />
            <span>Kiểu tóc</span>
          </button>
          <button
            onClick={() => setTypeFilter('SERVICE')}
            className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              typeFilter === 'SERVICE' ? 'bg-salon-gold text-salon-noir font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>Dịch vụ</span>
          </button>
          <button
            onClick={() => setTypeFilter('ARTICLE')}
            className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              typeFilter === 'ARTICLE' ? 'bg-salon-gold text-salon-noir font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <FileText className="w-3 h-3" />
            <span>Bài viết</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm danh mục..."
              className="w-full bg-salon-noir border border-salon-gold/20 rounded-lg pl-9 pr-3 py-1.5 text-sm text-salon-ivory focus:outline-none focus:border-salon-gold"
            />
          </div>

          <button
            onClick={fetchCategories}
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
                <th className="py-3.5 px-4">Tên danh mục</th>
                <th className="py-3.5 px-4">Slug URL</th>
                <th className="py-3.5 px-4 text-center">Phân loại</th>
                <th className="py-3.5 px-4 text-center">Số mục liên kết</th>
                <th className="py-3.5 px-4 text-center">Thứ tự</th>
                <th className="py-3.5 px-4 text-center">Trạng thái</th>
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-salon-gold/10">
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-zinc-400">
                    Chưa có danh mục nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredCategories.map((c) => {
                  const linkedCount =
                    (c.hairstylesCount || 0) +
                    (c.servicesCount || 0) +
                    (c.articlesCount || 0);

                  return (
                    <tr key={c.id} className="hover:bg-salon-noir/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-salon-ivory">{c.name}</div>
                        {c.description && <div className="text-xs text-zinc-400 line-clamp-1">{c.description}</div>}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-zinc-300">
                        {c.slug}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider ${
                            c.type === 'HAIRSTYLE'
                              ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                              : c.type === 'SERVICE'
                              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                              : 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                          }`}
                        >
                          {c.type === 'HAIRSTYLE' ? 'Kiểu tóc' : c.type === 'SERVICE' ? 'Dịch vụ' : 'Bài viết'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono">
                        <span
                          className={`px-2 py-0.5 rounded text-xs ${
                            linkedCount > 0 ? 'bg-salon-gold/15 text-salon-gold' : 'text-zinc-500'
                          }`}
                        >
                          {linkedCount} mục
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-zinc-400">
                        {c.displayOrder ?? 0}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {c.isActive ? (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Mở</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-zinc-500">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Ẩn</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditingCategory(c);
                              setIsModalOpen(true);
                            }}
                            className="p-1.5 text-zinc-400 hover:text-salon-gold transition-colors"
                            title="Chỉnh sửa"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(c.id, linkedCount)}
                            disabled={isDeletingId === c.id}
                            className={`p-1.5 transition-colors ${
                              linkedCount > 0
                                ? 'text-zinc-600 cursor-not-allowed'
                                : 'text-zinc-400 hover:text-rose-400'
                            }`}
                            title={linkedCount > 0 ? 'Không thể xóa danh mục đang có mục con' : 'Xóa'}
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

      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        category={editingCategory}
        defaultType={typeFilter === 'ALL' ? 'HAIRSTYLE' : typeFilter}
        onSaved={fetchCategories}
      />
    </div>
  );
}
