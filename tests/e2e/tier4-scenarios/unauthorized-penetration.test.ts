/**
 * Tier 4: Real-World Application Scenarios - Adversarial Security Penetration Audit
 */

import { expect } from '../../harness/assertions.ts';
import { describe, it } from '../../harness/runner.ts';
import type { TestContext } from '../../harness/types.ts';

describe('Tier 4 - Real-World: Adversarial Penetration & Security Audit', 4, () => {
  it(
    'TC4.7: SQL Injection payloads in booking inputs are safely handled without data breach',
    async (ctx: TestContext) => {
      const base = { ...ctx.fixtures.MINIMAL_BOOKING_PAYLOAD };

      for (const sqli of ctx.fixtures.ADVERSARIAL_PAYLOADS.SQLI_NAMES) {
        // Test in customerName
        const res = await ctx.client.post('/api/bookings', {
          ...base,
          customerName: `Nguyễn ${sqli}`
        });

        // Server either validates strictly or treats as literal string safely (no 500 error / no syntax leak)
        expect([200, 201, 400]).toContain(res.status);
        if (res.status === 201) {
          expect(res.data.customerName).toContain(sqli);
        }
      }
    },
    { id: 'TC4.7', feature: 'SQL Injection Defense' }
  );

  it(
    'TC4.8: Stored XSS vectors in customer notes are treated as literal text',
    async (ctx: TestContext) => {
      const base = { ...ctx.fixtures.MINIMAL_BOOKING_PAYLOAD };

      for (const xss of ctx.fixtures.ADVERSARIAL_PAYLOADS.XSS_NOTES) {
        const res = await ctx.client.post('/api/bookings', {
          ...base,
          notes: xss
        });

        expect(res.status).toBe(201);
        expect(res.data.notes).toBe(xss);
      }
    },
    { id: 'TC4.8', feature: 'XSS Sanitization & Defense' }
  );

  it(
    'TC4.9: Path traversal attack vectors in file names do not access server filesystem',
    async (ctx: TestContext) => {
      for (const traversal of ctx.fixtures.ADVERSARIAL_PAYLOADS.PATH_TRAVERSAL_FILENAMES) {
        const res = await ctx.client.post('/api/try-on', {
          imageBase64: ctx.fixtures.VALID_IMAGE_BASE64_PNG,
          mimeType: 'image/png',
          hairstyleId: 'hs-classic-bob',
          fileName: traversal
        });

        expect(res.status).toBe(200);
        expect(res.data.privacyValidated).toBe(true);
        // Verify response contains no server internal paths
        expect(res.data.diskPath).toBeUndefined();
      }
    },
    { id: 'TC4.9', feature: 'Path Traversal Defense' }
  );

  it(
    'TC4.10: Forged session tokens and altered cookies are strictly rejected with HTTP 401',
    async (ctx: TestContext) => {
      for (const forgedToken of ctx.fixtures.ADVERSARIAL_PAYLOADS.FORGED_AUTH_COOKIES) {
        ctx.client.setAuthToken(forgedToken);

        const res = await ctx.client.get('/api/admin/dashboard');
        expect(res.status).toBe(401);
        expect(res.data.error).toContain('Unauthorized');
      }
    },
    { id: 'TC4.10', feature: 'Session Forgery Prevention' }
  );

  it(
    'TC4.11: IDOR Attack - Unauthorized customer cannot mutate booking status of other users',
    async (ctx: TestContext) => {
      // 1. Customer creates booking
      const bookRes = await ctx.client.post('/api/bookings', ctx.fixtures.MINIMAL_BOOKING_PAYLOAD);
      expect(bookRes.status).toBe(201);
      const targetBookingId = bookRes.data.id;

      // 2. Anonymous / Unauthenticated attacker tries to cancel or complete the booking
      ctx.client.clearAuth();
      const attackRes = await ctx.client.put(`/api/admin/bookings/${targetBookingId}/status`, {
        status: 'CANCELLED'
      });
      expect(attackRes.status).toBe(401);

      // 3. Attacker with EDITOR role tries to mutate booking status (privilege escalation)
      ctx.client.withRole('EDITOR');
      const editorAttackRes = await ctx.client.put(`/api/admin/bookings/${targetBookingId}/status`, {
        status: 'CONFIRMED'
      });
      expect(editorAttackRes.status).toBe(403);
    },
    { id: 'TC4.11', feature: 'IDOR & Privilege Escalation Defense' }
  );
});
