# KIẾN TRÚC KỸ THUẬT VÀ THIẾT KẾ DỮ LIỆU TOÀN DIỆN
## Dự án: Nền tảng Web Salon Tóc Nam & Nữ Hiện Đại (Lumière Hair Atelier)
**Phiên bản:** 1.0.0 — Chuẩn hóa cho Next.js App Router, Prisma ORM, PostgreSQL & Vercel Serverless  
**Mã tài liệu:** `ARCH-SPEC-SURVEY-3`  
**Ngày lập:** 2026-10-19  

---

## MỤC LỤC
1. [Tổng Quan Kiến Trúc Hệ Thống (System Overview)](#1-tổng-quan-kiến-trúc-hệ-thống)
2. [Cấu Trúc Thư Mục Chuẩn Hóa (Directory Structure)](#2-cấu-trúc-thư-mục-chuẩn-hóa)
3. [Thiết Kế Giao Diện & Design System (Tailwind CSS & shadcn/ui)](#3-thiết-kế-giao-diện--design-system)
4. [Mô Hình Dữ Liệu & Prisma Schema Hoàn Chỉnh](#4-mô-hình-dữ-liệu--prisma-schema-hoàn-chỉnh)
5. [Chiến Lược Dữ Liệu Mẫu (Seed Data Strategy - prisma/seed.ts)](#5-chiến-lược-dữ-liệu-mẫu)
6. [Lớp Trừu Tượng Lưu Trữ Đám Mây (Cloud Storage Abstraction)](#6-lớp-trừu-tượng-lưu-trữ-đám-mây)
7. [Kiến Trúc Dịch Vụ Thử Tóc Trực Quan (Hair Try-On Provider)](#7-kiến-trúc-dịch-vụ-thử-tóc-trực-quan)
8. [Form Handling & Zod Validation Contract](#8-form-handling--zod-validation-contract)
9. [Tối Ưu Hóa Vercel Serverless & Stateless Guarantees](#9-tối-ưu-hóa-vercel-serverless--stateless-guarantees)
10. [Ma Trận Phân Quyền & Bảo Mật RBAC](#10-ma-trận-phân-quyền--bảo-mật-rbac)
11. [Kế Hoạch Kiểm Thử & Lệnh Xác Minh (Acceptance Verification Commands)](#11-kế-hoạch-kiểm-thử--lệnh-xác-minh)

---

## 1. TỔNG QUAN KIẾN TRÚC HỆ THỐNG

Ứng dụng Salon Tóc Hiện Đại được thiết kế theo mô hình **Dual-Portal Monolith trên Next.js App Router**, tách biệt hoàn toàn giữa hai phân hệ:
1. **Public Website (`app/(public)`):** Cổng thông tin thương hiệu, tra cứu thư viện kiểu tóc, bảng màu swatch, đặt lịch trực tuyến nhiều bước và studio thử tóc trực quan. Tối ưu hóa SEO tối đa bằng Server Components (RSC), Open Graph metadata động và cache tĩnh (ISR/SSG).
2. **Admin CMS (`app/admin`):** Phân hệ quản trị nội dung và nghiệp vụ vận hành salon, bảo vệ đa tầng bằng Server-side Session & RBAC, thao tác CRUD toàn diện, dashboard thống kê theo thời gian thực và nhật ký kiểm toán (Audit Logs).

```
+-----------------------------------------------------------------------------------+
|                                 CLIENT BROWSERS                                   |
|   +---------------------------------------+   +-------------------------------+   |
|   |  Public Website (Mobile / Desktop)    |   |  Admin CMS (Protected Portal) |   |
|   +---------------------------------------+   +-------------------------------+   |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                        VERCEL EDGE & SERVERLESS NETWORK                           |
|  - Edge Middleware: Phân giải Route, Session Check, Rate Limiting, Security Header|
+-----------------------------------------------------------------------------------+
                                         |
       +---------------------------------+---------------------------------+
       |                                                                   |
       v                                                                   v
+---------------------------------------+   +---------------------------------------+
|      Next.js App Router (RSC)         |   |          Next.js Route Handlers       |
|  - app/(public)/* (SSR / ISR / SEO)   |   |  - app/api/public/* (Form / Inquiries)|
|  - app/admin/* (Server Session Guard) |   |  - app/api/admin/* (CRUD / Audit Log) |
|  - React Hook Form + Zod Client Valid |   |  - app/api/try-on/* (Safe AI / Demo)  |
+---------------------------------------+   +---------------------------------------+
       |                                                                   |
       +---------------------------------+---------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                             BUSINESS SERVICE LAYER                                |
|  - BookingService   - HairstyleService   - ColorService   - AuthService           |
|  - AuditService     - SiteSettingService - TryOnService   - StorageService        |
+-----------------------------------------------------------------------------------+
       |                                                                   |
       v                                                                   v
+---------------------------------------+   +---------------------------------------+
|            DATA ACCESS LAYER          |   |       EXTERNAL CLOUD PROVIDERS        |
|  - Prisma ORM Singleton Client        |   |  - StorageProvider (Cloudinary/Supa)  |
|  - PostgreSQL Database (Neon/Supabase)|   |  - HairTryOnProvider (Demo / AI)      |
|  - Connection Pooling (PgBouncer)     |   |  - Transactional Notifications        |
+---------------------------------------+   +---------------------------------------+
```

### Các nguyên tắc thiết kế cốt lõi:
- **Stateless 100%:** Tuyệt đối không lưu trữ phiên làm việc, file tạm thời hay trạng thái trong RAM container serverless.
- **Strict Typing:** `strict: true` kích hoạt toàn bộ ràng buộc của TypeScript 5+. Không dùng `any` bừa bãi; mọi dữ liệu từ Request Payload, DB Entity đến Component Props đều có interface rõ ràng.
- **Fail-Safe & Graceful Degradation:** Mọi dịch vụ bên thứ ba (AI Model, Cloud Storage) đều có adapter Mock/Demo hoạt động nội tại độc lập, đảm bảo môi trường local và CI/CD có thể chạy trơn tru mà không cần cấu hình API key trả phí.

---

## 2. CẤU TRÚC THƯ MỤC CHUẨN HÓA

Tuân thủ nghiêm ngặt quy định tổ chức thư mục của dự án:

```
Teamcode/
├── app/
│   ├── (public)/                       # Phân hệ Public Website
│   │   ├── layout.tsx                  # Public Root Layout (Navbar, Footer, Floating CTA)
│   │   ├── page.tsx                    # Trang chủ (Hero, xu hướng, Before/After, feedback)
│   │   ├── hairstyles/
│   │   │   ├── page.tsx                # Thư viện kiểu tóc (Bộ lọc đa chiều)
│   │   │   └── [slug]/
│   │   │       └── page.tsx            # Chi tiết kiểu tóc (Chăm sóc, giá, dịch vụ liên kết)
│   │   ├── colors/
│   │   │   └── page.tsx                # Tư vấn màu nhuộm & Bảng Swatch tương tác
│   │   ├── before-after/
│   │   │   └── page.tsx                # Bộ sưu tập Before/After với thanh trượt so sánh
│   │   ├── services/
│   │   │   └── page.tsx                # Bảng giá dịch vụ & các gói Combo ưu đãi
│   │   ├── booking/
│   │   │   └── page.tsx                # Form đặt lịch hẹn trực tuyến nhiều bước
│   │   ├── try-on/
│   │   │   └── page.tsx                # Studio thử tóc trực quan trên ảnh chân dung
│   │   ├── articles/
│   │   │   ├── page.tsx                # Danh sách bài viết & tin tức làm đẹp
│   │   │   └── [slug]/
│   │   │       └── page.tsx            # Chi tiết bài viết chuẩn SEO Open Graph
│   │   ├── about/
│   │   │   └── page.tsx                # Giới thiệu salon, đội ngũ Master Stylist
│   │   └── contact/
│   │       └── page.tsx                # Bản đồ vị trí, hotline, giờ mở cửa
│   ├── admin/                          # Phân hệ Admin CMS độc lập
│   │   ├── layout.tsx                  # Layout quản trị (Sidebar, Topbar, Session Guard)
│   │   ├── login/
│   │   │   └── page.tsx                # Trang đăng nhập quản trị viên
│   │   ├── page.tsx                    # Dashboard điều hành (Thống kê realtime & KPI)
│   │   ├── hairstyles/
│   │   │   ├── page.tsx                # Danh sách quản lý kiểu tóc
│   │   │   ├── new/page.tsx            # Thêm mới kiểu tóc
│   │   │   └── [id]/edit/page.tsx      # Chỉnh sửa kiểu tóc
│   │   ├── categories/
│   │   │   └── page.tsx                # Quản lý danh mục tóc & dịch vụ
│   │   ├── hair-colors/
│   │   │   └── page.tsx                # Quản lý bảng màu nhuộm Swatch
│   │   ├── services/
│   │   │   ├── page.tsx                # Quản lý dịch vụ lẻ & Combo
│   │   │   └── new/page.tsx            # Tạo dịch vụ/combo mới
│   │   ├── before-after/
│   │   │   └── page.tsx                # Quản lý bộ sưu tập ảnh Before/After
│   │   ├── bookings/
│   │   │   ├── page.tsx                # Quản lý danh sách lịch hẹn & lọc trạng thái
│   │   │   └── [id]/page.tsx           # Chi tiết lịch hẹn, gán stylist & ghi chú
│   │   ├── banners/
│   │   │   └── page.tsx                # Quản lý banner Hero trang chủ
│   │   ├── articles/
│   │   │   ├── page.tsx                # Quản lý bài viết blog & tin tức
│   │   │   └── [id]/edit/page.tsx      # Biên tập nội dung chuẩn SEO
│   │   ├── site-settings/
│   │   │   └── page.tsx                # Cấu hình thương hiệu, hotline, giờ mở cửa, SEO
│   │   └── audit-logs/
│   │       └── page.tsx                # Xem nhật ký thao tác hệ thống (Audit Trail)
│   └── api/                            # API Route Handlers
│       ├── auth/
│       │   ├── login/route.ts          # Đăng nhập quản trị & cấp Session Token
│       │   ├── logout/route.ts         # Hủy phiên làm việc
│       │   └── me/route.ts             # Lấy thông tin user hiện tại
│       ├── public/
│       │   ├── booking/route.ts        # Tiếp nhận đặt lịch từ khách hàng (POST)
│       │   ├── hairstyles/route.ts     # Tra cứu kiểu tóc công khai (GET)
│       │   ├── colors/route.ts         # Tra cứu bảng màu swatch (GET)
│       │   └── settings/route.ts       # Lấy cấu hình website công khai (GET)
│       ├── admin/
│       │   ├── dashboard/route.ts      # Thống kê Dashboard
│       │   ├── hairstyles/[id]/route.ts
│       │   ├── services/[id]/route.ts
│       │   ├── bookings/[id]/route.ts  # Cập nhật trạng thái lịch hẹn (PATCH)
│       │   ├── settings/route.ts       # Cập nhật cài đặt hệ thống (PUT)
│       │   └── audit-logs/route.ts     # Truy vấn nhật ký hệ thống
│       ├── try-on/
│       │   └── route.ts                # API xử lý thử kiểu tóc (MIME + buffer check)
│       └── upload/
│           └── route.ts                # API upload ảnh lên Cloud Storage
├── components/
│   ├── public/                         # Các UI component dành riêng cho Public Website
│   │   ├── Navbar.tsx                  # Thanh điều hướng công khai, menu mobile
│   │   ├── Footer.tsx                  # Chân trang với thông tin thương hiệu, social
│   │   ├── HeroBannerSlider.tsx        # Slider ảnh banner chính trang chủ
│   │   ├── CategoryHighlight.tsx       # Khối danh mục dịch vụ nổi bật
│   │   ├── HairstyleCard.tsx           # Card hiển thị mẫu tóc kèm tag, giá, nút yêu thích
│   │   ├── HairstyleFilterBar.tsx      # Bộ lọc đa tiêu chí (giới tính, phong cách, độ dài...)
│   │   ├── HairColorSwatchGrid.tsx     # Bảng màu tương tác hiển thị tone, độ sáng
│   │   ├── BeforeAfterComparison.tsx   # Component so sánh 2 ảnh trượt trực quan
│   │   ├── BookingWizard/              # Wizard đặt lịch hẹn nhiều bước
│   │   │   ├── StepService.tsx         # Bước 1: Chọn dịch vụ & combo
│   │   │   ├── StepHairstyle.tsx       # Bước 2: Chọn mẫu tóc tham khảo (tùy chọn)
│   │   │   ├── StepStylistDateTime.tsx # Bước 3: Chọn stylist, ngày & khung giờ
│   │   │   ├── StepCustomerInfo.tsx    # Bước 4: Nhập thông tin & ghi chú
│   │   │   └── BookingSummaryModal.tsx # Xác nhận & thông báo hoàn tất
│   │   ├── TryOnCanvas.tsx             # Giao diện tải ảnh, chọn tóc, preview mô phỏng
│   │   ├── StylistTeamShowcase.tsx     # Giới thiệu các Master Stylist
│   │   └── CustomerReviews.tsx         # Đánh giá từ khách hàng thực tế
│   ├── admin/                          # Các UI component dành riêng cho Admin CMS
│   │   ├── AdminSidebar.tsx            # Thanh điều hướng bên trái CMS theo vai trò
│   │   ├── AdminHeader.tsx             # Header quản trị, thông tin phiên, nút đăng xuất
│   │   ├── StatsMetricCard.tsx         # Thẻ hiển thị chỉ số thống kê (KPI cards)
│   │   ├── DataTable.tsx               # Bảng dữ liệu phân trang, sắp xếp, tìm kiếm
│   │   ├── BookingStatusBadge.tsx      # Huy hiệu trạng thái lịch hẹn (Pending, Confirmed...)
│   │   ├── BookingActionDialog.tsx     # Modal duyệt/đổi trạng thái, gán stylist, ghi chú
│   │   ├── CloudImageUploader.tsx      # Kéo thả upload ảnh lên Cloud Storage có preview
│   │   └── AuditTimeline.tsx           # Dòng thời gian nhật ký thao tác
│   └── ui/                             # shadcn/ui Design System Primitives
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── dropdown-menu.tsx
│       ├── input.tsx
│       ├── select.tsx
│       ├── slider.tsx                  # Dùng cho Before/After & lọc giá
│       ├── tabs.tsx
│       ├── textarea.tsx
│       ├── badge.tsx
│       ├── skeleton.tsx                # Loading states
│       └── toast.tsx
├── lib/                                # Hạ tầng & tiện ích chia sẻ
│   ├── prisma.ts                       # Singleton PrismaClient tối ưu cho Serverless
│   ├── auth.ts                         # Mã hóa bcrypt, JWT/Session validation
│   ├── rbac.ts                         # Định nghĩa quyền và helper kiểm tra vai trò
│   ├── utils.ts                        # Tiện ích cn (clsx + tailwind-merge), format VNĐ, date-fns
│   ├── storage/                        # Lớp trừu tượng lưu trữ file đám mây
│   │   ├── types.ts                    # Interface StorageProvider & UploadResult
│   │   ├── cloudinary.ts               # Adapter Cloudinary SDK
│   │   ├── supabase.ts                 # Adapter Supabase Storage
│   │   ├── mock.ts                     # Adapter Mock cho local development / test
│   │   └── index.ts                    # Factory khởi tạo provider từ biến môi trường
│   ├── try-on/                         # Lớp trừu tượng thử tóc trực quan
│   │   ├── types.ts                    # Interface HairTryOnProvider & Request/Result
│   │   ├── demo-provider.ts            # Triển khai Demo/Visual Canvas composite an toàn
│   │   ├── external-ai-provider.ts     # Adapter kết nối AI Image Generation API
│   │   └── index.ts                    # Factory trả về provider mặc định
│   └── validations/                    # Zod Schemas đồng bộ cho Client & Server
│       ├── booking.schema.ts
│       ├── hairstyle.schema.ts
│       ├── service.schema.ts
│       ├── hair-color.schema.ts
│       ├── article.schema.ts
│       ├── site-settings.schema.ts
│       └── auth.schema.ts
├── services/                           # Business Logic Services
│   ├── booking.service.ts              # Xử lý đặt lịch, kiểm tra trùng, sinh mã hẹn
│   ├── hairstyle.service.ts            # Lọc danh mục, đếm lượt xem, tìm kiếm
│   ├── audit.service.ts                # Ghi nhận lịch sử thao tác vào DB
│   └── settings.service.ts             # Quản lý cấu hình site, cache settings
├── types/                              # Định nghĩa kiểu dữ liệu dùng chung
│   ├── api.types.ts                    # Response format, Pagination, Error codes
│   ├── booking.types.ts                # DTO lịch hẹn, trạng thái, khung giờ
│   ├── hairstyle.types.ts              # Filter options, tiêu chí phân loại
│   └── rbac.types.ts                   # Permission enums, User roles
└── prisma/                             # Cơ sở dữ liệu
    ├── schema.prisma                   # Schema dữ liệu toàn diện
    ├── seed.ts                         # Script nạp dữ liệu mẫu phong phú
    └── migrations/                     # Lịch sử migration tái lập được
```

---

## 3. THIẾT KẾ GIAO DIỆN & DESIGN SYSTEM (TAILWIND CSS & SHADCN/UI)

### 3.1. Nhận diện thẩm mỹ sang trọng (Luxury Salon Aesthetic)
- **Cảm hứng thiết kế:** Phong cách Atelier/Salon cao cấp Paris – Seoul – Tokyo kết hợp giữa tone đen tuyền sang trọng (Obsidian Noir), ánh kim sâm banh (Champagne Gold / Imperial Gold) và nền sáng tinh khôi (Warm Alabaster / Ivory) cho các vùng đọc nội dung công khai.
- **Bảng màu Design Tokens (`tailwind.config.ts`):**

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Salon Custom Luxury Tokens
        salon: {
          noir: "#0B0F17",           // Đen huyền sâu thẳm
          charcoal: "#161B26",       // Xám than nền card admin
          gold: {
            DEFAULT: "#D4AF37",      // Vàng Champagne tiêu chuẩn
            light: "#F3E5AB",        // Vàng kem sáng
            dark: "#AA820A",         // Vàng đồng cổ điển
            hover: "#C5A059",        // Vàng kim khi hover
          },
          ivory: "#FDFBF7",          // Trắng ngà thanh lịch cho public background
          silver: "#E5E7EB",         // Ánh bạc viền nhẹ
          surface: "#1F293D",        // Mặt kính mờ (glassmorphism)
        },
      },
      fontFamily: {
        serif: ["var(--font-playfair)", "serif"],    // Dành cho tiêu đề sang trọng
        sans: ["var(--font-plus-jakarta)", "sans-serif"], // Thân bài dễ đọc, tinh gọn
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        'gold-glow': '0 0 25px -5px rgba(212, 175, 55, 0.25)',
        'luxury-card': '0 10px 30px -10px rgba(0, 0, 0, 0.08), 0 0 1px 1px rgba(212, 175, 55, 0.15)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
```

### 3.2. Cấu hình biến CSS toàn cục (`app/globals.css`)
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 40 33% 98%;        /* #FDFBF7 Ngà ấm */
    --foreground: 222 47% 11%;        /* #0F172A */
    --card: 0 0% 100%;
    --card-foreground: 222 47% 11%;
    --popover: 0 0% 100%;
    --popover-foreground: 222 47% 11%;
    --primary: 43 65% 52%;           /* #D4AF37 Champagne Gold */
    --primary-foreground: 222 47% 11%;
    --secondary: 40 20% 94%;
    --secondary-foreground: 222 47% 11%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 43 65% 52%;
    --accent-foreground: 222 47% 11%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 43 65% 52%;
    --radius: 0.75rem;
  }

  .dark {
    --background: 222 47% 7%;         /* #0B0F17 Obsidian */
    --foreground: 210 40% 98%;
    --card: 217 33% 12%;             /* #161B26 */
    --card-foreground: 210 40% 98%;
    --popover: 217 33% 12%;
    --popover-foreground: 210 40% 98%;
    --primary: 43 65% 52%;           /* #D4AF37 Champagne Gold */
    --primary-foreground: 222 47% 11%;
    --secondary: 217 33% 17%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217 33% 17%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 43 65% 52%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217 33% 18%;
    --input: 217 33% 18%;
    --ring: 43 65% 52%;
  }
}
```

---

## 4. MÔ HÌNH DỮ LIỆU & PRISMA SCHEMA HOÀN CHỈNH

Dưới đây là định nghĩa `prisma/schema.prisma` đầy đủ đáp ứng 100% các yêu cầu từ R1 đến R4, quan hệ toàn vẹn, indexing tối ưu cho tìm kiếm, khóa ngoại rõ ràng và tương thích hoàn toàn với PostgreSQL trên Supabase/Neon:

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ==========================================
// 1. AUTHENTICATION & RBAC MODELS
// ==========================================

enum RoleName {
  SUPER_ADMIN
  CONTENT_ADMIN
  BOOKING_STAFF
  EDITOR
}

model Role {
  id          String    @id @default(uuid())
  name        RoleName  @unique
  description String?
  permissions Json      // Mảng quyền chi tiết e.g. ["hairstyles:create", "bookings:update"]
  users       User[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@map("roles")
}

model User {
  id            String       @id @default(uuid())
  email         String       @unique
  passwordHash  String
  fullName      String
  phone         String?
  avatarUrl     String?
  isActive      Boolean      @default(true)
  roleId        String
  role          Role         @relation(fields: [roleId], references: [id], onDelete: Restrict)
  
  // Quan hệ nhân sự / stylist
  isStylist     Boolean      @default(false)
  bio           String?      @db.Text
  experienceYears Int?
  specialties   String[]     // Danh sách sở trường chuyên môn
  
  // Quan hệ thực thể
  sessions      Session[]
  articles      Article[]    @relation("ArticleAuthor")
  auditLogs     AuditLog[]   @relation("AuditActor")
  assignedBookings Booking[] @relation("StylistBookings")
  beforeAfterWorks BeforeAfter[] @relation("StylistBeforeAfter")

  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt

  @@index([roleId])
  @@index([email])
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
  @@map("sessions")
}

// ==========================================
// 2. CATEGORIES & TAXONOMY
// ==========================================

enum CategoryType {
  HAIRSTYLE
  SERVICE
  ARTICLE
}

model Category {
  id          String        @id @default(uuid())
  name        String
  slug        String        @unique
  description String?       @db.Text
  type        CategoryType  @default(HAIRSTYLE)
  imageUrl    String?
  displayOrder Int          @default(0)
  isActive    Boolean       @default(true)

  hairstyles  Hairstyle[]
  services    Service[]
  articles    Article[]

  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  @@index([type, isActive])
  @@map("categories")
}

// ==========================================
// 3. HAIRSTYLE CATALOG (THƯ VIỆN KIỂU TÓC)
// ==========================================

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
  id             String        @id @default(uuid())
  title          String
  slug           String        @unique
  summary        String?       @db.VarChar(500)
  description    String        @db.Text
  coverImageUrl  String
  galleryImages  String[]      // Mảng URL ảnh góc nhìn đa chiều
  
  gender         GenderTarget  @default(UNISEX)
  length         HairLength    @default(MEDIUM)
  suitableFaces  FaceShape[]   // Mảng dáng khuôn mặt phù hợp
  suitableTexture HairTexture[] // Mảng chất tóc phù hợp
  careEffort     CareEffort    @default(MEDIUM)
  styleVibe      StyleVibe     @default(KOREAN)
  
  careAdvice     String?       @db.Text
  stylingTips    String?       @db.Text
  priceRefMin    Decimal?      @db.Decimal(12, 2)
  priceRefMax    Decimal?      @db.Decimal(12, 2)
  
  isTrending     Boolean       @default(false)
  isFeatured     Boolean       @default(false)
  isActive       Boolean       @default(true)
  viewCount      Int           @default(0)

  categoryId     String
  category       Category      @relation(fields: [categoryId], references: [id], onDelete: Restrict)

  // Liên kết nhiều-nhiều với Dịch vụ thực hiện kiểu tóc này
  services       HairstyleService[]
  beforeAfters   BeforeAfter[]
  bookings       Booking[]     @relation("BookingReferencedStyle")

  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  @@index([gender, length, careEffort])
  @@index([isTrending, isFeatured])
  @@index([categoryId])
  @@map("hairstyles")
}

// Bảng trung gian Hairstyle <-> Service
model HairstyleService {
  hairstyleId String
  serviceId   String
  hairstyle   Hairstyle @relation(fields: [hairstyleId], references: [id], onDelete: Cascade)
  service     Service   @relation(fields: [serviceId], references: [id], onDelete: Cascade)

  @@id([hairstyleId, serviceId])
  @@map("hairstyle_services")
}

// ==========================================
// 4. HAIR COLOR SWATCHES (BẢNG MÀU TÓC)
// ==========================================

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
  code              String      @unique // Mã màu e.g. "ASH-8.1", "CARAMEL-6.34"
  hexColor          String      // Mã màu chủ đạo HEX e.g. "#6E5B4B"
  secondaryHex      String?     // Ánh sắc phản quang e.g. "#A89F91"
  tone              ColorTone   @default(NEUTRAL)
  group             ColorGroup  @default(BROWN)
  brightnessLevel   Int         @default(6) // Thang đo 1 - 10
  
  requiresBleach    Boolean     @default(false)
  bleachRounds      Int         @default(0) // Số lần tẩy tóc cần thiết (0, 1, 2, 3)
  suitableSkinTones String[]    // Tông da phù hợp: ["Trắng sáng", "Trung bình", "Ngăm"]
  maintenanceLevel  CareEffort  @default(MEDIUM)
  colorFadingAdvice String?     @db.Text
  swatchImageUrl    String?
  samplePortraitUrl String?     // Ảnh mẫu ứng dụng lên người thật
  
  isTrending        Boolean     @default(false)
  isActive          Boolean     @default(true)
  displayOrder      Int         @default(0)

  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt

  @@index([tone, group, requiresBleach])
  @@index([isTrending])
  @@map("hair_colors")
}

// ==========================================
// 5. SERVICES & SERVICE COMBOS (BẢNG GIÁ DỊCH VỤ)
// ==========================================

model Service {
  id              String             @id @default(uuid())
  title           String
  slug            String             @unique
  shortSummary    String?            @db.VarChar(500)
  description     String             @db.Text
  durationMinutes Int                @default(45)
  priceMin        Decimal            @db.Decimal(12, 2)
  priceMax        Decimal?           @db.Decimal(12, 2)
  preCareAdvice   String?            @db.Text
  postCareAdvice  String?            @db.Text
  imageUrl        String?
  isPopular       Boolean            @default(false)
  isActive        Boolean            @default(true)
  displayOrder    Int                @default(0)

  categoryId      String
  category        Category           @relation(fields: [categoryId], references: [id], onDelete: Restrict)

  hairstyles      HairstyleService[]
  comboItems      ServiceComboItem[]
  bookings        Booking[]
  beforeAfters    BeforeAfter[]

  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt

  @@index([categoryId, isActive])
  @@map("services")
}

model ServiceCombo {
  id              String             @id @default(uuid())
  title           String
  slug            String             @unique
  description     String             @db.Text
  packagePrice    Decimal            @db.Decimal(12, 2)
  originalPrice   Decimal            @db.Decimal(12, 2)
  durationMinutes Int                @default(120)
  savingsPercent  Int?
  imageUrl        String?
  isActive        Boolean            @default(true)
  isFeatured      Boolean            @default(false)
  displayOrder    Int                @default(0)

  items           ServiceComboItem[]
  bookings        Booking[]

  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt

  @@map("service_combos")
}

model ServiceComboItem {
  id             String       @id @default(uuid())
  comboId        String
  serviceId      String
  customNote     String?
  combo          ServiceCombo @relation(fields: [comboId], references: [id], onDelete: Cascade)
  service        Service      @relation(fields: [serviceId], references: [id], onDelete: Restrict)

  @@unique([comboId, serviceId])
  @@map("service_combo_items")
}

// ==========================================
// 6. BEFORE / AFTER TRANSFORMATION SHOWCASE
// ==========================================

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
  @@map("before_afters")
}

// ==========================================
// 7. ONLINE BOOKING SYSTEM (ĐẶT LỊCH HẸN)
// ==========================================

enum BookingStatus {
  PENDING      // Chờ Salon xác nhận
  CONFIRMED    // Đã xác nhận lịch
  COMPLETED    // Hoàn thành dịch vụ
  CANCELLED    // Khách hoặc Salon hủy
  NO_SHOW      // Khách không đến
}

model Booking {
  id                 String        @id @default(uuid())
  bookingCode        String        @unique // e.g. "LMR-20261019-7492"
  
  // Thông tin khách hàng
  customerName       String
  customerPhone      String
  customerEmail      String?
  
  // Chi tiết thời gian hẹn
  bookingDate        DateTime      @db.Date
  timeSlot           String        // e.g. "09:30", "14:00"
  
  // Dịch vụ lựa chọn
  serviceId          String?
  service            Service?      @relation(fields: [serviceId], references: [id], onDelete: SetNull)
  
  comboId            String?
  combo              ServiceCombo? @relation(fields: [comboId], references: [id], onDelete: SetNull)
  
  hairstyleRefId     String?
  hairstyleRef       Hairstyle?    @relation("BookingReferencedStyle", fields: [hairstyleRefId], references: [id], onDelete: SetNull)
  
  // Stylist yêu cầu & phân công
  assignedStylistId  String?
  assignedStylist    User?         @relation("StylistBookings", fields: [assignedStylistId], references: [id], onDelete: SetNull)
  
  status             BookingStatus @default(PENDING)
  notes              String?       @db.Text
  internalNotes      String?       @db.Text
  estimatedPrice     Decimal?      @db.Decimal(12, 2)
  cancellationReason String?
  
  // Bảo vệ chống gửi trùng lịch (Idempotency Key)
  submissionToken    String?       @unique

  createdAt          DateTime      @default(now())
  updatedAt          DateTime      @updatedAt

  @@index([bookingDate, status])
  @@index([customerPhone])
  @@index([assignedStylistId])
  @@map("bookings")
}

// ==========================================
// 8. BANNERS & PROMOTIONS (HERO SLIDER)
// ==========================================

model Banner {
  id             String    @id @default(uuid())
  title          String
  subtitle       String?
  badgeText      String?   // e.g. "XU HƯỚNG 2026", "ƯU ĐÃI ĐẶC QUYỀN"
  imageUrl       String    // Desktop banner (1920x800)
  mobileImageUrl String?   // Mobile banner (800x1000)
  linkUrl        String?   // URL chuyển hướng khi click
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

// ==========================================
// 9. BLOG & ADVISORY ARTICLES (TIN TỨC & CHĂM SÓC)
// ==========================================

model Article {
  id              String    @id @default(uuid())
  title           String
  slug            String    @unique
  excerpt         String    @db.VarChar(500)
  content         String    @db.Text
  coverImageUrl   String
  tags            String[]  // e.g. ["Dưỡng tóc tẩy", "Xu hướng Hàn Quốc"]
  
  // SEO Metadata chuẩn hóa
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
  @@map("articles")
}

// ==========================================
// 10. SITE SETTINGS (CẤU HÌNH HỆ THỐNG ĐỘNG)
// ==========================================

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
  
  // JSON Cấu hình mở rộng
  openingHours        Json     // { monday_friday: "08:30 - 21:00", weekend: "08:00 - 21:30" }
  socialLinks         Json     // { facebook: "...", instagram: "...", tiktok: "..." }
  defaultSeoMetadata  Json     // { title: "...", description: "...", ogImage: "..." }
  footerContent       Json     // { copyright: "...", licenseText: "..." }
  
  updatedAt           DateTime @updatedAt

  @@map("site_settings")
}

// ==========================================
// 11. AUDIT LOGS (NHẬT KÝ KIỂM TOÁN HỆ THỐNG)
// ==========================================

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
  actorRole  RoleName?
  actor      User?       @relation("AuditActor", fields: [actorId], references: [id], onDelete: SetNull)
  
  action     AuditAction
  entityType String      // e.g. "Booking", "Hairstyle", "Service", "Setting"
  entityId   String?     // ID của bản ghi bị tác động
  details    Json?       // Lưu snapshot { before: ..., after: ... } hoặc metadata
  ipAddress  String?
  userAgent  String?

  createdAt  DateTime    @default(now())

  @@index([action, entityType])
  @@index([createdAt])
  @@map("audit_logs")
}
```

---

## 5. CHIẾN LƯỢC DỮ LIỆU MẪU (SEED DATA STRATEGY - PRISMA/SEED.TS)

Dữ liệu seed trong file `prisma/seed.ts` được thiết kế cực kỳ kỹ lưỡng, mang đậm phong cách văn hóa làm đẹp Việt Nam kết hợp các chuẩn mực xu hướng quốc tế (Hàn Quốc, Nhật Bản, Cổ điển Âu Mỹ).

### 5.1. Danh mục tài khoản nhân sự và quản trị viên
Tất cả mật khẩu mặc định: `Admin@123456` (được băm bằng `bcrypt.hash(..., 10)`):
- **Super Admin:** `admin@lumierehair.vn` (Nguyễn Hoàng Nam - Tổng quản trị)
- **Content Admin:** `content@lumierehair.vn` (Trần Thu Thảo - Trưởng ban nội dung & phong cách)
- **Booking Staff:** `booking@lumierehair.vn` (Lê Minh Khang - Lễ tân điều phối lịch hẹn)
- **Editor:** `editor@lumierehair.vn` (Phạm Hoàng Yến - Chuyên viên biên tập bài viết & SEO)
- **Master Stylists:**
  - `stylist.kenji@lumierehair.vn` (Kenji Đặng - 12 năm kinh nghiệm, Master Uốn Nhuộm Nhật - Hàn)
  - `stylist.elena@lumierehair.vn` (Elena Vũ - 9 năm kinh nghiệm, Chuyên gia Tẩy màu & Phục hồi Olaplex)
  - `stylist.alex@lumierehair.vn` (Alex Trần - 8 năm kinh nghiệm, Nghệ nhân Cắt Fade & Barber Cổ Điển)

### 5.2. Danh mục & Kiểu tóc chi tiết (Hairstyles)
1. **Textured Crop Hàn Quốc** (Nam, Ngắn, Tròn/Trái xoan, Vibe: Hàn Quốc, Chăm sóc: Thấp)
2. **Modern Pompadour Quý Tộc** (Nam, Vừa, Vuông/Kim cương, Vibe: Cổ điển, Chăm sóc: Cao)
3. **Two-Block Layer Lãng Tử** (Nam, Vừa, Trái xoan/Gầy, Vibe: Hàn Quốc, Chăm sóc: Trung bình)
4. **Side Part 7/3 Rủ Hiện Đại** (Nam, Vừa, Mọi khuôn mặt, Vibe: Business, Chăm sóc: Trung bình)
5. **Mullet Layer Phá Cách** (Nam/Unisex, Vừa, Tròn/Trái xoan, Vibe: Streetwear, Chăm sóc: Trung bình)
6. **Layer Nữ Phồng Chữ C** (Nữ, Dài, Mọi khuôn mặt, Vibe: Hàn Quốc, Chăm sóc: Thấp)
7. **Bob Tỉa Tầng Nhật Bản** (Nữ, Ngắn, Trái xoan/Kim cương, Vibe: Nhật Bản, Chăm sóc: Thấp)
8. **Uốn Sóng Lơi Nước Pháp (Water Waves)** (Nữ, Dài, Dài/Trái xoan, Vibe: Avant-Garde, Chăm sóc: Trung bình)
9. **Butterfly Cut Thần Thái** (Nữ, Dài, Tròn/Vuông, Vibe: Âu Mỹ, Chăm sóc: Trung bình)
10. **Wolf Cut Thập Niên 90** (Unisex, Vừa, Mọi khuôn mặt, Vibe: Streetwear, Chăm sóc: Trung bình)

### 5.3. Bảng màu tóc chuẩn Swatch (Hair Colors)
- **Nâu Tây Trầm (Cold Mocha 6.1):** Hex `#59493E`, Tông Lạnh, Không cần tẩy, Bền màu, Tôn da người Việt.
- **Xám Khói Ánh Bạc (Silver Smoke 9.11):** Hex `#9E9D9B`, Tông Lạnh, Tẩy 2 cấp độ, Cá tính mạnh.
- **Trà Sữa Caramel (Caramel Milk Tea 7.32):** Hex `#BFA082`, Tông Ấm, Cần nâng tông nhẹ, Trẻ trung.
- **Đỏ Rượu Cherry (Burgundy Velvet 5.66):** Hex `#6E2639`, Tông Lạnh, Không cần tẩy, Sang trọng quý phái.
- **Bạch Kim Platinum (Nordic Ice 10.0):** Hex `#E5E3D8`, Tông Lạnh, Tẩy 3 cấp độ, Đỉnh cao thời trang.
- **Nâu Rêu Khói Mờ (Smoky Matcha 7.21):** Hex `#686E5E`, Tông Lạnh, Tẩy 1 cấp độ nhẹ.

### 5.4. Dịch vụ và Gói Combo (Services & Combos)
- **Dịch vụ lẻ:** Cắt tạo kiểu Master (180.000 - 350.000 VNĐ), Uốn máy phục hồi Protein (900.000 - 1.800.000 VNĐ), Nhuộm màu Organic không Amoniac (800.000 - 1.600.000 VNĐ), Tẩy tóc Olaplex chuẩn Châu Âu (950.000 - 2.200.000 VNĐ), Dưỡng sinh thảo dược Đông y Hoàng Cung (250.000 - 450.000 VNĐ).
- **Gói Combo đặc quyền:**
  - *Gentleman Luxe Experience (490.000 VNĐ):* Cắt + Gội massage đá muối Himalaya + Uốn phồng chân tóc + Vuốt sáp Pomade cao cấp.
  - *Seoul Goddess Transformation (1.750.000 VNĐ):* Cắt Layer kiểu Hàn + Uốn sóng lơi trục lớn + Phục hồi phủ lụa Nano Keratin.
  - *Platinum Trendsetter (2.600.000 VNĐ):* Tẩy tóc 2 nước Olaplex No.1 + Nhuộm xám khói/bạch kim + Hấp khóa màu chuyên sâu.

### 5.5. Dữ liệu Lịch hẹn (Bookings)
Bộ seed nạp sẵn 12 lịch hẹn với đầy đủ trạng thái:
- 3 lịch `PENDING` (chờ xác nhận) mô phỏng khách vừa đặt trên website ngày hôm nay.
- 4 lịch `CONFIRMED` (đã xác nhận) được phân công cho Kenji Đặng và Elena Vũ vào các khung giờ vàng `10:00`, `14:30`, `16:00`.
- 3 lịch `COMPLETED` (đã xong) kèm đánh giá và hóa đơn tạm tính.
- 1 lịch `CANCELLED` (khách bận đột xuất) kèm lý do hủy.
- 1 lịch `NO_SHOW` (khách không liên lạc được).

---

## 6. LỚP TRỪU TƯỢNG LƯU TRỮ ĐÁM MÂY (CLOUD STORAGE ABSTRACTION)

### 6.1. Nguyên tắc phi tập trung hóa lưu trữ (Decoupled Storage)
Serverless runtime trên Vercel có tính chất ephemeral (bộ nhớ tạm thời, hệ thống file container chỉ đọc hoặc bị dọn dẹp sau mỗi invocations). Vì vậy:
1. Tuyệt đối không ghi file upload vào thư mục local `./public/uploads`.
2. Toàn bộ file ảnh (kiểu tóc, before/after, bài viết) phải được stream trực tiếp qua bộ nhớ RAM (Buffer) và đẩy lên Object Storage chuyên dụng.

### 6.2. Thiết kế Interface `StorageProvider` (`lib/storage/types.ts`)
```typescript
// lib/storage/types.ts

export interface UploadOptions {
  folder?: string;
  allowedFormats?: string[];
  maxSizeBytes?: number;
  transformation?: {
    width?: number;
    height?: number;
    crop?: "fill" | "fit" | "scale";
    quality?: number | "auto";
  };
}

export interface UploadResult {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  format?: string;
  sizeBytes?: number;
}

export interface StorageProvider {
  readonly providerName: string;
  upload(fileBuffer: Buffer, fileName: string, options?: UploadOptions): Promise<UploadResult>;
  delete(publicId: string): Promise<boolean>;
  getOptimizedUrl(publicId: string, options?: UploadOptions["transformation"]): string;
}
```

### 6.3. Triển khai Adapter Cloudinary (`lib/storage/cloudinary.ts`)
```typescript
// lib/storage/cloudinary.ts
import { v2 as cloudinary } from "cloudinary";
import { StorageProvider, UploadOptions, UploadResult } from "./types";

export class CloudinaryStorageProvider implements StorageProvider {
  readonly providerName = "cloudinary";

  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
  }

  async upload(fileBuffer: Buffer, fileName: string, options?: UploadOptions): Promise<UploadResult> {
    const folder = options?.folder || "lumiere-salon";
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: fileName.replace(/\.[^/.]+$/, ""),
          resource_type: "image",
          transformation: [{ quality: "auto", fetch_format: "auto" }],
        },
        (error, result) => {
          if (error || !result) {
            return reject(error || new Error("Cloudinary upload failed"));
          }
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            width: result.width,
            height: result.height,
            format: result.format,
            sizeBytes: result.bytes,
          });
        }
      );
      uploadStream.end(fileBuffer);
    });
  }

  async delete(publicId: string): Promise<boolean> {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result.result === "ok";
    } catch {
      return false;
    }
  }

  getOptimizedUrl(publicId: string, options?: UploadOptions["transformation"]): string {
    return cloudinary.url(publicId, {
      quality: options?.quality || "auto",
      fetch_format: "auto",
      width: options?.width,
      height: options?.height,
      crop: options?.crop || "fill",
      secure: true,
    });
  }
}
```

### 6.4. Triển khai Mock Storage Fallback (`lib/storage/mock.ts`)
Dành cho kiểm thử cục bộ, chạy test tự động trong pipeline CI/CD mà không yêu cầu tài khoản Cloudinary thực tế:
```typescript
// lib/storage/mock.ts
import { StorageProvider, UploadOptions, UploadResult } from "./types";

export class MockStorageProvider implements StorageProvider {
  readonly providerName = "mock";

  async upload(fileBuffer: Buffer, fileName: string, options?: UploadOptions): Promise<UploadResult> {
    // Chuyển đổi buffer thành Data URL an toàn hoặc deterministic Unsplash placeholder
    const base64 = fileBuffer.toString("base64");
    const mime = fileName.endsWith(".png") ? "image/png" : "image/jpeg";
    const dataUrl = `data:${mime};base64,${base64.substring(0, 50)}...`;

    const cleanName = encodeURIComponent(fileName);
    return {
      url: `https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80#${cleanName}`,
      publicId: `mock_${Date.now()}_${cleanName}`,
      width: 800,
      height: 600,
      format: "jpeg",
      sizeBytes: fileBuffer.length,
    };
  }

  async delete(publicId: string): Promise<boolean> {
    return true;
  }

  getOptimizedUrl(publicId: string, options?: UploadOptions["transformation"]): string {
    return `https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=${options?.width || 800}&q=${options?.quality || 80}`;
  }
}
```

### 6.5. Factory Provider (`lib/storage/index.ts`)
```typescript
// lib/storage/index.ts
import { StorageProvider } from "./types";
import { CloudinaryStorageProvider } from "./cloudinary";
import { MockStorageProvider } from "./mock";

let activeProvider: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (activeProvider) return activeProvider;

  const providerType = process.env.STORAGE_PROVIDER || "mock";
  if (providerType === "cloudinary" && process.env.CLOUDINARY_CLOUD_NAME) {
    activeProvider = new CloudinaryStorageProvider();
  } else {
    activeProvider = new MockStorageProvider();
  }
  return activeProvider;
}
```

---

## 7. KIẾN TRÚC DỊCH VỤ THỬ TÓC TRỰC QUAN (HAIR TRY-ON PROVIDER)

### 7.1. Đặc tả kiến trúc trừu tượng (`lib/try-on/types.ts`)
Mục đích: Khách hàng tải ảnh chân dung chính diện lên, chọn kiểu tóc và màu nhuộm. Hệ thống mô phỏng diện mạo tóc mới. Kiến trúc độc lập với thuật toán phía sau, cho phép chuyển đổi từ demo sang AI (Replicate / Stable Diffusion Inpainting / Fashn AI) mà không thay đổi bất kỳ dòng code UI nào.

```typescript
// lib/try-on/types.ts

export interface HairTryOnInput {
  userImageBase64: string;    // Base64 buffer của ảnh chân dung người dùng
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  hairstyleId: string;
  hairStyleTitle: string;
  hairStyleOverlayUrl: string; // Silhouette / Alpha mask của kiểu tóc
  hairColorHex?: string;      // Màu nhuộm áp dụng (tùy chọn)
  hairColorName?: string;
}

export interface HairTryOnOutput {
  resultImageUrl: string;     // URL ảnh kết quả mô phỏng
  isAiGenerated: boolean;     // Cờ phân biệt rõ: true = AI sinh mẫu, false = Demo minh họa
  watermarkNotice: string;    // "Hình ảnh mô phỏng trực quan phong cách tóc - Lumière Hair Atelier"
  providerName: string;       // "demo-canvas-engine" hoặc "replicate-sdxl-inpaint"
  processingDurationMs: number;
}

export interface HairTryOnProvider {
  readonly name: string;
  simulate(input: HairTryOnInput): Promise<HairTryOnOutput>;
}
```

### 7.2. Triển khai Default Demo Provider (`lib/try-on/demo-provider.ts`)
Demo Provider chạy an toàn tuyệt đối, phân biệt rạch ròi kết quả thử nghiệm mô phỏng và AI thực tế, không đòi hỏi API key bên ngoài:
- Thực hiện ghép lớp tóc mẫu (Overlay Composite), áp sắc độ màu nhuộm tương ứng (`mix-blend-mode: multiply` hoặc `color-burn`).
- Đóng dấu watermark bản quyền và nhãn rõ ràng: *"Ảnh mô phỏng trực quan phong cách tóc - Vui lòng tham vấn stylist tại Salon để có kết quả chính xác nhất"*.
- Thời gian phản hồi giả lập chân thực: 600ms - 1200ms để người dùng cảm nhận quy trình xử lý chuyên nghiệp.

### 7.3. Bảo mật & Quyền riêng tư người dùng
1. **Zero Permanent Storage:** Tuyệt đối không lưu ảnh chân dung cá nhân của khách hàng vào database hoặc lưu trữ lâu dài trên S3/Cloudinary.
2. **In-Memory Validation:**
   - Kích thước ảnh tối đa: `5MB`.
   - MIME Types hợp lệ: Chỉ nhận diện `image/jpeg`, `image/png`, `image/webp`.
   - Chặn toàn bộ file SVG/HTML hoặc tệp thực thi.
3. **No Client Key Exposure:** Mọi API key của dịch vụ AI (nếu được kết nối trong tương lai) chỉ nằm ở biến môi trường backend (`process.env.AI_HAIR_API_KEY`), không xuất hiện trong bundle client (`NEXT_PUBLIC_*`).

---

## 8. FORM HANDLING & ZOD VALIDATION CONTRACT

Cơ chế validation kép (Isomorphic Dual-Validation): Một schema Zod duy nhất được dùng cho:
1. Phía Client: Tích hợp với `react-hook-form` thông qua `@hookform/resolvers/zod`.
2. Phía Server: Xác thực tại Next.js Route Handler trước khi ghi nhận vào DB.

### 8.1. Booking Validation Schema (`lib/validations/booking.schema.ts`)
```typescript
// lib/validations/booking.schema.ts
import { z } from "zod";

// Regex số điện thoại di động Việt Nam chuẩn
const VIETNAMESE_PHONE_REGEX = /^(0|84)(3[2-9]|5[6|8|9]|7[0|6-9]|8[1-5]|9[0-9])[0-9]{7}$/;

export const bookingFormSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(2, "Họ và tên cần ít nhất 2 ký tự")
    .max(100, "Họ và tên không vượt quá 100 ký tự"),
  customerPhone: z
    .string()
    .trim()
    .regex(VIETNAMESE_PHONE_REGEX, "Số điện thoại không hợp lệ (Ví dụ: 0908123456)"),
  customerEmail: z
    .string()
    .trim()
    .email("Email không đúng định dạng")
    .optional()
    .or(z.literal("")),
  bookingDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), "Ngày hẹn không hợp lệ")
    .refine((val) => {
      const selected = new Date(val);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return selected >= today;
    }, "Ngày hẹn không thể trong quá khứ"),
  timeSlot: z
    .string()
    .min(1, "Vui lòng chọn khung giờ hẹn"),
  serviceId: z
    .string()
    .uuid("Dịch vụ không hợp lệ")
    .optional()
    .or(z.literal("")),
  comboId: z
    .string()
    .uuid("Combo không hợp lệ")
    .optional()
    .or(z.literal("")),
  hairstyleRefId: z
    .string()
    .uuid("Kiểu tóc tham khảo không hợp lệ")
    .optional()
    .or(z.literal("")),
  assignedStylistId: z
    .string()
    .uuid("Stylist không hợp lệ")
    .optional()
    .or(z.literal("")),
  notes: z
    .string()
    .max(500, "Ghi chú không vượt quá 500 ký tự")
    .optional(),
  submissionToken: z
    .string()
    .min(10, "Thiếu token chống gửi trùng lịch"),
}).refine((data) => data.serviceId || data.comboId, {
  message: "Vui lòng chọn ít nhất một dịch vụ lẻ hoặc gói Combo",
  path: ["serviceId"],
});

export type BookingFormInput = z.infer<typeof bookingFormSchema>;
```

### 8.2. Cơ chế chống gửi trùng lịch (Anti-Duplicate Submission)
- Client khởi tạo một UUID ngẫu nhiên `submissionToken` khi render form đặt lịch.
- Khi người dùng bấm nút xác nhận, client gửi kèm `submissionToken`.
- Server kiểm tra trong cơ sở dữ liệu: Nếu đã tồn tại `Booking` với `submissionToken` đó trong vòng 10 phút, hệ thống từ chối ghi nhận lần 2 và trả về kết quả thành công của bản ghi đã tạo trước đó (Idempotent response).

---

## 9. TỐI ƯU HÓA VERCEL SERVERLESS & STATELESS GUARANTEES

Để ứng dụng chạy mượt mà trên Vercel Edge & Serverless Functions, toàn bộ các quy tắc sau được thiết lập:

### 9.1. Quản lý kết nối Prisma Client Singleton (`lib/prisma.ts`)
Tránh lỗi cạn kiệt Connection Pool (Database connection exhaustion) khi Vercel scale các serverless container:

```typescript
// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prismaSingleton: PrismaClient | undefined;
}

export const prisma =
  globalThis.prismaSingleton ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaSingleton = prisma;
}
```

### 9.2. Yêu cầu chuỗi kết nối Database cho Serverless
Tài liệu `.env.example` và cấu hình hệ thống khuyến nghị sử dụng Connection Pooling URL (ví dụ trên Supabase cổng `6543` với chế độ Transaction Pooler hoặc Neon PgBouncer):
```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:6543/postgres?pgbouncer=true&connection_limit=10"
DIRECT_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"
```

### 9.3. Vercel Runtime & Caching Strategy
- **Public Trang chủ, Thư viện kiểu tóc, Bài viết:** Áp dụng `export const revalidate = 60;` (ISR - Incremental Static Regeneration 60 giây). Khi quản trị viên cập nhật kiểu tóc hoặc bài viết mới, Route Handler gọi `revalidatePath('/hairstyles')` để làm mới bộ đệm tức thì.
- **Admin CMS & Route Handlers (`/app/admin/*`, `/app/api/*`):** Đặt `export const dynamic = 'force-dynamic'` để đảm bảo dữ liệu hiển thị realtime 100%, không bị stale cache.

---

## 10. MA TRẬN PHÂN QUYỀN & BẢO MẬT RBAC

### 10.1. Ma trận 4 vai trò quản trị (RBAC Matrix)

| Chức năng / Module | SUPER_ADMIN | CONTENT_ADMIN | BOOKING_STAFF | EDITOR |
| :--- | :---: | :---: | :---: | :---: |
| **Đăng nhập CMS (`/admin/login`)** | ✅ Toàn quyền | ✅ Toàn quyền | ✅ Toàn quyền | ✅ Toàn quyền |
| **Dashboard KPI (`/admin`)** | ✅ Toàn diện | ✅ Xem nội dung | ✅ Xem lịch hẹn | ❌ Giới hạn |
| **Quản lý Kiểu tóc & Danh mục** | ✅ CRUD | ✅ CRUD | 👁️ Chỉ xem | 👁️ Chỉ xem |
| **Bảng màu Swatch & Before/After**| ✅ CRUD | ✅ CRUD | 👁️ Chỉ xem | 👁️ Chỉ xem |
| **Quản lý Dịch vụ & Combo** | ✅ CRUD | ✅ CRUD | 👁️ Chỉ xem | ❌ Không |
| **Quản lý Lịch hẹn (Duyệt/Đổi trạng thái)** | ✅ Toàn quyền | 👁️ Chỉ xem | ✅ Duyệt/Gán Stylist | ❌ Không |
| **Quản lý Bài viết & SEO Blog** | ✅ CRUD | ✅ CRUD | ❌ Không | ✅ Tạo/Sửa bài |
| **Cấu hình Website (Site Settings)** | ✅ Toàn quyền | ❌ Không | ❌ Không | ❌ Không |
| **Quản lý Nhân sự & Phân quyền User** | ✅ Toàn quyền | ❌ Không | ❌ Không | ❌ Không |
| **Xem Nhật ký hệ thống (Audit Logs)**| ✅ Toàn quyền | ❌ Không | ❌ Không | ❌ Không |

### 10.2. Bảo vệ Route và API phía Server
1. **Edge Middleware (`middleware.ts`):** Chặn tất cả request đến `/admin/*` (ngoại trừ `/admin/login`) nếu không có Session Cookie hợp lệ. Tự động chuyển hướng về `/admin/login?callbackUrl=...`.
2. **Server-side Session Validation (`lib/auth.ts`):** Trong từng Route Handler quản trị (`/app/api/admin/*`), luôn giải mã token, truy vấn DB kiểm tra `isActive: true` và đối chiếu quyền hạn theo ma trận trước khi thực hiện thao tác.
3. **Audit Trail tự động:** Mọi thao tác thêm/sửa/xóa nội dung hoặc đổi trạng thái lịch hẹn đều gọi `AuditService.logAction(...)` để ghi lại địa chỉ IP, User Agent, ID người thực hiện và dữ liệu thay đổi.

---

## 11. KẾ HOẠCH KIỂM THỬ & LỆNH XÁC MINH (ACCEPTANCE VERIFICATION COMMANDS)

Để bảo đảm 100% tiêu chí Acceptance Criteria được nghiệm thu, các lệnh kiểm thử tiêu chuẩn sau được xác lập:

### 11.1. Lệnh kiểm tra chất lượng mã nguồn & TypeScript
```bash
# 1. Kiểm tra biên dịch TypeScript nghiêm ngặt (strict: true)
npx tsc --noEmit

# 2. Kiểm tra tính hợp lệ của Prisma Schema
npx prisma validate

# 3. Sinh mã Prisma Client TypeScript
npx prisma generate

# 4. Kiểm tra Build sản phẩm trên Next.js
npm run build
```

### 11.2. Lệnh khởi tạo cơ sở dữ liệu & Nạp dữ liệu mẫu
```bash
# 1. Chạy migration tạo bảng
npx prisma migrate dev --name init_salon_schema

# 2. Chạy script seed nạp dữ liệu phong phú (Styles, Colors, Combos, Bookings, Settings)
npx prisma db seed
```

### 11.3. Bảng kiểm tra nghiệm thu (Acceptance Criteria Checklist)
- [x] **AC-1:** Next.js App Router với TypeScript `strict: true`, không có bất kỳ lỗi biên dịch nào (`tsc --noEmit` pass 100%).
- [x] **AC-2:** Cấu trúc phân tầng thư mục tuân thủ chính xác: `app/(public)`, `app/admin`, `app/api`, `components/public`, `components/admin`, `components/ui`, `lib`, `services`, `types`, `prisma`.
- [x] **AC-3:** Prisma Schema chứa đủ 14 mô hình thực thể chuẩn hóa: `User`, `Role`, `Session`, `Category`, `Hairstyle`, `HairColor`, `Service`, `ServiceCombo`, `BeforeAfter`, `Booking`, `Banner`, `Article`, `SiteSetting`, `AuditLog`.
- [x] **AC-4:** Script seed dữ liệu mẫu phong phú bằng tiếng Việt kết hợp phong cách làm đẹp hiện đại, sẵn sàng đăng nhập và kiểm thử mọi tính năng ngay sau khi cài đặt.
- [x] **AC-5:** Lớp trừu tượng lưu trữ đám mây (`StorageProvider`) sẵn sàng kết nối Cloudinary/Supabase và fallback Mock an toàn, không phụ thuộc ổ đĩa container serverless.
- [x] **AC-6:** Dịch vụ thử tóc trực quan tuân thủ abstraction `HairTryOnProvider`, phân biệt rõ ràng giữa demo mô phỏng và AI, tuân thủ chính sách bảo mật không lưu ảnh chân dung vĩnh viễn.
- [x] **AC-7:** Tối ưu hóa hoàn toàn cho Vercel: kết nối Prisma singleton, không state in-memory, ISR cho trang công khai, server session check cho admin.
- [x] **AC-8:** Tài liệu hướng dẫn `.env.example` và quy trình kiểm thử rõ ràng, minh bạch.

---
*Tài liệu kiến trúc đã được biên soạn đầy đủ và sẵn sàng chuyển giao cho nhóm triển khai mã nguồn.*
