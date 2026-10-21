/**
 * Tier 4: Real-World Application Scenarios - Complete Customer Booking Journey
 */

import { expect } from '../../harness/assertions.ts';
import { describe, it } from '../../harness/runner.ts';
import type { TestContext } from '../../harness/types.ts';

describe('Tier 4 - Real-World: Full Customer Booking Journey', 4, () => {
  it(
    'TC4.1: End-to-end customer journey from discovery, multi-step booking to salon service completion',
    async (ctx: TestContext) => {
      // ─────────────────────────────────────────────────────────────
      // Phase 1: Public Discovery & Style Selection
      // ─────────────────────────────────────────────────────────────
      // 1. Visitor loads Home page
      const homeRes = await ctx.client.get('/api/public/home');
      expect(homeRes.status).toBe(200);
      expect(homeRes.data.branding.brandName).toBeDefined();

      // 2. Visitor searches hairstyles matching Oval Face & Medium Length
      const searchRes = await ctx.client.get('/api/public/hairstyles?gender=UNISEX&faceShape=ROUND');
      expect(searchRes.status).toBe(200);
      expect(searchRes.data.items.length).toBeGreaterThan(0);
      const chosenStyle = searchRes.data.items[0];

      // 3. Visitor inspects hairstyle detail
      const detailRes = await ctx.client.get(`/api/public/hairstyles/${chosenStyle.slug}`);
      expect(detailRes.status).toBe(200);
      expect(detailRes.data.id).toBe(chosenStyle.id);

      // 4. Visitor consults color swatch catalog
      const colorsRes = await ctx.client.get('/api/public/colors');
      expect(colorsRes.status).toBe(200);
      const chosenColor = colorsRes.data.colors.find((c: any) => c.tone === 'COOL');

      // ─────────────────────────────────────────────────────────────
      // Phase 2: Multi-Step Booking Submission
      // ─────────────────────────────────────────────────────────────
      const bookingPayload = {
        serviceId: 'srv-color-perm-combo',
        hairstyleId: chosenStyle.id,
        hairColorId: chosenColor.id,
        stylistId: 'sty-master-tran',
        bookingDate: ctx.fixtures.getTomorrowDateString(),
        bookingTime: '10:30',
        customerName: 'Nguyễn Kiều Oanh',
        customerPhone: '0978123456',
        customerEmail: 'kieuoanh@gmail.com',
        notes: 'Khách hàng mới, tư vấn chăm sóc tóc uốn nhuộm',
        idempotencyKey: 'c3333333-4444-5555-6666-777777777777'
      };

      const bookingRes = await ctx.client.post('/api/bookings', bookingPayload);
      expect(bookingRes.status).toBe(201);
      expect(bookingRes.data.status).toBe('PENDING');
      expect(bookingRes.data.bookingCode).toMatch(/^BK\d{6}$/);
      const bookingId = bookingRes.data.id;

      // ─────────────────────────────────────────────────────────────
      // Phase 3: Salon Staff Operations & Lifecycle
      // ─────────────────────────────────────────────────────────────
      // 5. Booking Staff logs in and views dashboard
      ctx.client.withRole('BOOKING_STAFF');
      const dashboardRes = await ctx.client.get('/api/admin/dashboard');
      expect(dashboardRes.status).toBe(200);
      expect(dashboardRes.data.pendingBookingsCount).toBeGreaterThanOrEqual(1);

      // 6. Booking Staff retrieves and verifies the new booking
      const staffListRes = await ctx.client.get('/api/admin/bookings');
      const customerBooking = staffListRes.data.find((b: any) => b.id === bookingId);
      expect(customerBooking).toBeDefined();
      expect(customerBooking.customerName).toBe('Nguyễn Kiều Oanh');

      // 7. Staff confirms appointment
      const confirmRes = await ctx.client.put(`/api/admin/bookings/${bookingId}/status`, {
        status: 'CONFIRMED',
        stylistId: 'sty-master-tran',
        notes: 'Đã gọi xác nhận lúc 08:30 sáng, khách đến đúng giờ'
      });
      expect(confirmRes.status).toBe(200);
      expect(confirmRes.data.status).toBe('CONFIRMED');

      // 8. On appointment date, after haircut, staff marks appointment COMPLETED
      const completeRes = await ctx.client.put(`/api/admin/bookings/${bookingId}/status`, {
        status: 'COMPLETED'
      });
      expect(completeRes.status).toBe(200);
      expect(completeRes.data.status).toBe('COMPLETED');
    },
    { id: 'TC4.1', feature: 'Full Customer Booking Journey' }
  );

  it(
    'TC4.2: Customer reschedule request handled smoothly through cancellation & re-booking',
    async (ctx: TestContext) => {
      // Create initial appointment
      const bookRes = await ctx.client.post('/api/bookings', ctx.fixtures.MINIMAL_BOOKING_PAYLOAD);
      expect(bookRes.status).toBe(201);
      const originalId = bookRes.data.id;

      // Staff cancels upon customer request
      ctx.client.withRole('BOOKING_STAFF');
      const cancelRes = await ctx.client.put(`/api/admin/bookings/${originalId}/status`, {
        status: 'CANCELLED',
        notes: 'Khách báo hoãn sang tuần sau'
      });
      expect(cancelRes.status).toBe(200);
      expect(cancelRes.data.status).toBe('CANCELLED');

      // New appointment created for subsequent week
      ctx.client.clearAuth();
      const newDate = new Date();
      newDate.setDate(newDate.getDate() + 7);
      const newDateStr = newDate.toISOString().split('T')[0];

      const rebookRes = await ctx.client.post('/api/bookings', {
        ...ctx.fixtures.MINIMAL_BOOKING_PAYLOAD,
        bookingDate: newDateStr,
        notes: 'Đặt lại sau khi hủy lịch hẹn cũ'
      });
      expect(rebookRes.status).toBe(201);
      expect(rebookRes.data.status).toBe('PENDING');
      expect(rebookRes.data.id).notToBe(originalId);
    },
    { id: 'TC4.2', feature: 'Reschedule Workflow' }
  );

  it(
    'TC4.3: High-concurrency duplicate submission lock protects appointment slot',
    async (ctx: TestContext) => {
      const idempotencyKey = 'concurrent-slot-lock-999999';
      const payload = {
        ...ctx.fixtures.VALID_BOOKING_PAYLOAD,
        idempotencyKey
      };

      // Concurrent promises simulating double-clicking submit button
      const [res1, res2] = await Promise.all([
        ctx.client.post('/api/bookings', payload),
        ctx.client.post('/api/bookings', payload)
      ]);

      // Both requests succeed gracefully (one 201, one 200 idempotency return)
      expect([200, 201]).toContain(res1.status);
      expect([200, 201]).toContain(res2.status);
      expect(res1.data.id).toBe(res2.data.id);
    },
    { id: 'TC4.3', feature: 'Concurrent Submission Lock' }
  );
});
