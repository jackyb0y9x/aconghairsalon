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

  startDate: z.string().optional().nullable().or(z.literal('')),
  endDate: z.string().optional().nullable().or(z.literal('')),
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

export const GenderTargetEnum = z.string().default('UNISEX');
export const HairLengthEnum = z.string().default('MEDIUM');
export const FaceShapeEnum = z.string().default('OVAL');
export const HairTextureEnum = z.string().default('STRAIGHT');
export const CareEffortEnum = z.string().default('MEDIUM');
export const StyleVibeEnum = z.string().default('KOREAN');

export const HairstyleCreateSchema = z.object({
  name: z.string().optional(),
  title: z.string().optional(),
  slug: z.string().optional(),

  summary: z.string().max(500).optional().nullable(),
  description: z.string().optional().default('Kiểu tóc thiết kế độc quyền tại Lumière Hair Atelier.'),
  features: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),

  coverImageUrl: z.string().optional(),
  images: z.array(z.string()).optional(),
  galleryImages: z.array(z.string()).optional(),

  gender: GenderTargetEnum.default('UNISEX'),
  length: HairLengthEnum.default('MEDIUM'),
  style: StyleVibeEnum.optional(),
  styleVibe: StyleVibeEnum.optional().default('KOREAN'),

  faceShape: z.union([FaceShapeEnum, z.array(FaceShapeEnum)]).optional().default('OVAL'),
  suitableFaces: z.array(FaceShapeEnum).optional(),

  texture: z.union([HairTextureEnum, z.array(HairTextureEnum)]).optional().default('STRAIGHT'),
  suitableTexture: z.array(HairTextureEnum).optional(),

  careLevel: CareEffortEnum.optional(),
  careEffort: CareEffortEnum.optional().default('MEDIUM'),

  price: z.coerce.number().optional(),
  priceRefMin: z.coerce.number().optional(),
  priceRefMax: z.coerce.number().optional(),

  careAdvice: z.string().optional().nullable(),
  stylingTips: z.string().optional().nullable(),

  isTrending: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),

  categoryId: z.string().optional(),
  serviceIds: z.array(z.string()).optional(),
}).refine((data) => {
  const hasName = Boolean((data.name && data.name.trim().length > 0) || (data.title && data.title.trim().length > 0));
  const hasSlug = Boolean(data.slug && data.slug.trim().length > 0);
  return hasName && hasSlug;
}, {
  message: 'Tên và đường dẫn kiểu tóc là bắt buộc',
  path: ['name'],
});

export const HairstyleUpdateSchema = z.object({
  name: z.string().optional(),
  title: z.string().optional(),
  slug: z.string().optional(),
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
  categoryId: z.string().optional(),
  serviceIds: z.array(z.string()).optional(),
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

const HairColorBaseSchema = z.object({
  name: z.string().min(2, 'Tên màu tóc tối thiểu 2 ký tự').max(100),
  code: z.string().optional(),

  hexCode: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Mã màu HEX không hợp lệ').optional(),
  hexColor: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Mã màu HEX không hợp lệ').optional(),
  secondaryHex: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Mã màu phụ không hợp lệ').optional().nullable(),

  tone: ColorToneEnum.default('NEUTRAL'),
  group: ColorGroupEnum.default('BROWN'),

  brightnessLevel: z.coerce.number().min(1).max(10).optional().default(6),
  brightness: z.enum(['LIGHT', 'MEDIUM', 'DARK']).optional(),

  requiresBleach: z.boolean().default(false),
  bleachRounds: z.coerce.number().int().min(0).max(5).default(0),

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
});

export const HairColorCreateSchema = HairColorBaseSchema.refine((data) => data.hexCode || data.hexColor, {
  message: 'Mã màu HEX là bắt buộc',
  path: ['hexCode'],
});

export const HairColorUpdateSchema = HairColorBaseSchema.partial();

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

// =============================================================================
// 5. BEFORE / AFTER SHOWCASE SCHEMAS & SERIALIZER
// =============================================================================

export const BeforeAfterCreateSchema = z.object({
  title: z.string().min(3, 'Tiêu đề tối thiểu 3 ký tự').max(200, 'Tiêu đề tối đa 200 ký tự'),
  description: z.string().max(2000, 'Mô tả tối đa 2000 ký tự').optional().nullable(),
  beforeImageUrl: z.string().min(1, 'Ảnh trước biến hóa là bắt buộc'),
  afterImageUrl: z.string().min(1, 'Ảnh sau biến hóa là bắt buộc'),
  customerGender: GenderTargetEnum.default('UNISEX'),
  serviceId: z.string().optional().nullable(),
  hairstyleId: z.string().optional().nullable(),
  stylistId: z.string().optional().nullable(),
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
    description: item.description || null,
    beforeImageUrl: item.beforeImageUrl,
    afterImageUrl: item.afterImageUrl,
    customerGender: item.customerGender || 'UNISEX',
    isFeatured: item.isFeatured ?? false,
    displayOrder: item.displayOrder ?? 0,
    serviceId: item.serviceId || null,
    service: item.service ? { id: item.service.id, title: item.service.title, slug: item.service.slug } : null,
    hairstyleId: item.hairstyleId || null,
    hairstyle: item.hairstyle ? { id: item.hairstyle.id, title: item.hairstyle.title, slug: item.hairstyle.slug } : null,
    stylistId: item.stylistId || null,
    stylist: item.stylist ? { id: item.stylist.id, fullName: item.stylist.fullName, avatarUrl: item.stylist.avatarUrl } : null,
    createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: item.updatedAt ? new Date(item.updatedAt).toISOString() : new Date().toISOString(),
  };
}

// =============================================================================
// 6. SERVICES & COMBOS SCHEMAS & SERIALIZER
// =============================================================================

const ServiceBaseSchema = z.object({
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
});

export const ServiceCreateSchema = ServiceBaseSchema.refine(data => data.title || data.name, {
  message: 'Tên dịch vụ là bắt buộc (title hoặc name)',
  path: ['title'],
});

export const ServiceUpdateSchema = ServiceBaseSchema.partial();

export const ServiceComboCreateSchema = z.object({
  title: z.string().min(2, 'Tên combo tối thiểu 2 ký tự').max(150).optional(),
  name: z.string().min(2).max(150).optional(),
  slug: z.string().min(2).max(150).optional(),
  description: z.string().min(10, 'Mô tả combo tối thiểu 10 ký tự'),
  packagePrice: z.coerce.number().min(0, 'Giá combo không hợp lệ'),
  originalPrice: z.coerce.number().min(0, 'Giá gốc không hợp lệ'),
  durationMinutes: z.coerce.number().int().min(30).max(600).default(120),
  savingsPercent: z.coerce.number().int().min(0).max(100).optional(),
  serviceIds: z.array(z.string()).min(1, 'Combo cần liên kết tối thiểu 1 dịch vụ'),
  imageUrl: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  displayOrder: z.coerce.number().int().min(0).default(0),
});

export const ServiceComboUpdateSchema = ServiceComboCreateSchema.partial();

export function serializeService(s: any) {
  if (!s) return null;
  const pMin = Number(s.priceMin ?? s.minPrice ?? 0);
  const pMax = s.priceMax !== null && s.priceMax !== undefined ? Number(s.priceMax) : s.maxPrice !== null && s.maxPrice !== undefined ? Number(s.maxPrice) : null;
  const categoryName = s.category?.name || (typeof s.category === 'string' ? s.category : 'HAIR_SERVICE');

  return {
    id: s.id,
    title: s.title || s.name || '',
    name: s.title || s.name || '', // Test fixture alias
    slug: s.slug,
    shortSummary: s.shortSummary || null,
    description: s.description || '',
    durationMinutes: s.durationMinutes ?? 45,
    priceMin: pMin,
    minPrice: pMin, // Test fixture alias
    priceMax: pMax,
    maxPrice: pMax, // Test fixture alias
    category: categoryName, // Test fixture alias
    categoryId: s.categoryId || null,
    categoryDetails: s.category && typeof s.category === 'object' ? { id: s.category.id, name: s.category.name, slug: s.category.slug } : null,
    preCareAdvice: s.preCareAdvice || null,
    postCareAdvice: s.postCareAdvice || null,
    imageUrl: s.imageUrl || null,
    isPopular: s.isPopular ?? false,
    isActive: s.isActive ?? true,
    displayOrder: s.displayOrder ?? 0,
    createdAt: s.createdAt ? new Date(s.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: s.updatedAt ? new Date(s.updatedAt).toISOString() : new Date().toISOString(),
  };
}

export function serializeServiceCombo(c: any) {
  if (!c) return null;
  const pkgPrice = Number(c.packagePrice);
  const origPrice = Number(c.originalPrice);
  const computedSavings = c.savingsPercent ?? (origPrice > 0 ? Math.round(((origPrice - pkgPrice) / origPrice) * 100) : 0);

  return {
    id: c.id,
    title: c.title || c.name || '',
    name: c.title || c.name || '',
    slug: c.slug,
    description: c.description || '',
    packagePrice: pkgPrice,
    originalPrice: origPrice,
    durationMinutes: c.durationMinutes ?? 120,
    savingsPercent: computedSavings,
    imageUrl: c.imageUrl || null,
    isActive: c.isActive ?? true,
    isFeatured: c.isFeatured ?? false,
    displayOrder: c.displayOrder ?? 0,
    services: Array.isArray(c.services) ? c.services.map(serializeService) : [],
    createdAt: c.createdAt ? new Date(c.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: c.updatedAt ? new Date(c.updatedAt).toISOString() : new Date().toISOString(),
  };
}

// =============================================================================
// 7. ARTICLE SCHEMAS & SERIALIZER
// =============================================================================

export const ArticleCreateSchema = z.object({
  title: z.string().min(3, 'Tiêu đề bài viết tối thiểu 3 ký tự').max(200, 'Tiêu đề tối đa 200 ký tự'),
  slug: z.string().min(3).max(200).optional(),
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
  categoryId: z.string().optional().nullable(),
  authorId: z.string().optional(),
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
    metaTitle: a.metaTitle || sTitle,
    metaDescription: a.metaDescription || sDesc,
    metaKeywords: a.metaKeywords || null,
    seoTitle: sTitle,
    seoDescription: sDesc,

    // Publication flags + Aliases
    isPublished: isPub,
    published: isPub,
    publishedAt: a.publishedAt ? new Date(a.publishedAt).toISOString() : null,
    viewCount: a.viewCount ?? 0,

    // Author & Category
    authorId: a.authorId,
    author: a.author ? { id: a.author.id, fullName: a.author.fullName, avatarUrl: a.author.avatarUrl } : null,
    authorName: a.author?.fullName || 'Lumière Editorial',
    categoryId: a.categoryId || null,
    category: a.category ? { id: a.category.id, name: a.category.name, slug: a.category.slug } : null,

    createdAt: a.createdAt ? new Date(a.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: a.updatedAt ? new Date(a.updatedAt).toISOString() : new Date().toISOString(),
  };
}
