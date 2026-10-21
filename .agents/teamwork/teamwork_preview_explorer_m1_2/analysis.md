# Technical Analysis Report: Milestone 1 Database Layer Blueprint
**Project:** Modern Hair Salon Web Application (Lumière Hair Atelier)  
**Author:** M1 Explorer 2 (`teamwork_preview_explorer_m1_2`)  
**Parent Orchestrator:** `daa96dc0-4b53-4192-88a0-f59f39a1f3f3`  
**Working Directory:** `c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_explorer_m1_2`  
**Target Files Analyzed:** `prisma/schema.prisma`, `lib/prisma.ts`, `prisma/seed.ts`  
**Date:** 2026-10-19  

---

## 1. Executive Summary

Milestone 1 establishes the foundational infrastructure for the entire modern hair salon platform. The database layer is the single source of truth for both the **Public Website (`app/(public)`)** and the **Admin CMS (`app/admin`)**. 

This technical report delivers the complete engineering blueprint for:
1. **Prisma ORM Schema (`prisma/schema.prisma`)**: Covering all 14 domain models across authentication, taxonomy, salon catalog, transformations, appointment management, editorial content, site configuration, and audit logging.
2. **Relational Integrity & Performance Indexing**: Formally defined foreign key constraints, cascade rules, composite indexes for multi-criteria search/filtering, and unique constraints for idempotent submissions.
3. **Serverless Connection Pooling Singleton (`lib/prisma.ts`)**: Mitigating connection exhaustion under Next.js Hot Module Replacement (HMR) and Vercel serverless auto-scaling using PgBouncer / Neon connection pooler support.
4. **Rich Seed Dataset (`prisma/seed.ts`)**: A complete, self-contained, idempotent seed script providing 4 role-based staff accounts, 3 master stylists, 7 categories, 13 detailed hairstyles with rich attributes, 11 hair color swatches, 6 services, 3 combos, 4 before/after showcases, 4 banners, 3 SEO articles, dynamic site settings, and 5 booking lifecycle samples.

---

## 2. Comprehensive 14-Model Architecture

The database schema is organized into 8 functional clusters encompassing exactly 14 models and 12 enums:

```
[Authentication & RBAC]         [Taxonomy & Catalog]          [Operations & Engagement]
  - Role                           - Category                    - Booking (5-state workflow)
  - User (Staff & Stylists)        - Hairstyle                   - BeforeAfter
  - Session                        - HairColor                   - Banner
                                   - Service                     - Article
                                   - ServiceCombo                - SiteSetting
                                                                 - AuditLog
```

### 2.1 Model Inventory & Relational Mapping

| # | Model | Primary Key | Key Foreign Keys & Relations | Cascade / Delete Behavior | Purpose |
|---|---|---|---|---|---|
| 1 | `Role` | `id` (UUID) | `users: User[]` | `onDelete: Restrict` on User | 4-tier RBAC definitions (`SUPER_ADMIN`, `CONTENT_ADMIN`, `BOOKING_STAFF`, `EDITOR`) |
| 2 | `User` | `id` (UUID) | `roleId -> Role(id)`, `sessions`, `articles`, `assignedBookings`, `beforeAfterWorks`, `auditLogs` | Restrict from Role; Cascade to Session; SetNull on Bookings/Showcases/Audits | Admin staff, editors, receptionists, and master stylists |
| 3 | `Session` | `id` (UUID) | `userId -> User(id)` | `onDelete: Cascade` | Server-side authenticated sessions with expiration and client telemetry |
| 4 | `Category` | `id` (UUID) | `hairstyles: Hairstyle[]`, `services: Service[]`, `articles: Article[]` | `onDelete: Restrict` on Hairstyle/Service; `onDelete: SetNull` on Article | Core taxonomy partition (`HAIRSTYLE`, `SERVICE`, `ARTICLE`) |
| 5 | `Hairstyle` | `id` (UUID) | `categoryId -> Category(id)`, `services: Service[]` (M:N), `beforeAfters`, `bookings` | `onDelete: Restrict` on Category; SetNull on Bookings & BeforeAfter | Detailed hairstyle library with 6D search attributes |
| 6 | `HairColor` | `id` (UUID) | `bookings: Booking[]` | SetNull on Bookings | Color swatches with tone, level, hex codes, and bleaching criteria |
| 7 | `Service` | `id` (UUID) | `categoryId -> Category(id)`, `hairstyles: Hairstyle[]` (M:N), `combos: ServiceCombo[]` (M:N), `bookings`, `beforeAfters` | Restrict from Category; SetNull on Bookings & BeforeAfter | Catalog of salon procedures with durations and price tiers |
| 8 | `ServiceCombo` | `id` (UUID) | `services: Service[]` (M:N), `bookings: Booking[]` | SetNull on Bookings | Pre-packaged multi-service treatment bundles with savings calculations |
| 9 | `BeforeAfter` | `id` (UUID) | `serviceId -> Service(id)`, `hairstyleId -> Hairstyle(id)`, `stylistId -> User(id)` | `onDelete: SetNull` on all relations | Interactive visual comparison gallery (before/after transformation) |
| 10 | `Booking` | `id` (UUID) | `serviceId -> Service(id)`, `comboId -> ServiceCombo(id)`, `hairstyleRefId -> Hairstyle(id)`, `hairColorRefId -> HairColor(id)`, `assignedStylistId -> User(id)` | `onDelete: SetNull` on all foreign references | 5-state online appointment entity with anti-duplicate idempotency |
| 11 | `Banner` | `id` (UUID) | None | Standalone | Dynamic promotional and seasonal hero slider for homepage |
| 12 | `Article` | `id` (UUID) | `authorId -> User(id)`, `categoryId -> Category(id)` | `onDelete: Restrict` on author; `onDelete: SetNull` on category | SEO hair care advice, trend blogs, and hair guides |
| 13 | `SiteSetting` | `id` ("default_setting") | None | Standalone singleton | Global branding, hours, hotline, social links, Google Maps, SEO |
| 14 | `AuditLog` | `id` (UUID) | `actorId -> User(id)` | `onDelete: SetNull` (preserves historical actor metadata snapshot) | Immutable audit log of administrative and sensitive actions |

### 2.2 Relational Integrity & Cascade Rules

1. **Safety for Deletions (`onDelete: Restrict`)**:
   - `User -> Role`: Prevents deleting a system role when staff members are assigned to it.
   - `Hairstyle -> Category` & `Service -> Category`: Prevents accidental category removal when catalog items still reference it.
   - `Article -> User (Author)`: Prevents deleting author accounts without reassigning or archiving their articles.
2. **Cascading Cleanups (`onDelete: Cascade`)**:
   - `Session -> User`: When a staff account is terminated/deleted, all active sessions must be invalidated immediately.
   - Many-to-Many join tables (`_HairstyleToService`, `_ServiceToServiceCombo`): Automatically managed by Prisma to remove orphan join records when either side is deleted.
3. **Preservation of Operational History (`onDelete: SetNull`)**:
   - `Booking`: When a service, hairstyle, hair color, or stylist is archived or removed from the catalog, existing appointment records MUST NOT be deleted. The foreign key becomes `null`, preserving the financial record, customer contact, and time slot.
   - `AuditLog`: If a staff member is deleted, `actorId` becomes `null`, but the denormalized snapshot fields (`actorEmail`, `actorName`, `actorRole`) remain permanently intact in the log.

### 2.3 Indexing & Search Optimization Strategy

- **`Hairstyle`**: 
  - `@@index([gender, length, careEffort])` accelerates the primary 3-filter combination on `/hairstyles`.
  - `@@index([isTrending, isFeatured])` powers homepage curated carousels.
  - `@@index([categoryId])` optimizes category tab navigation.
- **`HairColor`**:
  - `@@index([tone, group, requiresBleach])` enables instant facet filtering on `/colors`.
  - `@@index([isTrending, isActive])` supports swatch display orders.
- **`Booking`**:
  - `@@index([bookingDate, status])` powers Admin CMS calendar views and "Today's Bookings" dashboard counters.
  - `@@index([customerPhone])` accelerates customer lookup and history retrieval.
  - `@@index([assignedStylistId])` powers stylist scheduling queries.
  - `@unique` on `idempotencyKey` prevents duplicate booking submissions under network retries.
- **`AuditLog`**:
  - `@@index([action, entityType])` speeds up audit filtering by entity and action type.
  - `@@index([createdAt])` allows fast chronological paging.
- **`Article`**:
  - `@@index([isPublished, publishedAt])` optimizes public blog listing queries.
  - `@unique` on `slug` provides $O(1)$ lookups for SEO article pages.

---

## 3. Drop-in Implementation: `prisma/schema.prisma`

```prisma
// =============================================================================
// Prisma Schema - Lumière Hair Atelier
// Database: PostgreSQL (Vercel Postgres / Neon / Supabase)
// =============================================================================

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// =============================================================================
// 1. AUTHENTICATION & RBAC (4 ROLES)
// =============================================================================

enum RoleName {
  SUPER_ADMIN
  CONTENT_ADMIN
  BOOKING_STAFF
  EDITOR
}

model Role {
  id          String   @id @default(uuid())
  name        RoleName @unique
  description String?
  permissions Json     // Array of granted permissions, e.g. ["*"], ["bookings:read", "bookings:update"]
  users       User[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("roles")
}

model User {
  id              String         @id @default(uuid())
  email           String         @unique
  passwordHash    String
  fullName        String
  phone           String?
  avatarUrl       String?
  isActive        Boolean        @default(true)
  
  // RBAC relation
  roleId          String
  role            Role           @relation(fields: [roleId], references: [id], onDelete: Restrict)
  
  // Stylist profile attributes
  isStylist       Boolean        @default(false)
  bio             String?        @db.Text
  experienceYears Int?
  specialties     String[]       // Native Postgres text[]
  
  // Entity relations
  sessions        Session[]
  articles        Article[]      @relation("ArticleAuthor")
  assignedBookings Booking[]     @relation("StylistBookings")
  beforeAfterWorks BeforeAfter[] @relation("StylistBeforeAfter")
  auditLogs       AuditLog[]     @relation("AuditActor")

  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  @@index([roleId])
  @@index([email])
  @@index([isStylist])
  @@map("users")
}

model Session {
  id           String   @id @default(uuid())
  sessionToken String   @unique
  userId       String
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt    DateTime
  ipAddress    String?
  userAgent    String?
  createdAt    DateTime @default(now())

  @@index([userId])
  @@index([expiresAt])
  @@map("sessions")
}

// =============================================================================
// 2. TAXONOMY & CATEGORIES
// =============================================================================

enum CategoryType {
  HAIRSTYLE
  SERVICE
  ARTICLE
}

model Category {
  id           String        @id @default(uuid())
  name         String
  slug         String        @unique
  description  String?       @db.Text
  type         CategoryType  @default(HAIRSTYLE)
  imageUrl     String?
  displayOrder Int           @default(0)
  isActive     Boolean       @default(true)

  hairstyles   Hairstyle[]
  services     Service[]
  articles     Article[]

  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt

  @@index([type, isActive])
  @@index([displayOrder])
  @@map("categories")
}

// =============================================================================
// 3. HAIRSTYLE CATALOG & ATTRIBUTES
// =============================================================================

enum GenderTarget {
  MALE
  FEMALE
  UNISEX
}

enum HairLength {
  VERY_SHORT
  SHORT
  MEDIUM
  LONG
  EXTRA_LONG
}

enum FaceShape {
  OVAL
  ROUND
  SQUARE
  HEART
  DIAMOND
  OBLONG
  ALL
}

enum HairTexture {
  STRAIGHT
  WAVY
  CURLY
  COILY
  FINE
  THICK
}

enum CareEffort {
  LOW
  MEDIUM
  HIGH
}

enum StyleVibe {
  KOREAN
  JAPANESE
  CLASSIC
  MINIMALIST
  STREETWEAR
  BUSINESS
  AVANT_GARDE
}

model Hairstyle {
  id              String        @id @default(uuid())
  title           String
  slug            String        @unique
  summary         String?       @db.VarChar(500)
  description     String        @db.Text
  coverImageUrl   String
  galleryImages   String[]      // Multi-angle photo array
  
  // Multi-criteria filter dimensions
  gender          GenderTarget  @default(UNISEX)
  length          HairLength    @default(MEDIUM)
  suitableFaces   FaceShape[]   // Native Postgres enum array
  suitableTexture HairTexture[] // Native Postgres enum array
  careEffort      CareEffort    @default(MEDIUM)
  styleVibe       StyleVibe     @default(KOREAN)
  
  // Advice and pricing
  careAdvice      String?       @db.Text
  stylingTips     String?       @db.Text
  priceRefMin     Decimal?      @db.Decimal(12, 2)
  priceRefMax     Decimal?      @db.Decimal(12, 2)
  
  // Flags & telemetry
  isTrending      Boolean       @default(false)
  isFeatured      Boolean       @default(false)
  isActive        Boolean       @default(true)
  viewCount       Int           @default(0)

  // Category relation
  categoryId      String
  category        Category      @relation(fields: [categoryId], references: [id], onDelete: Restrict)

  // Relational links
  services        Service[]     // Implicit M:N with Service
  beforeAfters    BeforeAfter[]
  bookings        Booking[]     @relation("BookingReferencedStyle")

  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  @@index([gender, length, careEffort])
  @@index([isTrending, isFeatured])
  @@index([categoryId])
  @@index([isActive])
  @@map("hairstyles")
}

// =============================================================================
// 4. HAIR COLOR SWATCHES & CONSULTATION
// =============================================================================

enum ColorTone {
  WARM
  COOL
  NEUTRAL
}

enum ColorGroup {
  BROWN
  BLONDE
  RED_BURGUNDY
  ASH_SMOKY
  PASTEL
  BLACK_DARK
  FASHION_VIBRANT
}

model HairColor {
  id                String      @id @default(uuid())
  name              String
  code              String      @unique // e.g. "ASH-8.1", "MOCHA-6.1"
  hexColor          String      // Primary HEX code e.g. "#59493E"
  secondaryHex      String?     // Undertone HEX e.g. "#A89F91"
  tone              ColorTone   @default(NEUTRAL)
  group             ColorGroup  @default(BROWN)
  brightnessLevel   Int         @default(6) // Scale 1 - 10
  
  requiresBleach    Boolean     @default(false)
  bleachRounds      Int         @default(0) // 0, 1, 2, 3
  suitableSkinTones String[]    // e.g. ["Da sáng", "Da trung tính", "Da ngăm"]
  maintenanceLevel  CareEffort  @default(MEDIUM)
  colorFadingAdvice String?     @db.Text
  swatchImageUrl    String?
  samplePortraitUrl String?
  
  isTrending        Boolean     @default(false)
  isActive          Boolean     @default(true)
  displayOrder      Int         @default(0)

  bookings          Booking[]   @relation("BookingReferencedColor")

  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt

  @@index([tone, group, requiresBleach])
  @@index([isTrending, isActive])
  @@map("hair_colors")
}

// =============================================================================
// 5. SERVICES & COMBOS
// =============================================================================

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

  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  @@index([categoryId, isActive])
  @@index([isPopular])
  @@index([displayOrder])
  @@map("services")
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

  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  @@index([isActive, isFeatured])
  @@index([displayOrder])
  @@map("service_combos")
}

// =============================================================================
// 6. BEFORE & AFTER SHOWCASE
// =============================================================================

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

// =============================================================================
// 7. ONLINE BOOKING SYSTEM (5 STATES)
// =============================================================================

enum BookingStatus {
  PENDING      // Chờ xác nhận
  CONFIRMED    // Đã xác nhận lịch
  COMPLETED    // Đã hoàn thành dịch vụ
  CANCELLED    // Đã hủy lịch
  NO_SHOW      // Khách không đến
}

model Booking {
  id                 String        @id @default(uuid())
  bookingCode        String        @unique // e.g. "LMR-20261019-XXXX"
  
  customerName       String
  customerPhone      String
  customerEmail      String?
  
  bookingDate        DateTime      @db.Date
  timeSlot           String        // e.g. "09:30", "14:00"
  
  serviceId          String?
  service            Service?      @relation(fields: [serviceId], references: [id], onDelete: SetNull)
  
  comboId            String?
  combo              ServiceCombo? @relation(fields: [comboId], references: [id], onDelete: SetNull)
  
  hairstyleRefId     String?
  hairstyleRef       Hairstyle?    @relation("BookingReferencedStyle", fields: [hairstyleRefId], references: [id], onDelete: SetNull)
  
  hairColorRefId     String?
  hairColorRef       HairColor?    @relation("BookingReferencedColor", fields: [hairColorRefId], references: [id], onDelete: SetNull)
  
  assignedStylistId  String?
  assignedStylist    User?         @relation("StylistBookings", fields: [assignedStylistId], references: [id], onDelete: SetNull)
  
  status             BookingStatus @default(PENDING)
  notes              String?       @db.Text
  internalNotes      String?       @db.Text
  estimatedPrice     Decimal?      @db.Decimal(12, 2)
  cancellationReason String?
  
  // Anti-duplicate submission token
  idempotencyKey     String?       @unique

  createdAt          DateTime      @default(now())
  updatedAt          DateTime      @updatedAt

  @@index([bookingDate, status])
  @@index([customerPhone])
  @@index([assignedStylistId])
  @@index([createdAt])
  @@map("bookings")
}

// =============================================================================
// 8. BANNERS & PROMOTIONS
// =============================================================================

model Banner {
  id             String    @id @default(uuid())
  title          String
  subtitle       String?
  badgeText      String?   // e.g. "XU HƯỚNG 2026", "ƯU ĐÃI ĐẶC QUYỀN"
  imageUrl       String    // Desktop banner image
  mobileImageUrl String?   // Mobile-optimized image
  linkUrl        String?
  ctaText        String?   @default("Khám phá ngay")
  displayOrder   Int       @default(0)
  isActive       Boolean   @default(true)
  startDate      DateTime?
  endDate        DateTime?

  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  @@index([isActive, displayOrder])
  @@map("banners")
}

// =============================================================================
// 9. BLOG ARTICLES & ADVICE
// =============================================================================

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

// =============================================================================
// 10. DYNAMIC SITE SETTINGS
// =============================================================================

model SiteSetting {
  id                  String   @id @default("default_setting")
  brandName           String   @default("Lumière Hair Atelier")
  brandSlogan         String?  @default("Định Hình Khí Chất - Tỏa Sáng Phong Cách")
  logoUrl             String?
  faviconUrl          String?
  hotlinePrimary      String   @default("0908123456")
  hotlineSecondary    String?
  emailContact        String   @default("contact@lumierehair.vn")
  addressFull         String   @default("128 Pasteur, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh")
  googleMapsEmbedUrl  String?  @db.Text
  
  // Structured JSON fields
  openingHours        Json     // { monday_friday: "08:30 - 21:00", weekend: "08:00 - 21:30" }
  socialLinks         Json     // { facebook: "...", instagram: "...", tiktok: "...", zalo: "..." }
  defaultSeoMetadata  Json     // { title: "...", description: "...", ogImage: "..." }
  footerContent       Json     // { copyright: "...", licenseText: "...", taxCode: "..." }
  
  updatedAt           DateTime @updatedAt

  @@map("site_settings")
}

// =============================================================================
// 11. AUDIT LOGS
// =============================================================================

enum AuditAction {
  AUTH_LOGIN
  AUTH_LOGOUT
  CREATE
  UPDATE
  DELETE
  STATUS_CHANGE
  SECURITY_VIOLATION
}

model AuditLog {
  id         String      @id @default(uuid())
  actorId    String?
  actorEmail String?
  actorName  String?
  actorRole  String?
  actor      User?       @relation("AuditActor", fields: [actorId], references: [id], onDelete: SetNull)
  
  action     AuditAction
  entityType String      // "Booking", "Hairstyle", "Service", "Setting", "User"
  entityId   String?
  details    Json?       // Changed fields, before/after values, context metadata
  ipAddress  String?
  userAgent  String?

  createdAt  DateTime    @default(now())

  @@index([action, entityType])
  @@index([createdAt])
  @@index([actorId])
  @@map("audit_logs")
}
```

---

## 4. Serverless Connection Pooling Blueprint (`lib/prisma.ts`)

### 4.1 Challenge: Connection Spikes in Next.js & Vercel
1. **Next.js HMR in Development**: Whenever any server file is edited, Next.js clears Node's `require.cache`. If `new PrismaClient()` is instantiated at top-level module scope, each reload opens 5-10 active connections. Within minutes, PostgreSQL aborts with `FATAL: remaining connection slots are reserved for non-replication superuser connections`.
2. **Vercel Serverless in Production**: Serverless lambdas scale concurrently. Direct connections to PostgreSQL (`5432`) quickly exhaust the database's connection limit (e.g. 20-50 on standard tiers).
3. **The Solution**: 
   - Global singleton assignment via `globalThis`.
   - Dual connection strings: `DATABASE_URL` routing through PgBouncer/transaction pooler (port `6543`), and `DIRECT_URL` routing directly to port `5432` for Prisma migrations.

### 4.2 Drop-in Implementation: `lib/prisma.ts`

```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

/**
 * Global singleton declaration to preserve PrismaClient instance across
 * Next.js Hot Module Replacement (HMR) reloads in local development.
 */
declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

export const prisma =
  globalThis.prismaGlobal ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}

export default prisma;
```

### 4.3 Environment Configuration Blueprint for Pooling

In `.env` and `.env.example`:
```bash
# Connection pooling URL (PgBouncer mode, port 6543) - Used by Next.js runtime
DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:6543/postgres?pgbouncer=true&connection_limit=10"

# Direct connection URL (Direct mode, port 5432) - Used by Prisma CLI for migrations & schema push
DIRECT_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"
```

---

## 5. Rich Seed Dataset Blueprint (`prisma/seed.ts`)

The seed dataset is meticulously constructed to deliver an immediate, production-grade salon experience upon running `npx prisma db seed`.

### 5.1 Dataset Specifications

| Data Cluster | Entities Count | Key Attributes & Real-World Representation |
|---|---|---|
| **RBAC Roles** | 4 | `SUPER_ADMIN`, `CONTENT_ADMIN`, `BOOKING_STAFF`, `EDITOR` with granular JSON permissions. |
| **Staff & Stylists** | 7 (4 staff + 3 master stylists) | Pre-hashed passwords (`Admin@123456` via `bcryptjs`). Master stylists feature years of experience and specialized skills. |
| **Categories** | 7 | `toc-nam`, `toc-nu`, `nhuom-mau-thoi-trang`, `cham-soc-phuc-hoi`, `cat-tao-kieu`, `uon-dinh-hinh`, `kien-thuc-toc`. |
| **Hairstyles** | 13 | Textured Crop, Two-Block, Pompadour, Side Part 7/3, Mullet Layer, Buzz Cut, Layer Chữ C, Bob Nhật, Uốn sóng lơi Pháp, Butterfly Cut, Wolf Cut, Pixie Cut, Curtain Bangs. |
| **Hair Colors** | 11 | Cold Mocha, Silver Smoke, Caramel Milk Tea, Burgundy Velvet, Nordic Ice, Classic Chestnut, Smoky Matcha, Rose Quartz, Blue Black, Honey Amber, Mystic Lavender. |
| **Services & Combos** | 9 (6 services + 3 combos) | Cắt Master, Uốn máy Protein, Nhuộm Organic, Tẩy Olaplex, Phủ lụa Keratin, Gội Hoàng Cung; Combos: Gentleman Luxe, Seoul Goddess, Platinum Trendsetter. |
| **Before / After** | 4 | High-impact transformations with before/after photography, stylist credits, and service links. |
| **Banners** | 4 | "Bản Giao Hưởng Xu Hướng 2026", "Đặc Quyền Hội Viên Olaplex", "Trải Nghiệm Thử Tóc AI", "Gentleman Atelier". |
| **Advisory Articles** | 3 | SEO-ready guides with markdown content, tips, and metadata. |
| **Site Settings** | 1 | Complete salon branding, 2 hotlines, address in District 1 HCMC, operating hours, and social channels. |
| **Bookings** | 5 | All 5 statuses represented: `PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED`, `NO_SHOW`. |
| **Audit Logs** | 3 | System initialization, seed generation, and administrative login audit records. |

### 5.2 Drop-in Implementation: `prisma/seed.ts`

```typescript
// prisma/seed.ts
import { PrismaClient, RoleName, CategoryType, GenderTarget, HairLength, FaceShape, HairTexture, CareEffort, StyleVibe, ColorTone, ColorGroup, BookingStatus, AuditAction } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed for Lumière Hair Atelier...');

  // 1. CLEANUP EXISTING DATA (in reverse dependency order)
  console.log('🧹 Cleaning existing tables...');
  await prisma.auditLog.deleteMany();
  await prisma.session.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.beforeAfter.deleteMany();
  await prisma.banner.deleteMany();
  await prisma.article.deleteMany();
  await prisma.serviceCombo.deleteMany();
  await prisma.hairstyle.deleteMany();
  await prisma.service.deleteMany();
  await prisma.hairColor.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();
  await prisma.siteSetting.deleteMany();

  // 2. SEED ROLES
  console.log('👥 Creating RBAC roles...');
  const roleSuperAdmin = await prisma.role.create({
    data: {
      name: RoleName.SUPER_ADMIN,
      description: 'Tổng quản trị hệ thống: toàn quyền cấu hình, nhân sự, tài chính và nghiệp vụ.',
      permissions: ['*'],
    },
  });

  const roleContentAdmin = await prisma.role.create({
    data: {
      name: RoleName.CONTENT_ADMIN,
      description: 'Quản trị nội dung: quản lý danh mục, kiểu tóc, bảng màu, dịch vụ, before/after và bài viết.',
      permissions: ['content:*', 'hairstyles:*', 'colors:*', 'services:*', 'banners:*', 'articles:*', 'before-after:*'],
    },
  });

  const roleBookingStaff = await prisma.role.create({
    data: {
      name: RoleName.BOOKING_STAFF,
      description: 'Lễ tân điều phối: quản lý và cập nhật trạng thái lịch hẹn, gán stylist, ghi chú lịch đặt.',
      permissions: ['bookings:*', 'hairstyles:read', 'services:read', 'stylists:read'],
    },
  });

  const roleEditor = await prisma.role.create({
    data: {
      name: RoleName.EDITOR,
      description: 'Biên tập viên: soạn thảo và tối ưu bài viết tin tức, cẩm nang chăm sóc tóc chuẩn SEO.',
      permissions: ['articles:*', 'hairstyles:read', 'colors:read'],
    },
  });

  // 3. SEED USERS & STYLISTS
  console.log('👤 Creating staff and master stylist accounts...');
  const defaultPasswordHash = bcrypt.hashSync('Admin@123456', 10);

  const superAdmin = await prisma.user.create({
    data: {
      email: 'admin@lumierehair.vn',
      passwordHash: defaultPasswordHash,
      fullName: 'Nguyễn Hoàng Nam',
      phone: '0908123456',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      roleId: roleSuperAdmin.id,
      isActive: true,
    },
  });

  const contentAdmin = await prisma.user.create({
    data: {
      email: 'content@lumierehair.vn',
      passwordHash: defaultPasswordHash,
      fullName: 'Trần Thu Thảo',
      phone: '0908111222',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
      roleId: roleContentAdmin.id,
      isActive: true,
    },
  });

  const bookingStaff = await prisma.user.create({
    data: {
      email: 'booking@lumierehair.vn',
      passwordHash: defaultPasswordHash,
      fullName: 'Lê Minh Khang',
      phone: '0908333444',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      roleId: roleBookingStaff.id,
      isActive: true,
    },
  });

  const editor = await prisma.user.create({
    data: {
      email: 'editor@lumierehair.vn',
      passwordHash: defaultPasswordHash,
      fullName: 'Phạm Hoàng Yến',
      phone: '0908555666',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
      roleId: roleEditor.id,
      isActive: true,
    },
  });

  // Master Stylists
  const stylistKenji = await prisma.user.create({
    data: {
      email: 'stylist.kenji@lumierehair.vn',
      passwordHash: defaultPasswordHash,
      fullName: 'Kenji Đặng',
      phone: '0908777888',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
      roleId: roleContentAdmin.id,
      isStylist: true,
      bio: 'Artistic Director với 12 năm tu nghiệp tại Tokyo & Seoul. Chuyên gia hàng đầu về uốn sóng lơi tự nhiên và kỹ thuật cắt tóc hình khối Nhật Bản.',
      experienceYears: 12,
      specialties: ['Uốn sóng lơi Nhật - Hàn', 'Cắt Layer hình khối', 'Phục hồi cấu trúc Keratin'],
    },
  });

  const stylistElena = await prisma.user.create({
    data: {
      email: 'stylist.elena@lumierehair.vn',
      passwordHash: defaultPasswordHash,
      fullName: 'Elena Vũ',
      phone: '0908999000',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
      roleId: roleContentAdmin.id,
      isStylist: true,
      bio: 'Master Colorist được chứng nhận bởi Olaplex & L’Oréal Professionnel. Bậc thầy kỹ thuật Balayage, nâng tone bạch kim và xử lý tóc tẩy hư tổn nặng.',
      experienceYears: 9,
      specialties: ['Tẩy màu Bạch Kim & Pastel', 'Balayage & Ombre chuyển sắc', 'Trị liệu phục hồi chuyên sâu'],
    },
  });

  const stylistAlex = await prisma.user.create({
    data: {
      email: 'stylist.alex@lumierehair.vn',
      passwordHash: defaultPasswordHash,
      fullName: 'Alex Trần',
      phone: '0908123789',
      avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80',
      roleId: roleBookingStaff.id,
      isStylist: true,
      bio: 'Lead Barber & Men’s Stylist với 8 năm kinh nghiệm. Bậc thầy kỹ thuật Skin Fade, Pompadour cổ điển và Textured Crop phong cách Modern Urban.',
      experienceYears: 8,
      specialties: ['Skin Fade & Barbering', 'Textured Crop Hàn Quốc', 'Uốn phồng chân tóc nam'],
    },
  });

  // 4. SEED CATEGORIES
  console.log('📂 Creating categories...');
  const catMenHair = await prisma.category.create({
    data: {
      name: 'Kiểu Tóc Nam',
      slug: 'toc-nam',
      description: 'Bộ sưu tập kiểu tóc nam thời thượng từ Pompadour cổ điển đến Textured Crop cá tính.',
      type: CategoryType.HAIRSTYLE,
      imageUrl: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=800&q=80',
      displayOrder: 1,
    },
  });

  const catWomenHair = await prisma.category.create({
    data: {
      name: 'Kiểu Tóc Nữ',
      slug: 'toc-nu',
      description: 'Những mẫu tóc nữ tinh tế, bồng bềnh chuẩn phong cách nàng thơ Hàn Quốc và Parisienne.',
      type: CategoryType.HAIRSTYLE,
      imageUrl: 'https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&w=800&q=80',
      displayOrder: 2,
    },
  });

  const catHairColors = await prisma.category.create({
    data: {
      name: 'Màu Nhuộm Thời Trang',
      slug: 'nhuom-mau-thoi-trang',
      description: 'Bảng màu nhuộm đa sắc từ tone nâu trầm ấm đến các gam màu khói, pastel sáng tạo.',
      type: CategoryType.SERVICE,
      imageUrl: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=800&q=80',
      displayOrder: 3,
    },
  });

  const catCareServices = await prisma.category.create({
    data: {
      name: 'Chăm Sóc & Phục Hồi',
      slug: 'cham-soc-phuc-hoi',
      description: 'Dịch vụ trị liệu da đầu dưỡng sinh, phục hồi tóc phủ lụa Nano Keratin và Olaplex.',
      type: CategoryType.SERVICE,
      imageUrl: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=800&q=80',
      displayOrder: 4,
    },
  });

  const catCutStyle = await prisma.category.create({
    data: {
      name: 'Cắt & Tạo Kiểu Master',
      slug: 'cat-tao-kieu',
      description: 'Thiết kế form tóc cá nhân hóa theo tỷ lệ khuôn mặt và chất tóc độc bản.',
      type: CategoryType.SERVICE,
      imageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80',
      displayOrder: 5,
    },
  });

  const catWavePerm = await prisma.category.create({
    data: {
      name: 'Uốn Sóng & Nâng Phồng',
      slug: 'uon-dinh-hinh',
      description: 'Công nghệ uốn sóng nước, uốn lạnh và nâng phồng chân tóc không gây khô xơ.',
      type: CategoryType.SERVICE,
      imageUrl: 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=800&q=80',
      displayOrder: 6,
    },
  });

  const catArticles = await prisma.category.create({
    data: {
      name: 'Cẩm Nang Tóc Đẹp',
      slug: 'kien-thuc-toc',
      description: 'Kiến thức chuyên sâu về chăm sóc tóc tẩy, xu hướng làm đẹp và bí quyết giữ màu bền lâu.',
      type: CategoryType.ARTICLE,
      imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
      displayOrder: 7,
    },
  });

  // 5. SEED SERVICES
  console.log('✂️ Creating salon services & combos...');
  const serviceCutMen = await prisma.service.create({
    data: {
      title: 'Cắt Tạo Kiểu Master Stylist',
      slug: 'cat-tao-kieu-master-stylist',
      shortSummary: 'Tư vấn form tóc theo cấu trúc khuôn mặt, cắt tỉa chi tiết và sấy vuốt tạo kiểu cao cấp.',
      description: 'Dịch vụ cắt tóc chuẩn salon cao cấp bao gồm: Khảo sát chất tóc và dáng mặt, gội thư giãn massage da đầu bằng dầu gội thảo dược cao cấp, cắt định hình đường nét bằng kéo chuyên dụng Nhật Bản, cạo viền sắc nét, và sấy tạo kiểu bằng sáp/pomade chính hãng.',
      durationMinutes: 45,
      priceMin: 200000,
      priceMax: 350000,
      preCareAdvice: 'Nên chia sẻ trước với stylist về thói quen chăm sóc tóc hàng ngày và mong muốn độ dài mong muốn.',
      postCareAdvice: 'Sử dụng sáp mờ hoặc xịt muối biển để giữ nếp bồng bềnh tự nhiên suốt cả ngày.',
      imageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80',
      isPopular: true,
      displayOrder: 1,
      categoryId: catCutStyle.id,
    },
  });

  const servicePerm = await prisma.service.create({
    data: {
      title: 'Uốn Máy Phục Hồi Protein Hàn Quốc',
      slug: 'uon-may-phuc-hoi-protein-han-quoc',
      shortSummary: 'Công nghệ uốn sóng setting nhiệt độ kiểm soát vi xử lý kết hợp khóa ẩm Protein tái sinh tủy tóc.',
      description: 'Kỹ thuật uốn setting hiện đại ứng dụng dòng thuốc uốn chứa 80% tinh chất dưỡng ẩm từ đậu nành và tơ tằm. Giúp lọn tóc vào nếp xoăn lơi mềm mại, bóng mượt tự nhiên, hoàn toàn không bị khô giòn ngọn tóc.',
      durationMinutes: 120,
      priceMin: 900000,
      priceMax: 1600000,
      preCareAdvice: 'Không nên gội đầu trước khi đến uốn tóc ít nhất 12 giờ.',
      postCareAdvice: 'Không gội đầu trong 48 giờ đầu tiên. Sử dụng kẹp càng cua cuộn tròn khi đi ngủ để giữ sóng bền trên 6 tháng.',
      imageUrl: 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=800&q=80',
      isPopular: true,
      displayOrder: 2,
      categoryId: catWavePerm.id,
    },
  });

  const serviceDye = await prisma.service.create({
    data: {
      title: 'Nhuộm Màu Thời Trang Organic Không Amoniac',
      slug: 'nhuom-mau-thoi-trang-organic',
      shortSummary: 'Hạt màu siêu mịn thẩm thấu sâu, êm dịu cho da đầu nhạy cảm, độ bóng đa chiều.',
      description: 'Dòng sản phẩm màu nhuộm thuần chay chiết xuất từ tinh dầu Argan và hạt macca tự nhiên. Đảm bảo 100% không mùi hắc amoniac, không xót da đầu, giữ màu bền bỉ với độ ánh quang rực rỡ.',
      durationMinutes: 90,
      priceMin: 800000,
      priceMax: 1500000,
      preCareAdvice: 'Tránh gãi mạnh da đầu 24 giờ trước khi nhuộm.',
      postCareAdvice: 'Dùng dầu gội chuyên dụng không chứa sulfate (Color-safe) để tránh làm trôi hạt màu.',
      imageUrl: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=800&q=80',
      isPopular: true,
      displayOrder: 3,
      categoryId: catHairColors.id,
    },
  });

  const serviceBleach = await prisma.service.create({
    data: {
      title: 'Tẩy Tóc Bảo Vệ Liên Kết Olaplex Chuẩn Quốc Tế',
      slug: 'tay-toc-olaplex-chuan-quoc-te',
      shortSummary: 'Nâng sáng tông màu tóc an toàn với tinh chất nhân đôi liên kết lưu huỳnh Olaplex No.1.',
      description: 'Quy trình tẩy tóc cao cấp bảo vệ tối đa cấu trúc sợi tóc. Bột tẩy giàu dưỡng chất kết hợp Olaplex No.1 giúp tóc nâng sáng lên tới cấp độ 9-10 mà vẫn giữ được độ dai, đàn hồi và bóng khỏe tự nhiên.',
      durationMinutes: 90,
      priceMin: 950000,
      priceMax: 2000000,
      preCareAdvice: 'Ngưng sử dụng các sản phẩm hóa chất nhiệt ít nhất 1 tuần trước khi tẩy.',
      postCareAdvice: 'Bắt buộc sử dụng mặt nạ ủ tóc phục hồi và dầu gội tím khử vàng định kỳ 1-2 lần/tuần.',
      imageUrl: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=800&q=80',
      isPopular: false,
      displayOrder: 4,
      categoryId: catHairColors.id,
    },
  });

  const serviceKeratin = await prisma.service.create({
    data: {
      title: 'Phục Hồi Tóc Phủ Lụa Nano Keratin',
      slug: 'phuc-hoi-nano-keratin',
      shortSummary: 'Bổ sung Keratin thủy phân vào lõi tóc xơ rối, khóa ẩm và tái tạo biểu bì tóc suôn mượt.',
      description: 'Liệu trình đặc trị tóc cháy, tóc xơ nát do lạm dụng tẩy nhuộm. Phân tử Nano Keratin siêu nhỏ lấp đầy các lỗ hổng trên thân tóc, tạo lớp màng bọc bảo vệ óng ả như tơ lụa kéo dài suốt 3-4 tháng.',
      durationMinutes: 75,
      priceMin: 650000,
      priceMax: 1200000,
      preCareAdvice: 'Thích hợp thực hiện ngay sau các liệu trình tẩy hoặc nhuộm màu.',
      postCareAdvice: 'Sấy khô tóc hoàn toàn sau khi gội để kích hoạt lại lớp màng Keratin.',
      imageUrl: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=800&q=80',
      isPopular: true,
      displayOrder: 5,
      categoryId: catCareServices.id,
    },
  });

  const serviceSpa = await prisma.service.create({
    data: {
      title: 'Gội Dưỡng Sinh Thảo Dược Hoàng Cung',
      slug: 'goi-duong-sinh-thao-duoc-hoang-cung',
      shortSummary: 'Thanh lọc da đầu với nước thảo dược nấu tươi, đả thông kinh lạc vùng cổ vai gáy.',
      description: 'Trải nghiệm spa thư giãn đỉnh cao với nước thảo mộc 12 vị thiên nhiên (bồ kết, hương nhu, sả chanh, vỏ bưởi). Kết hợp massage bấm huyệt cổ vai gáy, chườm mắt thảo dược và ngâm chân nước nóng đá muối Himalaya.',
      durationMinutes: 60,
      priceMin: 250000,
      priceMax: 450000,
      preCareAdvice: 'Mặc trang phục thoải mái để tận hưởng trọn vẹn quy trình massage cổ vai gáy.',
      postCareAdvice: 'Uống 1 tách trà hoa cúc ấm sau dịch vụ để cơ thể thải độc hiệu quả nhất.',
      imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80',
      isPopular: false,
      displayOrder: 6,
      categoryId: catCareServices.id,
    },
  });

  // Combos
  const comboGentleman = await prisma.serviceCombo.create({
    data: {
      title: 'Gentleman Luxe Experience',
      slug: 'gentleman-luxe-experience',
      description: 'Gói đặc quyền dành riêng cho phái mạnh: Cắt tạo kiểu Master + Gội massage thảo dược + Uốn phồng chân tóc định hình + Vuốt Pomade cao cấp.',
      packagePrice: 490000,
      originalPrice: 650000,
      durationMinutes: 75,
      savingsPercent: 25,
      imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
      isFeatured: true,
      displayOrder: 1,
      services: {
        connect: [{ id: serviceCutMen.id }, { id: serviceSpa.id }],
      },
    },
  });

  const comboGoddess = await prisma.serviceCombo.create({
    data: {
      title: 'Seoul Goddess Wave & Care',
      slug: 'seoul-goddess-wave-and-care',
      description: 'Biến hóa diện mạo thần thái với combo toàn diện: Cắt Layer phong cách Hàn Quốc + Uốn sóng lơi trục lớn + Phục hồi phủ lụa Nano Keratin.',
      packagePrice: 1750000,
      originalPrice: 2350000,
      durationMinutes: 180,
      savingsPercent: 26,
      imageUrl: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=800&q=80',
      isFeatured: true,
      displayOrder: 2,
      services: {
        connect: [{ id: servicePerm.id }, { id: serviceKeratin.id }],
      },
    },
  });

  const comboPlatinum = await prisma.serviceCombo.create({
    data: {
      title: 'Platinum Trendsetter Makeover',
      slug: 'platinum-trendsetter-makeover',
      description: 'Gói tẩy nhuộm đỉnh cao: 2 lần tẩy nâng sáng Olaplex + Nhuộm màu khói/bạch kim cao cấp + Hấp khóa hạt màu chuyên sâu.',
      packagePrice: 2600000,
      originalPrice: 3500000,
      durationMinutes: 240,
      savingsPercent: 26,
      imageUrl: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=800&q=80',
      isFeatured: true,
      displayOrder: 3,
      services: {
        connect: [{ id: serviceBleach.id }, { id: serviceDye.id }],
      },
    },
  });

  // 6. SEED HAIRSTYLES (>= 12 STYLES)
  console.log('💇 Creating hairstyles catalog...');
  const hairstylesData = [
    {
      title: 'Textured Crop Hàn Quốc',
      slug: 'textured-crop-han-quoc',
      summary: 'Kiểu tóc ngắn năng động với lớp layer dập nhẹ phía trên, viền fade gọn gàng tôn trán.',
      description: 'Textured Crop là sự pha trộn hoàn hảo giữa vẻ nam tính và sự trẻ trung. Phần mái được cắt ngang trên lông mày tỉa texture nhấp nhô, hai bên mai được fade gọn giúp làm nổi bật góc hàm sắc sảo.',
      coverImageUrl: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=800&q=80',
      galleryImages: [
        'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80',
      ],
      gender: GenderTarget.MALE,
      length: HairLength.SHORT,
      suitableFaces: [FaceShape.OVAL, FaceShape.ROUND, FaceShape.HEART],
      suitableTexture: [HairTexture.STRAIGHT, HairTexture.THICK],
      careEffort: CareEffort.LOW,
      styleVibe: StyleVibe.KOREAN,
      careAdvice: 'Chỉ cần sấy khô tự nhiên và xoa một lượng nhỏ sáp mờ matte clay là tóc đã vào phom.',
      stylingTips: 'Sử dụng thêm một lớp xịt phồng muối biển pre-styling khi tóc còn hơi ẩm.',
      priceRefMin: 180000,
      priceRefMax: 250000,
      isTrending: true,
      isFeatured: true,
      categoryId: catMenHair.id,
      services: [serviceCutMen.id],
    },
    {
      title: 'Modern Pompadour Quý Tộc',
      slug: 'modern-pompadour-quy-toc',
      summary: 'Biểu tượng lịch lãm của quý ông hiện đại với phần mái hất ngược tạo phồng cổ điển.',
      description: 'Kiểu tóc Pompadour mang lại khí chất thành đạt và tự tin. Phần tóc trên đỉnh được giữ độ dài lý tưởng 8-10cm, vuốt phồng ngược về sau kết hợp fade tàng hình mượt mà hai bên.',
      coverImageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
      galleryImages: ['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80'],
      gender: GenderTarget.MALE,
      length: HairLength.MEDIUM,
      suitableFaces: [FaceShape.SQUARE, FaceShape.OVAL, FaceShape.DIAMOND],
      suitableTexture: [HairTexture.THICK, HairTexture.STRAIGHT],
      careEffort: CareEffort.HIGH,
      styleVibe: StyleVibe.CLASSIC,
      careAdvice: 'Cần sấy định hình với lược tròn chuyên dụng và cố định bằng pomade gốc nước.',
      stylingTips: 'Sấy ngược hướng gió từ chân tóc để đạt được độ phồng tối đa 5-7cm.',
      priceRefMin: 250000,
      priceRefMax: 350000,
      isTrending: false,
      isFeatured: true,
      categoryId: catMenHair.id,
      services: [serviceCutMen.id],
    },
    {
      title: 'Two-Block Layer Lãng Tử',
      slug: 'two-block-layer-lang-tu',
      summary: 'Thiết kế 2 tầng đặc trưng của các idol xứ kim chi, che khuyết điểm trán cao hoàn hảo.',
      description: 'Tóc Two-Block phân tách thành 2 khối rõ rệt: Khối dưới cắt ngắn gọn sát gáy, khối trên phủ xuống tỉa layer mềm mại giúp mái tóc có độ bay và nét thư sinh quyến rũ.',
      coverImageUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=800&q=80',
      galleryImages: ['https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=800&q=80'],
      gender: GenderTarget.MALE,
      length: HairLength.MEDIUM,
      suitableFaces: [FaceShape.OVAL, FaceShape.HEART, FaceShape.OBLONG],
      suitableTexture: [HairTexture.STRAIGHT, HairTexture.WAVY, HairTexture.FINE],
      careEffort: CareEffort.MEDIUM,
      styleVibe: StyleVibe.KOREAN,
      careAdvice: 'Nên kết hợp uốn nhẹ chân tóc để mái tóc luôn giữ được độ phồng bồng bềnh sau khi ngủ dậy.',
      stylingTips: 'Dùng ngón tay luồn nhẹ vuốt bung tự nhiên, không cần chải lược cứng.',
      priceRefMin: 200000,
      priceRefMax: 300000,
      isTrending: true,
      isFeatured: true,
      categoryId: catMenHair.id,
      services: [serviceCutMen.id],
    },
    {
      title: 'Side Part 7/3 Rủ Hiện Đại',
      slug: 'side-part-7-3-ru-hien-dai',
      summary: 'Tỷ lệ chia ngôi 7/3 kinh điển kết hợp phần mái rủ nhẹ tạo cảm giác ấm áp, lịch lãm.',
      description: 'Kiểu tóc linh hoạt phù hợp cả môi trường công sở sang trọng lẫn những buổi hẹn hò lãng mạn. Ranh giới chia ngôi tự nhiên uốn nhẹ hình chữ C tạo điểm nhấn tinh tế.',
      coverImageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
      galleryImages: ['https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80'],
      gender: GenderTarget.MALE,
      length: HairLength.MEDIUM,
      suitableFaces: [FaceShape.ALL],
      suitableTexture: [HairTexture.STRAIGHT, HairTexture.THICK],
      careEffort: CareEffort.MEDIUM,
      styleVibe: StyleVibe.BUSINESS,
      careAdvice: 'Dùng dầu dưỡng nhẹ và sấy nếp rẽ ngôi ngay sau khi gội đầu.',
      stylingTips: 'Xịt gôm mềm để giữ form mà không làm cứng sợi tóc.',
      priceRefMin: 220000,
      priceRefMax: 320000,
      isTrending: false,
      isFeatured: false,
      categoryId: catMenHair.id,
      services: [serviceCutMen.id],
    },
    {
      title: 'Mullet Layer Phá Cách',
      slug: 'mullet-layer-pha-cach',
      summary: 'Phong cách nổi loạn hiện đại với phần đuôi gáy dài chạm cổ và mái tỉa bất đối xứng.',
      description: 'Mullet hiện đại được biến tấu với các lớp layer mềm mại, loại bỏ cảm giác nặng nề cổ điển. Thích hợp cho những bạn trẻ yêu thích thời trang đường phố và gu thẩm mỹ phá cách.',
      coverImageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
      galleryImages: ['https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80'],
      gender: GenderTarget.UNISEX,
      length: HairLength.MEDIUM,
      suitableFaces: [FaceShape.OVAL, FaceShape.ROUND, FaceShape.DIAMOND],
      suitableTexture: [HairTexture.WAVY, HairTexture.THICK],
      careEffort: CareEffort.MEDIUM,
      styleVibe: StyleVibe.STREETWEAR,
      careAdvice: 'Gội đầu với dầu gội dưỡng ẩm và sấy bung nhẹ phần đuôi tóc.',
      stylingTips: 'Vuốt một chút mousse tạo nếp uốn nhẹ ở ngọn tóc phía sau.',
      priceRefMin: 250000,
      priceRefMax: 400000,
      isTrending: true,
      isFeatured: false,
      categoryId: catMenHair.id,
      services: [serviceCutMen.id],
    },
    {
      title: 'Buzz Cut Fade Sắc Nét',
      slug: 'buzz-cut-fade-sac-net',
      summary: 'Kiểu đầu đinh tối giản làm bật trọn vẹn từng đường nét góc cạnh trên khuôn mặt.',
      description: 'Đỉnh cao của sự gọn gàng và nam tính tối thượng. Đòi hỏi kỹ thuật Fade cạo sát tay nghề cao để tạo nên dải chuyển tiếp độ dài từ 0.5mm lên 6mm mượt mà như nhung.',
      coverImageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80',
      galleryImages: ['https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80'],
      gender: GenderTarget.MALE,
      length: HairLength.VERY_SHORT,
      suitableFaces: [FaceShape.OVAL, FaceShape.SQUARE],
      suitableTexture: [HairTexture.THICK, HairTexture.COILY],
      careEffort: CareEffort.LOW,
      styleVibe: StyleVibe.MINIMALIST,
      careAdvice: 'Chăm sóc da đầu chống nắng và dưỡng ẩm, cắt dặm lại sau mỗi 2-3 tuần.',
      stylingTips: 'Không cần tạo kiểu, rửa mặt kiêm gội đầu cực kỳ tiện lợi.',
      priceRefMin: 150000,
      priceRefMax: 200000,
      isTrending: false,
      isFeatured: false,
      categoryId: catMenHair.id,
      services: [serviceCutMen.id],
    },
    {
      title: 'Layer Nữ Phồng Chữ C',
      slug: 'layer-nu-phong-chu-c',
      summary: 'Các tầng layer ôm nhẹ gương mặt, ngọn tóc uốn cụp hình chữ C tạo hiệu ứng mặt thon gọn.',
      description: 'Mẫu tóc quốc dân được phái đẹp yêu thích nhất nhiều năm liền. Từng lọn tóc được cắt tỉa bậc thang tinh tế, đuôi tóc cụp nhẹ che phủ xương quai hàm và tôn nét thanh tú.',
      coverImageUrl: 'https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&w=800&q=80',
      galleryImages: ['https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&w=800&q=80'],
      gender: GenderTarget.FEMALE,
      length: HairLength.LONG,
      suitableFaces: [FaceShape.ALL],
      suitableTexture: [HairTexture.STRAIGHT, HairTexture.FINE],
      careEffort: CareEffort.LOW,
      styleVibe: StyleVibe.KOREAN,
      careAdvice: 'Dùng lược tròn cuộn ngọn tóc khi sấy ấm là tóc sẽ tự động cụp vào nếp.',
      stylingTips: 'Thoa một giọt tinh dầu dưỡng bóng ở phần đuôi tóc để tránh chẻ ngọn.',
      priceRefMin: 350000,
      priceRefMax: 550000,
      isTrending: true,
      isFeatured: true,
      categoryId: catWomenHair.id,
      services: [serviceCutMen.id, servicePerm.id],
    },
    {
      title: 'Bob Tỉa Tầng Nhật Bản (Shag Bob)',
      slug: 'bob-tia-tang-nhat-ban',
      summary: 'Mái tóc ngắn cá tính mang âm hưởng Tokyo Chic, nhẹ tênh và tôn bờ vai gợi cảm.',
      description: 'Mẫu tóc ngắn năng động cắt ngang xương hàm kết hợp tỉa so le tinh tế. Giúp mái tóc trông dày dặn hơn gấp đôi và mang lại vẻ ngoài thông minh, sắc sảo cho quý cô hiện đại.',
      coverImageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80',
      galleryImages: ['https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80'],
      gender: GenderTarget.FEMALE,
      length: HairLength.SHORT,
      suitableFaces: [FaceShape.OVAL, FaceShape.DIAMOND, FaceShape.HEART],
      suitableTexture: [HairTexture.STRAIGHT, HairTexture.THICK],
      careEffort: CareEffort.LOW,
      styleVibe: StyleVibe.JAPANESE,
      careAdvice: 'Sấy tóc hướng về phía trước và dùng một lượng dầu dưỡng nhẹ tạo độ bóng ướt (wet look).',
      stylingTips: 'Kẹp một bên tóc sau tai để khoe trọn khuyên tai và đường xương hàm.',
      priceRefMin: 300000,
      priceRefMax: 450000,
      isTrending: false,
      isFeatured: true,
      categoryId: catWomenHair.id,
      services: [serviceCutMen.id],
    },
    {
      title: 'Uốn Sóng Lơi Nước Pháp (French Water Waves)',
      slug: 'uon-song-loi-nuoc-phap',
      summary: 'Những lọn sóng lơi buông lơi tự nhiên như nước chảy, mang lại thần thái kiêu sa thanh lịch.',
      description: 'Không cầu kỳ vào lọn tròn cứng nhắc, sóng lơi nước Pháp tạo cảm giác tự nhiên như vừa thức giấc ở Paris. Mái tóc bồng bềnh chuyển động theo từng bước chân đầy mê hoặc.',
      coverImageUrl: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=800&q=80',
      galleryImages: ['https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=800&q=80'],
      gender: GenderTarget.FEMALE,
      length: HairLength.LONG,
      suitableFaces: [FaceShape.OVAL, FaceShape.OBLONG, FaceShape.ROUND],
      suitableTexture: [HairTexture.WAVY, HairTexture.FINE],
      careEffort: CareEffort.MEDIUM,
      styleVibe: StyleVibe.AVANT_GARDE,
      careAdvice: 'Dùng kẹp càng cua cuộn nhẹ sau khi sấy tóc khô 80%.',
      stylingTips: 'Xịt một lớp khoáng dưỡng ẩm trước khi ra ngoài để bảo vệ sợi tóc trước khói bụi.',
      priceRefMin: 800000,
      priceRefMax: 1500000,
      isTrending: true,
      isFeatured: true,
      categoryId: catWomenHair.id,
      services: [servicePerm.id],
    },
    {
      title: 'Butterfly Cut Thần Thái (Layer Cánh Bướm)',
      slug: 'butterfly-cut-than-thai',
      summary: 'Các tầng tóc đan xen bồng bềnh mô phỏng sải cánh bướm, bay bổng và đầy sức sống.',
      description: 'Cơn sốt từ thảm đỏ quốc tế với sự hòa trộn của 2 độ dài: Tầng ngắn ôm sát cằm tạo hiệu ứng tóc ngắn giả và tầng dài thướt tha ngang lưng, tạo độ phồng tối đa cho mái tóc mỏng.',
      coverImageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
      galleryImages: ['https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80'],
      gender: GenderTarget.FEMALE,
      length: HairLength.LONG,
      suitableFaces: [FaceShape.ROUND, FaceShape.SQUARE, FaceShape.OVAL],
      suitableTexture: [HairTexture.THICK, HairTexture.WAVY],
      careEffort: CareEffort.MEDIUM,
      styleVibe: StyleVibe.CLASSIC,
      careAdvice: 'Sấy ngửa ra sau bằng lô cuốn cỡ lớn để tạo độ bay cho các tầng tóc.',
      stylingTips: 'Sử dụng xịt tạo kết cấu texture spray giúp các nếp tóc tách lớp rõ rệt.',
      priceRefMin: 400000,
      priceRefMax: 650000,
      isTrending: true,
      isFeatured: false,
      categoryId: catWomenHair.id,
      services: [serviceCutMen.id],
    },
    {
      title: 'Wolf Cut Thập Niên 90',
      slug: 'wolf-cut-thap-nien-90',
      summary: 'Sự giao thoa đầy hoang dại giữa Mullet và Shag, biểu tượng phong cách phi giới tính.',
      description: 'Đặc trưng với phần đỉnh đầu phồng dày và xẹp dần về phía đuôi tóc với vô số lớp cắt xơ nhám. Mang đến nét đẹp bụi bặm, hoang dại và đậm chất Rock & Roll.',
      coverImageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
      galleryImages: ['https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80'],
      gender: GenderTarget.UNISEX,
      length: HairLength.MEDIUM,
      suitableFaces: [FaceShape.ALL],
      suitableTexture: [HairTexture.WAVY, HairTexture.THICK],
      careEffort: CareEffort.MEDIUM,
      styleVibe: StyleVibe.STREETWEAR,
      careAdvice: 'Để tóc khô tự nhiên kết hợp bóp nhẹ dầu dưỡng tạo nếp nhăn ngẫu hứng.',
      stylingTips: 'Nhuộm highlight ẩn (peekaboo) sẽ làm các lớp cắt wolf cut nổi bật hơn bao giờ hết.',
      priceRefMin: 350000,
      priceRefMax: 500000,
      isTrending: false,
      isFeatured: false,
      categoryId: catWomenHair.id,
      services: [serviceCutMen.id],
    },
    {
      title: 'Pixie Cut Năng Động Quý Phái',
      slug: 'pixie-cut-nang-dong-quy-phai',
      summary: 'Tóc tém ngắn táo bạo làm nổi bật cổ thon, xương quai xanh và đôi mắt tinh anh.',
      description: 'Lựa chọn của những người phụ nữ bản lĩnh và tự tin. Từng đường kéo ôm trọn gáy, mái lệch dài vuốt xéo đem lại nét quyến rũ không thể cưỡng lại.',
      coverImageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80',
      galleryImages: ['https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80'],
      gender: GenderTarget.FEMALE,
      length: HairLength.VERY_SHORT,
      suitableFaces: [FaceShape.OVAL, FaceShape.HEART],
      suitableTexture: [HairTexture.FINE, HairTexture.STRAIGHT],
      careEffort: CareEffort.MEDIUM,
      styleVibe: StyleVibe.MINIMALIST,
      careAdvice: 'Cần sấy định hình mỗi sáng để giữ form ôm gáy hoàn hảo.',
      stylingTips: 'Dùng một chút gel tạo kiểu bóng nhẹ để tôn vẻ sang trọng.',
      priceRefMin: 300000,
      priceRefMax: 450000,
      isTrending: false,
      isFeatured: false,
      categoryId: catWomenHair.id,
      services: [serviceCutMen.id],
    },
    {
      title: 'Curtain Bangs Uốn Cụp Dịu Dàng',
      slug: 'curtain-bangs-uon-cup',
      summary: 'Mái bay rẽ đôi mềm mại như rèm cửa sổ, hóa giải mọi khuyết điểm thái dương lõm.',
      description: 'Phần tóc mái bay dài ngang gò má rẽ ngôi giữa hoặc 6/4 uốn cong nhẹ nhàng về sau. Giúp gương mặt trông thon dài, thanh thoát và đậm chất tiểu thư kiêu kỳ.',
      coverImageUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
      galleryImages: ['https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80'],
      gender: GenderTarget.FEMALE,
      length: HairLength.MEDIUM,
      suitableFaces: [FaceShape.ROUND, FaceShape.OVAL, FaceShape.SQUARE],
      suitableTexture: [HairTexture.FINE, HairTexture.STRAIGHT],
      careEffort: CareEffort.LOW,
      styleVibe: StyleVibe.KOREAN,
      careAdvice: 'Cuộn lô mái 15 phút mỗi sáng khi trang điểm.',
      stylingTips: 'Sấy ấm vào lô cuốn và sấy lạnh 5 giây để khóa nếp cong hoàn hảo.',
      priceRefMin: 280000,
      priceRefMax: 420000,
      isTrending: true,
      isFeatured: false,
      categoryId: catWomenHair.id,
      services: [serviceCutMen.id, servicePerm.id],
    },
  ];

  for (const style of hairstylesData) {
    const { services, ...rest } = style;
    await prisma.hairstyle.create({
      data: {
        ...rest,
        services: {
          connect: services.map((sId) => ({ id: sId })),
        },
      },
    });
  }

  // 7. SEED HAIR COLORS (>= 10 SWATCHES)
  console.log('🎨 Creating hair color swatches...');
  const colorsData = [
    {
      name: 'Nâu Tây Lạnh (Cold Mocha)',
      code: 'MOCHA-6.1',
      hexColor: '#59493E',
      secondaryHex: '#7C6A5D',
      tone: ColorTone.COOL,
      group: ColorGroup.BROWN,
      brightnessLevel: 6,
      requiresBleach: false,
      bleachRounds: 0,
      suitableSkinTones: ['Da sáng', 'Da trung tính', 'Da ngăm bánh mật'],
      maintenanceLevel: CareEffort.LOW,
      colorFadingAdvice: 'Màu phai chậm ra tông nâu trầm tự nhiên, không bao giờ lo bị ánh vàng cháy ngọn.',
      isTrending: true,
      displayOrder: 1,
    },
    {
      name: 'Xám Khói Ánh Bạc (Silver Smoke)',
      code: 'SILVER-9.11',
      hexColor: '#9E9D9B',
      secondaryHex: '#D1D5DB',
      tone: ColorTone.COOL,
      group: ColorGroup.ASH_SMOKY,
      brightnessLevel: 9,
      requiresBleach: true,
      bleachRounds: 2,
      suitableSkinTones: ['Da trắng sáng', 'Da hồng hào'],
      maintenanceLevel: CareEffort.HIGH,
      colorFadingAdvice: 'Cần gội dầu gội tím (Silver Shampoo) 2 lần/tuần để khử ánh vàng ố, màu sẽ phai ra bạch kim.',
      isTrending: true,
      displayOrder: 2,
    },
    {
      name: 'Trà Sữa Caramel (Caramel Milk Tea)',
      code: 'CARAMEL-7.32',
      hexColor: '#BFA082',
      secondaryHex: '#E5D3B8',
      tone: ColorTone.WARM,
      group: ColorGroup.BROWN,
      brightnessLevel: 7,
      requiresBleach: true,
      bleachRounds: 1,
      suitableSkinTones: ['Da sáng', 'Da trung tính'],
      maintenanceLevel: CareEffort.MEDIUM,
      colorFadingAdvice: 'Phai dần ra màu nâu hạt dẻ sáng dịu ngọt, dễ nhuộm đè màu khác sau 3 tháng.',
      isTrending: true,
      displayOrder: 3,
    },
    {
      name: 'Đỏ Rượu Cherry (Burgundy Velvet)',
      code: 'BURGUNDY-5.66',
      hexColor: '#6E2639',
      secondaryHex: '#9E3B53',
      tone: ColorTone.COOL,
      group: ColorGroup.RED_BURGUNDY,
      brightnessLevel: 5,
      requiresBleach: false,
      bleachRounds: 0,
      suitableSkinTones: ['Mọi tông da', 'Đặc biệt tôn da ngăm'],
      maintenanceLevel: CareEffort.LOW,
      colorFadingAdvice: 'Cực kỳ bền màu, phai dần sang màu nâu ánh đỏ quý phái.',
      isTrending: false,
      displayOrder: 4,
    },
    {
      name: 'Bạch Kim Nordic (Platinum Ice)',
      code: 'PLATINUM-10.0',
      hexColor: '#E5E3D8',
      secondaryHex: '#FAF7EE',
      tone: ColorTone.COOL,
      group: ColorGroup.BLONDE,
      brightnessLevel: 10,
      requiresBleach: true,
      bleachRounds: 3,
      suitableSkinTones: ['Da trắng hồng'],
      maintenanceLevel: CareEffort.HIGH,
      colorFadingAdvice: 'Bắt buộc chăm sóc phục hồi chuyên sâu Olaplex tại nhà để tránh gãy rụng.',
      isTrending: true,
      displayOrder: 5,
    },
    {
      name: 'Nâu Hạt Dẻ Cổ Điển (Classic Chestnut)',
      code: 'CHESTNUT-5.0',
      hexColor: '#4A3728',
      secondaryHex: '#6B4F3B',
      tone: ColorTone.NEUTRAL,
      group: ColorGroup.BROWN,
      brightnessLevel: 5,
      requiresBleach: false,
      bleachRounds: 0,
      suitableSkinTones: ['Mọi loại da'],
      maintenanceLevel: CareEffort.LOW,
      colorFadingAdvice: 'Màu nhuộm an toàn tuyệt đối, bóng khỏe và không lộ chân tóc khi mọc dài.',
      isTrending: false,
      displayOrder: 6,
    },
    {
      name: 'Nâu Rêu Khói Mờ (Smoky Matcha)',
      code: 'MATCHA-7.21',
      hexColor: '#686E5E',
      secondaryHex: '#8C9480',
      tone: ColorTone.COOL,
      group: ColorGroup.ASH_SMOKY,
      brightnessLevel: 7,
      requiresBleach: true,
      bleachRounds: 1,
      suitableSkinTones: ['Da sáng', 'Da trung tính'],
      maintenanceLevel: CareEffort.MEDIUM,
      colorFadingAdvice: 'Sau 4-6 tuần sẽ phai dần ra nâu rêu sáng nhẹ nhàng.',
      isTrending: true,
      displayOrder: 7,
    },
    {
      name: 'Hồng Pastel Ánh Khói (Smoky Rose)',
      code: 'ROSE-9.26',
      hexColor: '#D8A4AC',
      secondaryHex: '#F2CCD2',
      tone: ColorTone.WARM,
      group: ColorGroup.PASTEL,
      brightnessLevel: 9,
      requiresBleach: true,
      bleachRounds: 2,
      suitableSkinTones: ['Da trắng sáng'],
      maintenanceLevel: CareEffort.HIGH,
      colorFadingAdvice: 'Phai dần ra màu vàng kem bạch kim sau khoảng 3-4 tuần.',
      isTrending: true,
      displayOrder: 8,
    },
    {
      name: 'Đen Ánh Xanh Sapphire (Midnight Blue)',
      code: 'MIDNIGHT-2.1',
      hexColor: '#1E2530',
      secondaryHex: '#2E3A4D',
      tone: ColorTone.COOL,
      group: ColorGroup.BLACK_DARK,
      brightnessLevel: 2,
      requiresBleach: false,
      bleachRounds: 0,
      suitableSkinTones: ['Mọi loại da'],
      maintenanceLevel: CareEffort.LOW,
      colorFadingAdvice: 'Trong phòng nhìn đen tự nhiên, ra nắng bừng sáng ánh xanh sapphire huyền bí.',
      isTrending: false,
      displayOrder: 9,
    },
    {
      name: 'Vàng Mật Ong Ánh Đồng (Honey Amber)',
      code: 'HONEY-8.34',
      hexColor: '#C88A42',
      secondaryHex: '#E3AB67',
      tone: ColorTone.WARM,
      group: ColorGroup.BLONDE,
      brightnessLevel: 8,
      requiresBleach: true,
      bleachRounds: 1,
      suitableSkinTones: ['Da sáng', 'Da trung tính ấm'],
      maintenanceLevel: CareEffort.MEDIUM,
      colorFadingAdvice: 'Mang lại vẻ ấm áp rạng rỡ mùa lễ hội, phai ra tông vàng tây sang trọng.',
      isTrending: false,
      displayOrder: 10,
    },
    {
      name: 'Tím Khói Huyền Bí (Mystic Lavender)',
      code: 'LAVENDER-8.22',
      hexColor: '#8A7B94',
      secondaryHex: '#B2A3BC',
      tone: ColorTone.COOL,
      group: ColorGroup.FASHION_VIBRANT,
      brightnessLevel: 8,
      requiresBleach: true,
      bleachRounds: 2,
      suitableSkinTones: ['Da trắng sáng'],
      maintenanceLevel: CareEffort.HIGH,
      colorFadingAdvice: 'Phai dần sang ánh khói xám bạc cực tây sau 10 lần gội.',
      isTrending: true,
      displayOrder: 11,
    },
  ];

  for (const c of colorsData) {
    await prisma.hairColor.create({ data: c });
  }

  // 8. SEED BEFORE & AFTER SHOWCASE (>= 4 ITEMS)
  console.log('🔄 Creating Before/After transformations...');
  const styleTwoBlock = await prisma.hairstyle.findUnique({ where: { slug: 'two-block-layer-lang-tu' } });
  const styleWaterWave = await prisma.hairstyle.findUnique({ where: { slug: 'uon-song-loi-nuoc-phap' } });
  const styleButterfly = await prisma.hairstyle.findUnique({ where: { slug: 'butterfly-cut-than-thai' } });

  await prisma.beforeAfter.createMany({
    data: [
      {
        title: 'Lột xác mái tóc xơ rối thành Two-Block Hàn Quốc lãng tử',
        description: 'Khách hàng có mái tóc chỉa, khô xơ do dùng gel sai cách. Master Alex Trần đã xử lý ép side định hình và cắt tỉa Two-Block mềm mại.',
        beforeImageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80',
        afterImageUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=800&q=80',
        customerGender: GenderTarget.MALE,
        serviceId: serviceCutMen.id,
        hairstyleId: styleTwoBlock?.id,
        stylistId: stylistAlex.id,
        isFeatured: true,
        displayOrder: 1,
      },
      {
        title: 'Tái sinh mái tóc cháy ngọn thành sóng lơi Pháp bồng bềnh',
        description: 'Tóc khách hàng bị hư tổn độ 4 do uốn nhiệt sai cách trước đó. Master Kenji Đặng phục hồi Keratin trước khi vào thuốc uốn sóng lơi.',
        beforeImageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
        afterImageUrl: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=800&q=80',
        customerGender: GenderTarget.FEMALE,
        serviceId: servicePerm.id,
        hairstyleId: styleWaterWave?.id,
        stylistId: stylistKenji.id,
        isFeatured: true,
        displayOrder: 2,
      },
      {
        title: 'Biến hóa diện mạo ngoạn mục cùng tóc tẩy Bạch Kim Nordic',
        description: 'Nâng sáng an toàn 3 cấp độ từ nền tóc đen tự nhiên bằng Olaplex No.1, phủ màu bạch kim lạnh óng ả bởi Chuyên gia Elena Vũ.',
        beforeImageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
        afterImageUrl: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=800&q=80',
        customerGender: GenderTarget.FEMALE,
        serviceId: serviceBleach.id,
        stylistId: stylistElena.id,
        isFeatured: true,
        displayOrder: 3,
      },
      {
        title: 'Giải cứu tóc mỏng xẹp với Butterfly Cut tầng lớp sống động',
        description: 'Kỹ thuật cắt tỉa layer cánh bướm giúp tăng độ dày thị giác lên 200%, ngọn tóc bay bổng tự nhiên không cần sấy cầu kỳ.',
        beforeImageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80',
        afterImageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
        customerGender: GenderTarget.FEMALE,
        serviceId: serviceCutMen.id,
        hairstyleId: styleButterfly?.id,
        stylistId: stylistKenji.id,
        isFeatured: false,
        displayOrder: 4,
      },
    ],
  });

  // 9. SEED BANNERS (>= 4 ITEMS)
  console.log('🖼️ Creating dynamic hero banners...');
  await prisma.banner.createMany({
    data: [
      {
        title: 'Bản Giao Hưởng Xu Hướng Tóc 2026',
        subtitle: 'Định hình phong cách độc bản với những thiết kế tóc thời thượng chuẩn Paris & Seoul.',
        badgeText: 'BỘ SƯU TẬP MỚI 2026',
        imageUrl: 'https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&w=1920&q=85',
        mobileImageUrl: 'https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&w=800&q=85',
        linkUrl: '/hairstyles',
        ctaText: 'Khám phá Bộ Sưu Tập',
        displayOrder: 1,
        isActive: true,
      },
      {
        title: 'Đặc Quyền Hội Viên: Nhuộm & Phục Hồi Olaplex',
        subtitle: 'Tặng ngay liệu trình phủ lụa Nano Keratin trị giá 650.000đ khi đặt lịch nhuộm màu Organic.',
        badgeText: 'ƯU ĐÃI ĐẶC QUYỀN',
        imageUrl: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=1920&q=85',
        mobileImageUrl: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=800&q=85',
        linkUrl: '/booking',
        ctaText: 'Nhận Ưu Đãi Ngay',
        displayOrder: 2,
        isActive: true,
      },
      {
        title: 'Thử Kiểu Tóc & Màu Nhuộm Trực Quan Trên Ảnh Của Bạn',
        subtitle: 'Trải nghiệm phòng thử tóc công nghệ tương tác trước khi quyết định thay đổi diện mạo.',
        badgeText: 'CÔNG NGHỆ THỬ TÓC',
        imageUrl: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=1920&q=85',
        mobileImageUrl: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=800&q=85',
        linkUrl: '/try-on',
        ctaText: 'Thử Tóc Ngay',
        displayOrder: 3,
        isActive: true,
      },
      {
        title: 'Gentleman Atelier: Nghệ Thuật Cắt Tỉa & Gội Thảo Dược',
        subtitle: 'Không gian thư giãn đẳng cấp dành riêng cho quý ông tinh tế tại trung tâm Quận 1.',
        badgeText: 'DÀNH CHO PHÁI MẠNH',
        imageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1920&q=85',
        mobileImageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=85',
        linkUrl: '/services',
        ctaText: 'Xem Bảng Giá Dịch Vụ',
        displayOrder: 4,
        isActive: true,
      },
    ],
  });

  // 10. SEED ARTICLES (>= 3 ARTICLES)
  console.log('📰 Creating SEO care advisory articles...');
  await prisma.article.createMany({
    data: [
      {
        title: 'Bí Quyết Giữ Màu Tóc Tẩy Lâu Phai: Hướng Dẫn Toàn Diện Từ Chuyên Gia',
        slug: 'bi-quyet-giu-mau-toc-tay-lau-phai',
        excerpt: 'Khám phá quy tắc vàng trong việc sử dụng dầu gội tím, nhiệt độ nước và chu kỳ ủ tóc giúp mái tóc tẩy giữ màu sáng trong veo suốt nhiều tháng.',
        content: `### 1. Tại sao tóc tẩy lại nhanh phai màu?
Khi tẩy tóc, hóa chất mở bung lớp biểu bì sợi tóc để loại bỏ hạt sắc tố melanin tự nhiên. Điều này vô tình khiến các hạt màu nhân tạo dễ dàng bị rửa trôi dưới tác động của nước và dầu gội có tính tẩy mạnh.

### 2. Ba nguyên tắc vàng giữ màu bền bỉ
* **Hạ nhiệt độ nước gội:** Luôn sử dụng nước mát hoặc hơi ấm nhẹ. Nước nóng làm biểu bì tóc giãn nở và cuốn trôi hạt màu chỉ sau vài lần gội.
* **Đầu tư dầu gội tím chuyên dụng:** Dầu gội tím chứa các hạt màu tím đối xứng trên bánh xe màu sắc, có nhiệm vụ trung hòa ánh vàng và đồng đỏ xỉn màu.
* **Ủ dưỡng phục hồi liên kết:** Các dòng sản phẩm bổ sung protein và liên kết lưu huỳnh như Olaplex No.3 giúp hàn gắn thân tóc, giữ hạt màu ở lại lâu hơn trong lõi tóc.`,
        coverImageUrl: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=800&q=80',
        tags: ['Dưỡng tóc tẩy', 'Chăm sóc màu', 'Olaplex', 'Mẹo salon'],
        metaTitle: 'Bí Quyết Giữ Màu Tóc Tẩy Lâu Phai Chuẩn Salon | Lumière Hair Atelier',
        metaDescription: 'Hướng dẫn chi tiết từ Master Colorist cách chăm sóc tóc tẩy, quy trình dùng dầu gội tím và mẹo phục hồi tóc sau tẩy an toàn.',
        authorId: stylistElena.id,
        categoryId: catArticles.id,
        isPublished: true,
        publishedAt: new Date('2026-10-01T08:00:00Z'),
        viewCount: 1420,
      },
      {
        title: 'Cách Chọn Kiểu Tóc Phù Hợp Từng Dáng Khuôn Mặt: Tròn, Vuông, Trái Xoan',
        slug: 'cach-chon-kieu-toc-phu-hop-tung-dang-mat',
        excerpt: 'Không có kiểu tóc đẹp nhất, chỉ có kiểu tóc hài hòa nhất với tỷ lệ khuôn mặt của bạn. Cùng chuyên gia phân tích bí quyết cân đối diện mạo.',
        content: `### 1. Mặt tròn (Round Face)
Ưu tiên kiểu tóc có độ phồng ở đỉnh đầu hoặc layer dài quá cằm như Curtain Bangs hoặc Layer chữ C để tạo cảm giác khuôn mặt thon dài thanh thoát. Tránh tóc bằng mái dày ngang trán.

### 2. Mặt vuông (Square Face)
Cần những đường cắt uốn lượn mềm mại như sóng lơi, mullet nhẹ hoặc tóc bob tỉa đuôi mềm để làm dịu góc xương hàm sắc sảo.

### 3. Mặt trái xoan (Oval Face)
Dáng mặt chuẩn tỉ lệ vàng! Bạn có thể tự tin trải nghiệm mọi phong cách từ Pixie siêu ngắn, Textured Crop cá tính cho đến tóc dài bồng bềnh.`,
        coverImageUrl: 'https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&w=800&q=80',
        tags: ['Tư vấn kiểu tóc', 'Dáng mặt', 'Xu hướng tóc', 'Phong cách'],
        metaTitle: 'Hướng Dẫn Chọn Kiểu Tóc Phù Hợp Dáng Mặt | Lumière Hair Atelier',
        metaDescription: 'Khám phá bí quyết chọn mẫu tóc tôn vinh nét đẹp tự nhiên cho mặt tròn, mặt vuông và mặt trái xoan cùng các Master Stylist.',
        authorId: stylistKenji.id,
        categoryId: catArticles.id,
        isPublished: true,
        publishedAt: new Date('2026-10-08T09:30:00Z'),
        viewCount: 2310,
      },
      {
        title: 'Quy Trình Phục Hồi Tóc Hư Tổn Nặng Do Nhiệt & Hóa Chất Tại Nhà',
        slug: 'quy-trinh-phuc-hoi-toc-hu-ton-tai-nha',
        excerpt: 'Lộ trình 4 tuần cấp cứu mái tóc chẻ ngọn, khô xơ xác xơ với các bước trị liệu khoa học và liệu pháp massage kích thích nang tóc.',
        content: `### Giai đoạn 1: Thanh lọc và dừng nhiệt (Tuần 1)
Hạn chế tối đa máy sấy nhiệt độ cao, máy uốn và máy là. Để tóc khô tự nhiên 80% trước khi sấy gió mát.

### Giai đoạn 2: Cấp ẩm tầng sâu (Tuần 2-3)
Áp dụng phương pháp ủ nóng bằng tinh dầu tự nhiên (Argan, Jojoba) kết hợp mặt nạ ủ giàu Keratin 2 lần/tuần trong 20 phút.

### Giai đoạn 3: Khóa dưỡng chất và phục hồi biểu bì (Tuần 4)
Sử dụng serum dưỡng bóng chứa silicone hòa tan và bổ sung thực phẩm giàu biotin, kẽm trong khẩu phần ăn uống.`,
        coverImageUrl: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=800&q=80',
        tags: ['Phục hồi tóc', 'Keratin', 'Tóc hư tổn', 'Dưỡng sinh'],
        metaTitle: 'Quy Trình 4 Tuần Phục Hồi Tóc Hư Tổn Tại Nhà | Lumière Hair Atelier',
        metaDescription: 'Cẩm nang phục hồi tóc cháy, tóc gãy rụng do uốn nhuộm nhiều lần với liệu trình chuẩn salon thực hiện ngay tại nhà.',
        authorId: editor.id,
        categoryId: catArticles.id,
        isPublished: true,
        publishedAt: new Date('2026-10-15T14:15:00Z'),
        viewCount: 980,
      },
    ],
  });

  // 11. SEED SITE SETTINGS
  console.log('⚙️ Creating site settings...');
  await prisma.siteSetting.create({
    data: {
      id: 'default_setting',
      brandName: 'Lumière Hair Atelier',
      brandSlogan: 'Định Hình Khí Chất - Tỏa Sáng Phong Cách',
      logoUrl: '/images/brand/logo.svg',
      faviconUrl: '/favicon.ico',
      hotlinePrimary: '0908123456',
      hotlineSecondary: '02838229999',
      emailContact: 'contact@lumierehair.vn',
      addressFull: '128 Pasteur, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
      googleMapsEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.495044436585!2d106.69834247586867!3d10.773347559247656!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f385570472f%3A0x6b77ec9c39439c2a!2sPasteur%2C%20B%E1%BA%BFn%20Ngh%C3%A9%2C%20Qu%E1%BA%ADn%201%2C%20H%E1%BB%93%20Ch%C3%AD%20Minh!5e0!3m2!1svi!2svn!4v1700000000000!5m2!1svi!2svn',
      openingHours: {
        monday_friday: '08:30 - 21:00',
        saturday_sunday: '08:00 - 21:30',
        holiday_notes: 'Mở cửa phục vụ xuyên suốt tất cả các ngày lễ trong năm',
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
        description: 'Trải nghiệm dịch vụ làm tóc đẳng cấp hàng đầu Sài Gòn với đội ngũ Master Stylist 10+ năm kinh nghiệm, kỹ thuật uốn sóng lơi và tẩy nhuộm Olaplex.',
        keywords: 'salon toc quan 1, salon toc nam nu, uon toc han quoc, nhuom toc tay olaplex, cat toc layer nu, textured crop nam',
        ogImageUrl: '/images/brand/og-cover.jpg',
      },
      footerContent: {
        copyright: '© 2026 Lumière Hair Atelier. Tất cả các quyền được bảo lưu.',
        licenseText: 'Giấy chứng nhận đăng ký kinh doanh số: 0316888999 do Sở Kế hoạch & Đầu tư TP.HCM cấp.',
        taxCode: '0316888999',
      },
    },
  });

  // 12. SEED SAMPLE BOOKINGS (5 STATES)
  console.log('📅 Creating sample bookings across 5 workflow states...');
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  await prisma.booking.createMany({
    data: [
      {
        bookingCode: 'LMR-20261019-001',
        customerName: 'Trịnh Hoàng Long',
        customerPhone: '0912345678',
        customerEmail: 'long.trinh@gmail.com',
        bookingDate: today,
        timeSlot: '09:30',
        comboId: comboGentleman.id,
        status: BookingStatus.PENDING,
        notes: 'Muốn cắt ngắn gọn gàng để đi dự tiệc cưới cuối tuần.',
        internalNotes: 'Khách mới từ kênh TikTok, cần gọi xác nhận trước 30 phút.',
        estimatedPrice: 490000,
        idempotencyKey: 'a1b2c3d4-e5f6-7890-abcd-111111111111',
      },
      {
        bookingCode: 'LMR-20261019-002',
        customerName: 'Vũ Thảo My',
        customerPhone: '0987654321',
        customerEmail: 'thaomy.vu@gmail.com',
        bookingDate: today,
        timeSlot: '14:00',
        serviceId: servicePerm.id,
        hairstyleRefId: styleWaterWave?.id,
        assignedStylistId: stylistKenji.id,
        status: BookingStatus.CONFIRMED,
        notes: 'Chỉ định làm với Master Kenji.',
        internalNotes: 'Đã gọi điện thoại xác nhận cọc lịch, chuẩn bị sẵn lô uốn trục 28mm.',
        estimatedPrice: 1200000,
        idempotencyKey: 'a1b2c3d4-e5f6-7890-abcd-222222222222',
      },
      {
        bookingCode: 'LMR-20261019-003',
        customerName: 'Hoàng Anh Tuấn',
        customerPhone: '0933445566',
        customerEmail: 'tuan.hoang@gmail.com',
        bookingDate: today,
        timeSlot: '10:00',
        serviceId: serviceCutMen.id,
        assignedStylistId: stylistAlex.id,
        status: BookingStatus.COMPLETED,
        notes: 'Cắt fade gọn hai bên mai.',
        internalNotes: 'Dịch vụ hoàn tất đúng giờ, khách rất hài lòng và tip stylist 100k.',
        estimatedPrice: 250000,
        idempotencyKey: 'a1b2c3d4-e5f6-7890-abcd-333333333333',
      },
      {
        bookingCode: 'LMR-20261019-004',
        customerName: 'Nguyễn Bích Phương',
        customerPhone: '0977889900',
        customerEmail: 'bichphuong@gmail.com',
        bookingDate: tomorrow,
        timeSlot: '16:30',
        serviceId: serviceBleach.id,
        status: BookingStatus.CANCELLED,
        notes: 'Muốn tẩy tóc bạch kim.',
        cancellationReason: 'Khách báo bận công tác đột xuất tại Hà Nội, xin hẹn lại tuần sau.',
        internalNotes: 'Đã hủy slot và mở lại lịch trống cho khách hàng vãng lai.',
        idempotencyKey: 'a1b2c3d4-e5f6-7890-abcd-444444444444',
      },
      {
        bookingCode: 'LMR-20261019-005',
        customerName: 'Đặng Quốc Huy',
        customerPhone: '0901239876',
        customerEmail: null,
        bookingDate: today,
        timeSlot: '11:30',
        serviceId: serviceCutMen.id,
        status: BookingStatus.NO_SHOW,
        notes: 'Đặt hẹn cắt tóc trưa.',
        cancellationReason: 'Khách không đến và nhân viên gọi 3 cuộc không nghe máy.',
        internalNotes: 'Đã dán nhãn ghi chú lịch sử No-Show vào số điện thoại này.',
        estimatedPrice: 200000,
        idempotencyKey: 'a1b2c3d4-e5f6-7890-abcd-555555555555',
      },
    ],
  });

  // 13. SEED AUDIT LOGS
  console.log('📝 Creating initial audit logs...');
  await prisma.auditLog.createMany({
    data: [
      {
        actorId: superAdmin.id,
        actorEmail: superAdmin.email,
        actorName: superAdmin.fullName,
        actorRole: RoleName.SUPER_ADMIN,
        action: AuditAction.CREATE,
        entityType: 'SystemInitialization',
        entityId: 'SYSTEM-ROOT',
        details: { message: 'Cơ sở dữ liệu salon khởi tạo thành công với bộ seed data chuẩn hóa.' },
        ipAddress: '127.0.0.1',
      },
      {
        actorId: superAdmin.id,
        actorEmail: superAdmin.email,
        actorName: superAdmin.fullName,
        actorRole: RoleName.SUPER_ADMIN,
        action: AuditAction.AUTH_LOGIN,
        entityType: 'UserSession',
        entityId: superAdmin.id,
        details: { provider: 'credentials', status: 'success' },
        ipAddress: '127.0.0.1',
      },
      {
        actorId: bookingStaff.id,
        actorEmail: bookingStaff.email,
        actorName: bookingStaff.fullName,
        actorRole: RoleName.BOOKING_STAFF,
        action: AuditAction.STATUS_CHANGE,
        entityType: 'Booking',
        entityId: 'LMR-20261019-002',
        details: { fromStatus: 'PENDING', toStatus: 'CONFIRMED', assignedStylist: 'Kenji Đặng' },
        ipAddress: '127.0.0.1',
      },
    ],
  });

  console.log('✨ Seed completed successfully! Database is primed and ready for operation.');
}

main()
  .catch((e) => {
    console.error('❌ Error executing seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

---

## 6. Execution & Verification Protocol

### 6.1 Package Prerequisites
To support the schema and seed scripts, the following packages must be declared in `package.json`:
- `dependencies`:
  - `@prisma/client`: `^5.21.1` (or latest stable)
  - `bcryptjs`: `^2.4.3`
- `devDependencies`:
  - `prisma`: `^5.21.1`
  - `@types/bcryptjs`: `^2.4.6`
  - `tsx`: `^4.19.1` (fast TypeScript script runner for seed)

And in `package.json`:
```json
"prisma": {
  "seed": "tsx prisma/seed.ts"
}
```

### 6.2 Step-by-Step CLI Execution Commands

1. **Schema Validation**:
   ```bash
   npx prisma validate
   ```
   *Expected Output*: `The schema at prisma/schema.prisma is valid.`

2. **Generate Prisma Client Code**:
   ```bash
   npx prisma generate
   ```
   *Expected Output*: `✔ Generated Prisma Client (v5.x.x) to ./node_modules/@prisma/client`

3. **Database Schema Synchronization**:
   ```bash
   # Development / prototyping push
   npx prisma db push
   # Or create production migration
   npx prisma migrate dev --name init_14_models
   ```

4. **Execute Database Seed**:
   ```bash
   npx prisma db seed
   ```
   *Expected Output*:
   ```
   🌱 Starting database seed for Lumière Hair Atelier...
   🧹 Cleaning existing tables...
   👥 Creating RBAC roles...
   👤 Creating staff and master stylist accounts...
   📂 Creating categories...
   ✂️ Creating salon services & combos...
   💇 Creating hairstyles catalog...
   🎨 Creating hair color swatches...
   🔄 Creating Before/After transformations...
   🖼️ Creating dynamic hero banners...
   📰 Creating SEO care advisory articles...
   ⚙️ Creating site settings...
   📅 Creating sample bookings across 5 workflow states...
   📝 Creating initial audit logs...
   ✨ Seed completed successfully! Database is primed and ready for operation.
   ```

5. **Verify Data via Prisma Studio**:
   ```bash
   npx prisma studio
   ```
   *Verification*: Open `http://localhost:5555` and verify record counts:
   - Roles: 4
   - Users: 7 (4 staff + 3 master stylists)
   - Categories: 7
   - Hairstyles: 13
   - HairColors: 11
   - Services: 6
   - ServiceCombos: 3
   - BeforeAfters: 4
   - Banners: 4
   - Articles: 3
   - SiteSettings: 1
   - Bookings: 5 (covering `PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED`, `NO_SHOW`)
   - AuditLogs: 3

---

## 7. Downstream Integration Guidance

### For M1 Implementer:
1. Create `prisma/schema.prisma` exactly with the schema defined in Section 3.
2. Create `lib/prisma.ts` with the singleton pooler defined in Section 4.2.
3. Create `prisma/seed.ts` with the seed script defined in Section 5.2.
4. Add `"prisma": { "seed": "tsx prisma/seed.ts" }` to `package.json`.

### For M2 (Auth, RBAC & Admin Core):
- Passwords for all seeded staff accounts are `Admin@123456`.
- Role verification logic can query `User.role.name` directly or evaluate `User.role.permissions`.
- `AuditLog` table is primed to receive records from `services/audit.ts`.

### For M3 & M4 (Catalog & Public Experience):
- Filter queries on `/hairstyles` can use PostgreSQL native enum array contains operations:
  `suitableFaces: { has: 'OVAL' }` and `suitableTexture: { has: 'STRAIGHT' }`.
- Bookings created from `/booking` can connect to `hairstyleRef` and `hairColorRef` for rich consultation context.
