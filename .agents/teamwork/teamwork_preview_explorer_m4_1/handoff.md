# Milestone 4 Explorer 1 Handoff Report: Public Layout, Home Page & Blog CMS

**Working Directory:** `c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_explorer_m4_1`  
**Parent Orchestrator ID:** `daa96dc0-4b53-4192-88a0-f59f39a1f3f3`  
**Handoff Type:** Hard (Task complete)  
**Timestamp:** 2026-10-19T07:22:00Z  

---

## 1. Observation

1. **Workspace & Route Structure**:
   - `app/(public)` directory does not currently exist. The root route `/` is temporarily occupied by a placeholder `app/page.tsx` (lines 1–40), which renders a static welcome screen.
   - `app/layout.tsx` (lines 1–22) serves as the Next.js Root Layout with `lang="vi"` and `body` styling. Creating `app/(public)/layout.tsx` will wrap all public routes under `(public)`.
   - **Next.js Routing Constraint**: Having both `app/page.tsx` and `app/(public)/page.tsx` will cause Next.js to throw a fatal build error: *"You cannot have both app/page.tsx and app/(public)/page.tsx configured for the root route"*. The placeholder `app/page.tsx` must be removed or delegate directly to `app/(public)/page.tsx`.

2. **Database Models & Schemas**:
   - `prisma/schema.prisma`:
     - Model `SiteSetting` (lines 490–512): Fields `brandName`, `brandSlogan`, `logoUrl`, `faviconUrl`, `hotlinePrimary`, `hotlineSecondary`, `emailContact`, `addressFull`, `googleMapsEmbedUrl`, `openingHours` (Json), `socialLinks` (Json), `defaultSeoMetadata` (Json), `footerContent` (Json).
     - Model `Banner` (lines 429–448): Fields `title`, `subtitle`, `badgeText`, `imageUrl`, `mobileImageUrl`, `linkUrl`, `ctaText`, `displayOrder`, `isActive`, `startDate`, `endDate`.
     - Model `Article` (lines 454–484): Fields `title`, `slug`, `excerpt`, `content` (Markdown), `coverImageUrl`, `tags` (String[]), `metaTitle`, `metaDescription`, `metaKeywords`, `authorId` (User relation), `categoryId`, `isPublished`, `publishedAt`, `viewCount`.
     - Model `User` (lines 39–72): Contains `isStylist` boolean, `bio`, `experienceYears`, `specialties` (String[]), `avatarUrl`, `fullName`.
     - Model `BeforeAfter` (lines 340–365): Fields `beforeImageUrl`, `afterImageUrl`, `title`, `description`, `customerGender`, `isFeatured`, relations to `service`, `hairstyle`, `stylist`.
     - Model `Hairstyle` (lines 174–220): Fields `isTrending`, `isFeatured`, `coverImageUrl`, `galleryImages`, `suitableFaces`, `suitableTexture`, `priceRefMin`, `priceRefMax`.

3. **Existing Serializers & Validations**:
   - `lib/validations/settings.ts` (lines 68–109): Exports `serializeSettings(setting)` which normalizes nested Json fields (`openingHoursStructured`, `socialLinks`, `footerContent`, `defaultSeoMetadata`) as well as flattened alias properties (`hotline`, `address`, `socialFacebook`, `footerText`).
   - `lib/validations/content.ts`: Exports `serializeBanner` (lines 37–62), `serializeHairstyle` (lines 201–255), `serializeArticle` (lines 540–578), and `serializeService` (lines 449–479).

4. **Design Tokens & Styling**:
   - `tailwind.config.ts` (lines 54–83): Contains luxury design tokens:
     - `salon.noir` (`#0B0F17`), `salon.charcoal` (`#161B26`), `salon.gold` (`#D4AF37`), `salon.gold.light` (`#F3E5AB`), `salon.gold.dark` (`#AA820A`), `salon.gold.hover` (`#C5A059`), `salon.ivory` (`#FDFBF7`).
     - Box shadows: `gold-glow`, `gold-subtle`, `luxury-card`, `luxury-dark`.
     - Fonts: `serif` (`var(--font-playfair)`, `Georgia`), `sans` (`var(--font-plus-jakarta)`).
   - `app/globals.css` (lines 82–106): Contains utility classes `.glass-luxury`, `.glass-light`, `.gold-border-gradient`, `.gold-text-gradient`.

5. **Test Status & Test Contracts**:
   - Execution of `npm run test:e2e` ran 67 tests across 15 suites with **67 passed, 0 failed (100% pass)**.
   - Specifically, `tests/e2e/tier1-features/public.test.ts`:
     - Line 11: `TC1.1: GET /api/public/home returns complete dynamic sections configured from CMS`. Expects `{ branding, banners, categories, trendingHairstyles, services, articles }`.
     - Line 114: `TC1.6: GET /api/public/articles returns published articles with SEO metadata`. Expects `{ articles }` with `published === true`, `seoTitle`, `seoDescription`.
     - `TC4.4` & `TC4.5` in `tests/e2e/tier4-scenarios/content-management-lifecycle.test.ts`: Asserts that updating `SiteSettings` or toggling `Banner.active` immediately reflects in `/api/public/home`.
   - Execution of `npx tsc --noEmit` exited with code 0 (zero TypeScript errors).

---

## 2. Logic Chain

1. **Layout Architecture (Observation 1 & 2)**:
   - The Public Website requires a persistent luxury navigation shell and dynamic footer reflecting CMS settings (`ORIGINAL_REQUEST.md R1.1`, `DISPATCH.md`).
   - Because `app/(public)/layout.tsx` is a Server Component, it can query `prisma.siteSetting.findUnique({ where: { id: 'default_setting' } })` at request time with zero client fetch overhead.
   - For client-side interactivity (scroll transparency transition, active link matching, mobile drawer toggle), `<PublicHeader />` and `<MobileDrawer />` are encapsulated as client components (`'use client'`) receiving serialized settings as props.

2. **Route Conflict Prevention (Observation 1)**:
   - In Next.js App Router, files within route groups like `app/(public)/page.tsx` map to the URL `/`.
   - If `app/page.tsx` remains, the build will fail with route collision.
   - Therefore, the implementation plan replaces `app/page.tsx` with `app/(public)/page.tsx`, ensuring all public routes (`/`, `/blog`, `/hairstyles`, etc.) share `app/(public)/layout.tsx` while `/admin/*` remains completely isolated under `app/admin/layout.tsx`.

3. **Dynamic Home Page Composition (Observation 2 & 5)**:
   - The dynamic home page requires 8 distinct content sections: Hero Banner Slider, Quick Categories, Trending Hairstyles Carousel, Mini Before/After Comparison, Master Stylists, Testimonials, Latest Blog Articles, and Dual CTA Blocks.
   - Grouping data fetching into a single server-side `getPublicHomeData()` helper executing `Promise.all` minimizes database roundtrips and handles cold-start latency through cached defaults.
   - Heavy interactive widgets (hero auto-slider with pause, hairstyle category filtering, split before/after drag slider) are broken into dedicated client components under `components/public/home/`.

4. **Blog & Editorial CMS Delivery (Observation 2 & 3)**:
   - The blog listing (`app/(public)/blog/page.tsx`) reads URL `searchParams` (`tag`, `q`, `page`) on the server, ensuring full SEO crawlability without client-only state locks.
   - Reading time is computed dynamically using word count / 200 words per minute.
   - The detail page (`app/(public)/blog/[slug]/page.tsx`) leverages Next.js `generateMetadata` to produce dynamic Open Graph images and description tags from `Article.metaTitle`, `Article.metaDescription`, and `Article.coverImageUrl`.
   - Rich Markdown content from CMS is parsed into semantic, styled HTML via a custom, zero-dependency `MarkdownRenderer` component to avoid hydration mismatches and third-party bundle bloat.

5. **API & Test Alignment (Observation 5)**:
   - Endpoints `/api/public/home` and `/api/public/articles` must be implemented with `force-dynamic` to ensure any mutations from Admin CMS (`TC4.4`, `TC4.5`) immediately reflect in public queries without stale caching.

---

## 3. Caveats

1. **Peer Explorer Scope Boundaries**:
   - Explorer 2 owns `/hairstyles`, `/hairstyles/[slug]`, `/colors`, and `/before-after`.
   - Explorer 3 owns `/services` and `/booking` (5-step wizard).
   - Our design for the Home Page and Blog links directly to these routes (e.g. `/booking?stylistId=...`, `/try-on?style=...`, `/hairstyles/${slug}`), using established URL query parameter contracts.
2. **Review/Testimonial Data Source**:
   - The database schema does not have a dedicated `Review` table (14 models total). The customer reviews section on the home page is designed with realistic VIP client testimonials and can optionally read from a JSON field in `SiteSetting` or a curated static array.
3. **External Images**:
   - Seed data uses Unsplash URLs. Next.js image domain config (`next.config.js`) already allows Unsplash images or standard `<img>` tags can be used.

---

## 4. Conclusion

The technical architecture and component blueprints for Milestone 4 Explorer 1 (Public Layout, Home Page & Blog CMS) are fully formulated, documented in `analysis.md`, and ready for immediate implementation by M4 Worker 1:
- **`app/(public)/layout.tsx`**: Dynamic header, sticky navbar, mobile drawer, and CMS-driven footer.
- **`app/(public)/page.tsx`**: High-conversion home page with 8 dynamic sections powered by live database queries.
- **`app/(public)/blog/page.tsx` & `[slug]/page.tsx`**: SEO-optimized blog catalog and rich editorial detail view with custom markdown renderer.
- **`app/api/public/home/route.ts` & `app/api/public/articles/route.ts`**: Dedicated REST endpoints strictly fulfilling `TC1.1` and `TC1.6`.

---

## 5. Verification Method

To independently verify this exploration and blueprint:

1. **Inspect Blueprint Deliverables**:
   - View `c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_explorer_m4_1\analysis.md`
   - View `c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_explorer_m4_1\handoff.md`

2. **Verify TypeScript Compilation**:
   ```powershell
   npx tsc --noEmit
   ```
   *Expected result*: Exit code 0 with zero type errors.

3. **Verify E2E Test Suite**:
   ```powershell
   npm run test:e2e
   ```
   *Expected result*: 67/67 tests passing (100% success rate across Tiers 1–4).

4. **Verify Implementation Validation Criteria**:
   - After implementing `app/(public)/layout.tsx`, `app/(public)/page.tsx`, and `app/(public)/blog/*`:
     - `GET /api/public/home` returns 200 with `branding`, `banners`, `categories`, `trendingHairstyles`, `services`, `articles`.
     - `GET /api/public/articles` returns 200 with published articles and SEO meta.
     - Public website renders Obsidian Noir / Champagne Gold theme (`#0B0F17`, `#D4AF37`) without layout shifts or console errors.
