/**
 * Tier 3: Cross-Feature Combinations - Try-On Simulation to Booking Conversion
 */

import { expect } from '../../harness/assertions.ts';
import { describe, it } from '../../harness/runner.ts';
import type { TestContext } from '../../harness/types.ts';

describe('Tier 3 - Combinatorial: Try-On Simulation to Booking Flow', 3, () => {
  it(
    'TC3.7: Customer simulates hairstyle in Try-On tool and seamlessly converts into Appointment',
    async (ctx: TestContext) => {
      // Step 1: Customer executes Try-On simulation
      const tryOnPayload = {
        imageBase64: ctx.fixtures.VALID_IMAGE_BASE64_PNG,
        mimeType: 'image/png',
        hairstyleId: 'hs-korean-wolf-cut',
        hairColorId: 'col-ash-blonde'
      };

      const tryOnRes = await ctx.client.post('/api/try-on', tryOnPayload);
      expect(tryOnRes.status).toBe(200);
      expect(tryOnRes.data.resultImageBase64).toBeDefined();

      // Step 2: Customer clicks "Đặt lịch ngay với kiểu này" (Book this style)
      // Conversion passes hairstyleId and hairColorId into booking wizard
      const bookingPayload = {
        serviceId: 'srv-color-perm-combo',
        hairstyleId: tryOnRes.data.appliedStyleId,
        hairColorId: tryOnRes.data.appliedColorId,
        bookingDate: ctx.fixtures.getTomorrowDateString(),
        bookingTime: '09:30',
        customerName: 'Hoàng Kim Chi',
        customerPhone: '0966887799',
        notes: 'Đã thử mô phỏng trên website, muốn stylist làm đúng dáng và màu này'
      };

      const bookingRes = await ctx.client.post('/api/bookings', bookingPayload);
      expect(bookingRes.status).toBe(201);
      expect(bookingRes.data.hairstyleId).toBe('hs-korean-wolf-cut');
      expect(bookingRes.data.hairColorId).toBe('col-ash-blonde');
      expect(bookingRes.data.status).toBe('PENDING');

      // Step 3: Admin booking staff inspects customer's trial choice
      ctx.client.withRole('BOOKING_STAFF');
      const adminRes = await ctx.client.get('/api/admin/bookings');
      const staffView = adminRes.data.find((b: any) => b.id === bookingRes.data.id);
      expect(staffView).toBeDefined();
      expect(staffView.notes).toContain('Đã thử mô phỏng');
    },
    { id: 'TC3.7', feature: 'Try-On to Booking Conversion' }
  );

  it(
    'TC3.8: Customer modifies color choice in booking wizard while retaining simulated hairstyle',
    async (ctx: TestContext) => {
      // Simulate with Ash Blonde
      const tryOnRes = await ctx.client.post('/api/try-on', {
        imageBase64: ctx.fixtures.VALID_IMAGE_BASE64_PNG,
        mimeType: 'image/jpeg',
        hairstyleId: 'hs-classic-bob',
        hairColorId: 'col-ash-blonde'
      });
      expect(tryOnRes.status).toBe(200);

      // In booking step 2, customer switches to Chocolate Brown
      const bookingRes = await ctx.client.post('/api/bookings', {
        serviceId: 'srv-layer-cut-vip',
        hairstyleId: tryOnRes.data.appliedStyleId,
        hairColorId: 'col-chocolate-brown', // Swapped color
        bookingDate: ctx.fixtures.getTomorrowDateString(),
        bookingTime: '14:00',
        customerName: 'Phạm Minh Hằng',
        customerPhone: '0945112233',
        notes: 'Đổi từ khói sang nâu socola để không cần tẩy tóc'
      });

      expect(bookingRes.status).toBe(201);
      expect(bookingRes.data.hairstyleId).toBe('hs-classic-bob');
      expect(bookingRes.data.hairColorId).toBe('col-chocolate-brown');
    },
    { id: 'TC3.8', feature: 'Style Retention with Color Switch' }
  );

  it(
    'TC3.9: Try-on failure does not impede direct booking capability',
    async (ctx: TestContext) => {
      // If user upload fails (e.g. invalid format)
      const badTryOn = await ctx.client.post('/api/try-on', {
        imageBase64: ctx.fixtures.VALID_IMAGE_BASE64_PNG,
        mimeType: 'application/pdf',
        hairstyleId: 'hs-classic-bob'
      });
      expect(badTryOn.status).toBe(400);

      // User can still navigate directly to booking wizard without errors
      const directBooking = await ctx.client.post('/api/bookings', {
        serviceId: 'srv-layer-cut-vip',
        hairstyleId: 'hs-classic-bob',
        bookingDate: ctx.fixtures.getTomorrowDateString(),
        bookingTime: '17:00',
        customerName: 'Ngô Thanh Vân',
        customerPhone: '0903456789'
      });

      expect(directBooking.status).toBe(201);
      expect(directBooking.data.bookingCode).toBeDefined();
    },
    { id: 'TC3.9', feature: 'Try-On Failure Resilience' }
  );
});
