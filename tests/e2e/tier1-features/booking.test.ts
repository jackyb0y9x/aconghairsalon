/**
 * Tier 1: Feature Coverage - Booking Subsystem
 */

import { expect } from '../../harness/assertions.ts';
import { describe, it } from '../../harness/runner.ts';
import type { TestContext } from '../../harness/types.ts';

describe('Tier 1 - Booking Subsystem Features', 1, () => {
  it(
    'TC1.18: POST /api/bookings successfully creates appointment with minimum required fields',
    async (ctx: TestContext) => {
      const res = await ctx.client.post('/api/bookings', ctx.fixtures.MINIMAL_BOOKING_PAYLOAD);

      expect(res.status).toBe(201);
      expect(res.data).toHaveProperty('id');
      expect(res.data).toHaveProperty('bookingCode');
      expect(res.data.status).toBe('PENDING');
      expect(res.data.customerName).toBe(ctx.fixtures.MINIMAL_BOOKING_PAYLOAD.customerName);
      expect(res.data.customerPhone).toBe(ctx.fixtures.MINIMAL_BOOKING_PAYLOAD.customerPhone);
    },
    { id: 'TC1.18', feature: 'Minimum Booking Creation' }
  );

  it(
    'TC1.19: POST /api/bookings creates appointment with comprehensive optional specifications',
    async (ctx: TestContext) => {
      const res = await ctx.client.post('/api/bookings', ctx.fixtures.VALID_BOOKING_PAYLOAD);

      expect(res.status).toBe(201);
      expect(res.data.hairstyleId).toBe(ctx.fixtures.VALID_BOOKING_PAYLOAD.hairstyleId);
      expect(res.data.hairColorId).toBe(ctx.fixtures.VALID_BOOKING_PAYLOAD.hairColorId);
      expect(res.data.stylistId).toBe(ctx.fixtures.VALID_BOOKING_PAYLOAD.stylistId);
      expect(res.data.customerEmail).toBe(ctx.fixtures.VALID_BOOKING_PAYLOAD.customerEmail);
      expect(res.data.notes).toBe(ctx.fixtures.VALID_BOOKING_PAYLOAD.notes);
    },
    { id: 'TC1.19', feature: 'Full Detail Booking Creation' }
  );

  it(
    'TC1.20: Anti-duplicate submission protection via idempotencyKey',
    async (ctx: TestContext) => {
      const uniqueKey = 'b1111111-2222-3333-4444-555555555555';
      const payload = {
        ...ctx.fixtures.VALID_BOOKING_PAYLOAD,
        idempotencyKey: uniqueKey
      };

      // First submission -> 201 Created
      const firstRes = await ctx.client.post('/api/bookings', payload);
      expect(firstRes.status).toBe(201);
      const originalBookingId = firstRes.data.id;

      // Duplicate immediate resubmission with same key -> 200 OK returning existing booking
      const duplicateRes = await ctx.client.post('/api/bookings', payload);
      expect(duplicateRes.status).toBe(200);
      expect(duplicateRes.data.id).toBe(originalBookingId);
    },
    { id: 'TC1.20', feature: 'Anti-Duplicate Idempotency' }
  );

  it(
    'TC1.21: 5-State lifecycle progression: PENDING -> CONFIRMED -> COMPLETED',
    async (ctx: TestContext) => {
      // 1. Create booking as customer
      const createRes = await ctx.client.post('/api/bookings', ctx.fixtures.MINIMAL_BOOKING_PAYLOAD);
      expect(createRes.status).toBe(201);
      const bookingId = createRes.data.id;

      // 2. Staff confirms booking and assigns stylist
      ctx.client.withRole('BOOKING_STAFF');
      const confirmRes = await ctx.client.put(`/api/admin/bookings/${bookingId}/status`, {
        status: 'CONFIRMED',
        stylistId: 'sty-master-tran',
        notes: 'Đã gọi điện xác nhận lịch với khách lúc 09:15'
      });
      expect(confirmRes.status).toBe(200);
      expect(confirmRes.data.status).toBe('CONFIRMED');
      expect(confirmRes.data.stylistId).toBe('sty-master-tran');

      // 3. Staff completes booking after service execution
      const completeRes = await ctx.client.put(`/api/admin/bookings/${bookingId}/status`, {
        status: 'COMPLETED'
      });
      expect(completeRes.status).toBe(200);
      expect(completeRes.data.status).toBe('COMPLETED');
    },
    { id: 'TC1.21', feature: 'Booking Lifecycle Progression' }
  );

  it(
    'TC1.22: Booking cancellation workflow with audit reason',
    async (ctx: TestContext) => {
      const createRes = await ctx.client.post('/api/bookings', ctx.fixtures.MINIMAL_BOOKING_PAYLOAD);
      expect(createRes.status).toBe(201);
      const bookingId = createRes.data.id;

      // Cancel appointment
      ctx.client.withRole('BOOKING_STAFF');
      const cancelRes = await ctx.client.put(`/api/admin/bookings/${bookingId}/status`, {
        status: 'CANCELLED',
        notes: 'Khách bận đột xuất xin hủy hẹn'
      });

      expect(cancelRes.status).toBe(200);
      expect(cancelRes.data.status).toBe('CANCELLED');
      expect(cancelRes.data.internalNotes).toContain('Khách bận');
    },
    { id: 'TC1.22', feature: 'Booking Cancellation Flow' }
  );
});
