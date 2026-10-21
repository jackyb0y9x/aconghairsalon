'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  BookOpen,
  ArrowLeft,
  Save,
  Globe,
  Tag,
  Clock,
  Sparkles,
  Eye,
  FileText,
  Upload,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  Send,
  Loader2,
} from 'lucide-react';
import { slugify } from '@/lib/utils';

export interface ArticleFormData {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImageUrl: string;
  tags: string[];
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  categoryId?: string | null;
  isPublished?: boolean;
}

interface Props {
  initialData?: ArticleFormData | null;
  categories: { id: string; name: string }[];
}

export function ArticleEditor({ initialData, categories }: Props) {
  const router = useRouter();
  const isEditing = Boolean(initialData?.id);

  const [title, setTitle] = useState(initialData?.title || '');
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [isSlugManual, setIsSlugManual] = useState(Boolean(initialData?.slug));
  const [excerpt, setExcerpt] = useState(initialData?.excerpt || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [coverImageUrl, setCoverImageUrl] = useState(initialData?.coverImageUrl || '');
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || '');
  const [isPublished, setIsPublished] = useState(initialData?.isPublished || false);

  // SEO fields
  const [metaTitle, setMetaTitle] = useState(initialData?.metaTitle || '');
  const [metaDescription, setMetaDescription] = useState(initialData?.metaDescription || '');

  // UI States
  const [previewTab, setPreviewTab] = useState<'write' | 'preview'>('write');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Auto-slug on title change if not manually edited
  useEffect(() => {
    if (!isSlugManual && title) {
      setSlug(slugify(title));
    }
  }, [title, isSlugManual]);

  // Reading time & word count calculation
  const { wordCount, readingTimeMinutes } = useMemo(() => {
    const words = content.trim().split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.ceil(words / 200));
    return { wordCount: words, readingTimeMinutes: minutes };
  }, [content]);

  // SERP preview derivations
  const displayMetaTitle = metaTitle || title || 'Tiêu đề bài viết - Công Nguyễn Hair Salon';
  const displayMetaDesc = metaDescription || excerpt || 'Mô tả bài viết hữu ích về xu hướng tóc, kỹ thuật chăm sóc và dịch vụ tại Công Nguyễn Hair Salon.';
  const previewSlug = slug || 'tieu-de-bai-viet';

  // Tag Handlers
  const handleAddTag = () => {
    const trimmed = tagInput.trim().replace(/^#/, '');
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag();
    }
  };

  // Upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Kích thước ảnh không được vượt quá 5MB');
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'articles');

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Upload ảnh thất bại');
      }

      const data = await res.json();
      setCoverImageUrl(data.url);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi upload ảnh');
    } finally {
      setUploading(false);
    }
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!title.trim() || title.length < 3) {
      setError('Tiêu đề bài viết tối thiểu 3 ký tự');
      return;
    }
    if (!excerpt.trim() || excerpt.length < 10) {
      setError('Đoạn trích tóm tắt tối thiểu 10 ký tự');
      return;
    }
    if (!content.trim() || content.length < 20) {
      setError('Nội dung bài viết tối thiểu 20 ký tự');
      return;
    }
    if (!coverImageUrl.trim()) {
      setError('Vui lòng chọn hoặc nhập URL ảnh bìa');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        slug: slug.trim() || slugify(title),
        excerpt: excerpt.trim(),
        content: content.trim(),
        coverImageUrl: coverImageUrl.trim(),
        tags,
        categoryId: categoryId || null,
        metaTitle: metaTitle.trim() || null,
        metaDescription: metaDescription.trim() || null,
        isPublished,
      };

      const url = isEditing ? `/api/admin/articles/${initialData?.id}` : '/api/admin/articles';
      const method = isEditing ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Lỗi khi lưu bài viết');
      }

      setSuccess(isEditing ? 'Cập nhật bài viết thành công!' : 'Tạo bài viết mới thành công!');
      setTimeout(() => {
        router.push('/admin/articles');
        router.refresh();
      }, 800);
    } catch (err: any) {
      setError(err.message || 'Không thể lưu bài viết');
    } finally {
      setSaving(false);
    }
  };

  // Toggle publish state on existing article
  const handleTogglePublish = async () => {
    if (!initialData?.id) {
      setIsPublished(!isPublished);
      return;
    }

    const nextState = !isPublished;
    const confirmMsg = nextState
      ? 'Bạn có muốn xuất bản bài viết này lên website công khai không?'
      : 'Bạn có muốn gỡ bài viết này về bản nháp không?';

    if (!confirm(confirmMsg)) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/articles/${initialData.id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: nextState }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Lỗi khi đổi trạng thái xuất bản');
      }

      setIsPublished(nextState);
      setSuccess(nextState ? 'Đã xuất bản bài viết!' : 'Đã chuyển bài viết về bản nháp.');
    } catch (err: any) {
      setError(err.message || 'Lỗi khi đổi trạng thái');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/articles"
            className="p-2 rounded-lg bg-salon-card hover:bg-zinc-800 text-zinc-300 hover:text-salon-gold transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-serif font-bold text-salon-ivory flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-salon-gold" />
              <span>{isEditing ? 'Chỉnh Sửa Bài Viết' : 'Soạn Thảo Bài Viết Mới'}</span>
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Studio biên tập nội dung, bài phân tích xu hướng tóc và tối ưu hóa SEO.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleTogglePublish}
            disabled={saving}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
              isPublished
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/50 hover:bg-emerald-900/60'
                : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
            }`}
          >
            {isPublished ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Đang xuất bản</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-zinc-400" />
                <span>Bản nháp (Draft)</span>
              </>
            )}
          </button>

          <button
            onClick={handleSubmit}
            disabled={saving}
            className="btn-gold px-4 py-2 text-sm flex items-center gap-2 rounded-lg font-medium shadow-md hover:shadow-salon-gold/20"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{isEditing ? 'Lưu cập nhật' : 'Tạo bài viết'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-4 rounded-lg bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Editor Column (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title & Slug */}
          <div className="p-5 rounded-xl bg-salon-card border border-zinc-800/80 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                Tiêu đề bài viết *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: 5 Xu Hướng Màu Nhuộm Balayage Thống Trị Mùa Thu Đông 2026"
                className="w-full px-4 py-3 bg-salon-noir border border-zinc-700 rounded-lg text-salon-ivory text-base focus:outline-none focus:border-salon-gold placeholder-zinc-500 font-medium"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Đường dẫn tĩnh (Slug)
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => {
                    setIsSlugManual(true);
                    setSlug(e.target.value);
                  }}
                  placeholder="5-xu-huong-mau-nhuom-balayage"
                  className="w-full px-3 py-2 bg-salon-noir border border-zinc-700 rounded-lg text-zinc-300 text-xs font-mono focus:outline-none focus:border-salon-gold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Chuyên mục bài viết
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 bg-salon-noir border border-zinc-700 rounded-lg text-salon-ivory text-xs focus:outline-none focus:border-salon-gold"
                >
                  <option value="">-- Chọn chuyên mục --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">
                Tóm tắt ngắn (Excerpt) *
              </label>
              <textarea
                required
                rows={3}
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Tóm tắt ngắn gọn 1-2 câu để hiển thị trong thẻ bài viết và mạng xã hội..."
                className="w-full px-3 py-2 bg-salon-noir border border-zinc-700 rounded-lg text-zinc-200 text-sm focus:outline-none focus:border-salon-gold placeholder-zinc-500"
              />
            </div>
          </div>

          {/* Content Studio & Markdown Toolbar */}
          <div className="p-5 rounded-xl bg-salon-card border border-zinc-800/80 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-salon-gold" />
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                  Nội Dung Bài Viết (Markdown)
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-xs text-zinc-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-salon-gold" />
                  <span>{wordCount} từ</span>
                  <span>•</span>
                  <span>~{readingTimeMinutes} phút đọc</span>
                </div>

                <div className="flex rounded-lg overflow-hidden border border-zinc-700">
                  <button
                    type="button"
                    onClick={() => setPreviewTab('write')}
                    className={`px-3 py-1 text-xs font-medium transition-colors ${
                      previewTab === 'write'
                        ? 'bg-salon-gold text-salon-noir font-bold'
                        : 'bg-salon-noir text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Soạn thảo
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewTab('preview')}
                    className={`px-3 py-1 text-xs font-medium transition-colors ${
                      previewTab === 'preview'
                        ? 'bg-salon-gold text-salon-noir font-bold'
                        : 'bg-salon-noir text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Xem trước
                  </button>
                </div>
              </div>
            </div>

            {previewTab === 'write' ? (
              <textarea
                required
                rows={16}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="## Giới thiệu xu hướng&#10;&#10;Nội dung chi tiết định dạng Markdown... Sử dụng ## tiêu đề, **in đậm**, *in nghiêng*, danh sách gạch đầu dòng..."
                className="w-full px-4 py-3 bg-salon-noir border border-zinc-700 rounded-lg text-zinc-200 text-sm font-mono leading-relaxed focus:outline-none focus:border-salon-gold resize-y"
              />
            ) : (
              <div className="w-full min-h-[380px] p-6 bg-salon-noir border border-zinc-800 rounded-lg text-zinc-200 text-sm leading-relaxed whitespace-pre-wrap font-sans">
                {content || (
                  <span className="text-zinc-500 italic">Chưa có nội dung để xem trước...</span>
                )}
              </div>
            )}
          </div>

          {/* SERP Preview (Search Engine Result Page) */}
          <div className="p-5 rounded-xl bg-salon-card border border-zinc-800/80 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-salon-gold" />
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                  Google SERP Snippet Preview
                </span>
              </div>
              <span className="text-[11px] text-zinc-500">Mô phỏng hiển thị trên Google Search</span>
            </div>

            {/* Google Result Box */}
            <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800 space-y-1.5 shadow-inner">
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <span className="text-emerald-400 font-medium">https://lumiereatelier.vn</span>
                <span>›</span>
                <span className="text-zinc-400 font-mono">articles › {previewSlug}</span>
              </div>
              <div className="text-blue-400 hover:underline text-base font-medium cursor-pointer line-clamp-1">
                {displayMetaTitle}
              </div>
              <div className="text-xs text-zinc-300 line-clamp-2 leading-relaxed">
                {displayMetaDesc}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-zinc-400">SEO Meta Title</span>
                  <span
                    className={`font-mono ${
                      metaTitle.length > 60 ? 'text-rose-400' : 'text-zinc-500'
                    }`}
                  >
                    {metaTitle.length}/60
                  </span>
                </div>
                <input
                  type="text"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  placeholder="Tiêu đề SEO (Mặc định dùng tiêu đề bài viết)"
                  className="w-full px-3 py-2 bg-salon-noir border border-zinc-700 rounded-lg text-zinc-200 text-xs focus:outline-none focus:border-salon-gold"
                />
              </div>

              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-zinc-400">SEO Meta Description</span>
                  <span
                    className={`font-mono ${
                      metaDescription.length > 160 ? 'text-rose-400' : 'text-zinc-500'
                    }`}
                  >
                    {metaDescription.length}/160
                  </span>
                </div>
                <textarea
                  rows={2}
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  placeholder="Mô tả SEO (Mặc định dùng tóm tắt excerpt)"
                  className="w-full px-3 py-2 bg-salon-noir border border-zinc-700 rounded-lg text-zinc-200 text-xs focus:outline-none focus:border-salon-gold"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Controls (1 col) */}
        <div className="space-y-6">
          {/* Cover Image Upload / URL */}
          <div className="p-5 rounded-xl bg-salon-card border border-zinc-800/80 space-y-4">
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              Ảnh bìa bài viết *
            </label>

            {coverImageUrl ? (
              <div className="relative aspect-video rounded-lg overflow-hidden border border-zinc-700 group">
                <img
                  src={coverImageUrl}
                  alt="Ảnh bìa"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <button
                  type="button"
                  onClick={() => setCoverImageUrl('')}
                  className="absolute top-2 right-2 px-2 py-1 bg-black/80 hover:bg-rose-900/80 text-rose-300 text-[10px] rounded transition-colors"
                >
                  Gỡ ảnh
                </button>
              </div>
            ) : (
              <div className="aspect-video rounded-lg border-2 border-dashed border-zinc-700 flex flex-col items-center justify-center p-4 text-center bg-salon-noir/50">
                <ImageIcon className="w-8 h-8 text-zinc-500 mb-2" />
                <span className="text-xs text-zinc-400 mb-1">Chưa có ảnh bìa</span>
                <span className="text-[11px] text-zinc-500">Khuyên dùng tỷ lệ 16:9</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="btn-gold-outline w-full py-2 text-xs flex items-center justify-center gap-2 rounded-lg cursor-pointer">
                {uploading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang tải ảnh lên...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    <span>Tải ảnh từ máy tính (Tối đa 5MB)</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  disabled={uploading}
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <div className="relative">
                <input
                  type="text"
                  value={coverImageUrl}
                  onChange={(e) => setCoverImageUrl(e.target.value)}
                  placeholder="Hoặc dán URL ảnh bìa tại đây..."
                  className="w-full px-3 py-2 bg-salon-noir border border-zinc-700 rounded-lg text-zinc-300 text-xs focus:outline-none focus:border-salon-gold"
                />
              </div>
            </div>
          </div>

          {/* Tags Management */}
          <div className="p-5 rounded-xl bg-salon-card border border-zinc-800/80 space-y-4">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-salon-gold" />
              <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                Thẻ Phân Loại (Tags)
              </label>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="Nhập tag rồi ấn Enter..."
                className="flex-1 px-3 py-1.5 bg-salon-noir border border-zinc-700 rounded-lg text-zinc-300 text-xs focus:outline-none focus:border-salon-gold"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-lg transition-colors"
              >
                Thêm
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1 min-h-[40px]">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-salon-noir text-salon-gold border border-salon-gold/20"
                >
                  <span>#{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-rose-400 font-bold ml-0.5"
                  >
                    ×
                  </button>
                </span>
              ))}
              {tags.length === 0 && (
                <span className="text-xs text-zinc-500 italic">Chưa có thẻ nào được thêm</span>
              )}
            </div>
          </div>

          {/* Publishing Checklist */}
          <div className="p-5 rounded-xl bg-salon-card border border-zinc-800/80 space-y-3">
            <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">
              Tiêu chuẩn xuất bản
            </span>
            <ul className="text-xs space-y-2 text-zinc-400">
              <li className="flex items-center gap-2">
                {title.length >= 3 ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-zinc-600" />
                )}
                <span>Tiêu đề bài viết hợp lệ (≥ 3 ký tự)</span>
              </li>
              <li className="flex items-center gap-2">
                {excerpt.length >= 10 ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-zinc-600" />
                )}
                <span>Đoạn trích tóm tắt đầy đủ (≥ 10 ký tự)</span>
              </li>
              <li className="flex items-center gap-2">
                {content.length >= 20 ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-zinc-600" />
                )}
                <span>Nội dung bài viết chi tiết (≥ 20 ký tự)</span>
              </li>
              <li className="flex items-center gap-2">
                {coverImageUrl ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-zinc-600" />
                )}
                <span>Đã có ảnh bìa hiển thị</span>
              </li>
            </ul>
          </div>
        </div>
      </form>
    </div>
  );
}
