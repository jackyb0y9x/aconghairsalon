/**
 * In-Memory Fallback Data Store for Lumière Hair Atelier
 * Provides resilient, stateful fallback when PostgreSQL database is unreachable
 * (e.g. CI environments, local test harnesses, offline development).
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const SETTINGS_FILE = path.join(DATA_DIR, 'site-settings.json');

function readSettingsFromDisk() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const raw = fs.readFileSync(SETTINGS_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    // ignore
  }
  return null;
}

function writeSettingsToDisk(data: any) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[MemoryStore] Could not write site-settings.json:', err);
  }
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
}

class MemoryStore {
  public banners: any[] = [];
  public categories: any[] = [];
  public hairstyles: any[] = [];
  public hairColors: any[] = [];
  public beforeAfters: any[] = [];
  public services: any[] = [];
  public combos: any[] = [];
  public articles: any[] = [];
  public bookings: any[] = [];
  public siteSettings: any = null;

  getSiteSettings() {
    if (!this.siteSettings) {
      this.siteSettings = readSettingsFromDisk();
    }
    return this.siteSettings;
  }

  setSiteSettings(settings: any) {
    this.siteSettings = {
      ...(this.siteSettings || {}),
      ...settings,
      updatedAt: new Date(),
    };
    writeSettingsToDisk(this.siteSettings);
    return this.siteSettings;
  }

  constructor() {
    this.siteSettings = readSettingsFromDisk();
    this.seedDefaults();
  }

  private seedDefaults() {
    this.categories.push({
      id: 'cat-default',
      name: 'Kiểu Tóc Nữ Cao Cấp',
      slug: 'kieu-toc-nu-cao-cap',
      description: 'Bộ sưu tập kiểu tóc thời thượng',
      displayOrder: 1,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    this.banners.push(
      {
        id: 'ban-01',
        title: 'Bộ Sưu Tập Tóc Thời Trang Công Nguyễn 2026',
        subtitle: 'Khám phá phong cách thanh lịch cùng Stylist hàng đầu tại Hải Phòng',
        badgeText: 'BỘ SƯU TẬP MỚI 2026',
        imageUrl: '/images/banners/hero-banner-bloganchoi-1.jpg',
        linkUrl: '/hairstyles',
        ctaText: 'Khám Phá Ngay',
        displayOrder: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'ban-02',
        title: 'Sắc Nâu Trà Sữa Tôn Da Xu Hướng 2026',
        subtitle: 'Tôn vinh làn da sáng mịn tự nhiên với bảng màu nhuộm cao cấp không amoniac',
        badgeText: 'MÀU NHUỘM HOT TREND',
        imageUrl: '/images/banners/hero-banner-bloganchoi-3.jpg',
        linkUrl: '/colors',
        ctaText: 'Khám Phá Bảng Màu',
        displayOrder: 2,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'ban-03',
        title: 'Nghệ Thuật Uốn Sóng & Nhuộm Nâu Tro Mờ Hải Phòng',
        subtitle: 'Độ bóng mượt hoàn hảo, không xơ rối với kỹ thuật phục hồi chuyên sâu',
        badgeText: 'DỊCH VỤ NỔI BẬT',
        imageUrl: '/images/banners/hero-banner-bloganchoi-2.jpg',
        linkUrl: '/colors',
        ctaText: 'Tư Vấn Màu Nhuộm',
        displayOrder: 3,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'ban-04',
        title: 'Nhuộm Nâu Xám Lanh Sang Trọng & Tôn Da',
        subtitle: 'Sắc màu thời thượng chuẩn xu hướng 2025-2026, nâng tầm khí chất',
        badgeText: 'MÀU NHUỘM HOT TREND',
        imageUrl: '/images/banners/hero-banner-bloganchoi-4.jpg',
        linkUrl: '/booking',
        ctaText: 'Đặt Lịch Trải Nghiệm',
        displayOrder: 4,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    );
  }

  // --- BANNERS ---
  createBanner(data: any) {
    const banner = {
      id: generateId('ban'),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.banners.push(banner);
    return banner;
  }

  findBanners(where?: any) {
    let list = [...this.banners];
    if (where?.isActive !== undefined) {
      list = list.filter((b) => b.isActive === where.isActive);
    }
    return list.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }

  findBannerById(id: string) {
    return this.banners.find((b) => b.id === id) || null;
  }

  updateBanner(id: string, data: any) {
    const idx = this.banners.findIndex((b) => b.id === id);
    if (idx === -1) return null;
    this.banners[idx] = { ...this.banners[idx], ...data, updatedAt: new Date() };
    return this.banners[idx];
  }

  deleteBanner(id: string) {
    const idx = this.banners.findIndex((b) => b.id === id);
    if (idx === -1) return null;
    const removed = this.banners[idx];
    this.banners.splice(idx, 1);
    return removed;
  }

  // --- CATEGORIES ---
  createCategory(data: any) {
    const cat = {
      id: generateId('cat'),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.categories.push(cat);
    return cat;
  }

  findCategories() {
    return [...this.categories].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }

  findCategoryById(id: string) {
    return this.categories.find((c) => c.id === id) || null;
  }

  updateCategory(id: string, data: any) {
    const idx = this.categories.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    this.categories[idx] = { ...this.categories[idx], ...data, updatedAt: new Date() };
    return this.categories[idx];
  }

  deleteCategory(id: string) {
    const idx = this.categories.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    const removed = this.categories[idx];
    this.categories.splice(idx, 1);
    return removed;
  }

  // --- HAIRSTYLES ---
  createHairstyle(data: any) {
    const style = {
      id: generateId('hs'),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.hairstyles.push(style);
    return style;
  }

  findHairstyles(where?: any) {
    let list = [...this.hairstyles];
    if (where?.categoryId) list = list.filter((h) => h.categoryId === where.categoryId);
    if (where?.gender) list = list.filter((h) => h.gender === where.gender);
    if (where?.length) list = list.filter((h) => h.length === where.length);
    if (where?.isActive !== undefined) list = list.filter((h) => h.isActive === where.isActive);
    return list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  findHairstyleById(id: string) {
    return this.hairstyles.find((h) => h.id === id) || null;
  }

  updateHairstyle(id: string, data: any) {
    const idx = this.hairstyles.findIndex((h) => h.id === id);
    if (idx === -1) return null;
    this.hairstyles[idx] = { ...this.hairstyles[idx], ...data, updatedAt: new Date() };
    return this.hairstyles[idx];
  }

  deleteHairstyle(id: string) {
    const idx = this.hairstyles.findIndex((h) => h.id === id);
    if (idx === -1) return null;
    const removed = this.hairstyles[idx];
    this.hairstyles.splice(idx, 1);
    return removed;
  }

  // --- HAIR COLORS ---
  createHairColor(data: any) {
    const color = {
      id: generateId('col'),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.hairColors.push(color);
    return color;
  }

  findHairColors() {
    return [...this.hairColors].sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  findHairColorById(id: string) {
    return this.hairColors.find((c) => c.id === id) || null;
  }

  updateHairColor(id: string, data: any) {
    const idx = this.hairColors.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    this.hairColors[idx] = { ...this.hairColors[idx], ...data, updatedAt: new Date() };
    return this.hairColors[idx];
  }

  deleteHairColor(id: string) {
    const idx = this.hairColors.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    const removed = this.hairColors[idx];
    this.hairColors.splice(idx, 1);
    return removed;
  }

  // --- BEFORE / AFTER ---
  createBeforeAfter(data: any) {
    const item = {
      id: generateId('ba'),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.beforeAfters.push(item);
    return item;
  }

  findBeforeAfters() {
    return [...this.beforeAfters].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  findBeforeAfterById(id: string) {
    return this.beforeAfters.find((b) => b.id === id) || null;
  }

  updateBeforeAfter(id: string, data: any) {
    const idx = this.beforeAfters.findIndex((b) => b.id === id);
    if (idx === -1) return null;
    this.beforeAfters[idx] = { ...this.beforeAfters[idx], ...data, updatedAt: new Date() };
    return this.beforeAfters[idx];
  }

  deleteBeforeAfter(id: string) {
    const idx = this.beforeAfters.findIndex((b) => b.id === id);
    if (idx === -1) return null;
    const removed = this.beforeAfters[idx];
    this.beforeAfters.splice(idx, 1);
    return removed;
  }

  // --- SERVICES & COMBOS ---
  createService(data: any) {
    const srv = {
      id: generateId('srv'),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.services.push(srv);
    return srv;
  }

  findServices() {
    return [...this.services].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }

  findServiceById(id: string) {
    return this.services.find((s) => s.id === id) || null;
  }

  updateService(id: string, data: any) {
    const idx = this.services.findIndex((s) => s.id === id);
    if (idx === -1) return null;
    this.services[idx] = { ...this.services[idx], ...data, updatedAt: new Date() };
    return this.services[idx];
  }

  deleteService(id: string) {
    const idx = this.services.findIndex((s) => s.id === id);
    if (idx === -1) return null;
    const removed = this.services[idx];
    this.services.splice(idx, 1);
    return removed;
  }

  createCombo(data: any) {
    const combo = {
      id: generateId('cmb'),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.combos.push(combo);
    return combo;
  }

  findCombos() {
    return [...this.combos].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  findComboById(id: string) {
    return this.combos.find((c) => c.id === id) || null;
  }

  updateCombo(id: string, data: any) {
    const idx = this.combos.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    this.combos[idx] = { ...this.combos[idx], ...data, updatedAt: new Date() };
    return this.combos[idx];
  }

  deleteCombo(id: string) {
    const idx = this.combos.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    const removed = this.combos[idx];
    this.combos.splice(idx, 1);
    return removed;
  }

  // --- ARTICLES ---
  createArticle(data: any) {
    const art = {
      id: generateId('art'),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.articles.push(art);
    return art;
  }

  findArticles() {
    return [...this.articles].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  findArticleById(id: string) {
    return this.articles.find((a) => a.id === id) || null;
  }

  updateArticle(id: string, data: any) {
    const idx = this.articles.findIndex((a) => a.id === id);
    if (idx === -1) return null;
    this.articles[idx] = { ...this.articles[idx], ...data, updatedAt: new Date() };
    return this.articles[idx];
  }

  deleteArticle(id: string) {
    const idx = this.articles.findIndex((a) => a.id === id);
    if (idx === -1) return null;
    const removed = this.articles[idx];
    this.articles.splice(idx, 1);
    return removed;
  }

  // --- BOOKINGS ---
  createBooking(data: any) {
    if (data.idempotencyKey) {
      const existing = this.findBookingByIdempotency(data.idempotencyKey);
      if (existing) {
        return existing;
      }
    }
    const booking = {
      id: generateId('bk'),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.bookings.push(booking);
    return booking;
  }

  findBookings() {
    return [...this.bookings].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  findBookingById(id: string) {
    return this.bookings.find((b) => b.id === id) || null;
  }

  findBookingByIdempotency(key: string) {
    return this.bookings.find((b) => b.idempotencyKey === key) || null;
  }

  updateBooking(id: string, data: any) {
    const idx = this.bookings.findIndex((b) => b.id === id);
    if (idx === -1) return null;
    this.bookings[idx] = { ...this.bookings[idx], ...data, updatedAt: new Date() };
    return this.bookings[idx];
  }
}

declare global {
  // eslint-disable-next-line no-var
  var memoryStoreGlobal: MemoryStore | undefined;
}

export const memoryStore = globalThis.memoryStoreGlobal ?? new MemoryStore();
globalThis.memoryStoreGlobal = memoryStore;
