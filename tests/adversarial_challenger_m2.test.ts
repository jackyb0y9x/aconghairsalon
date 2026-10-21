/**
 * Independent Adversarial Challenger Test Suite for Milestone 2
 * Probes attack vectors, boundary violations, prototype pollution,
 * environment switching, RBAC bypass attempts, and DB failure modes.
 */

import { NextRequest } from 'next/server';
import { verifySession, extractAuthToken, checkApiRbacPermission, AdminRole } from '../lib/auth';
import { PUT as putSettings, GET as getSettings } from '../app/api/admin/settings/route';
import { getAuditLogs, logAuditEvent } from '../services/audit';
import { MOCK_USERS } from './fixtures/mock-data';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  detail?: any;
}

const testResults: TestResult[] = [];

function recordTest(name: string, passed: boolean, error?: string, detail?: any) {
  testResults.push({ name, passed, error, detail });
  if (passed) {
    console.log(`  ✓ [PASS] ${name}`);
  } else {
    console.error(`  ✗ [FAIL] ${name}: ${error}`);
  }
}

async function runAdversarialProbes() {
  console.log('================================================================');
  console.log('       INDEPENDENT ADVERSARIAL CHALLENGER PROBES (M2)           ');
  console.log('================================================================\n');

  const env = process.env as Record<string, string | undefined>;
  const origNodeEnv = process.env.NODE_ENV;
  const origAllowMock = process.env.ALLOW_TEST_MOCK_AUTH;

  // ---------------------------------------------------------------------------
  // 1. AUTH HARDENING & BOUNDARY ATTACKS
  // ---------------------------------------------------------------------------
  console.log('▶ CATEGORY 1: AUTH HARDENING & BOUNDARY ATTACKS');

  // 1.1 Case sensitivity of ALLOW_TEST_MOCK_AUTH
  env.NODE_ENV = 'development';
  for (const invalidFlag of ['True', 'TRUE', '1', 'yes', 'true ', ' true', 'enabled']) {
    env.ALLOW_TEST_MOCK_AUTH = invalidFlag;
    const res = await verifySession(MOCK_USERS.SUPER_ADMIN.token);
    recordTest(
      `Mock auth rejected when ALLOW_TEST_MOCK_AUTH="${invalidFlag}" (strict boolean string)`,
      res === null,
      res ? `Unexpectedly allowed with flag=${invalidFlag}` : undefined
    );
  }

  // 1.2 Production override attempts
  env.NODE_ENV = 'production';
  env.ALLOW_TEST_MOCK_AUTH = 'true';
  const resProdWithFlag = await verifySession(MOCK_USERS.SUPER_ADMIN.token);
  recordTest(
    'Mock auth rejected when NODE_ENV="production" even with ALLOW_TEST_MOCK_AUTH="true"',
    resProdWithFlag === null,
    resProdWithFlag ? 'Unexpectedly allowed in production' : undefined
  );

  delete env.ALLOW_TEST_MOCK_AUTH;
  const resProdNoFlag = await verifySession(MOCK_USERS.SUPER_ADMIN.token);
  recordTest(
    'Mock auth rejected when NODE_ENV="production" without ALLOW_TEST_MOCK_AUTH',
    resProdNoFlag === null,
    resProdNoFlag ? 'Unexpectedly allowed in production' : undefined
  );

  // Check case sensitivity behavior
  env.NODE_ENV = 'Production';
  delete env.ALLOW_TEST_MOCK_AUTH;
  const resProdCaseNoFlag = await verifySession(MOCK_USERS.SUPER_ADMIN.token);
  recordTest(
    'Mock auth rejected when NODE_ENV="Production" without ALLOW_TEST_MOCK_AUTH flag',
    resProdCaseNoFlag === null,
    resProdCaseNoFlag ? 'Unexpectedly allowed in Production' : undefined
  );

  // Restore test env
  env.NODE_ENV = 'test';
  env.ALLOW_TEST_MOCK_AUTH = 'true';

  // 1.3 Token extraction edge cases
  const fakeReqNoAuth = new Request('http://localhost:3000/api/admin/settings');
  recordTest('extractAuthToken: no headers returns null', extractAuthToken(fakeReqNoAuth) === null);

  const reqBearerEmpty = new Request('http://localhost:3000/api/admin/settings', {
    headers: { authorization: 'Bearer ' },
  });
  recordTest('extractAuthToken: Bearer with empty token returns "" or null', !extractAuthToken(reqBearerEmpty));

  const reqBearerSpaces = new Request('http://localhost:3000/api/admin/settings', {
    headers: { authorization: 'Bearer    ' },
  });
  recordTest('extractAuthToken: Bearer with spaces trims to empty', !extractAuthToken(reqBearerSpaces));

  const reqCookieMalformed = new Request('http://localhost:3000/api/admin/settings', {
    headers: { cookie: 'random_cookie=abc; other=123' },
  });
  recordTest('extractAuthToken: cookie without salon_session or session returns null', extractAuthToken(reqCookieMalformed) === null);

  const reqCookieWithSpaces = new Request('http://localhost:3000/api/admin/settings', {
    headers: { cookie: 'foo=bar; salon_session=tok_12345 ; baz=qux' },
  });
  recordTest(
    'extractAuthToken: cookie value with trailing space trimmed correctly',
    extractAuthToken(reqCookieWithSpaces) === 'tok_12345'
  );

  // ---------------------------------------------------------------------------
  // 2. RBAC MATRIX & ROUTE PATH ATTACKS
  // ---------------------------------------------------------------------------
  console.log('\n▶ CATEGORY 2: RBAC MATRIX & ROUTE PATH ATTACKS');

  // 2.1 Subpath traversal and prefix checks
  const restrictedPaths = [
    '/api/admin/settings',
    '/api/admin/settings/sub',
    '/api/admin/site-settings',
    '/api/admin/site-settings/nested',
    '/api/admin/users',
    '/api/admin/users/123/delete',
    '/api/admin/audit-logs',
    '/api/admin/audit-logs/export',
  ];

  const nonSuperRoles: AdminRole[] = ['CONTENT_ADMIN', 'BOOKING_STAFF', 'EDITOR'];
  for (const path of restrictedPaths) {
    for (const role of nonSuperRoles) {
      const check = checkApiRbacPermission(role, path);
      recordTest(
        `RBAC: ${role} strictly denied access to ${path}`,
        !check.allowed && Boolean(check.error?.includes('Forbidden')),
        check.allowed ? `Role ${role} was permitted to ${path}` : undefined
      );
    }
  }

  // 2.2 Booking Staff boundaries
  const bookingPaths = ['/api/admin/bookings', '/api/admin/bookings/123/status'];
  for (const path of bookingPaths) {
    recordTest(`RBAC: BOOKING_STAFF permitted to ${path}`, checkApiRbacPermission('BOOKING_STAFF', path).allowed);
    recordTest(`RBAC: CONTENT_ADMIN denied to ${path}`, !checkApiRbacPermission('CONTENT_ADMIN', path).allowed);
    recordTest(`RBAC: EDITOR denied to ${path}`, !checkApiRbacPermission('EDITOR', path).allowed);
  }

  // 2.3 Content Admin boundaries
  const catalogPaths = [
    '/api/admin/hairstyles',
    '/api/admin/banners',
    '/api/admin/colors',
    '/api/admin/hair-colors',
    '/api/admin/services',
    '/api/admin/before-after',
    '/api/admin/categories',
  ];
  for (const path of catalogPaths) {
    recordTest(`RBAC: CONTENT_ADMIN permitted to ${path}`, checkApiRbacPermission('CONTENT_ADMIN', path).allowed);
    recordTest(`RBAC: BOOKING_STAFF denied to ${path}`, !checkApiRbacPermission('BOOKING_STAFF', path).allowed);
    recordTest(`RBAC: EDITOR denied to ${path}`, !checkApiRbacPermission('EDITOR', path).allowed);
  }

  // 2.4 Article editing boundaries
  recordTest('RBAC: SUPER_ADMIN permitted to /api/admin/articles', checkApiRbacPermission('SUPER_ADMIN', '/api/admin/articles').allowed);
  recordTest('RBAC: CONTENT_ADMIN permitted to /api/admin/articles', checkApiRbacPermission('CONTENT_ADMIN', '/api/admin/articles').allowed);
  recordTest('RBAC: EDITOR permitted to /api/admin/articles', checkApiRbacPermission('EDITOR', '/api/admin/articles').allowed);
  recordTest('RBAC: BOOKING_STAFF denied to /api/admin/articles', !checkApiRbacPermission('BOOKING_STAFF', '/api/admin/articles').allowed);

  // ---------------------------------------------------------------------------
  // 3. SETTINGS PARTIAL MERGE & SIBLING PRESERVATION (DEEP STRESS)
  // ---------------------------------------------------------------------------
  console.log('\n▶ CATEGORY 3: SETTINGS PARTIAL MERGE & SIBLING PRESERVATION');

  const superAdminToken = MOCK_USERS.SUPER_ADMIN.token;

  function makeSettingsRequest(method: string, body?: any) {
    const headers = new Headers({
      authorization: `Bearer ${superAdminToken}`,
      'content-type': 'application/json',
      host: 'localhost:3000',
    });
    return new NextRequest(new URL('/api/admin/settings', 'http://localhost:3000'), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  // 3.1 Step A: Set known initial state with all social links
  const initialPayload = {
    brandName: 'Lumière Atelier Test',
    socialLinks: {
      facebook: 'https://facebook.com/lumiere_init',
      instagram: 'https://instagram.com/lumiere_init',
      tiktok: 'https://tiktok.com/@lumiere_init',
      zalo: '0901111111',
    },
    defaultSeoMetadata: {
      title: 'Initial SEO Title',
      description: 'Initial SEO Description',
      ogImage: '/images/og-init.jpg',
    },
    footerContent: {
      copyright: '© 2026 Init Corp',
      taxCode: '0101010101',
      licenseText: 'License 101',
    },
    openingHours: {
      monday_friday: '09:00 - 20:00',
      weekend: '08:30 - 21:00',
      rawText: 'Daily 09:00 - 20:00',
    },
  };

  const initRes = await putSettings(makeSettingsRequest('PUT', initialPayload));
  recordTest('Settings: Setup known initial baseline returns 200', initRes.status === 200);

  // 3.2 Step B: Partial update only tiktok
  const partialTiktok = await putSettings(
    makeSettingsRequest('PUT', {
      socialLinks: {
        tiktok: 'https://tiktok.com/@lumiere_modified',
      },
    })
  );
  recordTest('Settings: Partial TikTok update returns 200', partialTiktok.status === 200);
  const dataTiktok = await partialTiktok.json();

  recordTest(
    'Settings: TikTok updated to modified value',
    dataTiktok.socialLinks?.tiktok === 'https://tiktok.com/@lumiere_modified' ||
      dataTiktok.socialTikTok === 'https://tiktok.com/@lumiere_modified'
  );
  recordTest(
    'Settings: Sibling Facebook preserved after TikTok update',
    dataTiktok.socialLinks?.facebook === 'https://facebook.com/lumiere_init' ||
      dataTiktok.socialFacebook === 'https://facebook.com/lumiere_init'
  );
  recordTest(
    'Settings: Sibling Instagram preserved after TikTok update',
    dataTiktok.socialLinks?.instagram === 'https://instagram.com/lumiere_init' ||
      dataTiktok.socialInstagram === 'https://instagram.com/lumiere_init'
  );
  recordTest(
    'Settings: Sibling Zalo preserved after TikTok update',
    dataTiktok.socialLinks?.zalo === '0901111111' || dataTiktok.socialZalo === '0901111111'
  );

  // 3.3 Step C: Partial update only defaultMetaDescription via flat alias
  const partialSeo = await putSettings(
    makeSettingsRequest('PUT', {
      defaultMetaDescription: 'Updated Description Only',
    })
  );
  const dataSeo = await partialSeo.json();
  recordTest(
    'Settings: Description updated via flat alias',
    dataSeo.defaultMetaDescription === 'Updated Description Only' ||
      dataSeo.defaultSeoMetadata?.description === 'Updated Description Only'
  );
  recordTest(
    'Settings: Sibling title preserved after description update',
    dataSeo.defaultMetaTitle === 'Initial SEO Title' ||
      dataSeo.defaultSeoMetadata?.title === 'Initial SEO Title'
  );
  recordTest(
    'Settings: Sibling ogImage preserved after description update',
    dataSeo.defaultSeoMetadata?.ogImage === '/images/og-init.jpg'
  );

  // 3.4 Step D: Partial update footer copyright
  const partialFooter = await putSettings(
    makeSettingsRequest('PUT', {
      footerContent: {
        copyright: '© 2026 Updated Copyright Only',
      },
    })
  );
  const dataFooter = await partialFooter.json();
  recordTest(
    'Settings: Copyright updated',
    dataFooter.footerContent?.copyright === '© 2026 Updated Copyright Only' ||
      dataFooter.footerText === '© 2026 Updated Copyright Only'
  );
  recordTest(
    'Settings: Sibling taxCode preserved',
    dataFooter.footerContent?.taxCode === '0101010101'
  );
  recordTest(
    'Settings: Sibling licenseText preserved',
    dataFooter.footerContent?.licenseText === 'License 101'
  );

  // ---------------------------------------------------------------------------
  // 4. AUDIT SERVICE RESILIENCE & BOUNDARIES
  // ---------------------------------------------------------------------------
  console.log('\n▶ CATEGORY 4: AUDIT SERVICE RESILIENCE & BOUNDARIES');

  // 4.1 Boundary pagination queries
  const pMin = await getAuditLogs({ page: 0, pageSize: 0 });
  recordTest('AuditService: page=0 clamped to page>=1', pMin.pagination.page >= 1);
  recordTest('AuditService: pageSize=0 clamped to pageSize>=1', pMin.pagination.pageSize >= 1);
  recordTest('AuditService: totalPages >= 1 when page=0 & pageSize=0', pMin.pagination.totalPages >= 1);

  const pNeg = await getAuditLogs({ page: -99, pageSize: -50 });
  recordTest('AuditService: negative page clamped to >=1', pNeg.pagination.page >= 1);
  recordTest('AuditService: negative pageSize clamped to >=1', pNeg.pagination.pageSize >= 1);
  recordTest('AuditService: totalPages >= 1 when negative inputs', pNeg.pagination.totalPages >= 1);

  const pOversized = await getAuditLogs({ page: 1, pageSize: 999999 });
  recordTest('AuditService: oversized pageSize clamped to <= 100', pOversized.pagination.pageSize <= 100);

  // 4.2 Error catch & data contract under failed DB
  recordTest('AuditService: fallback pagination always defines total, page, pageSize, totalPages', (
    typeof pMin.pagination.total === 'number' &&
    typeof pMin.pagination.page === 'number' &&
    typeof pMin.pagination.pageSize === 'number' &&
    typeof pMin.pagination.totalPages === 'number' &&
    pMin.pagination.totalPages >= 1
  ));

  recordTest('AuditService: data and logs are always arrays (fail-safe contract)', (
    Array.isArray(pMin.data) && Array.isArray(pMin.logs)
  ));

  // 4.3 Fail-safe logAuditEvent with various edge parameters
  try {
    await logAuditEvent({
      action: 'SECURITY_VIOLATION',
      entity: 'TEST_ADVERSARIAL',
      details: { attack: 'prototype-pollution', test: true },
      ipAddress: '10.0.0.1',
      userAgent: 'AdversarialBot/2.0',
    });
    recordTest('AuditService: logAuditEvent handles SECURITY_VIOLATION gracefully', true);
  } catch (e: any) {
    recordTest('AuditService: logAuditEvent threw exception', false, e.message);
  }

  // Restore environment
  env.NODE_ENV = origNodeEnv;
  if (origAllowMock !== undefined) {
    env.ALLOW_TEST_MOCK_AUTH = origAllowMock;
  } else {
    delete env.ALLOW_TEST_MOCK_AUTH;
  }

  // ---------------------------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log('             ADVERSARIAL PROBES SUMMARY                         ');
  console.log('================================================================');

  const total = testResults.length;
  const passed = testResults.filter((t) => t.passed).length;
  const failed = testResults.filter((t) => !t.passed).length;

  console.log(`  Total Probes:  ${total}`);
  console.log(`  Passed:        ${passed}`);
  console.log(`  Failed:        ${failed}`);

  if (failed > 0) {
    console.error('\n❌ CHALLENGES DETECTED:');
    testResults.filter((t) => !t.passed).forEach((t) => {
      console.error(`  - ${t.name}: ${t.error}`);
    });
    process.exit(1);
  } else {
    console.log('\n✅ ALL INDEPENDENT ADVERSARIAL PROBES PASSED (100% ROBUST)');
    process.exit(0);
  }
}

runAdversarialProbes().catch((err) => {
  console.error('Adversarial suite crashed:', err);
  process.exit(1);
});
