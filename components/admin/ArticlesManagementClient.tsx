'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ExternalLink,
  Tag,
  Globe,
  Clock,
  Calendar,
  AlertCircle,
} from 'lucide-react';

interface Props {
  initialArticles: any[];
  categories: { id: string; name: string }[];
}

export function ArticlesManagementClient({ initialArticles, categories }: Props) {
  const [articles, setArticles] = useState<any[]>(initialArticles);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/articles');
      if (res.ok) {
        const data = await res.json();
        setArticles(data);
      }
    } catch (err) {
      console.error('Failed to load articles:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa bài viết "${title}" không? Hành động này không thể hoàn tác.`)) {
      return;
    }

    setIsDeletingId(id);
    try {
      const res = await fetch(`/api/admin/articles/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setArticles((prev) => prev.filter((a) => a.id !== id));
      } else {
        const err = await res.json();
        alert(err.error || 'Xóa bài viết thất bại');
      }
    } catch (err) {
      console.error('Failed to delete article:', err);
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleTogglePublish = async (id: string, currentPublished: boolean) => {
    const nextState = !currentPublished;
    const confirmMsg = nextState
      ? 'Bạn có chắc chắn muốn xuất bản bài viết này?'
      : 'Bạn có chắc chắn muốn chuyển bài viết về bản nháp?';

    if (!confirm(confirmMsg)) return;

    setTogglingId(id);
    try {
      const res = await fetch(`/api/admin/articles/${id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: nextState }),
      });

      if (res.ok) {
        setArticles((prev) =>
          prev.map((a) =>
            a.id === id ? { ...a, isPublished: nextState, published: nextState } : a
          )
        );
      } else {
        const err = await res.json();
        alert(err.error || 'Đổi trạng thái thất bại');
      }
    } catch (err) {
      console.error('Failed to toggle publish:', err);
    } finally {
      setTogglingId(null);
    }
  };

  const filteredArticles = articles.filter((a) => {
    const matchesSearch =
      !search ||
      (a.title && a.title.toLowerCase().includes(search.toLowerCase())) ||
      (a.excerpt && a.excerpt.toLowerCase().includes(search.toLowerCase())) ||
      (a.slug && a.slug.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory =
      categoryFilter === 'ALL' || a.categoryId === categoryFilter;

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'PUBLISHED' && Boolean(a.isPublished || a.published)) ||
      (statusFilter === 'DRAFT' && !Boolean(a.isPublished || a.published));

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-salon-ivory flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-salon-gold" />
            <span>Quản Lý Bài Viết & Kiến Thức Tóc</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Biên tập bài viết blog, chia sẻ cẩm nang chăm sóc và kỹ thuật làm đẹp cao cấp.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchArticles}
            disabled={loading}
            className="p-2 rounded-lg bg-salon-card hover:bg-zinc-800 text-zinc-300 hover:text-salon-gold transition-colors"
            title="Làm mới"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            href="/admin/articles/new"
            className="btn-gold px-4 py-2 text-xs flex items-center gap-2 rounded-lg font-medium shadow-md hover:shadow-salon-gold/20"
          >
            <Plus className="w-4 h-4" />
            <span>Viết Bài Viết Mới</span>
          </Link>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tiêu đề, tóm tắt, slug bài viết..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-salon-card border border-zinc-800 rounded-lg text-xs text-salon-ivory placeholder-zinc-500 focus:outline-none focus:border-salon-gold transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-salon-card border border-zinc-800 rounded-lg text-xs text-salon-ivory focus:outline-none focus:border-salon-gold"
          >
            <option value="ALL">Tất cả chuyên mục</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-salon-card border border-zinc-800 rounded-lg text-xs text-salon-ivory focus:outline-none focus:border-salon-gold"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="PUBLISHED">Đã xuất bản</option>
            <option value="DRAFT">Bản nháp</option>
          </select>
        </div>
      </div>

      {/* Articles Table */}
      <div className="bg-salon-card border border-zinc-800 rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-salon-noir/60 text-zinc-400 uppercase tracking-wider font-semibold border-b border-zinc-800">
              <tr>
                <th className="py-3 px-4 w-20">Ảnh bìa</th>
                <th className="py-3 px-4">Tiêu đề & Tóm tắt</th>
                <th className="py-3 px-4">Chuyên mục & Thẻ</th>
                <th className="py-3 px-4">Tác giả</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-center">Thời gian</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filteredArticles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-500">
                    <BookOpen className="w-8 h-8 mx-auto mb-2 text-zinc-600" />
                    <p className="text-sm">Không tìm thấy bài viết nào phù hợp.</p>
                  </td>
                </tr>
              ) : (
                filteredArticles.map((a) => {
                  const isPub = Boolean(a.isPublished || a.published);
                  return (
                    <tr key={a.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="w-16 h-11 rounded overflow-hidden bg-zinc-800 border border-zinc-700/60 flex-shrink-0">
                          {a.coverImageUrl ? (
                            <img
                              src={a.coverImageUrl}
                              alt={a.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-600">
                              <BookOpen className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-semibold text-salon-ivory line-clamp-1">{a.title}</div>
                        <div className="text-[11px] text-zinc-400 font-mono mt-0.5 line-clamp-1">
                          /{a.slug}
                        </div>
                        <div className="text-[11px] text-zinc-500 mt-1 line-clamp-1">
                          {a.excerpt}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          {a.category ? (
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-salon-noir text-salon-gold border border-salon-gold/20">
                              {a.category.name}
                            </span>
                          ) : (
                            <span className="text-[10px] text-zinc-500 italic">Chưa phân loại</span>
                          )}
                          <div className="flex flex-wrap gap-1 max-w-[150px]">
                            {Array.isArray(a.tags) &&
                              a.tags.slice(0, 2).map((tag: string) => (
                                <span
                                  key={tag}
                                  className="text-[10px] text-zinc-400 bg-zinc-900 px-1.5 py-0.2 rounded"
                                >
                                  #{tag}
                                </span>
                              ))}
                            {Array.isArray(a.tags) && a.tags.length > 2 && (
                              <span className="text-[10px] text-zinc-500">
                                +{a.tags.length - 2}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-zinc-300">
                        <span className="font-medium text-xs">
                          {a.authorName || a.author?.fullName || 'Công Nguyễn Editorial'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleTogglePublish(a.id, isPub)}
                          disabled={togglingId === a.id}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors border ${
                            isPub
                              ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800 hover:bg-emerald-900/60'
                              : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700'
                          }`}
                          title="Nhấn để đổi trạng thái"
                        >
                          {isPub ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Xuất bản</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Bản nháp</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-center text-zinc-400 text-[11px] whitespace-nowrap">
                        {a.createdAt
                          ? new Date(a.createdAt).toLocaleDateString('vi-VN')
                          : '—'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/articles/${a.id}`}
                            className="p-1.5 text-zinc-400 hover:text-salon-gold transition-colors"
                            title="Chỉnh sửa bài viết"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(a.id, a.title)}
                            disabled={isDeletingId === a.id}
                            className="p-1.5 text-zinc-400 hover:text-rose-400 transition-colors"
                            title="Xóa bài viết"
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
