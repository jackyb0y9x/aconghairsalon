import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  getPublicArticleBySlug,
  getPublicArticles,
} from '@/lib/public-data';
import { formatDateVN } from '@/lib/utils';
import { MarkdownRenderer } from '@/components/public/MarkdownRenderer';
import {
  Clock,
  Calendar,
  User,
  ChevronRight,
  ArrowRight,
  Share2,
  Sparkles,
} from 'lucide-react';

interface ArticleDetailPageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: ArticleDetailPageProps): Promise<Metadata> {
  const article = await getPublicArticleBySlug(params.slug);
  if (!article) {
    return { title: 'Không tìm thấy bài viết | Công Nguyễn Hair Salon' };
  }

  const title = article.metaTitle || article.seoTitle || article.title;
  const desc = article.metaDescription || article.seoDescription || article.excerpt;

  return {
    title: `${title} | Công Nguyễn Hair Salon`,
    description: desc,
    keywords: article.tags?.join(', '),
    openGraph: {
      title,
      description: desc,
      type: 'article',
      publishedTime: article.publishedAt || undefined,
      images: [article.coverImageUrl || '/images/default-hair.jpg'],
    },
  };
}

export default async function ArticleDetailPage({ params }: ArticleDetailPageProps) {
  const article = await getPublicArticleBySlug(params.slug);
  if (!article) {
    notFound();
  }

  const relatedData = await getPublicArticles({ pageSize: 3 });
  const relatedArticles = relatedData.articles.filter((a) => a.id !== article.id).slice(0, 2);

  return (
    <div className="min-h-screen bg-salon-noir text-salon-ivory transition-colors duration-300 pb-16">
      {/* Breadcrumb Bar */}
      <div className="border-b border-salon-gold/15 py-3 px-4 sm:px-6 lg:px-8 bg-salon-charcoal/40 text-xs text-neutral-400">
        <div className="max-w-4xl mx-auto flex items-center gap-2">
          <Link href="/" className="hover:text-salon-gold transition">
            Trang Chủ
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-600" />
          <Link href="/blog" className="hover:text-salon-gold transition">
            Tạp Chí
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-600" />
          <span className="text-salon-gold-light truncate">{article.title}</span>
        </div>
      </div>

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {/* Article Header */}
        <header className="space-y-4">
          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {article.tags.map((t: string) => (
                <Link
                  key={t}
                  href={`/blog?tag=${t}`}
                  className="px-3 py-1 rounded-full text-xs font-semibold bg-salon-gold/15 text-salon-gold-light border border-salon-gold/30 hover:bg-salon-gold/25 transition"
                >
                  #{t}
                </Link>
              ))}
            </div>
          )}

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-white tracking-tight leading-tight">
            {article.title}
          </h1>

          {/* Metadata Row */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-400 pt-2 border-b border-white/10 pb-4">
            <span className="flex items-center gap-1.5 text-white font-medium">
              <User className="w-4 h-4 text-salon-gold" />
              <span>{article.authorName || 'Master Stylist'}</span>
            </span>

            <span>•</span>

            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-salon-gold" />
              <span>{formatDateVN(article.publishedAt || article.createdAt || new Date())}</span>
            </span>

            <span>•</span>

            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-salon-gold" />
              <span>~4 phút đọc</span>
            </span>
          </div>

          {/* Excerpt Lead */}
          <p className="text-base sm:text-lg text-neutral-300 font-light italic leading-relaxed bg-salon-charcoal/60 p-4 rounded-2xl border-l-4 border-salon-gold">
            {article.excerpt}
          </p>
        </header>

        {/* Featured Cover Image */}
        <div className="aspect-[16/9] rounded-3xl overflow-hidden bg-neutral-900 border border-salon-gold/20 shadow-luxury-dark">
          <img
            src={article.coverImageUrl || '/images/default-hair.jpg'}
            alt={article.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Main Content Body (Semantic Markdown Renderer) */}
        <div className="bg-salon-charcoal/30 p-6 sm:p-10 rounded-3xl border border-salon-gold/15 shadow-sm">
          <MarkdownRenderer content={article.content} />
        </div>

        {/* Author Bio Box */}
        <div className="p-6 rounded-2xl bg-salon-charcoal/80 border border-salon-gold/20 flex flex-col sm:flex-row items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-salon-gold/20 border-2 border-salon-gold flex items-center justify-center text-salon-gold flex-shrink-0">
            <User className="w-8 h-8" />
          </div>
          <div className="space-y-1 text-center sm:text-left">
            <span className="text-[11px] uppercase tracking-wider text-salon-gold font-bold">
              Chuyên Gia Soạn Thảo
            </span>
            <h3 className="font-serif font-bold text-lg text-white">
              {article.authorName || 'Master Kenji Đặng'}
            </h3>
            <p className="text-xs text-neutral-400 font-light leading-relaxed">
              Artistic Director tại Công Nguyễn Hair Salon, chuyên gia tư vấn kỹ thuật phục hồi liên kết và tạo mẫu tóc hiện đại.
            </p>
          </div>
        </div>

        {/* In-Article Booking CTA Banner */}
        <div className="p-8 rounded-3xl bg-gradient-to-r from-salon-charcoal via-salon-charcoal/90 to-salon-noir border border-salon-gold/40 shadow-gold-glow flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left">
            <span className="text-xs uppercase tracking-widest text-salon-gold font-bold">
              Trải Nghiệm Trực Tiếp Tại Salon
            </span>
            <h3 className="text-2xl font-serif font-bold text-white">
              Sẵn Sàng Cho Một Mái Tóc Khỏe Đẹp?
            </h3>
            <p className="text-xs text-neutral-300 font-light">
              Đặt lịch ngay để được Master Stylist trực tiếp soi da đầu vi điểm và tư vấn kiểu tóc phù hợp.
            </p>
          </div>

          <Link
            href="/booking"
            className="px-8 py-3.5 rounded-full bg-gradient-to-r from-salon-gold via-salon-gold-light to-salon-gold text-salon-noir font-bold text-xs uppercase tracking-wider hover:opacity-95 shadow-gold-glow transition flex-shrink-0"
          >
            Đặt Lịch Ngay
          </Link>
        </div>

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <section className="space-y-6 pt-6 border-t border-salon-gold/15">
            <h3 className="text-2xl font-serif font-bold text-white">
              Bài Viết Liên Quan
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {relatedArticles.map((rel) => (
                <Link
                  key={rel.id}
                  href={`/blog/${rel.slug}`}
                  className="p-5 rounded-2xl bg-salon-charcoal border border-salon-gold/20 hover:border-salon-gold/50 transition flex items-center gap-4 group"
                >
                  <img
                    src={rel.coverImageUrl || '/images/default-hair.jpg'}
                    alt={rel.title}
                    className="w-20 h-20 rounded-xl object-cover border border-white/10 flex-shrink-0 group-hover:scale-105 transition"
                  />
                  <div>
                    <h4 className="font-serif font-bold text-sm text-white group-hover:text-salon-gold-light transition line-clamp-2">
                      {rel.title}
                    </h4>
                    <span className="text-[11px] text-neutral-400 mt-1 block">
                      {formatDateVN(rel.publishedAt || rel.createdAt || new Date())}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </div>
  );
}
