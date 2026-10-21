'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Clock, ArrowRight, User, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDateVN } from '@/lib/utils';

export interface ArticleItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImageUrl?: string;
  tags?: string[];
  authorName?: string;
  publishedAt?: string | null;
  createdAt?: string;
  viewCount?: number;
}

interface BlogCatalogClientProps {
  articles: ArticleItem[];
  allTags: string[];
  total: number;
  currentPage: number;
  totalPages: number;
}

export function BlogCatalogClient({
  articles,
  allTags,
  total,
  currentPage,
  totalPages,
}: BlogCatalogClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentTag = searchParams.get('tag') || 'ALL';
  const currentQuery = searchParams.get('q') || searchParams.get('search') || '';

  const [searchInput, setSearchInput] = useState(currentQuery);

  const updateParam = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, val]) => {
      if (!val || val === 'ALL' || val === '') {
        params.delete(key);
      } else {
        params.set(key, val);
      }
    });
    // Reset page to 1 when filter modifies
    if (!('page' in updates)) {
      params.delete('page');
    }
    const query = params.toString();
    router.push(query ? `/blog?${query}` : '/blog', { scroll: false });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateParam({ q: searchInput });
  };

  const featuredArticle = currentPage === 1 && !currentQuery && currentTag === 'ALL' && articles.length > 0
    ? articles[0]
    : null;

  const remainingArticles = featuredArticle
    ? articles.slice(1)
    : articles;

  return (
    <div className="space-y-12">
      {/* Search & Tag Filter Bar */}
      <div className="p-6 rounded-2xl bg-salon-charcoal/80 border border-salon-gold/20 shadow-luxury-dark space-y-5">
        <form onSubmit={handleSearchSubmit} className="relative max-w-lg mx-auto">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Tìm kiếm bài viết, cẩm nang chăm sóc tóc..."
            className="w-full pl-11 pr-10 py-3 rounded-full bg-salon-noir border border-salon-gold/30 text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-salon-gold transition"
          />
          <Search className="w-4 h-4 text-salon-gold absolute left-4 top-1/2 -translate-y-1/2" />
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                updateParam({ q: null });
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </form>

        {/* Tag Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          <button
            onClick={() => updateParam({ tag: null })}
            className={`py-1.5 px-4 rounded-full text-xs font-semibold transition ${
              currentTag === 'ALL'
                ? 'bg-salon-gold text-salon-noir font-bold'
                : 'bg-salon-noir/80 text-neutral-300 hover:text-white border border-white/5'
            }`}
          >
            Tất Cả Chủ Đề
          </button>

          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => updateParam({ tag })}
              className={`py-1.5 px-4 rounded-full text-xs font-semibold transition ${
                currentTag === tag
                  ? 'bg-salon-gold text-salon-noir font-bold'
                  : 'bg-salon-noir/80 text-neutral-300 hover:text-white border border-white/5'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>

      {/* Featured Spotlight Card (Only on Page 1 with no search) */}
      {featuredArticle && (
        <div className="rounded-3xl overflow-hidden bg-gradient-to-r from-salon-charcoal via-salon-charcoal/90 to-salon-noir border border-salon-gold/30 p-6 sm:p-8 lg:p-10 shadow-luxury-dark grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 aspect-[16/10] rounded-2xl overflow-hidden bg-neutral-900 border border-salon-gold/20">
            <img
              src={featuredArticle.coverImageUrl || '/images/default-hair.jpg'}
              alt={featuredArticle.title}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-salon-gold/20 text-salon-gold border border-salon-gold/30">
                Bài Viết Tiêu Điểm
              </span>
              <span className="text-xs text-neutral-400">
                {formatDateVN(featuredArticle.publishedAt || featuredArticle.createdAt || new Date())}
              </span>
            </div>

            <Link href={`/blog/${featuredArticle.slug}`}>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white hover:text-salon-gold-light transition leading-tight">
                {featuredArticle.title}
              </h2>
            </Link>

            <p className="text-sm text-neutral-300 font-light leading-relaxed">
              {featuredArticle.excerpt}
            </p>

            <div className="pt-4 flex items-center justify-between">
              <span className="text-xs text-neutral-400 font-medium">
                Tác giả: {featuredArticle.authorName || 'Master Stylist'}
              </span>

              <Link
                href={`/blog/${featuredArticle.slug}`}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-salon-gold hover:bg-salon-gold-hover text-salon-noir font-bold text-xs transition"
              >
                <span>Đọc Bài Viết</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Article Grid */}
      {remainingArticles.length === 0 && !featuredArticle ? (
        <div className="text-center py-16 bg-salon-charcoal/40 rounded-3xl border border-salon-gold/15 p-8 space-y-3">
          <p className="text-neutral-400 text-sm">
            Không tìm thấy bài viết nào phù hợp với điều kiện tìm kiếm.
          </p>
          <button
            onClick={() => {
              setSearchInput('');
              router.push('/blog', { scroll: false });
            }}
            className="text-xs text-salon-gold hover:underline font-semibold"
          >
            Xem lại tất cả bài viết
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {remainingArticles.map((art) => (
            <article
              key={art.id}
              className="group rounded-2xl overflow-hidden bg-salon-charcoal border border-salon-gold/20 hover:border-salon-gold/60 transition-all duration-300 hover:shadow-gold-glow flex flex-col justify-between hover:-translate-y-1.5"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-neutral-900">
                <img
                  src={art.coverImageUrl || '/images/default-hair.jpg'}
                  alt={art.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-salon-charcoal via-transparent to-transparent opacity-80" />

                {art.tags && art.tags.length > 0 && (
                  <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-[11px] font-semibold bg-salon-noir/80 text-salon-gold-light border border-salon-gold/30 backdrop-blur-md">
                    {art.tags[0]}
                  </span>
                )}
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-xs text-neutral-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-salon-gold" />
                      <span>{formatDateVN(art.publishedAt || art.createdAt || new Date())}</span>
                    </span>
                    <span>•</span>
                    <span>~4 phút đọc</span>
                  </div>

                  <Link href={`/blog/${art.slug}`}>
                    <h3 className="font-serif font-bold text-lg text-white group-hover:text-salon-gold-light transition line-clamp-2 leading-snug">
                      {art.title}
                    </h3>
                  </Link>

                  <p className="text-xs text-neutral-400 font-light leading-relaxed line-clamp-2">
                    {art.excerpt}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs">
                  <span className="text-neutral-400">
                    {art.authorName || 'Master Stylist'}
                  </span>
                  <Link
                    href={`/blog/${art.slug}`}
                    className="text-salon-gold group-hover:text-salon-gold-light font-semibold flex items-center gap-1 transition"
                  >
                    <span>Chi tiết</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-8">
          <button
            onClick={() => updateParam({ page: String(Math.max(1, currentPage - 1)) })}
            disabled={currentPage <= 1}
            className="p-2 rounded-xl bg-salon-charcoal border border-white/10 text-neutral-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition"
            aria-label="Trang trước"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {[...Array(totalPages)].map((_, idx) => {
            const pageNum = idx + 1;
            return (
              <button
                key={pageNum}
                onClick={() => updateParam({ page: String(pageNum) })}
                className={`w-9 h-9 rounded-xl text-xs font-semibold transition ${
                  currentPage === pageNum
                    ? 'bg-salon-gold text-salon-noir font-bold shadow-sm'
                    : 'bg-salon-charcoal border border-white/10 text-neutral-300 hover:text-white'
                }`}
              >
                {pageNum}
              </button>
            );
          })}

          <button
            onClick={() => updateParam({ page: String(Math.min(totalPages, currentPage + 1)) })}
            disabled={currentPage >= totalPages}
            className="p-2 rounded-xl bg-salon-charcoal border border-white/10 text-neutral-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition"
            aria-label="Trang kế tiếp"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
