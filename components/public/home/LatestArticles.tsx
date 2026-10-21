import React from 'react';
import Link from 'next/link';
import { ArrowRight, Clock, BookOpen } from 'lucide-react';
import { formatDateVN } from '@/lib/utils';

interface ArticleItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImageUrl?: string;
  tags?: string[];
  publishedAt?: string | null;
  createdAt?: string;
  authorName?: string;
}

interface LatestArticlesProps {
  articles?: ArticleItem[];
}

export function LatestArticles({ articles = [] }: LatestArticlesProps) {
  if (articles.length === 0) return null;

  return (
    <section className="py-16 md:py-24 bg-salon-charcoal/40 border-t border-salon-gold/15">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-6">
          <div className="space-y-3">
            <span className="inline-block px-4 py-1 rounded-full border border-salon-gold/30 bg-salon-gold/10 text-salon-gold-light text-xs font-semibold tracking-widest uppercase">
              Editorial & Care Advice
            </span>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-white tracking-tight">
              Tạp Chí Làm Đẹp & <span className="gold-text-gradient">Cẩm Nang Tóc</span>
            </h2>
            <p className="text-neutral-400 text-sm md:text-base font-light max-w-xl">
              Cập nhật kiến thức tạo mẫu tóc, xu hướng thời thượng và bí quyết dưỡng tóc bóng khỏe từ chuyên gia.
            </p>
          </div>

          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-salon-gold hover:text-salon-gold-light font-semibold text-sm transition"
          >
            <span>Xem tất cả bài viết</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 3 Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {articles.slice(0, 3).map((art) => (
            <article
              key={art.id}
              className="group rounded-2xl overflow-hidden bg-salon-charcoal border border-salon-gold/20 hover:border-salon-gold/60 transition-all duration-300 hover:shadow-gold-glow flex flex-col justify-between hover:-translate-y-1.5"
            >
              {/* Cover Image */}
              <div className="relative aspect-[16/10] overflow-hidden bg-neutral-900">
                <img
                  src={art.coverImageUrl || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80'}
                  alt={art.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-salon-charcoal via-transparent to-transparent opacity-80" />

                {/* Tag Badge */}
                {art.tags && art.tags.length > 0 && (
                  <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-[11px] font-semibold bg-salon-noir/80 text-salon-gold-light border border-salon-gold/30 backdrop-blur-md">
                    {art.tags[0]}
                  </span>
                )}
              </div>

              {/* Body */}
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

                {/* Footer */}
                <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs">
                  <span className="text-neutral-400 font-medium">
                    {art.authorName || 'Master Stylist'}
                  </span>
                  <Link
                    href={`/blog/${art.slug}`}
                    className="text-salon-gold group-hover:text-salon-gold-light font-semibold flex items-center gap-1 transition"
                  >
                    <span>Đọc tiếp</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
