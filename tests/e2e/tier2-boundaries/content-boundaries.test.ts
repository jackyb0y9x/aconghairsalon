/**
 * Tier 2: Boundary & Corner Cases - Content Validation & Resource Boundaries
 */

import { expect } from '../../harness/assertions.ts';
import { describe, it } from '../../harness/runner.ts';
import type { TestContext } from '../../harness/types.ts';

describe('Tier 2 - Content Validation & State Boundaries', 2, () => {
  it(
    'TC2.17: Hairstyle creation requires mandatory name and slug (HTTP 400 on empty)',
    async (ctx: TestContext) => {
      ctx.client.withRole('CONTENT_ADMIN');

      const invalidPayload = {
        name: '',
        slug: ''
      };

      const res = await ctx.client.post('/api/admin/hairstyles', invalidPayload);
      expect(res.status).toBe(400);
      expect(res.data.error).toContain('bắt buộc');
    },
    { id: 'TC2.17', feature: 'Hairstyle Name & Slug Validation' }
  );

  it(
    'TC2.18: Mutating non-existent catalog resources returns HTTP 404',
    async (ctx: TestContext) => {
      ctx.client.withRole('CONTENT_ADMIN');

      const res = await ctx.client.put('/api/admin/hairstyles/hs-does-not-exist', {
        name: 'New Name'
      });
      expect(res.status).toBe(404);
      expect(res.data.error).toContain('not found');
    },
    { id: 'TC2.18', feature: 'Non-existent Resource Handling' }
  );

  it(
    'TC2.19: Invalid booking status strings are strictly rejected with HTTP 400',
    async (ctx: TestContext) => {
      // First create a booking
      const bookRes = await ctx.client.post('/api/bookings', ctx.fixtures.MINIMAL_BOOKING_PAYLOAD);
      const bookingId = bookRes.data.id;

      ctx.client.withRole('BOOKING_STAFF');
      const badStatusRes = await ctx.client.put(`/api/admin/bookings/${bookingId}/status`, {
        status: 'UNAUTHORIZED_STATUS_PROGRESSION'
      });

      expect(badStatusRes.status).toBe(400);
      expect(badStatusRes.data.error).toContain('Invalid status');
    },
    { id: 'TC2.19', feature: 'Booking Status State Machine Guard' }
  );

  it(
    'TC2.20: Partial update on Site Settings preserves existing unmodified fields',
    async (ctx: TestContext) => {
      ctx.client.withRole('SUPER_ADMIN');

      const partialRes = await ctx.client.put('/api/admin/settings', {
        hotline: '1800 9999'
      });

      expect(partialRes.status).toBe(200);
      expect(partialRes.data.hotline).toBe('1800 9999');
      // Verify other fields remain intact
      expect(partialRes.data.brandName).toBe('Salon Hoàng Gia Prestige');
      expect(partialRes.data.openingHours).toBeDefined();
    },
    { id: 'TC2.20', feature: 'Site Settings Partial Update' }
  );
});
