# Specification Report: Public Website (R1) & Hair Try-On Tool (R2)

**Document Reference**: SPEC-R1-R2-20261019  
**Target Subsystems**: R1 (Public Website) & R2 (Hair Try-On Tool)  
**Author**: Specification Miner 1 (`teamwork_preview_spec_miner_survey_1`)  
**Context**: Modern Hair Salon Web Application (Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui, PostgreSQL / Prisma, Vercel Serverless)

---

## 1. Executive Architecture & Scope Overview

The Public Website (R1) serves as the primary touchpoint for salon discovery, brand showcase, style exploration, online booking, and hair consultation. The Hair Try-On Tool (R2) provides an interactive, client-side simulation interface backed by a pluggable, serverless-safe abstraction (`HairTryOnProvider`).

### Route Structure (Next.js App Router)
```
app/(public)/
├── layout.tsx                     # Global Public Header, Navigation, Footer, Toast Provider
├── page.tsx                       # Home Page (Dynamic Hero, Categories, Trends, Testimonials, CTA)
├── hairstyles/
│   ├── page.tsx                   # Hairstyle Library (Multi-criteria search, filters, grid view)
│   └── [slug]/
│       └── page.tsx               # Hairstyle Detail View (Multi-angle photos, care tips, services, CTAs)
├── colors/
│   └── page.tsx                   # Hair Color Consultation & Swatch Library (Tones, levels, maintenance)
├── before-after/
│   └── page.tsx                   # Before/After Interactive Comparison Showcase (2-image slider)
├── services/
│   └── page.tsx                   # Services & Price List (Categorized catalog, durations, price ranges)
├── booking/
│   └── page.tsx                   # Multi-step Online Booking Wizard (Validation, anti-duplicate, pending confirmation)
├── blog/
│   ├── page.tsx                   # News & Care Advisory Articles List
│   └── [slug]/
│       └── page.tsx               # Article Detail View with dynamic SEO Metadata & Open Graph
└── try-on/
    └── page.tsx                   # Interactive Hair Try-On Canvas (Portrait upload, style/color picker, preview)
app/api/
├── booking/
│   └── route.ts                   # POST: Submit new booking with Zod validation and idempotency
├── try-on/
│   └── route.ts                   # POST: Multipart upload proxy to HairTryOnProvider (ephemeral in-memory)
└── public/
    ├── hairstyles/route.ts        # GET: Filtered query for hairstyles
    ├── colors/route.ts            # GET: Color swatch library items
    └── services/route.ts          # GET: Active service catalog
```

---

## 2. Detailed Functional Specifications: R1 Public Website

### 2.1 Home Page (`/`)
- **Hero Banner Dynamic Carousel**:
  - Fetches active banners ordered by priority from CMS.
  - Displays high-resolution background imagery, headline, subheading, and customizable CTA button linking to `/booking`, `/hairstyles`, or `/try-on`.
  - Mobile swipe support, auto-rotation with manual pause on hover/touch.
- **Highlighted Categories**:
  - 4 core highlight cards: Nam (Men's styles), Nữ (Women's styles), Nhuộm (Coloring & Highlights), Chăm sóc (Hair Care & Scalp Treatments).
  - Quick link to `/hairstyles?gender=MALE`, `/hairstyles?gender=FEMALE`, `/colors`, `/services?category=treatment`.
- **New Trends & Favorite Styles**:
  - Dynamic query retrieving items flagged `isTrending: true` or `isFavorite: true`.
  - Visual cards with badge tags (e.g., "Trending 2026", "Top Choice"), price reference, and fast try-on / booking links.
- **Interactive Before/After Preview**:
  - Embedded slider component previewing a featured transformation.
  - Link to `/before-after` for the complete gallery.
- **Stylists Team Showcase**:
  - Grid of top stylists with avatar, title, specialty, years of experience, and a "Đặt lịch với Stylist này" button that opens `/booking?stylistId=xyz`.
- **Customer Reviews & Testimonials**:
  - Star ratings (1-5), verified customer name, haircut/service received, and quote card carousel.
- **Promotions & Offers**:
  - Current discount packages and coupon codes with countdown or validity date range.
- **Care Advisory & Blog Highlights**:
  - Top 3 recent articles with thumbnails, publication dates, and reading duration estimates.
- **Salon Contact, Hours & Map**:
  - Address, phone/hotline with `tel:` link, business hours (e.g. 08:30 - 20:30 Mon-Sun), embedded Google Map iframe, social media links (Facebook, Instagram, TikTok, Zalo).
- **Persistent Floating CTA**:
  - Sticky mobile/desktop bottom-corner action bar: "Đặt lịch hẹn" & "Thử tóc AI".

### 2.2 Hairstyle Library (`/hairstyles` & `/hairstyles/[slug]`)
- **Multi-Criteria Search & Filter Engine**:
  - **Gender / Audience**: `All`, `Nam` (Male), `Nữ` (Female), `Unisex`.
  - **Aesthetic Style**: `Hàn Quốc` (Korean Soft Wave / Two-Block), `Nhật Bản` (Japanese Layered), `Cổ điển` (Classic Pompadour / Bob), `Tối giản` (Minimalist Clean Cut), `Hiện đại / Phá cách` (Edgy / Mullet / Wolf Cut).
  - **Hair Length**: `Rất ngắn` (Buzz / Pixie), `Ngắn` (Short / Bob / Undercut), `Vừa` (Medium / Lob), `Dài` (Long), `Rất dài` (Extra Long).
  - **Face Shape Compatibility**: `Mặt tròn` (Round), `Mặt trái xoan` (Oval), `Mặt vuông` (Square), `Mặt dài` (Oblong), `Mặt kim cương` (Diamond), `Mặt trái tim` (Heart).
  - **Hair Texture Compatibility**: `Tóc thẳng` (Straight), `Tóc gợn sóng` (Wavy), `Tóc xoăn` (Curly), `Tóc xù / rễ tre` (Coarse / Thick), `Tóc tơ / mỏng xẹp` (Fine / Thin).
  - **Maintenance Effort**: `Dễ chăm sóc` (Low - Wash & go), `Trung bình` (Medium - Light blow dry), `Cần tạo kiểu hàng ngày` (High - Wax / Spray / Iron required).
  - **URL Query Param Synchronization**: All filter states sync to URL search params (`/hairstyles?gender=MALE&length=SHORT&faceShape=ROUND`) allowing deep-linking and bookmarking.
- **Hairstyle Detail Page (`/hairstyles/[slug]`)**:
  - Multi-angle gallery: Front, side, 45-degree angle, and back views.
  - Characteristic badges (Suitability for face shapes, recommended hair thickness).
  - In-depth styling & maintenance advice (e.g., drying technique, recommended styling pomade/serum).
  - Related Salon Services with estimated duration and starting price.
  - Interactive Action Buttons:
    - `Lưu yêu thích` (Toggle favorite in localStorage with count feedback).
    - `Thử kiểu tóc này ngay` (Direct link to `/try-on?styleId=[id]`).
    - `Đặt lịch với mẫu này` (Direct link to `/booking?styleId=[id]`).

### 2.3 Hair Color Consultation & Swatch Library (`/colors`)
- **Color Classification System**:
  - **Color Tones**: Warm (`Tông ấm`: Vàng mật ong, Nâu đồng, Đỏ cherry), Cool (`Tông lạnh`: Nâu tây khói, Xám bạc, Xanh rêu), Neutral (`Trung tính`: Nâu hạt dẻ, Đen tuyền).
  - **Color Families**: Nâu (Browns), Khói/Xám (Ash/Platinum), Vàng (Blonde), Đỏ/Đồng (Red/Copper), Pastel/Thời trang (Pink, Purple, Blue, Mint).
  - **Brightness Level**: Level 1-4 (Tối / Dark), Level 5-7 (Trung bình / Medium), Level 8-10+ (Sáng / Light).
  - **Bleaching Requirement**: Không cần tẩy (Level 1-5), Tẩy 1 lần (Level 6-8), Tẩy 2+ lần (Level 9+).
  - **Matching Skin Tones**: Da sáng (Fair/Cool), Da trung tính (Neutral), Da ngăm/bánh mật (Warm/Olive).
- **Interactive Swatch Modal / Card**:
  - Hex code preview, real-world hair swatch model photography.
  - Maintenance guide: Required shampoo (e.g., dầu gội tím giữ ánh khói), expected longevity (e.g., 4-6 tuần), fading tone description (e.g., phai ra nâu vàng).
  - One-click CTA: "Thử màu này trên ảnh" (opens `/try-on?colorId=[id]`) or "Đặt lịch nhuộm màu này" (opens `/booking?colorId=[id]`).

### 2.4 Before/After Interactive Comparison Showcase (`/before-after`)
- **Dual-Image Interactive Slider**:
  - 50/50 split canvas with responsive draggable slider handle.
  - Supports mouse drag, touch gestures, and keyboard arrow keys for accessibility (`aria-valuenow`).
  - Label overlay: "Trước (Before)" on left, "Sau (After)" on right.
- **Case Metadata & Association**:
  - Customer hair condition prior to service (e.g. "Tóc khô xơ, mất nếp, ngọn tóc chẻ ngọn").
  - Transformation details: Services performed (e.g. "Cắt layer + Uốn phồng chân tóc + Phục hồi Keratin").
  - Performed by: Stylist badge and avatar.
  - Related links to specific service and hairstyle pages.

### 2.5 Services & Price List (`/services`)
- **Comprehensive Categorized Catalog**:
  - Cắt & Tạo kiểu (Men's cut, Women's layer cut, Fringe cut, Kids).
  - Uốn tóc (Cold perm, Digital hot perm, Wave perm, Root volume).
  - Nhuộm & Nâng tone (Single tone, Highlighting, Balayage, Ombre, Bleaching).
  - Phục hồi & Spa da đầu (Deep conditioning, Scalp detox, Keratin smoothing).
  - Combo tiết kiệm (Pre-packaged high-value service bundles).
- **Service Attributes per Card**:
  - Service title, detailed step breakdown, and benefits.
  - Estimated duration (e.g., "45 - 60 phút", "180 - 240 phút").
  - Transparent price range (e.g., "250.000đ - 350.000đ" or "Từ 1.200.000đ tùy độ dài tóc").
  - Pre-service guidelines (e.g., "Tránh gội đầu trước 24 giờ nếu có lịch tẩy tóc").
  - Post-service aftercare notes (e.g., "Giữ khô tóc trong 48 giờ đầu sau khi uốn/nhuộm").
  - One-click action: "Chọn dịch vụ & Đặt lịch".

### 2.6 Multi-Step Online Booking Wizard (`/booking`)
- **Step-by-step Wizard Architecture**:
  - **Step 1: Chọn dịch vụ (Service Selection)**:
    - Multi-select capability with live subtotal price range and accumulated duration estimation.
  - **Step 2: Kiểu tóc / Màu tóc tham khảo (Reference Selection - Optional)**:
    - Pre-selected if routed from hairstyle/color pages; or choose from thumbnail library; or upload custom reference photo.
  - **Step 3: Chọn Stylist & Thời gian (Stylist & Schedule)**:
    - Stylist selection: "Bất kỳ Stylist nào" (Any available) or specific stylist with avatar and rating.
    - Date picker: Minimum date is today, maximum 30 days ahead; past dates disabled.
    - Time slot picker: Available slots generated based on salon operating hours (08:30 - 20:30) with 30-minute intervals. Disabled slots if salon is closed or time in past.
  - **Step 4: Thông tin khách hàng & Ghi chú (Customer Details)**:
    - Full Name (Họ và tên): Required, string (min 2 chars).
    - Phone Number (Số điện thoại): Required, Vietnamese mobile format validation (`(0[3|5|7|8|9])+([0-9]{8})`).
    - Email: Optional, valid email format for booking confirmation email.
    - Notes (Ghi chú): Hair condition, special requests, scalp sensitivity notes.
  - **Step 5: Xác nhận & Đặt hẹn (Review & Submit)**:
    - Summary checklist of services, reference style, stylist, date, time, customer info, and total estimated time/cost.
- **Validation & Anti-Duplicate Protection**:
  - Client-side validation via React Hook Form + Zod schema.
  - Server-side validation via Next.js API Route (`app/api/booking/route.ts`).
  - **Anti-duplicate Mechanism**:
    - Client-side submit button state lock (`isSubmitting` prevents duplicate clicks).
    - Idempotency key generated per booking session (UUID v4 sent in `x-idempotency-key` header).
    - Server-side deduplication check: If same phone number submits exact same services and time slot within 5 minutes, return existing booking record instead of creating duplicates.
- **Confirmation State**:
  - Distinctive booking reference code (e.g. `BK-20261019-7842`).
  - Prominent pending confirmation notice: "Yêu cầu đặt lịch đã được tiếp nhận! Salon sẽ liên hệ qua điện thoại/Zalo trong vòng 15-30 phút để xác nhận lịch hẹn của bạn."
  - Action buttons: "Lưu lịch vào Google Calendar / Apple Calendar (.ics)", "Quay về trang chủ", "Xem hướng dẫn trước khi đến Salon".

### 2.7 News & Care Advisory Articles (`/blog` & `/blog/[slug]`)
- **Article Catalog**:
  - Categorization: "Bí quyết chăm sóc tóc", "Xu hướng tóc hot", "Kiến thức màu nhuộm", "Ưu đãi salon".
  - Search input with debounced query.
- **Article Detail Page**:
  - Dynamic SEO tags generated via `generateMetadata()`:
    - `<title>[Article Title] | [Salon Brand Name]</title>`
    - `<meta name="description" content="[Excerpt]" />`
    - Canonical URL.
    - Structured data `application/ld+json` (Schema.org `NewsArticle` / `BlogPosting`).
  - Open Graph & Twitter Cards:
    - `og:title`, `og:description`, `og:image`, `og:url`, `og:type = "article"`, `article:published_time`, `article:author`.
  - Content reading experience: Table of contents, estimated reading time (e.g., "5 phút đọc"), clean typography, responsive images with caption.
  - Social sharing buttons (Facebook, Zalo, Copy Link) and contextual salon service recommendations at the footer.

---

## 3. Detailed Functional Specifications: R2 Hair Try-On Tool

### 3.1 User Interface & Interaction Flow (`/try-on`)
- **Step 1: Portrait Photo Upload**:
  - Drag-and-drop zone with camera capture option on mobile devices (`accept="image/png, image/jpeg, image/webp"`).
  - Guidelines tooltip: "Chụp chính diện khuôn mặt, vén tóc sau tai hoặc buộc gọn, ánh sáng đều, không đeo kính râm hoặc đội mũ".
  - Instant client-side preview with facial boundary guide overlay.
- **Step 2: Choose Hairstyle & Color**:
  - Hairstyle gallery drawer/grid filterable by gender and length.
  - Color swatch palette overlaid on the selected style.
- **Step 3: Run Simulation**:
  - "Thử ngay" button triggers server action/API route.
  - Animated loading state with progress status updates (e.g., "Đang tải ảnh...", "Nhận diện khuôn mặt...", "Áp dụng kiểu tóc...").
- **Step 4: Comparison & Action**:
  - Side-by-side or drag-to-reveal slider comparing original portrait with simulated new hairstyle.
  - Actions: "Tải ảnh về", "Thử lại", and "Đặt lịch với kiểu tóc này" (pre-populates `/booking` with chosen style and color).
  - Prominent visual disclaimer banner: "Kết quả mô phỏng trực quan minh họa - Vui lòng tham khảo ý kiến chuyên gia stylist để có đánh giá chính xác nhất theo chất tóc thực tế."

### 3.2 Architectural Abstraction: `HairTryOnProvider`
To ensure future-proof integration with external AI APIs (e.g. Replicate, Stable Diffusion SDXL Inpainting, Fal.ai, ControlNet) without changing UI components, all try-on processing is abstracted behind a strict TypeScript interface:

```typescript
// services/try-on/types.ts

export interface HairTryOnInput {
  imageBuffer: Buffer;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  fileName: string;
  hairstyleId: string;
  hairstyleName: string;
  hairColorId?: string;
  hairColorHex?: string;
  hairColorName?: string;
  options?: {
    outputFormat?: 'jpeg' | 'png' | 'webp';
    quality?: number; // 1-100
  };
}

export interface HairTryOnOutput {
  success: boolean;
  resultImageUrl: string; // Base64 data URI or signed temporary URL
  providerName: string;
  isMock: boolean;
  processingTimeMs: number;
  disclaimer: string;
  metadata?: {
    faceDetected?: boolean;
    confidenceScore?: number;
    colorApplied?: string;
    styleApplied?: string;
  };
}

export interface HairTryOnProvider {
  readonly name: string;
  readonly isMock: boolean;
  processTryOn(input: HairTryOnInput): Promise<HairTryOnOutput>;
  validateInput(file: { size: number; mimeType: string }): { valid: boolean; error?: string };
}
```

### 3.3 Default Implementation: Mock/Demo Provider (`DemoHairTryOnProvider`)
- **Class Implementation**:
  - Implements `HairTryOnProvider`.
  - Generates a composite preview combining the user's portrait with a stylized hairstyle overlay or aesthetic filter.
  - Implements an artificial delay (1,500ms - 2,500ms) to simulate real-world AI processing experience and test frontend loading/progress UX states.
  - Returns `isMock: true` and includes a clear disclaimer in the output payload.
  - Watermarks the resulting image or returns metadata signaling the UI to display a distinctive "Chế độ mô phỏng trực quan (Demo Mode)" pill tag.

### 3.4 State Machine & Error Handling Matrix
The try-on component transitions through the following discrete states:

```
[IDLE] ──── (Select File) ───> [VALIDATING_FILE]
                                    │
                ┌───────────────────┴───────────────────┐
                ▼                                       ▼
        [INVALID_FILE]                           [PHOTO_READY]
   (Size > 5MB / Not image)                             │
                                                (Select Style/Color & Click "Thử ngay")
                                                        │
                                                        ▼
                                                  [UPLOADING]
                                                        │
                                                        ▼
                                                  [PROCESSING]
                                                        │
                ┌───────────────────┬───────────────────┴───────────────────┐
                ▼                   ▼                                       ▼
           [SUCCESS]             [TIMEOUT]                               [ERROR]
   (Render result slider)   (Exceeded 20s limit)                 (Network / 500 error)
```

- **Detailed State Behavior**:
  1. `IDLE`: Prompt zone empty, upload trigger active.
  2. `VALIDATING_FILE`: Verifying file size (< 5MB) and MIME type (`image/jpeg`, `image/png`, `image/webp`).
  3. `INVALID_FILE`: Displays specific error: "Ảnh vượt quá 5MB. Vui lòng chọn ảnh dung lượng nhỏ hơn" or "Định dạng không hỗ trợ. Vui lòng tải file JPG, PNG hoặc WEBP".
  4. `PHOTO_READY`: Portrait preview visible, hairstyle selector unlocked.
  5. `UPLOADING`: Progress bar active while sending multipart/form-data to `/api/try-on`.
  6. `PROCESSING`: Animated loading spinner, rotating tips, cancellation trigger available.
  7. `TIMEOUT`: If request exceeds 20 seconds, automatically aborts and displays: "Thời gian xử lý quá lâu. Vui lòng thử lại với ảnh nhỏ hơn hoặc kiểm tra kết nối mạng."
  8. `ERROR`: Server error (500) or processing failure caught gracefully, providing a retry button.
  9. `SUCCESS`: Displays side-by-side or slider comparison, download button, and "Đặt lịch kiểu này" CTA.

### 3.5 Privacy, Security & Server-side Safeguards
- **Server-Side File Inspection**:
  - `/api/try-on` inspects incoming buffer headers (magic bytes) to prevent executable upload or MIME spoofing.
  - Strict size limit: Max 5MB enforced at both client file selector and server route middleware.
- **Zero Permanent Storage Policy**:
  - In compliance with privacy standards and serverless statelessness, user personal portraits are **never** committed to local filesystem or permanent database storage.
  - Ephemeral buffers are held in memory during request processing and discarded immediately after returning the preview payload.
- **API Key & Secret Protection**:
  - Any 3rd party AI API keys (e.g., `REPLICATE_API_TOKEN`) reside solely in server environment variables.
  - The client UI only interacts with the internal `/api/try-on` endpoint; external credentials are never exposed in browser bundles (`NEXT_PUBLIC_` prohibited for secrets).

---

## 4. Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | R1: Home | Dynamic Hero Banner | Carousel showcasing marketing campaigns & salon motto with dynamic CTAs | CMS banner list, order, active status | Rendered responsive carousel banner | Fallback to default luxury salon banner if empty | ORIGINAL_REQUEST.md § R1 |
| 2 | R1: Home | Highlighted Categories | Quick access cards to Men, Women, Coloring, Care | User click on category card | Navigation to `/hairstyles` or `/colors` with query params | Default fallback routing | ORIGINAL_REQUEST.md § R1 |
| 3 | R1: Home | New Trends Showcase | Curated grid of trending hairstyles from CMS | `isTrending=true` query | Cards with trend badge, image, style name, price reference | Graceful empty list message | ORIGINAL_REQUEST.md § R1 |
| 4 | R1: Home | Favorite Styles Showcase | Highly-rated and most-favorited hairstyles | `isFavorite=true` query | Cards with favorite counter and quick try-on CTA | Graceful empty list message | ORIGINAL_REQUEST.md § R1 |
| 5 | R1: Home | Before/After Slider Section | Teaser comparison slider of a real customer makeover | Before & After image URLs, service info | Split slider interactive handle | Static side-by-side if slider fails | ORIGINAL_REQUEST.md § R1 |
| 6 | R1: Home | Stylist Team Showcase | Grid of professional hair stylists with avatars and specialties | Stylist profiles from DB | Stylist cards with experience, title, and "Đặt lịch" CTA | Fallback generic team description | ORIGINAL_REQUEST.md § R1 |
| 7 | R1: Home | Customer Reviews & Testimonials | Verified customer feedback with star ratings | Review list from DB | Testimonial carousel with star icons and quotes | Hidden section if 0 reviews | ORIGINAL_REQUEST.md § R1 |
| 8 | R1: Home | Active Promotions | Display of active discounts, packages, and seasonal offers | Active promotions from DB | Promotion banner cards with terms and validity | Hidden section if expired/empty | ORIGINAL_REQUEST.md § R1 |
| 9 | R1: Home | Hair Care Advice Highlights | Top 3 blog articles on haircare and trending topics | Recent articles from DB | Article cards with thumbnails and links to `/blog/[slug]` | Section omitted if no articles | ORIGINAL_REQUEST.md § R1 |
| 10 | R1: Home | Salon Contact & Google Map | Address, hotline, working hours, and embedded Google Map | CMS Site Settings | Contact widget with clickable `tel:`, `mailto:`, embedded iframe | Fallback address text if map fails | ORIGINAL_REQUEST.md § R1 |
| 11 | R1: Home | Persistent Floating CTA | Sticky bottom action bar for instant booking and hair try-on | User scroll event | Floating bar with "Đặt lịch" & "Thử tóc" buttons | Always visible on mobile/desktop | ORIGINAL_REQUEST.md § R1 |
| 12 | R1: Hairstyle | Multi-Criteria Filter Engine | Filter styles by Gender, Aesthetic Style, Hair Length, Face Shape, Hair Texture, Maintenance Effort | Filter checkbox / dropdown selections | Filtered hairstyle card grid; synced URL query params | "Không tìm thấy mẫu tóc phù hợp" with reset button | ORIGINAL_REQUEST.md § R1 |
| 13 | R1: Hairstyle | Free-Text Hairstyle Search | Search hairstyles by name, keywords, or tags | Text input query string | Matching hairstyle results | Empty state with suggested popular styles | ORIGINAL_REQUEST.md § R1 |
| 14 | R1: Hairstyle | Hairstyle Detail Multi-Angle View | Detailed page with front, side, and back photography | Slug parameter in URL | Multi-angle image carousel & gallery | 404 Not Found if slug invalid | ORIGINAL_REQUEST.md § R1 |
| 15 | R1: Hairstyle | Hairstyle Characteristics & Care Tips | Full breakdown of face shape fit, texture fit, and maintenance advice | Hairstyle metadata | Formatted specification badges and care instructions | Standard default care tips if empty | ORIGINAL_REQUEST.md § R1 |
| 16 | R1: Hairstyle | Related Services & Price Reference | Matching salon services with duration and reference pricing | Associated service IDs in DB | Related services card list with direct book CTA | Omitted if no related services | ORIGINAL_REQUEST.md § R1 |
| 17 | R1: Hairstyle | Hairstyle Favorite Toggle | Save style to user's favorites list | Click on heart/favorite button | LocalStorage / session update with animation | None; graceful local storage fallback | ORIGINAL_REQUEST.md § R1 |
| 18 | R1: Hairstyle | Hairstyle to Try-On CTA | Transfer selected hairstyle directly into try-on tool | Click on "Thử kiểu tóc này" | Redirects to `/try-on?styleId=[id]` with style pre-selected | Default try-on state if ID missing | ORIGINAL_REQUEST.md § R1 |
| 19 | R1: Hairstyle | Hairstyle to Booking CTA | Transfer selected hairstyle into online booking form | Click on "Đặt lịch với mẫu này" | Redirects to `/booking?styleId=[id]` with style pre-selected | Default booking state if ID missing | ORIGINAL_REQUEST.md § R1 |
| 20 | R1: Color | Color Swatch Tone & Group Filters | Filter color swatches by tone (warm/cool/neutral), group, brightness, bleach requirement | Filter selection buttons | Grid of reactive color swatches | Empty filter state with reset action | ORIGINAL_REQUEST.md § R1 |
| 21 | R1: Color | Color Swatch Detail Modal / Sheet | Detailed info on color code, skin tone fit, and maintenance tips | Click on color swatch card | Slide-over / modal with formula, skin advice, and fading notes | Modal closes safely on backdrop click | ORIGINAL_REQUEST.md § R1 |
| 22 | R1: Color | Color Swatch to Try-On CTA | Transfer selected color swatch into try-on tool | Click on "Thử màu này" | Redirects to `/try-on?colorId=[id]` | Opens try-on tool with color active | ORIGINAL_REQUEST.md § R1 |
| 23 | R1: Before/After | Dual-Image Comparison Slider | Interactive drag-and-touch 2-image reveal slider | Before & After image paths | Interactive canvas with draggable separator line | Fallback to side-by-side images | ORIGINAL_REQUEST.md § R1 |
| 24 | R1: Before/After | Service Filter for Before/After | Filter transformation stories by service type (Cắt, Uốn, Nhuộm, Phục hồi) | Category tab selection | Filtered gallery of transformation cards | Shows all cases if category empty | ORIGINAL_REQUEST.md § R1 |
| 25 | R1: Before/After | Transformation Story & Stylist Link | Details on initial hair condition, services done, stylist, and link to services | Before/After record from DB | Story card with stylist avatar and book combo button | Renders without stylist if unassigned | ORIGINAL_REQUEST.md § R1 |
| 26 | R1: Services | Categorized Services & Price Catalog | Categorized list (Cắt, Uốn, Nhuộm, Tẩy, Phục hồi, Combo) with pricing & duration | Service records grouped by Category | Accordion or tabbed service cards with duration & price ranges | Empty category notice | ORIGINAL_REQUEST.md § R1 |
| 27 | R1: Services | Pre- & Post-Care Service Guidelines | Pre-service requirements and post-treatment maintenance instructions | Service metadata fields | Expandable guideline callout box on each service item | Hidden if guideline fields null | ORIGINAL_REQUEST.md § R1 |
| 28 | R1: Services | Direct Service Booking CTA | Select service and jump directly into booking wizard | Click on "Đặt lịch dịch vụ này" | Redirects to `/booking?serviceId=[id]` with service pre-checked | Opens booking step 1 | ORIGINAL_REQUEST.md § R1 |
| 29 | R1: Booking | Multi-Step Wizard: Step 1 Services | Select one or multiple salon services with live price and duration tally | Checkbox selection of services | Updated subtotal price range and estimated total duration | Validation error if 0 services chosen | ORIGINAL_REQUEST.md § R1 |
| 30 | R1: Booking | Multi-Step Wizard: Step 2 Reference | Select reference hairstyle/color from library or upload custom photo | Style selection or image upload | Preview card of reference style (optional step) | Can be skipped safely | ORIGINAL_REQUEST.md § R1 |
| 31 | R1: Booking | Multi-Step Wizard: Step 3 Schedule | Choose preferred Stylist, booking date, and available time slot | Date picker, stylist picker, time slot buttons | Selected appointment slot; checks salon hours | Prevents past dates/closed hours | ORIGINAL_REQUEST.md § R1 |
| 32 | R1: Booking | Multi-Step Wizard: Step 4 Customer | Enter Full Name, Vietnamese Phone Number, Email, and Notes | Input text fields | Validated customer profile payload | Zod validation inline errors | ORIGINAL_REQUEST.md § R1 |
| 33 | R1: Booking | Multi-Step Wizard: Step 5 Review | Comprehensive summary review of booking details before final submit | Stored wizard state | Confirmation summary card with Submit button | Disables submit if prior steps invalid | ORIGINAL_REQUEST.md § R1 |
| 34 | R1: Booking | Anti-Duplicate Submission Lock | Prevent multiple rapid submissions of the same booking | Form submit event & idempotency token | Single submission processed; button shows loading state | Duplicate requests ignored / debounced | ORIGINAL_REQUEST.md § R1 |
| 35 | R1: Booking | Pending Confirmation Notice | Distinctive booking code & clear pending confirmation banner | Booking API success response | Success screen with Booking Code (`BK-...`) & pending notice | Error toast with retry if submission fails | ORIGINAL_REQUEST.md § R1 |
| 36 | R1: Blog | News & Care Advisory Articles List | Categorized articles list with search and pagination | Category filter, search term | Grid of article cards with thumbnail, excerpt, and read time | "Không tìm thấy bài viết nào" | ORIGINAL_REQUEST.md § R1 |
| 37 | R1: Blog | Article Detail View with Rich Content | Full article reading page with typography, TOC, and author bio | Slug parameter in URL | Rendered article layout with social sharing & related posts | 404 Not Found if article non-existent | ORIGINAL_REQUEST.md § R1 |
| 38 | R1: Blog | Dynamic SEO Metadata & Open Graph | Automated `<title>`, `<meta description>`, `og:image`, `og:type` generation | Article metadata in DB | Injected `<head>` metadata tags via Next.js `generateMetadata` | Fallback to default salon SEO tags | ORIGINAL_REQUEST.md § R1 |
| 39 | R2: Try-On | Portrait Photo Upload Canvas | Drag-and-drop or file upload of front-facing portrait photo | File selection (JPG, PNG, WEBP) | Canvas preview with facial guide overlay | Client validation error if >5MB or non-image | ORIGINAL_REQUEST.md § R2 |
| 40 | R2: Try-On | Hairstyle & Color Selector for Try-On | Interactive picker allowing user to browse and pick style and color | Click on style thumbnail or color swatch | Active style and color IDs passed into simulation state | Disabled if no photo loaded | ORIGINAL_REQUEST.md § R2 |
| 41 | R2: Try-On | Abstract `HairTryOnProvider` Interface | Decoupled provider interface supporting pluggable AI engines | `HairTryOnInput` buffer and parameters | `HairTryOnOutput` with image URL, mock flag, and timing | Returns structured error payload on failure | ORIGINAL_REQUEST.md § R2 |
| 42 | R2: Try-On | Default Demo Provider (MVP) | Simulated composite try-on engine for safe offline visual preview | Input photo buffer, hairstyleId, hairColorId | Composite visual simulation result with `isMock: true` | Fallback error if buffer invalid | ORIGINAL_REQUEST.md § R2 |
| 43 | R2: Try-On | Visual Demo Mode Badge & Watermark | Explicit indication distinguishing simulated preview from real AI | `isMock: true` flag in output | Prominent "Chế độ mô phỏng trực quan" UI pill & disclaimer | Always shown for demo provider | ORIGINAL_REQUEST.md § R2 |
| 44 | R2: Try-On | State Machine: Upload & Processing | Progressive status states (`IDLE`, `UPLOADING`, `PROCESSING`, `SUCCESS`) | User interactions and API promise status | Animated loading spinner and friendly step descriptions | Transitions to `ERROR` or `TIMEOUT` on failure | ORIGINAL_REQUEST.md § R2 |
| 45 | R2: Try-On | State Machine: Timeout Handling | 20-second threshold timer for simulation request | Request duration timer | "Thời gian xử lý quá lâu. Vui lòng thử lại" error screen | Aborts fetch via AbortController | ORIGINAL_REQUEST.md § R2 |
| 46 | R2: Try-On | Before/After Simulation Comparison | Slider or toggle comparing original portrait with simulated hair | Original image + simulated result image | Interactive comparison slider on success screen | Static side-by-side if slider unavailable | ORIGINAL_REQUEST.md § R2 |
| 47 | R2: Try-On | Simulation to Booking Direct Transfer | Carry tried-on style and color directly into booking flow | Click on "Đặt lịch kiểu tóc này" | Redirects to `/booking?styleId=...&colorId=...` | Pre-selects style & color in booking step 2 | ORIGINAL_REQUEST.md § R2 |
| 48 | R2: Try-On | Server-Side File & MIME Validation | Buffer magic-bytes check and strict size enforcement on `/api/try-on` | Multipart form data request | Validated buffer passed to provider | HTTP 400 Bad Request with specific error message | ORIGINAL_REQUEST.md § R2 |
| 49 | R2: Try-On | Ephemeral Zero-Storage Privacy Policy | Process portrait entirely in memory, no permanent disk/DB saving | Image buffer in serverless memory | Ephemeral base64 / signed URL returned, memory freed | Never written to serverless container filesystem | ORIGINAL_REQUEST.md § R2 |
| 50 | R2: Try-On | Server-Side Secret Key Shielding | Keep external AI API keys exclusively on server environment | Server-side env vars (`process.env.*`) | Secured backend proxy; zero client exposure | Fails silently on backend if env missing | ORIGINAL_REQUEST.md § R2 |

---

## 5. Edge Cases & Boundary Conditions

| # | Feature | Input / Condition | Observed / Specified Behavior |
|---|---------|-------------------|-------------------------------|
| 1 | Hairstyle Library Filter | User selects a combination of filters matching 0 hairstyles (e.g. Extra Long + Male + Coily + Low Effort) | Displays clean empty state: "Không tìm thấy mẫu tóc phù hợp với bộ lọc đã chọn", with a "Xóa bộ lọc" (Reset Filters) button. |
| 2 | Hairstyle Detail Navigation | User enters non-existent slug in URL `/hairstyles/invalid-slug-12345` | Next.js `notFound()` is triggered, rendering custom 404 page with navigation back to `/hairstyles`. |
| 3 | Booking Time Selection | User attempts to select a date in the past or a time slot earlier than current time on today | Past dates are disabled on calendar; time slots before `now() + 60min` are disabled. |
| 4 | Booking Salon Closed Hours | User selects time slot at 22:30 or 06:00 | Slot picker strictly limits options between 08:30 and 20:30 (salon business hours). |
| 5 | Booking Phone Number Validation | User enters invalid phone format (e.g., `12345`, `0123456789`, `abcdefghij`) | Zod schema rejects with message: "Số điện thoại không hợp lệ (Vui lòng nhập số điện thoại Việt Nam 10 chữ số bắt đầu bằng 03, 05, 07, 08, 09)". |
| 6 | Booking Rapid Double-Click | User rapidly clicks "Xác nhận đặt lịch" 5 times in succession | Button is immediately disabled (`isSubmitting: true`); idempotency key prevents duplicate database insertion. |
| 7 | Booking Empty Service | User attempts to navigate to Step 2 without selecting any service | Step navigation is blocked with alert: "Vui lòng chọn ít nhất 1 dịch vụ để tiếp tục". |
| 8 | Try-On File Size Exceeded | User attempts to upload a 12MB raw DSLR photo | Client-side reject before upload: "Dung lượng ảnh vượt quá 5MB. Vui lòng chọn ảnh dung lượng nhỏ hơn." |
| 9 | Try-On Invalid File Type | User uploads a `.pdf` or `.gif` file | File input filters accept types; server-side buffer validation rejects with HTTP 400: "Định dạng file không được hỗ trợ". |
| 10 | Try-On Server Timeout | Provider processing hangs or network delay exceeds 20 seconds | AbortSignal triggers timeout state; UI shows: "Hết thời gian xử lý. Vui lòng thử lại với ảnh dung lượng nhỏ hơn." |
| 11 | Try-On Missing Hairstyle | User clicks "Thử ngay" after uploading photo but without selecting a hairstyle | Validation tooltip points to hairstyle selector: "Vui lòng chọn một kiểu tóc để thử nghiệm." |
| 12 | Try-On Large Image Dimension | User uploads an image with dimensions 8000x8000 pixels | Pre-upload image normalization canvas scales down image to maximum 1920px on the longest side to ensure fast processing and avoid memory overflow. |
| 13 | Before/After Slider Touch Device | User drags comparison slider on mobile touch screen | Prevents page vertical scrolling while dragging the horizontal comparison slider (`touch-action: pan-y`). |
| 14 | Article Missing SEO Metadata | CMS article created without explicit meta description or OG image | Fallback mechanism automatically uses article excerpt for description and default salon luxury branding banner for `og:image`. |
| 15 | Color Swatch Bleach Warning | User selects a high-lift pastel/ash shade requiring Level 9+ bleaching | Swatch modal highlights cautionary warning: "Màu này yêu cầu tẩy tóc 2 lần. Cần kiểm tra độ khỏe của tóc trước khi thực hiện." |

---

## 6. Data Models & API Contracts (Public & Try-On)

### 6.1 Booking API (`POST /api/booking`)
**Request Payload Schema (Zod)**:
```typescript
import { z } from 'zod';

export const CreateBookingSchema = z.object({
  idempotencyKey: z.string().uuid(),
  serviceIds: z.array(z.string()).min(1, 'Vui lòng chọn ít nhất 1 dịch vụ'),
  hairstyleId: z.string().optional().nullable(),
  hairColorId: z.string().optional().nullable(),
  stylistId: z.string().optional().nullable(),
  bookingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày hẹn không hợp lệ (YYYY-MM-DD)'),
  bookingTime: z.string().regex(/^\d{2}:\d{2}$/, 'Giờ hẹn không hợp lệ (HH:mm)'),
  customerName: z.string().min(2, 'Họ và tên tối thiểu 2 ký tự').max(100),
  customerPhone: z.string().regex(/^(03|05|07|08|09)\d{8}$/, 'Số điện thoại không đúng định dạng'),
  customerEmail: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
  notes: z.string().max(500, 'Ghi chú tối đa 500 ký tự').optional(),
});
```

**Response Payload (JSON)**:
```json
{
  "success": true,
  "data": {
    "bookingCode": "BK-20261019-8921",
    "customerName": "Nguyễn Văn A",
    "customerPhone": "0987654321",
    "bookingDate": "2026-10-20",
    "bookingTime": "14:00",
    "status": "PENDING",
    "services": [
      { "id": "srv-1", "name": "Cắt tạo kiểu Layer Nam", "priceMin": 150000, "priceMax": 200000 }
    ],
    "message": "Yêu cầu đặt lịch đã được tiếp nhận và đang chờ Salon xác nhận."
  }
}
```

### 6.2 Hair Try-On API (`POST /api/try-on`)
**Request Payload (Multipart/form-data)**:
- `image`: File (Binary portrait photo, max 5MB, JPG/PNG/WEBP)
- `hairstyleId`: String (ID of selected hairstyle)
- `hairColorId`: String (Optional, ID of selected hair color)

**Response Payload (JSON)**:
```json
{
  "success": true,
  "data": {
    "resultImageUrl": "data:image/webp;base64,...",
    "providerName": "DemoHairTryOnProvider",
    "isMock": true,
    "processingTimeMs": 1850,
    "disclaimer": "Ảnh mô phỏng trực quan minh họa - Vui lòng tham khảo ý kiến stylist thực tế.",
    "metadata": {
      "faceDetected": true,
      "styleApplied": "Side Part 7/3 Hàn Quốc",
      "colorApplied": "Nâu Lạnh Ánh Khói"
    }
  }
}
```

---

## 7. Verification & Acceptance Criteria Matrix

| Check | Criterion | Verification Command / Method | Expected Result |
|-------|-----------|-------------------------------|-----------------|
| AC-1 | Strict TypeScript Compliance | `npx tsc --noEmit` | Clean exit code 0, no type errors in R1/R2 components |
| AC-2 | App Router Production Build | `npm run build` | Clean production build of all public routes |
| AC-3 | Multi-step Booking Form Validation | Test with invalid phone and empty services | Form prevents submit, shows specific Vietnamese validation errors |
| AC-4 | Anti-duplicate Protection | Submit booking twice rapidly with same idempotency key | Only 1 booking created in PostgreSQL; user receives success screen |
| AC-5 | Try-On Provider Decoupling | Inspect `services/try-on/provider.ts` | Clean interface implementation; zero AI credentials on client |
| AC-6 | Try-On State Machine | Exercise states: upload, processing, timeout, success, error | UI reflects accurate visual feedback for each state |
| AC-7 | Responsive & Mobile Luxury UI | Inspect Tailwind & shadcn/ui components on mobile viewport | Touch-friendly controls, fluid typography, no overflow |
| AC-8 | SEO & Open Graph | Inspect HTML source of `/blog/[slug]` | Proper `<title>`, `<meta description>`, and `<meta property="og:...">` tags |

---
*Report completed and verified against ORIGINAL_REQUEST.md (§ R1, R2, R4).*
