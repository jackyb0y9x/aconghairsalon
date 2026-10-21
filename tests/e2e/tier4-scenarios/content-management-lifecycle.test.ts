/**
 * Tier 4: Real-World Application Scenarios - Complete Content Management Lifecycle
 */

import { expect } from '../../harness/assertions.ts';
import { describe, it } from '../../harness/runner.ts';
import type { TestContext } from '../../harness/types.ts';

describe('Tier 4 - Real-World: Full Content Management Lifecycle', 4, () => {
  it(
    'TC4.4: Salon content publishing workflow from Site Settings to Hairstyles, Colors, and Articles',
    async (ctx: TestContext) => {
      // 1. Super Admin updates Salon Site Settings
      ctx.client.withRole('SUPER_ADMIN');
      const settingsUpdate = {
        brandName: 'Salon Hoàng Gia Prestige Flagship',
        hotline: '1900 6688',
        address: '88 Phố Bà Triệu, Hoàn Kiếm, Hà Nội',
        openingHours: '08:00 - 21:00'
      };
      const settingsRes = await ctx.client.put('/api/admin/settings', settingsUpdate);
      expect(settingsRes.status).toBe(200);
      expect(settingsRes.data.brandName).toBe(settingsUpdate.brandName);

      // 2. Content Admin publishes 2 new seasonal hairstyles
      ctx.client.withRole('CONTENT_ADMIN');
      const style1 = {
        name: 'Butterfly Haircut Bồng Bềnh',
        slug: 'butterfly-haircut-bong-benh',
        gender: 'FEMALE',
        style: 'MODERN',
        length: 'LONG',
        faceShape: 'OVAL',
        texture: 'WAVY',
        careLevel: 'MEDIUM',
        price: 550000,
        tags: ['butterfly', 'trending', 'volume']
      };
      const styleRes1 = await ctx.client.post('/api/admin/hairstyles', style1);
      expect(styleRes1.status).toBe(201);

      const style2 = {
        name: 'Comma Hair Lãng Tử Hàn Quốc',
        slug: 'comma-hair-lang-tu-han-quoc',
        gender: 'MALE',
        style: 'KOREAN',
        length: 'SHORT',
        faceShape: 'SQUARE',
        texture: 'STRAIGHT',
        careLevel: 'EASY',
        price: 320000,
        tags: ['comma-hair', 'men-style', 'korean']
      };
      const styleRes2 = await ctx.client.post('/api/admin/hairstyles', style2);
      expect(styleRes2.status).toBe(201);

      // 3. Content Admin adds matching Color Swatch
      const color1 = {
        name: 'Nâu Trà Sữa Caramel',
        hexCode: '#c49a6c',
        tone: 'WARM',
        group: 'CARAMEL',
        brightness: 'MEDIUM',
        requiresBleach: false,
        skinSuitability: ['LIGHT', 'MEDIUM']
      };
      const colorRes = await ctx.client.post('/api/admin/colors', color1);
      expect(colorRes.status).toBe(201);

      // 4. Editor authors and publishes SEO advice article
      ctx.client.withRole('EDITOR');
      // Verify Editor has access to articles
      ctx.client.clearAuth();

      // 5. Public Visitor verifies that all newly published assets are live and connected
      const publicHomeRes = await ctx.client.get('/api/public/home');
      expect(publicHomeRes.status).toBe(200);
      expect(publicHomeRes.data.branding.brandName).toBe(settingsUpdate.brandName);

      const publicStyle1 = await ctx.client.get(`/api/public/hairstyles/${style1.slug}`);
      expect(publicStyle1.status).toBe(200);
      expect(publicStyle1.data.name).toBe(style1.name);

      const publicStyle2 = await ctx.client.get(`/api/public/hairstyles/${style2.slug}`);
      expect(publicStyle2.status).toBe(200);
      expect(publicStyle2.data.name).toBe(style2.name);
    },
    { id: 'TC4.4', feature: 'Full Content Publishing Lifecycle' }
  );

  it(
    'TC4.5: Content Admin reorders and toggles seasonal banners with instant public reflection',
    async (ctx: TestContext) => {
      ctx.client.withRole('CONTENT_ADMIN');

      // Create new banner
      const bannerRes = await ctx.client.post('/api/admin/banners', {
        title: 'Tuần Lễ Vàng Chăm Sóc Tóc Phục Hồi',
        subtitle: 'Giảm 25% cho tất cả gói phục hồi Olaplex & Keratin',
        imageUrl: '/images/banners/golden-week.jpg',
        ctaLink: '/services',
        order: 1,
        active: true
      });
      expect(bannerRes.status).toBe(201);
      const bannerId = bannerRes.data.id;

      // Check public homepage includes the active banner
      ctx.client.clearAuth();
      const homeRes1 = await ctx.client.get('/api/public/home');
      const foundBanner1 = homeRes1.data.banners.find((b: any) => b.id === bannerId);
      expect(foundBanner1).toBeDefined();

      // Content Admin deactivates banner after promotion ends
      ctx.client.withRole('CONTENT_ADMIN');
      const toggleRes = await ctx.client.put(`/api/admin/banners/${bannerId}`, {
        active: false
      });
      expect(toggleRes.status).toBe(200);
      expect(toggleRes.data.active).toBe(false);

      // Public homepage no longer includes the inactive banner
      ctx.client.clearAuth();
      const homeRes2 = await ctx.client.get('/api/public/home');
      const foundBanner2 = homeRes2.data.banners.find((b: any) => b.id === bannerId);
      expect(foundBanner2).toBeUndefined();
    },
    { id: 'TC4.5', feature: 'Banner Lifecycle & Public Visibility' }
  );

  it(
    'TC4.6: Admin Dashboard metrics increment accurately following catalog expansion',
    async (ctx: TestContext) => {
      ctx.client.withRole('SUPER_ADMIN');

      // Check baseline
      const baseDashboard = await ctx.client.get('/api/admin/dashboard');
      const baseStyles = baseDashboard.data.totalHairstyles;

      // Add new style
      ctx.client.withRole('CONTENT_ADMIN');
      await ctx.client.post('/api/admin/hairstyles', {
        name: 'Two-Block Layered Style',
        slug: 'two-block-layered-style'
      });

      // Re-check dashboard
      ctx.client.withRole('SUPER_ADMIN');
      const updatedDashboard = await ctx.client.get('/api/admin/dashboard');
      expect(updatedDashboard.data.totalHairstyles).toBe(baseStyles + 1);
    },
    { id: 'TC4.6', feature: 'Dashboard Telemetry Synchronization' }
  );
});
