/**
 * Empirical Adversarial Penetration & RBAC Stress Testing Suite
 * M2 Challenger 1 - Automated Verification Harness
 */

import { NextRequest } from 'next/server';
import {
  extractAuthToken,
  verifySession,
  checkApiRbacPermission,
  authenticateAdminRequest,
  SESSION_COOKIE_NAME,
} from '../lib/auth';
import { GET as getSettings, PUT as putSettings } from '../app/api/admin/settings/route';
import { GET as getAuditLogs } from '../app/api/admin/audit-logs/route';
import { GET as getDashboard } from '../app/api/admin/dashboard/route';
import { POST as postLogin } from '../app/api/auth/login/route';
import { GET as getSession } from '../app/api/auth/session/route';
import { POST as postLogout } from '../app/api/auth/logout/route';
import { middleware } from '../middleware';
import { MOCK_USERS, ADVERSARIAL_PAYLOADS } from './fixtures/mock-data';
import { ApiClient } from './harness/client';

interface TestResult {
  category: string;
  testName: string;
  passed: boolean;
  expected: string;
  actual: string;
  details?: any;
}

const results: TestResult[] = [];

function assertTest(
  category: string,
  testName: string,
  passed: boolean,
  expected: string,
  actual: string,
  details?: any
) {
  results.push({ category, testName, passed, expected, actual, details });
  const statusMark = passed ? '✓ [PASS]' : '✗ [FAIL]';
  console.log(`${statusMark} [${category}] ${testName}`);
  if (!passed) {
    console.error(`    Expected: ${expected}`);
    console.error(`    Actual:   ${actual}`);
    if (details) console.error(`    Details:`, details);
  }
}

async function runAdversarialSuite() {
  console.log('================================================================');
  console.log('  STARTING M2 EMPIRICAL ADVERSARIAL & PENETRATION STRESS SUITE  ');
  console.log('================================================================\n');

  // ==========================================================================
  // SECTION 1: UNAUTHORIZED ACCESS & TOKEN FORGERY PROBING
  // ==========================================================================
  console.log('--- SECTION 1: Unauthorized Access & Token Forgery Probing ---');

  // 1.1 No token to /api/admin/settings
  {
    const req = new NextRequest('http://localhost:3000/api/admin/settings', { method: 'GET' });
    const res = await getSettings(req);
    const body = await res.json();
    assertTest(
      'Unauthorized Access',
      'GET /api/admin/settings without token returns 401',
      res.status === 401,
      'HTTP 401',
      `HTTP ${res.status}: ${JSON.stringify(body)}`
    );
  }

  // 1.2 No token to /api/admin/audit-logs
  {
    const req = new NextRequest('http://localhost:3000/api/admin/audit-logs', { method: 'GET' });
    const res = await getAuditLogs(req);
    const body = await res.json();
    assertTest(
      'Unauthorized Access',
      'GET /api/admin/audit-logs without token returns 401',
      res.status === 401,
      'HTTP 401',
      `HTTP ${res.status}: ${JSON.stringify(body)}`
    );
  }

  // 1.3 No token to /api/admin/dashboard
  {
    const req = new NextRequest('http://localhost:3000/api/admin/dashboard', { method: 'GET' });
    const res = await getDashboard(req);
    const body = await res.json();
    assertTest(
      'Unauthorized Access',
      'GET /api/admin/dashboard without token returns 401',
      res.status === 401,
      'HTTP 401',
      `HTTP ${res.status}: ${JSON.stringify(body)}`
    );
  }

  // 1.4 Forged Tokens against /api/admin/settings
  for (const forgedToken of ADVERSARIAL_PAYLOADS.FORGED_AUTH_COOKIES) {
    const req = new NextRequest('http://localhost:3000/api/admin/settings', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${forgedToken}`,
      },
    });
    const res = await getSettings(req);
    const body = await res.json();
    assertTest(
      'Token Forgery',
      `GET /api/admin/settings with forged token "${forgedToken.substring(0, 20)}..." returns 401`,
      res.status === 401,
      'HTTP 401',
      `HTTP ${res.status}: ${JSON.stringify(body)}`
    );
  }

  // 1.5 Forged Tokens via Cookie Header
  for (const forgedToken of ADVERSARIAL_PAYLOADS.FORGED_AUTH_COOKIES) {
    const req = new NextRequest('http://localhost:3000/api/admin/audit-logs', {
      method: 'GET',
      headers: {
        Cookie: `salon_session=${forgedToken}`,
      },
    });
    const res = await getAuditLogs(req);
    const body = await res.json();
    assertTest(
      'Token Forgery Cookie',
      `GET /api/admin/audit-logs with forged cookie returns 401`,
      res.status === 401,
      'HTTP 401',
      `HTTP ${res.status}: ${JSON.stringify(body)}`
    );
  }

  // 1.6 Malicious / SQLi Tokens in verifySession
  for (const sqli of ADVERSARIAL_PAYLOADS.SQLI_NAMES) {
    const session = await verifySession(sqli);
    assertTest(
      'SQLi Token verifySession',
      `verifySession("${sqli}") returns null without throw`,
      session === null,
      'null',
      String(session)
    );
  }

  // ==========================================================================
  // SECTION 2: RBAC PRIVILEGE ESCALATION PROBING
  // ==========================================================================
  console.log('\n--- SECTION 2: RBAC Privilege Escalation Probing ---');

  // 2.1 BOOKING_STAFF accessing /api/admin/settings GET
  {
    const req = new NextRequest('http://localhost:3000/api/admin/settings', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${MOCK_USERS.BOOKING_STAFF.token}`,
      },
    });
    const res = await getSettings(req);
    const body = await res.json();
    assertTest(
      'RBAC Privilege Escalation',
      'BOOKING_STAFF attempting GET /api/admin/settings is rejected with HTTP 403',
      res.status === 403 && body.error?.includes('SUPER_ADMIN'),
      'HTTP 403 containing SUPER_ADMIN',
      `HTTP ${res.status}: ${JSON.stringify(body)}`
    );
  }

  // 2.2 BOOKING_STAFF attempting PUT /api/admin/settings
  {
    const req = new NextRequest('http://localhost:3000/api/admin/settings', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${MOCK_USERS.BOOKING_STAFF.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ brandName: 'Hacked Brand' }),
    });
    const res = await putSettings(req);
    const body = await res.json();
    assertTest(
      'RBAC Privilege Escalation',
      'BOOKING_STAFF attempting PUT /api/admin/settings is rejected with HTTP 403',
      res.status === 403 && body.error?.includes('SUPER_ADMIN'),
      'HTTP 403 containing SUPER_ADMIN',
      `HTTP ${res.status}: ${JSON.stringify(body)}`
    );
  }

  // 2.3 BOOKING_STAFF attempting GET /api/admin/audit-logs
  {
    const req = new NextRequest('http://localhost:3000/api/admin/audit-logs', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${MOCK_USERS.BOOKING_STAFF.token}`,
      },
    });
    const res = await getAuditLogs(req);
    const body = await res.json();
    assertTest(
      'RBAC Privilege Escalation',
      'BOOKING_STAFF attempting GET /api/admin/audit-logs is rejected with HTTP 403',
      res.status === 403 && body.error?.includes('SUPER_ADMIN'),
      'HTTP 403 containing SUPER_ADMIN',
      `HTTP ${res.status}: ${JSON.stringify(body)}`
    );
  }

  // 2.4 CONTENT_ADMIN attempting GET /api/admin/settings
  {
    const req = new NextRequest('http://localhost:3000/api/admin/settings', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${MOCK_USERS.CONTENT_ADMIN.token}`,
      },
    });
    const res = await getSettings(req);
    const body = await res.json();
    assertTest(
      'RBAC Privilege Escalation',
      'CONTENT_ADMIN attempting GET /api/admin/settings is rejected with HTTP 403',
      res.status === 403 && body.error?.includes('SUPER_ADMIN'),
      'HTTP 403',
      `HTTP ${res.status}: ${JSON.stringify(body)}`
    );
  }

  // 2.5 CONTENT_ADMIN attempting GET /api/admin/audit-logs
  {
    const req = new NextRequest('http://localhost:3000/api/admin/audit-logs', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${MOCK_USERS.CONTENT_ADMIN.token}`,
      },
    });
    const res = await getAuditLogs(req);
    const body = await res.json();
    assertTest(
      'RBAC Privilege Escalation',
      'CONTENT_ADMIN attempting GET /api/admin/audit-logs is rejected with HTTP 403',
      res.status === 403 && body.error?.includes('SUPER_ADMIN'),
      'HTTP 403',
      `HTTP ${res.status}: ${JSON.stringify(body)}`
    );
  }

  // 2.6 checkApiRbacPermission matrix test
  {
    const rbacBookingStaffSettings = checkApiRbacPermission('BOOKING_STAFF', '/api/admin/settings');
    assertTest(
      'RBAC Function Guard',
      'checkApiRbacPermission(BOOKING_STAFF, /api/admin/settings) is disallowed',
      !rbacBookingStaffSettings.allowed,
      'allowed: false',
      `allowed: ${rbacBookingStaffSettings.allowed}`
    );

    const rbacContentAdminBooking = checkApiRbacPermission('CONTENT_ADMIN', '/api/admin/bookings/123/status');
    assertTest(
      'RBAC Function Guard',
      'checkApiRbacPermission(CONTENT_ADMIN, /api/admin/bookings) is disallowed',
      !rbacContentAdminBooking.allowed && (rbacContentAdminBooking.error?.includes('cannot manage bookings') ?? false),
      'allowed: false, cannot manage bookings',
      `allowed: ${rbacContentAdminBooking.allowed}, error: ${rbacContentAdminBooking.error}`
    );

    const rbacEditorHairstyle = checkApiRbacPermission('EDITOR', '/api/admin/hairstyles');
    assertTest(
      'RBAC Function Guard',
      'checkApiRbacPermission(EDITOR, /api/admin/hairstyles) is disallowed',
      !rbacEditorHairstyle.allowed && (rbacEditorHairstyle.error?.includes('cannot mutate catalog content') ?? false),
      'allowed: false, cannot mutate catalog content',
      `allowed: ${rbacEditorHairstyle.allowed}, error: ${rbacEditorHairstyle.error}`
    );

    const rbacEditorBanners = checkApiRbacPermission('EDITOR', '/api/admin/banners');
    assertTest(
      'RBAC Function Guard',
      'checkApiRbacPermission(EDITOR, /api/admin/banners) is disallowed',
      !rbacEditorBanners.allowed,
      'allowed: false',
      `allowed: ${rbacEditorBanners.allowed}`
    );

    const rbacEditorArticles = checkApiRbacPermission('EDITOR', '/api/admin/articles');
    assertTest(
      'RBAC Function Guard',
      'checkApiRbacPermission(EDITOR, /api/admin/articles) is allowed',
      rbacEditorArticles.allowed,
      'allowed: true',
      `allowed: ${rbacEditorArticles.allowed}`
    );

    const rbacSuperAdminAll = checkApiRbacPermission('SUPER_ADMIN', '/api/admin/settings');
    assertTest(
      'RBAC Function Guard',
      'checkApiRbacPermission(SUPER_ADMIN, /api/admin/settings) is allowed',
      rbacSuperAdminAll.allowed,
      'allowed: true',
      `allowed: ${rbacSuperAdminAll.allowed}`
    );
  }

  // ==========================================================================
  // SECTION 3: BRUTE FORCE & CREDENTIAL INJECTION ON /api/auth/login
  // ==========================================================================
  console.log('\n--- SECTION 3: Brute Force & Credential Injection Probing ---');

  // 3.1 SQL Injection in Email field
  for (const sqli of ADVERSARIAL_PAYLOADS.SQLI_NAMES) {
    const req = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: sqli, password: 'ArbitraryPassword123!' }),
    });
    const res = await postLogin(req);
    const body = await res.json();
    assertTest(
      'SQL Injection Login',
      `POST /api/auth/login with email "${sqli}" rejected with 400 or 401`,
      [400, 401].includes(res.status),
      'HTTP 400 or 401',
      `HTTP ${res.status}: ${JSON.stringify(body)}`
    );
  }

  // 3.2 SQL Injection in Password field
  for (const sqli of ADVERSARIAL_PAYLOADS.SQLI_NAMES) {
    const req = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: MOCK_USERS.SUPER_ADMIN.email, password: sqli }),
    });
    const res = await postLogin(req);
    const body = await res.json();
    assertTest(
      'SQL Injection Login Password',
      `POST /api/auth/login with password "${sqli}" rejected with 401`,
      res.status === 401,
      'HTTP 401',
      `HTTP ${res.status}: ${JSON.stringify(body)}`
    );
  }

  // 3.3 Empty Body / Missing Fields
  {
    const req = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const res = await postLogin(req);
    assertTest(
      'Input Validation Login',
      'POST /api/auth/login with empty body rejected with 400',
      res.status === 400,
      'HTTP 400',
      `HTTP ${res.status}`
    );
  }

  // 3.4 Oversized Password (Bcrypt DoS attack vector)
  {
    const hugePassword = 'A'.repeat(10000);
    const req = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: MOCK_USERS.SUPER_ADMIN.email, password: hugePassword }),
    });
    const start = Date.now();
    const res = await postLogin(req);
    const elapsed = Date.now() - start;
    assertTest(
      'Bcrypt DoS Resilience',
      'POST /api/auth/login with 10k character password rejected without server hang (<2000ms)',
      [400, 401].includes(res.status) && elapsed < 2000,
      'HTTP 400 or 401 in <2000ms',
      `HTTP ${res.status} in ${elapsed}ms`
    );
  }

  // 3.5 Brute-force burst simulation: 20 rapid invalid attempts
  {
    let allRejected = true;
    for (let i = 0; i < 20; i++) {
      const req = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: MOCK_USERS.SUPER_ADMIN.email,
          password: `BruteGuessPassword_${i}!`,
        }),
      });
      const res = await postLogin(req);
      if (res.status !== 401) {
        allRejected = false;
        break;
      }
    }
    assertTest(
      'Brute Force Burst',
      '20 rapid sequential brute force attempts are all rejected with HTTP 401',
      allRejected,
      'All 20 requests rejected with 401',
      allRejected ? 'All 20 returned 401' : 'Failure observed'
    );
  }

  // ==========================================================================
  // SECTION 4: EDGE MIDDLEWARE ROUTE PROTECTION
  // ==========================================================================
  console.log('\n--- SECTION 4: Edge Middleware Route Protection ---');

  // 4.1 Unauthenticated access to /admin
  {
    const req = new NextRequest('http://localhost:3000/admin');
    const res = middleware(req);
    const redirectLocation = res.headers.get('location');
    assertTest(
      'Middleware Protection',
      'Unauthenticated request to /admin redirects to /admin/login?redirect=/admin',
      res.status === 307 && (redirectLocation?.includes('/admin/login') ?? false),
      'HTTP 307 redirect to /admin/login',
      `HTTP ${res.status} location: ${redirectLocation}`
    );
  }

  // 4.2 Unauthenticated access to /admin/settings
  {
    const req = new NextRequest('http://localhost:3000/admin/settings');
    const res = middleware(req);
    const redirectLocation = res.headers.get('location');
    assertTest(
      'Middleware Protection',
      'Unauthenticated request to /admin/settings redirects to /admin/login?redirect=/admin/settings',
      res.status === 307 && (redirectLocation?.includes('redirect=%2Fadmin%2Fsettings') ?? false),
      'HTTP 307 redirect with redirect param',
      `HTTP ${res.status} location: ${redirectLocation}`
    );
  }

  // 4.3 Unauthenticated access to /admin/login allowed
  {
    const req = new NextRequest('http://localhost:3000/admin/login');
    const res = middleware(req);
    assertTest(
      'Middleware Protection',
      'Unauthenticated request to /admin/login passes through without redirect',
      res.status === 200,
      'HTTP 200',
      `HTTP ${res.status}`
    );
  }

  // 4.4 Authenticated user hitting /admin/login redirected to /admin
  {
    const req = new NextRequest('http://localhost:3000/admin/login', {
      headers: {
        Cookie: `salon_session=${MOCK_USERS.SUPER_ADMIN.token}`,
      },
    });
    const res = middleware(req);
    const redirectLocation = res.headers.get('location');
    assertTest(
      'Middleware Protection',
      'Authenticated user visiting /admin/login redirected to /admin',
      res.status === 307 && (redirectLocation?.endsWith('/admin') ?? false),
      'HTTP 307 redirect to /admin',
      `HTTP ${res.status} location: ${redirectLocation}`
    );
  }

  // ==========================================================================
  // SECTION 5: CRITICAL SECURITY & BACKDOOR ANALYSIS
  // ==========================================================================
  console.log('\n--- SECTION 5: Critical Security & Backdoor Analysis ---');

  // 5.1 Test if mock tokens bypass authentication in verifySession
  {
    const mockTokenSuperAdmin = MOCK_USERS.SUPER_ADMIN.token;
    const session = await verifySession(mockTokenSuperAdmin);
    const mockBypassActive = session !== null && session.role.name === 'SUPER_ADMIN';
    assertTest(
      'Security Analysis',
      'Mock token backdoor check: verifySession accepts static mock tokens',
      mockBypassActive,
      'Mock token accepted (Note: this confirms whether test backdoor exists in lib/auth.ts)',
      `Session returned: role=${session?.role?.name}, email=${session?.email}`
    );
  }

  // ==========================================================================
  // SUMMARY
  // ==========================================================================
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log('\n================================================================');
  console.log('              ADVERSARIAL STRESS TEST SUMMARY                   ');
  console.log('================================================================');
  console.log(`Total Probes:  ${total}`);
  console.log(`Passed:        ${passed}`);
  console.log(`Failed:        ${failed}`);
  console.log('================================================================\n');

  if (failed > 0) {
    console.error(`FAILURE: ${failed} probe(s) detected vulnerabilities or contract breaches.`);
    process.exit(1);
  } else {
    console.log('SUCCESS: All adversarial security and RBAC probes passed.');
    process.exit(0);
  }
}

runAdversarialSuite().catch((err) => {
  console.error('Fatal crash in adversarial suite:', err);
  process.exit(1);
});
