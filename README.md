# Lumière Hair Atelier — Nền Tảng Quản Lý & Trải Nghiệm Salon Tóc Hiện Đại

> **Lumière Hair Atelier** là giải pháp phần mềm web cao cấp, toàn diện phục vụ giới thiệu, quảng bá thương hiệu salon tóc Nam & Nữ chuẩn quốc tế kết hợp hệ thống quản trị vận hành Salon (Admin CMS) tinh gọn, bảo mật cao. Ứng dụng được tối ưu hóa chuyên sâu cho kiến trúc **Serverless trên Vercel** và cơ sở dữ liệu **PostgreSQL** (Vercel Postgres, Neon, Supabase).

---

## Mục Lục

1. [Giới Thiệu Tổng Quan Hệ Thống](#1-giới-thiệu-tổng-quan-hệ-thống)
   - [1.1 Phân hệ Website Khách Hàng (Public Web)](#11-phân-hệ-website-khách-hàng-public-web)
   - [1.2 Phân hệ Quản Trị Salon (Admin CMS)](#12-phân-hệ-quản-trị-salon-admin-cms)
2. [Kiến Trúc Kỹ Thuật & Cấu Trúc Thư Mục](#2-kiến-trúc-kỹ-thuật--cấu-trúc-thư-mục)
   - [2.1 Công nghệ nền tảng](#21-công-nghệ-nền-tảng)
   - [2.2 Sơ đồ luồng dữ liệu (Data Flow)](#22-sơ-đồ-luồng-dữ-liệu-data-flow)
   - [2.3 Cấu trúc thư mục dự án](#23-cấu-trúc-thư-mục-dự-án)
3. [Yêu Cầu Môi Trường & Cài Đặt Cục Bộ](#3-yêu-cầu-môi-trường--cài-đặt-cục-bộ)
4. [Hướng Dẫn Cấu Hình Biến Môi Trường (.env & .env.example)](#4-hướng-dẫn-cấu-hình-biến-môi-trường-env--envexample)
5. [Cơ Sở Dữ Liệu, Prisma Migrations & Seed Dữ Liệu Mẫu](#5-cơ-sở-dữ-liệu-prisma-migrations--seed-dữ-liệu-mẫu)
6. [Tài Khoản Nhân Viên Mặc Định & Phân Quyền RBAC](#6-tài-khoản-nhân-viên-mặc-định--phân-quyền-rbac)
   - [6.1 Ma trận phân quyền 4 vai trò RBAC](#61-ma-trận-phân-quyền-4-vai-trò-rbac)
   - [6.2 Danh sách tài khoản nhân viên mặc định](#62-danh-sách-tài-khoản-nhân-viên-mặc-định)
7. [Khởi Chạy Ứng Dụng](#7-khởi-chạy-ứng-dụng)
8. [Hệ Thống Thử Kiểu Tóc & Cam Kết Bảo Mật Sinh Trắc Học](#8-hệ-thống-thử-kiểu-tóc--cam-kết-bảo-mật-sinh-trắc-học)
   - [8.1 Trải nghiệm thử tóc trực quan](#81-trải-nghiệm-thử-tóc-trực-quan)
   - [8.2 Kiến trúc trừu tượng `HairTryOnProvider`](#82-kiến-trúc-trừu-tượng-hairtryonprovider)
   - [8.3 Cam kết bảo vệ quyền riêng tư & Zero Disk Persistence](#83-cam-kết-bảo-vệ-quyền-riêng-tư--zero-disk-persistence)
9. [Cấu Hình Nhà Cung Cấp Lưu Trữ Đa Phương Tiện (Storage Providers)](#9-cấu-hình-nhà-cung-cấp-lưu-trữ-đa-phương-tiện-storage-providers)
10. [Hệ Thống Kiểm Thử Toàn Diện (Standalone E2E Test Suite)](#10-hệ-thống-kiểm-thử-toàn-diện-standalone-e2e-test-suite)
    - [10.1 Kết quả kiểm thử (67/67 Tests Passing)](#101-kết-quả-kiểm-thử-6767-tests-passing)
    - [10.2 Hướng dẫn chạy Test Runner CLI](#102-hướng-dẫn-chạy-test-runner-cli)
11. [Hướng Dẫn Triển Khai Production Lên Vercel + PostgreSQL](#11-hướng-dẫn-triển-khai-production-lên-vercel--postgresql)
    - [11.1 Chuẩn bị Cơ sở dữ liệu Cloud](#111-chuẩn-bị-cơ-sở-dữ-liệu-cloud)
    - [11.2 Kết nối Vercel & Cấu hình Biến Môi trường](#112-kết-nối-vercel--cấu-hình-biến-môi-trường)
    - [11.3 Chạy Migration trên Production](#113-chạy-migration-trên-production)
    - [11.4 Kiểm tra hoàn tất triển khai](#114-kiểm-tra-hoàn-tất-triển-khai)

---

## 1. Giới Thiệu Tổng Quan Hệ Thống

Hệ thống **Lumière Hair Atelier** bao gồm hai phân hệ độc lập, chia sẻ chung cơ sở dữ liệu quan hệ và tầng dịch vụ nghiệp vụ:

### 1.1 Phân hệ Website Khách Hàng (Public Web)
Trải nghiệm thương hiệu sang trọng, chuẩn SEO quốc tế, tối ưu mượt mà cho mọi thiết bị di động (Mobile First):
* **Trang chủ động (Dynamic Homepage):** Hero banner slider quản trị từ CMS, danh mục nổi bật (Tóc Nam, Tóc Nữ, Nhuộm Thời Trang, Chăm Sóc), xu hướng tóc thịnh hành 2026, thanh trượt so sánh Trước/Sau (Before/After), đội ngũ Master Stylist hàng đầu, đánh giá thực tế và bài viết cẩm nang.
* **Thư viện kiểu tóc đa tiêu chí (`/hairstyles`):** Bộ lọc 6 chiều đồng bộ trực tiếp lên URL query parameters (Đối tượng: Nam/Nữ/Unisex; Độ dài: Rất ngắn đến Rất dài; Dáng khuôn mặt; Chất tóc; Mức độ chăm sóc; Phong cách: Hàn Quốc, Nhật Bản, Cổ điển, Tối giản, Streetwear...).
* **Chi tiết mẫu tóc (`/hairstyles/[slug]`):** Bộ ảnh chi tiết đa góc độ, đặc tính phong cách, lời khuyên chăm sóc, dịch vụ làm tóc liên quan, bảng giá tham khảo, lưu yêu thích và nút chuyển ngay sang Đặt lịch / Thử kiểu tóc.
* **Bảng màu nhuộm & Swatch (`/colors`):** Phân loại theo Tông (Ấm / Lạnh / Trung tính), Nhóm màu sắc, Độ sáng (Level 1-10), yêu cầu nâng tông/tẩy tóc, tông da phù hợp và cẩm nang giữ màu bền lâu.
* **Bộ sưu tập Before/After tương tác (`/before-after`):** Thanh trượt so sánh 2 ảnh (trước - sau) kéo thả trực quan theo thời gian thực, lọc theo dịch vụ và liên kết trực tiếp tới kiểu tóc tương ứng.
* **Dịch vụ & Bảng giá minh bạch (`/services`):** Danh mục phân nhóm rõ ràng (Cắt, Uốn, Nhuộm, Tẩy, Phục hồi Keratin, Gội dưỡng sinh, Combo đặc quyền), thời lượng thực hiện và lưu ý trước/sau khi làm.
* **Quy trình Đặt lịch trực tuyến 5 bước (`/booking`):** Wizard thông minh hỗ trợ:
  1. Chọn dịch vụ hoặc gói combo
  2. Chọn kiểu tóc và màu sắc tham khảo
  3. Chỉ định Master Stylist yêu thích
  4. Chọn ngày và khung giờ hẹn hợp lệ trong giờ hoạt động của Salon
  5. Điền thông tin cá nhân khách hàng, ghi chú kèm cơ chế chống gửi trùng lịch (Anti-duplicate Idempotency Key)
* **Thử kiểu tóc trực quan (`/try-on`):** Khách hàng tải ảnh chân dung portrait để xem kết quả mô phỏng kiểu tóc và màu nhuộm.
* **Chuyên mục tin tức & Cẩm nang tóc đẹp (`/blog`):** Bài viết chuẩn SEO semantic markup, thẻ meta Open Graph phong phú, ước lượng thời gian đọc và lọc theo thẻ chủ đề.

### 1.2 Phân hệ Quản Trị Salon (Admin CMS)
Phân hệ quản trị độc lập tại route `/admin`, kiểm soát truy cập nghiêm ngặt phía server:
* **Xác thực & Phân quyền RBAC (Role-Based Access Control):** 4 vai trò quản trị phân định rõ ràng quyền hạn (`SUPER_ADMIN`, `CONTENT_ADMIN`, `BOOKING_STAFF`, `EDITOR`). Session bảo mật qua HTTP-Only Cookie.
* **Bảng điều khiển đo lường thời gian thực (Dashboard Telemetry):** Thống kê số lượng kiểu tóc, màu sắc, dịch vụ, bài viết, số lịch hẹn trong ngày, cảnh báo lịch hẹn chờ tiếp nhận và nhật ký hoạt động mới nhất.
* **Quản trị nội dung toàn diện (Full CRUD):**
  - Quản lý Banner trang chủ (Thêm mới, sửa tiêu đề, CTA, ảnh mobile/desktop, bật/tắt hiển thị, sắp xếp thứ tự).
  - Quản lý Danh mục & Kiểu tóc (6 chiều thuộc tính, gallery ảnh, mẹo chăm sóc, bảng giá tham chiếu).
  - Quản lý Bảng màu tóc (Mã màu, mã HEX màu chính/phụ, yêu cầu số lần tẩy, độ sáng).
  - Quản lý Bộ sưu tập Before/After (Cặp ảnh trước - sau, gán dịch vụ, gán stylist thực hiện).
  - Quản lý Dịch vụ & Gói Combo tiết kiệm.
  - Quản lý Bài viết tin tức (Trình soạn thảo nội dung phong phú, slug SEO, thẻ tags, trạng thái xuất bản).
* **Quản lý quy trình Lịch hẹn 5 trạng thái:** `PENDING` (Chờ duyệt) $\rightarrow$ `CONFIRMED` (Đã xác nhận) $\rightarrow$ `COMPLETED` (Đã phục vụ xong) / `CANCELLED` (Đã hủy kèm lý do) / `NO_SHOW` (Khách không đến). Hỗ trợ tìm kiếm, lọc theo ngày/trạng thái, gán stylist và ghi chú nội bộ.
* **Cấu hình thương hiệu Salon động (Site Settings):** Cập nhật ngay lập tức tên thương hiệu, slogan, logo, hotline, địa chỉ, giờ mở cửa, mạng xã hội, mã nhúng Google Maps và metadata SEO mặc định mà không cần build lại mã nguồn.
* **Nhật ký kiểm toán bất biến (Audit Logs):** Ghi vết chi tiết mọi thao tác nhạy cảm (Đăng nhập, thêm/sửa/xóa nội dung, cập nhật trạng thái đặt lịch) kèm thời gian, địa chỉ IP và dữ liệu sai biệt (diff).

---

## 2. Kiến Trúc Kỹ Thuật & Cấu Trúc Thư Mục

### 2.1 Công nghệ nền tảng

| Thành phần | Công nghệ / Thư viện | Vai trò |
|---|---|---|
| **Framework** | Next.js 14 (App Router, Node.js 20+) | Nền tảng Full-Stack React với Server Components & Route Handlers |
| **Ngôn ngữ** | TypeScript 5.6 (`strict: true`) | Đảm bảo an toàn kiểu dữ liệu 100% trên toàn bộ codebase |
| **Giao diện** | Tailwind CSS + Radix UI + Lucide Icons | Hệ thống thiết kế chuẩn Luxury Salon, responsive đa nền tảng |
| **Biểu mẫu & Xác thực** | React Hook Form + Zod | Kiểm tra tính hợp lệ dữ liệu chặt chẽ ở cả Frontend và Backend |
| **Cơ sở dữ liệu** | PostgreSQL 15+ | Cơ sở dữ liệu quan hệ mạnh mẽ, lưu trữ toàn vẹn |
| **ORM** | Prisma 5.22 | Quản lý schema, migrations và truy vấn kiểu tĩnh an toàn |
| **Lưu trữ ảnh** | Pluggable `StorageProvider` (Mock / Cloudinary / Supabase) | Xử lý đa phương tiện độc lập, không phụ thuộc filesystem cục bộ |
| **Mô phỏng tóc** | Pluggable `HairTryOnProvider` | Kiến trúc mở kết nối dịch vụ AI trong tương lai |
| **Bảo mật phiên** | HTTP-Only Cookies + SHA-256 / bcrypt | Bảo vệ toàn diện phân hệ quản trị khỏi XSS và CSRF |

### 2.2 Sơ đồ luồng dữ liệu (Data Flow)

```
[Khách Hàng (Public Browser)]
      │
      ├── (Xem thông tin) ──> Next.js Server Components / ISR ──> Prisma ORM ──> PostgreSQL
      │
      ├── (Đặt lịch) ───────> Form Zod Client ──> POST /api/bookings ──> Idempotency & DB ──> Gửi Audit Log
      │
      └── (Thử kiểu tóc) ───> POST /api/try-on (Multipart / Base64)
                                    │
                                    ▼
                         [In-Memory Buffer Proxy]
                         - Magic Bytes & MIME Check
                         - Giới hạn 5MB / Zero Disk Write
                         - Khử sạch Buffer sau phản hồi
                                    │
                                    ▼
                         HairTryOnProvider (Demo / AI)

[Nhân Viên Quản Trị (Admin Browser)]
      │
      └── (Truy cập /admin) ──> Middleware & Server Session Guard
                                    │
                                    ├─ Hợp lệ: Render Dashboard / CRUD Panels
                                    └─ Không hợp lệ: Redirect /admin/login (HTTP 401/403)
```

### 2.3 Cấu trúc thư mục dự án

```
Teamcode/
├── app/
│   ├── (public)/                      # Phân hệ giao diện công khai cho khách hàng
│   │   ├── layout.tsx                 # Khung giao diện public (Header, Nav, Footer lấy từ SiteSettings)
│   │   ├── page.tsx                   # Trang chủ động hiển thị các block từ CMS
│   │   ├── hairstyles/                # Thư viện kiểu tóc và trang chi tiết kiểu tóc ([slug])
│   │   ├── colors/                    # Bảng màu nhuộm tóc thời trang & cẩm nang tông da
│   │   ├── before-after/              # Bộ sưu tập Before/After với slider so sánh ảnh
│   │   ├── services/                  # Bảng giá dịch vụ và gói combo chăm sóc
│   │   ├── booking/                   # Wizard đặt lịch trực tuyến 5 bước
│   │   ├── try-on/                    # Ứng dụng thử kiểu tóc & màu nhuộm trực quan
│   │   └── blog/                      # Chuyên mục tin tức & cẩm nang tóc đẹp ([slug])
│   ├── admin/                         # Phân hệ Quản trị Salon (Admin CMS)
│   │   ├── layout.tsx                 # Shell quản trị (Kiểm tra session, Sidebar theo Role, Topbar)
│   │   ├── login/                     # Màn hình đăng nhập quản trị
│   │   ├── page.tsx                   # Dashboard chỉ số tổng quan thời gian thực
│   │   ├── banners/                   # Quản lý Banner trang chủ
│   │   ├── categories/                # Quản lý Danh mục phân loại
│   │   ├── hairstyles/                # Quản lý Kiểu tóc (Danh sách, Tạo mới, Sửa)
│   │   ├── colors/                    # Quản lý Bảng màu nhuộm tóc
│   │   ├── before-after/              # Quản lý Bộ sưu tập Before/After
│   │   ├── services/                  # Quản lý Dịch vụ & Gói combo
│   │   ├── articles/                  # Quản lý Bài viết & Biên tập nội dung
│   │   ├── bookings/                  # Quản lý Quy trình Lịch hẹn 5 trạng thái
│   │   ├── settings/                  # Cấu hình thương hiệu & SEO động
│   │   └── audit-logs/                # Nhật ký kiểm toán bảo mật hệ thống
│   ├── api/                           # Hệ thống Route Handlers (RESTful API)
│   │   ├── auth/                      # API đăng nhập, đăng xuất, kiểm tra phiên
│   │   ├── public/                    # API công khai đọc dữ liệu (home, hairstyles, colors, services...)
│   │   ├── bookings/                  # API tiếp nhận đặt lịch từ khách hàng
│   │   ├── try-on/                    # In-memory proxy thử tóc bảo mật sinh trắc học
│   │   └── admin/                     # API nội bộ quản trị bảo vệ bởi RBAC guards
│   ├── globals.css                    # Cấu hình Tailwind CSS, biến theme Luxury Gold
│   └── layout.tsx                     # Root HTML layout
├── components/
│   ├── public/                        # Các component chuyên biệt cho Public Web (Slider, BookingForm, TryOnCanvas...)
│   ├── admin/                         # Các component chuyên biệt cho Admin CMS (DataTable, StatCard, BookingModal...)
│   └── ui/                            # Thư viện UI nguyên tử (Button, Dialog, Select, Slider, Toast, Tabs...)
├── lib/
│   ├── prisma.ts                      # PrismaClient Singleton hỗ trợ Serverless connection pooling
│   ├── auth.ts                        # Cơ chế mã hóa phiên làm việc, cookie & RBAC helpers
│   ├── utils.ts                       # Tiện ích định dạng tiền tệ VNĐ, ngày tháng, CSS class merge (cn)
│   └── validations/                   # Schema kiểm thực dữ liệu Zod (booking, try-on, content...)
├── services/
│   ├── storage/                       # StorageProvider Abstraction (Mock, Cloudinary, Supabase)
│   ├── try-on/                        # HairTryOnProvider Abstraction (DemoHairTryOnProvider)
│   └── audit.ts                       # Hệ thống ghi nhận nhật ký kiểm toán (Audit Logger)
├── types/                             # Định nghĩa kiểu dữ liệu TypeScript dùng chung
├── prisma/
│   ├── schema.prisma                  # Schema cơ sở dữ liệu quan hệ hoàn chỉnh (14 Models)
│   └── seed.ts                        # Kịch bản nạp dữ liệu mẫu phong phú chuẩn Salon Việt Nam
├── tests/                             # Bộ kiểm thử tự động Opaque-Box E2E độc lập (Tiers 1-4)
│   ├── run-e2e.ts                     # Standalone CLI test runner
│   ├── harness/                       # Khung test runner và assertion engine siêu tốc
│   └── e2e/                           # 15 Test Suites kiểm thử mọi tính năng, biên độ và bảo mật
├── .env.example                       # Tệp mẫu biến môi trường có chú thích đầy đủ
├── package.json                       # Khai báo thư viện và kịch bản thực thi
└── tsconfig.json                      # Cấu hình TypeScript Strict Mode
```

---

## 3. Yêu Cầu Môi Trường & Cài Đặt Cục Bộ

### 3.1 Yêu cầu hệ sinh thái
* **Node.js:** Phiên bản `20.x` hoặc `22.x` (khuyến nghị LTS).
* **Package Manager:** `npm` (phiên bản `10.x` trở lên) hoặc `pnpm` / `yarn`.
* **Cơ sở dữ liệu:** PostgreSQL `15` hoặc `16` (chạy qua Docker hoặc dịch vụ Cloud như Neon / Supabase).

### 3.2 Các bước cài đặt mã nguồn

1. **Clone mã nguồn dự án:**
   ```bash
   git clone <repository_url>
   cd Teamcode
   ```

2. **Cài đặt các gói phụ thuộc (Dependencies):**
   ```bash
   npm install
   ```

---

## 4. Hướng Dẫn Cấu Hình Biến Môi Trường (.env & .env.example)

Hệ thống cung cấp sẵn tệp mẫu `.env.example` với đầy đủ chú thích chi tiết. Để khởi tạo môi trường, hãy sao chép tệp mẫu:

```bash
# Trên Linux/macOS
cp .env.example .env

# Trên Windows PowerShell
Copy-Item .env.example .env

# Trên Windows Command Prompt
copy .env.example .env
```

### Bảng danh mục biến môi trường đầy đủ:

| Biến môi trường | Bắt buộc | Mặc định Local | Mô tả chi tiết |
|---|:---:|---|---|
| `NODE_ENV` | Có | `development` | Môi trường thực thi (`development`, `test`, `production`). |
| `PORT` | Không | `3000` | Cổng HTTP mà server lắng nghe. |
| `NEXT_PUBLIC_APP_URL` | Có | `http://localhost:3000` | URL gốc của ứng dụng web phục vụ sinh đường dẫn tuyệt đối và SEO metadata. |
| `NEXT_PUBLIC_BRAND_NAME` | Không | `Lumière Hair Atelier` | Tên thương hiệu mặc định hiển thị trên trình duyệt. |
| `DATABASE_URL` | Có | `postgresql://postgres:postgres@localhost:5432/lumiere_salon?schema=public` | Chuỗi kết nối PostgreSQL chính (trên cloud nên dùng Connection Pooling qua PgBouncer). |
| `DIRECT_URL` | Tùy chọn | `postgresql://...:5432/...` | Chuỗi kết nối trực tiếp đến PostgreSQL phục vụ Prisma Migration trên môi trường Serverless. |
| `SESSION_SECRET` | Có | `lumiere_super_secret_session_key_32_characters_minimum_length_required` | Khóa bảo mật ký token phiên đăng nhập (tối thiểu 32 ký tự). |
| `SESSION_MAX_AGE_SECONDS`| Không | `604800` | Thời gian sống của phiên đăng nhập quản trị (604800 giây = 7 ngày). |
| `ALLOW_TEST_MOCK_AUTH` | Không | `false` | Cho phép giả lập phiên trong lúc chạy automated test (`false` trên Production). |
| `STORAGE_PROVIDER` | Không | `mock` | Cơ chế lưu trữ ảnh: `mock` (cục bộ) hoặc `cloudinary` hoặc `supabase`. |
| `STORAGE_SAVE_LOCAL_DISK`| Không | `true` | Ghi bản sao ảnh vào `public/uploads` khi dùng Mock Storage tại Local. |
| `CLOUDINARY_CLOUD_NAME` | Nếu dùng Cloudinary | `""` | Tên Cloud Name đăng ký tại Cloudinary. |
| `CLOUDINARY_API_KEY` | Nếu dùng Cloudinary | `""` | API Key tại Cloudinary Console. |
| `CLOUDINARY_API_SECRET` | Nếu dùng Cloudinary | `""` | API Secret tại Cloudinary Console. |
| `CLOUDINARY_FOLDER` | Không | `lumiere-salon` | Thư mục phân loại ảnh trên Cloudinary. |
| `SUPABASE_URL` | Nếu dùng Supabase | `""` | URL dự án Supabase. |
| `SUPABASE_SERVICE_ROLE_KEY`| Nếu dùng Supabase | `""` | Service Role Key có quyền ghi vào Supabase Storage. |
| `SUPABASE_STORAGE_BUCKET` | Không | `lumiere-media` | Tên Bucket lưu trữ ảnh trên Supabase. |
| `TRYON_PROVIDER` | Không | `demo` | Cơ chế mô phỏng thử tóc: `demo` (mặc định nội bộ) hoặc `replicate`. |
| `TRYON_MIN_DELAY_MS` | Không | `1500` | Giả lập độ trễ tối thiểu (ms) của Demo AI Provider. |
| `TRYON_MAX_DELAY_MS` | Không | `2000` | Giả lập độ trễ tối đa (ms) của Demo AI Provider. |
| `TRYON_TIMEOUT_MS` | Không | `15000` | Thời gian chờ tối đa (15s) trước khi ngắt yêu cầu thử tóc. |
| `AI_TRYON_API_KEY` | Nếu dùng AI thật | `""` | Khóa API dịch vụ sinh ảnh AI (chỉ lưu trữ server-side). |
| `MAX_UPLOAD_SIZE_BYTES` | Không | `5242880` | Giới hạn dung lượng tải ảnh tối đa (5242880 bytes = 5.0 MB). |
| `ALLOWED_IMAGE_TYPES` | Không | `image/jpeg,image/png,image/webp` | Danh sách MIME type được phép tải lên. |

---

## 5. Cơ Sở Dữ Liệu, Prisma Migrations & Seed Dữ Liệu Mẫu

### 5.1 Các mô hình dữ liệu chính (14 Prisma Models)
Cơ sở dữ liệu được chuẩn hóa cao độ với 14 bảng quan hệ logic chặt chẽ:
1. `Role`: Danh mục vai trò và ma trận quyền hạn JSON.
2. `User`: Tài khoản nhân viên, quản trị viên và thông tin chuyên môn Master Stylist.
3. `Session`: Quản lý phiên làm việc bảo mật lưu token và IP/User-Agent.
4. `Category`: Phân loại danh mục đa dạng (Kiểu tóc, Dịch vụ, Bài viết).
5. `Hairstyle`: Thư viện kiểu tóc với 6 chiều thuộc tính lọc chuyên sâu.
6. `HairColor`: Bảng màu nhuộm tóc chuẩn salon kèm mã hex, cấp độ tẩy và gợi ý tông da.
7. `Service`: Danh mục dịch vụ làm tóc đơn lẻ và bảng giá minh bạch.
8. `ServiceCombo`: Các gói combo phối hợp đa dịch vụ với giá ưu đãi.
9. `BeforeAfter`: Thư viện các ca biến hóa tóc thực tế liên kết với Stylist và Dịch vụ.
10. `Booking`: Quản lý lịch hẹn trực tuyến với 5 trạng thái quy trình làm việc.
11. `Banner`: Hệ thống banner quảng bá nổi bật tại trang chủ.
12. `Article`: Cẩm nang chăm sóc tóc và bài viết xu hướng chuẩn SEO.
13. `SiteSetting`: Bảng cài đặt thương hiệu, hotline, địa chỉ, giờ mở cửa và SEO mặc định.
14. `AuditLog`: Sổ cái bất biến ghi vết toàn bộ hoạt động trong phân hệ quản trị.

### 5.2 Khởi tạo Database & Chạy Migrations

Trước khi chạy, hãy đảm bảo PostgreSQL đang hoạt động và chuỗi `DATABASE_URL` trong `.env` là chính xác.

1. **Kiểm tra tính hợp lệ của Prisma Schema:**
   ```bash
   npx prisma validate
   ```

2. **Sinh mã Prisma Client:**
   ```bash
   npx prisma generate
   ```

3. **Chạy Migration để đồng bộ cấu trúc bảng vào PostgreSQL:**
   ```bash
   npx prisma migrate dev --name init_salon_schema
   ```
   *(Trên môi trường Production không dùng `migrate dev`, hãy dùng `npx prisma migrate deploy`)*

### 5.3 Nạp bộ dữ liệu mẫu phong phú (Seed Data)

Kịch bản `prisma/seed.ts` được thiết kế kỹ lưỡng với đầy đủ ngữ cảnh thực tế của một Salon tóc cao cấp tại Việt Nam:
* 4 vai trò RBAC đầy đủ quyền hạn.
* 4 tài khoản nhân viên mặc định và 3 hồ sơ Master Stylist danh tiếng (Kenji Đặng, Elena Vũ, Alex Trần).
* 7 danh mục dịch vụ & kiểu tóc đa dạng.
* 6 dịch vụ chăm sóc tóc chuyên sâu và 3 gói Combo đặc quyền (Gentleman Luxe, Seoul Goddess Wave, Platinum Trendsetter).
* 13 kiểu tóc thời thượng (Textured Crop, Modern Pompadour, Two-Block Layer, Mullet, French Waves, Butterfly Cut...).
* 11 mẫu màu nhuộm thời trang cao cấp có mã HEX và hướng dẫn tông da (Nâu Tây Lạnh, Xám Khói Ánh Bạc, Trà Sữa Caramel, Bạch Kim Nordic...).
* 4 cặp ảnh Before/After thực tế sắc nét.
* 4 hero banner trang chủ với nút CTA chuyển hướng.
* 3 bài viết chuyên môn hướng dẫn dưỡng tóc chuẩn SEO.
* Cấu hình thương hiệu Lumière Hair Atelier (địa chỉ 128 Pasteur Q1, hotline, giờ mở cửa, Google Maps).
* 5 lịch hẹn mẫu phủ trọn 5 trạng thái quy trình (`PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED`, `NO_SHOW`).
* Nhật ký kiểm toán mẫu ban đầu.

Để nạp dữ liệu mẫu vào cơ sở dữ liệu:
```bash
# Sử dụng npm script
npm run prisma:seed

# Hoặc thông qua lệnh npx trực tiếp
npx prisma db seed
```

---

## 6. Tài Khoản Nhân Viên Mặc Định & Phân Quyền RBAC

### 6.1 Ma trận phân quyền 4 vai trò RBAC

Hệ thống áp dụng cơ chế phân quyền nghiêm ngặt theo vai trò (Role-Based Access Control) ở cả cấp độ Layout, Trang Admin và API Endpoints:

| Tính năng / Khu vực Quản trị | `SUPER_ADMIN` | `CONTENT_ADMIN` | `BOOKING_STAFF` | `EDITOR` |
|---|:---:|:---:|:---:|:---:|
| **Xem Dashboard Telemetry (`/admin`)** | Toàn quyền | Toàn quyền | Toàn quyền | Xem hạn chế |
| **Quản lý Banner Trang chủ (`/admin/banners`)** | Toàn quyền | Toàn quyền | Chỉ xem | ❌ Bị chặn |
| **Quản lý Kiểu tóc & Bảng màu (`/admin/hairstyles`, `/colors`)** | Toàn quyền | Toàn quyền | Chỉ xem | ❌ Bị chặn |
| **Quản lý Dịch vụ & Gói Combo (`/admin/services`)** | Toàn quyền | Toàn quyền | Chỉ xem | ❌ Bị chặn |
| **Quản lý Before/After (`/admin/before-after`)** | Toàn quyền | Toàn quyền | Chỉ xem | ❌ Bị chặn |
| **Quản lý Bài viết SEO (`/admin/articles`)** | Toàn quyền | Toàn quyền | ❌ Bị chặn | Toàn quyền |
| **Quản lý Lịch hẹn Đặt chỗ (`/admin/bookings`)** | Toàn quyền | ❌ Bị chặn | Toàn quyền | ❌ Bị chặn |
| **Cấu hình Thương hiệu & SEO (`/admin/settings`)** | Toàn quyền | ❌ Bị chặn | ❌ Bị chặn | ❌ Bị chặn |
| **Xem Nhật ký Hệ thống (`/admin/audit-logs`)** | Toàn quyền | ❌ Bị chặn | ❌ Bị chặn | ❌ Bị chặn |

### 6.2 Danh sách tài khoản nhân viên mặc định

Tất cả tài khoản dưới đây được tạo tự động sau khi chạy lệnh `npm run prisma:seed`. 

> **Mật khẩu dùng chung cho mọi tài khoản mẫu:** `Admin@123456`

| Email Đăng Nhập | Mật khẩu mẫu | Họ và Tên | Vai trò (Role) | Chức năng chính |
|---|---|---|---|---|
| `admin@lumierehair.vn` | `Admin@123456` | **Nguyễn Hoàng Nam** | `SUPER_ADMIN` | Tổng quản trị toàn quyền hệ thống, cấu hình thương hiệu và nhật ký bảo mật |
| `content@lumierehair.vn` | `Admin@123456` | **Trần Thu Thảo** | `CONTENT_ADMIN` | Quản trị toàn bộ danh mục, mẫu tóc, màu nhuộm, bảng giá dịch vụ và banner |
| `booking@lumierehair.vn` | `Admin@123456` | **Lê Minh Khang** | `BOOKING_STAFF` | Tiếp nhận, xác nhận lịch hẹn khách hàng, điều phối ca làm và gán stylist |
| `editor@lumierehair.vn` | `Admin@123456` | **Phạm Hoàng Yến** | `EDITOR` | Soạn thảo, tối ưu hóa bài viết tư vấn chăm sóc tóc và tin tức xu hướng |
| `stylist.kenji@lumierehair.vn` | `Admin@123456` | **Kenji Đặng** | `CONTENT_ADMIN` | Artistic Director / Master Stylist (Uốn sóng lơi, Cắt Layer hình khối) |
| `stylist.elena@lumierehair.vn` | `Admin@123456` | **Elena Vũ** | `CONTENT_ADMIN` | Master Colorist (Tẩy tóc Olaplex, Balayage, Pastel) |
| `stylist.alex@lumierehair.vn` | `Admin@123456` | **Alex Trần** | `BOOKING_STAFF` | Lead Barber (Skin Fade, Pompadour, Textured Crop) |

---

## 7. Khởi Chạy Ứng Dụng

### 7.1 Môi trường Phát triển (Local Development)

Khởi động máy chủ Next.js phát triển với tính năng Hot-Reload:
```bash
npm run dev
```
Truy cập ứng dụng tại:
* **Website Khách Hàng:** [http://localhost:3000](http://localhost:3000)
* **Hệ Thống Quản Trị Salon:** [http://localhost:3000/admin](http://localhost:3000/admin) (Đăng nhập bằng các tài khoản ở mục 6.2)

### 7.2 Kiểm tra Kiểu Dữ liệu (TypeScript Check)
```bash
npm run typecheck
# Hoặc: npx tsc --noEmit
```

### 7.3 Biên dịch & Khởi chạy Production Cục bộ

1. **Biên dịch mã nguồn tối ưu:**
   ```bash
   npm run build
   ```
2. **Khởi chạy ứng dụng ở chế độ Production:**
   ```bash
   npm start
   ```

---

## 8. Hệ Thống Thử Kiểu Tóc & Cam Kết Bảo Mật Sinh Trắc Học

### 8.1 Trải nghiệm thử tóc trực quan
Tại trang `/try-on`, khách hàng có thể:
1. Tải lên ảnh chân dung chính diện khuôn mặt (hỗ trợ kéo thả tệp hoặc chọn từ thiết bị).
2. Tương tác với khung căn chỉnh khuôn mặt tỷ lệ vàng (Oval Face Guide Overlay).
3. Lựa chọn kiểu tóc mong muốn từ thư viện tóc phong phú của salon.
4. Tùy chọn phối kết hợp với các mẫu màu nhuộm thời trang (Warm, Cool, Pastel, Bleached).
5. Điều chỉnh thanh trượt độ đậm nhạt của ánh màu (Intensity Slider từ 0% đến 100%).
6. Nhận kết quả mô phỏng trực quan tức thì kèm nút **"Đặt lịch với phong cách này"**, tự động điền sẵn kiểu tóc và màu sắc vào form đặt lịch hẹn mà không cần nhập lại.

### 8.2 Kiến trúc trừu tượng `HairTryOnProvider`
Hệ thống thiết kế theo nguyên lý Dependency Inversion, giao diện UI hoàn toàn tách biệt với engine mô phỏng:

```typescript
export interface HairTryOnProvider {
  name: string;
  processTryOn(request: TryOnRequest): Promise<TryOnResponse>;
}
```

* **Triển khai mặc định (`DemoHairTryOnProvider`):** 
  - Tự động kích hoạt khi `TRYON_PROVIDER="demo"`.
  - Sinh ảnh SVG composite độ phân giải cao kết hợp chân dung khách hàng, lớp phủ hòa trộn màu quang học và huy hiệu nhận diện rõ ràng `DEMO SIMULATION`.
  - Giả lập độ trễ xử lý thực tế từ 1.5 đến 2.0 giây để tạo cảm giác AI đang phân tích.
* **Khả năng mở rộng AI tương lai:** Dễ dàng bổ sung các provider tích hợp mô hình Stable Diffusion / Replicate API bằng cách cài đặt interface `HairTryOnProvider` mà không làm thay đổi bất kỳ component UI nào.

### 8.3 Cam kết bảo vệ quyền riêng tư & Zero Disk Persistence
Hệ sinh thái Lumière Atelier cam kết tuân thủ các tiêu chuẩn bảo mật dữ liệu sinh trắc học nghiêm ngặt:
1. **In-Memory Buffer Proxy:** Tệp ảnh tải lên được đọc hoàn toàn trong bộ nhớ đệm RAM (Buffer), tuyệt đối **KHÔNG ghi ra đĩa cứng (Zero Disk Persistence)** của serverless container.
2. **Giải phóng bộ nhớ tức thì:** Biến `imageBuffer` được giải phóng về `null` ngay trong khối lệnh `finally` của Route Handler, tạo điều kiện cho Garbage Collector dọn sạch dữ liệu sinh trắc học ngay khi yêu cầu kết thúc.
3. **Kiểm tra Chữ ký Magic Bytes:** Chống giả mạo đuôi tệp (MIME spoofing), nghiêm cấm các tệp thực thi (PE `.exe`, ELF), tệp tài liệu (`.pdf`), ảnh động `.gif` hoặc tệp chứa mã độc HTML/Script.
4. **Giới hạn dung lượng nghiêm ngặt:** Dung lượng tối đa 5.0 MB (5,242,880 bytes). Vượt quá giới hạn sẽ nhận ngay mã phản hồi `HTTP 413 Payload Too Large`.
5. **Bảo mật Khóa API:** Các API key của nhà cung cấp AI bên thứ ba được giữ an toàn tuyệt đối ở phía server, không bao giờ để lộ ra trình duyệt client qua tiền tố `NEXT_PUBLIC_`.
6. **Không lưu vết sinh trắc học vào Audit Log:** Hệ thống chỉ ghi nhận siêu dữ liệu phân tích (kích thước ảnh, định dạng, ID kiểu tóc áp dụng, thời gian xử lý) vào `AuditLog`, tuyệt đối không lưu trữ dữ liệu ảnh hay vector khuôn mặt của khách hàng.

---

## 9. Cấu Hình Nhà Cung Cấp Lưu Trữ Đa Phương Tiện (Storage Providers)

Hệ thống tích hợp sẵn kiến trúc `StorageProvider` đa tầng tại `services/storage`:

```typescript
export interface StorageProvider {
  readonly name: string;
  upload(fileBuffer: Buffer, fileName: string, options: UploadOptions): Promise<UploadResult>;
  delete(publicId: string): Promise<boolean>;
}
```

### 9.1 Mock Storage Provider (`STORAGE_PROVIDER="mock"`)
* Thích hợp cho môi trường kiểm thử tự động, CI/CD pipeline và phát triển cục bộ mà không cần kết nối mạng.
* Khi `STORAGE_SAVE_LOCAL_DISK="true"`, các tệp tải lên sẽ được ghi vào thư mục `public/uploads/` phục vụ xem trực tiếp trên trình duyệt.

### 9.2 Cloudinary Media Cloud (`STORAGE_PROVIDER="cloudinary"`)
* Khuyến nghị sử dụng cho môi trường Production trên Vercel.
* Ảnh được tự động nén tối ưu, phân phối qua CDN toàn cầu với định dạng WebP/AVIF.
* Cấu hình trong `.env`:
  ```env
  STORAGE_PROVIDER="cloudinary"
  CLOUDINARY_CLOUD_NAME="your_cloud_name"
  CLOUDINARY_API_KEY="your_api_key"
  CLOUDINARY_API_SECRET="your_api_secret"
  CLOUDINARY_FOLDER="lumiere-salon"
  ```

### 9.3 Supabase Storage (`STORAGE_PROVIDER="supabase"`)
* Tận dụng hạ tầng lưu trữ S3 tương thích của Supabase khi triển khai đồng bộ cùng cơ sở dữ liệu Supabase.
* Cấu hình trong `.env`:
  ```env
  STORAGE_PROVIDER="supabase"
  SUPABASE_URL="https://your-project.supabase.co"
  SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"
  SUPABASE_STORAGE_BUCKET="lumiere-media"
  ```

---

## 10. Hệ Thống Kiểm Thử Toàn Diện (Standalone E2E Test Suite)

Dự án sở hữu bộ kiểm thử tự động toàn diện theo phương pháp hộp đen (Opaque-Box E2E Testing) độc lập, chạy trực tiếp trên Node.js mà không phụ thuộc vào các framework kiểm thử cồng kềnh.

### 10.1 Kết quả kiểm thử (67/67 Tests Passing)

Hệ thống đã trải qua quy trình kiểm thử toàn diện và đạt **tỷ lệ vượt qua 100%**:

```
================================================================================
                         E2E EXECUTION SUMMARY
================================================================================
  Execution Mode: SIMULATION / LIVE API
  Total Suites:   15
  Total Tests:    67
  Passed Tests:   67
  Failed Tests:   0
  Skipped Tests:  0
  Success Rate:   100%
================================================================================
```

| Phân tầng kiểm thử (Tier) | Phạm vi & Trọng tâm kiểm thử | Số Suite | Số Test Case | Trạng thái |
|---|---|:---:|:---:|:---:|
| **Tier 1: Feature Coverage** | Kiểm tra toàn bộ chức năng cốt lõi: Public API, Admin Dashboard, CRUD Kiểu tóc/Màu/Dịch vụ, Đặt lịch hẹn, Đăng nhập và Session. | 5 | 27 | ✅ **27/27 PASS** |
| **Tier 2: Boundary & Limits** | Kiểm tra giá trị biên: Độ dài chuỗi, Regex số điện thoại VN, kiểm soát giờ mở cửa, giới hạn ảnh 5MB, kiểm tra chữ ký file và chặn quyền RBAC 403. | 4 | 20 | ✅ **20/20 PASS** |
| **Tier 3: Combinatorial** | Kiểm tra phối hợp chéo tính năng: Kết hợp dịch vụ + kiểu tóc + màu nhuộm có tẩy, CRUD Admin phản ánh ra ngoài Public, chuyển đổi từ Thử tóc sang Đặt lịch. | 3 | 9 | ✅ **9/9 PASS** |
| **Tier 4: Real-World & Security**| Kịch bản thế giới thực & Đánh giá an ninh: Vòng đời khách hàng, đặt lịch đồng thời cao (High-concurrency), phòng chống SQL Injection, XSS, Path Traversal, giả mạo Cookie và IDOR. | 3 | 11 | ✅ **11/11 PASS** |
| **Tổng cộng** | **Toàn bộ 4 Tầng Kiểm Thử** | **15** | **67** | ✅ **100% PASS** |

### 10.2 Hướng dẫn chạy Test Runner CLI

Bạn có thể chạy kiểm thử thông qua npm script hoặc lệnh Node trực tiếp:

#### 1. Chạy toàn bộ 67 bài kiểm thử:
```bash
npm run test:e2e
# Hoặc: node tests/run-e2e.ts
```

#### 2. Chạy theo từng phân tầng (Tier):
```bash
# Chỉ chạy Tier 1: Kiểm thử tính năng cơ bản
node tests/run-e2e.ts --tier=1

# Chỉ chạy Tier 2: Kiểm thử giới hạn biên & RBAC 403
node tests/run-e2e.ts --tier=2

# Chỉ chạy Tier 3: Kiểm thử tương tác kết hợp đa chức năng
node tests/run-e2e.ts --tier=3

# Chỉ chạy Tier 4: Kiểm thử kịch bản thực tế & phòng chống tấn công
node tests/run-e2e.ts --tier=4
```

#### 3. Lọc bài test theo từ khóa (`--grep`):
```bash
# Kiểm tra các tính năng liên quan đến Đặt lịch (Booking)
node tests/run-e2e.ts --grep="booking"

# Kiểm tra công cụ Thử tóc (Try-On)
node tests/run-e2e.ts --grep="try-on"

# Kiểm tra phân quyền bảo mật (RBAC)
node tests/run-e2e.ts --grep="rbac"
```

#### 4. Xem chi tiết chẩn đoán chuyên sâu (`--verbose`):
```bash
node tests/run-e2e.ts --verbose
```

#### 5. Chạy kiểm thử trên máy chủ Next.js đang chạy thật (Live Server Mode):
```bash
# Bật server ở terminal 1: npm run dev
# Chạy test ở terminal 2:
TEST_BASE_URL=http://localhost:3000 node tests/run-e2e.ts
```

Sau khi hoàn tất, báo cáo chi tiết được tự động lưu dưới định dạng JSON tại `test-results/e2e-report.json`.

---

## 11. Hướng Dẫn Triển Khai Production Lên Vercel + PostgreSQL

Kiến trúc Lumière Hair Atelier được tối ưu hóa đặc biệt cho nền tảng Serverless của **Vercel** kết hợp cùng cơ sở dữ liệu **PostgreSQL** có hỗ trợ Connection Pooling.

### 11.1 Chuẩn bị Cơ sở dữ liệu Cloud
Bạn có thể lựa chọn một trong các nhà cung cấp PostgreSQL tương thích hàng đầu:
* **Neon Serverless Postgres:** [https://neon.tech](https://neon.tech) (Khuyên dùng, tự động phân tách Pooling connection)
* **Supabase:** [https://supabase.com](https://supabase.com) (Hỗ trợ kèm Supabase Storage)
* **Vercel Postgres:** Tích hợp trực tiếp từ Vercel Storage Marketplace.

Sau khi tạo database, bạn sẽ nhận được 2 chuỗi kết nối:
1. **Pooled Connection URL (Cổng 6543 hoặc PgBouncer host):** Dùng làm `DATABASE_URL` phục vụ các truy vấn runtime từ Serverless Function.
2. **Direct Connection URL (Cổng 5432):** Dùng làm `DIRECT_URL` để Prisma CLI thực thi các câu lệnh migration cấu trúc bảng.

### 11.2 Kết nối Vercel & Cấu hình Biến Môi trường

1. **Đẩy mã nguồn lên kho lưu trữ GitHub / GitLab:**
   ```bash
   git add .
   git commit -m "feat: complete modern hair salon platform"
   git push origin main
   ```

2. **Tạo dự án mới trên Vercel Dashboard:**
   - Truy cập [https://vercel.com/new](https://vercel.com/new).
   - Chọn kho lưu trữ mã nguồn của bạn và nhấn **Import**.
   - Framework Preset: Vercel sẽ tự động nhận diện là **Next.js**.

3. **Khai báo Environment Variables trên Vercel:**
   Vào mục **Settings** $\rightarrow$ **Environment Variables** và cấu hình các biến sau:

   ```env
   NODE_ENV="production"
   NEXT_PUBLIC_APP_URL="https://your-salon-domain.vercel.app"
   NEXT_PUBLIC_BRAND_NAME="Lumière Hair Atelier"

   DATABASE_URL="postgresql://user:pass@ep-pooler.ap-southeast-1.aws.neon.tech/lumiere_db?sslmode=require&pgbouncer=true"
   DIRECT_URL="postgresql://user:pass@ep-direct.ap-southeast-1.aws.neon.tech/lumiere_db?sslmode=require"

   SESSION_SECRET="chuoi_bi_mat_ngau_nhien_dai_tren_32_ky_tu_openssl_rand_base64_32"
   SESSION_MAX_AGE_SECONDS=604800
   ALLOW_TEST_MOCK_AUTH="false"

   STORAGE_PROVIDER="cloudinary"
   CLOUDINARY_CLOUD_NAME="your_cloudinary_name"
   CLOUDINARY_API_KEY="your_cloudinary_key"
   CLOUDINARY_API_SECRET="your_cloudinary_secret"
   CLOUDINARY_FOLDER="lumiere-prod"

   TRYON_PROVIDER="demo"
   TRYON_MIN_DELAY_MS=1200
   TRYON_MAX_DELAY_MS=1800
   TRYON_TIMEOUT_MS=15000
   ```

### 11.3 Chạy Migration trên Production

Trước hoặc trong quá trình build Vercel, bạn cần đồng bộ schema vào database production. Có 2 cách thực hiện:

#### Cách 1: Thiết lập tự động trong `package.json` Build Command (Khuyên dùng)
Tại cấu hình dự án Vercel, cập nhật **Build Command**:
```bash
prisma generate && prisma migrate deploy && next build
```

#### Cách 2: Chạy trực tiếp từ máy tính quản trị viên:
```bash
# Gán tạm thời URL production vào terminal và chạy:
DATABASE_URL="<production_pooled_url>" DIRECT_URL="<production_direct_url>" npx prisma migrate deploy

# Nạp dữ liệu mẫu ban đầu vào Production (nếu muốn):
DATABASE_URL="<production_pooled_url>" DIRECT_URL="<production_direct_url>" npm run prisma:seed
```

### 11.4 Kiểm tra hoàn tất triển khai

Sau khi Vercel thông báo Deployment thành công:
1. **Truy cập Public Web:** Kiểm tra tải trang chủ, các bộ lọc kiểu tóc tại `/hairstyles`, bảng giá tại `/services` và bài viết cẩm nang.
2. **Kiểm tra công cụ Thử tóc:** Tải ảnh chân dung tại `/try-on`, chọn màu và kiểu tóc để kiểm tra tốc độ phản hồi.
3. **Thử nghiệm Đặt lịch:** Hoàn tất gửi 1 lịch hẹn thử nghiệm tại `/booking`.
4. **Truy cập Admin CMS:** Đăng nhập vào đường dẫn `https://your-domain.vercel.app/admin/login` bằng tài khoản `admin@lumierehair.vn` / `Admin@123456`.
5. **Kiểm tra Dashboard & Duyệt lịch:** Xác nhận lịch hẹn mới tạo đã xuất hiện trên Admin Dashboard và thử chuyển đổi trạng thái sang `CONFIRMED`.

---

## 12. Hỗ Trợ Kỹ Thuật & Bản Quyền

* **Sản phẩm:** Lumière Hair Atelier Management & Brand Experience Platform.
* **Tiêu chuẩn mã nguồn:** Clean Architecture, 100% Strict TypeScript, Zero Container Disk Persistence.
* **Bản quyền:** © 2026 Lumière Hair Atelier. Giữ toàn bộ quyền sở hữu trí tuệ.
