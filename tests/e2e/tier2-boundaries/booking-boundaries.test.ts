/**
 * Tier 2: Boundary & Corner Cases - Booking Validation
 */

import { expect } from '../../harness/assertions.ts';
import { describe, it } from '../../harness/runner.ts';
import type { TestContext } from '../../harness/types.ts';

describe('Tier 2 - Booking Boundary & Validation Limits', 2, () => {
  it(
    'TC2.1: Customer Name length boundary (1 char fails, 2 chars passes, 100 passes, 101 fails)',
    async (ctx: TestContext) => {
      const basePayload = { ...ctx.fixtures.MINIMAL_BOOKING_PAYLOAD };

      // 1 char -> fails min 2
      const res1 = await ctx.client.post('/api/bookings', { ...basePayload, customerName: 'A' });
      expect(res1.status).toBe(400);
      expect(res1.data.details.customerName).toContain('tối thiểu 2 ký tự');

      // 2 chars -> passes
      const res2 = await ctx.client.post('/api/bookings', { ...basePayload, customerName: 'An' });
      expect(res2.status).toBe(201);

      // 100 chars -> passes
      const name100 = 'A'.repeat(100);
      const res100 = await ctx.client.post('/api/bookings', { ...basePayload, customerName: name100 });
      expect(res100.status).toBe(201);

      // 101 chars -> fails max 100
      const name101 = 'A'.repeat(101);
      const res101 = await ctx.client.post('/api/bookings', { ...basePayload, customerName: name101 });
      expect(res101.status).toBe(400);
      expect(res101.data.details.customerName).toContain('tối đa 100 ký tự');
    },
    { id: 'TC2.1', feature: 'Customer Name Length Boundaries' }
  );

  it(
    'TC2.2: Customer Notes length boundary (500 chars passes, 501 chars fails)',
    async (ctx: TestContext) => {
      const basePayload = { ...ctx.fixtures.MINIMAL_BOOKING_PAYLOAD };

      // 500 chars -> passes
      const notes500 = 'X'.repeat(500);
      const res500 = await ctx.client.post('/api/bookings', { ...basePayload, notes: notes500 });
      expect(res500.status).toBe(201);

      // 501 chars -> fails
      const notes501 = 'X'.repeat(501);
      const res501 = await ctx.client.post('/api/bookings', { ...basePayload, notes: notes501 });
      expect(res501.status).toBe(400);
      expect(res501.data.details.notes).toContain('tối đa 500 ký tự');
    },
    { id: 'TC2.2', feature: 'Notes Length Boundaries' }
  );

  it(
    'TC2.3: Vietnamese phone format regex boundaries (^ (0|+84)[3|5|7|8|9][0-9]{8}$)',
    async (ctx: TestContext) => {
      const basePayload = { ...ctx.fixtures.MINIMAL_BOOKING_PAYLOAD };

      // Valid variations
      const validPhones = ['0901234567', '+84901234567', '0389998888', '0776543210', '0581234567'];
      for (const phone of validPhones) {
        const res = await ctx.client.post('/api/bookings', { ...basePayload, customerPhone: phone });
        expect(res.status).toBe(201);
      }

      // Invalid variations: too short, bad prefix (01x or 02x), letters, symbols
      const invalidPhones = ['12345', '0123456789', '0243888888', '090123456A', '+840901234567', ''];
      for (const phone of invalidPhones) {
        const res = await ctx.client.post('/api/bookings', { ...basePayload, customerPhone: phone });
        expect(res.status).toBe(400);
        expect(res.data.details.customerPhone).toBeDefined();
      }
    },
    { id: 'TC2.3', feature: 'Vietnamese Phone Regex Validation' }
  );

  it(
    'TC2.4: Past date rejection & date format validation',
    async (ctx: TestContext) => {
      const basePayload = { ...ctx.fixtures.MINIMAL_BOOKING_PAYLOAD };

      // Past date -> rejected
      const pastDate = ctx.fixtures.getPastDateString();
      const pastRes = await ctx.client.post('/api/bookings', { ...basePayload, bookingDate: pastDate });
      expect(pastRes.status).toBe(400);
      expect(pastRes.data.details.bookingDate).toContain('quá khứ');

      // Invalid format (e.g. DD/MM/YYYY instead of YYYY-MM-DD)
      const badFormatRes = await ctx.client.post('/api/bookings', { ...basePayload, bookingDate: '25/12/2026' });
      expect(badFormatRes.status).toBe(400);
      expect(badFormatRes.data.details.bookingDate).toContain('YYYY-MM-DD');
    },
    { id: 'TC2.4', feature: 'Booking Date Boundaries' }
  );

  it(
    'TC2.5: Operating hours boundary enforcement (08:30 - 20:30)',
    async (ctx: TestContext) => {
      const basePayload = { ...ctx.fixtures.MINIMAL_BOOKING_PAYLOAD };

      // Boundary open time 08:30 -> passes
      const openRes = await ctx.client.post('/api/bookings', { ...basePayload, bookingTime: '08:30' });
      expect(openRes.status).toBe(201);

      // Boundary close time 20:30 -> passes
      const closeRes = await ctx.client.post('/api/bookings', { ...basePayload, bookingTime: '20:30' });
      expect(closeRes.status).toBe(201);

      // Off-hour morning: 08:00 (< 08:30) -> fails
      const earlyRes = await ctx.client.post('/api/bookings', { ...basePayload, bookingTime: '08:00' });
      expect(earlyRes.status).toBe(400);
      expect(earlyRes.data.details.bookingTime).toContain('khung giờ mở cửa');

      // Off-hour night: 21:00 (> 20:30) -> fails
      const lateRes = await ctx.client.post('/api/bookings', { ...basePayload, bookingTime: '21:00' });
      expect(lateRes.status).toBe(400);
      expect(lateRes.data.details.bookingTime).toContain('khung giờ mở cửa');

      // Midnight: 03:00 -> fails
      const midRes = await ctx.client.post('/api/bookings', { ...basePayload, bookingTime: '03:00' });
      expect(midRes.status).toBe(400);
    },
    { id: 'TC2.5', feature: 'Salon Operating Hours Limits' }
  );

  it(
    'TC2.6: Empty string rejection on all required booking fields',
    async (ctx: TestContext) => {
      const emptyPayload = {
        serviceId: '   ',
        customerName: ' ',
        customerPhone: '',
        bookingDate: '',
        bookingTime: ''
      };

      const res = await ctx.client.post('/api/bookings', emptyPayload);
      expect(res.status).toBe(400);
      expect(res.data.details.serviceId).toBeDefined();
      expect(res.data.details.customerName).toBeDefined();
      expect(res.data.details.customerPhone).toBeDefined();
      expect(res.data.details.bookingDate).toBeDefined();
    },
    { id: 'TC2.6', feature: 'Empty Input Guard' }
  );
});
