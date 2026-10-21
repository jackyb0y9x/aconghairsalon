import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import fs from 'fs';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { verifySession, extractAuthToken } from '@/lib/auth';
import { SiteSettingsUpdateSchema, serializeSettings } from '@/lib/validations/settings';
import { logAuditEvent } from '@/services/audit';
import { memoryStore } from '@/lib/memory-store';

export const dynamic = 'force-dynamic';

let lastDbFailureTime = 0;
function isDbDown(): boolean {
  return Date.now() - lastDbFailureTime < 30000;
}
function markDbDown() {
  lastDbFailureTime = Date.now();
}

async function withDbTimeout<T>(promise: Promise<T>, ms = 8000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('DATABASE_CONNECTION_TIMEOUT')), ms)
    ),
  ]);
}

const DEFAULT_SETTINGS = {
  id: 'default_setting',
  brandName: 'Công Nguyễn Hair Salon',
  brandSlogan: 'Định Hình Khí Chất - Tỏa Sáng Phong Cách',
  hotlinePrimary: '0988 888 888',
  emailContact: 'contact@congnguyenhair.vn',
  addressFull: 'Nguyệt Áng 3, An Khánh, Hải Phòng',
  openingHours: {
    monday_friday: '08:30 - 21:00',
    weekend: '08:00 - 21:30',
    rawText: '08:30 - 20:30 Hàng ngày',
  },
  socialLinks: {
    facebook: 'https://facebook.com/congnguyenhair',
    instagram: 'https://instagram.com/congnguyenhair',
    tiktok: 'https://tiktok.com/@congnguyenhair',
    zalo: '0988 888 888',
  },
  defaultSeoMetadata: {
    title: 'Công Nguyễn Hair Salon | Salon Tóc Nam & Nữ Hiện Đại',
    description:
      'Salon tóc Nam và Nữ cao cấp tại Nguyệt Áng 3, An Khánh, Hải Phòng. Đội ngũ thợ tay nghề cao, cập nhật xu hướng tóc châu Á và công nghệ thử màu tóc trực tuyến.',
    ogImage: '/images/og-default.jpg',
  },
  footerContent: {},
};

let inMemorySettings: any = { ...DEFAULT_SETTINGS };

// Helper function to authenticate session and strictly enforce SUPER_ADMIN role
async function authenticateSuperAdmin(request: NextRequest) {
  const token = extractAuthToken(request);

  if (!token) {
    return { error: 'Unauthorized: Vui lòng đăng nhập với tài khoản quản trị', status: 401 };
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

export async function GET(request: NextRequest) {
  const auth = await authenticateSuperAdmin(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let setting: any = null;
  try {
    setting = await prisma.siteSetting.findUnique({
      where: { id: 'default_setting' },
    });

    if (!setting) {
      setting = await prisma.siteSetting.create({
        data: DEFAULT_SETTINGS,
      });
    }
    if (setting) {
      memoryStore.setSiteSettings(setting);
    }
  } catch (error) {
    console.warn('[Settings GET] DB query warning, falling back to cache:', error);
    setting = memoryStore.getSiteSettings() || inMemorySettings || DEFAULT_SETTINGS;
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

  // Retrieve existing settings from DB or memory fallback
  let current: any = memoryStore.getSiteSettings() || inMemorySettings || DEFAULT_SETTINGS;
  try {
    const dbSetting = await prisma.siteSetting.findUnique({
      where: { id: 'default_setting' },
    });
    if (dbSetting) {
      current = dbSetting;
    }
  } catch (err) {
    console.warn('[Settings PUT] DB fetch warning:', err);
  }

  // Deep merge nested fields with defaults so partial updates preserve sibling fields (TC2.20 / VULN-M2-01)
  const currentOpening =
    typeof current.openingHours === 'object' && current.openingHours !== null
      ? { ...DEFAULT_SETTINGS.openingHours, ...current.openingHours }
      : { ...DEFAULT_SETTINGS.openingHours };

  const currentSocial =
    typeof current.socialLinks === 'object' && current.socialLinks !== null
      ? { ...DEFAULT_SETTINGS.socialLinks, ...current.socialLinks }
      : { ...DEFAULT_SETTINGS.socialLinks };

  const currentSeo =
    typeof current.defaultSeoMetadata === 'object' && current.defaultSeoMetadata !== null
      ? { ...DEFAULT_SETTINGS.defaultSeoMetadata, ...current.defaultSeoMetadata }
      : { ...DEFAULT_SETTINGS.defaultSeoMetadata };

  const currentFooter =
    typeof current.footerContent === 'object' && current.footerContent !== null
      ? { ...DEFAULT_SETTINGS.footerContent, ...current.footerContent }
      : { ...DEFAULT_SETTINGS.footerContent };

  // Partial update merge
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
  if (input.googleMapsEmbedUrl !== undefined)
    updateData.googleMapsEmbedUrl = input.googleMapsEmbedUrl;

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

  // Merge socialLinks (deep merge preserves sibling fields like facebook, tiktok, zalo)
  const mergedSocial = { ...currentSocial, ...(input.socialLinks || {}) };
  if (input.socialFacebook !== undefined) mergedSocial.facebook = input.socialFacebook;
  if (input.socialInstagram !== undefined) mergedSocial.instagram = input.socialInstagram;
  if (input.socialTikTok !== undefined) mergedSocial.tiktok = input.socialTikTok;
  if (input.socialZalo !== undefined) mergedSocial.zalo = input.socialZalo;
  if (Object.keys(mergedSocial).length > 0) updateData.socialLinks = mergedSocial;

  // Merge defaultSeoMetadata (deep merge preserves sibling fields like description, ogImage)
  const mergedSeo = { ...currentSeo, ...(input.defaultSeoMetadata || {}) };
  if (input.defaultMetaTitle !== undefined) mergedSeo.title = input.defaultMetaTitle;
  if (input.defaultMetaDescription !== undefined) mergedSeo.description = input.defaultMetaDescription;
  if (Object.keys(mergedSeo).length > 0) updateData.defaultSeoMetadata = mergedSeo;

  // Merge footerContent (deep merge preserves sibling fields like taxCode, licenseText)
  const mergedFooter = { ...currentFooter, ...(input.footerContent || {}) };
  if (input.footerText !== undefined) mergedFooter.copyright = input.footerText;
  if (Object.keys(mergedFooter).length > 0) updateData.footerContent = mergedFooter;

  let updated: any = {
    ...current,
    ...updateData,
    updatedAt: new Date(),
  };

  try {
    const dbUpdated = await prisma.siteSetting.upsert({
      where: { id: 'default_setting' },
      update: updateData,
      create: {
        id: 'default_setting',
        ...current,
        ...updateData,
      },
    });
    if (dbUpdated) updated = dbUpdated;
  } catch (dbErr) {
    console.error('[Site Settings API] DB update fallback:', dbErr);
  }

  // Keep in-memory and disk fallback states updated and synchronized
  memoryStore.setSiteSettings(updated);
  inMemorySettings = updated;

  // Also write to data/site-settings.json on disk for persistent mock storage if disk is writable
  try {
    const filePath = path.join(process.cwd(), 'data', 'site-settings.json');
    fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), 'utf-8');
  } catch (fsErr) {
    // Disk write might fail in read-only environment like Vercel
  }

  // Trigger cache revalidation on public pages
  try {
    revalidatePath('/', 'layout');
    revalidatePath('/');
  } catch {}

  // Record audit event asynchronously without blocking response
  logAuditEvent({
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
  }).catch(() => {});

  // Revalidate public layout and homepage cache in background
  try {
    revalidatePath('/', 'layout');
    revalidatePath('/');
  } catch {
    // Ignore in non-runtime environments
  }

  return NextResponse.json(serializeSettings(updated));
}

export async function POST(request: NextRequest) {
  return PUT(request);
}
