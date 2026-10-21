# Architectural Blueprint & Implementation Specification: Milestone 4 (Explorer 2)
**Scope:** Hairstyle Exploration Library, Hairstyle Detail, Hair Color Swatches & Consultation, Before/After Interactive Showcase  
**Author:** M4 Explorer 2 (Hairstyles, Colors & Before-After)  
**Date:** 2026-10-19  
**Status:** READY FOR IMPLEMENTATION

---

## Executive Summary
This blueprint provides the complete architectural, data contract, visual, and behavioral specification for the four core aesthetic and consultative discovery pages of **Lumière Hair Atelier** in Milestone 4:
1. **Hairstyle Exploration Library (`app/(public)/hairstyles/page.tsx`)**: 6-criteria multi-filter catalog fully synchronized with URL search params, debounced instant search, active filter pills, favorite persistence, and direct Try-On / Booking CTAs.
2. **Hairstyle Detail Page (`app/(public)/hairstyles/[slug]/page.tsx`)**: Multi-angle image gallery with lightbox, face-shape suitability radar, maintenance & styling advice, suitable hair color pairings, associated services with price tiers, embedded before/after showcases, and sticky mobile booking bar.
3. **Hair Color Swatches & Consultation (`app/(public)/colors/page.tsx`)**: Categorized swatch catalog with tone, group, and bleach filters, real HEX swatches with hair-sheen gradients, 10-level brightness indicator, interactive skin tone suitability matrix, and color fading aftercare advice.
4. **Before/After Interactive Showcase (`app/(public)/before-after/page.tsx`)**: Interactive split-image comparison slider (touch & mouse drag divider) displaying real client transformations, filterable by service and gender, linked directly to stylists, services, and booking.
5. **Public API Endpoints (`app/api/public/*`)**: High-performance cached endpoints for hairstyles, colors, and before-after data to satisfy both SSR and client-side interactions.

---

## 1. Domain Models & Relational Contracts

The implementation builds upon the verified Prisma models defined in `prisma/schema.prisma` and fallback mechanisms in `lib/memory-store.ts`.

### 1.1 Hairstyle Catalog
- **Entity**: `Hairstyle`
- **Fields**:
  - `id`: UUID (String)
  - `title` / `name`: String (e.g., "Textured Crop Hàn Quốc")
  - `slug`: String unique (e.g., "textured-crop-han-quoc")
  - `summary`: String (max 500 chars)
  - `description`: Text
  - `coverImageUrl`: String (URL)
  - `galleryImages`: String[] (Array of angle photos)
  - `gender`: `GenderTarget` (`MALE` | `FEMALE` | `UNISEX`)
  - `length`: `HairLength` (`VERY_SHORT` | `SHORT` | `MEDIUM` | `LONG` | `EXTRA_LONG`)
  - `suitableFaces`: `FaceShape[]` (`OVAL`, `ROUND`, `SQUARE`, `HEART`, `DIAMOND`, `OBLONG`, `ALL`)
  - `suitableTexture`: `HairTexture[]` (`STRAIGHT`, `WAVY`, `CURLY`, `COILY`, `FINE`, `THICK`)
  - `careEffort`: `CareEffort` (`LOW` | `MEDIUM` | `HIGH`)
  - `styleVibe`: `StyleVibe` (`KOREAN` | `JAPANESE` | `CLASSIC` | `MINIMALIST` | `STREETWEAR` | `BUSINESS` | `AVANT_GARDE`)
  - `careAdvice`: Text (e.g., "Sấy khô tự nhiên...")
  - `stylingTips`: Text (e.g., "Sử dụng sáp mờ matte clay...")
  - `priceRefMin` / `priceRefMax`: Decimal (e.g., 250000, 350000)
  - `isTrending`: Boolean
  - `isFeatured`: Boolean
  - `isActive`: Boolean
  - `viewCount`: Integer
  - `categoryId`: String (relation to `Category`)
  - `services`: Relation M:N to `Service`
  - `beforeAfters`: Relation to `BeforeAfter`

### 1.2 Hair Color Swatches
- **Entity**: `HairColor`
- **Fields**:
  - `id`: UUID (String)
  - `name`: String (e.g., "Nâu Tây Lạnh (Cold Mocha)")
  - `code`: String unique (e.g., "MOCHA-6.1")
  - `hexColor` / `hexCode`: String (e.g., "#59493E")
  - `secondaryHex`: String optional (e.g., "#7C6A5D" for undertone/sheen)
  - `tone`: `ColorTone` (`WARM` | `COOL` | `NEUTRAL`)
  - `group`: `ColorGroup` (`BROWN`, `BLONDE`, `RED_BURGUNDY`, `ASH_SMOKY`, `PASTEL`, `BLACK_DARK`, `FASHION_VIBRANT`)
  - `brightnessLevel`: Int (Scale 1 - 10)
  - `requiresBleach`: Boolean
  - `bleachRounds`: Int (0, 1, 2, 3)
  - `suitableSkinTones` / `skinSuitability`: String[] (e.g., `["Da sáng", "Da trung tính", "Da ngăm"]`)
  - `maintenanceLevel`: `CareEffort` (`LOW` | `MEDIUM` | `HIGH`)
  - `colorFadingAdvice` / `maintenanceAdvice`: Text
  - `swatchImageUrl`: String optional
  - `samplePortraitUrl`: String optional
  - `isTrending`: Boolean
  - `isActive`: Boolean
  - `displayOrder`: Int

### 1.3 Before / After Showcase
- **Entity**: `BeforeAfter`
- **Fields**:
  - `id`: UUID (String)
  - `title`: String (e.g., "Lột xác mái tóc xơ rối thành Two-Block Hàn Quốc lãng tử")
  - `description`: Text
  - `beforeImageUrl`: String (URL)
  - `afterImageUrl`: String (URL)
  - `customerGender`: `GenderTarget` (`MALE` | `FEMALE` | `UNISEX`)
  - `serviceId`: String optional (relation to `Service`)
  - `hairstyleId`: String optional (relation to `Hairstyle`)
  - `stylistId`: String optional (relation to `User` where `isStylist = true`)
  - `isFeatured`: Boolean
  - `displayOrder`: Int

---

## 2. Component Hierarchy & File Structure

```
app/
├── (public)/
│   ├── hairstyles/
│   │   ├── page.tsx                           # Server Component (data fetch, SEO, searchParams)
│   │   └── [slug]/
│   │       └── page.tsx                       # Server Component (detail fetch, dynamic SEO, viewCount)
│   ├── colors/
│   │   └── page.tsx                           # Server Component (colors & tone fetch, skin guide)
│   └── before-after/
│       └── page.tsx                           # Server Component (transformations & service tags)
├── api/
│   └── public/
│       ├── hairstyles/
│       │   ├── route.ts                       # GET /api/public/hairstyles (6-criteria filtering)
│       │   └── [slug]/
│       │       └── route.ts                   # GET /api/public/hairstyles/:slug
│       ├── colors/
│       │   └── route.ts                       # GET /api/public/colors
│       └── before-after/
│           └── route.ts                       # GET /api/public/before-after
components/
└── public/
    ├── hairstyles/
    │   ├── HairstyleCatalogClient.tsx         # Main client coordinator, URL sync, sort, view
    │   ├── HairstyleFilterSidebar.tsx         # 6-criteria desktop accordion & mobile drawer
    │   ├── HairstyleCard.tsx                  # Luxury portrait card with price, badges & CTAs
    │   ├── HairstyleSearchBar.tsx             # Debounced search input with shortcut '/'
    │   ├── ActiveFilterPills.tsx              # Dismissible filter pills with Reset button
    │   ├── HairstyleDetailGallery.tsx         # Multi-angle photo viewer with zoom lightbox
    │   ├── HairstyleSpecsRadar.tsx            # Face shapes, texture & care level cards
    │   ├── HairstyleCareTips.tsx              # Styling tips & aftercare routines
    │   ├── HairstyleColorPairings.tsx         # Recommended hair colors for this cut
    │   ├── HairstyleServicePricing.tsx        # Linked services with duration & price tiers
    │   └── HairstyleStickyBar.tsx             # Mobile floating bottom CTA bar
    ├── colors/
    │   ├── ColorConsultationClient.tsx        # Main client coordinator for swatches & tones
    │   ├── ColorSwatchCard.tsx                # Realistic HEX hair swatch with metallic sheen
    │   ├── ColorToneFilterTabs.tsx            # Warm / Cool / Neutral and Group selector
    │   ├── BleachFilterToggle.tsx             # No bleach vs Bleach required pill toggles
    │   ├── SkinToneGuideModal.tsx             # Consultative undertone test & matching guide
    │   └── ColorFadingAdviceDrawer.tsx        # Color retention tips & Olaplex care
    └── before-after/
        ├── BeforeAfterShowcaseClient.tsx      # Main client coordinator for transformation gallery
        ├── BeforeAfterSlider.tsx              # Interactive drag-handle split comparison slider
        ├── BeforeAfterCard.tsx                # Card wrapping slider, stylist info & direct booking
        ├── BeforeAfterFilterTabs.tsx          # Service category filter (Cut, Perm, Bleach, Dye)
        └── ShowcaseTrustStats.tsx             # Social proof stats (10,000+ satisfied clients)
```

---

## 3. Feature 1: Hairstyle Exploration Library (`app/(public)/hairstyles/page.tsx`)

### 3.1 6-Criteria Multi-Filter Specification
All filter dimensions are bidirectionally synchronized with the browser URL search params:

| # | Query Param | Valid Values | UI Control | Matching Logic |
|---|-------------|--------------|------------|----------------|
| 1 | `gender` | `ALL`, `MALE`, `FEMALE`, `UNISEX` | Radio pill buttons with icons | Exact match on `gender` (or `UNISEX` matches both) |
| 2 | `length` | `ALL`, `SHORT`, `MEDIUM`, `LONG` | Horizontal pill buttons | `SHORT` matches `VERY_SHORT` & `SHORT`; `MEDIUM` matches `MEDIUM`; `LONG` matches `LONG` & `EXTRA_LONG` |
| 3 | `faceShape` | `ALL`, `OVAL`, `ROUND`, `SQUARE`, `HEART`, `DIAMOND`, `OBLONG` | Pill list with face outline icons | `suitableFaces` array contains value OR `ALL` |
| 4 | `texture` | `ALL`, `STRAIGHT`, `WAVY`, `CURLY`, `COILY`, `FINE`, `THICK` | Multi-select chips with wave icons | `suitableTexture` array contains value |
| 5 | `careLevel` / `careEffort` | `ALL`, `LOW`, `MEDIUM`, `HIGH` | Effort meter chips (Dễ, Vừa, Cầu kỳ) | Match `careEffort` (`LOW`, `MEDIUM`, `HIGH`) |
| 6 | `category` / `style` | `ALL`, `KOREAN`, `JAPANESE`, `CLASSIC`, `MINIMALIST`, `STREETWEAR`, `BUSINESS`, `AVANT_GARDE` or Category slug | Dropdown or tab pills | Match `styleVibe` OR `category.slug` |

### 3.2 URL Synchronization Engine
```typescript
// Pattern for URL synchronization in HairstyleCatalogClient
const updateFilterParam = (key: string, value: string | null) => {
  const params = new URLSearchParams(searchParams.toString());
  if (!value || value === 'ALL') {
    params.delete(key);
  } else {
    params.set(key, value);
  }
  // Reset pagination to page 1 on filter modification
  params.delete('page');
  
  const queryString = params.toString();
  const newUrl = queryString ? `/hairstyles?${queryString}` : '/hairstyles';
  
  // Shallow router push without full-page remount
  router.push(newUrl, { scroll: false });
};
```

### 3.3 Search & Sort Functionality
- **Instant Search**: Debounced at 300ms. Queries title, summary, description, and tags. Clear button `X` and keyboard shortcut `/` to focus.
- **Sorting Options**:
  - `newest`: Mới nhất (default, `createdAt DESC`)
  - `popular`: Xem nhiều nhất (`viewCount DESC`)
  - `price_asc`: Giá từ thấp đến cao (`priceRefMin ASC`)
  - `price_desc`: Giá từ cao đến thấp (`priceRefMin DESC`)
  - `trending`: Đang thịnh hành (`isTrending DESC`)

### 3.4 Hairstyle Card Design & Actions
- **Visual Design**: Dark charcoal card (`bg-salon-charcoal/80 border border-salon-gold/20 hover:border-salon-gold/60 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-gold-glow hover:-translate-y-1`).
- **Aspect Ratio**: 4:5 luxury portrait photo with subtle zoom animation on hover.
- **Top Badges**:
  - `Trending`: Gold flame pill badge (`bg-salon-gold/20 text-salon-gold-light border border-salon-gold/40`).
  - `Gender`: Nam / Nữ / Unisex pill.
  - `Care`: Dễ chăm sóc / Trung bình / Cầu kỳ.
- **Favorite Button**:
  - Located at top-right corner over image.
  - State saved to `localStorage.getItem('lumiere_favorites')`.
  - Heart icon pulses with gold glow when active.
- **Price Indicator**: `Từ 250.000 ₫` using `formatVND(priceRefMin)`.
- **CTAs**:
  - Card click -> `/hairstyles/${slug}`
  - "Thử tóc" button -> `/try-on?hairstyleId=${id}`
  - "Đặt lịch" button -> `/booking?hairstyleId=${id}`

---

## 4. Feature 2: Hairstyle Detail Page (`app/(public)/hairstyles/[slug]/page.tsx`)

### 4.1 Server Component Fetching & Metadata
- **Route**: `app/(public)/hairstyles/[slug]/page.tsx`
- **Dynamic SEO**:
  ```typescript
  export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
    const hairstyle = await getHairstyleBySlug(params.slug);
    if (!hairstyle) return { title: 'Kiểu tóc không tồn tại | Lumière Hair Atelier' };
    return {
      title: `${hairstyle.title} — Kiểu Tóc Thịnh Hành | Lumière Hair Atelier`,
      description: hairstyle.summary || hairstyle.description.slice(0, 160),
      openGraph: {
        title: hairstyle.title,
        description: hairstyle.summary || hairstyle.description.slice(0, 160),
        images: [{ url: hairstyle.coverImageUrl }],
      },
    };
  }
  ```
- **Atomically Increment View Count**:
  `prisma.hairstyle.update({ where: { slug }, data: { viewCount: { increment: 1 } } })` (with safe catch if DB unavailable).

### 4.2 Multi-Angle Image Gallery (`HairstyleDetailGallery.tsx`)
- Displays `coverImageUrl` and all images in `galleryImages`.
- **Main View**: High-resolution image (aspect ratio 4:5 or 3:4) with subtle radial vignette.
- **Thumbnails Strip**: Mini thumbnails with active gold border highlight.
- **Angle Badges**: Optional angle tags ("Góc chính diện", "Góc nghiêng 45°", "Mặt sau").
- **Lightbox**: Click to expand into full-screen modal with left/right keyboard navigation.

### 4.3 Style Suitability & Specification Radar
Visual specification grid:
- **Dáng khuôn mặt phù hợp**: Cards for each face shape (`OVAL`, `ROUND`, `HEART`, etc.) showing why this cut balances facial features (e.g., "Mặt tròn: Mái bay và lọn tỉa layer giúp thu nhỏ bề ngang, kéo dài tỉ lệ mặt").
- **Chất tóc tối ưu**: Icons for Thẳng mượt, Gợn sóng, Dày, Mảnh.
- **Mức độ chăm sóc**: 3-tier gauge with description of home styling requirements.
- **Độ dài tóc**: Chiều dài chuẩn (Ngang cằm, Ngang vai, Qua lưng).

### 4.4 Care Routine & Styling Guidelines
- **Hướng dẫn tạo kiểu tại nhà (`stylingTips`)**:
  - Bước 1: Sấy ngược chiều chân tóc tạo độ bồng.
  - Bước 2: Dùng sáp mờ matte clay hoặc lược tròn cố định phom.
  - Bước 3: Xịt giữ nếp nhẹ.
- **Lưu ý bảo dưỡng (`careAdvice`)**:
  - Tần suất cắt tỉa: Duy trì phom chuẩn sau 3-4 tuần đối với tóc nam, 6-8 tuần đối với tóc nữ.
  - Sản phẩm chuyên dụng: Dầu gội cân bằng pH, tinh dầu Argan dưỡng ngọn.

### 4.5 Suitable Hair Colors & Linked Services
- **Bảng màu nhuộm tương thích (`HairstyleColorPairings.tsx`)**:
  - Displays 3-4 recommended hair colors that enhance the texture of this specific haircut (e.g., Balayage Khói cho Layer dài, Nâu Tây Lạnh cho Two-Block).
  - Quick action: "Thử màu này với kiểu tóc" -> `/try-on?hairstyleId=${id}&hairColorId=${colorId}`.
- **Dịch vụ đi kèm & Bảng giá (`HairstyleServicePricing.tsx`)**:
  - Displays services associated via the `services` relation (e.g. Cắt tạo kiểu Master 200.000₫ - 350.000₫, Uốn máy setting 900.000₫ - 1.600.000₫).
  - Shows estimated duration (e.g. 45 phút, 120 phút).
  - Quick "Đặt dịch vụ này" button with pre-selected query param `?serviceId=${service.id}&hairstyleId=${hairstyle.id}`.

### 4.6 Floating Mobile Sticky Bar (`HairstyleStickyBar.tsx`)
- On screens `< 768px`, sticks to bottom of viewport with blur glass background (`glass-luxury`).
- Displays price starting point (`Từ 350.000 ₫`).
- Direct action buttons:
  - "Thử tóc" button (Icon + short label).
  - "Đặt lịch ngay" button (Gold glowing button leading to `/booking?hairstyleId=${id}`).

---

## 5. Feature 3: Hair Color Swatches & Consultation (`app/(public)/colors/page.tsx`)

### 5.1 Color Swatch Data Architecture
Colors are queried and categorized into:
- **Tones**: `WARM` (Tông Ấm), `COOL` (Tông Lạnh), `NEUTRAL` (Tông Trung Tính).
- **Color Groups**:
  - `BROWN`: Nâu Tây Lạnh, Nâu Hạt Dẻ, Nâu Caramel, Nâu Socola.
  - `ASH_SMOKY`: Xám Khói Ánh Bạc, Nâu Rêu Khói, Nâu Trà Sữa Khói.
  - `BLONDE`: Vàng Mật Ong, Bạch Kim Nordic.
  - `RED_BURGUNDY`: Đỏ Rượu Cherry, Đỏ Nâu Berry.
  - `PASTEL`: Hồng Pastel Ánh Khói, Tím Khói Lavender.
  - `BLACK_DARK`: Đen Ánh Xanh Sapphire, Đen Than Chì.
  - `FASHION_VIBRANT`: Cam Đồng San Hô, Xanh Rêu Neon.
- **Bleach Requirement Filter**:
  - Tất cả (`ALL`)
  - Không cần tẩy tóc (`NO_BLEACH`, 0 lần tẩy - giữ tóc bóng khỏe nguyên bản)
  - Cần nâng sáng / tẩy tóc (`REQUIRES_BLEACH`, 1-3 lần tẩy Olaplex)

### 5.2 Interactive Swatch Card Design (`ColorSwatchCard.tsx`)
- **Realistic Hair Color Swatch Preview**:
  - Circular / rounded pill preview (diameter 80px) with multi-stop linear gradient:
    `background: linear-gradient(135deg, ${hexColor} 0%, ${secondaryHex || hexColor} 50%, ${hexColor} 100%)`.
  - Realistic hair fiber sheen overlay: subtle glossy radial sheen highlighting depth and tone reflection.
- **Tone Temperature Dot**:
  - Warm: Amber/Orange dot with pulse.
  - Cool: Cyan/Silver icy dot with pulse.
  - Neutral: Cream/Taupe balanced dot.
- **Swatch Code Badge**: Monospace luxury badge (e.g. `MOCHA-6.1`, `SILVER-9.11`).
- **Brightness Level Meter (Độ sáng)**:
  - Visual 10-segment level indicator (Scale 1-10: 1-3 = Trầm/Đen, 4-6 = Vừa phải/Tự nhiên, 7-10 = Sáng/Bạch kim).
- **Bleach Requirement Badge**:
  - `Không cần tẩy`: Emerald green badge with shield icon.
  - `Cần tẩy 1-2 lần`: Amber badge with droplet icon and Olaplex protective assurance.
- **Suitable Skin Tones (Tông da phù hợp)**:
  - Pills: `Da sáng`, `Da trung tính`, `Da ngăm bánh mật`.
- **Lưu ý giữ màu & Phai màu (`colorFadingAdvice`)**:
  - Expandable tip box: e.g. "Sau 4 tuần phai sang nâu hạt dẻ sáng, khuyến nghị gội dầu gội tím 2 lần/tuần để khử ánh vàng".
- **Actions**:
  - "Thử màu này trên ảnh" -> `/try-on?hairColorId=${id}`.
  - "Đặt lịch nhuộm màu này" -> `/booking?hairColorId=${id}`.

### 5.3 Skin Tone Consultation Guide (`SkinToneGuideSection.tsx`)
A dedicated consultative interactive section on `/colors`:
1. **Interactive Undertone Quiz**:
   - Gợi ý cách nhận biết sắc tố da (Cool / Warm / Neutral) qua tĩnh mạch cổ tay và trang sức.
2. **Skin Tone Matching Table**:
   - **Da trắng sáng (Fair/Cool)**: Tôn vinh vẻ đẹp với Xám Khói, Hồng Pastel, Bạch Kim, Đỏ Cherry.
   - **Da trung tính (Medium/Neutral)**: Hợp nhất với Nâu Tây Lạnh, Trà Sữa Caramel, Nâu Rêu Khói.
   - **Da ngăm / Bánh mật (Tan/Warm)**: Sang trọng quý phái với Nâu Hạt Dẻ, Đỏ Rượu Burgundy, Đen Ánh Xanh Sapphire.
3. **Commitment to Hair Health**:
   - Cam kết 100% thuốc nhuộm Organic không Amoniac, tích hợp tinh chất Olaplex No.1 bảo vệ liên kết keratin.

---

## 6. Feature 4: Before/After Interactive Showcase (`app/(public)/before-after/page.tsx`)

### 6.1 Split-Image Comparison Slider Component (`BeforeAfterSlider.tsx`)
A production-ready, performant touch & mouse interactive slider:

#### Component Specification
```typescript
interface BeforeAfterSliderProps {
  beforeImageUrl: string;
  afterImageUrl: string;
  beforeAlt?: string;
  afterAlt?: string;
  initialPosition?: number; // Default 50
  className?: string;
}
```

#### Behavioral Mechanics
1. **Container**:
   - Relative position, `overflow-hidden`, aspect-ratio 4:5 or 16:9, rounded corners (`rounded-2xl`).
   - `user-select-none` to prevent image dragging ghosting.
2. **Underlying Image (After)**:
   - Full width and height of container.
   - Badge at top-right: `SAU KHI LÀM` (After) in translucent dark pill with gold text.
3. **Overlaid Image (Before)**:
   - Absolute position, top 0, left 0, full height.
   - Clipped dynamically using CSS `clip-path: polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)`.
   - Badge at top-left: `TRƯỚC KHI LÀM` (Before) in translucent dark pill with silver text.
4. **Dividing Slider Handle**:
   - Gold vertical line (`width: 2px`, `bg-salon-gold`, `shadow-gold-glow`).
   - Center circular knob (`w-10 h-10 rounded-full bg-salon-noir border-2 border-salon-gold flex items-center justify-center cursor-ew-resize shadow-luxury-dark`).
   - Icons: `<ChevronLeft className="w-3.5 h-3.5 text-salon-gold" /> <ChevronRight className="w-3.5 h-3.5 text-salon-gold" />`.
5. **Event Handling**:
   - Supports Mouse Events (`onMouseDown`, `onMouseMove`, `onMouseUp`).
   - Supports Touch Events (`onTouchStart`, `onTouchMove`, `onTouchEnd`) with `passive: true`.
   - Percentage calculated via `(clientX - containerRect.left) / containerRect.width * 100`, clamped between `0` and `100`.
   - Keyboard accessible: Left / Right arrow keys increment/decrement position by 5%.

### 6.2 Showcase Card Information & Direct Booking (`BeforeAfterCard.tsx`)
- Below the slider:
  - **Tiêu đề ca biến hóa**: e.g., "Lột xác mái tóc xơ rối thành Two-Block Hàn Quốc lãng tử".
  - **Mô tả tình trạng & giải pháp (`description`)**: Nêu rõ tình trạng ban đầu (tóc khô xơ, hư tổn, form không phù hợp) và kỹ thuật chuyên môn stylist áp dụng.
  - **Stylist Profile Chip**:
    - Avatar, Tên (Master Kenji Đặng / Master Alex Trần), Danh hiệu chuyên gia.
  - **Service & Style Badges**:
    - Tag dịch vụ liên kết (`service.title`) -> click dẫn đến `/services`.
    - Tag kiểu tóc liên kết (`hairstyle.title`) -> click dẫn đến `/hairstyles/${hairstyle.slug}`.
  - **Direct Booking CTA**:
    - Button "Đặt lịch biến hóa diện mạo" -> `/booking?serviceId=${serviceId}&hairstyleId=${hairstyleId}&stylistId=${stylistId}`.

### 6.3 Filtering & Categorization
- **Service Tabs**:
  - `ALL`: Tất cả biến hóa
  - `CUT`: Cắt tạo kiểu Master
  - `PERM`: Uốn sóng & Nâng phồng
  - `DYE`: Nhuộm màu thời trang
  - `BLEACH`: Tẩy tóc nâng sáng Olaplex
  - `TREATMENT`: Phục hồi phủ lụa Keratin
- **Gender Filter**: Tất cả / Nữ / Nam.

---

## 7. Public API Endpoints Specification

To support client-side filtering, fast revalidation, and automated E2E tests:

### 7.1 `GET /api/public/hairstyles`
- **Query Parameters**:
  - `gender`: Filter by gender (`MALE`, `FEMALE`, `UNISEX`)
  - `length`: Filter by length (`SHORT`, `MEDIUM`, `LONG`, etc.)
  - `faceShape`: Filter by face shape (`OVAL`, `ROUND`, etc.)
  - `texture`: Filter by texture (`STRAIGHT`, `WAVY`, etc.)
  - `careLevel` / `careEffort`: Filter by care effort (`LOW`, `MEDIUM`, `HIGH`)
  - `style` / `styleVibe`: Filter by style vibe (`KOREAN`, `JAPANESE`, etc.)
  - `categoryId`: Filter by category UUID
  - `search`: Full text search on title, summary, description
  - `sort`: `newest`, `popular`, `price_asc`, `price_desc`, `trending`
  - `page`: Page number (default: 1)
  - `pageSize` / `limit`: Page size (default: 20)
- **Response Shape**:
  ```json
  {
    "items": [
      {
        "id": "hs-uuid",
        "name": "Textured Crop Hàn Quốc",
        "title": "Textured Crop Hàn Quốc",
        "slug": "textured-crop-han-quoc",
        "summary": "Kiểu tóc ngắn năng động...",
        "description": "...",
        "coverImageUrl": "https://...",
        "galleryImages": ["https://..."],
        "gender": "MALE",
        "length": "SHORT",
        "style": "KOREAN",
        "faceShape": "OVAL",
        "suitableFaces": ["OVAL", "ROUND", "HEART"],
        "texture": "STRAIGHT",
        "suitableTexture": ["STRAIGHT", "THICK"],
        "careLevel": "LOW",
        "careEffort": "LOW",
        "price": 180000,
        "priceRefMin": 180000,
        "priceRefMax": 250000,
        "careAdvice": "Chỉ cần sấy khô tự nhiên...",
        "stylingTips": "...",
        "features": ["..."],
        "isTrending": true,
        "isFeatured": true,
        "viewCount": 128
      }
    ],
    "total": 13,
    "page": 1,
    "pageSize": 20
  }
  ```

### 7.2 `GET /api/public/hairstyles/[slug]`
- Returns a single serialized hairstyle matching `slug` or `id`.
- Returns HTTP 404 `{ "error": "Hairstyle not found" }` if non-existent (matches `TC1.3`).

### 7.3 `GET /api/public/colors`
- Returns:
  ```json
  {
    "colors": [
      {
        "id": "col-uuid",
        "name": "Nâu Tây Lạnh (Cold Mocha)",
        "code": "MOCHA-6.1",
        "hexColor": "#59493E",
        "secondaryHex": "#7C6A5D",
        "tone": "COOL",
        "group": "BROWN",
        "brightnessLevel": 6,
        "requiresBleach": false,
        "bleachRounds": 0,
        "suitableSkinTones": ["Da sáng", "Da trung tính", "Da ngăm"],
        "maintenanceLevel": "LOW",
        "maintenanceAdvice": "Màu phai chậm ra tông nâu trầm tự nhiên...",
        "isTrending": true
      }
    ],
    "tones": ["WARM", "COOL", "NEUTRAL"]
  }
  ```

### 7.4 `GET /api/public/before-after`
- Returns an array of serialized `BeforeAfter` showcases including relations (`service`, `hairstyle`, `stylist`).

---

## 8. Integration & Cross-Subsystem Synergy

1. **Synergy with M4 Explorer 1 (Layout & Home)**:
   - Home page mini Before/After section reuses `<BeforeAfterSlider />`.
   - Home page trending hairstyles carousel reuses `<HairstyleCard />`.
   - Navigation links in header and mobile drawer link directly to `/hairstyles`, `/colors`, and `/before-after`.
2. **Synergy with M4 Explorer 3 (Booking & Services)**:
   - Hairstyle detail and Color swatch CTAs pass `hairstyleId` and `hairColorId` as URL query params to `/booking` (`/booking?hairstyleId=${id}`). Explorer 3's Multi-Step Booking Wizard reads these query params to pre-select the desired style and color in Step 2!
   - Before/After CTA passes `serviceId`, `hairstyleId`, and `stylistId` to `/booking`. Explorer 3 pre-selects the service in Step 1, style in Step 2, and stylist in Step 3!
3. **Synergy with M5 Hair Try-On Subsystem**:
   - "Thử tóc" buttons link to `/try-on?hairstyleId=${id}` or `/try-on?hairColorId=${id}`.
   - The Try-On tool reads these query params to pre-load the selected hairstyle mesh or color tone overlay.

---

## 9. Verification & Quality Checklist

| Test Case | Feature Under Verification | Target Verification Action |
|-----------|----------------------------|----------------------------|
| **TC1.2** | Hairstyle Library Filtering | `GET /api/public/hairstyles?gender=FEMALE&length=SHORT` returns 1 item (`french-bob-tu-nhien`); `style=KOREAN&faceShape=ROUND` returns 1 item (`korean-wolf-cut-textured`). |
| **TC1.3** | Hairstyle Detail View | `GET /api/public/hairstyles/korean-wolf-cut-textured` returns HTTP 200 with name, price, careAdvice, features; invalid slug returns HTTP 404. |
| **TC1.4** | Color Swatches Catalog | `GET /api/public/colors` returns colors array with `ashBlonde` (requiresBleach=true, tone=COOL) and `chocBrown` (requiresBleach=false, tone=WARM). |
| **TC3.1** | Booking + Style/Color Combo | Client initiates booking from style card -> `/booking?hairstyleId=...` -> completes booking successfully. |
| **TC3.2** | Admin CRUD -> Public Reflection | Admin updates hairstyle title/price -> reflected immediately on `/hairstyles` and `/hairstyles/[slug]`. |
| **UI-SLIDER** | Before/After Slider Interaction | User drags slider knob left/right; before/after images clip smoothly across touch and mouse events. |
| **SEO-META** | Dynamic Open Graph Tags | Hairstyle detail page outputs correct `<title>`, `<meta name="description">`, and `og:image`. |
