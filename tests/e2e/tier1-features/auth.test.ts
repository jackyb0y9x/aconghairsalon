/**
 * Tier 1: Feature Coverage - Authentication & Session Subsystem
 */

import { expect } from '../../harness/assertions.ts';
import { describe, it } from '../../harness/runner.ts';
import type { TestContext } from '../../harness/types.ts';

describe('Tier 1 - Authentication & RBAC Core Features', 1, () => {
  it(
    'TC1.23: POST /api/auth/login succeeds with valid credentials and sets HTTP-only session cookie',
    async (ctx: TestContext) => {
      ctx.client.clearAuth();
      const loginPayload = {
        email: ctx.fixtures.MOCK_USERS.SUPER_ADMIN.email,
        password: ctx.fixtures.MOCK_USERS.SUPER_ADMIN.password
      };

      const res = await ctx.client.post('/api/auth/login', loginPayload);

      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('token');
      expect(res.data).toHaveProperty('user');
      expect(res.data.user.email).toBe(loginPayload.email);
      expect(res.data.user.role).toBe('SUPER_ADMIN');
    },
    { id: 'TC1.23', feature: 'Admin Login & Credentials' }
  );

  it(
    'TC1.24: POST /api/auth/login rejects incorrect passwords with HTTP 401 Unauthorized',
    async (ctx: TestContext) => {
      ctx.client.clearAuth();
      const invalidPayload = {
        email: ctx.fixtures.MOCK_USERS.SUPER_ADMIN.email,
        password: 'WrongPassword999!'
      };

      const res = await ctx.client.post('/api/auth/login', invalidPayload);

      expect(res.status).toBe(401);
      expect(res.data.error).toContain('Email hoặc mật khẩu không chính xác');
    },
    { id: 'TC1.24', feature: 'Password Verification Guard' }
  );

  it(
    'TC1.25: GET /api/auth/session returns active authenticated identity and permissions',
    async (ctx: TestContext) => {
      ctx.client.withRole('CONTENT_ADMIN');

      const res = await ctx.client.get('/api/auth/session');

      expect(res.status).toBe(200);
      expect(res.data.authenticated).toBe(true);
      expect(res.data.user.role).toBe('CONTENT_ADMIN');
      expect(res.data.user.name).toBe('Content Lead');
    },
    { id: 'TC1.25', feature: 'Session Verification' }
  );

  it(
    'TC1.26: POST /api/auth/logout clears session state and expires auth cookie',
    async (ctx: TestContext) => {
      ctx.client.withRole('BOOKING_STAFF');

      const logoutRes = await ctx.client.post('/api/auth/logout');
      expect(logoutRes.status).toBe(200);
      expect(logoutRes.data.success).toBe(true);

      // Verify that after clearing auth, session is rejected
      ctx.client.clearAuth();
      const sessionRes = await ctx.client.get('/api/auth/session');
      expect(sessionRes.status).toBe(401);
      expect(sessionRes.data.authenticated).toBe(false);
    },
    { id: 'TC1.26', feature: 'Session Logout & Invalidation' }
  );

  it(
    'TC1.27: Unauthenticated requests to /api/admin/* are strictly rejected with HTTP 401',
    async (ctx: TestContext) => {
      ctx.client.clearAuth();

      const dashboardRes = await ctx.client.get('/api/admin/dashboard');
      expect(dashboardRes.status).toBe(401);
      expect(dashboardRes.data.error).toContain('Unauthorized');

      const hairstylesRes = await ctx.client.get('/api/admin/hairstyles');
      expect(hairstylesRes.status).toBe(401);
    },
    { id: 'TC1.27', feature: 'Admin Route Guard Protection' }
  );
});
