# Architectural & Implementation Blueprint: Services Showcase & 5-Step Booking Wizard

**Milestone**: M4 (Public Website Experience)  
**Author**: M4 Explorer 3 (Booking Wizard & Services Showcase)  
**Target Routes**:
1. `app/(public)/services/page.tsx` — Services Catalog & Transparent Pricing
2. `app/(public)/booking/page.tsx` — 5-Step Multi-Step Booking Wizard
3. Supporting components in `components/public/`
4. Public Services API: `app/api/public/services/route.ts`

---

## Executive Summary

This document specifies the complete, production-ready implementation blueprint for two core customer-facing pillars of the Lumière Hair Atelier web application:
1. **Services & Transparent Pricing Showcase**: A luxury-tier, categorized catalog presenting salon services and signature luxury bundles with duration chips, transparent price ranges, pre-service preparation instructions, and post-service maintenance guides.
2. **5-Step Multi-Step Online Booking Wizard**: A seamless, high-converting appointment booking experience featuring step-by-step progress, pre-population from URL parameters, real-time client Zod validation matching backend constraints, salon operating hours check (08:30 - 20:30), anti-duplicate idempotency locking, and a confirmation screen with calendar integration.

---

## Table of Contents
1. [Domain Analysis & Schema Mapping](#1-domain-analysis--schema-mapping)
2. [Services & Transparent Pricing Blueprint (`/services`)](#2-services--transparent-pricing-blueprint-services)
   - [2.1 Layout & Visual Hierarchy](#21-layout--visual-hierarchy)
   - [2.2 Data Fetching & Server Component Design](#22-data-fetching--server-component-design)
   - [2.3 Categorized Service Showcase & Filter Tabs](#23-categorized-service-showcase--filter-tabs)
   - [2.4 Transparent Price Tiers & Duration Chips](#24-transparent-price-tiers--duration-chips)
   - [2.5 Pre-Service Prep & Post-Service Care Guide](#25-pre-service-prep--post-service-care-guide)
   - [2.6 Quick "Book Service" CTA Integration](#26-quick-book-service-cta-integration)
   - [2.7 Complete Code Blueprint (`app/(public)/services/page.tsx`)](#27-complete-code-blueprint-apppublicservicespagetsx)
3. [5-Step Multi-Step Booking Wizard Blueprint (`/booking`)](#3-5-step-multi-step-booking-wizard-blueprint-booking)
   - [3.1 Wizard State Machine & Navigation Rules](#31-wizard-state-machine--navigation-rules)
   - [3.2 Step 1: Select Main Service / Luxury Combo](#32-step-1-select-main-service--luxury-combo)
   - [3.3 Step 2: Choose Reference Hairstyle & Color (Optional)](#33-step-2-choose-reference-hairstyle--color-optional)
   - [3.4 Step 3: Select Preferred Stylist](#34-step-3-select-preferred-stylist)
   - [3.5 Step 4: Pick Date & Time Slot (Operating Hours Check)](#35-step-4-pick-date--time-slot-operating-hours-check)
   - [3.6 Step 5: Customer Details & Transparent Confirmation](#36-step-5-customer-details--transparent-confirmation)
   - [3.7 Real-Time Client Zod Validation & Vietnamese Phone Rule](#37-real-time-client-zod-validation--vietnamese-phone-rule)
   - [3.8 Anti-Duplicate Concurrency Lock (`idempotencyKey`)](#38-anti-duplicate-concurrency-lock-idempotencykey)
   - [3.9 Submission State Transitions & Success Experience](#39-submission-state-transitions--success-experience)
   - [3.10 Complete Code Blueprint (`app/(public)/booking/page.tsx`)](#310-complete-code-blueprint-apppublicbookingpagetsx)
4. [Public API Supporting Endpoints](#4-public-api-supporting-endpoints)
   - [4.1 `app/api/public/services/route.ts`](#41-appapipublicservicesroutets)
5. [E2E Testing & Verification Matrix](#5-e2e-testing--verification-matrix)

---

## 1. Domain Analysis & Schema Mapping

### Database Entities Involved
- **`Service`**: `id`, `title`, `slug`, `shortSummary`, `description`, `durationMinutes`, `priceMin`, `priceMax`, `preCareAdvice`, `postCareAdvice`, `imageUrl`, `isPopular`, `categoryId`.
- **`ServiceCombo`**: `id`, `title`, `slug`, `description`, `packagePrice`, `originalPrice`, `durationMinutes`, `savingsPercent`, `imageUrl`, `isFeatured`, `services`.
- **`Category`**: `id`, `name`, `slug`, `description`, `type` (`SERVICE`), `displayOrder`, `isActive`.
- **`User` (Stylists)**: `id`, `fullName`, `phone`, `avatarUrl`, `isStylist: true`, `bio`, `experienceYears`, `specialties: string[]`.
- **`Hairstyle`**: `id`, `title`, `slug`, `coverImageUrl`, `gender`, `length`, `careEffort`, `priceRefMin`, `priceRefMax`.
- **`HairColor`**: `id`, `name`, `code`, `hexColor`, `secondaryHex`, `tone`, `brightnessLevel`, `requiresBleach`.
- **`Booking`**: `id`, `bookingCode`, `customerName`, `customerPhone`, `customerEmail`, `bookingDate`, `timeSlot`, `serviceId`, `comboId`, `hairstyleRefId`, `hairColorRefId`, `assignedStylistId`, `status: PENDING`, `notes`, `idempotencyKey`.

### Consistency with Existing Backend
- **Booking Code Generation**: Matches `/^BK\d{6}$/` format (e.g. `BK123456`).
- **Initial Status**: Always `PENDING` awaiting salon confirmation.
- **Concurrency & Idempotency**: `idempotencyKey` UUID prevents double charging or duplicate bookings under rapid clicks or network re-transmissions.
- **Operating Hours**: Enforced strictly to **08:30 - 20:30** as validated by `lib/validations/booking.ts`.
- **Vietnamese Phone Regex**: `^(0|\+84)[35789][0-9]{8}$`.

---

## 2. Services & Transparent Pricing Blueprint (`/services`)

### 2.1 Layout & Visual Hierarchy
- **Header**: Atmospheric hero section with Obsidian Noir backdrop (`#0B0F17`), subtle gold border accents (`#D4AF37`), and badges highlighting the 4 Core Salon Commitments:
  1. *100% Mỹ Phẩm Nhập Khẩu Chính Hãng* (Olaplex Mỹ, L’Oréal Pháp, Milbon Nhật).
  2. *Bảo Hành Dịch Vụ 7 Ngày Miễn Phí* (Hỗ trợ chỉnh form/sóng/tone hoàn toàn miễn phí).
  3. *Tư Vấn & Soi Da Đầu Vi Điểm Miễn Phí*.
  4. *Miễn Phí Thức Uống Cao Cấp & Trà Chiều*.
- **Category Filter Tabs**: Sticky horizontal tabs allowing instantaneous switching between:
  - Tất cả dịch vụ (All Services)
  - Cắt & Tạo Kiểu (Haircut & Styling)
  - Uốn Sóng & Nâng Phồng (Perm & Texture)
  - Nhuộm Màu & Tẩy Sáng (Color & Balayage)
  - Chăm Sóc & Trị Liệu (Scalp & Treatment)
  - Gói Combo Đặc Quyền (Luxury Combos)
- **Live Search**: Instant keyword filtering across title, description, and advice.
- **Featured Luxury Combos Carousel / Banner**: Highlights high-value bundled services (e.g., Gentleman Luxe, Seoul Goddess Wave, Platinum Trendsetter).
- **Service Cards Grid**: 2-column or 3-column responsive layout displaying:
  - High-resolution photography.
  - Duration chip (`45 phút`, `120 phút` / `formatDuration`).
  - Transparent price range (`formatPriceRange(priceMin, priceMax)`).
  - Clear note explaining tier factors (tóc ngắn/trung bình/dài/dày).
  - Expandable Pre-Care and Post-Care accordions.
  - "Đặt Lịch Dịch Vụ" CTA button navigating to `/booking?serviceId={id}`.

### 2.2 Data Fetching & Server Component Design
The page `app/(public)/services/page.tsx` is an async Next.js Server Component that fetches active services, combos, and categories from Prisma (with fallback to `memoryStore` if database connection drops), ensuring SEO indexing and fast initial rendering:
```typescript
const [services, combos, categories] = await Promise.all([
  prisma.service.findMany({
    where: { isActive: true },
    orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
    include: { category: true }
  }),
  prisma.serviceCombo.findMany({
    where: { isActive: true },
    orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
    include: { services: true }
  }),
  prisma.category.findMany({
    where: { type: 'SERVICE', isActive: true },
    orderBy: { displayOrder: 'asc' }
  })
]);
```

### 2.3 Categorized Service Showcase & Filter Tabs
Services are organized by their relational `Category`. A client-side filter component manages active tab state and text search without full-page reloads.

### 2.4 Transparent Price Tiers & Duration Chips
Each service card renders:
- Duration badge: `<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-salon-gold/10 text-salon-gold text-xs font-medium"><Clock className="w-3.5 h-3.5" /> {formatDuration(durationMinutes)}</span>`
- Price display:
  - For single services: `{formatPriceRange(Number(priceMin), priceMax ? Number(priceMax) : null)}`
  - For combos: `{formatVND(Number(packagePrice))}` with original price strikethrough `{formatVND(Number(originalPrice))}` and `Tiết kiệm {savingsPercent}%` badge.

### 2.5 Pre-Service Prep & Post-Service Care Guide
Each card contains an expandable tab/accordion:
- **Chuẩn bị trước dịch vụ** (`preCareAdvice`): Crucial advice on washing, hair cleanliness, or chemical history.
- **Chăm sóc sau dịch vụ** (`postCareAdvice`): Professional salon instructions on shampoo intervals, heat styling, sulfate-free products, and purple shampoo for bleached hair.

### 2.6 Quick "Book Service" CTA Integration
Buttons pass the selected item to the booking wizard:
- Single service: `/booking?serviceId=${service.id}`
- Combo package: `/booking?comboId=${combo.id}&serviceId=${combo.id}`

---

### 2.7 Complete Code Blueprint (`app/(public)/services/page.tsx`)

```tsx
// app/(public)/services/page.tsx
import React from 'react';
import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { memoryStore } from '@/lib/memory-store';
import { ServicesCatalogClient } from '@/components/public/ServicesCatalogClient';

export const metadata: Metadata = {
  title: 'Bảng Giá & Dịch Vụ Minh Bạch | Lumière Hair Atelier',
  description: 'Khám phá danh mục dịch vụ cắt tóc, uốn sóng, nhuộm màu không amoniac, tẩy tóc Olaplex và các gói combo đặc quyền với bảng giá minh bạch tại Lumière Hair Atelier.',
};

export const revalidate = 60; // ISR cache 60s

export default async function ServicesPage() {
  let categories: any[] = [];
  let services: any[] = [];
  let combos: any[] = [];

  try {
    const [cats, srvs, cmbs] = await Promise.all([
      prisma.category.findMany({
        where: { type: 'SERVICE', isActive: true },
        orderBy: { displayOrder: 'asc' },
      }),
      prisma.service.findMany({
        where: { isActive: true },
        orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
        include: { category: true },
      }),
      prisma.serviceCombo.findMany({
        where: { isActive: true },
        orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
        include: { services: true },
      }),
    ]);
    categories = cats;
    services = srvs;
    combos = cmbs;
  } catch (error) {
    console.warn('Prisma fetch failed on /services, falling back to memoryStore:', error);
    categories = memoryStore.findCategories().filter((c) => c.type === 'SERVICE');
    services = memoryStore.findServices().filter((s) => s.isActive !== false);
    combos = memoryStore.findCombos().filter((c) => c.isActive !== false);
  }

  // Serialize Decimals for Client Component
  const serializedServices = services.map((s) => ({
    ...s,
    priceMin: Number(s.priceMin),
    priceMax: s.priceMax ? Number(s.priceMax) : null,
  }));

  const serializedCombos = combos.map((c) => ({
    ...c,
    packagePrice: Number(c.packagePrice),
    originalPrice: Number(c.originalPrice),
    services: (c.services || []).map((s: any) => ({
      id: s.id,
      title: s.title,
    })),
  }));

  return (
    <div className="min-h-screen bg-salon-noir text-white">
      {/* Hero Section */}
      <section className="relative pt-24 pb-16 px-4 sm:px-6 lg:px-8 border-b border-salon-gold/15 overflow-hidden">
        <div className="absolute inset-0 bg-radial-gold opacity-10 pointer-events-none" />
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-salon-gold/30 bg-salon-gold/10 text-salon-gold-light text-xs font-semibold uppercase tracking-widest mb-4">
            Haute Coiffure Pricing
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-salon-gold-light via-salon-gold to-salon-gold-dark mb-4">
            Bảng Giá Dịch Vụ Minh Bạch
          </h1>
          <p className="text-neutral-300 max-w-2xl mx-auto text-base md:text-lg font-light leading-relaxed mb-8">
            Mọi dịch vụ tại Lumière Hair Atelier đều được định giá công khai, cam kết không phát sinh phụ phí ẩn. Quý khách luôn được chuyên gia tư vấn kỹ lưỡng trước khi thực hiện.
          </p>

          {/* 4 Guarantees Banner */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto text-left">
            <div className="p-4 rounded-xl bg-salon-charcoal/80 border border-salon-gold/20 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-salon-gold/15 text-salon-gold flex items-center justify-center font-bold text-sm">
                01
              </div>
              <div>
                <h4 className="text-sm font-semibold text-salon-gold-light">100% Chính Hãng</h4>
                <p className="text-xs text-neutral-400">Olaplex, L’Oréal Professionnel, Milbon Nhật Bản.</p>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-salon-charcoal/80 border border-salon-gold/20 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-salon-gold/15 text-salon-gold flex items-center justify-center font-bold text-sm">
                02
              </div>
              <div>
                <h4 className="text-sm font-semibold text-salon-gold-light">Bảo Hành 7 Ngày</h4>
                <p className="text-xs text-neutral-400">Chỉnh sửa form dáng, độ xoăn và màu nhuộm miễn phí.</p>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-salon-charcoal/80 border border-salon-gold/20 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-salon-gold/15 text-salon-gold flex items-center justify-center font-bold text-sm">
                03
              </div>
              <div>
                <h4 className="text-sm font-semibold text-salon-gold-light">Soi Da Đầu Vi Điểm</h4>
                <p className="text-xs text-neutral-400">Khảo sát mật độ và tủy tóc miễn phí trước khi làm.</p>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-salon-charcoal/80 border border-salon-gold/20 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-salon-gold/15 text-salon-gold flex items-center justify-center font-bold text-sm">
                04
              </div>
              <div>
                <h4 className="text-sm font-semibold text-salon-gold-light">Đặc Quyền Thư Giãn</h4>
                <p className="text-xs text-neutral-400">Trà hoa cúc, cafe Ý hảo hạng và đồ ngọt trà chiều.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Client Interactive Catalog */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <ServicesCatalogClient
          categories={categories}
          services={serializedServices}
          combos={serializedCombos}
        />
      </main>
    </div>
  );
}
```

---

## 3. 5-Step Multi-Step Booking Wizard Blueprint (`/booking`)

### 3.1 Wizard State Machine & Navigation Rules
The booking wizard is an interactive client component organized around 5 distinct operational steps:

```
[ Step 1: Dịch Vụ / Combo ]
          │  (Service or Combo selected)
          ▼
[ Step 2: Mẫu Tóc & Màu Nhuộm ]  (Optional / Skip allowed)
          │
          ▼
[ Step 3: Chọn Stylist ]         (Master Stylist or "Any Available")
          │
          ▼
[ Step 4: Ngày & Giờ Hẹn ]       (08:30 - 20:30, slot availability)
          │
          ▼
[ Step 5: Thông Tin & Xác Nhận ] (Zod phone regex, name, notes, idempotencyKey)
          │  POST /api/bookings
          ▼
[ Trạng Thái Tiếp Nhận: Success Modal / Booking Code BKxxxxxx ]
```

#### Step Navigation Constraints:
- **Next Transition Barrier**:
  - `Step 1 -> 2`: Blocked unless `serviceId` or `comboId` is set.
  - `Step 2 -> 3`: Always passable (optional).
  - `Step 3 -> 4`: Always passable (defaults to "Any Stylist").
  - `Step 4 -> 5`: Blocked unless `bookingDate` is valid (`>= today`) and `bookingTime` is within operating hours `08:30 - 20:30`.
  - `Step 5 -> Submit`: Validates name (min 2, max 100), phone (Vietnamese regex), email (if provided), notes (max 500), policy agreement.
- **Back Navigation**: User can return to any prior step without losing form inputs.
- **URL Parameter Sync**:
  On initial mount, URL search params (`serviceId`, `comboId`, `hairstyleId`, `styleId`, `hairColorId`, `colorId`, `stylistId`, `date`, `time`) pre-populate the wizard state.

---

### 3.2 Step 1: Select Main Service / Luxury Combo
- Interactive tabbed switch:
  - **Dịch vụ lẻ** (Haircut, Perm, Color, Scalp Care)
  - **Gói Combo Đặc Quyền VIP** (Bundled packages with 25% savings)
- Each item renders as a selectable card with gold highlight, radio button check, duration badge, and transparent price.
- Pre-selection: If URL has `?serviceId=...` or `?comboId=...`, the item is pre-highlighted.

---

### 3.3 Step 2: Choose Reference Hairstyle & Color (Optional)
- Informative guidance banner:
  > *"Tùy chọn: Chọn mẫu tóc hoặc tone màu yêu thích giúp Master Stylist chuẩn bị trước ý tưởng phù hợp nhất với bạn. Bạn có thể nhấn 'Tiếp tục' để nhận tư vấn trực tiếp tại Salon."*
- **Hairstyle Selection**:
  - Default card: "Tư vấn kiểu tóc trực tiếp tại Salon" (Checkmark icon).
  - Catalog carousel/grid: Shows trending styles with photo, length, and care level.
- **Color Selection**:
  - Default card: "Không chọn màu / Giữ màu hiện tại".
  - Color swatch grid: Real hex swatch circles, tone badge (`WARM`, `COOL`, `NEUTRAL`), bleach alert chip.

---

### 3.4 Step 3: Select Preferred Stylist
- **Option A (Default & Recommended)**:
  - Card: **"Bất kỳ Master Stylist nào sẵn sàng" (Any Available Stylist)**.
  - Subtitle: *"Salon sẽ tự động sắp xếp chuyên viên tay nghề cao phù hợp nhất với khung giờ hẹn của bạn."*
  - Value: `stylistId = undefined`.
- **Option B (Specific Stylist)**:
  - List of active Master Stylists fetched from CMS:
    - `avatarUrl`, `fullName`, `experienceYears` ("12 năm kinh nghiệm").
    - Role title & specialty pills (e.g. "Uốn sóng lơi Nhật - Hàn", "Balayage", "Skin Fade").
    - Selecting a stylist filters the available time slots in Step 4.

---

### 3.5 Step 4: Pick Date & Time Slot (Operating Hours Check)
- **Interactive Date Picker**:
  - Allows selecting dates for the next 30 days starting from `today`.
  - Past dates strictly disabled.
  - Quick pills: "Hôm nay", "Ngày mai", "Cuối tuần này".
- **Operating Hours Grid (08:30 - 20:30)**:
  - Slots every 30 minutes:
    - *Sáng (Morning)*: 08:30, 09:00, 09:30, 10:00, 10:30, 11:00, 11:30.
    - *Chiều (Afternoon)*: 12:00, 12:30, 13:00, 13:30, 14:00, 14:30, 15:00, 15:30, 16:00, 16:30.
    - *Tối (Evening)*: 17:00, 17:30, 18:00, 18:30, 19:00, 19:30, 20:00, 20:30.
  - Dynamic slot filtering:
    - If `bookingDate === today`: any slot earlier than `now + 30 minutes` is disabled.
    - Visual status: Selected (Solid Gold), Available (Charcoal with Gold border on hover), Booked/Unavailable (Dimmed with "Đã kín").

---

### 3.6 Step 5: Customer Details & Transparent Confirmation
- **Customer Form Fields**:
  - `customerName`: Full name (min 2, max 100).
  - `customerPhone`: Phone number validated against `^(0|\+84)[35789][0-9]{8}$`.
  - `customerEmail`: Optional email address with RFC email regex.
  - `notes`: Optional customer note (max 500 characters, live counter `[current]/500`).
- **Comprehensive Booking Summary Card**:
  - Selected service or combo with duration and price breakdown.
  - Selected hairstyle & color references.
  - Selected Master Stylist.
  - Selected date & time slot.
  - Transparent price reminder: *"Giá dịch vụ được thanh toán tại Salon sau khi hoàn thành trải nghiệm. Không phụ thu cuối tuần."*
- **Terms & Cancellation Policy Checkbox**:
  - *"Tôi đồng ý với chính sách giữ chỗ và bảo mật thông tin của Lumière Hair Atelier."*

---

### 3.7 Real-Time Client Zod Validation & Vietnamese Phone Rule
Client validation uses the exact same schema structure as backend `lib/validations/booking.ts`:
```typescript
import { z } from 'zod';

export const ClientBookingSchema = z.object({
  serviceId: z.string().min(1, 'Vui lòng chọn một dịch vụ hoặc combo'),
  hairstyleId: z.string().optional(),
  hairColorId: z.string().optional(),
  stylistId: z.string().optional(),
  bookingDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Định dạng ngày phải là YYYY-MM-DD')
    .refine((dateStr) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const [year, month, day] = dateStr.split('-').map(Number);
      const selected = new Date(year, month - 1, day);
      return selected >= today;
    }, 'Ngày hẹn không thể là một ngày trong quá khứ'),
  bookingTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Giờ hẹn không hợp lệ')
    .refine((timeStr) => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      const totalMinutes = hours * 60 + minutes;
      return totalMinutes >= 8 * 60 + 30 && totalMinutes <= 20 * 60 + 30;
    }, 'Giờ hẹn phải nằm trong khung giờ mở cửa (08:30 - 20:30)'),
  customerName: z
    .string()
    .trim()
    .min(2, 'Họ và tên tối thiểu 2 ký tự')
    .max(100, 'Họ và tên tối đa 100 ký tự'),
  customerPhone: z
    .string()
    .trim()
    .regex(/^(0|\+84)[35789][0-9]{8}$/, 'Số điện thoại không hợp lệ (Ví dụ: 0908123456 hoặc +84908123456)'),
  customerEmail: z
    .string()
    .trim()
    .email('Địa chỉ email không hợp lệ')
    .optional()
    .or(z.literal('')),
  notes: z
    .string()
    .max(500, 'Ghi chú tối đa 500 ký tự')
    .optional(),
  idempotencyKey: z.string().min(1).optional(),
});
```

---

### 3.8 Anti-Duplicate Concurrency Lock (`idempotencyKey`)
1. **Token Generation**: When the wizard mounts or enters Step 5, an `idempotencyKey` UUID is initialized:
   ```typescript
   const [idempotencyKey] = useState(() =>
     typeof crypto !== 'undefined' && crypto.randomUUID
       ? crypto.randomUUID()
       : `lmr-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
   );
   ```
2. **Client-Side Lock**:
   - `isSubmitting` state is toggled to `true` on form submission.
   - The submit button is immediately disabled with a loading spinner and message: *"Đang khởi tạo lịch hẹn..."*.
   - Rapid secondary clicks are discarded by a guard: `if (isSubmitting) return;`.
3. **Backend Idempotency Deduping**:
   - As implemented in `app/api/bookings/route.ts`, an `inFlightIdempotencyMap` catches duplicate simultaneous network requests.
   - If an existing booking with this `idempotencyKey` already exists in the database or `memoryStore`, the backend returns HTTP 200 with the existing booking rather than throwing a duplicate error.

---

### 3.9 Submission State Transitions & Success Experience
Upon successful booking creation (HTTP 201 or 200):
1. **Success Modal / Confirmation Screen**:
   - Glowing gold checkmark illustration.
   - Unique Booking Code: `BKxxxxxx` with instant copy-to-clipboard button.
   - Status Badge: `Chờ Salon Xác Nhận (PENDING)`.
   - Reassurance message: *"Salon đã tiếp nhận yêu cầu đặt lịch của quý khách. Lễ tân sẽ gọi điện thoại hoặc gửi tin nhắn Zalo xác nhận trong vòng 15 phút."*
2. **Calendar Integration**:
   - **Google Calendar link**: One-click add to Google Calendar with start time, duration, salon address, and booking code.
   - **Apple / Outlook Calendar (.ics)**: Direct download link.
3. **Emergency Contact & Direct Hotline**:
   - Direct click-to-call button to salon hotline: `0908123456`.
4. **Follow-Up Actions**:
   - Button: "Về Trang Chủ" (`/`)
   - Button: "Xem Thêm Mẫu Tóc" (`/hairstyles`)

---

### 3.10 Complete Code Blueprint (`app/(public)/booking/page.tsx`)

```tsx
// app/(public)/booking/page.tsx
import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { memoryStore } from '@/lib/memory-store';
import { BookingWizardClient } from '@/components/public/BookingWizardClient';
import { Loader2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Đặt Lịch Trực Tuyến 5 Bước | Lumière Hair Atelier',
  description: 'Đặt lịch hẹn làm tóc nhanh chóng tại Lumière Hair Atelier. Chọn dịch vụ, stylist yêu thích, ngày giờ phù hợp và nhận mã xác nhận ngay lập tức.',
};

export default async function BookingPage() {
  let services: any[] = [];
  let combos: any[] = [];
  let hairstyles: any[] = [];
  let colors: any[] = [];
  let stylists: any[] = [];

  try {
    const [srvs, cmbs, hss, cols, stys] = await Promise.all([
      prisma.service.findMany({
        where: { isActive: true },
        orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
        include: { category: true },
      }),
      prisma.serviceCombo.findMany({
        where: { isActive: true },
        orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
        include: { services: true },
      }),
      prisma.hairstyle.findMany({
        where: { isActive: true },
        take: 12,
        orderBy: [{ isTrending: 'desc' }, { viewCount: 'desc' }],
        select: {
          id: true,
          title: true,
          slug: true,
          coverImageUrl: true,
          gender: true,
          length: true,
          careEffort: true,
          priceRefMin: true,
          priceRefMax: true,
        },
      }),
      prisma.hairColor.findMany({
        where: { isActive: true },
        orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
        select: {
          id: true,
          name: true,
          code: true,
          hexColor: true,
          tone: true,
          requiresBleach: true,
        },
      }),
      prisma.user.findMany({
        where: { isStylist: true, isActive: true },
        select: {
          id: true,
          fullName: true,
          avatarUrl: true,
          experienceYears: true,
          specialties: true,
          bio: true,
        },
        orderBy: { fullName: 'asc' },
      }),
    ]);

    services = srvs;
    combos = cmbs;
    hairstyles = hss;
    colors = cols;
    stylists = stys;
  } catch (error) {
    console.warn('Prisma fetch failed on /booking, falling back to memoryStore:', error);
    services = memoryStore.findServices().filter((s) => s.isActive !== false);
    combos = memoryStore.findCombos().filter((c) => c.isActive !== false);
    hairstyles = memoryStore.hairstyles.slice(0, 12);
    colors = memoryStore.hairColors;
    stylists = [
      {
        id: 'sty-kenji',
        fullName: 'Kenji Đặng',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
        experienceYears: 12,
        specialties: ['Uốn sóng lơi Nhật - Hàn', 'Cắt Layer hình khối'],
        bio: 'Artistic Director với 12 năm tu nghiệp tại Tokyo & Seoul.',
      },
      {
        id: 'sty-elena',
        fullName: 'Elena Vũ',
        avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
        experienceYears: 9,
        specialties: ['Tẩy màu Bạch Kim & Pastel', 'Balayage & Ombre'],
        bio: 'Master Colorist được chứng nhận bởi Olaplex & L’Oréal Professionnel.',
      },
    ];
  }

  // Decimal serialization
  const serializedServices = services.map((s) => ({
    ...s,
    priceMin: Number(s.priceMin),
    priceMax: s.priceMax ? Number(s.priceMax) : null,
  }));

  const serializedCombos = combos.map((c) => ({
    ...c,
    packagePrice: Number(c.packagePrice),
    originalPrice: Number(c.originalPrice),
  }));

  const serializedHairstyles = hairstyles.map((h) => ({
    ...h,
    priceRefMin: h.priceRefMin ? Number(h.priceRefMin) : null,
    priceRefMax: h.priceRefMax ? Number(h.priceRefMax) : null,
  }));

  return (
    <div className="min-h-screen bg-salon-noir text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Page Title */}
        <div className="text-center mb-8">
          <div className="inline-block px-3.5 py-1 rounded-full border border-salon-gold/30 bg-salon-gold/10 text-salon-gold-light text-xs font-semibold uppercase tracking-widest mb-3">
            Online Appointment
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-salon-gold-light via-salon-gold to-salon-gold-dark">
            Đặt Lịch Hẹn Trực Tuyến
          </h1>
          <p className="text-sm md:text-base text-neutral-400 mt-2 max-w-xl mx-auto">
            Trải nghiệm quy trình đặt lịch 5 bước tiện lợi, minh bạch thời gian và chi phí với xác nhận tức thì.
          </p>
        </div>

        {/* Wizard Wrapped in Suspense Boundary for useSearchParams support */}
        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center p-16 text-salon-gold">
              <Loader2 className="w-10 h-10 animate-spin mb-4" />
              <p className="text-sm text-neutral-400">Đang khởi tạo trình đặt lịch...</p>
            </div>
          }
        >
          <BookingWizardClient
            services={serializedServices}
            combos={serializedCombos}
            hairstyles={serializedHairstyles}
            colors={colors}
            stylists={stylists}
          />
        </Suspense>
      </div>
    </div>
  );
}
```

---

## 4. Public API Supporting Endpoints

### 4.1 `app/api/public/services/route.ts`
Matches Tier 1 E2E test `TC1.5` (`GET /api/public/services returns transparent price tiers and durations`):

```typescript
// app/api/public/services/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { memoryStore } from '@/lib/memory-store';

export async function GET() {
  try {
    let services: any[] = [];
    try {
      services = await prisma.service.findMany({
        where: { isActive: true },
        orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
        include: { category: true },
      });
    } catch {
      services = memoryStore.findServices().filter((s) => s.isActive !== false);
    }

    const formattedServices = services.map((s) => {
      // Determine standard category token for test compatibility (CUT, PERM, DYE, COMBO, CARE)
      let categoryToken = 'OTHER';
      const catSlug = s.category?.slug || '';
      const catName = s.category?.name || '';
      if (catSlug.includes('cat') || catName.includes('Cắt')) categoryToken = 'CUT';
      else if (catSlug.includes('uon') || catName.includes('Uốn')) categoryToken = 'PERM';
      else if (catSlug.includes('nhuom') || catName.includes('Nhuộm')) categoryToken = 'COLOR';
      else if (catSlug.includes('cham-soc') || catName.includes('Chăm sóc')) categoryToken = 'CARE';

      return {
        id: s.id,
        name: s.title,
        title: s.title,
        category: categoryToken,
        durationMinutes: s.durationMinutes,
        minPrice: Number(s.priceMin),
        maxPrice: s.priceMax ? Number(s.priceMax) : Number(s.priceMin),
        description: s.description || s.shortSummary,
        preCareAdvice: s.preCareAdvice,
        postCareAdvice: s.postCareAdvice,
      };
    });

    return NextResponse.json({ services: formattedServices }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Lỗi khi tải danh sách dịch vụ', details: error.message },
      { status: 500 }
    );
  }
}
```

---

## 5. E2E Testing & Verification Matrix

| Test ID | Test Name | Target Validated | Verification Command |
|---------|-----------|------------------|----------------------|
| **TC1.5** | Services & Pricing Transparency | Duration minutes, minPrice, maxPrice, category | `node tests/run-e2e.ts --grep="TC1.5"` |
| **TC1.18** | Minimum Booking Creation | `POST /api/bookings` with minimum required fields | `node tests/run-e2e.ts --grep="TC1.18"` |
| **TC1.19** | Full Detail Booking Creation | `hairstyleId`, `hairColorId`, `stylistId`, `customerEmail`, `notes` | `node tests/run-e2e.ts --grep="TC1.19"` |
| **TC1.20** | Anti-Duplicate Idempotency | `idempotencyKey` concurrency deduping returns HTTP 200 with same id | `node tests/run-e2e.ts --grep="TC1.20"` |
| **TC2.1** | Customer Name Length Boundaries | 1 char fails (400), 2 chars passes (201), 100 passes, 101 fails | `node tests/run-e2e.ts --grep="TC2.1"` |
| **TC2.2** | Customer Notes Length Boundary | 500 chars passes (201), 501 chars fails (400) | `node tests/run-e2e.ts --grep="TC2.2"` |
| **TC2.3** | Vietnamese Phone Format Regex | `(0|+84)[35789]xxxxxxxx` passes, invalid prefixes/lengths fail | `node tests/run-e2e.ts --grep="TC2.3"` |
| **TC2.4** | Past Date & Date Format Rejection | Past dates rejected, `YYYY-MM-DD` enforced | `node tests/run-e2e.ts --grep="TC2.4"` |
| **TC2.5** | Operating Hours Limits (08:30 - 20:30) | 08:30 passes, 20:30 passes, 08:00 fails, 21:00 fails | `node tests/run-e2e.ts --grep="TC2.5"` |
| **TC3.1** | Pairwise Booking + Style + Color | Integration of service, style, and color in single booking | `node tests/run-e2e.ts --grep="TC3.1"` |
| **TC3.2** | Bleach Requirement Interaction | Bleach color selection reflected in prep advice and combo bundle | `node tests/run-e2e.ts --grep="TC3.2"` |
| **TC4.1** | End-to-End Customer Booking Journey | Full discovery -> booking wizard -> staff confirmation | `node tests/run-e2e.ts --grep="TC4.1"` |
| **TC4.3** | High-Concurrency Duplicate Slot Lock | High-concurrency duplicate submission lock protects appointment slot | `node tests/run-e2e.ts --grep="TC4.3"` |

---

## 6. Implementation Deliverables Summary

1. `app/(public)/services/page.tsx`: Server Component fetching categories, services, combos.
2. `components/public/ServicesCatalogClient.tsx`: Interactive client filter tabs, duration badges, price range display, prep & care accordions, "Đặt Lịch" CTA links.
3. `app/(public)/booking/page.tsx`: Server Component fetching services, combos, styles, colors, stylists with `<Suspense>` wrapper.
4. `components/public/BookingWizardClient.tsx`: 5-Step Stepper, URL query parameter pre-population, interactive calendar with operating hours check (08:30 - 20:30), client Zod validation, UUID idempotency key lock, and success modal with Google Calendar & `.ics` links.
5. `app/api/public/services/route.ts`: Public API endpoint serving transparent tiered services.
