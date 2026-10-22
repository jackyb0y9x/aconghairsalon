import React from 'react';
import { Metadata } from 'next';
import { getPublicHomeData } from '@/lib/public-data';
import { HeroBannerSlider } from '@/components/public/home/HeroBannerSlider';
import { QuickCategories } from '@/components/public/home/QuickCategories';
import { TrendingHairstyles } from '@/components/public/home/TrendingHairstyles';
import { FeaturedServicesPricing } from '@/components/public/home/FeaturedServicesPricing';
import { LatestArticles } from '@/components/public/home/LatestArticles';
import { DualCtaSection } from '@/components/public/home/DualCtaSection';
import { HomeLocationMap } from '@/components/public/home/HomeLocationMap';

export const revalidate = 60; // ISR cache 60s

export async function generateMetadata(): Promise<Metadata> {
  const data = await getPublicHomeData();
  const brandName = data.branding?.brandName || 'Công Nguyễn Hair Salon';
  const slogan = data.branding?.brandSlogan || 'Định Hình Phong Cách — Tỏa Sáng Khí Chất';

  return {
    title: `${brandName} | Salon Tóc Nam & Nữ Hiện Đại Hải Phòng`,
    description: `${brandName} tại Nguyệt Áng 3, An Khánh, Hải Phòng. ${slogan}. Trải nghiệm tạo mẫu tóc chuyên nghiệp chuẩn xu hướng thời trang.`,
    openGraph: {
      title: `${brandName} | Salon Tóc Nam & Nữ Hiện Đại`,
      description: `${brandName} — ${slogan}`,
      images: [data.banners[0]?.imageUrl || '/images/og/home.jpg'],
    },
  };
}

export default async function HomePage() {
  const data = await getPublicHomeData();

  return (
    <div className="flex flex-col min-h-screen bg-salon-noir text-salon-ivory transition-colors duration-300">
      {/* 1. Hero Banner Slider */}
      <HeroBannerSlider banners={data.banners} />

      {/* 2. Quick Categories Grid */}
      <QuickCategories />

      {/* 3. Trending Hairstyles Carousel */}
      <TrendingHairstyles hairstyles={data.trendingHairstyles} />

      {/* 4. Featured Services & Pricing List */}
      <FeaturedServicesPricing services={data.services} />

      {/* 5. Latest Hair Care & Style Articles */}
      <LatestArticles articles={data.articles} />

      {/* 6. Action Conversion CTAs */}
      <DualCtaSection />

      {/* 7. Salon Location & Google Maps Section */}
      <HomeLocationMap settings={data.settings} />
    </div>
  );
}
