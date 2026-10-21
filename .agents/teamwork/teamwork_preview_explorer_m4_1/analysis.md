# Technical Analysis & Architectural Blueprint: Public Layout, Dynamic Home Page & Blog CMS

**Document Version:** 1.0.0  
**Milestone:** M4 (Public Website Experience)  
**Author:** M4 Explorer 1 (Layout, Home Page & Blog)  
**Target Roles:** M4 Worker 1, M4 Reviewer 1, Orchestrator  
**Status:** READY_FOR_IMPLEMENTATION  

---

## 1. Executive Summary & Design System

### 1.1 Objective
Deliver the complete architecture, data flow, component breakdown, and file blueprints for:
1. **Public Layout & Dynamic Branding (`app/(public)/layout.tsx`)**: High-end Obsidian Noir / Champagne Gold theme (`#0B0F17`, `#D4AF37`), sticky luxury navbar, animated mobile drawer, top announcement bar, and dynamic multi-column footer powered directly by CMS `SiteSetting`.
2. **Dynamic Home Page (`app/(public)/page.tsx`)**: Hero banner carousel from active `Banner` entities, quick service categories grid, featured/trending hairstyles showcase, mini Before/After split comparison slider, master stylist profiles, customer testimonials, and latest editorial articles preview.
3. **Blog & Hair Care Editorial CMS (`app/(public)/blog/page.tsx` & `[slug]/page.tsx`)**: Filterable article catalog with tag pills, search, pagination, reading time indicator, rich markdown renderer, author credentials, social share, related articles, and dynamic Open Graph / SEO metadata.
4. **Public REST Endpoints (`/api/public/home`, `/api/public/articles`)**: Server endpoints fulfilling E2E test contracts (`TC1.1`, `TC1.6`, `TC4.4`, `TC4.5`) with live database queries and fallback resiliency.

### 1.2 Design System Tokens & Aesthetics
The public experience embodies the **"Haute Coiffure Atelier"** brand identity defined in `ORIGINAL_REQUEST.md` and `PROJECT.md`:
- **Palette**:
  - Background: `salon.noir` (`#0B0F17`) with gradients to `salon.charcoal` (`#161B26`).
  - Accents: `salon.gold` (`#D4AF37`), `salon.gold.light` (`#F3E5AB`), `salon.gold.hover` (`#C5A059`).
  - Text: `salon.ivory` (`#FDFBF7`) for headings; `neutral-300` / `neutral-400` for body copy.
  - Borders: `border-salon-gold/20` with glassmorphism `glass-luxury` (`rgba(22, 27, 38, 0.75)` with `backdrop-filter: blur(12px)`).
- **Typography**:
  - Headings: Playfair Display / Serif (`font-serif`) with `gold-text-gradient`.
  - Body & UI: Plus Jakarta Sans / Sans-serif (`font-sans`) for optimal readability.
- **Micro-Interactions**:
  - Smooth transitions (`transition-all duration-300`).
  - Subtle gold glows (`shadow-gold-glow`, `shadow-gold-subtle`).

---

## 2. Directory Structure & Route Architecture

### 2.1 File Map
```
c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\
├── app/
│   ├── (public)/                      # Public Route Group (shares public layout)
│   │   ├── layout.tsx                 # Public Layout (Header, Sticky Nav, Mobile Drawer, Footer)
│   │   ├── page.tsx                   # Dynamic Home Page (Replaces placeholder app/page.tsx)
│   │   └── blog/                      # Blog & Hair Care Editorial
│   │       ├── page.tsx               # Blog Catalog with tag filter, search & pagination
│   │       └── [slug]/
│   │           └── page.tsx           # Article Detail with dynamic OG metadata & markdown
│   ├── api/
│   │   └── public/                    # Public Read Endpoints (E2E Test Contract Compliance)
│   │       ├── home/
│   │       │   └── route.ts           # GET /api/public/home (TC1.1 contract)
│   │       └── articles/
│   │           ├── route.ts           # GET /api/public/articles (TC1.6 contract)
│   │           └── [slug]/
│   │               └── route.ts       # GET /api/public/articles/[slug]
├── components/
│   └── public/                        # Public UI Components
│       ├── PublicHeader.tsx           # Sticky luxury header with scroll elevation & active link
│       ├── MobileDrawer.tsx           # Slide-out navigation drawer with touch gestures
│       ├── PublicFooter.tsx           # Multi-column dynamic footer with CMS SiteSettings
│       ├── MarkdownRenderer.tsx       # Lightweight zero-dependency markdown to semantic HTML
│       ├── home/                      # Home page sub-sections
│       │   ├── HeroBannerSlider.tsx   # Interactive banner carousel (autoplay, pause, dots)
│       │   ├── QuickCategories.tsx    # 4-card service category grid
│       │   ├── TrendingHairstyles.tsx # Featured styles carousel with gender/vibe tabs
│       │   ├── MiniBeforeAfter.tsx    # Interactive split comparison slider
│       │   ├── MasterStylists.tsx     # Stylist profiles & credentials cards
│       │   ├── Testimonials.tsx       # Curated VIP customer reviews & star ratings
│       │   ├── LatestArticles.tsx     # Latest 3 articles preview cards
│       │   └── DualCtaSection.tsx     # Hair Try-On & Booking conversion blocks
│       └── blog/                      # Blog sub-components
│           ├── BlogFilterBar.tsx      # Search input + tag pills + active filter state
│           ├── BlogArticleCard.tsx    # Reusable card with reading time & author badge
│           ├── BlogPagination.tsx     # Query-string preserving pagination controls
│           └── SocialShareBar.tsx     # Facebook, Zalo, Copy Link with toast feedback
├── lib/
│   └── public-data.ts                 # Resilient server-side data access layer with fallbacks
└── types/
    └── public.ts                      # View model interfaces for public features
```

### 2.2 Next.js Route Conflict Resolution
**Critical Note**: Next.js App Router treats `app/page.tsx` and `app/(public)/page.tsx` as conflicting routes targeting `/`.  
**Action Required**:
- The placeholder `app/page.tsx` must be removed or delegate directly to `app/(public)/page.tsx`.
- Having `app/(public)/page.tsx` inside the `(public)` route group enables all public pages (`/`, `/blog`, `/hairstyles`, `/services`, etc.) to inherit `app/(public)/layout.tsx` without affecting `/admin/*` routes.

---

## 3. Data Access Layer & Resilient Server Queries

To ensure maximum performance and high availability, database calls are wrapped in `lib/public-data.ts`. If the database is cold or experiencing latency, structured fallback data from `seed.ts` is returned seamlessly.

### 3.1 `lib/public-data.ts` Contract
```typescript
import { prisma } from '@/lib/prisma';
import { serializeSettings } from '@/lib/validations/settings';
import { serializeBanner, serializeArticle, serializeHairstyle, serializeService } from '@/lib/validations/content';

export const DEFAULT_SITE_SETTINGS = {
  brandName: 'Lumière Hair Atelier',
  brandSlogan: 'Định Hình Khí Chất - Tỏa Sáng Phong Cách',
  logoUrl: '/images/brand/logo.svg',
  faviconUrl: '/favicon.ico',
  hotlinePrimary: '0908123456',
  hotlineSecondary: '02838229999',
  emailContact: 'contact@lumierehair.vn',
  addressFull: '128 Pasteur, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
  googleMapsEmbedUrl: 'https://www.google.com/maps/embed?...',
  openingHours: {
    monday_friday: '08:30 - 21:00',
    saturday_sunday: '08:00 - 21:30',
    rawText: '08:30 - 20:30 Hàng ngày',
  },
  socialLinks: {
    facebook: 'https://facebook.com/lumierehairatelier',
    instagram: 'https://instagram.com/lumierehair.vn',
    tiktok: 'https://tiktok.com/@lumierehair',
    zalo: 'https://zalo.me/0908123456',
    youtube: 'https://youtube.com/@lumierehairatelier',
  },
  defaultSeoMetadata: {
    title: 'Lumière Hair Atelier | Salon Tóc Nam & Nữ Cao Cấp Quận 1',
    description: 'Hệ thống salon tóc cao cấp phong cách Paris & Seoul.',
  },
  footerContent: {
    copyright: '© 2026 Lumière Hair Atelier. Tất cả các quyền được bảo lưu.',
    licenseText: 'Giấy phép kinh doanh số 0316888999 do Sở KH&ĐT TP.HCM cấp.',
    taxCode: '0316888999',
  },
};

export async function getPublicSiteSettings() {
  try {
    const raw = await prisma.siteSetting.findUnique({
      where: { id: 'default_setting' },
    });
    if (raw) return serializeSettings(raw);
  } catch (err) {
    console.warn('[Public Data] Settings DB query fallback:', err);
  }
  return serializeSettings(DEFAULT_SITE_SETTINGS);
}

export async function getPublicHomeData() {
  const [settings, banners, trendingStyles, beforeAfters, stylists, services, articles] = await Promise.all([
    getPublicSiteSettings(),
    prisma.banner.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
    }).catch(() => []),
    prisma.hairstyle.findMany({
      where: { isActive: true, isTrending: true },
      include: { category: true },
      take: 8,
      orderBy: { viewCount: 'desc' },
    }).catch(() => []),
    prisma.beforeAfter.findMany({
      where: { isFeatured: true },
      include: { service: true, hairstyle: true, stylist: true },
      take: 4,
      orderBy: { displayOrder: 'asc' },
    }).catch(() => []),
    prisma.user.findMany({
      where: { isStylist: true, isActive: true },
      take: 4,
      orderBy: { experienceYears: 'desc' },
    }).catch(() => []),
    prisma.service.findMany({
      where: { isActive: true },
      include: { category: true },
      take: 6,
      orderBy: { displayOrder: 'asc' },
    }).catch(() => []),
    prisma.article.findMany({
      where: { isPublished: true },
      include: { author: true, category: true },
      take: 3,
      orderBy: { publishedAt: 'desc' },
    }).catch(() => []),
  ]);

  return {
    settings,
    banners: banners.map(serializeBanner),
    trendingStyles: trendingStyles.map(serializeHairstyle),
    beforeAfters,
    stylists,
    services: services.map(serializeService),
    articles: articles.map(serializeArticle),
  };
}
```

---

## 4. Public Layout & Dynamic Branding Blueprint

### 4.1 Route File: `app/(public)/layout.tsx`
- **Component Type**: Server Component with async data fetching.
- **Responsibilities**:
  1. Fetch active `SiteSetting` using `getPublicSiteSettings()`.
  2. Render the Top Announcement Bar with direct phone hotline, opening hours, address snippet, and social icons.
  3. Render `<PublicHeader />` (sticky client component) with salon branding, nav links, booking CTA, and mobile hamburger trigger.
  4. Render `{children}` inside `<main id="main-content" className="flex-1">`.
  5. Render `<PublicFooter />` with dynamic data (address, hours, social links, copyright, license).
- **Design Tokens Applied**:
  - Container background: `bg-salon-noir` (`#0B0F17`).
  - Text colors: `text-salon-ivory` (`#FDFBF7`) with muted `text-neutral-400`.
  - Borders: `border-salon-gold/20`.

### 4.2 Header Component: `components/public/PublicHeader.tsx`
- **Component Type**: Client Component (`'use client'`).
- **Features**:
  1. **Scroll Elevation Detection**: Adds `glass-luxury shadow-gold-subtle border-b border-salon-gold/30 bg-salon-noir/95` when scrolled past 20px; maintains transparent/subtle blur at page top.
  2. **Active Navigation Link Indication**: Uses Next.js `usePathname()` to highlight active routes with `text-salon-gold font-semibold border-b-2 border-salon-gold pb-1`.
  3. **Navigation Menu Items**:
     - Trang Chủ (`/`)
     - Kiểu Tóc (`/hairstyles`)
     - Bảng Màu (`/colors`)
     - Before & After (`/before-after`)
     - Dịch Vụ & Giá (`/services`)
     - Tạp Chí (`/blog`)
     - Thử Tóc AI (`/try-on` with sparkling badge `bg-salon-gold/20 text-salon-gold-light border border-salon-gold/40`)
  4. **Right Action Area**:
     - Quick Hotline Icon link (`tel:${settings.hotlinePrimary}`).
     - Primary Button: "Đặt Lịch Ngay" (`/booking`) styled with `bg-gradient-to-r from-salon-gold via-salon-gold-light to-salon-gold hover:opacity-90 text-salon-noir font-bold px-5 py-2.5 rounded-full shadow-gold-glow`.
     - Mobile Hamburger Toggle (`Menu` icon from Lucide).

### 4.3 Mobile Drawer: `components/public/MobileDrawer.tsx`
- **Component Type**: Client Component (`'use client'`).
- **Features**:
  - Full-screen slide-over drawer triggered by hamburger toggle.
  - Backdrop blur overlay (`bg-black/80 backdrop-blur-sm`).
  - Slide container with `bg-salon-charcoal border-l border-salon-gold/20`.
  - Brand header with close (`X`) icon.
  - Full vertical menu items with icons and gold hover indicators.
  - Direct quick-action buttons: "Đặt Lịch Hẹn Ngay" and "Thử Kiểu Tóc AI".
  - Bottom salon contact info: Hotline, Address, Opening Hours.
  - Automatic drawer close on route change or backdrop click.

### 4.4 Dynamic Footer: `components/public/PublicFooter.tsx`
- **Component Type**: Server Component (or client with passed props).
- **4-Column Grid Structure**:
  1. **Column 1 — Brand Atelier**:
     - Logo monogram & Brand Name in Playfair serif.
     - Brand slogan: *"Định Hình Khí Chất - Tỏa Sáng Phong Cách"*.
     - Atelier summary: *"Không gian nghệ thuật tóc chuẩn Haute Coiffure kết hợp công nghệ mô phỏng AI hiện đại."*
     - Social Media Icon Links: Facebook, Instagram, TikTok, Zalo, YouTube with hover gold glow.
  2. **Column 2 — Khám Phá & Trải Nghiệm**:
     - Thư viện kiểu tóc Nam & Nữ (`/hairstyles`)
     - Bảng màu nhuộm & Swatch (`/colors`)
     - Bộ sưu tập Before / After (`/before-after`)
     - Bảng giá dịch vụ minh bạch (`/services`)
     - Phòng thử tóc AI trực quan (`/try-on`)
     - Cẩm nang chăm sóc tóc (`/blog`)
  3. **Column 3 — Dịch Vụ Trọng Tâm**:
     - Cắt tạo kiểu Master Stylist
     - Uốn sóng lơi Hàn Quốc & Nhật Bản
     - Nhuộm Balayage & Tẩy Olaplex
     - Phục hồi cấu trúc Keratin Nano
     - Gentleman Atelier & Gội dưỡng sinh
  4. **Column 4 — Thông Tin & Đặt Lịch**:
     - Địa chỉ: `settings.addressFull` (with MapPin icon).
     - Hotline đặt hẹn: `settings.hotlinePrimary` & `settings.hotlineSecondary`.
     - Email: `settings.emailContact`.
     - Giờ mở cửa: Thứ 2 - Thứ 6 (`08:30 - 21:00`), Thứ 7 - Chủ Nhật (`08:00 - 21:30`).
     - Google Maps button: "Xem vị trí trên Google Maps" opening embedded modal or external link.
- **Bottom Bar**:
  - Copyright statement: `© 2026 Lumière Hair Atelier. Tất cả các quyền được bảo lưu.`
  - Business license & tax code: `Giấy chứng nhận ĐKKD số: 0316888999 do Sở KH&ĐT TP.HCM cấp.`
  - Quick links: Điều khoản dịch vụ, Chính sách bảo mật thông tin.

---

## 5. Dynamic Home Page Blueprint

### 5.1 Route File: `app/(public)/page.tsx`
- **Component Type**: Next.js Server Component.
- **Data Query**: Invokes `getPublicHomeData()` during request handling.
- **Structure**:
```tsx
export default async function HomePage() {
  const data = await getPublicHomeData();

  return (
    <div className="flex flex-col min-h-screen bg-salon-noir text-salon-ivory">
      {/* 1. Hero Banner Carousel */}
      <HeroBannerSlider banners={data.banners} />

      {/* 2. Quick Service Categories Grid */}
      <QuickCategories />

      {/* 3. Featured & Trending Hairstyles Carousel */}
      <TrendingHairstyles hairstyles={data.trendingStyles} />

      {/* 4. Mini Before / After Interactive Slider */}
      <MiniBeforeAfter items={data.beforeAfters} />

      {/* 5. Master Stylists Introduction */}
      <MasterStylists stylists={data.stylists} />

      {/* 6. Customer Testimonials & Reviews */}
      <Testimonials />

      {/* 7. Latest Hair Care Blog Articles Preview */}
      <LatestArticles articles={data.articles} />

      {/* 8. Dual Action CTA Section */}
      <DualCtaSection />
    </div>
  );
}
```

### 5.2 Section Detail Specifications

#### 1. Hero Banner Slider (`components/public/home/HeroBannerSlider.tsx`)
- **Type**: Client Component (`'use client'`).
- **Data Source**: Array of serialized `Banner` objects (fallback to 4 pre-configured luxury slides if empty).
- **Features**:
  - 6-second auto-rotation with `useEffect` timer, paused when user hovers or interacts.
  - Slide transition: cross-fade with smooth opacity and scale transform (`scale-105` to `scale-100`).
  - Overlay gradient: `bg-gradient-to-r from-salon-noir via-salon-noir/70 to-transparent`.
  - Badges: `badgeText` (e.g. `BỘ SƯU TẬP MỚI 2026`) with gold outline pill.
  - Typography: Serif H1 with `gold-text-gradient`.
  - Subtitle: 2-line maximum with `text-neutral-300 font-light`.
  - Action Buttons: Primary CTA (`banner.ctaText` -> `banner.linkUrl`) + Secondary CTA ("Thử Tóc AI" -> `/try-on`).
  - Controls: Prev/Next arrow buttons with gold hover, bottom pagination dots showing current active slide.

#### 2. Quick Service Categories Grid (`components/public/home/QuickCategories.tsx`)
- 4 luxury interactive category cards:
  1. **Cắt Tạo Kiểu Master**: Tỉa layer chuyển động, Wolf Cut, French Bob, Fade Undercut.
  2. **Uốn Sóng & Định Hình**: Uốn sóng lơi Hàn Quốc, Hippie, Textured Perm.
  3. **Nhuộm Balayage & Tẩy**: Nâu trà sữa, xám khói, pastel, bảo vệ liên kết Olaplex.
  4. **Phục Hồi & Dưỡng Sinh**: Nano Keratin, thanh lọc da đầu, massage thảo dược.
- Visuals: Dark charcoal background with gold border on hover, category icon, subtle image backdrop, and "Khám phá dịch vụ →" link.

#### 3. Featured & Trending Hairstyles Carousel (`components/public/home/TrendingHairstyles.tsx`)
- **Type**: Client Component (`'use client'`).
- Interactive filter tabs: "Tất Cả", "Dành Cho Nữ", "Dành Cho Nam", "Unisex".
- Horizontal responsive slider with left/right buttons.
- Card Attributes:
  - High-res cover image with aspect ratio `3/4`.
  - Floating badge: "Trending 2026" or "Featured".
  - Hairstyle Name in Playfair font.
  - Tags: Style Vibe (Korean, Japanese, Classic), Length, Face Shape pills.
  - Starting Price formatted in VND (e.g. `350.000 ₫`).
  - Card Footer Action Buttons:
    - "Chi tiết" -> `/hairstyles/${style.slug}`
    - "Thử tóc" -> `/try-on?style=${style.id}`
    - "Đặt lịch" -> `/booking?hairstyleId=${style.id}`

#### 4. Mini Before/After Interactive Showcase (`components/public/home/MiniBeforeAfter.tsx`)
- **Type**: Client Component (`'use client'`).
- Component: Split-image comparison slider with draggable center handle (`0%` to `100%`).
- Shows real client transformation with tags:
  - Service performed (e.g. "Cắt Layer + Uốn Sóng Lơi + Nhuộm Nâu Tây").
  - Stylist attribution: "Thực hiện bởi Kenji Đặng - Artistic Director".
  - Description: Before/After commentary.
  - Link button: "Xem Tất Cả 20+ Biến Hóa Trước & Sau" (`/before-after`).

#### 5. Master Stylists Section (`components/public/home/MasterStylists.tsx`)
- 4 Stylist profile cards:
  - Stylist photo with gold frame.
  - Full Name (e.g. "Kenji Đặng", "Elena Vũ").
  - Role: Artistic Director / Master Colorist.
  - Experience badge: `12 năm kinh nghiệm`.
  - Specialties pills: `['Uốn sóng lơi', 'Cắt Layer hình khối', 'Olaplex']`.
  - Bio snippet.
  - CTA button: "Đặt lịch với Stylist" (`/booking?stylistId=${stylist.id}`).

#### 6. Customer Testimonials Section (`components/public/home/Testimonials.tsx`)
- 4-6 Verified VIP client testimonial cards:
  - 5 Gold Stars (`★ ★ ★ ★ ★`).
  - Quote: Realistic feedback on hair health, styling precision, and salon ambiance.
  - Customer info: Full name, title, avatar, verified visit badge.
  - Service enjoyed: e.g. "Combo Gentleman Atelier", "Nhuộm Balayage Olaplex".

#### 7. Latest Hair Care Blog Articles Preview (`components/public/home/LatestArticles.tsx`)
- 3 latest published articles from `Article`:
  - Image with zoom on hover.
  - Category / Tag badge.
  - Published date (`formatDateVN`) & Estimated reading time (`~4 phút đọc`).
  - Title with hover gold text transition.
  - Excerpt (2 lines max).
  - Author info with avatar.
  - "Xem tất cả bài viết →" header link leading to `/blog`.

#### 8. Dual Action CTA Section (`components/public/home/DualCtaSection.tsx`)
- High-conversion split banner:
  - **Left Block (Hair Try-On)**:
    - Badge: `CÔNG NGHỆ THỬ TÓC AI`
    - Title: "Thử Kiểu Tóc & Màu Nhuộm Trực Quan Trên Ảnh Của Bạn"
    - Description: "Tải ảnh chân dung, trải nghiệm ngay 50+ kiểu tóc và bảng màu thời thượng trước khi cắt."
    - Button: "Trải Nghiệm Thử Tóc Ngay" (`/try-on`)
  - **Right Block (Booking Wizard)**:
    - Badge: `ĐẶT HẸN TRỰC TUYẾN`
    - Title: "Khởi Đầu Hành Trình Định Hình Khí Chất"
    - Description: "Chủ động chọn stylist, dịch vụ và khung giờ mong muốn chỉ trong 60 giây."
    - Button: "Đặt Lịch Ngay" (`/booking`)

---

## 6. Blog & Hair Care Editorial CMS Blueprint

### 6.1 Route 1: Article Catalog (`app/(public)/blog/page.tsx`)
- **Component Type**: Next.js Server Component with `searchParams` parsing.
- **Search Parameters**:
  - `tag?: string` — Filter by tag (e.g. `Dưỡng tóc tẩy`, `Xu hướng tóc`).
  - `q?: string` — Keyword search across title, excerpt, and content.
  - `page?: string` — Pagination index (default `1`, page size `6`).
- **Database Query**:
```typescript
const pageSize = 6;
const currentPage = Math.max(1, parseInt(searchParams.page || '1', 10));

const whereClause: any = { isPublished: true };

if (searchParams.tag) {
  whereClause.tags = { has: searchParams.tag };
}

if (searchParams.q) {
  whereClause.OR = [
    { title: { contains: searchParams.q, mode: 'insensitive' } },
    { excerpt: { contains: searchParams.q, mode: 'insensitive' } },
    { content: { contains: searchParams.q, mode: 'insensitive' } },
  ];
}

const [total, rawArticles, allTagsRaw] = await Promise.all([
  prisma.article.count({ where: whereClause }),
  prisma.article.findMany({
    where: whereClause,
    include: { author: true, category: true },
    orderBy: { publishedAt: 'desc' },
    skip: (currentPage - 1) * pageSize,
    take: pageSize,
  }),
  prisma.article.findMany({
    where: { isPublished: true },
    select: { tags: true },
  }),
]);

const uniqueTags = Array.from(new Set(allTagsRaw.flatMap((a) => a.tags)));
const articles = rawArticles.map(serializeArticle);
const totalPages = Math.ceil(total / pageSize);
```

- **UI Layout**:
  1. **Editorial Hero Header**:
     - Eyebrow: `LUMIÈRE EDITORIAL & CARE ADVICE`
     - Title: "Tạp Chí Làm Đẹp & Cẩm Nang Chăm Sóc Tóc Chuẩn Salon"
     - Subtitle: "Kiến thức chuyên sâu từ các Master Stylist giúp bạn nuôi dưỡng mái tóc bóng khỏe và dẫn đầu xu hướng."
  2. **Filter & Search Bar (`components/public/blog/BlogFilterBar.tsx`)**:
     - Search input field with search icon and instant submission.
     - Horizontal scrollable pill row for tags:
       - "Tất cả" (clears tag filter)
       - Dynamic tag pills with active gold highlight.
     - Active filter summary and "Xóa bộ lọc" button when filters are active.
  3. **Featured Article Spotlight**:
     - When on page 1 with no active search query, the newest article is featured in an expansive 2-column spotlight card with large image, extended excerpt, author credentials, and "Đọc Toàn Bộ Bài Viết" button.
  4. **Article Grid**:
     - 3-column responsive layout (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8`).
     - Rendered via `<BlogArticleCard />`.
  5. **Pagination (`components/public/blog/BlogPagination.tsx`)**:
     - Preserves existing `tag` and `q` search parameters when switching pages.
     - Previous / Next buttons and numeric page buttons with active state.
  6. **Empty State**:
     - Displays friendly message when no articles match search/filter criteria with "Xem tất cả bài viết" reset action.

### 6.2 Route 2: Article Detail Page (`app/(public)/blog/[slug]/page.tsx`)
- **Component Type**: Next.js Server Component with `generateMetadata`.
- **Dynamic SEO Metadata**:
```typescript
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const article = await prisma.article.findUnique({
    where: { slug: params.slug },
    include: { author: true },
  });

  if (!article || !article.isPublished) {
    return { title: 'Không tìm thấy bài viết | Lumière Hair Atelier' };
  }

  const title = article.metaTitle || article.title;
  const description = article.metaDescription || article.excerpt;

  return {
    title: `${title} | Lumière Hair Atelier`,
    description,
    keywords: article.metaKeywords || article.tags.join(', '),
    openGraph: {
      title,
      description,
      type: 'article',
      publishedTime: article.publishedAt?.toISOString(),
      authors: [article.author.fullName],
      images: [
        {
          url: article.coverImageUrl,
          width: 1200,
          height: 630,
          alt: article.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [article.coverImageUrl],
    },
  };
}
```

- **Detail Page Components**:
  1. **Breadcrumb**:
     `Trang chủ` › `Tạp chí` › `Tên bài viết`
  2. **Article Header**:
     - Primary tag badge.
     - H1 Title in Playfair serif font (`text-3xl md:text-5xl font-serif font-bold text-salon-ivory leading-tight`).
     - Excerpt lead paragraph with `text-lg text-neutral-300 font-light italic border-l-2 border-salon-gold pl-4`.
     - Author Meta Bar:
       - Author avatar & full name.
       - Published date formatted as `DD/MM/YYYY`.
       - Reading time estimate (`~X phút đọc`).
       - View count (`viewCount + 1` incremented on load).
  3. **Cover Image**:
     - Full-width hero image with rounded-2xl border and subtle gold glow.
  4. **Article Body (`components/public/MarkdownRenderer.tsx`)**:
     - Custom zero-dependency parser rendering:
       - H2 / H3 with gold gradient accent.
       - Paragraphs with comfortable line-height (`leading-relaxed text-neutral-200`).
       - Bullet lists with custom gold dot indicators.
       - Numbered lists.
       - Blockquotes with italic styling and gold left border.
       - Bold and highlighted text.
  5. **Article Tags**:
     - Clickable tag pills at bottom linking back to `/blog?tag=${tag}`.
  6. **Author Bio Card**:
     - Stylist avatar with gold border.
     - Name and role title (e.g. Master Colorist / Artistic Director).
     - Author biography from `User.bio`.
     - Direct CTA: "Đặt lịch tư vấn cùng tác giả" (`/booking?stylistId=${author.id}`).
  7. **Social Share Bar (`components/public/blog/SocialShareBar.tsx`)**:
     - Share on Facebook.
     - Share on Zalo.
     - Copy Link button with inline "Đã sao chép liên kết!" toast feedback.
  8. **Related Articles Section**:
     - Fetches 3 other published articles matching any shared tags.
     - Displayed in a 3-column card grid.
  9. **Contextual Booking Call-to-Action**:
     - "Cảm hứng thay đổi diện mạo? Đặt hẹn ngay hôm nay để nhận tư vấn trực tiếp từ đội ngũ chuyên gia!"

---

## 7. Public REST API Endpoints Blueprint

To satisfy E2E test suites (`TC1.1`, `TC1.6`, `TC4.4`, `TC4.5`) in live server environments, dedicated route handlers are placed under `app/api/public/`:

### 7.1 `app/api/public/home/route.ts`
- **Method**: `GET`
- **Contract Verification (`TC1.1`)**:
  - `res.status === 200`
  - `res.data.branding.brandName` present and reflects current `SiteSetting.brandName`.
  - `res.data.banners` array with active banners (`length > 0`).
  - `res.data.categories` array containing `'Nam'` and `'Nữ'`.
  - `res.data.trendingHairstyles` array (`length > 0`).
  - `res.data.services` array (`length > 0`).
  - `res.data.articles` array of published articles.
- **Implementation**:
```typescript
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { serializeSettings } from '@/lib/validations/settings';
import { serializeBanner, serializeHairstyle, serializeService, serializeArticle } from '@/lib/validations/content';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [settingsRaw, bannersRaw, stylesRaw, servicesRaw, articlesRaw] = await Promise.all([
      prisma.siteSetting.findUnique({ where: { id: 'default_setting' } }).catch(() => null),
      prisma.banner.findMany({ where: { isActive: true }, orderBy: { displayOrder: 'asc' } }).catch(() => []),
      prisma.hairstyle.findMany({ where: { isActive: true, isTrending: true }, take: 6 }).catch(() => []),
      prisma.service.findMany({ where: { isActive: true }, take: 10 }).catch(() => []),
      prisma.article.findMany({ where: { isPublished: true }, take: 6 }).catch(() => []),
    ]);

    const branding = serializeSettings(settingsRaw) || { brandName: 'Lumière Hair Atelier' };
    const banners = bannersRaw.map(serializeBanner);
    const categories = ['Nam', 'Nữ', 'Nhuộm', 'Chăm sóc'];
    const trendingHairstyles = stylesRaw.map(serializeHairstyle);
    const services = servicesRaw.map(serializeService);
    const articles = articlesRaw.map(serializeArticle);

    return NextResponse.json({
      branding,
      banners,
      categories,
      trendingHairstyles,
      services,
      articles,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Lỗi tải dữ liệu trang chủ' }, { status: 500 });
  }
}
```

### 7.2 `app/api/public/articles/route.ts`
- **Method**: `GET`
- **Contract Verification (`TC1.6`)**:
  - `res.status === 200`
  - `res.data.articles` array with published articles (`length > 0`).
  - Each item has `published === true`, `seoTitle`, `seoDescription`.
- **Query Params Supported**: `tag`, `search`, `page`, `limit`.
- **Implementation**:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { serializeArticle } from '@/lib/validations/content';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tag = searchParams.get('tag');
    const search = searchParams.get('search') || searchParams.get('q');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));

    const where: any = { isPublished: true };

    if (tag) where.tags = { has: tag };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, articlesRaw] = await Promise.all([
      prisma.article.count({ where }),
      prisma.article.findMany({
        where,
        include: { author: true, category: true },
        orderBy: { publishedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const articles = articlesRaw.map(serializeArticle);

    return NextResponse.json({
      articles,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Lỗi tải danh sách bài viết' }, { status: 500 });
  }
}
```

### 7.3 `app/api/public/articles/[slug]/route.ts`
- **Method**: `GET`
- **Implementation**:
  - Looks up article by slug where `isPublished: true`.
  - Increments `viewCount` atomically via `prisma.article.update({ where: { slug }, data: { viewCount: { increment: 1 } } })`.
  - Returns serialized article or 404 if not found.

---

## 8. Custom Lightweight Markdown Renderer

To avoid adding external markdown dependencies that could introduce hydration mismatches or vulnerabilities, `components/public/MarkdownRenderer.tsx` delivers a high-fidelity semantic renderer:

```typescript
'use client';

import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  if (!content) return null;

  // Split into structural blocks
  const blocks = content.split(/\n\s*\n/);

  return (
    <div className="space-y-6 text-neutral-200 leading-relaxed font-sans">
      {blocks.map((block, idx) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        // Heading 1
        if (trimmed.startsWith('# ')) {
          return (
            <h1 key={idx} className="text-3xl font-serif font-bold text-salon-ivory gold-text-gradient pt-4">
              {trimmed.substring(2)}
            </h1>
          );
        }

        // Heading 2
        if (trimmed.startsWith('## ')) {
          return (
            <h2 key={idx} className="text-2xl font-serif font-bold text-salon-gold-light border-b border-salon-gold/20 pb-2 pt-4">
              {trimmed.substring(3)}
            </h2>
          );
        }

        // Heading 3
        if (trimmed.startsWith('### ')) {
          return (
            <h3 key={idx} className="text-xl font-semibold text-salon-gold pt-2">
              {trimmed.substring(4)}
            </h3>
          );
        }

        // Blockquote
        if (trimmed.startsWith('> ')) {
          return (
            <blockquote key={idx} className="border-l-4 border-salon-gold bg-salon-charcoal/60 p-4 rounded-r-lg italic text-neutral-300">
              {trimmed.substring(2)}
            </blockquote>
          );
        }

        // Unordered List
        if (trimmed.split('\n').every((line) => line.trim().startsWith('* ') || line.trim().startsWith('- '))) {
          const items = trimmed.split('\n').map((l) => l.trim().substring(2));
          return (
            <ul key={idx} className="space-y-2 list-none pl-2">
              {items.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-neutral-300">
                  <span className="text-salon-gold text-lg leading-none mt-1">•</span>
                  <span>{parseInlineMarkdown(item)}</span>
                </li>
              ))}
            </ul>
          );
        }

        // Standard Paragraph
        return (
          <p key={idx} className="text-neutral-300 leading-relaxed">
            {parseInlineMarkdown(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

function parseInlineMarkdown(text: string): React.ReactNode[] {
  // Regex to match **bold** and *italic*
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={match.index} className="font-semibold text-salon-ivory">
          {token.substring(2, token.length - 2)}
        </strong>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push(
        <em key={match.index} className="italic text-salon-gold-light">
          {token.substring(1, token.length - 1)}
        </em>
      );
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts;
}
```

---

## 9. Implementation Phasing Plan (For M4 Worker 1)

### Phase 1: Shared Data Layer & Public APIs
1. Create `lib/public-data.ts` with cached queries & default fallbacks.
2. Create `types/public.ts` with shared view-model types.
3. Create `app/api/public/home/route.ts` & `app/api/public/articles/route.ts` to satisfy E2E tests `TC1.1` and `TC1.6`.

### Phase 2: Public Layout & Dynamic Branding
4. Create `components/public/PublicHeader.tsx` (sticky luxury navbar with scroll listener & mobile toggle).
5. Create `components/public/MobileDrawer.tsx` (slide-out drawer with contact info & navigation).
6. Create `components/public/PublicFooter.tsx` (4-column responsive footer populated from `SiteSetting`).
7. Create `app/(public)/layout.tsx` wire-up assembling Announcement Bar, Header, Main, and Footer.

### Phase 3: Dynamic Home Page
8. Build home sub-components under `components/public/home/`:
   - `HeroBannerSlider.tsx`
   - `QuickCategories.tsx`
   - `TrendingHairstyles.tsx`
   - `MiniBeforeAfter.tsx`
   - `MasterStylists.tsx`
   - `Testimonials.tsx`
   - `LatestArticles.tsx`
   - `DualCtaSection.tsx`
9. Create `app/(public)/page.tsx` assembling all home sections.
10. Remove or re-route obsolete placeholder `app/page.tsx` to eliminate Next.js App Router root routing conflicts.

### Phase 4: Blog & Editorial CMS
11. Create `components/public/MarkdownRenderer.tsx` (custom markdown renderer).
12. Create `components/public/blog/BlogFilterBar.tsx` (search & tag filtering).
13. Create `components/public/blog/BlogArticleCard.tsx` (card with reading time).
14. Create `components/public/blog/BlogPagination.tsx` (page navigator).
15. Create `components/public/blog/SocialShareBar.tsx` (share links & copy).
16. Create `app/(public)/blog/page.tsx` (catalog view with tag filter & search).
17. Create `app/(public)/blog/[slug]/page.tsx` (detail view with dynamic OG SEO metadata).

### Phase 5: Verification & Quality Gates
18. Run `npx tsc --noEmit` -> ensure 0 compilation errors.
19. Run `npm run test:e2e` -> ensure 67/67 tests continue passing (with 100% pass on `TC1.1`, `TC1.6`, `TC4.4`, `TC4.5`).
20. Run `npm run build` -> verify clean production bundle output.

---

## 10. Risk Assessment & Mitigations

| Risk | Impact | Probability | Mitigation Strategy |
|------|--------|-------------|---------------------|
| Route conflict between `app/page.tsx` and `app/(public)/page.tsx` | Next.js build error: Conflicting root routes | High | Remove or delegate `app/page.tsx` directly to `app/(public)/page.tsx` during phase transition. |
| DB query latency on cold start in Serverless environment | Slow initial render of homepage | Medium | Safe fallback to in-memory `DEFAULT_SITE_SETTINGS` and mock banners if DB query times out. |
| Incomplete E2E reflection when Admin updates Site Settings | E2E tests `TC4.4` / `TC4.5` failure | Low | Use `force-dynamic` on `/api/public/home` and ensure queries fetch freshly committed Prisma records. |
| Hydration mismatch in Mobile Drawer or Banner Slider | Client-side React warning | Medium | Ensure client components use `'use client'`, defer window-dependent dimensions to `useEffect`. |
| Missing tags or category in Article detail | Runtime undefined error | Low | Use optional chaining and default empty arrays for tags and categories in `serializeArticle`. |
