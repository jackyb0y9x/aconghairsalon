# Technical Blueprint: Showcases, Services & Editorial Operations (Milestone 3)

**Author:** M3 Explorer 2 (Showcases, Services & Editorial Specialist)  
**Date:** 2026-10-19  
**Status:** Complete  
**Scope:** Before/After Showcases (`/admin/before-after`), Services & Combos (`/admin/services`), News & Articles (`/admin/articles`)

---

## 1. Executive Summary & Scope

Milestone 3 establishes the administrative content engine of Lumière Hair Atelier. This blueprint delivers the complete technical design for three core operational domains:

1. **Before/After Showcases (`/admin/before-after`)**:
   - Visual transformation management with dual-image comparison (Before & After).
   - Relational linkage to Services (`serviceId`), Hairstyles (`hairstyleId`), and performing Stylists (`stylistId` -> `User`).
   - Homepage promotion toggling (`isFeatured`) and display ordering (`displayOrder`).
   - Interactive slider preview component within the admin interface.

2. **Services & Combos (`/admin/services`)**:
   - Single service management: duration, transparent price tiers (`priceMin`, `priceMax`), pre-care advice, post-care advice, category grouping (`type: SERVICE`), and popularity flags.
   - Combo package management: bundled services (M:N), package price vs. original price, duration, and automatic savings percentage calculation.
   - Dual-mapping API serialization supporting both Prisma relational conventions and E2E test assertions (`name` / `title`, `minPrice` / `priceMin`, `maxPrice` / `priceMax`).

3. **News & Articles (`/admin/articles`)**:
   - Editorial workflow with draft/published state management (`isPublished`, `publishedAt`).
   - High-performance Rich Markdown Editor with visual formatting toolbar, side-by-side live preview, word counter, and reading time estimation.
   - Comprehensive SEO metadata suite (`metaTitle`, `metaDescription`, `metaKeywords`, `tags`, slug auto-generation).
   - Real-time Google SERP Snippet Preview and Social Open Graph Card simulators.

4. **Cross-Cutting Subsystems**:
   - Unified cloud image upload endpoint (`/api/admin/upload`) using `StorageProvider`.
   - Immutable audit logging via `logAuditEvent` in `services/audit.ts` for all mutation events (`CREATE`, `UPDATE`, `DELETE`, `STATUS_CHANGE`).
   - Strict 4-tier RBAC enforcement (`SUPER_ADMIN`, `CONTENT_ADMIN`, `EDITOR`) based on `lib/auth.ts`.
   - Next.js ISR cache invalidation (`revalidatePath`).

---

## 2. RBAC & Security Matrix

Per `PROJECT.md` and `lib/auth.ts`, the access permissions for these domains are strictly partitioned:

| Module / Endpoint | Allowed Roles | Forbidden Roles | Guard Location |
|---|---|---|---|
| `/admin/before-after` | `SUPER_ADMIN`, `CONTENT_ADMIN` | `BOOKING_STAFF`, `EDITOR` | `requireAdmin(['SUPER_ADMIN', 'CONTENT_ADMIN'])` |
| `/api/admin/before-after/*` | `SUPER_ADMIN`, `CONTENT_ADMIN` | `BOOKING_STAFF`, `EDITOR` (403) | `authenticateAdminRequest(req)` |
| `/admin/services` | `SUPER_ADMIN`, `CONTENT_ADMIN` | `BOOKING_STAFF`, `EDITOR` | `requireAdmin(['SUPER_ADMIN', 'CONTENT_ADMIN'])` |
| `/api/admin/services/*` | `SUPER_ADMIN`, `CONTENT_ADMIN` | `BOOKING_STAFF`, `EDITOR` (403) | `authenticateAdminRequest(req)` |
| `/admin/articles` | `SUPER_ADMIN`, `CONTENT_ADMIN`, `EDITOR` | `BOOKING_STAFF` | `requireAdmin(['SUPER_ADMIN', 'CONTENT_ADMIN', 'EDITOR'])` |
| `/api/admin/articles/*` | `SUPER_ADMIN`, `CONTENT_ADMIN`, `EDITOR` | `BOOKING_STAFF` (403) | `authenticateAdminRequest(req)` |
| `/api/admin/upload` | `SUPER_ADMIN`, `CONTENT_ADMIN`, `EDITOR` | `BOOKING_STAFF` (403) | `authenticateAdminRequest(req)` |

*Note:* Unauthenticated requests to any `/api/admin/*` endpoint strictly receive HTTP 401 Unauthorized (`TC1.27`). Non-permitted roles receive HTTP 403 Forbidden (`TC2.14`, `TC2.15`, `TC2.16`).

---

## 3. Domain 1: Before/After Showcases (`/admin/before-after`)

### 3.1 Data Model Alignment (`prisma/schema.prisma`)

```prisma
model BeforeAfter {
  id             String        @id @default(uuid())
  title          String
  description    String?       @db.Text
  beforeImageUrl String
  afterImageUrl  String
  customerGender GenderTarget  @default(UNISEX)
  
  serviceId      String?
  service        Service?      @relation(fields: [serviceId], references: [id], onDelete: SetNull)
  
  hairstyleId    String?
  hairstyle      Hairstyle?    @relation(fields: [hairstyleId], references: [id], onDelete: SetNull)
  
  stylistId      String?
  stylist        User?         @relation("StylistBeforeAfter", fields: [stylistId], references: [id], onDelete: SetNull)

  isFeatured     Boolean       @default(false)
  displayOrder   Int           @default(0)
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  @@index([serviceId, hairstyleId])
  @@index([isFeatured])
  @@index([displayOrder])
  @@map("before_afters")
}
```

### 3.2 Zod Validation Schema (`lib/validations/before-after.ts`)

```typescript
import { z } from 'zod';

export const GenderTargetEnum = z.enum(['MALE', 'FEMALE', 'UNISEX']);

export const BeforeAfterCreateSchema = z.object({
  title: z.string().min(3, 'Tiêu đề tối thiểu 3 ký tự').max(200, 'Tiêu đề tối đa 200 ký tự'),
  description: z.string().max(2000, 'Mô tả tối đa 2000 ký tự').optional().nullable(),
  beforeImageUrl: z.string().min(1, 'Ảnh trước biến hóa là bắt buộc'),
  afterImageUrl: z.string().min(1, 'Ảnh sau biến hóa là bắt buộc'),
  customerGender: GenderTargetEnum.default('UNISEX'),
  serviceId: z.string().uuid('ID dịch vụ không hợp lệ').optional().nullable(),
  hairstyleId: z.string().uuid('ID kiểu tóc không hợp lệ').optional().nullable(),
  stylistId: z.string().uuid('ID stylist không hợp lệ').optional().nullable(),
  isFeatured: z.boolean().default(false),
  displayOrder: z.coerce.number().int().min(0).default(0),
});

export const BeforeAfterUpdateSchema = BeforeAfterCreateSchema.partial();

export type BeforeAfterCreateInput = z.infer<typeof BeforeAfterCreateSchema>;
export type BeforeAfterUpdateInput = z.infer<typeof BeforeAfterUpdateSchema>;

export function serializeBeforeAfter(item: any) {
  if (!item) return null;
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    beforeImageUrl: item.beforeImageUrl,
    afterImageUrl: item.afterImageUrl,
    customerGender: item.customerGender,
    isFeatured: item.isFeatured,
    displayOrder: item.displayOrder,
    serviceId: item.serviceId,
    service: item.service ? { id: item.service.id, title: item.service.title, slug: item.service.slug } : null,
    hairstyleId: item.hairstyleId,
    hairstyle: item.hairstyle ? { id: item.hairstyle.id, title: item.hairstyle.title, slug: item.hairstyle.slug } : null,
    stylistId: item.stylistId,
    stylist: item.stylist ? { id: item.stylist.id, fullName: item.stylist.fullName, avatarUrl: item.stylist.avatarUrl } : null,
    createdAt: item.createdAt instanceof Date ? item.createdAt.toISOString() : item.createdAt,
    updatedAt: item.updatedAt instanceof Date ? item.updatedAt.toISOString() : item.updatedAt,
  };
}
```

### 3.3 API Route Handlers

#### 1. `GET /api/admin/before-after`
- Query Parameters: `page` (default 1), `pageSize` (default 20), `search`, `serviceId`, `hairstyleId`, `gender`, `isFeatured`.
- Prisma Query:
  ```typescript
  const [total, items] = await Promise.all([
    prisma.beforeAfter.count({ where }),
    prisma.beforeAfter.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: [{ isFeatured: 'desc' }, { displayOrder: 'asc' }, { createdAt: 'desc' }],
      include: {
        service: { select: { id: true, title: true, slug: true } },
        hairstyle: { select: { id: true, title: true, slug: true } },
        stylist: { select: { id: true, fullName: true, avatarUrl: true } },
      },
    }),
  ]);
  ```
- Output: `{ items: items.map(serializeBeforeAfter), pagination: { total, page, pageSize, totalPages } }`.

#### 2. `POST /api/admin/before-after`
- Auth Guard: `authenticateAdminRequest(request)` -> only `SUPER_ADMIN` and `CONTENT_ADMIN`.
- Validation: `BeforeAfterCreateSchema.safeParse(body)`.
- Action:
  ```typescript
  const created = await prisma.beforeAfter.create({
    data: parseResult.data,
    include: { service: true, hairstyle: true, stylist: true },
  });
  await logAuditEvent({
    userId: user.id,
    userEmail: user.email,
    userName: user.fullName,
    userRole: user.role.name,
    action: 'CREATE',
    entity: 'BEFORE_AFTER',
    entityId: created.id,
    details: { title: created.title, serviceId: created.serviceId, stylistId: created.stylistId },
    ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
    userAgent: request.headers.get('user-agent'),
  });
  revalidatePath('/admin/before-after');
  revalidatePath('/before-after');
  revalidatePath('/');
  return NextResponse.json(serializeBeforeAfter(created), { status: 201 });
  ```

#### 3. `GET, PUT, DELETE /api/admin/before-after/[id]`
- `GET`: Returns single item with full relational details.
- `PUT`: Validates `BeforeAfterUpdateSchema`. Records audit diff (`before` vs `after`). Revalidates paths.
- `DELETE`: Verifies existence (returns 404 if not found). Deletes record. Records `DELETE` audit event. Revalidates paths.

#### 4. `PATCH /api/admin/before-after/[id]/feature`
- Quick toggle for homepage featured status:
  ```typescript
  const item = await prisma.beforeAfter.findUnique({ where: { id } });
  if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 });
  const updated = await prisma.beforeAfter.update({
    where: { id },
    data: { isFeatured: !item.isFeatured },
  });
  await logAuditEvent({
    action: 'STATUS_CHANGE',
    entity: 'BEFORE_AFTER',
    entityId: id,
    details: { field: 'isFeatured', from: item.isFeatured, to: updated.isFeatured },
    ...
  });
  revalidatePath('/');
  revalidatePath('/admin/before-after');
  return NextResponse.json(serializeBeforeAfter(updated));
  ```

### 3.4 Admin UI Architecture (`/admin/before-after`)

- **Page Component (`app/admin/before-after/page.tsx`)**:
  - Server Component guarded with `await requireAdmin(['SUPER_ADMIN', 'CONTENT_ADMIN'])`.
  - Parallel server data fetching for dropdown options:
    - `prisma.service.findMany({ select: { id: true, title: true } })`
    - `prisma.hairstyle.findMany({ select: { id: true, title: true } })`
    - `prisma.user.findMany({ where: { isStylist: true }, select: { id: true, fullName: true } })`
- **Client Management Table (`components/admin/BeforeAfterTableClient.tsx`)**:
  - Filter bar: Search input, Service dropdown, Gender tabs (`Tất cả`, `Nam`, `Nữ`, `Unisex`), Featured toggle filter.
  - Table / Card hybrid layout:
    - Side-by-side thumbnails (Before & After) with hover zoom.
    - Title, performing stylist badge, linked service & hairstyle badges.
    - Quick "Featured" star button with instant optimistic UI toggle.
    - Action buttons: "Xem thử thanh trượt" (opens slider modal), "Chỉnh sửa", "Xóa".
- **Interactive Before/After Comparison Preview (`components/admin/BeforeAfterSliderPreview.tsx`)**:
  - Split-view slider with drag handle, allowing admin staff to test how the before/after pair looks in motion before publishing.
- **Showcase Modal Form (`components/admin/BeforeAfterFormModal.tsx`)**:
  - React Hook Form + Zod resolver.
  - Dual `ImageUploadDropzone` components for Before Image and After Image.
  - Form fields: Title, Narrative description, Gender radio pills, Service dropdown, Hairstyle dropdown, Stylist dropdown, Display Order input, Featured checkbox.

---

## 4. Domain 2: Services & Combos (`/admin/services`)

### 4.1 Data Model Alignment (`prisma/schema.prisma`)

```prisma
model Service {
  id              String        @id @default(uuid())
  title           String
  slug            String        @unique
  shortSummary    String?       @db.VarChar(500)
  description     String        @db.Text
  durationMinutes Int           @default(45)
  priceMin        Decimal       @db.Decimal(12, 2)
  priceMax        Decimal?      @db.Decimal(12, 2)
  preCareAdvice   String?       @db.Text
  postCareAdvice  String?       @db.Text
  imageUrl        String?
  isPopular       Boolean       @default(false)
  isActive        Boolean       @default(true)
  displayOrder    Int           @default(0)

  categoryId      String
  category        Category      @relation(fields: [categoryId], references: [id], onDelete: Restrict)

  hairstyles      Hairstyle[]   // Implicit M:N
  combos          ServiceCombo[] // Implicit M:N
  bookings        Booking[]
  beforeAfters    BeforeAfter[]
  ...
}

model ServiceCombo {
  id              String        @id @default(uuid())
  title           String
  slug            String        @unique
  description     String        @db.Text
  packagePrice    Decimal       @db.Decimal(12, 2)
  originalPrice   Decimal       @db.Decimal(12, 2)
  durationMinutes Int           @default(120)
  savingsPercent  Int?
  imageUrl        String?
  isActive        Boolean       @default(true)
  isFeatured      Boolean       @default(false)
  displayOrder    Int           @default(0)

  services        Service[]     // Implicit M:N
  bookings        Booking[]
  ...
}
```

### 4.2 Compatibility Strategy for E2E Tests (TC1.11, TC1.5)

Existing E2E tests send payloads such as:
```typescript
const servicePayload = {
  name: 'Phục Hồi Tóc Hư Tổn Collagen Thủy Phân',
  category: 'TREATMENT',
  durationMinutes: 60,
  minPrice: 400000,
  maxPrice: 600000,
  description: 'Tái tạo liên kết tóc đứt gãy sau hóa chất với tinh chất collagen nano.'
};
```
And assert:
```typescript
expect(createRes.data.durationMinutes).toBe(60);
expect(createRes.data.category).toBe('TREATMENT');
```
**Architecture Solution:**
The serializer and request body handler implements a bi-directional dual-mapping layer:
1. `name` maps to `title` (and serialized as both `title` and `name`).
2. `minPrice` maps to `priceMin` (and serialized as both `priceMin` and `minPrice`).
3. `maxPrice` maps to `priceMax` (and serialized as both `priceMax` and `maxPrice`).
4. `category`: If a string like `'TREATMENT'` or category name is supplied, the handler dynamically finds or auto-creates a `Category` with `type: SERVICE` and `name: 'TREATMENT'`. In response, `category` returns the category string name, while `categoryId` contains the UUID foreign key.

### 4.3 Zod Validation Schema (`lib/validations/service.ts`)

```typescript
import { z } from 'zod';

export const ServiceCreateSchema = z.object({
  title: z.string().min(2, 'Tên dịch vụ tối thiểu 2 ký tự').max(150).optional(),
  name: z.string().min(2, 'Tên dịch vụ tối thiểu 2 ký tự').max(150).optional(),
  slug: z.string().min(2).max(150).optional(),
  shortSummary: z.string().max(500).optional().nullable(),
  description: z.string().min(10, 'Mô tả dịch vụ tối thiểu 10 ký tự'),
  durationMinutes: z.coerce.number().int().min(15, 'Thời lượng tối thiểu 15 phút').max(480),
  priceMin: z.coerce.number().min(0, 'Giá tối thiểu không được âm').optional(),
  minPrice: z.coerce.number().min(0, 'Giá tối thiểu không được âm').optional(),
  priceMax: z.coerce.number().min(0).optional().nullable(),
  maxPrice: z.coerce.number().min(0).optional().nullable(),
  preCareAdvice: z.string().optional().nullable(),
  postCareAdvice: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  categoryId: z.string().optional(),
  category: z.string().optional(),
  isPopular: z.boolean().default(false),
  isActive: z.boolean().default(true),
  displayOrder: z.coerce.number().int().min(0).default(0),
}).refine(data => data.title || data.name, {
  message: 'Tên dịch vụ là bắt buộc (title hoặc name)',
  path: ['title'],
});

export const ServiceUpdateSchema = ServiceCreateSchema.partial();

export const ServiceComboCreateSchema = z.object({
  title: z.string().min(2, 'Tên combo tối thiểu 2 ký tự').max(150).optional(),
  name: z.string().min(2).max(150).optional(),
  slug: z.string().min(2).max(150).optional(),
  description: z.string().min(10, 'Mô tả combo tối thiểu 10 ký tự'),
  packagePrice: z.coerce.number().min(0, 'Giá combo không hợp lệ'),
  originalPrice: z.coerce.number().min(0, 'Giá gốc không hợp lệ'),
  durationMinutes: z.coerce.number().int().min(30).max(600).default(120),
  savingsPercent: z.coerce.number().int().min(0).max(100).optional(),
  serviceIds: z.array(z.string().uuid()).min(1, 'Combo cần liên kết tối thiểu 1 dịch vụ'),
  imageUrl: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  displayOrder: z.coerce.number().int().min(0).default(0),
});

export const ServiceComboUpdateSchema = ServiceComboCreateSchema.partial();

export function serializeService(s: any) {
  if (!s) return null;
  const pMin = Number(s.priceMin);
  const pMax = s.priceMax !== null && s.priceMax !== undefined ? Number(s.priceMax) : null;
  const categoryName = s.category?.name || 'HAIR_SERVICE';

  return {
    id: s.id,
    title: s.title,
    name: s.title, // Test fixture alias
    slug: s.slug,
    shortSummary: s.shortSummary,
    description: s.description,
    durationMinutes: s.durationMinutes,
    priceMin: pMin,
    minPrice: pMin, // Test fixture alias
    priceMax: pMax,
    maxPrice: pMax, // Test fixture alias
    category: categoryName, // Test fixture alias
    categoryId: s.categoryId,
    categoryDetails: s.category ? { id: s.category.id, name: s.category.name, slug: s.category.slug } : null,
    preCareAdvice: s.preCareAdvice,
    postCareAdvice: s.postCareAdvice,
    imageUrl: s.imageUrl,
    isPopular: s.isPopular,
    isActive: s.isActive,
    displayOrder: s.displayOrder,
    createdAt: s.createdAt instanceof Date ? s.createdAt.toISOString() : s.createdAt,
    updatedAt: s.updatedAt instanceof Date ? s.updatedAt.toISOString() : s.updatedAt,
  };
}

export function serializeServiceCombo(c: any) {
  if (!c) return null;
  const pkgPrice = Number(c.packagePrice);
  const origPrice = Number(c.originalPrice);
  const computedSavings = c.savingsPercent ?? (origPrice > 0 ? Math.round(((origPrice - pkgPrice) / origPrice) * 100) : 0);

  return {
    id: c.id,
    title: c.title,
    name: c.title,
    slug: c.slug,
    description: c.description,
    packagePrice: pkgPrice,
    originalPrice: origPrice,
    durationMinutes: c.durationMinutes,
    savingsPercent: computedSavings,
    imageUrl: c.imageUrl,
    isActive: c.isActive,
    isFeatured: c.isFeatured,
    displayOrder: c.displayOrder,
    services: Array.isArray(c.services) ? c.services.map(serializeService) : [],
    createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : c.createdAt,
    updatedAt: c.updatedAt instanceof Date ? c.updatedAt.toISOString() : c.updatedAt,
  };
}
```

### 4.4 API Route Handlers

#### 1. `GET /api/admin/services`
- Supports query filters: `search`, `categoryId`, `isActive`, `isPopular`.
- If requested by test or internal fetch without pagination headers, returns `{ services: items, data: items, total: items.length }` ensuring backward and forward test compatibility.

#### 2. `POST /api/admin/services`
- Guard: `SUPER_ADMIN`, `CONTENT_ADMIN`.
- Resolves inputs:
  - Title: `input.title || input.name`
  - Slug: `input.slug || slugify(title)`
  - Price: `priceMin = input.priceMin ?? input.minPrice ?? 0`, `priceMax = input.priceMax ?? input.maxPrice ?? null`
  - Category: If `categoryId` is valid UUID, use it. If `category` string provided (e.g. `'TREATMENT'`), find or upsert a `Category` where `name = input.category` and `type = 'SERVICE'`.
- Audit Log: `logAuditEvent({ action: 'CREATE', entity: 'SERVICE', entityId: service.id, details: { title, durationMinutes, priceMin, category } })`.
- Cache Eviction: `revalidatePath('/services')`, `revalidatePath('/admin/services')`, `revalidatePath('/')`, `revalidatePath('/booking')`.
- Returns: HTTP 201 with `serializeService(service)`.

#### 3. `GET, PUT, DELETE /api/admin/services/[id]`
- `GET`: Returns single service with category and associated combos.
- `PUT`: Updates service. Records `UPDATE` audit log with full diff. Revalidates paths.
- `DELETE`: Checks for active future bookings referencing this service. If none, deletes service; if referenced, toggles `isActive: false` (soft-delete) with notification. Records `DELETE` audit event.

#### 4. `GET, POST /api/admin/services/combos`
- `GET`: Returns all service combos with included services.
- `POST`: Creates combo bundle. Connects service IDs via Prisma `{ services: { connect: serviceIds.map(id => ({ id })) } }`. Auto-calculates `savingsPercent`. Records `CREATE` audit log for `'SERVICE_COMBO'`.

#### 5. `GET, PUT, DELETE /api/admin/services/combos/[id]`
- Full CRUD for combo packages with audit logging and cache revalidation.

### 4.5 Admin UI Architecture (`/admin/services`)

- **Tabbed Interface (`app/admin/services/page.tsx`)**:
  - Tab 1: **Dịch vụ đơn lẻ (Single Services)** - Search, category filter, duration filter, sort by price. Table with columns: Thumbnail, Tên dịch vụ, Danh mục, Thời lượng, Khoảng giá (VND), Trạng thái (Phổ biến, Đang hoạt động), Thao tác (Sửa, Xóa).
  - Tab 2: **Gói Combo đặc quyền (Service Combos)** - Card view with luxury gold accent borders, savings pill (`Tiết kiệm 25%`), included service badges, original vs package price comparison, duration badge.
  - Tab 3: **Danh mục dịch vụ (Service Categories)** - Create/manage service taxonomy.
- **Service Form Modal (`components/admin/ServiceFormModal.tsx`)**:
  - Title & Slug auto-sync input.
  - Category selector dropdown with "+ Tạo nhanh danh mục" trigger.
  - Duration input with visual slider + formatted badge (`60 phút (1 giờ)`).
  - Dual price inputs with live VND currency formatter (`400,000 đ` - `600,000 đ`).
  - Image uploader with preview.
  - Accordion for "Hướng dẫn chuẩn bị trước khi làm (Pre-care)" and "Hướng dẫn chăm sóc sau dịch vụ (Post-care)".
  - Toggles for `isPopular` (Nổi bật) and `isActive` (Mở đặt lịch).
- **Service Combo Form Modal (`components/admin/ServiceComboFormModal.tsx`)**:
  - Combo name & description.
  - Multi-select checklist of available single services.
  - Auto-calculated total original price: Updates dynamically as services are checked.
  - Package price input with real-time savings percentage badge (`Tiết kiệm: 28% (600,000 đ)`).
  - Combo duration calculator: Auto-sums component durations with adjustable slider.

---

## 5. Domain 3: News & Articles (`/admin/articles`)

### 5.1 Data Model Alignment (`prisma/schema.prisma`)

```prisma
model Article {
  id              String    @id @default(uuid())
  title           String
  slug            String    @unique
  excerpt         String    @db.VarChar(500)
  content         String    @db.Text
  coverImageUrl   String
  tags            String[]
  
  metaTitle       String?
  metaDescription String?
  metaKeywords    String?

  authorId        String
  author          User      @relation("ArticleAuthor", fields: [authorId], references: [id], onDelete: Restrict)
  
  categoryId      String?
  category        Category? @relation(fields: [categoryId], references: [id], onDelete: SetNull)

  isPublished     Boolean   @default(false)
  publishedAt     DateTime?
  viewCount       Int       @default(0)

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([isPublished, publishedAt])
  @@index([slug])
  @@index([categoryId])
  @@map("articles")
}
```

### 5.2 Compatibility Strategy for E2E Tests (TC1.6, TC4.4)

In `tests/e2e/tier1-features/public.test.ts` (TC1.6):
```typescript
const article = res.data.articles[0];
expect(article.published).toBe(true);
expect(article.seoTitle).toContain('Bí Quyết Giữ Nếp Tóc Layer');
expect(article.seoDescription).toBeDefined();
```
In `tests/e2e/tier4-scenarios/content-management-lifecycle.test.ts` (TC4.4):
- The `EDITOR` role can author, update, and publish articles (`checkApiRbacPermission('EDITOR', '/api/admin/articles') === true`).
- `BOOKING_STAFF` is forbidden (`403`).

**Architecture Solution:**
The article serializer maps:
- `published: article.isPublished`
- `seoTitle: article.metaTitle || article.title`
- `seoDescription: article.metaDescription || article.excerpt`
- `authorName: article.author?.fullName || 'Lumière Editorial'`

### 5.3 Zod Validation Schema (`lib/validations/article.ts`)

```typescript
import { z } from 'zod';

export const ArticleCreateSchema = z.object({
  title: z.string().min(3, 'Tiêu đề bài viết tối thiểu 3 ký tự').max(200, 'Tiêu đề tối đa 200 ký tự'),
  slug: z.string().min(3).max(200).regex(/^[a-z0-9-]+$/, 'Slug chỉ gồm chữ thường, số và dấu gạch ngang').optional(),
  excerpt: z.string().min(10, 'Đoạn trích tóm tắt tối thiểu 10 ký tự').max(500, 'Đoạn trích tối đa 500 ký tự'),
  content: z.string().min(20, 'Nội dung bài viết tối thiểu 20 ký tự'),
  coverImageUrl: z.string().min(1, 'Ảnh bìa bài viết là bắt buộc'),
  tags: z.array(z.string()).default([]),
  
  // SEO Metadata
  metaTitle: z.string().max(100).optional().nullable(),
  metaDescription: z.string().max(300).optional().nullable(),
  metaKeywords: z.string().max(300).optional().nullable(),
  
  // Test fixture aliases
  seoTitle: z.string().max(100).optional().nullable(),
  seoDescription: z.string().max(300).optional().nullable(),
  
  // Editorial flags
  categoryId: z.string().uuid().optional().nullable(),
  authorId: z.string().uuid().optional(),
  isPublished: z.boolean().default(false),
  published: z.boolean().optional(),
});

export const ArticleUpdateSchema = ArticleCreateSchema.partial();

export type ArticleCreateInput = z.infer<typeof ArticleCreateSchema>;
export type ArticleUpdateInput = z.infer<typeof ArticleUpdateSchema>;

export function serializeArticle(a: any) {
  if (!a) return null;
  const isPub = a.isPublished ?? a.published ?? false;
  const sTitle = a.metaTitle || a.seoTitle || a.title;
  const sDesc = a.metaDescription || a.seoDescription || a.excerpt;

  return {
    id: a.id,
    title: a.title,
    slug: a.slug,
    excerpt: a.excerpt,
    content: a.content,
    coverImageUrl: a.coverImageUrl,
    tags: Array.isArray(a.tags) ? a.tags : [],
    
    // SEO fields + Aliases
    metaTitle: a.metaTitle,
    metaDescription: a.metaDescription,
    metaKeywords: a.metaKeywords,
    seoTitle: sTitle,
    seoDescription: sDesc,
    
    // Publication flags + Aliases
    isPublished: isPub,
    published: isPub,
    publishedAt: a.publishedAt instanceof Date ? a.publishedAt.toISOString() : a.publishedAt,
    viewCount: a.viewCount ?? 0,
    
    // Author & Category
    authorId: a.authorId,
    author: a.author ? { id: a.author.id, fullName: a.author.fullName, avatarUrl: a.author.avatarUrl } : null,
    authorName: a.author?.fullName || 'Lumière Editorial',
    categoryId: a.categoryId,
    category: a.category ? { id: a.category.id, name: a.category.name, slug: a.category.slug } : null,
    
    createdAt: a.createdAt instanceof Date ? a.createdAt.toISOString() : a.createdAt,
    updatedAt: a.updatedAt instanceof Date ? a.updatedAt.toISOString() : a.updatedAt,
  };
}
```

### 5.4 Rich Markdown & Content Editor Specification

#### 1. Architecture: Native Tailwind/Radix Markdown Editor (`components/admin/MarkdownEditor.tsx`)
Rather than pulling in heavy unvetted WYSIWYG packages, we construct an ultra-clean, reactive Markdown Studio optimized for beauty salon journalism:
- **Toolbar Actions**:
  - Headings: H2 (`## `), H3 (`### `)
  - Styling: Bold (`**`), Italic (`*`), Strikethrough (`~~`), Inline code (`` ` ``)
  - Layout: Blockquote (`> `), Bullet list (`- `), Numbered list (`1. `), Horizontal divider (`---`)
  - Media & Links: Link (`[Text](url)`), Image (`![Alt](url)` with integrated direct upload dialog)
  - Callout blocks: Salon Pro Tip (`> 💡 **Mẹo Salon:** ...`)
- **Dual Mode View**:
  - Tab 1: **Viết & Định dạng (Editor)** - Full textarea with keyboard shortcuts (Ctrl+B, Ctrl+I, Ctrl+K).
  - Tab 2: **Xem trước trực tiếp (Live Preview)** - Rendered typography styled with `@tailwindcss/typography` or custom luxury prose classes.
  - Tab 3: **Song song (Split View)** - Side-by-side editing and instantaneous rendering on large desktop screens.
- **Reading Metrics**:
  - Live Word Count (`X từ`).
  - Estimated Reading Time (`~X phút đọc` calculated at 200 words/min).
  - Character counter.

### 5.5 SEO Metadata Suite & SERP Simulator

#### 1. Interactive Google SERP Simulator (`components/admin/GoogleSerpPreview.tsx`)
Renders a pixel-accurate Google Search Result Card:
- Domain URL: `https://lumierehair.vn › blog › [slug]`
- SEO Title: Live preview with warning badge if length > 60 chars.
- SEO Description: Live preview with warning badge if length > 160 chars.
- Mobile vs Desktop SERP toggle.

#### 2. Open Graph / Social Media Card Preview
Renders the preview card for Facebook, Zalo, and Telegram share dialogs:
- Card banner: `coverImageUrl`.
- Domain label: `LUMIEREHAIR.VN`.
- Title: `metaTitle || title`.
- Excerpt: `metaDescription || excerpt`.

### 5.6 API Route Handlers (`/api/admin/articles`)

#### 1. `GET /api/admin/articles`
- Query filters: `search`, `categoryId`, `status` (`ALL`, `PUBLISHED`, `DRAFT`), `tag`, `page`, `pageSize`.
- RBAC: `SUPER_ADMIN`, `CONTENT_ADMIN`, `EDITOR`.
- Returns paginated list serialized via `serializeArticle`.

#### 2. `POST /api/admin/articles`
- RBAC: `SUPER_ADMIN`, `CONTENT_ADMIN`, `EDITOR`.
- Body validation: `ArticleCreateSchema.safeParse(body)`.
- Defaults `authorId` to the current session user ID if not explicitly specified.
- If `isPublished: true` or `published: true`, sets `publishedAt = new Date()`.
- Logs audit event: `logAuditEvent({ action: 'CREATE', entity: 'ARTICLE', entityId: article.id, details: { title: article.title, isPublished: article.isPublished } })`.
- Cache Eviction: `revalidatePath('/blog')`, `revalidatePath('/admin/articles')`, `revalidatePath('/')`.
- Returns: HTTP 201 with `serializeArticle(article)`.

#### 3. `GET, PUT, DELETE /api/admin/articles/[id]`
- `GET`: Returns full article including content.
- `PUT`: Updates article. If transitioned from draft to published, sets `publishedAt = new Date()`. Diff computation recorded in `UPDATE` audit log. Revalidates `/blog/[slug]`, `/blog`, `/admin/articles`.
- `DELETE`: Verifies article exists. Deletes record. Records `DELETE` audit log. Revalidates paths.

#### 4. `PATCH /api/admin/articles/[id]/publish`
- Quick one-click toggle between Published and Draft state.
- Records `STATUS_CHANGE` audit log.

### 5.7 Admin UI Architecture (`/admin/articles`)

- **Article Catalog Management (`app/admin/articles/page.tsx`)**:
  - Server Component guarded with `await requireAdmin(['SUPER_ADMIN', 'CONTENT_ADMIN', 'EDITOR'])`.
  - Metrics Header: Total Articles, Published count, Draft count, Total Blog Views.
  - Client Table (`components/admin/ArticlesTableClient.tsx`):
    - Search, Category filter, Status tabs (`Tất cả`, `Đã xuất bản`, `Bản nháp`).
    - Columns: Ảnh bìa, Tiêu đề bài viết & Slug, Chuyên mục, Tác giả, Lượt xem, Trạng thái xuất bản (Badge), Ngày đăng, Thao tác (Chỉnh sửa, Bật/Tắt xuất bản, Xem trước, Xóa).
- **Article Editor Page (`app/admin/articles/new/page.tsx`, `app/admin/articles/[id]/page.tsx`)**:
  - Comprehensive 2-column layout:
    - **Main Left Column (65% width)**:
      - Title input (Large font, auto-generates slug).
      - Slug input with lock/unlock toggle.
      - Short Excerpt textarea (500 chars limit).
      - `MarkdownEditor` studio with toolbar, split view, and image drop.
    - **Right Sidebar Column (35% width)**:
      - Publish Control Card: Save Draft, Publish Now buttons, status badge.
      - Category & Author selection.
      - Cover Image Uploader (`ImageUploadDropzone`) with preview.
      - Tag Input (chip pills with add/remove).
      - SEO & Social Card Accordion:
        - `metaTitle` input (with 60-char progress bar).
        - `metaDescription` textarea (with 160-char progress bar).
        - `metaKeywords` input.
        - `GoogleSerpPreview` real-time preview card.
        - Social Share Open Graph card.

---

## 6. Cross-Cutting Subsystems

### 6.1 Unified Media Upload API (`/api/admin/upload/route.ts`)

To avoid local filesystem dependencies and adhere strictly to serverless constraints:
- Protected route: `authenticateAdminRequest(req)` -> accessible to `SUPER_ADMIN`, `CONTENT_ADMIN`, `EDITOR`.
- Handles `multipart/form-data`:
  ```typescript
  const formData = await request.formData();
  const file = formData.get('file') as File;
  const folder = (formData.get('folder') as string) || 'salon-content';
  ```
- Validates file size (<= 5MB) and MIME type (`image/jpeg`, `image/png`, `image/webp`).
- Converts `File` to `Buffer` in memory (zero filesystem writes on container).
- Delegates to `getStorageProvider().upload(buffer, file.name, { folder })`.
- Returns `{ url: result.url, publicId: result.publicId }`.

### 6.2 Audit Logging Subsystem Integration

All mutation route handlers across Before/After, Services, and Articles strictly record audit events using `logAuditEvent()` in `services/audit.ts`:

```typescript
await logAuditEvent({
  userId: user.id,
  userEmail: user.email,
  userName: user.fullName,
  userRole: user.role.name,
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE',
  entity: 'BEFORE_AFTER' | 'SERVICE' | 'SERVICE_COMBO' | 'ARTICLE',
  entityId: record.id,
  details: {
    before: beforeData, // For UPDATE / DELETE
    after: afterData,   // For CREATE / UPDATE
    changedKeys: ['title', 'durationMinutes'],
  },
  ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
  userAgent: request.headers.get('user-agent'),
});
```

Benefits:
- Complete compliance with Acceptance Criteria R3 & TC1.12.
- Fully visible in `/admin/audit-logs` and dashboard activity feeds.
- 100% fail-safe (does not crash parent request if logging encounters an issue).

---

## 7. File Structure & Implementation Blueprint

The following files will be created in the implementation phase:

```
c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\
├── app/
│   ├── admin/
│   │   ├── before-after/
│   │   │   └── page.tsx                        # Before/After showcase list & management
│   │   ├── services/
│   │   │   └── page.tsx                        # Services & Combos tabbed management
│   │   └── articles/
│   │       ├── page.tsx                        # Article list & management
│   │       ├── new/
│   │       │   └── page.tsx                    # Article creation studio
│   │       └── [id]/
│   │           └── page.tsx                    # Article edit studio
│   └── api/
│       └── admin/
│           ├── upload/
│           │   └── route.ts                    # Cloud image upload endpoint
│           ├── before-after/
│           │   ├── route.ts                    # GET (list), POST (create)
│           │   └── [id]/
│           │       ├── route.ts                # GET, PUT, DELETE single showcase
│           │       └── feature/
│           │           └── route.ts            # PATCH toggle isFeatured
│           ├── services/
│           │   ├── route.ts                    # GET (list), POST (create single service)
│           │   ├── [id]/
│           │   │   └── route.ts                # GET, PUT, DELETE single service
│           │   └── combos/
│           │       ├── route.ts                # GET (list combos), POST (create combo)
│           │       └── [id]/
│           │           └── route.ts            # GET, PUT, DELETE combo
│           └── articles/
│               ├── route.ts                    # GET (list), POST (create article)
│               └── [id]/
│                   ├── route.ts                # GET, PUT, DELETE article
│                   └── publish/
│                       └── route.ts            # PATCH toggle isPublished
├── components/
│   └── admin/
│       ├── ImageUploadDropzone.tsx             # Universal cloud image uploader component
│       ├── BeforeAfterTableClient.tsx          # Interactive showcase table & cards
│       ├── BeforeAfterFormModal.tsx            # Create/edit showcase modal
│       ├── BeforeAfterSliderPreview.tsx        # Interactive comparison test slider
│       ├── ServicesTableClient.tsx             # Single services management table
│       ├── ServiceCombosClient.tsx             # Combo packages grid & management
│       ├── ServiceFormModal.tsx                # Single service creation/edit modal
│       ├── ServiceComboFormModal.tsx           # Combo package bundle modal
│       ├── ArticlesTableClient.tsx             # Articles editorial table
│       ├── MarkdownEditor.tsx                  # Rich Markdown formatting & live preview
│       ├── GoogleSerpPreview.tsx               # Google search snippet simulator
│       └── ArticleEditorForm.tsx               # Full article composition form
├── lib/
│   └── validations/
│       ├── before-after.ts                     # Zod schema & serializer for BeforeAfter
│       ├── service.ts                          # Zod schema & serializer for Service & Combos
│       └── article.ts                          # Zod schema & serializer for Article
```

---

## 8. Verification & Test Strategy

To guarantee that the implementation meets all requirements without regression:

1. **TypeScript Typecheck**:
   ```bash
   npm run typecheck
   ```
   Must pass with zero compiler errors under strict mode.

2. **Existing E2E Test Suite Run**:
   ```bash
   npm run test:e2e
   ```
   Must maintain 100% pass rate (67/67 tests passing), specifically verifying:
   - `TC1.11`: Full CRUD lifecycle for Services & Combos via Admin CMS.
   - `TC1.12`: Audit trail logging for all mutations.
   - `TC1.5`: Public services price transparency.
   - `TC1.6`: Public articles with SEO metadata.
   - `TC2.14`: `CONTENT_ADMIN` RBAC guard.
   - `TC2.15`, `TC2.16`: `EDITOR` RBAC guard.
   - `TC4.4`: Content publishing lifecycle from settings to styles, colors, and articles.

3. **Prisma Integrity**:
   ```bash
   npx prisma validate
   ```
   Confirms relations and indexes remain intact.
