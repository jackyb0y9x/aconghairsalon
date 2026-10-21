# BẢN THIẾT KẾ KIẾN TRÚC & BLUEPRINT TRIỂN KHAI PHÂN HỆ QUẢN LÝ NỘI DUNG (CONTENT CATALOG)
**Dự án:** Lumière Hair Atelier - Luxury Hair Salon Web Application  
**Milestone:** M3 (Content Catalog: Banners, Categories, Hairstyles, Hair Colors)  
**Tác giả:** M3 Explorer 1 (Content Catalog Specialist)  
**Ngày lập:** 2026-10-19  

---

## 1. TỔNG QUAN VÀ MỤC TIÊU THIẾT KẾ (EXECUTIVE SUMMARY)

Bản thiết kế này cung cấp đặc tả kỹ thuật chi tiết, sẵn sàng triển khai (code-ready) cho 4 phân hệ cốt lõi thuộc Content Catalog trong Website Quản trị (Admin CMS):
1. **Banner Trang Chủ (`/admin/banners`)**: Quản lý hero banners, thứ tự hiển thị, liên kết CTA, huy hiệu ưu đãi, trạng thái kích hoạt và khoảng thời gian áp dụng.
2. **Danh Mục Taxonomy (`/admin/categories`)**: Quản lý cây phân loại đa tầng cho Kiểu tóc (`HAIRSTYLE`), Dịch vụ (`SERVICE`), và Bài viết (`ARTICLE`).
3. **Thư Viện Kiểu Tóc (`/admin/hairstyles`)**: Quản lý catalog mẫu tóc đa chiều (giới tính, độ dài, dáng mặt phù hợp, chất tóc, mức độ chăm sóc, style vibe, bộ sưu tập ảnh đa góc độ, khoảng giá tham khảo).
4. **Bảng Màu Nhuộm Swatches (`/admin/colors`)**: Quản lý bảng màu nhuộm thời trang (mã màu, mã HEX chính/phụ, tone ấm/lạnh/trung tính, nhóm màu, độ sáng, yêu cầu số lần tẩy tóc, tông da phù hợp và lưu ý chăm sóc giữ màu).

### Các nguyên tắc kiến trúc bắt buộc:
- **RBAC Server-side Isolation**: Toàn bộ Route Handlers và giao diện được bảo vệ nghiêm ngặt: chỉ cho phép `SUPER_ADMIN` và `CONTENT_ADMIN`. Các vai trò `BOOKING_STAFF` và `EDITOR` bị từ chối tuyệt đối với mã lỗi HTTP 403 Forbidden.
- **Fail-Safe Audit Logging**: Tích hợp chặt chẽ `services/audit.ts` ghi nhận mọi thao tác `CREATE`, `UPDATE`, `DELETE` với diff chi tiết trước/sau, không bao giờ ngắt luồng nghiệp vụ nếu ghi log gặp sự cố.
- **Dual-Mapping Contract Compatibility**: Đảm bảo tương thích 100% hai chiều giữa mô hình cơ sở dữ liệu Prisma (`schema.prisma`) và bộ kiểm thử E2E Opaque-box (`tests/e2e/`):
  - Banner: `active` <-> `isActive`, `order` <-> `displayOrder`, `ctaLink` <-> `linkUrl`.
  - Hairstyle: `name` <-> `title`, `price` <-> `priceRefMin`/`priceRefMax`, `careLevel` <-> `careEffort`, `images` <-> `coverImageUrl` + `galleryImages`, `style` <-> `styleVibe`.
  - HairColor: `hexCode` <-> `hexColor`, `skinSuitability` <-> `suitableSkinTones`, `maintenanceAdvice` <-> `colorFadingAdvice`.
- **Immediate Public Cache Invalidation**: Mọi đột biến dữ liệu (mutation) tự động kích hoạt `revalidatePath` để phản ánh tức thì ra website công khai và dashboard.

---

## 2. ĐỐI SOÁT MÔ HÌNH DỮ LIỆU PRISMA VÀ DUAL-MAPPING (SCHEMA CROSSWALK)

### 2.1. Model `Banner` (`prisma.banner`)
| Prisma Field | Type | Attributes | E2E Contract Field | Mapping & Transformation |
|---|---|---|---|---|
| `id` | String | `@id @default(uuid())` | `id` | Đồng bộ 1:1 |
| `title` | String | Bắt buộc | `title` | Đồng bộ 1:1 |
| `subtitle` | String? | Tùy chọn | `subtitle` | Đồng bộ 1:1 |
| `badgeText` | String? | Tùy chọn | `badgeText` | Nhãn khuyến mãi ("XU HƯỚNG 2026") |
| `imageUrl` | String | Bắt buộc | `imageUrl` | URL ảnh desktop |
| `mobileImageUrl` | String? | Tùy chọn | `mobileImageUrl` | URL ảnh tối ưu di động |
| `linkUrl` | String? | Tùy chọn | `ctaLink` | **Dual Mapping**: Serialize cả `ctaLink` và `linkUrl` |
| `ctaText` | String? | `@default("Khám phá ngay")` | `ctaText` | Nút kêu gọi hành động |
| `displayOrder` | Int | `@default(0)` | `order` | **Dual Mapping**: Serialize cả `order` và `displayOrder` |
| `isActive` | Boolean | `@default(true)` | `active` | **Dual Mapping**: Serialize cả `active` và `isActive` |
| `startDate` | DateTime? | Tùy chọn | `startDate` | Thời điểm bắt đầu hiển thị |
| `endDate` | DateTime? | Tùy chọn | `endDate` | Thời điểm kết thúc hiển thị |

### 2.2. Model `Category` (`prisma.category`)
| Prisma Field | Type | Attributes | Ghi chú nghiệp vụ |
|---|---|---|---|
| `id` | String | `@id @default(uuid())` | Khóa chính UUID |
| `name` | String | Bắt buộc | Tên danh mục (ví dụ: "Kiểu Tóc Nữ") |
| `slug` | String | `@unique` | URL slug (tự động sinh từ `name` nếu trống) |
| `description`| String? | `@db.Text` | Mô tả danh mục |
| `type` | CategoryType | `HAIRSTYLE`, `SERVICE`, `ARTICLE` | Phân loại mục đích sử dụng |
| `imageUrl` | String? | Tùy chọn | Ảnh bìa danh mục |
| `displayOrder` | Int | `@default(0)` | Thứ tự sắp xếp trên UI |
| `isActive` | Boolean | `@default(true)` | Trạng thái hiển thị |
| *Relations* | - | `hairstyles`, `services`, `articles` | `onDelete: Restrict` - Không cho phép xóa nếu có dữ liệu con |

### 2.3. Model `Hairstyle` (`prisma.hairstyle`)
| Prisma Field | Type | Attributes | E2E Contract Field | Mapping & Transformation |
|---|---|---|---|---|
| `id` | String | `@id @default(uuid())` | `id` | Khóa chính UUID |
| `title` | String | Bắt buộc | `name` | **Dual Mapping**: Serialize cả `name` và `title` |
| `slug` | String | `@unique` | `slug` | Bắt buộc (TC2.17 kiểm tra không được rỗng) |
| `summary` | String? | `@db.VarChar(500)` | `features` (string[]) | Nối mảng `features` thành text hoặc tóm tắt |
| `description` | String | `@db.Text` | `description` | Chi tiết kỹ thuật tạo kiểu |
| `coverImageUrl`| String | Bắt buộc | `images[0]` | Lấy ảnh đầu tiên trong mảng `images` |
| `galleryImages`| String[] | Postgres text[] | `images.slice(1)` | Các góc chụp phụ (mặt trước, góc nghiêng, sau gáy) |
| `gender` | GenderTarget | `MALE`, `FEMALE`, `UNISEX` | `gender` | Đối tượng khách hàng mục tiêu |
| `length` | HairLength | `VERY_SHORT`, `SHORT`, `MEDIUM`, `LONG`, `EXTRA_LONG` | `length` | Độ dài tóc |
| `suitableFaces`| FaceShape[] | Enum array: `OVAL`, `ROUND`, `SQUARE`, `HEART`, `DIAMOND`, `OBLONG`, `ALL` | `faceShape` | Hỗ trợ cả nhận giá trị đơn hoặc mảng |
| `suitableTexture`| HairTexture[]| Enum array: `STRAIGHT`, `WAVY`, `CURLY`, `COILY`, `FINE`, `THICK` | `texture` | Hỗ trợ cả nhận giá trị đơn hoặc mảng |
| `careEffort` | CareEffort | `LOW`, `MEDIUM`, `HIGH` | `careLevel` | Ánh xạ: `EASY` -> `LOW`, `MEDIUM` -> `MEDIUM`, `HIGH` -> `HIGH` |
| `styleVibe` | StyleVibe | `KOREAN`, `JAPANESE`, `CLASSIC`, `MINIMALIST`, `STREETWEAR`, `BUSINESS`, `AVANT_GARDE` | `style` | Phong cách kiểu tóc |
| `careAdvice` | String? | `@db.Text` | `careAdvice` | Hướng dẫn chăm sóc tại nhà |
| `stylingTips` | String? | `@db.Text` | `stylingTips` | Mẹo sấy tạo kiểu |
| `priceRefMin` | Decimal? | `@db.Decimal(12,2)` | `price` | Giá tham khảo (nếu gửi 1 giá `price`, lưu cả min/max) |
| `priceRefMax` | Decimal? | `@db.Decimal(12,2)` | `price` | Giá cận trên |
| `isTrending` | Boolean | `@default(false)` | `isTrending` | Huy hiệu xu hướng |
| `isFeatured` | Boolean | `@default(false)` | `isFeatured` | Nổi bật trang chủ |
| `isActive` | Boolean | `@default(true)` | `isActive` | Trạng thái công khai |
| `categoryId` | String | Foreign Key | `categoryId` | **Tự động gán** danh mục `HAIRSTYLE` mặc định nếu client không truyền |

### 2.4. Model `HairColor` (`prisma.hairColor`)
| Prisma Field | Type | Attributes | E2E Contract Field | Mapping & Transformation |
|---|---|---|---|---|
| `id` | String | `@id @default(uuid())` | `id` | Khóa chính UUID |
| `name` | String | Bắt buộc | `name` | Tên màu nhuộm |
| `code` | String | `@unique` | `code` | Mã công thức (tự động sinh nếu thiếu) |
| `hexColor` | String | Bắt buộc | `hexCode` | **Dual Mapping**: Serialize cả `hexCode` và `hexColor` |
| `secondaryHex` | String? | Tùy chọn | `secondaryHex` | Mã HEX ánh sắc phụ (undertone) |
| `tone` | ColorTone | `WARM`, `COOL`, `NEUTRAL` | `tone` | Sắc độ màu |
| `group` | ColorGroup | `BROWN`, `BLONDE`, `RED_BURGUNDY`, `ASH_SMOKY`, `PASTEL`, `BLACK_DARK`, `FASHION_VIBRANT` | `group` | Nhóm màu (ánh xạ `ASH` -> `ASH_SMOKY`, `CARAMEL` -> `BROWN`) |
| `brightnessLevel`| Int | Scale 1 - 10 | `brightness` | Ánh xạ: `LIGHT` -> 8, `MEDIUM` -> 6, `DARK` -> 3 |
| `requiresBleach`| Boolean | `@default(false)` | `requiresBleach` | Bắt buộc tẩy tóc hay không |
| `bleachRounds` | Int | `@default(0)` | `bleachRounds` | Số lần tẩy cần thiết (0, 1, 2, 3) |
| `suitableSkinTones`| String[]| text[] | `skinSuitability` | **Dual Mapping**: Serialize cả `skinSuitability` và `suitableSkinTones` |
| `maintenanceLevel`| CareEffort| `LOW`, `MEDIUM`, `HIGH` | `careLevel` | Mức độ công phu dưỡng màu |
| `colorFadingAdvice`| String? | `@db.Text` | `maintenanceAdvice` | **Dual Mapping**: Serialize cả `maintenanceAdvice` và `colorFadingAdvice` |
| `swatchImageUrl`| String? | Tùy chọn | `swatchImageUrl` | Ảnh cận cảnh sợi tóc nhuộm |
| `samplePortraitUrl`| String? | Tùy chọn | `samplePortraitUrl` | Ảnh chân dung mẫu thực tế |

---

## 3. ĐẶC TẢ ZOD VALIDATION SCHEMAS (`lib/validations/content.ts`)

File `lib/validations/content.ts` tập trung toàn bộ schema cho tầng Validate Input và các hàm chuẩn hóa Serializer hai chiều:

```typescript
import { z } from 'zod';
import { slugify } from '@/lib/utils';

// =============================================================================
// 1. BANNER SCHEMAS & SERIALIZER
// =============================================================================

export const BannerCreateSchema = z.object({
  title: z.string().min(2, 'Tiêu đề banner tối thiểu 2 ký tự').max(150, 'Tiêu đề banner tối đa 150 ký tự'),
  subtitle: z.string().max(250, 'Phụ đề tối đa 250 ký tự').optional().nullable(),
  badgeText: z.string().max(50, 'Nhãn huy hiệu tối đa 50 ký tự').optional().nullable(),
  imageUrl: z.string().min(1, 'Đường dẫn ảnh banner là bắt buộc'),
  mobileImageUrl: z.string().optional().nullable(),
  
  // Dual field support: linkUrl hoặc ctaLink
  linkUrl: z.string().optional().nullable(),
  ctaLink: z.string().optional().nullable(),
  ctaText: z.string().default('Khám phá ngay'),
  
  // Dual field support: displayOrder hoặc order
  displayOrder: z.coerce.number().int().default(0),
  order: z.coerce.number().int().optional(),
  
  // Dual field support: isActive hoặc active
  isActive: z.boolean().default(true),
  active: z.boolean().optional(),
  
  startDate: z.string().datetime().optional().nullable().or(z.literal('')),
  endDate: z.string().datetime().optional().nullable().or(z.literal('')),
});

export const BannerUpdateSchema = BannerCreateSchema.partial();

export type BannerCreateInput = z.infer<typeof BannerCreateSchema>;
export type BannerUpdateInput = z.infer<typeof BannerUpdateSchema>;

export function serializeBanner(b: any) {
  if (!b) return null;
  const activeStatus = b.isActive ?? b.active ?? true;
  const orderNum = b.displayOrder ?? b.order ?? 0;
  const link = b.linkUrl ?? b.ctaLink ?? '/';

  return {
    id: b.id,
    title: b.title,
    subtitle: b.subtitle || null,
    badgeText: b.badgeText || null,
    imageUrl: b.imageUrl,
    mobileImageUrl: b.mobileImageUrl || null,
    linkUrl: link,
    ctaLink: link,
    ctaText: b.ctaText || 'Khám phá ngay',
    displayOrder: orderNum,
    order: orderNum,
    isActive: activeStatus,
    active: activeStatus,
    startDate: b.startDate ? new Date(b.startDate).toISOString() : null,
    endDate: b.endDate ? new Date(b.endDate).toISOString() : null,
    createdAt: b.createdAt ? new Date(b.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: b.updatedAt ? new Date(b.updatedAt).toISOString() : new Date().toISOString(),
  };
}

// =============================================================================
// 2. CATEGORY SCHEMAS & SERIALIZER
// =============================================================================

export const CategoryTypeEnum = z.enum(['HAIRSTYLE', 'SERVICE', 'ARTICLE']);

export const CategoryCreateSchema = z.object({
  name: z.string().min(2, 'Tên danh mục tối thiểu 2 ký tự').max(100, 'Tên danh mục tối đa 100 ký tự'),
  slug: z.string().min(2, 'Slug tối thiểu 2 ký tự').optional(),
  description: z.string().max(500, 'Mô tả tối đa 500 ký tự').optional().nullable(),
  type: CategoryTypeEnum.default('HAIRSTYLE'),
  imageUrl: z.string().optional().nullable(),
  displayOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const CategoryUpdateSchema = CategoryCreateSchema.partial();

export type CategoryCreateInput = z.infer<typeof CategoryCreateSchema>;
export type CategoryUpdateInput = z.infer<typeof CategoryUpdateSchema>;

export function serializeCategory(c: any) {
  if (!c) return null;
  return {
    id: c.id,
    name: c.name,
    slug: c.slug || slugify(c.name),
    description: c.description || null,
    type: c.type || 'HAIRSTYLE',
    imageUrl: c.imageUrl || null,
    displayOrder: c.displayOrder ?? 0,
    isActive: c.isActive ?? true,
    hairstylesCount: c._count?.hairstyles ?? (Array.isArray(c.hairstyles) ? c.hairstyles.length : 0),
    servicesCount: c._count?.services ?? (Array.isArray(c.services) ? c.services.length : 0),
    articlesCount: c._count?.articles ?? (Array.isArray(c.articles) ? c.articles.length : 0),
    createdAt: c.createdAt ? new Date(c.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: c.updatedAt ? new Date(c.updatedAt).toISOString() : new Date().toISOString(),
  };
}

// =============================================================================
// 3. HAIRSTYLE SCHEMAS & SERIALIZER
// =============================================================================

export const GenderTargetEnum = z.enum(['MALE', 'FEMALE', 'UNISEX']);
export const HairLengthEnum = z.enum(['VERY_SHORT', 'SHORT', 'MEDIUM', 'LONG', 'EXTRA_LONG']);
export const FaceShapeEnum = z.enum(['OVAL', 'ROUND', 'SQUARE', 'HEART', 'DIAMOND', 'OBLONG', 'ALL']);
export const HairTextureEnum = z.enum(['STRAIGHT', 'WAVY', 'CURLY', 'COILY', 'FINE', 'THICK']);
export const CareEffortEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'EASY']);
export const StyleVibeEnum = z.enum([
  'KOREAN',
  'JAPANESE',
  'CLASSIC',
  'MINIMALIST',
  'STREETWEAR',
  'BUSINESS',
  'AVANT_GARDE',
  'MODERN',
]);

export const HairstyleCreateSchema = z.object({
  // Tên kiểu tóc: chấp nhận name hoặc title (TC2.17 kiểm tra bắt buộc)
  name: z.string().min(1, 'Tên kiểu tóc là bắt buộc').optional(),
  title: z.string().min(1, 'Tiêu đề kiểu tóc là bắt buộc').optional(),
  slug: z.string().min(1, 'Đường dẫn kiểu tóc là bắt buộc'),

  summary: z.string().max(500).optional().nullable(),
  description: z.string().optional().default('Kiểu tóc thiết kế độc quyền tại Lumière Hair Atelier.'),
  features: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),

  // Ảnh: chấp nhận coverImageUrl hoặc images[]
  coverImageUrl: z.string().optional(),
  images: z.array(z.string()).optional(),
  galleryImages: z.array(z.string()).optional(),

  // Thuộc tính phân loại
  gender: GenderTargetEnum.default('UNISEX'),
  length: HairLengthEnum.default('MEDIUM'),
  style: StyleVibeEnum.optional(),
  styleVibe: StyleVibeEnum.optional().default('KOREAN'),

  // Mặt phù hợp: chấp nhận string đơn hoặc mảng FaceShape
  faceShape: z.union([FaceShapeEnum, z.array(FaceShapeEnum)]).optional().default('OVAL'),
  suitableFaces: z.array(FaceShapeEnum).optional(),

  // Chất tóc: chấp nhận string đơn hoặc mảng HairTexture
  texture: z.union([HairTextureEnum, z.array(HairTextureEnum)]).optional().default('STRAIGHT'),
  suitableTexture: z.array(HairTextureEnum).optional(),

  // Độ chăm sóc
  careLevel: CareEffortEnum.optional(),
  careEffort: CareEffortEnum.optional().default('MEDIUM'),

  // Giá tham khảo
  price: z.coerce.number().optional(),
  priceRefMin: z.coerce.number().optional(),
  priceRefMax: z.coerce.number().optional(),

  careAdvice: z.string().optional().nullable(),
  stylingTips: z.string().optional().nullable(),

  isTrending: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),

  categoryId: z.string().uuid().optional(),
  serviceIds: z.array(z.string().uuid()).optional(),
}).refine((data) => data.name || data.title, {
  message: 'Tên kiểu tóc là bắt buộc',
  path: ['name'],
});

export const HairstyleUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  summary: z.string().max(500).optional().nullable(),
  description: z.string().optional(),
  features: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  coverImageUrl: z.string().optional(),
  images: z.array(z.string()).optional(),
  galleryImages: z.array(z.string()).optional(),
  gender: GenderTargetEnum.optional(),
  length: HairLengthEnum.optional(),
  style: StyleVibeEnum.optional(),
  styleVibe: StyleVibeEnum.optional(),
  faceShape: z.union([FaceShapeEnum, z.array(FaceShapeEnum)]).optional(),
  suitableFaces: z.array(FaceShapeEnum).optional(),
  texture: z.union([HairTextureEnum, z.array(HairTextureEnum)]).optional(),
  suitableTexture: z.array(HairTextureEnum).optional(),
  careLevel: CareEffortEnum.optional(),
  careEffort: CareEffortEnum.optional(),
  price: z.coerce.number().optional(),
  priceRefMin: z.coerce.number().optional(),
  priceRefMax: z.coerce.number().optional(),
  careAdvice: z.string().optional().nullable(),
  stylingTips: z.string().optional().nullable(),
  isTrending: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  isActive: z.boolean().optional(),
  categoryId: z.string().uuid().optional(),
  serviceIds: z.array(z.string().uuid()).optional(),
});

export type HairstyleCreateInput = z.infer<typeof HairstyleCreateSchema>;
export type HairstyleUpdateInput = z.infer<typeof HairstyleUpdateSchema>;

export function serializeHairstyle(h: any) {
  if (!h) return null;
  const name = h.title || h.name || '';
  const priceVal = h.price !== undefined ? Number(h.price) : h.priceRefMin ? Number(h.priceRefMin) : 350000;
  const careVal = h.careLevel || (h.careEffort === 'LOW' ? 'EASY' : h.careEffort) || 'MEDIUM';
  const allImages = Array.isArray(h.images) && h.images.length > 0
    ? h.images
    : [h.coverImageUrl, ...(Array.isArray(h.galleryImages) ? h.galleryImages : [])].filter(Boolean);

  const faceShape = Array.isArray(h.suitableFaces) && h.suitableFaces.length > 0
    ? h.suitableFaces[0]
    : h.faceShape || 'OVAL';

  const texture = Array.isArray(h.suitableTexture) && h.suitableTexture.length > 0
    ? h.suitableTexture[0]
    : h.texture || 'STRAIGHT';

  return {
    id: h.id,
    name,
    title: name,
    slug: h.slug,
    summary: h.summary || null,
    description: h.description || '',
    features: Array.isArray(h.features) ? h.features : (h.summary ? [h.summary] : []),
    tags: Array.isArray(h.tags) ? h.tags : [],
    coverImageUrl: h.coverImageUrl || allImages[0] || '/images/default-hair.jpg',
    galleryImages: Array.isArray(h.galleryImages) ? h.galleryImages : allImages.slice(1),
    images: allImages.length > 0 ? allImages : ['/images/default-hair.jpg'],
    gender: h.gender || 'UNISEX',
    length: h.length || 'MEDIUM',
    style: h.style || h.styleVibe || 'KOREAN',
    styleVibe: h.styleVibe || h.style || 'KOREAN',
    faceShape,
    suitableFaces: Array.isArray(h.suitableFaces) ? h.suitableFaces : [faceShape],
    texture,
    suitableTexture: Array.isArray(h.suitableTexture) ? h.suitableTexture : [texture],
    careLevel: careVal,
    careEffort: careVal === 'EASY' ? 'LOW' : careVal,
    price: priceVal,
    priceRefMin: priceVal,
    priceRefMax: h.priceRefMax ? Number(h.priceRefMax) : priceVal,
    careAdvice: h.careAdvice || null,
    stylingTips: h.stylingTips || null,
    isTrending: h.isTrending ?? false,
    isFeatured: h.isFeatured ?? false,
    isActive: h.isActive ?? true,
    viewCount: h.viewCount ?? 0,
    categoryId: h.categoryId || null,
    category: h.category ? serializeCategory(h.category) : null,
    services: Array.isArray(h.services) ? h.services : [],
    createdAt: h.createdAt ? new Date(h.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: h.updatedAt ? new Date(h.updatedAt).toISOString() : new Date().toISOString(),
  };
}

// =============================================================================
// 4. HAIR COLOR SCHEMAS & SERIALIZER
// =============================================================================

export const ColorToneEnum = z.enum(['WARM', 'COOL', 'NEUTRAL']);
export const ColorGroupEnum = z.enum([
  'BROWN',
  'BLONDE',
  'RED_BURGUNDY',
  'ASH_SMOKY',
  'ASH',
  'PASTEL',
  'BLACK_DARK',
  'FASHION_VIBRANT',
  'CARAMEL',
]);

export const HairColorCreateSchema = z.object({
  name: z.string().min(2, 'Tên màu tóc tối thiểu 2 ký tự').max(100),
  code: z.string().optional(),
  
  // Dual field support: hexCode hoặc hexColor
  hexCode: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Mã màu HEX không hợp lệ').optional(),
  hexColor: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Mã màu HEX không hợp lệ').optional(),
  secondaryHex: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Mã màu phụ không hợp lệ').optional().nullable(),
  
  tone: ColorToneEnum.default('NEUTRAL'),
  group: ColorGroupEnum.default('BROWN'),
  
  // Độ sáng: có thể truyền số 1-10 hoặc chuỗi 'LIGHT' | 'MEDIUM' | 'DARK'
  brightnessLevel: z.coerce.number().min(1).max(10).optional().default(6),
  brightness: z.enum(['LIGHT', 'MEDIUM', 'DARK']).optional(),
  
  requiresBleach: z.boolean().default(false),
  bleachRounds: z.coerce.number().int().min(0).max(5).default(0),
  
  // Dual field support: skinSuitability hoặc suitableSkinTones
  skinSuitability: z.array(z.string()).optional(),
  suitableSkinTones: z.array(z.string()).optional(),
  
  maintenanceLevel: CareEffortEnum.optional().default('MEDIUM'),
  maintenanceAdvice: z.string().optional().nullable(),
  colorFadingAdvice: z.string().optional().nullable(),
  
  swatchImageUrl: z.string().optional().nullable(),
  samplePortraitUrl: z.string().optional().nullable(),
  isTrending: z.boolean().default(false),
  isActive: z.boolean().default(true),
  displayOrder: z.coerce.number().int().default(0),
}).refine((data) => data.hexCode || data.hexColor, {
  message: 'Mã màu HEX là bắt buộc',
  path: ['hexCode'],
});

export const HairColorUpdateSchema = HairColorCreateSchema.partial();

export type HairColorCreateInput = z.infer<typeof HairColorCreateSchema>;
export type HairColorUpdateInput = z.infer<typeof HairColorUpdateSchema>;

export function serializeHairColor(c: any) {
  if (!c) return null;
  const hex = c.hexCode || c.hexColor || '#4a2c11';
  const skinTones = Array.isArray(c.skinSuitability) && c.skinSuitability.length > 0
    ? c.skinSuitability
    : Array.isArray(c.suitableSkinTones)
    ? c.suitableSkinTones
    : ['LIGHT', 'MEDIUM'];

  const advice = c.maintenanceAdvice || c.colorFadingAdvice || null;
  const brightnessStr = c.brightness || (c.brightnessLevel >= 7 ? 'LIGHT' : c.brightnessLevel <= 4 ? 'DARK' : 'MEDIUM');

  return {
    id: c.id,
    name: c.name,
    code: c.code || `CLR-${c.name.substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
    hexColor: hex,
    hexCode: hex,
    secondaryHex: c.secondaryHex || null,
    tone: c.tone || 'NEUTRAL',
    group: c.group || 'BROWN',
    brightness: brightnessStr,
    brightnessLevel: c.brightnessLevel ?? (brightnessStr === 'LIGHT' ? 8 : brightnessStr === 'DARK' ? 3 : 6),
    requiresBleach: c.requiresBleach ?? false,
    bleachRounds: c.bleachRounds ?? (c.requiresBleach ? 1 : 0),
    skinSuitability: skinTones,
    suitableSkinTones: skinTones,
    maintenanceLevel: c.maintenanceLevel || 'MEDIUM',
    maintenanceAdvice: advice,
    colorFadingAdvice: advice,
    swatchImageUrl: c.swatchImageUrl || null,
    samplePortraitUrl: c.samplePortraitUrl || null,
    isTrending: c.isTrending ?? false,
    isActive: c.isActive ?? true,
    displayOrder: c.displayOrder ?? 0,
    createdAt: c.createdAt ? new Date(c.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: c.updatedAt ? new Date(c.updatedAt).toISOString() : new Date().toISOString(),
  };
}
```

---

## 4. THIẾT KẾ CHI TIẾT CÁC API ENDPOINTS & LOGIC NGHIỆP VỤ

### 4.1. Phân hệ Banners (`app/api/admin/banners/`)

#### 1. `GET /api/admin/banners`
- **Mục đích:** Liệt kê toàn bộ banner trong hệ thống quản trị, hỗ trợ lọc theo trạng thái hiển thị và tìm kiếm tiêu đề.
- **Xác thực & RBAC:** `authenticateAdminRequest` yêu cầu vai trò `['SUPER_ADMIN', 'CONTENT_ADMIN']`.
- **Query Params:**
  - `search` (tùy chọn): tìm kiếm theo `title` hoặc `subtitle`.
  - `active` (tùy chọn): `true` / `false`.
- **Database Query:**
  ```typescript
  const banners = await prisma.banner.findMany({
    where: {
      AND: [
        search ? { OR: [{ title: { contains: search, mode: 'insensitive' } }, { subtitle: { contains: search, mode: 'insensitive' } }] } : {},
        active !== undefined ? { isActive: active === 'true' } : {},
      ],
    },
    orderBy: { displayOrder: 'asc' },
  });
  ```
- **Response:** HTTP 200 `Array<SerializedBanner>`.

#### 2. `POST /api/admin/banners`
- **Mục đích:** Tạo mới hero banner cho trang chủ.
- **Xác thực & RBAC:** `authenticateAdminRequest` yêu cầu vai trò `['SUPER_ADMIN', 'CONTENT_ADMIN']`.
- **Payload:** Validate bằng `BannerCreateSchema`.
- **Xử lý Dual-Mapping:**
  - `isActive = input.isActive ?? input.active ?? true`
  - `displayOrder = input.displayOrder ?? input.order ?? 0`
  - `linkUrl = input.linkUrl ?? input.ctaLink ?? '/'`
- **Database Mutation:** `prisma.banner.create({ data: { ... } })`.
- **Audit Logging:**
  ```typescript
  await logAuditEvent({
    userId: user.id, userEmail: user.email, userName: user.fullName, userRole: user.role.name,
    action: 'CREATE',
    entity: 'BANNER',
    entityId: newBanner.id,
    details: { title: newBanner.title, displayOrder: newBanner.displayOrder },
    ipAddress, userAgent,
  });
  ```
- **Cache Invalidation:** `revalidatePath('/')`, `revalidatePath('/admin/banners')`.
- **Response:** HTTP 201 Created với `serializeBanner(newBanner)`.

#### 3. `PUT /api/admin/banners/[id]`
- **Mục đích:** Cập nhật thông tin chi tiết hoặc trạng thái của banner.
- **Payload:** Validate bằng `BannerUpdateSchema`.
- **Kiểm tra tồn tại:** Nếu không tìm thấy, trả về HTTP 404 `{ error: 'Banner not found' }`.
- **Audit Logging:** Ghi `action: 'UPDATE'`, `entity: 'BANNER'`, kèm diff `{ before, after }`.
- **Response:** HTTP 200 OK với `serializeBanner(updatedBanner)`.

#### 4. `DELETE /api/admin/banners/[id]`
- **Mục đích:** Xóa vĩnh viễn banner khỏi hệ thống.
- **Kiểm tra tồn tại:** Nếu không tìm thấy, trả về HTTP 404.
- **Database Mutation:** `prisma.banner.delete({ where: { id } })`.
- **Audit Logging:** Ghi `action: 'DELETE'`, `entity: 'BANNER'`.
- **Response:** HTTP 200 OK `{ success: true, id }`.

#### 5. `PATCH /api/admin/banners/[id]/toggle`
- **Mục đích:** Bật/tắt nhanh trạng thái hiển thị mà không cần tải lại toàn bộ form.
- **Xử lý:** Lấy bản ghi hiện tại -> đảo ngược `isActive = !current.isActive` -> lưu DB -> ghi Audit.
- **Response:** HTTP 200 OK `{ success: true, id, isActive, active }`.

---

### 4.2. Phân hệ Categories (`app/api/admin/categories/`)

#### 1. `GET /api/admin/categories`
- **Query Params:** `type` (`HAIRSTYLE` | `SERVICE` | `ARTICLE`), `search`.
- **Database Query:** Kèm `include: { _count: { select: { hairstyles: true, services: true, articles: true } } }`.
- **Response:** HTTP 200 `Array<SerializedCategory>`.

#### 2. `POST /api/admin/categories`
- **Validation:** `CategoryCreateSchema`. Tự động sinh `slug = slugify(name)` nếu client không gửi.
- **Unique Check:** Kiểm tra `slug` đã tồn tại chưa; nếu trùng trả về HTTP 409 Conflict.
- **Response:** HTTP 201 Created. Audit `action: 'CREATE', entity: 'CATEGORY'`.

#### 3. `PUT /api/admin/categories/[id]`
- **Validation:** `CategoryUpdateSchema`. Cập nhật và ghi Audit log.
- **Response:** HTTP 200 OK.

#### 4. `DELETE /api/admin/categories/[id]`
- **Ràng buộc an toàn:** Kiểm tra số lượng `hairstyles`, `services`, `articles` liên kết.
  - Nếu `count > 0`, từ chối với HTTP 400: `{ error: 'Không thể xóa danh mục đang chứa kiểu tóc, dịch vụ hoặc bài viết liên quan.' }`.
- **Response:** HTTP 200 OK `{ success: true, id }`.

---

### 4.3. Phân hệ Hairstyles (`app/api/admin/hairstyles/`)

#### 1. `GET /api/admin/hairstyles`
- **Query Params:**
  - `gender`, `length`, `careEffort`/`careLevel`, `faceShape`, `texture`, `categoryId`, `search`, `page`, `pageSize`.
- **Database Query:**
  - Lấy kèm `include: { category: true, services: true }`.
  - Sắp xếp mặc định theo `createdAt: 'desc'` hoặc `title: 'asc'`.
- **Response:** HTTP 200 `Array<SerializedHairstyle>`.

#### 2. `POST /api/admin/hairstyles`
- **Bảo vệ biên (TC2.17):** Kiểm tra bắt buộc có `name` (hoặc `title`) và `slug`. Nếu rỗng -> trả về HTTP 400 `{ error: 'Tên và đường dẫn kiểu tóc là bắt buộc' }`.
- **Xử lý Fallback Category:**
  - Nếu payload không có `categoryId`, truy vấn danh mục `CategoryType.HAIRSTYLE` đầu tiên trong DB:
    ```typescript
    if (!input.categoryId) {
      const defaultCat = await prisma.category.findFirst({ where: { type: 'HAIRSTYLE' } });
      categoryId = defaultCat ? defaultCat.id : (await createDefaultHairstyleCategory()).id;
    }
    ```
- **Xử lý Dual-Mapping:**
  - `title = input.name || input.title`
  - `coverImageUrl = input.coverImageUrl || (input.images && input.images[0]) || '/images/default-hair.jpg'`
  - `galleryImages = input.galleryImages || (input.images && input.images.slice(1)) || []`
  - `careEffort = input.careLevel === 'EASY' ? 'LOW' : (input.careEffort || input.careLevel || 'MEDIUM')`
  - `priceRefMin = input.price !== undefined ? input.price : input.priceRefMin`
  - `priceRefMax = input.priceRefMax !== undefined ? input.priceRefMax : input.price`
- **Audit Logging:** `action: 'CREATE', entity: 'HAIRSTYLE', entityId: newStyle.id`.
- **Cache Invalidation:**
  - `revalidatePath('/hairstyles')`
  - `revalidatePath('/admin/hairstyles')`
  - `revalidatePath('/')`
- **Response:** HTTP 201 Created với `serializeHairstyle(newStyle)` (đáp ứng trọn vẹn TC1.8 và TC3.4).

#### 3. `GET /api/admin/hairstyles/[id]`
- **Response:** HTTP 200 OK với thông tin chi tiết, hoặc 404 nếu không tìm thấy.

#### 4. `PUT /api/admin/hairstyles/[id]`
- **Bảo vệ biên (TC2.18):** Kiểm tra `id` trong DB:
  ```typescript
  const existing = await prisma.hairstyle.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: 'Hairstyle not found' }, { status: 404 });
  }
  ```
- **Cập nhật:** Hỗ trợ Partial Update (ví dụ chỉ đổi `price` hoặc `careLevel` như trong TC1.8 và TC3.5).
- **Audit Logging:** `action: 'UPDATE', entity: 'HAIRSTYLE'`.
- **Cache Invalidation:** `revalidatePath('/hairstyles')`, `revalidatePath(`/hairstyles/${existing.slug}`)`.
- **Response:** HTTP 200 OK với `serializeHairstyle(updatedStyle)`.

#### 5. `DELETE /api/admin/hairstyles/[id]`
- **Bảo vệ biên:** Nếu không tồn tại -> trả về HTTP 404.
- **Xóa bản ghi:** `prisma.hairstyle.delete({ where: { id } })`.
- **Audit Logging:** `action: 'DELETE', entity: 'HAIRSTYLE', details: { name: existing.title }`.
- **Cache Invalidation:** `revalidatePath('/hairstyles')`, `revalidatePath('/')`.
- **Response:** HTTP 200 OK `{ success: true, id }` (đáp ứng trọn vẹn TC1.8 và TC3.6).

---

### 4.4. Phân hệ Hair Colors (`app/api/admin/colors/`)

#### 1. `GET /api/admin/colors`
- **Query Params:** `search`, `tone`, `group`, `requiresBleach`, `isActive`.
- **Database Query:** Sắp xếp theo `displayOrder: 'asc'`, `createdAt: 'desc'`.
- **Response:** HTTP 200 `Array<SerializedHairColor>`.

#### 2. `POST /api/admin/colors`
- **Validation:** `HairColorCreateSchema`.
- **Xử lý Dual-Mapping:**
  - `hexColor = input.hexCode || input.hexColor`
  - `suitableSkinTones = input.skinSuitability || input.suitableSkinTones || ['Da sáng', 'Da trung tính']`
  - `colorFadingAdvice = input.maintenanceAdvice || input.colorFadingAdvice`
  - `code`: Tự động sinh `CLR-${slugify(input.name).toUpperCase().substring(0, 8)}-${Date.now().toString(36).toUpperCase()}` nếu thiếu.
- **Audit Logging (Quan trọng cho TC1.12):**
  - Tên thực thể ghi nhận phải là `'HAIR_COLOR'` (khớp chính xác với assertion trong `admin.test.ts`):
    ```typescript
    await logAuditEvent({
      userId: user.id, userEmail: user.email, userName: user.fullName, userRole: user.role.name,
      action: 'CREATE',
      entity: 'HAIR_COLOR', // BẮT BUỘC để pass TC1.12
      entityId: newColor.id,
      details: { name: newColor.name, hexColor: newColor.hexColor, tone: newColor.tone },
      ipAddress, userAgent,
    });
    ```
- **Response:** HTTP 201 Created với `serializeHairColor(newColor)` (đáp ứng TC1.10).

#### 3. `GET /api/admin/colors/[id]`
- **Response:** HTTP 200 OK hoặc 404 Not Found.

#### 4. `PUT /api/admin/colors/[id]`
- **Kiểm tra tồn tại:** Trả về 404 nếu không tìm thấy.
- **Audit Logging:** `action: 'UPDATE', entity: 'HAIR_COLOR'`.
- **Response:** HTTP 200 OK.

#### 5. `DELETE /api/admin/colors/[id]`
- **Kiểm tra ràng buộc:** Nếu màu đang được liên kết trong lịch hẹn (`bookings`), xóa an toàn (`onDelete: SetNull` trong schema) hoặc cảnh báo quản trị.
- **Audit Logging:** `action: 'DELETE', entity: 'HAIR_COLOR'`.
- **Response:** HTTP 200 OK `{ success: true, id }`.

---

## 5. THIẾT KẾ BẢO MẬT PHÂN QUYỀN RBAC VÀ KIỂM SOÁT LỖI

### 5.1. RBAC Guard Helper áp dụng cho API Route Handlers

Mọi route handler trong `/api/admin/banners`, `/api/admin/categories`, `/api/admin/hairstyles`, `/api/admin/colors` đều sử dụng mẫu xác thực đồng nhất:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { extractAuthToken, verifySession } from '@/lib/auth';

export async function authorizeCatalogAccess(req: NextRequest) {
  const token = extractAuthToken(req);
  if (!token) {
    return {
      errorResponse: NextResponse.json(
        { error: 'Unauthorized: Session missing or invalid' },
        { status: 401 }
      ),
    };
  }

  const user = await verifySession(token);
  if (!user) {
    return {
      errorResponse: NextResponse.json(
        { error: 'Unauthorized: Session missing or invalid' },
        { status: 401 }
      ),
    };
  }

  // Phân quyền Catalog: Chỉ SUPER_ADMIN và CONTENT_ADMIN được phép truy cập
  const allowedRoles = ['SUPER_ADMIN', 'CONTENT_ADMIN'];
  if (!allowedRoles.includes(user.role.name)) {
    return {
      errorResponse: NextResponse.json(
        { error: `Forbidden: Role ${user.role.name} cannot mutate catalog content` },
        { status: 403 }
      ),
    };
  }

  return { user };
}
```

### 5.2. RBAC Page Guards cho Server Components
Tại các file `page.tsx` trong `app/admin/banners/`, `app/admin/categories/`, `app/admin/hairstyles/`, `app/admin/colors/`:
```typescript
import { requireAdmin } from '@/lib/auth';

export default async function AdminHairstylesPage() {
  // Tự động kiểm tra session và vai trò, redirect sang /admin?error=unauthorized nếu không đủ quyền
  const user = await requireAdmin(['SUPER_ADMIN', 'CONTENT_ADMIN']);
  
  return <HairstylesClientPage user={user} />;
}
```

### 5.3. Tiêu chuẩn mã lỗi HTTP (HTTP Error Code Matrix)
- **400 Bad Request:** Lỗi validation Zod (thiếu trường bắt buộc như `name`, `slug`, định dạng hex sai), cố xóa category có liên kết con.
- **401 Unauthorized:** Thiếu token hoặc token hết hạn.
- **403 Forbidden:** Vai trò không hợp lệ (ví dụ `EDITOR` hoặc `BOOKING_STAFF` truy cập catalog, thỏa mãn TC2.15 và TC2.16).
- **404 Not Found:** Bản ghi không tồn tại khi PUT/DELETE (thỏa mãn TC2.18).
- **409 Conflict:** Trùng `slug` hoặc `code` unique.
- **500 Internal Server Error:** Lỗi kết nối DB hoặc lỗi ngoại lệ không xử lý.

---

## 6. THIẾT KẾ THÀNH PHẦN GIAO DIỆN (UI COMPONENTS BLUEPRINT)

Tất cả các thành phần UI được thiết kế theo phong cách sang trọng Atelier Luxury Palette (`bg-salon-noir`, `bg-salon-charcoal`, viền `border-salon-gold/20`, chữ `text-salon-ivory` và `text-salon-gold`).

### 6.1. Quản lý Banner (`/admin/banners`)
- **Tập tin cấu trúc:**
  - `app/admin/banners/page.tsx`: Server Component kiểm tra quyền, tải danh sách ban đầu.
  - `components/admin/banners/BannerTable.tsx`: Bảng quản lý hỗ trợ:
    - Thumbnail ảnh xem trước (Desktop & Mobile badge).
    - Cột Tiêu đề, Phụ đề, Badge khuyến mãi.
    - Cột Thứ tự hiển thị (`order`) có nút tăng/giảm nhanh.
    - Công tắc chuyển trạng thái nhanh (`Active Switch`) gọi `PATCH /toggle` với phản hồi tức thì (Optimistic UI).
    - Cột Khoảng thời gian áp dụng (`startDate` - `endDate`) với badge "Đang chạy" hoặc "Hết hạn".
    - Menu thao tác: Chỉnh sửa (mở modal), Xóa (hộp thoại xác nhận an toàn).
  - `components/admin/banners/BannerFormModal.tsx`: Modal tạo/sửa banner:
    - Xem trước trực tiếp ảnh URL banner (hỗ trợ kiểm tra tỷ lệ 16:9).
    - Input chọn ngày bắt đầu & kết thúc.
    - Chọn liên kết CTA (dropdown gợi ý link nội bộ: `/hairstyles`, `/booking`, `/services`).

### 6.2. Quản lý Danh Mục (`/admin/categories`)
- **Tập tin cấu trúc:**
  - `app/admin/categories/page.tsx`: Quản lý danh mục tập trung.
  - `components/admin/categories/CategoryTabs.tsx`: Tabs chuyển đổi giữa `HAIRSTYLE`, `SERVICE`, `ARTICLE`.
  - `components/admin/categories/CategoryTable.tsx`:
    - Hiển thị tên danh mục, slug, số lượng mục con liên kết (Kiểu tóc / Dịch vụ / Bài viết).
    - Nút Xóa có kiểm tra an toàn: nếu `count > 0` vô hiệu hóa nút xóa kèm tooltip cảnh báo.
  - `components/admin/categories/CategoryFormModal.tsx`:
    - Auto-slug khi gõ tên danh mục.
    - Chọn loại danh mục (`CategoryType`).

### 6.3. Quản lý Bộ Sưu Tập Kiểu Tóc (`/admin/hairstyles`)
- **Tập tin cấu trúc:**
  - `app/admin/hairstyles/page.tsx`: Server Component nạp dữ liệu kiểu tóc & danh mục.
  - `components/admin/hairstyles/HairstyleFilterBar.tsx`:
    - Ô tìm kiếm từ khóa (tên, slug, tags).
    - Bộ lọc đa chiều: Đối tượng (`MALE`, `FEMALE`, `UNISEX`), Độ dài tóc (`SHORT`, `MEDIUM`, `LONG`), Dáng mặt, Chất tóc, Mức độ chăm sóc, Danh mục.
  - `components/admin/hairstyles/HairstyleTable.tsx`:
    - Cột Thumbnail ảnh bìa kèm số lượng ảnh gallery trong bộ sưu tập (ví dụ: `+3 ảnh`).
    - Cột Tên kiểu tóc + slug + danh mục.
    - Cột Phân loại: Badges giới tính, độ dài, vibe phong cách.
    - Cột Khoảng giá tham khảo (định dạng `350.000 ₫ - 500.000 ₫` bằng `formatPriceRange`).
    - Cột Toggles: Nổi bật (`isFeatured`), Xu hướng (`isTrending`), Hoạt động (`isActive`).
    - Cột Hành động: Xem trước trang công khai, Chỉnh sửa, Xóa.
  - `components/admin/hairstyles/HairstyleFormModal.tsx`: Form đa tab hiện đại:
    - **Tab 1: Thông tin chung:** Tên kiểu tóc, slug, danh mục, tóm tắt, mô tả chi tiết.
    - **Tab 2: Đặc điểm & Phân loại:** Giới tính, độ dài, dáng khuôn mặt phù hợp (Multi-select Chips: Oval, Tròn, Vuông...), chất tóc phù hợp (Thẳng, Gợn sóng, Xoăn...), mức độ chăm sóc (Dễ, Trung bình, Cao).
    - **Tab 3: Bộ sưu tập ảnh (Gallery Manager):**
      - Quản lý danh sách URL ảnh (ảnh bìa chính + ảnh đa góc độ: góc nghiêng, sau gáy).
      - Thao tác kéo thả đổi thứ tự hoặc bấm nút đặt làm ảnh bìa chính.
    - **Tab 4: Giá tham khảo & Hướng dẫn:**
      - Khoảng giá tham khảo (`priceRefMin`, `priceRefMax`).
      - Hướng dẫn chăm sóc tại nhà (`careAdvice`) và mẹo sấy tạo phồng (`stylingTips`).

### 6.4. Quản lý Bảng Màu Tóc Swatches (`/admin/colors`)
- **Tập tin cấu trúc:**
  - `app/admin/colors/page.tsx`: Server Component nạp dữ liệu màu nhuộm.
  - `components/admin/colors/ColorFilterBar.tsx`:
    - Lọc theo Tone màu (`WARM`, `COOL`, `NEUTRAL`), Nhóm màu (`BROWN`, `ASH`, `PASTEL`, `BLONDE`...), Trạng thái Tẩy tóc (`Tất cả`, `Cần tẩy`, `Không cần tẩy`).
  - `components/admin/colors/ColorSwatchGrid.tsx`:
    - Hiển thị dạng thẻ Swatch Card trực quan sang trọng:
      - Ô vuông xem trước màu thực tế với mã HEX chính (ví dụ `#59493E`).
      - Vòng tròn phụ hiển thị mã ánh sắc Undertone (`secondaryHex`).
      - Huy hiệu chỉ báo tẩy tóc (Cần tẩy: Đỏ cam + số lần tẩy; Không tẩy: Xanh ngọc).
      - Badge Tone (`Ấm` / `Lạnh` / `Trung tính`) và Thang độ sáng (1 - 10).
      - Danh sách tông da phù hợp (Da sáng, Da trung tính, Da ngăm).
    - Chế độ xem linh hoạt: Chuyển đổi giữa dạng Lưới Swatches (Grid View) và Bảng chi tiết (Table View).
  - `components/admin/colors/ColorFormModal.tsx`:
    - Bộ chọn màu tương tác trực tiếp (`<input type="color">` kết hợp text field HEX `#xxxxxx`).
    - Chọn mã ánh sắc phụ (`secondaryHex`).
    - Công tắc "Yêu cầu tẩy tóc" -> khi bật sẽ mở rộng trường chọn số lần tẩy (1, 2, 3 lần).
    - Checkbox chọn tông da phù hợp.
    - Soạn thảo lưu ý giữ màu và dầu gội khuyên dùng (`colorFadingAdvice`).

---

## 7. KẾ HOẠCH THỰC THI CHO WORKER (ACTIONABLE IMPLEMENTATION STEPS)

Khi Worker bắt tay vào triển khai Milestone 3, quy trình cần thực hiện theo đúng trình tự phân tầng sau:

### Giai đoạn 1: Validation & Serialization Layer
- Tạo file `lib/validations/content.ts` với đầy đủ Zod schemas và hàm serialize hai chiều theo đúng mục 3 của tài liệu này.

### Giai đoạn 2: API Route Handlers
1. Triển khai API Categories:
   - `app/api/admin/categories/route.ts` (GET, POST)
   - `app/api/admin/categories/[id]/route.ts` (GET, PUT, DELETE)
2. Triển khai API Banners:
   - `app/api/admin/banners/route.ts` (GET, POST)
   - `app/api/admin/banners/[id]/route.ts` (GET, PUT, DELETE)
   - `app/api/admin/banners/[id]/toggle/route.ts` (PATCH)
3. Triển khai API Hairstyles:
   - `app/api/admin/hairstyles/route.ts` (GET, POST)
   - `app/api/admin/hairstyles/[id]/route.ts` (GET, PUT, DELETE)
4. Triển khai API Hair Colors:
   - `app/api/admin/colors/route.ts` (GET, POST)
   - `app/api/admin/colors/[id]/route.ts` (GET, PUT, DELETE)
   - Tạo route alias `app/api/admin/hair-colors/` điều hướng hoặc chia sẻ handler với `/colors`.

### Giai đoạn 3: UI Components & Admin Pages
1. Xây dựng giao diện Banners tại `app/admin/banners/page.tsx` và `components/admin/banners/`.
2. Xây dựng giao diện Categories tại `app/admin/categories/page.tsx` và `components/admin/categories/`.
3. Xây dựng giao diện Hairstyles tại `app/admin/hairstyles/page.tsx` và `components/admin/hairstyles/`.
4. Xây dựng giao diện Hair Colors tại `app/admin/colors/page.tsx` và `components/admin/colors/`.

### Giai đoạn 4: Kiểm thử và Thẩm định
1. Chạy E2E Test Suite: `node tests/run-e2e.ts --tier=1` (TC1.8, TC1.9, TC1.10, TC1.12).
2. Chạy E2E Boundary Tests: `node tests/run-e2e.ts --tier=2` (TC2.15, TC2.16, TC2.17, TC2.18).
3. Chạy E2E Combination Tests: `node tests/run-e2e.ts --tier=3` (TC3.4, TC3.5, TC3.6).
4. Chạy Toàn Bộ Test: `node tests/run-e2e.ts`.
5. Kiểm tra TypeScript: `npx tsc --noEmit`.

---

*Tài liệu này là đặc tả kiến trúc chính thức của M3 Explorer 1, phục vụ công tác triển khai của Worker M3 và thẩm định của Sentinel/Auditor.*
