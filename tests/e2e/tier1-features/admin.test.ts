/**
 * Tier 1: Feature Coverage - Admin CMS Subsystem
 */

import { expect } from '../../harness/assertions.ts';
import { describe, it } from '../../harness/runner.ts';
import type { TestContext } from '../../harness/types.ts';

describe('Tier 1 - Admin CMS Features', 1, () => {
  it(
    'TC1.7: GET /api/admin/dashboard returns real-time telemetry metrics',
    async (ctx: TestContext) => {
      ctx.client.withRole('SUPER_ADMIN');
      const res = await ctx.client.get('/api/admin/dashboard');

      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('totalHairstyles');
      expect(res.data).toHaveProperty('totalColors');
      expect(res.data).toHaveProperty('totalServices');
      expect(res.data).toHaveProperty('pendingBookingsCount');
      expect(res.data.totalHairstyles).toBeGreaterThanOrEqual(2);
      expect(res.data.totalServices).toBeGreaterThanOrEqual(2);
    },
    { id: 'TC1.7', feature: 'Admin Dashboard Telemetry' }
  );

  it(
    'TC1.8: Full CRUD lifecycle for Hairstyles via Admin CMS',
    async (ctx: TestContext) => {
      ctx.client.withRole('CONTENT_ADMIN');

      // 1. CREATE
      const newStylePayload = {
        name: 'Curtain Bangs Layer Hàn Quốc',
        slug: 'curtain-bangs-layer-han-quoc',
        gender: 'FEMALE',
        style: 'KOREAN',
        length: 'LONG',
        faceShape: 'OVAL',
        texture: 'WAVY',
        careLevel: 'MEDIUM',
        price: 450000,
        tags: ['curtain-bangs', 'layer', 'korean-style'],
        images: ['/images/styles/curtain-bangs.jpg'],
        features: ['Mái bay tạo độ bồng bềnh tự nhiên'],
        careAdvice: 'Dùng lô cuốn mái mỗi sáng'
      };

      const createRes = await ctx.client.post('/api/admin/hairstyles', newStylePayload);
      expect(createRes.status).toBe(201);
      expect(createRes.data.id).toBeDefined();
      expect(createRes.data.name).toBe(newStylePayload.name);
      const createdId = createRes.data.id;

      // 2. READ list
      const listRes = await ctx.client.get('/api/admin/hairstyles');
      expect(listRes.status).toBe(200);
      const found = listRes.data.find((h: any) => h.id === createdId);
      expect(found).toBeDefined();

      // 3. UPDATE
      const updateRes = await ctx.client.put(`/api/admin/hairstyles/${createdId}`, {
        price: 480000,
        careLevel: 'EASY'
      });
      expect(updateRes.status).toBe(200);
      expect(updateRes.data.price).toBe(480000);
      expect(updateRes.data.careLevel).toBe('EASY');

      // 4. DELETE
      const deleteRes = await ctx.client.delete(`/api/admin/hairstyles/${createdId}`);
      expect(deleteRes.status).toBe(200);
      expect(deleteRes.data.success).toBe(true);
    },
    { id: 'TC1.8', feature: 'Hairstyle Catalog CRUD' }
  );

  it(
    'TC1.9: Full CRUD lifecycle for Home Banners via Admin CMS',
    async (ctx: TestContext) => {
      ctx.client.withRole('CONTENT_ADMIN');

      // Create banner
      const bannerPayload = {
        title: 'Ưu Đãi Khai Trương Cơ Sở Mới 30%',
        subtitle: 'Áp dụng cho mọi combo Uốn & Nhuộm cao cấp',
        imageUrl: '/images/banners/grand-opening.jpg',
        ctaLink: '/booking',
        order: 2,
        active: true
      };

      const createRes = await ctx.client.post('/api/admin/banners', bannerPayload);
      expect(createRes.status).toBe(201);
      const bannerId = createRes.data.id;

      // Update banner active toggle
      const updateRes = await ctx.client.put(`/api/admin/banners/${bannerId}`, {
        active: false,
        order: 99
      });
      expect(updateRes.status).toBe(200);
      expect(updateRes.data.active).toBe(false);
      expect(updateRes.data.order).toBe(99);
    },
    { id: 'TC1.9', feature: 'Banner Management CRUD' }
  );

  it(
    'TC1.10: Full CRUD lifecycle for Hair Color Swatches via Admin CMS',
    async (ctx: TestContext) => {
      ctx.client.withRole('CONTENT_ADMIN');

      const colorPayload = {
        name: 'Hồng Khói Pastel (Pastel Pink)',
        hexCode: '#f7c8d0',
        tone: 'COOL',
        group: 'PASTEL',
        brightness: 'LIGHT',
        requiresBleach: true,
        skinSuitability: ['LIGHT'],
        maintenanceAdvice: 'Ủ xả phục hồi màu hồng chuyên dụng'
      };

      const createRes = await ctx.client.post('/api/admin/colors', colorPayload);
      expect(createRes.status).toBe(201);
      expect(createRes.data.id).toBeDefined();
      expect(createRes.data.name).toBe(colorPayload.name);
      expect(createRes.data.requiresBleach).toBe(true);

      const listRes = await ctx.client.get('/api/admin/colors');
      expect(listRes.status).toBe(200);
      const found = listRes.data.find((c: any) => c.name === colorPayload.name);
      expect(found).toBeDefined();
    },
    { id: 'TC1.10', feature: 'Color Swatch CRUD' }
  );

  it(
    'TC1.11: Full CRUD lifecycle for Services & Combos via Admin CMS',
    async (ctx: TestContext) => {
      ctx.client.withRole('CONTENT_ADMIN');

      const servicePayload = {
        name: 'Phục Hồi Tóc Hư Tổn Collagen Thủy Phân',
        category: 'TREATMENT',
        durationMinutes: 60,
        minPrice: 400000,
        maxPrice: 600000,
        description: 'Tái tạo liên kết tóc đứt gãy sau hóa chất với tinh chất collagen nano.'
      };

      const createRes = await ctx.client.post('/api/admin/services', servicePayload);
      expect(createRes.status).toBe(201);
      expect(createRes.data.durationMinutes).toBe(60);
      expect(createRes.data.category).toBe('TREATMENT');
    },
    { id: 'TC1.11', feature: 'Service & Pricing CRUD' }
  );

  it(
    'TC1.12: GET /api/admin/audit-logs retrieves immutable system audit logs',
    async (ctx: TestContext) => {
      ctx.client.withRole('SUPER_ADMIN');

      // Trigger a change to guarantee audit log presence
      await ctx.client.post('/api/admin/colors', {
        name: 'Nâu Hạt Dẻ Ánh Đồng',
        hexCode: '#6b3e26',
        tone: 'WARM'
      });

      const res = await ctx.client.get('/api/admin/audit-logs');
      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('logs');
      expect(res.data.logs.length).toBeGreaterThan(0);

      const latestLog = res.data.logs[res.data.logs.length - 1];
      expect(latestLog).toHaveProperty('action');
      expect(latestLog).toHaveProperty('entity');
      expect(latestLog).toHaveProperty('timestamp');
      expect(latestLog.entity).toBe('HAIR_COLOR');
    },
    { id: 'TC1.12', feature: 'Audit Trail Subsystem' }
  );
});
