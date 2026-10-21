# Exhaustive Specification Report: R3 — Admin CMS & RBAC

**Document Version:** 1.0.0  
**Author:** Survey Spec Miner 2 (`teamwork_preview_spec_miner_survey_2`)  
**Parent Orchestrator:** `daa96dc0-4b53-4192-88a0-f59f39a1f3f3`  
**Reference Document:** `c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\ORIGINAL_REQUEST.md`  
**Target URL Base:** `/admin`  

---

## 1. Executive Summary & Architecture Overview

The **Admin CMS** (`/admin`) serves as the mission-critical back-office management console for the modern Hair Salon web application. Designed to be completely decoupled in layout, styling, and security boundaries from the Public Website (`/`), it provides a high-efficiency, secure, role-restricted dashboard for salon owners, content editors, and receptionist/booking staff.

### Core Architectural Pillars
1. **Zero-Trust Server-Side RBAC**: Every administrative route and API endpoint evaluates authenticated user claims and permissions on the server before rendering UI or executing database transactions.
2. **Real-time DB Telemetry**: The dashboard renders live business counters and operational metrics directly from PostgreSQL via Prisma ORM with zero stale cache on critical booking states.
3. **Comprehensive CRUD Control**: Full lifecycle management of high-value salon catalog items: dynamic hero banners, categorized hairstyles with rich hair taxonomy, color swatch formulas, interactive before/after transformation galleries, salon services and bundled combos, and SEO-optimized advisory articles.
4. **Resilient Appointment State Machine**: Formal transition lifecycle tracking customer bookings from initial online request (`PENDING`) through validation (`CONFIRMED`), execution (`COMPLETED`), cancellation (`CANCELLED`), or unfulfilled visits (`NO_SHOW`), complete with internal staff notes and stylist dispatch.
5. **Dynamic Site Settings & Branding**: Centralized configuration management ensuring that marketing contacts, business hours, Google Maps coordinates, social profiles, and SEO defaults update instantly without redeployment.
6. **Immutable Security & Audit Trail**: Every sensitive state change (authentication, content mutation, appointment transition, settings modification) is recorded in an append-only audit log capturing actor, entity, payload diffs, IP address, and timestamp.

---

## 2. Authentication & Role-Based Access Control (RBAC) Specification

### 2.1 Role Definitions
The salon application enforces 4 distinct administrative roles with hierarchical and domain-partitioned permissions:

| Role Name | Identifier (`Role`) | Description & Responsibility Scope |
|---|---|---|
| **Super Admin** | `SUPER_ADMIN` | The Salon Owner / Master Administrator. Unrestricted access across all system resources: user/staff management, site settings, content CRUD, appointment lifecycle, full audit log inspection, and system resets. |
| **Content Admin** | `CONTENT_ADMIN` | Lead Marketing / Salon Manager. Full management rights over all customer-facing content: banners, categories, hairstyles, hair colors, before/after showcases, services, and published articles. Cannot manage staff accounts or modify core site settings. |
| **Booking Staff** | `BOOKING_STAFF` | Front-Desk Receptionist / Customer Service Specialist. Dedicated to appointment operations: viewing appointments, searching/filtering, calling customers, confirming slots, assigning stylists, updating appointment statuses, and appending internal notes. Read-only access to services and hairstyles for customer consultation reference. |
| **Editor** | `EDITOR` | Copywriter / Digital Marketing Assistant. Drafts and edits news articles, blog posts, hairstyle descriptions, and before/after transformation entries. Requires managerial review for final publishing; cannot alter bookings, site settings, or system users. |

### 2.2 Permissions Matrix

| Resource / Action | Route / Endpoint | `SUPER_ADMIN` | `CONTENT_ADMIN` | `BOOKING_STAFF` | `EDITOR` |
|---|---|:---:|:---:|:---:|:---:|
| **Admin Login / Logout** | `/admin/login`, `/api/admin/auth/*` | ✅ | ✅ | ✅ | ✅ |
| **Dashboard Metrics** | `/admin`, `/api/admin/dashboard` | ✅ (Full) | ✅ (Content) | ✅ (Bookings) | ❌ / Limited |
| **Manage Staff Accounts** | `/admin/users`, `/api/admin/users/*` | ✅ (CRUD) | ❌ | ❌ | ❌ |
| **View Audit Logs** | `/admin/audit-logs`, `/api/admin/audit-logs/*` | ✅ (Full View & Export) | ❌ | ❌ | ❌ |
| **Site Settings** | `/admin/settings`, `/api/admin/settings/*` | ✅ (Edit) | ❌ (Read-only) | ❌ | ❌ |
| **Home Banners** | `/admin/banners`, `/api/admin/banners/*` | ✅ (CRUD) | ✅ (CRUD) | ❌ (View) | ❌ |
| **Categories & Hairstyles** | `/admin/hairstyles`, `/api/admin/hairstyles/*` | ✅ (CRUD) | ✅ (CRUD) | 👁️ (View Only) | 📝 (Create/Edit Draft) |
| **Hair Color Swatches** | `/admin/hair-colors`, `/api/admin/hair-colors/*` | ✅ (CRUD) | ✅ (CRUD) | 👁️ (View Only) | 📝 (Create/Edit Draft) |
| **Before / After** | `/admin/before-after`, `/api/admin/before-after/*` | ✅ (CRUD) | ✅ (CRUD) | 👁️ (View Only) | 📝 (Create/Edit Draft) |
| **Services & Combos** | `/admin/services`, `/api/admin/services/*` | ✅ (CRUD) | ✅ (CRUD) | 👁️ (View Only) | ❌ |
| **Articles (News / SEO)** | `/admin/articles`, `/api/admin/articles/*` | ✅ (CRUD & Publish) | ✅ (CRUD & Publish) | ❌ | 📝 (Create/Edit Drafts) |
| **Appointments List/Search** | `/admin/appointments`, `/api/admin/appointments` | ✅ | 👁️ (View) | ✅ (Full Filter) | ❌ |
| **Appointment Status Update** | `/api/admin/appointments/[id]/status` | ✅ | ❌ | ✅ | ❌ |
| **Assign Stylist & Notes** | `/api/admin/appointments/[id]/assign` | ✅ | ❌ | ✅ | ❌ |

### 2.3 Session Management & Route Protection Specification
- **Authentication Scheme**: Secure HTTP-Only, SameSite=Lax, Secure cookie containing an encrypted JWT or cryptographically signed session token.
- **Middleware Guard (`middleware.ts`)**:
  - Intercepts all requests matching `/admin/:path*` (except `/admin/login` and public static assets).
  - Validates session integrity, token signature, and expiration.
  - Redirects unauthenticated requests to `/admin/login?redirect={path}`.
- **Server-Side API Guard (`lib/auth/guard.ts`)**:
  - Every API route under `/api/admin/*` invokes `requireAuth(req, [allowedRoles])`.
  - Returns `401 Unauthorized` with JSON `{ success: false, error: "UNAUTHENTICATED", message: "Vui lòng đăng nhập" }` if session is missing or invalid.
  - Returns `403 Forbidden` with JSON `{ success: false, error: "FORBIDDEN", message: "Bạn không có quyền thực hiện thao tác này" }` if the user's role does not match `allowedRoles`.
- **Session Expiration & Invalidation**:
  - Inactive session timeout: 8 hours.
  - Maximum absolute session lifetime: 7 days with sliding refresh.
  - Immediate session invalidation on password change or administrative account deactivation.

---

## 3. Dashboard Metrics Specification (`/admin`)

The Admin Dashboard provides instantaneous operational awareness through direct database queries executed on request (or cached via Next.js `revalidate = 0` / Server Action).

### 3.1 Core Metrics & Aggregation Logic

```
+-------------------------------------------------------------------------------------------------+
|                                     SALON ADMIN DASHBOARD                                      |
+------------------------------+------------------------------+-----------------------------------+
|  📅 Today's Bookings: 18     |  ⏳ Pending Confirm: 5 (!)   |  ✂️ Active Hairstyles: 64         |
|  (Confirmed: 12 | Done: 1)   |  [Immediate Action Alert]    |  (Total: 72 | 8 Hidden)           |
+------------------------------+------------------------------+-----------------------------------+
|  🎨 Hair Colors: 36          |  💆 Services & Combos: 28    |  📰 Published Articles: 19        |
|  (Warm: 14 | Cool: 18)       |  (22 Single | 6 Combos)      |  (4 Drafts awaiting review)       |
+-------------------------------------------------------------------------------------------------+
|  🚨 URGENT ACTION QUEUE: 5 Appointments awaiting confirmation within next 24h                  |
|  📋 RECENT AUDIT ACTIVITY: Last 10 system actions (Actor, Entity, Timestamp, Delta)            |
+-------------------------------------------------------------------------------------------------+
```

#### Detailed Query & Computation Contracts:
1. **`todayAppointmentsCount`**:
   - Query: `prisma.booking.count({ where: { appointmentDate: { gte: startOfDay, lte: endOfDay } } })`
   - Breakdown: group by `status` (`PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED`, `NO_SHOW`).
2. **`pendingConfirmationCount`**:
   - Query: `prisma.booking.count({ where: { status: 'PENDING' } })`
   - UI Rule: Highlighted in red/amber with pulse indicator if `count > 0`.
3. **`totalHairstyles`**:
   - Count active: `where: { isActive: true }`, total: `prisma.hairstyle.count()`.
4. **`totalHairColors`**:
   - Total count: `prisma.hairColor.count({ where: { isActive: true } })`.
5. **`totalServicesAndCombos`**:
   - Services count + Combo count.
6. **`totalArticles`**:
   - Count by `isPublished = true` vs `isPublished = false`.
7. **`recentActivityLog`**:
   - Query: `prisma.auditLog.findMany({ take: 10, orderBy: { createdAt: 'desc' }, include: { user: { select: { fullName: true, role: true } } } })`
   - Displays: Actor name, role badge, formatted action (e.g., "Xác nhận lịch hẹn #BK-1082"), target entity, and relative time (e.g., "5 phút trước").

---

## 4. Full CRUD Content Management Specifications

### 4.1 Home Banners (`/admin/banners`)
- **Purpose**: Controls high-impact promotional carousel banners displayed on the Public Homepage Hero section.
- **Data Model Specifications**:
  - `id`: String (CUID / UUID)
  - `title`: String (Max 120 chars) - Promotional headline
  - `subtitle`: String? (Max 255 chars) - Supporting promotional text
  - `desktopImageUrl`: String (URL to WebP/AVIF image in Cloudinary/Supabase)
  - `mobileImageUrl`: String? (Optional optimized vertical/square asset)
  - `ctaText`: String? (Max 50 chars, e.g., "Đặt lịch ngay", "Khám phá bộ sưu tập")
  - `ctaLink`: String? (URL or internal path, e.g., "/booking", "/hairstyles")
  - `sortOrder`: Int (Default: 0, ascending priority)
  - `isActive`: Boolean (Default: true)
  - `startDate`: DateTime? (Optional campaign start schedule)
  - `endDate`: DateTime? (Optional campaign auto-expiry schedule)
  - `createdAt`, `updatedAt`: DateTime
- **Form Validations (Zod)**:
  - `title`: `z.string().min(2, "Tiêu đề tối thiểu 2 ký tự").max(120)`
  - `desktopImageUrl`: `z.string().url("Đường dẫn ảnh desktop không hợp lệ")`
  - `mobileImageUrl`: `z.string().url().optional().or(z.literal(""))`
  - `ctaLink`: `z.string().max(255).optional().or(z.literal(""))`
  - `sortOrder`: `z.coerce.number().int().default(0)`
  - `isActive`: `z.boolean().default(true)`
- **List & Table Features**:
  - Drag-and-drop or numeric reordering.
  - Active toggle switch with instant optimistic update.
  - Thumbnail preview with aspect ratio badge.
  - Delete confirmation dialog with safety prompt.

---

### 4.2 Categories & Hairstyles (`/admin/hairstyles`)
- **Purpose**: Core salon catalog managing haircut taxonomy, stylistic tags, target demographics, and detailed hair attributes for filtering and Try-On integration.

#### A. Category Specification (`Category`)
- `id`: String (CUID)
- `name`: String (e.g., "Kiểu tóc Nam", "Kiểu tóc Nữ", "Tóc Uốn Hàn Quốc")
- `slug`: String (Unique, URL slug e.g. "kieu-toc-nam")
- `gender`: Enum (`MALE`, `FEMALE`, `UNISEX`)
- `description`: String?
- `iconUrl`: String?
- `sortOrder`: Int (Default: 0)
- `isActive`: Boolean (Default: true)

#### B. Hairstyle Specification (`Hairstyle`)
- `id`: String (CUID)
- `name`: String (e.g., "Layer Nam Cắt Mờ Taper Fade", "Mullet Nữ Layer Bay")
- `slug`: String (Unique)
- `categoryId`: String (FK -> Category)
- `gender`: Enum (`MALE`, `FEMALE`, `UNISEX`)
- `styleTag`: String (e.g., "Hàn Quốc", "Cổ điển", "Layer", "Undercut", "Tối giản", "Edgy", "Bob", "Mullet")
- `hairLength`: Enum (`SHORT`, `MEDIUM`, `LONG`)
- `faceShapes`: Enum Array / JSON (`OVAL`, `ROUND`, `SQUARE`, `HEART`, `OBLONG`, `DIAMOND`) - Which faces suit this style
- `hairTextures`: Enum Array / JSON (`STRAIGHT`, `WAVY`, `CURLY`, `COARSE`, `FINE`) - Suitable hair textures
- `maintenanceLevel`: Enum (`EASY`, `MODERATE`, `HIGH`) - Effort required for daily styling
- `priceEstimated`: String? (e.g., "150.000đ - 350.000đ")
- `description`: String (Markdown / Rich Text overview)
- `careInstructions`: String? (Detailed advice for washing, drying, wax/pomade usage)
- `coverImage`: String (Primary showcase image)
- `galleryImages`: String[] / JSON (Additional angle shots: side, back, 45-degree)
- `isFeatured`: Boolean (Highlights on homepage trending section)
- `isActive`: Boolean (Controls public visibility)
- `viewCount`: Int (Default: 0)
- `relatedServiceIds`: Many-to-Many relation with `Service`
- **Validation Rules**:
  - `slug`: Automatically generated from `name` using Vietnamese transliteration (unaccented lowercase hyphenated), unique index enforcement.
  - At least 1 face shape and 1 hair texture must be selected.
  - Primary `coverImage` is mandatory.

---

### 4.3 Hair Color Swatches (`/admin/hair-colors`)
- **Purpose**: Powers the salon's Color Consultation and Try-On Swatch library, specifying tones, bleaching levels, and skin tone compatibility.
- **Data Model Specifications**:
  - `id`: String (CUID)
  - `name`: String (e.g., "Nâu Hạt Dẻ", "Xám Khói Ánh Tím", "Nâu Tây Lạnh", "Bạch Kim Platinum")
  - `slug`: String (Unique)
  - `hexCode`: String (Hexadecimal color code e.g. `#5B3A29` or gradient representation)
  - `tone`: Enum (`WARM`, `COOL`, `NEUTRAL`)
  - `colorGroup`: Enum (`BROWN`, `BLONDE`, `ASH`, `RED`, `PASTEL`, `BLACK`, `FASHION`)
  - `brightnessLevel`: Enum (`LIGHT`, `MEDIUM`, `DARK`)
  - `requiresBleaching`: Boolean (True if bleach is mandatory)
  - `bleachingLevel`: Enum? (`LEVEL_NONE`, `LEVEL_1_TO_3`, `LEVEL_4_TO_6`, `LEVEL_7_PLUS`)
  - `suitableSkinTones`: Enum Array / JSON (`FAIR`, `MEDIUM`, `OLIVE`, `DARK`, `ALL`)
  - `maintenanceTips`: String? (Instructions on purple shampoo, washing frequency, heat protection)
  - `sampleImageUrl`: String (Real photograph of the finished hair color on a client)
  - `isTrending`: Boolean (Default: false)
  - `isActive`: Boolean (Default: true)
  - `sortOrder`: Int (Default: 0)
- **Validation Rules**:
  - `hexCode`: `z.string().regex(/^#([0-9a-fA-F]{3}){1,2}$/, "Mã màu Hex không hợp lệ")`
  - If `requiresBleaching` is `true`, `bleachingLevel` must be explicitly specified.

---

### 4.4 Before/After Showcases (`/admin/before-after`)
- **Purpose**: Showcases salon craftsmanship through dual-image comparison sliders demonstrating real client transformations.
- **Data Model Specifications**:
  - `id`: String (CUID)
  - `title`: String (e.g., "Phục hồi tóc hư tổn + Uốn sóng lơi tự nhiên")
  - `beforeImageUrl`: String (High-resolution 'Before' portrait)
  - `afterImageUrl`: String (High-resolution 'After' portrait from matching angle)
  - `customerName`: String? (e.g., "Bạn Lan Anh - Hà Nội" or "Khách hàng ẩn danh")
  - `stylistName`: String? (Lead stylist responsible for the transformation)
  - `serviceId`: String? (FK -> Service, links directly to booking the same service)
  - `hairstyleId`: String? (FK -> Hairstyle, optional link to hairstyle card)
  - `description`: String? (Diagnosis of hair condition before and treatment applied)
  - `techniqueUsed`: String? (e.g., "Nhuộm Balayage kết hợp Olaplex số 1 & 2")
  - `durationMinutes`: Int? (Time taken to complete, e.g., 240)
  - `isFeatured`: Boolean (Default: false, controls presence in Homepage Before/After slider)
  - `isActive`: Boolean (Default: true)
  - `sortOrder`: Int (Default: 0)
- **Interactive UI Verification**:
  - Admin preview widget integrates a draggable split slider so the editor can verify image alignment before publishing.

---

### 4.5 Services & Service Combos (`/admin/services`)
- **Purpose**: Defines salon service catalog, pricing tiers, duration, step-by-step procedures, and cost-saving bundled packages.

#### A. Single Service (`Service`)
- `id`: String (CUID)
- `name`: String (e.g., "Cắt tóc tạo kiểu cao cấp", "Uốn Setting phục hồi Keratin")
- `slug`: String (Unique)
- `category`: Enum (`HAIRCUT`, `PERM`, `COLOR`, `BLEACH`, `TREATMENT`, `SCALP_CARE`, `STYLING`, `COMBO`)
- `description`: String (Clear customer-facing value proposition)
- `durationMinutes`: Int (Estimated chair time: e.g. 30, 45, 90, 180 min - used for scheduling)
- `basePrice`: Decimal / Int (Base price in VND, e.g., 200000)
- `maxPrice`: Decimal / Int? (Upper range if dependent on hair length, e.g., 450000)
- `stepDetails`: JSON / String (List of steps included: e.g., "1. Gội massage | 2. Tư vấn kiểu dáng | 3. Cắt tỉa chi tiết | 4. Sấy vuốt wax tạo kiểu")
- `prepNotes`: String? (Things to prepare before arrival)
- `aftercareNotes`: String? (Post-service care recommendations)
- `isFeatured`: Boolean (Highlights on homepage price list)
- `isActive`: Boolean (Default: true)
- `sortOrder`: Int (Default: 0)

#### B. Service Combo (`ServiceCombo`)
- `id`: String (CUID)
- `name`: String (e.g., "Combo Toàn Diện: Cắt + Uốn Hàn Quốc + Hấp Dầu Phục Hồi")
- `slug`: String (Unique)
- `serviceIds`: Many-to-Many relation with `Service`
- `comboPrice`: Decimal / Int (Promotional bundled price in VND)
- `originalTotalPrice`: Decimal / Int (Calculated sum of individual services)
- `savingsPercentage`: Int (Calculated display discount e.g. 25%)
- `durationMinutes`: Int (Total bundled duration)
- `badgeText`: String? (e.g., "Tiết kiệm 150K", "Best Seller")
- `isActive`: Boolean (Default: true)

---

### 4.6 News / Advisory Articles (`/admin/articles`)
- **Purpose**: Content marketing engine supporting hair care guides, seasonal trends, and high-ranking SEO content.
- **Data Model Specifications**:
  - `id`: String (CUID)
  - `title`: String (Max 150 chars)
  - `slug`: String (Unique, SEO URL)
  - `excerpt`: String (Max 300 chars, used for Google meta description and blog cards)
  - `content`: String (Markdown / Rich HTML supporting embedded images, headers, callouts)
  - `coverImageUrl`: String (16:9 featured cover image)
  - `authorId`: String (FK -> User / Staff)
  - `category`: Enum (`TRENDS`, `HAIR_CARE`, `COLOR_GUIDE`, `SALON_NEWS`)
  - `tags`: String[] / JSON (Keywords: e.g. ["chăm sóc tóc nhuộm", "tóc uốn", "dưỡng tóc tại nhà"])
  - `metaTitle`: String? (Custom SEO title tag override)
  - `metaDescription`: String? (Custom meta description override)
  - `metaKeywords`: String? (Comma-delimited keywords)
  - `ogImageUrl`: String? (Open Graph social share image)
  - `status`: Enum (`DRAFT`, `PUBLISHED`, `ARCHIVED`)
  - `publishedAt`: DateTime? (Timestamp when published)
  - `viewCount`: Int (Default: 0)
- **SEO Preview Component in Admin**:
  - Live Google Search Snippet preview (Title, URL slug, Description length progress bar).
  - Open Graph preview card (Facebook/Zalo card preview with 1200x630 asset check).

---

## 5. Appointment Management Specification (`/admin/appointments`)

Appointment management is the core operational module for receptionists (`BOOKING_STAFF`) and managers.

### 5.1 Booking Lifecycle State Machine

```
                   +---------------------------------------------+
                   |                   PENDING                   |
                   |   (New request created from public form)    |
                   +----------------------+----------------------+
                                          |
                +-------------------------+-------------------------+
                | Staff phone contact &   | Invalid info / Customer |
                | confirms slot availability| cancels request       |
                v                                                   v
+-------------------------------+                  +-------------------------------+
|           CONFIRMED           |                  |           CANCELLED           |
| (Slot locked, Stylist assigned)                  | (Terminal: Reason recorded)   |
+---------------+---------------+                  +-------------------------------+
                |
    +-----------+-----------+
    |                       |
    | Customer arrives &    | Customer fails to arrive
    | service completed     | (Grace period expired)
    v                       v
+-----------------------+ +-----------------------+
|       COMPLETED       | |        NO_SHOW        |
| (Terminal: Billed)    | | (Terminal: Flagged)   |
+-----------------------+ +-----------------------+
```

#### State Transition Rules & Guards:
1. `PENDING` -> `CONFIRMED`:
   - Pre-condition: Staff reviews desired date/time slot, confirms stylist availability, verifies customer phone number.
   - Required input: `assignedStylist` (optional or mandatory), optional `internalNotes`.
   - Effect: Updates status, emits Audit Log, sends confirmation trigger.
2. `PENDING` -> `CANCELLED`:
   - Allowed at any point. Cancellation reason is mandatory.
3. `CONFIRMED` -> `COMPLETED`:
   - Triggered when the customer concludes their salon appointment.
   - Marks booking as fulfilled. Increments stylist completion stats.
4. `CONFIRMED` -> `CANCELLED`:
   - Permitted if customer cancels prior to arrival. Cancellation reason required.
5. `CONFIRMED` -> `NO_SHOW`:
   - Triggered if customer is more than 30-45 minutes late without phone contact.
6. **Terminal States**:
   - `COMPLETED`, `CANCELLED`, and `NO_SHOW` are locked terminal states. Standard booking staff cannot reopen them. Re-opening requires `SUPER_ADMIN` authorization with an explicit reason entered into the Audit Log.

### 5.2 Search, Filter, and Listing Specification
- **Search Capabilities**:
  - Fast substring match against: `customerName`, `customerPhone`, `bookingCode` (e.g. `BK-8921`).
- **Filters**:
  - **Date Presets**: `Hôm nay` (Today), `Ngày mai` (Tomorrow), `Tuần này` (This Week), `Tháng này` (This Month), `Tùy chọn khoảng ngày` (Custom Date Range Picker).
  - **Status Filter**: Multi-select pills for `PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED`, `NO_SHOW`.
  - **Stylist Filter**: Filter by assigned stylist staff member.
  - **Service Filter**: Filter by requested service category.
- **Sorting**:
  - Primary sort: `appointmentDate` ASC (for upcoming schedule) or `createdAt` DESC.
- **Detail Modal & Slide-over Panel**:
  - Customer contact: Name, phone with instant click-to-call link, email (if provided).
  - Appointment specifics: Selected service(s), reference hairstyle thumbnail, requested stylist (or "Salon sắp xếp"), booked date and exact time slot.
  - Customer's initial notes: Any special requests submitted during public booking.
  - Staff Internal Timeline & Notes: Reverse-chronological history of notes added by receptionists (e.g., "[14:10 - Staff Thảo]: Đã gọi xác nhận, khách báo có thể đến muộn 10 phút").

---

## 6. Site Settings (System Configuration) Specification (`/admin/settings`)

The site settings provide a unified control panel for all dynamic salon brand parameters and operational metadata.

### 6.1 Configuration Fields & Categorization

| Tab / Category | Field Key | Type | Description & Example |
|---|---|---|---|
| **Branding** | `brand_name` | String | Commercial salon name (e.g., "LUMIÈRE Hair & Beauty Lounge") |
| | `brand_slogan` | String | Brand tagline (e.g., "Đẳng cấp tạo mẫu tóc chuẩn phong cách cá nhân") |
| | `logo_light_url` | String (URL) | Primary logo for light backgrounds |
| | `logo_dark_url` | String (URL) | Secondary logo for dark / navbar contrast |
| | `favicon_url` | String (URL) | 32x32 / 64x64 favicon asset |
| **Contacts & Location**| `hotline` | String | Primary phone number displayed across website (e.g., "0901 234 567") |
| | `booking_phone` | String | Dedicated booking/desk phone |
| | `contact_email` | String | Salon customer support email |
| | `address_main` | String | Physical flagship address (e.g., "Số 123 Phố Huế, Hai Bà Trưng, Hà Nội") |
| | `google_maps_embed_url` | String (URL)| Safe iframe embed URL for interactive map rendering |
| | `google_maps_share_link`| String (URL)| Direction link opening native Google Maps app |
| **Operating Hours** | `hours_weekday` | String | Mon-Fri operating hours (e.g., "08:30 - 21:00") |
| | `hours_weekend` | String | Sat-Sun operating hours (e.g., "08:00 - 21:30") |
| | `holiday_notice` | String? | Seasonal holiday notes (e.g., "Mở cửa xuyên Tết Nguyên Đán") |
| | `is_open_today` | Boolean | Global salon open/closed switch for emergency closure |
| **Social Links** | `social_facebook` | String (URL)| Salon Facebook fanpage URL |
| | `social_instagram`| String (URL)| Instagram portfolio link |
| | `social_tiktok` | String (URL)| TikTok channel link |
| | `social_zalo` | String (URL)| Official Zalo OA contact link |
| | `social_youtube` | String (URL)| YouTube channel link |
| **SEO Defaults** | `seo_default_title` | String | Global page title template |
| | `seo_default_description`| String | Meta description (150-160 chars) |
| | `seo_default_og_image` | String (URL)| Default social preview image (1200x630) |
| | `seo_google_verification`| String?| Google Search Console verification token |
| **Footer & Legal** | `copyright_text` | String | e.g. "© 2026 LUMIÈRE Hair Lounge. All rights reserved." |
| | `business_license`| String | Business registration license info |
| | `emergency_banner_text` | String? | Top-bar emergency announcement text |
| | `emergency_banner_active`| Boolean | Toggle display of top-bar announcement |

### 6.2 Storage & Caching Strategy
- Settings are stored in a dedicated `SiteSetting` key-value model (or singleton row).
- Cached in Next.js using tagged caching (`revalidateTag('site-settings')`).
- Modifying any site setting from the Admin panel automatically triggers `revalidatePath('/', 'layout')` ensuring instant propagation to all public pages without server restart.

---

## 7. Audit Log Specification (`/admin/audit-logs`)

To satisfy strict compliance, data accountability, and trace malicious or accidental data changes, the system records all administrative operations.

### 7.1 Audit Event Taxonomy
- **Authentication Events**: `AUTH_LOGIN_SUCCESS`, `AUTH_LOGIN_FAILED`, `AUTH_LOGOUT`, `AUTH_PASSWORD_CHANGE`.
- **Content Mutation Events**:
  - Banners: `BANNER_CREATE`, `BANNER_UPDATE`, `BANNER_DELETE`, `BANNER_TOGGLE_ACTIVE`.
  - Hairstyles & Categories: `HAIRSTYLE_CREATE`, `HAIRSTYLE_UPDATE`, `HAIRSTYLE_DELETE`, `CATEGORY_MUTATE`.
  - Hair Colors: `COLOR_CREATE`, `COLOR_UPDATE`, `COLOR_DELETE`.
  - Before/After: `BEFORE_AFTER_CREATE`, `BEFORE_AFTER_UPDATE`, `BEFORE_AFTER_DELETE`.
  - Services: `SERVICE_CREATE`, `SERVICE_UPDATE`, `SERVICE_DELETE`, `COMBO_MUTATE`.
  - Articles: `ARTICLE_CREATE`, `ARTICLE_UPDATE`, `ARTICLE_DELETE`, `ARTICLE_PUBLISH`.
- **Appointment Events**: `BOOKING_STATUS_CHANGE` (capturing previous vs new status), `BOOKING_ASSIGN_STYLIST`, `BOOKING_ADD_NOTE`.
- **System Events**: `SETTINGS_UPDATE`, `USER_CREATE`, `USER_UPDATE_ROLE`, `USER_DEACTIVATE`.

### 7.2 Data Structure
- `id`: String (CUID)
- `userId`: String? (FK -> User, null if action is unauthenticated e.g. failed login)
- `userName`: String (Cached name of the actor at event time)
- `userRole`: String (Cached role of the actor)
- `action`: String (Enum or structured action code)
- `entity`: String (Target resource type: e.g. `BOOKING`, `HAIRSTYLE`, `SITE_SETTINGS`)
- `entityId`: String? (ID of the affected resource)
- `details`: JSON (Stores key differences: `{ "from": "PENDING", "to": "CONFIRMED", "assignedStylist": "Minh Trí" }`)
- `ipAddress`: String? (Extracted from `x-forwarded-for` / `req.ip`)
- `userAgent`: String? (Browser and operating system string)
- `createdAt`: DateTime (Immutable timestamp)

### 7.3 Log Security & Immutability Rules
- The `AuditLog` table has **no UPDATE or DELETE** endpoints.
- Even `SUPER_ADMIN` cannot delete individual log records.
- Only an automated DB retention policy (or archival script run via secure CLI) may prune logs older than 180 days.

---

## 8. Features Discovered

The following exhaustive feature inventory maps all administrative capabilities discovered during the specification probe:

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | Auth & RBAC | Admin Login | Authenticates administrative staff and establishes encrypted session cookie | `username/email`, `password` | HTTP 200, JWT session cookie, user profile | HTTP 401 Invalid credentials, account locked after 5 failed attempts | ORIGINAL_REQUEST.md § R3.1 |
| 2 | Auth & RBAC | Admin Logout | Clears session cookie and invalidates session token | Session cookie | HTTP 200, clear cookie, redirect to login | HTTP 200 (idempotent logout) | ORIGINAL_REQUEST.md § R3.1 |
| 3 | Auth & RBAC | Server-side Route Guard | Next.js Middleware intercepts `/admin/*` and validates session token | HTTP Request header / cookie | Next.js rewrite or pass-through | HTTP 302 Redirect to `/admin/login` | ORIGINAL_REQUEST.md § R3.1 |
| 4 | Auth & RBAC | Server-side API Guard | Validates user role against route permission matrix | Authorization session claims | Proceeds to API handler | HTTP 401 Unauthorized / HTTP 403 Forbidden | ORIGINAL_REQUEST.md § R3.1, AC 2.2 |
| 5 | Auth & RBAC | Staff Account Management | Super Admin can list, create, edit, deactivate staff accounts and assign roles | `email`, `fullName`, `role`, `password`, `isActive` | Updated User record | HTTP 400 Validation error, HTTP 409 Duplicate email | ORIGINAL_REQUEST.md § R3.1 |
| 6 | Dashboard | Real-time Business Counters | Aggregates live counts for hairstyles, colors, services, articles, and bookings | None (DB queries) | JSON counters object | HTTP 500 DB connection error with fallback zero state | ORIGINAL_REQUEST.md § R3.2 |
| 7 | Dashboard | Urgent Booking Queue | Highlights pending bookings requiring immediate confirmation | DB query (`status: 'PENDING'`) | Array of pending booking cards with countdown | Returns empty array if none pending | ORIGINAL_REQUEST.md § R3.2 |
| 8 | Dashboard | Recent Activity Stream | Streams latest 10 audit log entries into dashboard widget | DB query (AuditLog sorted desc) | Formatted activity cards | Returns empty state if fresh database | ORIGINAL_REQUEST.md § R3.2 |
| 9 | Content: Banners | Banner CRUD | Create, read, update, delete promotional hero banners with responsive images | Title, subtitle, desktop image, mobile image, CTA, sortOrder | Banner entity | HTTP 400 Invalid URL/missing fields | ORIGINAL_REQUEST.md § R3.3 |
| 10 | Content: Banners | Banner Active Toggle | Instantly toggle public visibility of banner from table view | `bannerId`, `isActive` (boolean) | Updated banner state | HTTP 404 Banner not found | ORIGINAL_REQUEST.md § R3.3 |
| 11 | Content: Hairstyles | Category Management | Manage haircut categories with gender segregation (`MALE`, `FEMALE`, `UNISEX`) | `name`, `slug`, `gender`, `description`, `iconUrl` | Category entity | HTTP 409 Duplicate category slug | ORIGINAL_REQUEST.md § R3.3 |
| 12 | Content: Hairstyles | Hairstyle CRUD | Complete cataloging of hairstyles with face shapes, hair length, texture, and care tips | Name, slug, categoryId, faceShapes, hairTextures, images, pricing | Hairstyle entity | HTTP 400 Missing required attributes, duplicate slug | ORIGINAL_REQUEST.md § R3.3 |
| 13 | Content: Hairstyles | Hairstyle Gallery Upload | Upload primary cover and multiple angle gallery images | File blobs / Cloudinary image URLs | Stored image array | HTTP 413 File too large (>5MB), HTTP 415 Invalid MIME type | ORIGINAL_REQUEST.md § R3.3, R4 |
| 14 | Content: Colors | Hair Color Swatch CRUD | Manage hair dye swatches with hex codes, undertones, bleach requirements, and skin tone match | Name, hexCode, tone, colorGroup, requiresBleaching, bleachingLevel, tips | HairColor entity | HTTP 400 Invalid hex format, missing bleach level | ORIGINAL_REQUEST.md § R3.3 |
| 15 | Content: Colors | Bleaching Level Advisor | Associates color swatch with required bleaching stages (Levels 1-3, 4-6, 7+) | `bleachingLevel`, `requiresBleaching` | Enriched swatch object | Enforces bleach level selection if `requiresBleaching=true` | ORIGINAL_REQUEST.md § R1.3, R3.3 |
| 16 | Content: Before/After | Before/After Showcase CRUD| Manage transformation stories with dual before/after photos and technique notes | Title, beforeImage, afterImage, customerName, stylist, serviceId | BeforeAfter entity | HTTP 400 Missing before or after photo | ORIGINAL_REQUEST.md § R3.3 |
| 17 | Content: Before/After | Dual-Image Split Slider Preview| Interactive preview in admin to align and inspect dual images before publishing | Image URLs | Rendered split-view slider | Displays placeholder if image fails loading | ORIGINAL_REQUEST.md § R1.4, R3.3 |
| 18 | Content: Services | Service CRUD | Manage salon service menu, execution duration (mins), base/max prices, procedure steps | Name, category, duration, basePrice, maxPrice, stepDetails | Service entity | HTTP 400 Invalid price range (`basePrice > maxPrice`) | ORIGINAL_REQUEST.md § R3.3 |
| 19 | Content: Services | Service Combo Bundling | Create bundled packages with auto-calculated savings percentage | Name, selected serviceIds, comboPrice, promoTag | ServiceCombo entity | HTTP 400 Combo price must be less than sum of services | ORIGINAL_REQUEST.md § R3.3 |
| 20 | Content: Articles | SEO Article CRUD | Rich text authoring for hair care guides, trends, with cover image and tags | Title, slug, excerpt, content, coverImage, category, tags | Article entity | HTTP 400 Missing title or content | ORIGINAL_REQUEST.md § R3.3 |
| 21 | Content: Articles | SEO Meta & Social Preview | Custom meta title, description, and live Google / Open Graph share snippet preview | `metaTitle`, `metaDescription`, `ogImageUrl` | Preview simulation card | Highlights warnings if description > 160 chars | ORIGINAL_REQUEST.md § R3.3 |
| 22 | Content: Articles | Publishing Workflow | Draft, Published, and Archived lifecycle for editorial content | `status` (`DRAFT`/`PUBLISHED`), `publishedAt` | Updated article state | Non-admins cannot publish directly if role=EDITOR | ORIGINAL_REQUEST.md § R3.1, R3.3 |
| 23 | Appointments | Booking List & Multi-filter | Filter bookings by date range, status, stylist, service with pagination | Date query, status filter, keyword, page, limit | Paginated booking list + total count | Graceful fallback to empty list | ORIGINAL_REQUEST.md § R3.4 |
| 24 | Appointments | Booking Status Transition | State machine transition (`PENDING` -> `CONFIRMED` -> `COMPLETED`/`CANCELLED`/`NO_SHOW`) | `bookingId`, `targetStatus`, `cancellationReason` | Updated booking record + audit log | HTTP 400 Invalid transition (e.g. from `COMPLETED`) | ORIGINAL_REQUEST.md § R3.4 |
| 25 | Appointments | Stylist Assignment | Assign or re-assign lead stylist to confirmed booking | `bookingId`, `stylistId/stylistName` | Updated booking assignment | HTTP 404 Stylist not found, schedule clash warning | ORIGINAL_REQUEST.md § R3.4 |
| 26 | Appointments | Internal Staff Notes | Append timestamped operational notes to booking history | `bookingId`, `noteText` | Updated internal notes array | HTTP 400 Empty note text | ORIGINAL_REQUEST.md § R3.4 |
| 27 | Appointments | Booking Detail Modal | Full customer record view: reference hairstyle, requested service, customer notes | `bookingId` | Detailed booking view | HTTP 404 Booking not found | ORIGINAL_REQUEST.md § R3.4 |
| 28 | Site Settings | Brand & Contact Settings | Update salon name, hotline, address, Google Maps iframe embed, and business hours | Form data key-values | Updated SiteSetting row + cache flush | HTTP 400 Invalid phone or email format | ORIGINAL_REQUEST.md § R3.5 |
| 29 | Site Settings | Social Profiles & SEO Defaults| Configure global social links (FB, IG, TikTok, Zalo) and default OpenGraph image | Social URLs, default SEO tags | Persisted config object | HTTP 400 Invalid URL formats | ORIGINAL_REQUEST.md § R3.5 |
| 30 | Site Settings | Emergency Closure / Banner | Toggle top-bar emergency announcement banner or temporary salon closure | `emergency_banner_active`, `text` | Updated announcement banner | Enforces non-empty text if active is true | ORIGINAL_REQUEST.md § R3.5 |
| 31 | Audit Logs | System Audit Trail Viewer | Searchable, filterable log of administrative actions with payload diffs | Filters (actor, action, entity, date range) | Paginated audit records | HTTP 403 if role is not SUPER_ADMIN | ORIGINAL_REQUEST.md § R3.6 |
| 32 | Audit Logs | Audit Log CSV Export | Exports filtered audit log entries into CSV file for compliance auditing | Query filters | Downloadable CSV file | HTTP 403 Forbidden for non-super admins | ORIGINAL_REQUEST.md § R3.6 |
| 33 | Image Storage | Object Storage Abstraction | Uploads administrative assets to Cloudinary/Supabase without local disk writes | Binary file / base64 | Remote secure URL | HTTP 400 File too large, HTTP 500 Upload failure | ORIGINAL_REQUEST.md § R4 |

---

## 9. Edge Cases & Error Handling Matrix

| # | Feature | Input / Edge Condition | Observed Behavior & Handling |
|---|---------|------------------------|------------------------------|
| 1 | Admin Login | 5 consecutive failed login attempts within 10 minutes | System temporarily throttles IP/account with 15-minute lockout; returns `429 Too Many Requests` with friendly retry timer. Emits `AUTH_LOGIN_FAILED` audit entry. |
| 2 | Admin Login | Session cookie expired while staff was filling an extended form | Form submission returns `401 Unauthorized`. Frontend intercepts 401, saves current form state in `sessionStorage`, prompts quick login dialog, and resumes submission without data loss. |
| 3 | RBAC API Guard | `BOOKING_STAFF` attempts to call `POST /api/admin/banners` via direct curl | Server-side guard detects role mismatch, aborts execution before DB query, returns `403 Forbidden` with `{ success: false, error: "FORBIDDEN" }`. Emits security alert log. |
| 4 | Hairstyle Slug | Two hairstyles created with identical name: "Layer Hàn Quốc" | Slug generator checks uniqueness in DB; automatically appends numeric increment (e.g., `layer-han-quoc-2`) to avoid unique constraint violations. |
| 5 | Hairstyle Deletion | Admin attempts to delete a hairstyle referenced in active bookings | Foreign key integrity check prevents hard delete; system prompts for soft-delete (`isActive = false`) to preserve historical booking records. |
| 6 | Color Swatch Hex | User enters invalid hex format (e.g. `#GG1234` or `blue`) | Zod validation rejects input on client and server: "Mã màu Hex không hợp lệ (định dạng đúng: #RRGGBB)". |
| 7 | Before/After Dual Image | Uploaded 'Before' and 'After' images have vastly different aspect ratios (e.g. 16:9 vs 9:16) | Admin image uploader presents crop/aspect alignment tool to ensure 1:1 or 4:5 uniformity for smooth split-slider rendering. |
| 8 | Service Pricing | Admin sets `basePrice = 500,000đ` and `maxPrice = 300,000đ` | Zod `.refine()` rule triggers: "Giá tối đa không được nhỏ hơn giá cơ bản". Form highlights field in red. |
| 9 | Service Combo | Sum of individual service prices is 800,000đ, admin enters combo price of 900,000đ | System flags warning: "Giá combo cao hơn tổng giá gốc (800.000đ)". Allows save only if explicitly confirmed or auto-calculates savings percentage. |
| 10 | Booking Status | Staff attempts to move booking directly from `CANCELLED` back to `CONFIRMED` | State machine rejects illegal transition: "Lịch hẹn đã hủy không thể chuyển sang đã xác nhận. Vui lòng tạo lịch hẹn mới hoặc yêu cầu Super Admin mở lại." |
| 11 | Booking Status | Staff moves booking to `CONFIRMED` without assigning stylist | Allowed; system sets default to "Salon sắp xếp" (Unassigned / Any available stylist) with a visual reminder on the booking card. |
| 12 | Booking Filter | Receptionist searches for phone number formatted with spaces/dashes (e.g. `090-123-4567`) | Backend regex strips all non-numeric characters before performing DB `contains` query on `customerPhone`. |
| 13 | Site Settings Embed | Admin pastes entire `<iframe src="..."></iframe>` into Google Maps URL field | URL parser sanitizes and extracts only the clean `src` attribute URL to prevent HTML injection and broken iframes. |
| 14 | Article Publishing | `EDITOR` attempts to toggle article status from `DRAFT` to `PUBLISHED` | API rejects with `403 Forbidden`: "Tài khoản Editor chỉ có thể lưu bản nháp. Cần Content Admin hoặc Super Admin phê duyệt xuất bản." |
| 15 | Audit Log Tampering | Direct DB or API attempt to modify an existing AuditLog row | Prisma model has no `update` or `delete` methods exposed; API returns `405 Method Not Allowed`. |
| 16 | Large Image Upload | User attempts to upload 25MB raw camera RAW/PNG file | Client uploader intercepts, validates file size (max 5MB), and auto-converts to WebP or rejects with: "Dung lượng ảnh tối đa 5MB". |
| 17 | Concurrent Status Update | Two receptionists open the same pending booking and update status simultaneously | Optimistic concurrency control (or database row lock) verifies `updatedAt`; second submission receives notification: "Lịch hẹn đã được cập nhật bởi nhân viên khác, đang làm mới dữ liệu." |

---

## 10. Database Schema Mapping (Prisma Schema for Admin CMS)

To ensure seamless implementation by the development team, the following Prisma models directly support all Admin CMS specifications:

```prisma
// Enum Definitions
enum Role {
  SUPER_ADMIN
  CONTENT_ADMIN
  BOOKING_STAFF
  EDITOR
}

enum Gender {
  MALE
  FEMALE
  UNISEX
}

enum HairLength {
  SHORT
  MEDIUM
  LONG
}

enum MaintenanceLevel {
  EASY
  MODERATE
  HIGH
}

enum ColorTone {
  WARM
  COOL
  NEUTRAL
}

enum ColorGroup {
  BROWN
  BLONDE
  ASH
  RED
  PASTEL
  BLACK
  FASHION
}

enum BrightnessLevel {
  LIGHT
  MEDIUM
  DARK
}

enum BleachingLevel {
  LEVEL_NONE
  LEVEL_1_TO_3
  LEVEL_4_TO_6
  LEVEL_7_PLUS
}

enum BookingStatus {
  PENDING
  CONFIRMED
  COMPLETED
  CANCELLED
  NO_SHOW
}

enum ArticleCategory {
  TRENDS
  HAIR_CARE
  COLOR_GUIDE
  SALON_NEWS
}

enum ArticleStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

// User & RBAC
model User {
  id           String     @id @default(cuid())
  email        String     @unique
  fullName     String
  passwordHash String
  role         Role       @default(EDITOR)
  isActive     Boolean    @default(true)
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
  articles     Article[]
  auditLogs    AuditLog[]

  @@map("users")
}

// Banners
model Banner {
  id              String    @id @default(cuid())
  title           String
  subtitle        String?
  desktopImageUrl String
  mobileImageUrl  String?
  ctaText         String?
  ctaLink         String?
  sortOrder       Int       @default(0)
  isActive        Boolean   @default(true)
  startDate       DateTime?
  endDate         DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@map("banners")
}

// Categories & Hairstyles
model Category {
  id          String      @id @default(cuid())
  name        String
  slug        String      @unique
  gender      Gender      @default(UNISEX)
  description String?
  iconUrl     String?
  sortOrder   Int         @default(0)
  isActive    Boolean     @default(true)
  hairstyles  Hairstyle[]
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  @@map("categories")
}

model Hairstyle {
  id               String           @id @default(cuid())
  name             String
  slug             String           @unique
  categoryId       String
  category         Category         @relation(fields: [categoryId], references: [id])
  gender           Gender           @default(UNISEX)
  styleTag         String
  hairLength       HairLength
  faceShapes       String[]         // JSON / Array of compatible face shapes
  hairTextures     String[]         // JSON / Array of textures
  maintenanceLevel MaintenanceLevel @default(MODERATE)
  priceEstimated   String?
  description      String
  careInstructions String?
  coverImage       String
  galleryImages    String[]
  isFeatured       Boolean          @default(false)
  isActive         Boolean          @default(true)
  viewCount        Int              @default(0)
  beforeAfters     BeforeAfter[]
  services         Service[]        @relation("HairstyleServices")
  createdAt        DateTime         @default(now())
  updatedAt        DateTime         @updatedAt

  @@map("hairstyles")
}

// Hair Colors
model HairColor {
  id                String          @id @default(cuid())
  name              String
  slug              String          @unique
  hexCode           String
  tone              ColorTone
  colorGroup        ColorGroup
  brightnessLevel   BrightnessLevel
  requiresBleaching Boolean         @default(false)
  bleachingLevel    BleachingLevel?
  suitableSkinTones String[]
  maintenanceTips   String?
  sampleImageUrl    String
  isTrending        Boolean         @default(false)
  isActive          Boolean         @default(true)
  sortOrder         Int             @default(0)
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt

  @@map("hair_colors")
}

// Before & After Showcases
model BeforeAfter {
  id              String     @id @default(cuid())
  title           String
  beforeImageUrl  String
  afterImageUrl   String
  customerName    String?
  stylistName     String?
  serviceId       String?
  service         Service?   @relation(fields: [serviceId], references: [id])
  hairstyleId     String?
  hairstyle       Hairstyle? @relation(fields: [hairstyleId], references: [id])
  description     String?
  techniqueUsed   String?
  durationMinutes Int?
  isFeatured      Boolean    @default(false)
  isActive        Boolean    @default(true)
  sortOrder       Int        @default(0)
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt

  @@map("before_afters")
}

// Services & Combos
model Service {
  id              String         @id @default(cuid())
  name            String
  slug            String         @unique
  category        String         // Haircut, Perm, Color, Treatment, etc.
  description     String
  durationMinutes Int            @default(45)
  basePrice       Int
  maxPrice        Int?
  stepDetails     String?        // Procedure steps
  prepNotes       String?
  aftercareNotes  String?
  isFeatured      Boolean        @default(false)
  isActive        Boolean        @default(true)
  sortOrder       Int            @default(0)
  combos          ServiceCombo[] @relation("ComboServices")
  hairstyles      Hairstyle[]    @relation("HairstyleServices")
  beforeAfters    BeforeAfter[]
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  @@map("services")
}

model ServiceCombo {
  id                 String    @id @default(cuid())
  name               String
  slug               String    @unique
  services           Service[] @relation("ComboServices")
  comboPrice         Int
  originalTotalPrice Int
  savingsPercentage  Int       @default(0)
  durationMinutes    Int       @default(120)
  badgeText          String?
  isActive           Boolean   @default(true)
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt

  @@map("service_combos")
}

// Articles & SEO
model Article {
  id              String          @id @default(cuid())
  title           String
  slug            String          @unique
  excerpt         String
  content         String
  coverImageUrl   String
  authorId        String
  author          User            @relation(fields: [authorId], references: [id])
  category        ArticleCategory @default(TRENDS)
  tags            String[]
  metaTitle       String?
  metaDescription String?
  metaKeywords    String?
  ogImageUrl      String?
  status          ArticleStatus   @default(DRAFT)
  publishedAt     DateTime?
  viewCount       Int             @default(0)
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  @@map("articles")
}

// Bookings & Appointments
model Booking {
  id                 String        @id @default(cuid())
  bookingCode        String        @unique // e.g. BK-20261019-1234
  customerName       String
  customerPhone      String
  customerEmail      String?
  serviceName        String        // Snapshot of service booked
  serviceId          String?
  referenceHairstyle String?       // Hairstyle title or ID selected
  stylistPreference  String?       // Customer preference
  assignedStylist    String?       // Staff member assigned
  appointmentDate    DateTime      // Booking date
  appointmentTime    String        // Slot: e.g. "14:30"
  status             BookingStatus @default(PENDING)
  customerNotes      String?
  internalNotes      String?       // Appended staff logs
  cancellationReason String?
  createdAt          DateTime      @default(now())
  updatedAt          DateTime      @updatedAt

  @@index([appointmentDate, status])
  @@index([customerPhone])
  @@map("bookings")
}

// Site Settings
model SiteSetting {
  id        String   @id @default(cuid())
  key       String   @unique
  value     String   // Can store strings, numbers, or JSON
  category  String   // BRANDING, CONTACT, HOURS, SOCIAL, SEO, FOOTER
  updatedAt DateTime @updatedAt

  @@map("site_settings")
}

// Audit Logs
model AuditLog {
  id        String   @id @default(cuid())
  userId    String?
  user      User?    @relation(fields: [userId], references: [id])
  userName  String?
  userRole  String?
  action    String
  entity    String
  entityId  String?
  details   Json?
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())

  @@index([createdAt])
  @@index([entity, entityId])
  @@map("audit_logs")
}
```

---

## 11. Acceptance & Verification Criteria for Admin CMS (R3)

To ensure 100% compliance during implementation and testing phases, the following verification tests must pass:

1. **Authentication & Session Test**:
   - `GET /admin` without session cookie -> Must return HTTP 302 Redirect to `/admin/login`.
   - `POST /api/admin/auth/login` with valid credentials -> Returns HTTP 200 and sets `Set-Cookie` with `HttpOnly; SameSite=Lax`.
   - `GET /admin` with valid session cookie -> Renders dashboard successfully.
2. **RBAC Endpoint Protection Test**:
   - Request `POST /api/admin/banners` with `BOOKING_STAFF` token -> Must return HTTP 403 Forbidden.
   - Request `PATCH /api/admin/appointments/[id]/status` with `BOOKING_STAFF` token -> Must return HTTP 200 OK.
   - Request `GET /api/admin/audit-logs` with `EDITOR` token -> Must return HTTP 403 Forbidden.
3. **Dashboard Real-time Telemetry Test**:
   - Create a booking via public API -> Admin dashboard counter `pendingConfirmationCount` increments immediately.
   - Change booking status to `CONFIRMED` -> Pending counter decrements, today confirmed counter increments.
4. **Content CRUD Verification**:
   - Create a new hairstyle with full fields -> Appears immediately in `/admin/hairstyles` table and on Public Thư viện kiểu tóc (`/hairstyles`).
   - Edit hair color swatch hex and tone -> Changes reflect immediately on public Color Consultation page (`/hair-colors`).
   - Create Before/After showcase with dual images -> Renders on Admin preview and Public Before/After slider (`/before-after`).
5. **Appointment Lifecycle Test**:
   - Valid transition: `PENDING` -> `CONFIRMED` -> `COMPLETED`. Verified via status badge and audit trail.
   - Invalid transition: Attempting to move `CANCELLED` directly to `COMPLETED` -> Throws validation error.
   - Assigning stylist and adding internal note -> Successfully saved and displayed in booking detail view.
6. **Site Settings Test**:
   - Update `brand_name` or `hotline` in `/admin/settings` -> Public header and footer reflect updated phone/name immediately upon refresh.
7. **Audit Log Verification**:
   - Changing an appointment status creates an immutable `AuditLog` row with actor ID, timestamp, and diff payload.
