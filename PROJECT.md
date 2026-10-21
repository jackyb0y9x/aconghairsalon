# Project: Modern Hair Salon Web Application

## Architecture
The application is a full-stack, enterprise-grade web application built on Next.js App Router (TypeScript `strict: true`) with two decoupled subsystems sharing a unified database and core business services:
1. **Public Website (`app/(public)`)**: High-end luxury public experience for brand promotion, hairstyle exploration, color consultation, before/after showcases, transparent pricing, multi-step online appointments, and an interactive personal hair try-on tool.
2. **Admin CMS (`app/admin`)**: Independent, secure administrative interface with 4-tier Role-Based Access Control (RBAC), real-time database dashboard analytics, full CRUD across all content entities, 5-state appointment workflow management, system settings, and an immutable audit log.
3. **Core API & Services Layer (`app/api`, `services/`, `lib/`)**: Centralized business logic, Zod validation schemas, Prisma ORM database clients, pluggable cloud storage abstraction (`StorageProvider`), and pluggable hair simulation engine (`HairTryOnProvider`).

### Data Flow
- **Public Traffic**: Visitor Browser → Next.js App Router (Server Components + ISR/SSR) → Service Layer → Prisma ORM (Connection-pooled PostgreSQL).
- **Interactive Actions (Booking, Try-On)**: Client Component (React Hook Form + Zod) → `/api/bookings` or `/api/try-on` → Strict Server Validation → Database Persistence + Event Auditing → Client Response.
- **Admin Operations**: Authenticated Staff Browser → `/admin/*` Layout (Server-Side Session & Role Check) → Admin Client/Server Components → `/api/admin/*` Route Handlers (Role Permission Guards) → Prisma Mutation → Audit Log Recording (`services/audit.ts`) → `revalidatePath` cache eviction.

---

## Feature Inventory
Every feature identified during the comprehensive survey is mapped below to its dedicated milestone.

| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Next.js & TS Foundation | App Router scaffolding, strict TypeScript, luxury Tailwind palette & shadcn/ui components | M1 | Survey 3 |
| 2 | Prisma Schema & Models | 14 comprehensive models (User, Role, Session, Category, Hairstyle, HairColor, Service, ServiceCombo, BeforeAfter, Booking, Banner, Article, SiteSetting, AuditLog) | M1 | Survey 2 & 3 |
| 3 | Rich Seed Dataset | Automated `prisma/seed.ts` script with realistic Vietnamese & international salon data, styles, colors, services, staff accounts | M1 | Survey 3 |
| 4 | Cloud Storage Abstraction | `StorageProvider` interface supporting Cloudinary, Supabase, and Mock fallback with zero container disk storage | M1 | Survey 3 |
| 5 | Hair Try-On Provider Interface | `HairTryOnProvider` abstract contract decoupling simulation engine from UI | M1 | Survey 1 & 3 |
| 6 | Auth & Session Management | Credentials-based login, secure HTTP-only session cookie, password hashing (bcrypt), session verification | M2 | Survey 2 |
| 7 | RBAC Authorization Guard | 4 roles (`SUPER_ADMIN`, `CONTENT_ADMIN`, `BOOKING_STAFF`, `EDITOR`) enforced at layout, page, and API route handlers | M2 | Survey 2 |
| 8 | Admin Layout & Navigation | Responsive admin shell, sidebar navigation filtered by role permissions, header with user profile & logout | M2 | Survey 2 |
| 9 | Dashboard Telemetry | Live SQL/Prisma aggregations: total styles, colors, services, articles, today's bookings, pending bookings alert, recent audit log | M2 | Survey 2 |
| 10 | Site Settings Management | Dynamic brand name, logo, favicon, address, hotlines, opening hours, social links, Google Maps embed, default SEO | M2 | Survey 2 |
| 11 | Audit Logging Subsystem | Immutable activity logs recording actor, action type, entity, timestamp, IP, and diff details | M2 | Survey 2 |
| 12 | Banner Content CRUD | Create, read, update, delete, reorder home banners with title, subtitle, image, CTA link, active status | M3 | Survey 2 |
| 13 | Category & Hairstyle CRUD | Management of categories, hairstyle catalog (name, slug, gender, length, face shape, texture, care level, images, pricing) | M3 | Survey 2 |
| 14 | Hair Color Swatch CRUD | Color database management: name, hex code, tone (warm/cool/neutral), color group, brightness, bleach required, skin suitability | M3 | Survey 2 |
| 15 | Before/After Showcase CRUD | Management of transformation pairs (before image, after image, service tag, hairstyle reference, description) | M3 | Survey 2 |
| 16 | Service & Combo CRUD | Service catalog management (cut, perm, dye, bleach, treatment, combo bundles, duration in minutes, price ranges, care advice) | M3 | Survey 2 |
| 17 | News & Article CRUD | Rich content editor, slug generation, category tags, SEO meta title/description, cover image, publish status | M3 | Survey 2 |
| 18 | Appointment Management | 5-state lifecycle (`PENDING` -> `CONFIRMED` -> `COMPLETED`/`CANCELLED`/`NO_SHOW`), search, date/status filtering, stylist assignment, internal notes | M3 | Survey 2 |
| 19 | Public Layout & Branding | Luxury responsive layout, sticky navbar, mobile drawer, salon branding from CMS Site Settings, luxury dark/gold theme | M4 | Survey 1 |
| 20 | Dynamic Home Page | Hero banner slider, highlighted categories, trending hairstyles, before/after interactive slider, stylists, reviews, blog preview, CTA | M4 | Survey 1 |
| 21 | Hairstyle Exploration Library | 6-criteria multi-filter (gender, style, length, face shape, texture, care effort) synchronized with URL query params | M4 | Survey 1 |
| 22 | Hairstyle Detail View | Rich showcase of style features, care recommendations, associated services, pricing, favorite toggle, direct booking/try-on links | M4 | Survey 1 |
| 23 | Color Swatches & Consultation | Filter by tone, color group, bleach level; visual swatch cards, skin tone recommendation guide, color maintenance guide | M4 | Survey 1 |
| 24 | Before/After Interactive Showcase | Interactive comparison slider component (drag handle), filter by service, links to booking and reference styles | M4 | Survey 1 |
| 25 | Services & Price Transparency | Grouped service catalog, duration, transparent price tiers, pre-service preparation and post-service maintenance guides | M4 | Survey 1 |
| 26 | Multi-Step Booking Wizard | 5-step wizard (Service -> Hairstyle/Color -> Stylist -> DateTime -> Customer Details), client & server Zod validation, anti-duplicate submission lock, pending confirmation banner | M4 | Survey 1 |
| 27 | Blog & Hair Care Knowledge | SEO-optimized articles, dynamic Open Graph metadata, tag filtering, related articles, reading time indicator | M4 | Survey 1 |
| 28 | Hair Try-On User Interface | Portrait photo upload (drag & drop / camera), face guide overlay, hairstyle & color selector tray, comparison toggle | M5 | Survey 1 |
| 29 | Demo Simulation Engine | `DemoHairTryOnProvider` generating responsive composite previews with realistic latency and clear mock indicators | M5 | Survey 1 |
| 30 | Try-On State Machine | Reactive handling of all user states: empty, uploading, processing, success, error, file size exceeded (>5MB), timeout | M5 | Survey 1 |
| 31 | In-Memory Privacy Proxy | Secure `/api/try-on` route with magic byte validation, zero disk persistence on serverless container, safe temporary base64 output | M5 | Survey 1 |
| 32 | E2E Testing Suite | Comprehensive test suite covering Tiers 1-4 (Feature, Boundary, Combinatorial, Real-World) with standalone runner | E2E Track | Survey 1, 2, 3 |
| 33 | Production Build & Docs | TypeScript strict compilation (`tsc --noEmit`), `npm run build` success, Prisma validate/generate, `README.md`, `.env.example` | M6 | Survey 3 & AC |

---

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Foundation & Database Layer | Next.js App Router scaffolding, Tailwind/shadcn setup, Prisma schema (14 models), seed script, Storage & Try-On interfaces | none | DONE |
| M2 | Auth, RBAC & Admin Core | Authentication, 4-tier RBAC, Admin Shell, Live Dashboard Metrics, Site Settings, Audit Logging | M1 | DONE |
| M3 | Admin Content & Booking Operations | Full CRUD (Banners, Styles, Colors, BeforeAfter, Services, Articles) + 5-State Booking Management with Stylist Assignment | M2 | DONE |
| M4 | Public Website Experience | Public Home, Hairstyle Library with 6D URL filters, Color Swatches, Before/After Slider, Price List, 5-Step Booking Form, Blog | M1, M3 | DONE |
| M5 | Hair Try-On Subsystem | Interactive Try-On UI, Demo Provider, State Machine, In-Memory Privacy Proxy | M1, M4 | DONE |
| M6 | Production Hardening & Acceptance | 100% E2E test passing, `npx tsc --noEmit` clean, `npm run build` clean, Prisma validate/generate, `.env.example`, `README.md` | M1-M5, E2E | IN_PROGRESS |

In parallel:
- **E2E Testing Track**: COMPLETED (TEST_READY.md published, 67/67 tests passing).

---

## Interface Contracts

### 1. Hair Try-On Provider (`services/try-on/types.ts`)
```typescript
export interface TryOnRequest {
  imageBuffer: Buffer;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  hairstyleId: string;
  hairColorId?: string;
  options?: {
    intensity?: number; // 0.0 - 1.0
  };
}

export interface TryOnResponse {
  resultImageBase64: string;
  mimeType: string;
  isMock: boolean;
  provider: string;
  processingTimeMs: number;
}

export interface HairTryOnProvider {
  name: string;
  processTryOn(request: TryOnRequest): Promise<TryOnResponse>;
}
```

### 2. Storage Provider (`services/storage/types.ts`)
```typescript
export interface UploadOptions {
  folder: string;
  allowedMimeTypes?: string[];
  maxSizeBytes?: number;
}

export interface UploadResult {
  url: string;
  publicId: string;
  sizeBytes: number;
  mimeType: string;
}

export interface StorageProvider {
  name: string;
  upload(fileBuffer: Buffer, fileName: string, options: UploadOptions): Promise<UploadResult>;
  delete(publicId: string): Promise<boolean>;
}
```

### 3. Booking Zod Contract (`lib/validations/booking.ts`)
```typescript
import { z } from 'zod';

export const CreateBookingSchema = z.object({
  serviceId: z.string().min(1, 'Vui lòng chọn dịch vụ'),
  hairstyleId: z.string().optional(),
  hairColorId: z.string().optional(),
  stylistId: z.string().optional(),
  bookingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày hẹn không hợp lệ'),
  bookingTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Giờ hẹn không hợp lệ'),
  customerName: z.string().min(2, 'Họ tên tối thiểu 2 ký tự').max(100),
  customerPhone: z.string().regex(/^(0|\+84)[3|5|7|8|9][0-9]{8}$/, 'Số điện thoại không hợp lệ'),
  customerEmail: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
  notes: z.string().max(500, 'Ghi chú tối đa 500 ký tự').optional(),
  idempotencyKey: z.string().uuid().optional(),
});

export type CreateBookingInput = z.infer<typeof CreateBookingSchema>;
```

### 4. RBAC Permission Matrix
- Roles: `SUPER_ADMIN`, `CONTENT_ADMIN`, `BOOKING_STAFF`, `EDITOR`.
- Route Guards:
  - `/admin`: All authenticated admin roles.
  - `/admin/settings`, `/admin/users`: `SUPER_ADMIN` only.
  - `/admin/audit-logs`: `SUPER_ADMIN` only.
  - `/admin/bookings/*`: `SUPER_ADMIN`, `BOOKING_STAFF`.
  - `/admin/content/*` (Banners, Styles, Colors, Services, BeforeAfter): `SUPER_ADMIN`, `CONTENT_ADMIN`.
  - `/admin/articles/*`: `SUPER_ADMIN`, `CONTENT_ADMIN`, `EDITOR`.

---

## Code Layout
```
c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\
├── app/
│   ├── (public)/              # Public website route group
│   │   ├── layout.tsx         # Public layout (Header, Nav, Footer from SiteSettings)
│   │   ├── page.tsx           # Home page with dynamic CMS sections
│   │   ├── hairstyles/        # Hairstyle library & detail
│   │   ├── colors/            # Hair color swatches & consultation
│   │   ├── before-after/      # Before/After comparison showcase
│   │   ├── services/          # Services & transparent pricing
│   │   ├── booking/           # Multi-step booking wizard
│   │   ├── try-on/            # Hair Try-On interactive tool
│   │   └── blog/              # News & hair care advice articles
│   ├── admin/                 # Admin CMS subsystem
│   │   ├── layout.tsx         # Admin layout (RBAC session check, Sidebar, Topbar)
│   │   ├── login/             # Admin authentication
│   │   ├── page.tsx           # Dashboard telemetry & pending alerts
│   │   ├── banners/           # Banner CRUD
│   │   ├── hairstyles/        # Category & Hairstyle CRUD
│   │   ├── colors/            # Color swatch CRUD
│   │   ├── before-after/      # Before/After CRUD
│   │   ├── services/          # Service & Combo CRUD
│   │   ├── articles/          # Blog article CRUD
│   │   ├── bookings/          # 5-state booking manager
│   │   ├── settings/          # Dynamic Site Settings
│   │   └── audit-logs/        # Audit log viewer
│   ├── api/                   # API route handlers
│   │   ├── auth/              # Admin login/logout/session
│   │   ├── public/            # Public read endpoints (cached/ISR)
│   │   ├── bookings/          # Booking submission endpoint
│   │   ├── try-on/            # In-memory try-on proxy
│   │   └── admin/             # Admin protected mutation endpoints
│   └── globals.css            # Tailwind directives & CSS variables
├── components/
│   ├── public/                # Public UI components (Hero, Slider, BookingForm, TryOnCanvas)
│   ├── admin/                 # Admin UI components (DataTable, StatCard, BookingDetailModal)
│   └── ui/                    # Reusable shadcn/ui components (Button, Dialog, Select, Toast)
├── lib/
│   ├── prisma.ts              # PrismaClient singleton with serverless pooling
│   ├── auth.ts                # Session encryption, verification & role helpers
│   ├── utils.ts               # Tailwind cn helper, date formatting, currency formatting
│   └── validations/           # Zod validation schemas
├── services/
│   ├── storage/               # StorageProvider interface + Cloudinary/Supabase/Mock
│   ├── try-on/                # HairTryOnProvider interface + DemoHairTryOnProvider
│   └── audit.ts               # Audit logging service
├── types/                     # Shared TypeScript interfaces & enums
├── prisma/
│   ├── schema.prisma          # Complete 14-model relational schema
│   └── seed.ts                # Rich seed dataset with realistic salon data
├── tests/                     # Opaque-box E2E test suite (Tiers 1-4)
├── .env.example               # Complete environment variable blueprint
├── README.md                  # Detailed documentation (setup, migration, seed, Vercel)
├── package.json
└── tsconfig.json              # Strict mode TypeScript configuration
```
