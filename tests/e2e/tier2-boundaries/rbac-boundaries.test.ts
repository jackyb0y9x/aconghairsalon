/**
 * Tier 2: Boundary & Corner Cases - RBAC Permission Matrix Boundaries
 */

import { expect } from '../../harness/assertions.ts';
import { describe, it } from '../../harness/runner.ts';
import type { TestContext } from '../../harness/types.ts';

describe('Tier 2 - RBAC Access Control Boundaries', 2, () => {
  it(
    'TC2.12: BOOKING_STAFF cannot mutate Site Settings (Strict HTTP 403)',
    async (ctx: TestContext) => {
      ctx.client.withRole('BOOKING_STAFF');

      const res = await ctx.client.put('/api/admin/settings', {
        brandName: 'Hacked Brand Name'
      });

      expect(res.status).toBe(403);
      expect(res.data.error).toContain('Forbidden');
      expect(res.data.error).toContain('SUPER_ADMIN');
    },
    { id: 'TC2.12', feature: 'RBAC Site Settings Isolation' }
  );

  it(
    'TC2.13: BOOKING_STAFF cannot view Audit Logs (Strict HTTP 403)',
    async (ctx: TestContext) => {
      ctx.client.withRole('BOOKING_STAFF');

      const res = await ctx.client.get('/api/admin/audit-logs');

      expect(res.status).toBe(403);
      expect(res.data.error).toContain('Forbidden');
      expect(res.data.error).toContain('audit logs');
    },
    { id: 'TC2.13', feature: 'RBAC Audit Log Isolation' }
  );

  it(
    'TC2.14: CONTENT_ADMIN cannot mutate Appointments / Bookings (Strict HTTP 403)',
    async (ctx: TestContext) => {
      ctx.client.withRole('CONTENT_ADMIN');

      const res = await ctx.client.put('/api/admin/bookings/bk-any-id/status', {
        status: 'CONFIRMED'
      });

      expect(res.status).toBe(403);
      expect(res.data.error).toContain('Forbidden');
      expect(res.data.error).toContain('cannot manage bookings');
    },
    { id: 'TC2.14', feature: 'RBAC Appointment Mutation Isolation' }
  );

  it(
    'TC2.15: EDITOR cannot create or delete Hairstyles (Strict HTTP 403)',
    async (ctx: TestContext) => {
      ctx.client.withRole('EDITOR');

      const createRes = await ctx.client.post('/api/admin/hairstyles', {
        name: 'Editor Hairstyle Attempt',
        slug: 'editor-style'
      });
      expect(createRes.status).toBe(403);
      expect(createRes.data.error).toContain('Forbidden');

      const deleteRes = await ctx.client.delete('/api/admin/hairstyles/hs-korean-wolf-cut');
      expect(deleteRes.status).toBe(403);
      expect(deleteRes.data.error).toContain('Forbidden');
    },
    { id: 'TC2.15', feature: 'RBAC Catalog CRUD Isolation for Editor' }
  );

  it(
    'TC2.16: EDITOR cannot mutate Home Banners (Strict HTTP 403)',
    async (ctx: TestContext) => {
      ctx.client.withRole('EDITOR');

      const res = await ctx.client.post('/api/admin/banners', {
        title: 'Editor Banner Attempt'
      });

      expect(res.status).toBe(403);
      expect(res.data.error).toContain('Forbidden');
    },
    { id: 'TC2.16', feature: 'RBAC Banner Mutation Isolation for Editor' }
  );
});
