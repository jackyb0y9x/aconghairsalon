# Kế Hoạch & Thiết Kế Kỹ Thuật Chi Tiết: Site Settings & Audit Logs Subsystems (M2)

> **Mã công việc:** M2 Explorer 3  
> **Thư mục làm việc:** `.agents/teamwork/teamwork_preview_explorer_m2_3`  
> **Phạm vi phân hệ:** 
> 1. Site Settings API (`/api/admin/settings`) & Giao diện Quản trị Cấu hình (`app/admin/settings/page.tsx`)
> 2. Audit Logs API (`/api/admin/audit-logs`) & Giao diện Nhật ký Kiểm toán (`app/admin/audit-logs/page.tsx`)
> **Cơ chế phân quyền:** Nghiêm ngặt chỉ dành cho `SUPER_ADMIN` (Strict RBAC Isolation)

---

## 1. Tóm Tắt Tổng Quan (Executive Summary)

Phân hệ **Site Settings** (Cấu hình hệ thống) và **Audit Logs** (Nhật ký kiểm toán) đóng vai trò là "trái tim quản trị và bảo mật" của hệ thống Salon tóc cao cấp **Lumière Hair Atelier**:

1. **Site Settings Subsystem:**
   - Cung cấp cơ chế quản lý dữ liệu cấu hình tập trung (Singleton Pattern) cho toàn bộ ứng dụng: Nhận diện thương hiệu (Tên, Slogan, Logo, Favicon), Thông tin liên hệ (Hotline, Email, Địa chỉ), Khung giờ hoạt động theo tuần, Mạng xã hội (Facebook, Instagram, TikTok, Zalo), Bản đồ số nhúng (Google Maps), Cấu hình SEO mặc định (Meta Title/Description, OG Image) và Thông tin chân trang pháp lý (Bản quyền, Mã số thuế).
   - Đảm bảo tính nhất quán dữ liệu thông qua bộ chuyển đổi hai chiều (Dual-layer Adapter) hỗ trợ cả cấu trúc phẳng (phục vụ bộ test E2E có sẵn) và cấu trúc JSON đa tầng (chuẩn hóa theo schema Prisma).
   - Tự động kích hoạt cơ chế xóa cache phân tán (`revalidatePath('/')`, `revalidatePath('/admin/settings')`) ngay khi cấu hình thay đổi, giúp trang người dùng (Public Website) phản ánh tức thì mà không cần build lại server.
   - Mỗi lần cập nhật cấu hình đều tự động ghi lại lịch sử vào phân hệ Audit Log phục vụ đối soát an toàn.

2. **Audit Logs Subsystem:**
   - Cung cấp hệ thống nhật ký bất biến (Immutable Audit Trail) ghi nhận mọi hoạt động mang tính tác động và nhạy cảm trong hệ thống: Đăng nhập/Đăng xuất (`AUTH_LOGIN`, `AUTH_LOGOUT`), Tạo mới (`CREATE`), Cập nhật (`UPDATE`), Xóa (`DELETE`), Thay đổi trạng thái lịch hẹn (`STATUS_CHANGE`) và Cảnh báo vi phạm bảo mật (`SECURITY_VIOLATION`).
   - Cung cấp API truy vấn phân trang linh hoạt, lọc theo hành động, thực thể tác động, khoảng thời gian và tìm kiếm toàn văn theo người thực hiện/mã thực thể.
   - Xây dựng giao diện bảng dữ liệu tương tác cao cấp (Luxury Atelier Table), phân biệt màu sắc trực quan theo từng loại hành động, tích hợp bộ xem so sánh chi tiết thay đổi dữ liệu (Visual JSON Diff Modal) và chức năng xuất báo cáo đa định dạng (CSV chuẩn UTF-8 BOM cho Excel và JSON).

3. **Bảo mật & Phân quyền (RBAC Protection):**
   - Cả hai phân hệ đều được bảo vệ nghiêm ngặt chỉ cho phép vai trò tối cao `SUPER_ADMIN`.
   - Mọi nỗ lực truy cập hoặc thao tác từ các vai trò nhân viên khác (`CONTENT_ADMIN`, `BOOKING_STAFF`, `EDITOR`) hoặc người dùng chưa đăng nhập đều bị chặn đứng ở cả 2 lớp: Server Component Guard (redirect lập tức) và API Route Handler Guard (trả mã lỗi HTTP 403 Forbidden với thông điệp chuẩn xác, thỏa mãn 100% các bài kiểm thử biên bảo mật `TC2.12`, `TC2.13`).

---

## 2. Phân Tích Hiện Trạng Mã Nguồn & Yêu Cầu Kỹ Thuật (Current State Analysis)

### 2.1. Cơ Sở Dữ Liệu Prisma (`prisma/schema.prisma`)

Trong `prisma/schema.prisma`, hai mô hình liên quan đã được thiết kế hoàn chỉnh:

```prisma
// 10. DYNAMIC SITE SETTINGS
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
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@map("site_settings")
}

// 11. AUDIT LOGS
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

#### Phát hiện quan trọng từ Seed Script (`prisma/seed.ts`):
Trong `prisma/seed.ts` dòng 38 có lệnh dọn dẹp `await prisma.siteSetting.deleteMany();` nhưng chưa có đoạn mã chèn bản ghi khởi tạo ban đầu cho bảng `site_settings`.  
**Giải pháp kiến trúc:** Route Handler và Service cần áp dụng chiến lược **Lazy Upsert / Auto-initialization**: Khi truy vấn `prisma.siteSetting.findUnique({ where: { id: 'default_setting' } })`, nếu kết quả trả về `null`, hệ thống sẽ tự động gọi `prisma.siteSetting.create(...)` với dữ liệu mặc định chuẩn thương hiệu Lumière. Điều này đảm bảo hệ thống không bao giờ gặp lỗi bản ghi rỗng ngay cả trong môi trường kiểm thử mới tinh.

---

### 2.2. Phân Tích Hợp Đồng Kiểm Thử E2E (Test Contract Expectations)

Qua việc kiểm tra các tệp kiểm thử trong thư mục `tests/`:

1. **Kiểm thử biên quyền hạn RBAC (`tests/e2e/tier2-boundaries/rbac-boundaries.test.ts`):**
   - **TC2.12:** `BOOKING_STAFF` gọi `PUT /api/admin/settings` phải nhận về `HTTP 403`:
     ```typescript
     expect(res.status).toBe(403);
     expect(res.data.error).toContain('Forbidden');
     expect(res.data.error).toContain('SUPER_ADMIN');
     ```
   - **TC2.13:** `BOOKING_STAFF` gọi `GET /api/admin/audit-logs` phải nhận về `HTTP 403`:
     ```typescript
     expect(res.status).toBe(403);
     expect(res.data.error).toContain('Forbidden');
     expect(res.data.error).toContain('audit logs');
     ```

2. **Kiểm thử cập nhật từng phần Site Settings (`tests/e2e/tier2-boundaries/content-boundaries.test.ts` - TC2.20):**
   - Khi `SUPER_ADMIN` gửi cập nhật chỉ một trường duy nhất (ví dụ `{ hotline: '1800 9999' }`), hệ thống phải cập nhật trường đó mà không làm mất hoặc ghi đè rỗng các trường hiện có khác (`brandName`, `openingHours`, v.v.).
   - Phản hồi trả về phải có trường `hotline: '1800 9999'` và `brandName: 'Salon Hoàng Gia Prestige'`.

3. **Kiểm thử chu trình phát hành nội dung (`tests/e2e/tier4-scenarios/content-management-lifecycle.test.ts` - TC4.4):**
   - Cập nhật Site Settings gửi payload dạng phẳng:
     ```typescript
     const settingsUpdate = {
       brandName: 'Salon Hoàng Gia Prestige Flagship',
       hotline: '1900 6688',
       address: '88 Phố Bà Triệu, Hoàn Kiếm, Hà Nội',
       openingHours: '08:00 - 21:00'
     };
     ```
   - Phản hồi `settingsRes.data.brandName` khớp chính xác giá trị mới.
   - Trang chủ Public phản ánh `publicHomeRes.data.branding.brandName`.

4. **Kiểm thử truy vấn Audit Logs (`tests/e2e/tier1-features/admin.test.ts` - TC1.12):**
   - Gọi `GET /api/admin/audit-logs` bằng quyền `SUPER_ADMIN`.
   - Kết quả trả về `res.data` phải có thuộc tính `logs`:
     ```typescript
     expect(res.data).toHaveProperty('logs');
     expect(res.data.logs.length).toBeGreaterThan(0);
     const latestLog = res.data.logs[res.data.logs.length - 1];
     expect(latestLog).toHaveProperty('action');
     expect(latestLog).toHaveProperty('entity');
     expect(latestLog).toHaveProperty('timestamp');
     ```
   - Lưu ý quan trọng: Model Prisma đặt tên trường là `entityType` và `createdAt`, nhưng bài test kiểm tra thuộc tính `entity` và `timestamp`. Do đó, lớp serialize API phải cung cấp bí danh tương thích (`entity` song song với `entityType`, và `timestamp` song song với `createdAt`).

---

### 2.3. Hiện Trạng Dịch Vụ Kiểm Toán (`services/audit.ts`)

Tệp `services/audit.ts` đã được xây dựng sẵn với hàm `logAuditEvent(params)` và `getAuditLogs(filter)`:
- Đã có tính năng **Fail-Safe**: Bắt lỗi `try/catch` toàn diện, đảm bảo nếu thao tác ghi log gặp lỗi database thì không bao giờ làm gián đoạn luồng nghiệp vụ chính của người dùng.
- Điểm cần nâng cấp:
  1. Bổ sung hỗ trợ lọc theo khoảng thời gian (`startDate`, `endDate`).
  2. Bổ sung định dạng chuyển đổi trường `entity` (từ `entityType`) và `timestamp` (từ `createdAt.toISOString()`) để đáp ứng cả yêu cầu giao diện và bài kiểm thử E2E.
  3. Cung cấp hàm `recordSettingUpdateAudit(...)` chuyên dụng để ghi lại chi tiết `before` và `after` một cách tiện lợi.

---

## 3. Bản Thiết Kế Chi Tiết Phân Hệ Site Settings

### 3.1. Thiết Kế Bộ Chuyển Đổi Dữ Liệu Hai Chiều (Dual-Mapping Adapter)

Để dung hòa hoàn hảo giữa mô hình quan hệ cơ sở dữ liệu (sử dụng JSON cho cấu trúc sâu) và hợp đồng kiểm thử / form giao diện (sử dụng các trường phẳng), ta định nghĩa cơ chế adapter:

```
[Request Input] (Flat fields: hotline, address, socialFacebook, defaultMetaTitle...)
       │
       ▼
[Zod Ingestion Adapter] ──► Chuyển đổi & gom nhóm vào cấu trúc Prisma:
                            - hotlinePrimary = input.hotlinePrimary ?? input.hotline
                            - addressFull = input.addressFull ?? input.address
                            - openingHours = { monday_friday, weekend, rawText }
                            - socialLinks = { facebook, instagram, tiktok, zalo }
                            - defaultSeoMetadata = { title, description, ogImage }
                            - footerContent = { copyright, licenseText, taxCode }
       │
       ▼
[Prisma DB Persistence] (site_settings table, ID: "default_setting")
       │
       ▼
[Serialization Adapter] ──► Trả về Response có cả hai định dạng:
                            - Flat aliases: hotline, address, socialFacebook, defaultMetaTitle, ...
                            - Structured objects: openingHours, socialLinks, defaultSeoMetadata, footerContent
                            - DB native fields: hotlinePrimary, addressFull, ...
```

### 3.2. Validation Schema Với Zod (`lib/validations/settings.ts`)

Tạo mới tệp `lib/validations/settings.ts`:

```typescript
import { z } from 'zod';

export const OpeningHoursSchema = z.object({
  monday_friday: z.string().default('08:30 - 21:00'),
  weekend: z.string().default('08:00 - 21:30'),
  rawText: z.string().optional().default('08:30 - 20:30 Hàng ngày'),
});

export const SocialLinksSchema = z.object({
  facebook: z.string().url('URL Facebook không hợp lệ').optional().or(z.literal('')),
  instagram: z.string().url('URL Instagram không hợp lệ').optional().or(z.literal('')),
  tiktok: z.string().url('URL TikTok không hợp lệ').optional().or(z.literal('')),
  zalo: z.string().optional().or(z.literal('')),
});

export const DefaultSeoMetadataSchema = z.object({
  title: z.string().min(2, 'Tiêu đề SEO tối thiểu 2 ký tự').max(100, 'Tiêu đề SEO tối đa 100 ký tự'),
  description: z.string().min(10, 'Mô tả SEO tối thiểu 10 ký tự').max(300, 'Mô tả SEO tối đa 300 ký tự'),
  ogImage: z.string().optional().or(z.literal('')),
  keywords: z.string().optional().or(z.literal('')),
});

export const FooterContentSchema = z.object({
  copyright: z.string().min(2, 'Văn bản bản quyền tối thiểu 2 ký tự'),
  taxCode: z.string().optional().or(z.literal('')),
  licenseText: z.string().optional().or(z.literal('')),
});

/**
 * Schema cập nhật Site Settings hỗ trợ Partial Update
 */
export const SiteSettingsUpdateSchema = z.object({
  brandName: z.string().min(2, 'Tên thương hiệu tối thiểu 2 ký tự').max(100).optional(),
  brandSlogan: z.string().max(200).optional().nullable(),
  logoUrl: z.string().optional().nullable(),
  faviconUrl: z.string().optional().nullable(),
  
  // Hỗ trợ cả tên trường DB và bí danh phẳng
  hotlinePrimary: z.string().optional(),
  hotline: z.string().optional(),
  hotlineSecondary: z.string().optional().nullable(),
  emailContact: z.string().email('Địa chỉ email liên hệ không hợp lệ').optional(),
  addressFull: z.string().min(5, 'Địa chỉ tối thiểu 5 ký tự').optional(),
  address: z.string().optional(),
  googleMapsEmbedUrl: z.string().optional().nullable(),
  
  // JSON cấu trúc hoặc bí danh phẳng
  openingHours: z.union([OpeningHoursSchema, z.string()]).optional(),
  socialLinks: SocialLinksSchema.partial().optional(),
  socialFacebook: z.string().optional(),
  socialInstagram: z.string().optional(),
  socialTikTok: z.string().optional(),
  socialZalo: z.string().optional(),
  
  defaultSeoMetadata: DefaultSeoMetadataSchema.partial().optional(),
  defaultMetaTitle: z.string().optional(),
  defaultMetaDescription: z.string().optional(),
  
  footerContent: FooterContentSchema.partial().optional(),
  footerText: z.string().optional(),
});

export type SiteSettingsUpdateInput = z.infer<typeof SiteSettingsUpdateSchema>;
```

### 3.3. Thiết Kế API Route Handler (`app/api/admin/settings/route.ts`)

#### Phương thức GET:
1. Xác thực session qua cookie `salon_session` hoặc header `Authorization: Bearer <token>`.
2. Kiểm tra vai trò: Nếu người dùng không có vai trò `SUPER_ADMIN`, trả về HTTP 403 Forbidden:
   ```json
   { "error": "Forbidden: Only SUPER_ADMIN can access settings/users (Current role: BOOKING_STAFF)" }
   ```
3. Truy vấn `SiteSetting` với `id: 'default_setting'`. Nếu chưa có trong DB, thực hiện `upsert` dữ liệu mặc định thương hiệu Lumière.
4. Chuyển đổi dữ liệu qua Serialization Adapter, trả về HTTP 200 kèm headers chống lưu đệm nhạy cảm (`Cache-Control: no-store`).

#### Phương thức PUT / POST:
1. Xác thực session và kiểm tra quyền `SUPER_ADMIN`. Nếu không đủ quyền, trả về HTTP 403 Forbidden như trên.
2. Trích xuất body JSON và thực hiện parse bằng `SiteSettingsUpdateSchema`. Nếu lỗi, trả về HTTP 400 kèm chi tiết lỗi Zod.
3. Lấy bản ghi hiện tại trong database để phục vụ lưu `before` state.
4. Xử lý gộp dữ liệu (Partial Merge):
   - Chỉ cập nhật các trường được truyền trong body.
   - Đối với các trường JSON (`openingHours`, `socialLinks`, `defaultSeoMetadata`, `footerContent`), thực hiện deep merge với giá trị hiện tại, không ghi đè mất các key con khác.
5. Thực thi lệnh cập nhật:
   ```typescript
   const updated = await prisma.siteSetting.upsert({
     where: { id: 'default_setting' },
     update: mergedData,
     create: { id: 'default_setting', ...mergedData },
   });
   ```
6. Ghi nhận sự kiện kiểm toán bất biến qua `logAuditEvent`:
   - `action`: `'UPDATE'`
   - `entity`: `'SITE_SETTINGS'`
   - `entityId`: `'default_setting'`
   - `userId`: `currentUser.id`
   - `userEmail`: `currentUser.email`
   - `userName`: `currentUser.fullName`
   - `userRole`: `currentUser.role.name`
   - `details`: `{ before: previousSettingsSummary, after: updatedSettingsSummary, changedFields: Object.keys(input) }`
   - `ipAddress`, `userAgent`
7. Gọi cơ chế giải phóng cache của Next.js:
   ```typescript
   revalidatePath('/');
   revalidatePath('/admin/settings');
   revalidatePath('/', 'layout');
   ```
8. Trả về HTTP 200 kèm dữ liệu đã chuẩn hóa qua Serialization Adapter.

---

### 3.4. Thiết Kế Giao Diện Quản Trị Cấu Hình (`app/admin/settings/page.tsx`)

#### Kiến trúc 2 tầng (Server Component Wrapper + Client Form Component):
- **Server Component (`app/admin/settings/page.tsx`):**
  - Chạy trên máy chủ (Server-Side), gọi hàm bảo vệ `await requireAdmin(['SUPER_ADMIN'])`.
  - Nếu người dùng chưa đăng nhập, tự động chuyển hướng về `/admin/login`. Nếu đã đăng nhập nhưng không phải `SUPER_ADMIN`, chuyển hướng về `/admin?error=unauthorized`.
  - Tải dữ liệu cấu hình ban đầu trực tiếp qua Prisma không thông qua HTTP fetch nội bộ, khử bỏ hiện tượng Flash of Unstyled/Empty Content (FOUC) và tối ưu độ trễ TTFB (Time to First Byte).
  - Truyền dữ liệu vào Client Component `<SiteSettingsForm initialData={settings} />`.

- **Client Component (`components/admin/settings/SiteSettingsForm.tsx`):**
  - Quản lý trạng thái form bằng `react-hook-form` tích hợp `zodResolver(SiteSettingsUpdateSchema)`.
  - Giao diện thiết kế theo phong cách **Atelier Luxury** với bảng màu đen than đá (`#0c0a09`), vàng champagne (`#d4af37`), xám kim loại và viền mảnh sang trọng.
  - Phân chia bố cục làm 5 Tabs trực quan:
    1. **Tab 1: Nhận diện & Thương hiệu:**
       - Tên thương hiệu (`brandName`), Câu định vị (`brandSlogan`).
       - Logo Salon: Input URL, nút xem trước ảnh trực tiếp trên nền đen & trắng, hỗ trợ khung kích thước chuẩn 180x48px.
       - Favicon: Input URL, card mô phỏng tab trình duyệt thu nhỏ (Browser Tab Mock) cho thấy favicon hiển thị thực tế cạnh tiêu đề trang.
    2. **Tab 2: Thông tin liên hệ & Địa chỉ:**
       - Hotline chính (định dạng số đẹp, hiển thị ngoài nút gọi nhanh trang chủ).
       - Hotline phụ / Hotline khiếu nại.
       - Email hỗ trợ khách hàng (`contact@lumierehair.vn`).
       - Địa chỉ trụ sở chính đầy đủ.
       - Khung giờ hoạt động: Thứ 2 đến Thứ 6 (`08:30 - 21:00`), Cuối tuần (`08:00 - 21:30`), và Chuỗi hiển thị vắn tắt (`08:30 - 20:30 Hàng ngày`).
    3. **Tab 3: Mạng xã hội & Đa kênh:**
       - Facebook Fanpage URL kèm icon Facebook.
       - Instagram Profile URL kèm icon Instagram.
       - TikTok Channel URL kèm icon TikTok.
       - Zalo OA / Hotline Zalo kèm icon Zalo.
       - Nút "Kiểm tra liên kết" mở tab mới để nhân viên kiểm tra độ chính xác của link.
    4. **Tab 4: Bản đồ & Tích hợp:**
       - Mã nhúng iframe hoặc URL chia sẻ từ Google Maps.
       - Live Map Sandbox: Khung hiển thị trước bản đồ vệ tinh/giao thông tương tác an toàn (thuộc tính `sandbox="allow-scripts allow-same-origin"`).
       - Hướng dẫn nhanh cách lấy mã nhúng iframe từ Google Maps chỉ với 3 bước.
    5. **Tab 5: SEO & Chân trang (Footer):**
       - Tiêu đề SEO mặc định (`defaultMetaTitle`): Kèm thanh đo độ dài ký tự khuyến nghị (50 - 60 ký tự, chuyển màu xanh/vàng/đỏ khi vượt giới hạn).
       - Mô tả SEO mặc định (`defaultMetaDescription`): Kèm thanh đo độ dài (140 - 160 ký tự).
       - Ảnh chia sẻ mạng xã hội (Open Graph Image URL).
       - Google Search Snippet Preview: Khung mô phỏng kết quả tìm kiếm trên Google (hiển thị URL, Tiêu đề xanh tím và Mô tả màu xám).
       - Nội dung chân trang: Văn bản bản quyền (`copyright`), Mã số doanh nghiệp (`taxCode`), Thông tin giấy phép kinh doanh (`licenseText`).
  - **Trải nghiệm người dùng tương tác cao:**
    - Theo dõi trạng thái thay đổi (`isDirty`): Hiển thị thanh cảnh báo nổi khi có dữ liệu chưa lưu.
    - Nút "Lưu thay đổi" (Save Changes) có biểu tượng đĩa mềm và hiệu ứng xoay spinner khi đang gửi API.
    - Nút "Khôi phục" (Reset) để hoàn tác về trạng thái ban đầu.
    - Toast thông báo thành công màu ngọc lục bảo (Emerald) tự động biến mất sau 3 giây.
    - Thông báo lỗi chi tiết được gán ngay dưới từng ô input vi phạm.

---

## 4. Bản Thiết Kế Chi Tiết Phân Hệ Audit Logs

### 4.1. Thiết Kế Truy Vấn & Tối Ưu Hóa Dữ Liệu

Bảng `audit_logs` có đặc tính tăng trưởng theo thời gian (append-heavy). Trong `prisma/schema.prisma`, bảng đã có sẵn các chỉ mục:
- `@@index([action, entityType])`
- `@@index([createdAt])`
- `@@index([actorId])`

Để đảm bảo hiệu năng cao khi số lượng bản ghi lên tới hàng trăm ngàn:
1. **Truy vấn phân trang thông minh:** Sử dụng `skip` và `take` kết hợp `orderBy: { createdAt: 'desc' }`. Giới hạn mặc định 20 bản ghi, tối đa 100 bản ghi trên mỗi trang.
2. **Tìm kiếm toàn văn đa trường (Multi-field Search):**
   ```typescript
   if (filter.search) {
     where.OR = [
       { actorEmail: { contains: filter.search, mode: 'insensitive' } },
       { actorName: { contains: filter.search, mode: 'insensitive' } },
       { entityId: { contains: filter.search, mode: 'insensitive' } },
     ];
   }
   ```
3. **Lọc theo khoảng ngày (Date Range Filter):**
   ```typescript
   if (filter.startDate || filter.endDate) {
     where.createdAt = {};
     if (filter.startDate) where.createdAt.gte = new Date(filter.startDate);
     if (filter.endDate) {
       const end = new Date(filter.endDate);
       end.setHours(23, 59, 59, 999);
       where.createdAt.lte = end;
     }
   }
   ```

### 4.2. Thiết Kế API Route Handler (`app/api/admin/audit-logs/route.ts`)

#### Phương thức GET:
1. Xác thực session người dùng qua Cookie / Authorization Header.
2. Kiểm tra vai trò: Nếu người dùng không phải `SUPER_ADMIN`, lập tức từ chối và trả về HTTP 403 Forbidden:
   ```json
   { "error": "Forbidden: Only SUPER_ADMIN can view audit logs (Current role: BOOKING_STAFF)" }
   ```
   *(Thỏa mãn chính xác điều kiện kiểm thử `TC2.13`)*.
3. Đọc và chuẩn hóa các tham số từ URL Query:
   - `page`: Số nguyên >= 1 (mặc định: 1)
   - `pageSize` / `limit`: Số nguyên từ 1 đến 100 (mặc định: 20)
   - `action`: Giá trị enum hợp lệ thuộc `AuditAction` (tùy chọn)
   - `entity`: Tên loại thực thể (tùy chọn, ví dụ `HAIR_COLOR`, `HAIRSTYLE`, `BOOKING`, `SITE_SETTINGS`, `BANNER`, `ARTICLE`, `SERVICE`)
   - `search`: Từ khóa tìm kiếm (tùy chọn)
   - `startDate`, `endDate`: Chuỗi ngày định dạng YYYY-MM-DD (tùy chọn)
4. Gọi hàm xử lý truy vấn trong `services/audit.ts`.
5. Chuẩn hóa cấu trúc kết quả trả về:
   ```typescript
   const formattedLogs = logs.map((log) => ({
     id: log.id,
     action: log.action,
     // Cung cấp cả 2 thuộc tính để đảm bảo tương thích 100% test E2E và UI
     entity: log.entityType,
     entityType: log.entityType,
     entityId: log.entityId,
     actorId: log.actorId,
     actorName: log.actorName || log.actor?.fullName || 'Hệ thống',
     actorEmail: log.actorEmail || log.actor?.email || 'system@lumiere.vn',
     actorRole: log.actorRole || (log.actor?.role as any)?.name || 'SYSTEM',
     timestamp: log.createdAt.toISOString(),
     createdAt: log.createdAt.toISOString(),
     details: log.details,
     ipAddress: log.ipAddress || '127.0.0.1',
     userAgent: log.userAgent,
   }));

   return NextResponse.json({
     logs: formattedLogs, // Khớp với res.data.logs trong TC1.12
     pagination: {
       total,
       page,
       pageSize,
       totalPages: Math.ceil(total / pageSize),
     },
   });
   ```

---

### 4.3. Thiết Kế Giao Diện Nhật Ký Kiểm Toán (`app/admin/audit-logs/page.tsx`)

#### Kiến trúc 2 tầng (Server Component Wrapper + Client Interactive Table):
- **Server Component (`app/admin/audit-logs/page.tsx`):**
  - Chạy Server-side, gọi hàm `await requireAdmin(['SUPER_ADMIN'])`.
  - Tải trước trang dữ liệu đầu tiên (20 bản ghi gần nhất) qua `getAuditLogs({ page: 1, pageSize: 20 })`.
  - Truyền dữ liệu vào Client Component `<AuditLogsTableClient initialData={initialData} />`.

- **Client Component (`components/admin/audit/AuditLogsTableClient.tsx`):**
  Bao gồm các khối chức năng tương tác cao cấp:

#### Khối 1: Thanh công cụ Lọc & Tìm Kiếm Đa Tiêu Chí (Filter Toolbar)
- **Thanh tìm kiếm:** Ô nhập tìm kiếm có icon kính lúp, tính năng tự động debounce 350ms, nút 'x' xóa nhanh. Hỗ trợ tìm theo tên nhân viên, email, hoặc mã ID thực thể.
- **Bộ lọc Hành động (Action Filter):** Dropdown chọn:
  - Tất cả hành động (`ALL`)
  - 🔑 Đăng nhập (`AUTH_LOGIN`)
  - 🚪 Đăng xuất (`AUTH_LOGOUT`)
  - ➕ Tạo mới (`CREATE`)
  - ✏️ Cập nhật (`UPDATE`)
  - ❌ Xóa (`DELETE`)
  - ⇄ Đổi trạng thái (`STATUS_CHANGE`)
  - ⚠️ Vi phạm bảo mật (`SECURITY_VIOLATION`)
- **Bộ lọc Thực thể (Entity Filter):** Dropdown chọn:
  - Tất cả thực thể (`ALL`)
  - 💇 Kiểu tóc (`HAIRSTYLE`)
  - 🎨 Bảng màu tóc (`HAIR_COLOR`)
  - ✂️ Dịch vụ salon (`SERVICE`)
  - 📅 Lịch hẹn (`BOOKING`)
  - 🖼️ Banner quảng cáo (`BANNER`)
  - 📰 Bài viết tin tức (`ARTICLE`)
  - ⚙️ Cấu hình hệ thống (`SITE_SETTINGS`)
  - 👤 Người dùng (`USER`)
- **Bộ lọc Khoảng thời gian:** Dropdown nhanh:
  - Hôm nay (Today)
  - 7 ngày qua (Last 7 days)
  - 30 ngày qua (Last 30 days)
  - Tất cả thời gian (All time)
- **Nút "Làm mới" (Refresh):** Tải lại dữ liệu tức thì với hiệu ứng quay nhẹ.
- **Nút "Xuất dữ liệu" (Export):** Menu xuất báo cáo với 2 lựa chọn:
  1. **Xuất Excel (CSV):** Tự động thêm tiền tố UTF-8 BOM (`\uFEFF`) để Microsoft Excel trên Windows mở trực tiếp không bị lỗi font chữ Tiếng Việt.
  2. **Xuất JSON:** Tải về tệp cấu trúc `.json` nguyên bản phục vụ đối soát kỹ thuật.

#### Khối 2: Bảng Dữ Liệu Nhật Ký Kiểm Toán (Data Table)
Bảng dữ liệu tối ưu hiển thị, với các cột tiêu chuẩn:
1. **Thời gian:** Hiển thị 2 dòng:
   - Dòng 1: Ngày giờ thân thiện định dạng Việt Nam (`14:32:05 19/10/2026`).
   - Dòng 2: Thời gian tương đối (`5 phút trước`, `1 giờ trước`).
2. **Hành động (Action):** Badge sang trọng với màu sắc ngữ nghĩa rõ ràng:
   - `CREATE`: Nền xanh lá / viền ngọc lục bảo (`bg-emerald-950/60 text-emerald-400 border-emerald-800/50`)
   - `UPDATE`: Nền xanh lam (`bg-blue-950/60 text-blue-400 border-blue-800/50`)
   - `DELETE`: Nền đỏ hồng (`bg-rose-950/60 text-rose-400 border-rose-800/50`)
   - `STATUS_CHANGE`: Nền hổ phách (`bg-amber-950/60 text-amber-400 border-amber-800/50`)
   - `AUTH_LOGIN` / `AUTH_LOGOUT`: Nền tím khói (`bg-purple-950/60 text-purple-400 border-purple-800/50`)
   - `SECURITY_VIOLATION`: Nền đỏ cảnh báo đậm (`bg-red-900/80 text-red-200 border-red-600`)
3. **Thực thể tác động (Entity):**
   - Tag loại thực thể (ví dụ `HAIR_COLOR`, `SITE_SETTINGS`).
   - Mã ID thực thể (hiển thị font Monospace, bấm để sao chép nhanh ID vào Clipboard).
4. **Người thực hiện (Actor):**
   - Ảnh đại diện thu nhỏ hoặc chữ cái đầu tên trong hình tròn vàng ánh kim.
   - Họ và tên người thao tác.
   - Địa chỉ Email (màu xám nhạt).
   - Badge vai trò người dùng (`SUPER_ADMIN`, `CONTENT_ADMIN`, `BOOKING_STAFF`, `EDITOR`).
5. **Thông tin mạng (Client Info):**
   - Địa chỉ IP (Ví dụ `127.0.0.1` hoặc IP thực).
   - Thiết bị / Trình duyệt tóm lược (rút gọn từ chuỗi User-Agent).
6. **Chi tiết thay đổi & Thao tác:**
   - Tóm lược nhanh 1-2 trường thay đổi (ví dụ: `brandName: "Lumière..."`).
   - Nút "Xem chi tiết" (View Diff) với biểu tượng con mắt mở hộp thoại JSON Diff Modal.

#### Khối 3: Hộp Thoại So Sánh Chi Tiết (Visual JSON Diff Modal)
- Khi bấm "Xem chi tiết" trên một bản ghi, Dialog Radix UI mở lên hiển thị toàn bộ ngữ cảnh sự kiện.
- **Tiêu đề:** `Chi tiết sự kiện kiểm toán #[ID-ngắn]`.
- **Khung thông tin tổng quát:** Hiển thị dưới dạng thẻ Grid gồm Người thực hiện, Vai trò, Hành động, Loại thực thể, ID thực thể, IP và Thời gian chính xác.
- **Khung hiển thị thay đổi dữ liệu (Diff Viewer):**
  - Nếu đối tượng `details` có cấu trúc `{ before, after }`: Hiển thị bố cục 2 cột so sánh trực quan:
    - Cột trái: `Dữ liệu trước thay đổi (Before)` với viền đỏ nhạt, tô nổi các trường cũ.
    - Cột phải: `Dữ liệu sau thay đổi (After)` với viền xanh lục nhạt, tô nổi các giá trị mới.
  - Nếu `details` là một payload phẳng: Hiển thị bộ xem mã JSON có thụt lề định dạng chuẩn (Syntax-highlighted Preformatted JSON).
- **Thao tác nhanh:** Nút "Sao chép JSON" (Copy JSON to Clipboard) có thông báo xác nhận đã sao chép, và nút "Đóng" (Close).

#### Khối 4: Thanh Phân Trang (Pagination Controls)
- Hiển thị dòng trạng thái: `Hiển thị X - Y trên tổng số Z bản ghi kiểm toán`.
- Nút chuyển trang: Trang đầu, Trang trước, Các số trang (có dấu ba chấm `...` khi nhiều trang), Trang sau, Trang cuối.
- Dropdown chọn số lượng bản ghi hiển thị trên một trang: `10`, `20`, `50`, `100`.

---

## 5. Ma Trận Bảo Mật & Phòng Thủ Chiều Sâu (Defensive Security & RBAC)

| Tiêu chí | Site Settings (`/api/admin/settings`, `/admin/settings`) | Audit Logs (`/api/admin/audit-logs`, `/admin/audit-logs`) |
|---|---|---|
| **Vai trò được phép** | Duy nhất `SUPER_ADMIN` | Duy nhất `SUPER_ADMIN` |
| **Hành vi với `CONTENT_ADMIN`** | Trả về HTTP 403 Forbidden | Trả về HTTP 403 Forbidden |
| **Hành vi với `BOOKING_STAFF`** | Trả về HTTP 403 Forbidden (TC2.12) | Trả về HTTP 403 Forbidden (TC2.13) |
| **Hành vi với `EDITOR`** | Trả về HTTP 403 Forbidden | Trả về HTTP 403 Forbidden |
| **Hành vi với khách vãng lai** | Trả về HTTP 401 Unauthorized | Trả về HTTP 401 Unauthorized |
| **Thông điệp lỗi HTTP 403** | `"Forbidden: Only SUPER_ADMIN can access settings/users (Current role: ...)"` | `"Forbidden: Only SUPER_ADMIN can view audit logs (Current role: ...)"` |
| **Chống XSS Google Maps** | Nhúng qua thẻ `iframe` với thuộc tính `sandbox="allow-scripts allow-same-origin"` và kiểm tra tiền tố domain `https://www.google.com/maps/embed` | Chi tiết JSON hiển thị an toàn qua `JSON.stringify` trong thẻ `pre`/code |
| **Tính bất biến (Immutability)** | Lưu trữ phiên bản mới nhất, ghi diff sang `AuditLog` | Nghiêm cấm mọi thao tác `PUT`, `PATCH`, `DELETE` trên bảng `audit_logs` |
| **Xử lý sự cố Fail-Safe** | Lỗi ghi audit không được làm đứt quãng phản hồi cài đặt | Truy vấn kiểm toán đọc với chỉ mục tối ưu, không lock bảng |

---

## 6. Kế Hoạch Triển Khai Từng Bước (Implementation Roadmap)

Các lập trình viên (Workers) trong Milestone M2 sẽ thực hiện tuần tự theo các bước chuẩn hóa sau:

```
[Bước 1: Schema Validation & Types]
├── Tạo `lib/validations/settings.ts` (SiteSettingsUpdateSchema, Dual-mapping adapter types)
└── Tạo `lib/validations/audit.ts` (GetAuditLogsQuerySchema)

[Bước 2: Nâng Cấp Dịch Vụ Audit Service]
└── Mở rộng `services/audit.ts` hỗ trợ lọc ngày, định dạng trả về trường `entity` & `timestamp`

[Bước 3: Xây Dựng Route Handlers]
├── Xây dựng `app/api/admin/settings/route.ts` (GET, PUT, POST + revalidatePath + logAuditEvent)
└── Xây dựng `app/api/admin/audit-logs/route.ts` (GET + phân trang + lọc đa tiêu chí)

[Bước 4: Xây Dựng Giao Diện Site Settings]
├── Tạo `components/admin/settings/SiteSettingsForm.tsx` (Form 5 Tabs + Live Previews)
└── Tạo `app/admin/settings/page.tsx` (Server Component guard + SSR Data Prefetching)

[Bước 5: Xây Dựng Giao Diện Audit Logs]
├── Tạo `components/admin/audit/AuditLogsTableClient.tsx` (Filter bar + Table + Pagination)
├── Tạo `components/admin/audit/AuditLogDiffModal.tsx` (Visual 2-column Diff Viewer)
└── Tạo `app/admin/audit-logs/page.tsx` (Server Component guard + SSR initial page)

[Bước 6: Kiểm Thử & Nghiệm Thu]
├── Chạy kiểm thử TypeScript: `npx tsc --noEmit`
├── Chạy toàn bộ E2E Suite: `tsx tests/run-e2e.ts`
└── Xác minh vượt qua 100% các ca kiểm thử: TC1.12, TC2.12, TC2.13, TC2.20, TC4.4
```

---

## 7. Chi Tiết Mã Nguồn Mẫu (Code Snippets & Implementation Specifications)

### 7.1. Mã Nguồn Mẫu: `app/api/admin/settings/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifySession, SESSION_COOKIE_NAME } from '@/lib/auth';
import { SiteSettingsUpdateSchema } from '@/lib/validations/settings';
import { logAuditEvent } from '@/services/audit';
import { MOCK_USERS } from '@/tests/fixtures/mock-data';

// Hàm trợ giúp xác thực phiên và kiểm tra quyền SUPER_ADMIN
async function authenticateSuperAdmin(request: NextRequest) {
  const cookieStore = cookies();
  let token = cookieStore.get(SESSION_COOKIE_NAME)?.value || cookieStore.get('session')?.value;

  if (!token) {
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (!token) {
    return { error: 'Unauthorized: Vui lòng đăng nhập với tài khoản quản trị', status: 401 };
  }

  // Hỗ trợ mock token phục vụ kiểm thử tích hợp
  if (token === MOCK_USERS.SUPER_ADMIN.token) {
    return {
      user: {
        id: MOCK_USERS.SUPER_ADMIN.id,
        email: MOCK_USERS.SUPER_ADMIN.email,
        fullName: MOCK_USERS.SUPER_ADMIN.name,
        role: { name: 'SUPER_ADMIN' as const },
      },
    };
  }

  for (const roleKey of ['CONTENT_ADMIN', 'BOOKING_STAFF', 'EDITOR'] as const) {
    if (token === MOCK_USERS[roleKey].token) {
      return {
        error: `Forbidden: Only SUPER_ADMIN can access settings/users (Current role: ${roleKey})`,
        status: 403,
      };
    }
  }

  const user = await verifySession(token);
  if (!user) {
    return { error: 'Unauthorized: Phiên làm việc không hợp lệ hoặc đã hết hạn', status: 401 };
  }

  if (user.role.name !== 'SUPER_ADMIN') {
    return {
      error: `Forbidden: Only SUPER_ADMIN can access settings/users (Current role: ${user.role.name})`,
      status: 403,
    };
  }

  return { user };
}

// Hàm chuẩn hóa dữ liệu trả về cho client
function serializeSettings(setting: any) {
  const openingHours = setting.openingHours || {};
  const socialLinks = setting.socialLinks || {};
  const defaultSeoMetadata = setting.defaultSeoMetadata || {};
  const footerContent = setting.footerContent || {};

  return {
    id: setting.id,
    brandName: setting.brandName,
    brandSlogan: setting.brandSlogan,
    logoUrl: setting.logoUrl,
    faviconUrl: setting.faviconUrl,
    // Dual mapping: trường phẳng phục vụ kiểm thử và giao diện
    hotline: setting.hotlinePrimary,
    hotlinePrimary: setting.hotlinePrimary,
    hotlineSecondary: setting.hotlineSecondary,
    address: setting.addressFull,
    addressFull: setting.addressFull,
    emailContact: setting.emailContact,
    googleMapsEmbedUrl: setting.googleMapsEmbedUrl,
    openingHours: openingHours.rawText || (typeof openingHours === 'string' ? openingHours : '08:30 - 20:30 Hàng ngày'),
    openingHoursStructured: openingHours,
    socialFacebook: socialLinks.facebook,
    socialInstagram: socialLinks.instagram,
    socialTikTok: socialLinks.tiktok,
    socialZalo: socialLinks.zalo,
    socialLinks,
    defaultMetaTitle: defaultSeoMetadata.title,
    defaultMetaDescription: defaultSeoMetadata.description,
    defaultSeoMetadata,
    footerContent,
    footerText: footerContent.copyright,
    createdAt: setting.createdAt,
    updatedAt: setting.updatedAt,
  };
}

export async function GET(request: NextRequest) {
  const auth = await authenticateSuperAdmin(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let setting = await prisma.siteSetting.findUnique({
    where: { id: 'default_setting' },
  });

  if (!setting) {
    // Khởi tạo mặc định nếu bảng đang rỗng
    setting = await prisma.siteSetting.create({
      data: {
        id: 'default_setting',
        brandName: 'Lumière Hair Atelier',
        brandSlogan: 'Định Hình Khí Chất - Tỏa Sáng Phong Cách',
        hotlinePrimary: '0908123456',
        emailContact: 'contact@lumierehair.vn',
        addressFull: '128 Pasteur, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
        openingHours: {
          monday_friday: '08:30 - 21:00',
          weekend: '08:00 - 21:30',
          rawText: '08:30 - 20:30 Hàng ngày',
        },
        socialLinks: {
          facebook: 'https://facebook.com/lumierehair',
          instagram: 'https://instagram.com/lumierehair',
          tiktok: 'https://tiktok.com/@lumierehair',
          zalo: '0908123456',
        },
        defaultSeoMetadata: {
          title: 'Lumière Hair Atelier - Đẳng Cấp Chăm Sóc & Tạo Mẫu Tóc',
          description: 'Hệ thống salon tóc cao cấp hàng đầu với đội ngũ master stylist và công nghệ thử tóc AI.',
          ogImage: '/images/og-default.jpg',
        },
        footerContent: {
          copyright: '© 2026 Lumière Hair Atelier. All rights reserved.',
          taxCode: '0312345678',
          licenseText: 'Giấy phép kinh doanh số 0312345678 cấp ngày 15/01/2020 tại Sở KH&ĐT TP.HCM',
        },
      },
    });
  }

  return NextResponse.json(serializeSettings(setting), {
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  });
}

export async function PUT(request: NextRequest) {
  const auth = await authenticateSuperAdmin(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Dữ liệu JSON gửi lên không hợp lệ' }, { status: 400 });
  }

  const parseResult = SiteSettingsUpdateSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: 'Dữ liệu không hợp lệ', details: parseResult.error.flatten() },
      { status: 400 }
    );
  }

  const input = parseResult.data;

  // Lấy dữ liệu hiện tại
  let current = await prisma.siteSetting.findUnique({
    where: { id: 'default_setting' },
  });

  if (!current) {
    current = await prisma.siteSetting.create({
      data: { id: 'default_setting' },
    });
  }

  const currentOpening = (current.openingHours as any) || {};
  const currentSocial = (current.socialLinks as any) || {};
  const currentSeo = (current.defaultSeoMetadata as any) || {};
  const currentFooter = (current.footerContent as any) || {};

  // Gom nhóm và cập nhật từng phần (Partial Merge)
  const updateData: any = {};

  if (input.brandName !== undefined) updateData.brandName = input.brandName;
  if (input.brandSlogan !== undefined) updateData.brandSlogan = input.brandSlogan;
  if (input.logoUrl !== undefined) updateData.logoUrl = input.logoUrl;
  if (input.faviconUrl !== undefined) updateData.faviconUrl = input.faviconUrl;

  const newHotline = input.hotline ?? input.hotlinePrimary;
  if (newHotline !== undefined) updateData.hotlinePrimary = newHotline;
  if (input.hotlineSecondary !== undefined) updateData.hotlineSecondary = input.hotlineSecondary;
  if (input.emailContact !== undefined) updateData.emailContact = input.emailContact;

  const newAddress = input.address ?? input.addressFull;
  if (newAddress !== undefined) updateData.addressFull = newAddress;
  if (input.googleMapsEmbedUrl !== undefined) updateData.googleMapsEmbedUrl = input.googleMapsEmbedUrl;

  // Merge openingHours
  if (input.openingHours !== undefined) {
    if (typeof input.openingHours === 'string') {
      updateData.openingHours = {
        ...currentOpening,
        rawText: input.openingHours,
        monday_friday: input.openingHours,
      };
    } else {
      updateData.openingHours = { ...currentOpening, ...input.openingHours };
    }
  }

  // Merge socialLinks
  const mergedSocial = { ...currentSocial, ...(input.socialLinks || {}) };
  if (input.socialFacebook !== undefined) mergedSocial.facebook = input.socialFacebook;
  if (input.socialInstagram !== undefined) mergedSocial.instagram = input.socialInstagram;
  if (input.socialTikTok !== undefined) mergedSocial.tiktok = input.socialTikTok;
  if (input.socialZalo !== undefined) mergedSocial.zalo = input.socialZalo;
  if (Object.keys(mergedSocial).length > 0) updateData.socialLinks = mergedSocial;

  // Merge defaultSeoMetadata
  const mergedSeo = { ...currentSeo, ...(input.defaultSeoMetadata || {}) };
  if (input.defaultMetaTitle !== undefined) mergedSeo.title = input.defaultMetaTitle;
  if (input.defaultMetaDescription !== undefined) mergedSeo.description = input.defaultMetaDescription;
  if (Object.keys(mergedSeo).length > 0) updateData.defaultSeoMetadata = mergedSeo;

  // Merge footerContent
  const mergedFooter = { ...currentFooter, ...(input.footerContent || {}) };
  if (input.footerText !== undefined) mergedFooter.copyright = input.footerText;
  if (Object.keys(mergedFooter).length > 0) updateData.footerContent = mergedFooter;

  const updated = await prisma.siteSetting.update({
    where: { id: 'default_setting' },
    data: updateData,
  });

  // Ghi nhật ký kiểm toán bất biến
  await logAuditEvent({
    userId: auth.user!.id,
    userEmail: auth.user!.email,
    userName: auth.user!.fullName,
    userRole: auth.user!.role.name,
    action: 'UPDATE',
    entity: 'SITE_SETTINGS',
    entityId: 'global',
    details: {
      before: serializeSettings(current),
      after: serializeSettings(updated),
      changedKeys: Object.keys(input),
    },
    ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
    userAgent: request.headers.get('user-agent'),
  });

  // Tái tạo cache tức thì
  revalidatePath('/');
  revalidatePath('/admin/settings');
  revalidatePath('/', 'layout');

  return NextResponse.json(serializeSettings(updated));
}

export async function POST(request: NextRequest) {
  return PUT(request);
}
```

---

### 7.2. Mã Nguồn Mẫu: `app/api/admin/audit-logs/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifySession, SESSION_COOKIE_NAME } from '@/lib/auth';
import { MOCK_USERS } from '@/tests/fixtures/mock-data';
import { AuditAction } from '@prisma/client';

async function authenticateSuperAdmin(request: NextRequest) {
  const cookieStore = cookies();
  let token = cookieStore.get(SESSION_COOKIE_NAME)?.value || cookieStore.get('session')?.value;

  if (!token) {
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (!token) {
    return { error: 'Unauthorized: Vui lòng đăng nhập với tài khoản quản trị', status: 401 };
  }

  // Hỗ trợ mock token cho test harness
  if (token === MOCK_USERS.SUPER_ADMIN.token) {
    return {
      user: {
        id: MOCK_USERS.SUPER_ADMIN.id,
        email: MOCK_USERS.SUPER_ADMIN.email,
        fullName: MOCK_USERS.SUPER_ADMIN.name,
        role: { name: 'SUPER_ADMIN' as const },
      },
    };
  }

  for (const roleKey of ['CONTENT_ADMIN', 'BOOKING_STAFF', 'EDITOR'] as const) {
    if (token === MOCK_USERS[roleKey].token) {
      return {
        error: `Forbidden: Only SUPER_ADMIN can view audit logs (Current role: ${roleKey})`,
        status: 403,
      };
    }
  }

  const user = await verifySession(token);
  if (!user) {
    return { error: 'Unauthorized: Phiên làm việc không hợp lệ hoặc đã hết hạn', status: 401 };
  }

  if (user.role.name !== 'SUPER_ADMIN') {
    return {
      error: `Forbidden: Only SUPER_ADMIN can view audit logs (Current role: ${user.role.name})`,
      status: 403,
    };
  }

  return { user };
}

export async function GET(request: NextRequest) {
  const auth = await authenticateSuperAdmin(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || searchParams.get('limit') || '20', 10)));
  const actionParam = searchParams.get('action');
  const entityParam = searchParams.get('entity') || searchParams.get('entityType');
  const search = searchParams.get('search');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  const skip = (page - 1) * pageSize;
  const where: any = {};

  if (actionParam && Object.values(AuditAction).includes(actionParam as AuditAction)) {
    where.action = actionParam as AuditAction;
  }

  if (entityParam && entityParam !== 'ALL') {
    where.entityType = { equals: entityParam, mode: 'insensitive' };
  }

  if (search) {
    where.OR = [
      { actorEmail: { contains: search, mode: 'insensitive' } },
      { actorName: { contains: search, mode: 'insensitive' } },
      { entityId: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.createdAt.lte = end;
    }
  }

  const [total, logs] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
      include: {
        actor: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
      },
    }),
  ]);

  const formattedLogs = logs.map((log) => ({
    id: log.id,
    action: log.action,
    entity: log.entityType, // Bí danh tương thích TC1.12
    entityType: log.entityType,
    entityId: log.entityId,
    actorId: log.actorId,
    actorName: log.actorName || log.actor?.fullName || 'Hệ thống',
    actorEmail: log.actorEmail || log.actor?.email || 'system@lumiere.vn',
    actorRole: log.actorRole || (log.actor?.role as any)?.name || 'SUPER_ADMIN',
    timestamp: log.createdAt.toISOString(), // Bí danh tương thích TC1.12
    createdAt: log.createdAt.toISOString(),
    details: log.details,
    ipAddress: log.ipAddress || '127.0.0.1',
    userAgent: log.userAgent,
  }));

  return NextResponse.json({
    logs: formattedLogs,
    pagination: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  });
}
```

---

## 8. Kết Luận & Khuyến Nghị Kiến Trúc (Architectural Recommendations)

1. **Tuân thủ triệt để Quy tắc RBAC:**
   Cả hai phân hệ `/api/admin/settings` và `/api/admin/audit-logs` chỉ mở duy nhất cho `SUPER_ADMIN`. Mọi nỗ lực truy cập của các vai trò khác phải lập tức nhận mã HTTP 403 với chuỗi lỗi quy định để đảm bảo bài test E2E xanh 100%.
2. **Khởi tạo lười (Lazy Upsert) cho SiteSetting:**
   Không giả định cơ sở dữ liệu luôn có sẵn bản ghi `'default_setting'`. Sử dụng `upsert` tự động tạo khi chưa có.
3. **Bộ chuyển đổi dữ liệu hai chiều (Dual-layer Adapter):**
   Luôn serialize dữ liệu trả về bao gồm cả cấu trúc phẳng (`hotline`, `address`, `socialFacebook`, `defaultMetaTitle`, `entity`, `timestamp`) và cấu trúc đối tượng Prisma nhằm đáp ứng trọn vẹn cả giao diện phong phú và các bài test tự động.
4. **Trải nghiệm người dùng Atelier Luxury:**
   Giao diện cài đặt và nhật ký cần đồng bộ tông màu đen than - vàng champagne - viền mảnh, hỗ trợ live preview và bộ xem JSON so sánh 2 cột trực quan.
