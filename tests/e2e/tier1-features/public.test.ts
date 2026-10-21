/**
 * Tier 1: Feature Coverage - Public Website Subsystem
 */

import { expect } from '../../harness/assertions.ts';
import { describe, it } from '../../harness/runner.ts';
import type { TestContext } from '../../harness/types.ts';

describe('Tier 1 - Public Website Features', 1, () => {
  it(
    'TC1.1: GET /api/public/home returns complete dynamic sections configured from CMS',
    async (ctx: TestContext) => {
      const res = await ctx.client.get('/api/public/home');
      expect(res.status).toBe(200);
      expect(res.data).toBeDefined();

      // Verify branding and CMS sections
      expect(res.data).toHaveProperty('branding');
      expect(res.data.branding.brandName).toBe('Salon Hoàng Gia Prestige');
      expect(res.data).toHaveProperty('banners');
      expect(res.data.banners.length).toBeGreaterThan(0);
      expect(res.data).toHaveProperty('categories');
      expect(res.data.categories).toContain('Nam');
      expect(res.data.categories).toContain('Nữ');
      expect(res.data).toHaveProperty('trendingHairstyles');
      expect(res.data.trendingHairstyles.length).toBeGreaterThan(0);
      expect(res.data).toHaveProperty('services');
      expect(res.data.services.length).toBeGreaterThan(0);
      expect(res.data).toHaveProperty('articles');
    },
    { id: 'TC1.1', feature: 'Public Home Page' }
  );

  it(
    'TC1.2: GET /api/public/hairstyles supports 6-criteria multi-filtering',
    async (ctx: TestContext) => {
      // 1. Unfiltered query
      const allRes = await ctx.client.get('/api/public/hairstyles');
      expect(allRes.status).toBe(200);
      expect(allRes.data.items).toBeDefined();
      expect(allRes.data.total).toBeGreaterThanOrEqual(2);

      // 2. Filter by gender=FEMALE & length=SHORT
      const filteredRes = await ctx.client.get('/api/public/hairstyles?gender=FEMALE&length=SHORT');
      expect(filteredRes.status).toBe(200);
      expect(filteredRes.data.items.length).toBe(1);
      expect(filteredRes.data.items[0].slug).toBe('french-bob-tu-nhien');

      // 3. Filter by style=KOREAN & faceShape=ROUND
      const koreanRes = await ctx.client.get('/api/public/hairstyles?style=KOREAN&faceShape=ROUND');
      expect(koreanRes.status).toBe(200);
      expect(koreanRes.data.items.length).toBe(1);
      expect(koreanRes.data.items[0].slug).toBe('korean-wolf-cut-textured');
    },
    { id: 'TC1.2', feature: 'Hairstyle Library Filtering' }
  );

  it(
    'TC1.3: GET /api/public/hairstyles/:slug returns detailed style specs and care guidelines',
    async (ctx: TestContext) => {
      const res = await ctx.client.get('/api/public/hairstyles/korean-wolf-cut-textured');
      expect(res.status).toBe(200);
      expect(res.data.name).toBe('Korean Wolf Cut Textured');
      expect(res.data.price).toBe(350000);
      expect(res.data.careAdvice).toContain('Sấy tạo phồng');
      expect(res.data.features.length).toBeGreaterThan(0);

      // Non-existent slug returns 404
      const notFoundRes = await ctx.client.get('/api/public/hairstyles/non-existent-hair-slug');
      expect(notFoundRes.status).toBe(404);
    },
    { id: 'TC1.3', feature: 'Hairstyle Detail View' }
  );

  it(
    'TC1.4: GET /api/public/colors returns categorized swatch catalog and maintenance advice',
    async (ctx: TestContext) => {
      const res = await ctx.client.get('/api/public/colors');
      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('colors');
      expect(res.data.colors.length).toBeGreaterThanOrEqual(2);

      // Verify bleached vs non-bleached color swatches
      const ashBlonde = res.data.colors.find((c: any) => c.id === 'col-ash-blonde');
      expect(ashBlonde).toBeDefined();
      expect(ashBlonde.requiresBleach).toBe(true);
      expect(ashBlonde.tone).toBe('COOL');
      expect(ashBlonde.maintenanceAdvice).toContain('dầu gội tím');

      const chocBrown = res.data.colors.find((c: any) => c.id === 'col-chocolate-brown');
      expect(chocBrown).toBeDefined();
      expect(chocBrown.requiresBleach).toBe(false);
      expect(chocBrown.tone).toBe('WARM');
    },
    { id: 'TC1.4', feature: 'Color Swatch Catalog' }
  );

  it(
    'TC1.5: GET /api/public/services returns transparent price tiers and durations',
    async (ctx: TestContext) => {
      const res = await ctx.client.get('/api/public/services');
      expect(res.status).toBe(200);
      expect(res.data.services.length).toBeGreaterThanOrEqual(2);

      const cutService = res.data.services.find((s: any) => s.category === 'CUT');
      expect(cutService).toBeDefined();
      expect(cutService.durationMinutes).toBe(45);
      expect(cutService.minPrice).toBe(250000);
      expect(cutService.maxPrice).toBe(350000);
    },
    { id: 'TC1.5', feature: 'Services & Pricing Transparency' }
  );

  it(
    'TC1.6: GET /api/public/articles returns published articles with SEO metadata',
    async (ctx: TestContext) => {
      const res = await ctx.client.get('/api/public/articles');
      expect(res.status).toBe(200);
      expect(res.data.articles.length).toBeGreaterThan(0);

      const article = res.data.articles[0];
      expect(article.published).toBe(true);
      expect(article.seoTitle).toContain('Bí Quyết Giữ Nếp Tóc Layer');
      expect(article.seoDescription).toBeDefined();
    },
    { id: 'TC1.6', feature: 'News & Blog Knowledge' }
  );
});
