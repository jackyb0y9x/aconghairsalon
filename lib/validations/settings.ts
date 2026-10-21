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

/**
 * Hàm chuẩn hóa và ánh xạ hai chiều cho Site Settings
 */
export function serializeSettings(setting: any) {
  if (!setting) return null;
  const openingHours = setting.openingHours || {};
  const socialLinks = setting.socialLinks || {};
  const defaultSeoMetadata = setting.defaultSeoMetadata || {};
  const footerContent = setting.footerContent || {};

  const openingHoursStr =
    typeof openingHours === 'string'
      ? openingHours
      : openingHours.rawText || openingHours.monday_friday || '08:30 - 20:30 Hàng ngày';

  return {
    id: setting.id || 'default_setting',
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
    openingHours: openingHoursStr,
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
