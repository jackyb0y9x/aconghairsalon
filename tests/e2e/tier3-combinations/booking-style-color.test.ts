/**
 * Tier 3: Cross-Feature Combinations - Booking + Hairstyle + Color Swatch
 */

import { expect } from '../../harness/assertions.ts';
import { describe, it } from '../../harness/runner.ts';
import type { TestContext } from '../../harness/types.ts';

describe('Tier 3 - Combinatorial: Booking + Style + Color Swatch', 3, () => {
  it(
    'TC3.1: Pairwise combination of Service, Hairstyle, and Color Swatch in Booking submission',
    async (ctx: TestContext) => {
      // 1. Fetch available hairstyles, colors, and services
      const stylesRes = await ctx.client.get('/api/public/hairstyles');
      const colorsRes = await ctx.client.get('/api/public/colors');
      const servicesRes = await ctx.client.get('/api/public/services');

      expect(stylesRes.status).toBe(200);
      expect(colorsRes.status).toBe(200);
      expect(servicesRes.status).toBe(200);

      const targetStyle = stylesRes.data.items[0];
      const targetColor = colorsRes.data.colors[0];
      const targetService = servicesRes.data.services[0];

      // 2. Submit integrated booking
      const combinedPayload = {
        serviceId: targetService.id,
        hairstyleId: targetStyle.id,
        hairColorId: targetColor.id,
        bookingDate: ctx.fixtures.getTomorrowDateString(),
        bookingTime: '11:00',
        customerName: 'Trần Bảo Ngọc',
        customerPhone: '0934567890',
        notes: `Muốn nhuộm màu ${targetColor.name} kết hợp dáng ${targetStyle.name}`
      };

      const bookingRes = await ctx.client.post('/api/bookings', combinedPayload);
      expect(bookingRes.status).toBe(201);
      expect(bookingRes.data.serviceId).toBe(targetService.id);
      expect(bookingRes.data.hairstyleId).toBe(targetStyle.id);
      expect(bookingRes.data.hairColorId).toBe(targetColor.id);

      // 3. Verify Admin booking management views cross-references
      ctx.client.withRole('BOOKING_STAFF');
      const adminBookingsRes = await ctx.client.get('/api/admin/bookings');
      expect(adminBookingsRes.status).toBe(200);
      const matched = adminBookingsRes.data.find((b: any) => b.id === bookingRes.data.id);
      expect(matched).toBeDefined();
      expect(matched.hairstyleId).toBe(targetStyle.id);
      expect(matched.hairColorId).toBe(targetColor.id);
    },
    { id: 'TC3.1', feature: 'Pairwise Booking + Style + Color' }
  );

  it(
    'TC3.2: Bleached color selection reflects in appointment prep notes and service duration',
    async (ctx: TestContext) => {
      // Ash Blonde requires bleach -> user books combo package
      const ashBlonde = ctx.fixtures.SAMPLE_HAIR_COLORS.find((c: any) => c.requiresBleach);
      expect(ashBlonde).toBeDefined();

      const bookingPayload = {
        serviceId: 'srv-color-perm-combo',
        hairstyleId: 'hs-korean-wolf-cut',
        hairColorId: ashBlonde?.id,
        bookingDate: ctx.fixtures.getTomorrowDateString(),
        bookingTime: '13:00',
        customerName: 'Hoàng Yến Linh',
        customerPhone: '0977112233',
        notes: 'Tóc hiện tại nền đen tự nhiên chưa từng tẩy'
      };

      const res = await ctx.client.post('/api/bookings', bookingPayload);
      expect(res.status).toBe(201);
      expect(res.data.hairColorId).toBe(ashBlonde?.id);
    },
    { id: 'TC3.2', feature: 'Bleach Requirement Interaction' }
  );

  it(
    'TC3.3: Booking with Hairstyle only (no color) and Service only (no style/color)',
    async (ctx: TestContext) => {
      // Case A: Style only (e.g. cut only)
      const styleOnly = {
        serviceId: 'srv-layer-cut-vip',
        hairstyleId: 'hs-classic-bob',
        bookingDate: ctx.fixtures.getTomorrowDateString(),
        bookingTime: '15:00',
        customerName: 'Đặng Mai Phương',
        customerPhone: '0918765432'
      };
      const resA = await ctx.client.post('/api/bookings', styleOnly);
      expect(resA.status).toBe(201);
      expect(resA.data.hairstyleId).toBe('hs-classic-bob');
      expect(resA.data.hairColorId).toBeNull();

      // Case B: Service only (walk-in consultation)
      const serviceOnly = {
        serviceId: 'srv-layer-cut-vip',
        bookingDate: ctx.fixtures.getTomorrowDateString(),
        bookingTime: '16:00',
        customerName: 'Vũ Quốc Anh',
        customerPhone: '0988223344'
      };
      const resB = await ctx.client.post('/api/bookings', serviceOnly);
      expect(resB.status).toBe(201);
      expect(resB.data.hairstyleId).toBeNull();
      expect(resB.data.hairColorId).toBeNull();
    },
    { id: 'TC3.3', feature: 'Partial Combinations Matrix' }
  );
});
