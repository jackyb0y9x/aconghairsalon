import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { getPublicArticles } from '@/lib/public-data';
import { BlogCatalogClient } from '@/components/public/BlogCatalogClient';

export const metadata: Metadata = {
  title: 'Tạp Chí Làm Đẹp & Cẩm Nang Chăm Sóc Tóc | Công Nguyễn Hair Salon',
  description: 'Chuyên mục bài viết tư vấn chăm sóc tóc, xu hướng tóc mới, bí quyết giữ nếp tóc layer và hướng dẫn phục hồi tóc tẩy hư tổn từ Master Stylist.',
  openGraph: {
    title: 'Tạp Chí Làm Đẹp & Cẩm Nang Chăm Sóc Tóc | Công Nguyễn Hair Salon',
    description: 'Chuyên mục bài viết tư vấn chăm sóc tóc chuẩn salon.',
  },
};

export const revalidate = 60; // ISR cache 60s

interface BlogPageProps {
  searchParams?: {
    tag?: string;
    q?: string;
    search?: string;
    page?: string;
  };
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const tag = searchParams?.tag || undefined;
  const search = searchParams?.q || searchParams?.search || undefined;
  const page = searchParams?.page ? parseInt(searchParams.page, 10) : 1;

  const data = await getPublicArticles({ tag, search, page, pageSize: 6 });

  return (
    <div className="min-h-screen bg-salon-noir text-salon-ivory transition-colors duration-300">
      {/* Hero Header */}
      <section className="relative pt-24 pb-12 px-4 sm:px-6 lg:px-8 border-b border-salon-gold/15 overflow-hidden">
        <div className="max-w-7xl mx-auto text-center relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-salon-gold/30 bg-salon-gold/10 text-salon-gold-light text-xs font-semibold uppercase tracking-widest">
            Haute Coiffure Editorial
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold gold-text-gradient">
            Tạp Chí & Cẩm Nang Tóc
          </h1>
          <p className="text-neutral-300 max-w-2xl mx-auto text-sm md:text-base font-light leading-relaxed">
            Kiến thức chuyên sâu và bí quyết dưỡng tóc bóng mượt từ các Master Stylist tại Công Nguyễn Hair Salon.
          </p>
        </div>
      </section>

      {/* Main Blog Catalog */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Suspense fallback={<div className="py-24 text-center text-salon-gold animate-pulse">Đang tải bài viết...</div>}>
          <BlogCatalogClient
            articles={data.articles}
            allTags={data.tags}
            total={data.total}
            currentPage={data.page}
            totalPages={data.totalPages}
          />
        </Suspense>
      </main>
    </div>
  );
}
