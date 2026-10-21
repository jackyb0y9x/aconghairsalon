/**
 * Independent Adversarial Challenger Test Suite for Milestone 3
 * Probes attack vectors, boundary violations, prototype pollution,
 * RBAC privilege escalation, malformed enums, and 5-state FSM constraints.
 */

process.env.ALLOW_TEST_MOCK_AUTH = 'true';

import { NextRequest } from 'next/server';
import { MOCK_USERS, getTomorrowDateString } from './fixtures/mock-data';
import {
  validateBookingTransition,
  isTerminalStatus,
} from '../lib/booking-state-machine';

// Route Handlers
import { GET as getBanners, POST as postBanner } from '../app/api/admin/banners/route';
import { GET as getBannerById, PATCH as patchBanner, DELETE as deleteBanner } from '../app/api/admin/banners/[id]/route';
import { POST as toggleBanner } from '../app/api/admin/banners/[id]/toggle/route';

import { GET as getCategories, POST as postCategory } from '../app/api/admin/categories/route';
import { GET as getCategoryById, PATCH as patchCategory, DELETE as deleteCategory } from '../app/api/admin/categories/[id]/route';

import { GET as getHairstyles, POST as postHairstyle } from '../app/api/admin/hairstyles/route';
import { GET as getHairstyleById, PATCH as patchHairstyle, DELETE as deleteHairstyle } from '../app/api/admin/hairstyles/[id]/route';

import { GET as getColors, POST as postColor } from '../app/api/admin/colors/route';
import { GET as getColorById, PATCH as patchColor, DELETE as deleteColor } from '../app/api/admin/colors/[id]/route';

import { GET as getBeforeAfter, POST as postBeforeAfter } from '../app/api/admin/before-after/route';
import { GET as getBeforeAfterById, PATCH as patchBeforeAfter, DELETE as deleteBeforeAfter } from '../app/api/admin/before-after/[id]/route';
import { POST as toggleFeatureBeforeAfter } from '../app/api/admin/before-after/[id]/feature/route';

import { GET as getServices, POST as postService } from '../app/api/admin/services/route';
import { GET as getServiceById, PATCH as patchService, DELETE as deleteService } from '../app/api/admin/services/[id]/route';
import { GET as getCombos, POST as postCombo } from '../app/api/admin/services/combos/route';
import { GET as getComboById, PATCH as patchCombo, DELETE as deleteCombo } from '../app/api/admin/services/combos/[id]/route';

import { GET as getArticles, POST as postArticle } from '../app/api/admin/articles/route';
import { GET as getArticleById, PATCH as patchArticle, DELETE as deleteArticle } from '../app/api/admin/articles/[id]/route';
import { POST as publishArticle } from '../app/api/admin/articles/[id]/publish/route';

import { POST as publicCreateBooking } from '../app/api/bookings/route';
import { GET as getAdminBookings } from '../app/api/admin/bookings/route';
import { GET as getAdminBookingById } from '../app/api/admin/bookings/[id]/route';
import { PATCH as patchBookingStatus } from '../app/api/admin/bookings/[id]/status/route';
import { PATCH as patchBookingAssign } from '../app/api/admin/bookings/[id]/assign/route';
import { PATCH as patchBookingNotes } from '../app/api/admin/bookings/[id]/notes/route';

import { GET as getAuditLogs } from '../app/api/admin/audit-logs/route';
import { PUT as putSettings } from '../app/api/admin/settings/route';

interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  error?: string;
  details?: any;
}

const testResults: TestResult[] = [];

function recordTest(suite: string, name: string, passed: boolean, error?: string, details?: any) {
  testResults.push({ suite, name, passed, error, details });
  if (passed) {
    console.log(`  ✓ [PASS] [${suite}] ${name}`);
  } else {
    console.error(`  ✗ [FAIL] [${suite}] ${name}: ${error}`);
  }
}

function makeRequest(
  url: string,
  method: string = 'GET',
  options: {
    token?: string;
    body?: any;
    headers?: Record<string, string>;
  } = {}
): NextRequest {
  const headers = new Headers(options.headers || {});
  headers.set('host', 'localhost:3000');

  if (options.token) {
    headers.set('authorization', `Bearer ${options.token}`);
  }

  let bodyStr: string | undefined = undefined;
  if (options.body !== undefined) {
    headers.set('content-type', 'application/json');
    bodyStr = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
  }

  return new NextRequest(new URL(url, 'http://localhost:3000'), {
    method,
    headers,
    body: bodyStr,
  });
}

async function runAdversarialM3Probes() {
  console.log('================================================================================');
  console.log('       INDEPENDENT ADVERSARIAL CHALLENGER PROBES (M3 CONTENT & RBAC)            ');
  console.log('================================================================================\n');

  const superToken = MOCK_USERS.SUPER_ADMIN.token;
  const contentToken = MOCK_USERS.CONTENT_ADMIN.token;
  const bookingToken = MOCK_USERS.BOOKING_STAFF.token;
  const editorToken = MOCK_USERS.EDITOR.token;

  // ---------------------------------------------------------------------------
  // SUITE 1: RBAC PRIVILEGE ESCALATION & ACCESS CONTROL ATTACKS
  // ---------------------------------------------------------------------------
  console.log('▶ SUITE 1: RBAC Privilege Escalation & Boundary Violations');
  {
    // 1.1 Unauthenticated requests to all content and booking endpoints return 401
    const unauthBanner = await getBanners(makeRequest('/api/admin/banners', 'GET'));
    recordTest('RBAC', 'Unauthenticated GET /api/admin/banners returns 401', unauthBanner.status === 401);

    const unauthStyle = await getHairstyles(makeRequest('/api/admin/hairstyles', 'GET'));
    recordTest('RBAC', 'Unauthenticated GET /api/admin/hairstyles returns 401', unauthStyle.status === 401);

    const unauthColor = await getColors(makeRequest('/api/admin/colors', 'GET'));
    recordTest('RBAC', 'Unauthenticated GET /api/admin/colors returns 401', unauthColor.status === 401);

    const unauthService = await getServices(makeRequest('/api/admin/services', 'GET'));
    recordTest('RBAC', 'Unauthenticated GET /api/admin/services returns 401', unauthService.status === 401);

    const unauthBooking = await getAdminBookings(makeRequest('/api/admin/bookings', 'GET'));
    recordTest('RBAC', 'Unauthenticated GET /api/admin/bookings returns 401', unauthBooking.status === 401);

    const unauthAudit = await getAuditLogs(makeRequest('/api/admin/audit-logs', 'GET'));
    recordTest('RBAC', 'Unauthenticated GET /api/admin/audit-logs returns 401', unauthAudit.status === 401);

    // 1.2 Bogus token returns 401
    const bogusReq = makeRequest('/api/admin/banners', 'GET', { token: 'bogus_forged_token_xyz' });
    const bogusRes = await getBanners(bogusReq);
    recordTest('RBAC', 'Forged/bogus Bearer token returns 401', bogusRes.status === 401);

    // 1.3 EDITOR attempting privilege escalation across unauthorized resources (Strict 403)
    const edBanner = await postBanner(makeRequest('/api/admin/banners', 'POST', { token: editorToken, body: { title: 'Ed' } }));
    recordTest('RBAC', 'EDITOR cannot create Banners (403)', edBanner.status === 403);

    const edPatchBanner = await patchBanner(makeRequest('/api/admin/banners/b1', 'PATCH', { token: editorToken, body: { title: 'Ed' } }), { params: { id: 'b1' } });
    recordTest('RBAC', 'EDITOR cannot patch Banners (403)', edPatchBanner.status === 403);

    const edDelBanner = await deleteBanner(makeRequest('/api/admin/banners/b1', 'DELETE', { token: editorToken }), { params: { id: 'b1' } });
    recordTest('RBAC', 'EDITOR cannot delete Banners (403)', edDelBanner.status === 403);

    const edToggleBanner = await toggleBanner(makeRequest('/api/admin/banners/b1/toggle', 'POST', { token: editorToken }), { params: { id: 'b1' } });
    recordTest('RBAC', 'EDITOR cannot toggle Banners (403)', edToggleBanner.status === 403);

    const edCat = await postCategory(makeRequest('/api/admin/categories', 'POST', { token: editorToken, body: { name: 'Cat' } }));
    recordTest('RBAC', 'EDITOR cannot create Categories (403)', edCat.status === 403);

    const edStyle = await postHairstyle(makeRequest('/api/admin/hairstyles', 'POST', { token: editorToken, body: { title: 'Style' } }));
    recordTest('RBAC', 'EDITOR cannot create Hairstyles (403)', edStyle.status === 403);

    const edColor = await postColor(makeRequest('/api/admin/colors', 'POST', { token: editorToken, body: { name: 'Col' } }));
    recordTest('RBAC', 'EDITOR cannot create Hair Colors (403)', edColor.status === 403);

    const edBA = await postBeforeAfter(makeRequest('/api/admin/before-after', 'POST', { token: editorToken, body: { title: 'BA' } }));
    recordTest('RBAC', 'EDITOR cannot create BeforeAfter (403)', edBA.status === 403);

    const edSrv = await postService(makeRequest('/api/admin/services', 'POST', { token: editorToken, body: { title: 'Srv' } }));
    recordTest('RBAC', 'EDITOR cannot create Services (403)', edSrv.status === 403);

    const edCombo = await postCombo(makeRequest('/api/admin/services/combos', 'POST', { token: editorToken, body: { title: 'Cmb' } }));
    recordTest('RBAC', 'EDITOR cannot create Combos (403)', edCombo.status === 403);

    const edBookings = await getAdminBookings(makeRequest('/api/admin/bookings', 'GET', { token: editorToken }));
    recordTest('RBAC', 'EDITOR cannot list Bookings (403)', edBookings.status === 403);

    const edBookStatus = await patchBookingStatus(makeRequest('/api/admin/bookings/bk1/status', 'PATCH', { token: editorToken, body: { status: 'CONFIRMED' } }), { params: { id: 'bk1' } });
    recordTest('RBAC', 'EDITOR cannot mutate Booking Status (403)', edBookStatus.status === 403);

    const edAudit = await getAuditLogs(makeRequest('/api/admin/audit-logs', 'GET', { token: editorToken }));
    recordTest('RBAC', 'EDITOR cannot view Audit Logs (403)', edAudit.status === 403);

    const edSettings = await putSettings(makeRequest('/api/admin/settings', 'PUT', { token: editorToken, body: { brandName: 'Hacked' } }));
    recordTest('RBAC', 'EDITOR cannot mutate Site Settings (403)', edSettings.status === 403);

    // 1.4 BOOKING_STAFF attempting privilege escalation on catalog and system entities (Strict 403)
    const staffBanner = await postBanner(makeRequest('/api/admin/banners', 'POST', { token: bookingToken, body: { title: 'Stf' } }));
    recordTest('RBAC', 'BOOKING_STAFF cannot create Banners (403)', staffBanner.status === 403);

    const staffCat = await postCategory(makeRequest('/api/admin/categories', 'POST', { token: bookingToken, body: { name: 'Stf' } }));
    recordTest('RBAC', 'BOOKING_STAFF cannot create Categories (403)', staffCat.status === 403);

    const staffStyle = await postHairstyle(makeRequest('/api/admin/hairstyles', 'POST', { token: bookingToken, body: { title: 'Stf' } }));
    recordTest('RBAC', 'BOOKING_STAFF cannot create Hairstyles (403)', staffStyle.status === 403);

    const staffColor = await postColor(makeRequest('/api/admin/colors', 'POST', { token: bookingToken, body: { name: 'Stf' } }));
    recordTest('RBAC', 'BOOKING_STAFF cannot create Hair Colors (403)', staffColor.status === 403);

    const staffBA = await postBeforeAfter(makeRequest('/api/admin/before-after', 'POST', { token: bookingToken, body: { title: 'Stf' } }));
    recordTest('RBAC', 'BOOKING_STAFF cannot create BeforeAfter (403)', staffBA.status === 403);

    const staffSrv = await postService(makeRequest('/api/admin/services', 'POST', { token: bookingToken, body: { title: 'Stf' } }));
    recordTest('RBAC', 'BOOKING_STAFF cannot create Services (403)', staffSrv.status === 403);

    const staffCombo = await postCombo(makeRequest('/api/admin/services/combos', 'POST', { token: bookingToken, body: { title: 'Stf' } }));
    recordTest('RBAC', 'BOOKING_STAFF cannot create Combos (403)', staffCombo.status === 403);

    const staffArt = await postArticle(makeRequest('/api/admin/articles', 'POST', { token: bookingToken, body: { title: 'Stf' } }));
    recordTest('RBAC', 'BOOKING_STAFF cannot create Articles (403)', staffArt.status === 403);

    const staffAudit = await getAuditLogs(makeRequest('/api/admin/audit-logs', 'GET', { token: bookingToken }));
    recordTest('RBAC', 'BOOKING_STAFF cannot view Audit Logs (403)', staffAudit.status === 403);

    const staffSettings = await putSettings(makeRequest('/api/admin/settings', 'PUT', { token: bookingToken, body: { brandName: 'Hacked' } }));
    recordTest('RBAC', 'BOOKING_STAFF cannot mutate Site Settings (403)', staffSettings.status === 403);

    // 1.5 CONTENT_ADMIN attempting privilege escalation on bookings and system settings (Strict 403)
    const contentBookings = await getAdminBookings(makeRequest('/api/admin/bookings', 'GET', { token: contentToken }));
    recordTest('RBAC', 'CONTENT_ADMIN cannot list Bookings (403)', contentBookings.status === 403);

    const contentBookStatus = await patchBookingStatus(makeRequest('/api/admin/bookings/bk1/status', 'PATCH', { token: contentToken, body: { status: 'CONFIRMED' } }), { params: { id: 'bk1' } });
    recordTest('RBAC', 'CONTENT_ADMIN cannot update Booking Status (403)', contentBookStatus.status === 403);

    const contentAssign = await patchBookingAssign(makeRequest('/api/admin/bookings/bk1/assign', 'PATCH', { token: contentToken, body: { stylistId: 'st1' } }), { params: { id: 'bk1' } });
    recordTest('RBAC', 'CONTENT_ADMIN cannot assign Stylist to Booking (403)', contentAssign.status === 403);

    const contentNotes = await patchBookingNotes(makeRequest('/api/admin/bookings/bk1/notes', 'PATCH', { token: contentToken, body: { internalNotes: 'Note' } }), { params: { id: 'bk1' } });
    recordTest('RBAC', 'CONTENT_ADMIN cannot update Booking internal notes (403)', contentNotes.status === 403);

    const contentAudit = await getAuditLogs(makeRequest('/api/admin/audit-logs', 'GET', { token: contentToken }));
    recordTest('RBAC', 'CONTENT_ADMIN cannot view Audit Logs (403)', contentAudit.status === 403);

    const contentSettings = await putSettings(makeRequest('/api/admin/settings', 'PUT', { token: contentToken, body: { brandName: 'Hacked' } }));
    recordTest('RBAC', 'CONTENT_ADMIN cannot mutate Site Settings (403)', contentSettings.status === 403);
  }

  // ---------------------------------------------------------------------------
  // SUITE 2: MALFORMED PAYLOADS & NEGATIVE BOUNDARY STRESS
  // ---------------------------------------------------------------------------
  console.log('\n▶ SUITE 2: Malformed Payloads & Boundary Violation Probes');
  {
    // 2.1 Banners boundary probes
    const bEmpty = await postBanner(makeRequest('/api/admin/banners', 'POST', { token: superToken, body: {} }));
    recordTest('Boundary', 'Banner: Empty payload rejected with 400', bEmpty.status === 400);

    const bShortTitle = await postBanner(makeRequest('/api/admin/banners', 'POST', { token: superToken, body: { title: 'A', imageUrl: 'http://img.jpg' } }));
    recordTest('Boundary', 'Banner: Title < 2 chars rejected with 400', bShortTitle.status === 400);

    const bLongTitle = await postBanner(makeRequest('/api/admin/banners', 'POST', { token: superToken, body: { title: 'A'.repeat(151), imageUrl: 'http://img.jpg' } }));
    recordTest('Boundary', 'Banner: Title > 150 chars rejected with 400', bLongTitle.status === 400);

    const bNoImage = await postBanner(makeRequest('/api/admin/banners', 'POST', { token: superToken, body: { title: 'Valid Title' } }));
    recordTest('Boundary', 'Banner: Missing imageUrl rejected with 400', bNoImage.status === 400);

    const bLongSubtitle = await postBanner(makeRequest('/api/admin/banners', 'POST', { token: superToken, body: { title: 'Valid Title', imageUrl: 'http://img.jpg', subtitle: 'S'.repeat(251) } }));
    recordTest('Boundary', 'Banner: Subtitle > 250 chars rejected with 400', bLongSubtitle.status === 400);

    const bLongBadge = await postBanner(makeRequest('/api/admin/banners', 'POST', { token: superToken, body: { title: 'Valid Title', imageUrl: 'http://img.jpg', badgeText: 'B'.repeat(51) } }));
    recordTest('Boundary', 'Banner: BadgeText > 50 chars rejected with 400', bLongBadge.status === 400);

    // 2.2 Categories boundary probes
    const catEmpty = await postCategory(makeRequest('/api/admin/categories', 'POST', { token: contentToken, body: {} }));
    recordTest('Boundary', 'Category: Empty payload rejected with 400', catEmpty.status === 400);

    const catShortName = await postCategory(makeRequest('/api/admin/categories', 'POST', { token: contentToken, body: { name: 'X' } }));
    recordTest('Boundary', 'Category: Name < 2 chars rejected with 400', catShortName.status === 400);

    const catLongName = await postCategory(makeRequest('/api/admin/categories', 'POST', { token: contentToken, body: { name: 'N'.repeat(101) } }));
    recordTest('Boundary', 'Category: Name > 100 chars rejected with 400', catLongName.status === 400);

    const catInvalidType = await postCategory(makeRequest('/api/admin/categories', 'POST', { token: contentToken, body: { name: 'Valid Cat', type: 'SUPER_CATEGORY' } }));
    recordTest('Boundary', 'Category: Invalid enum type rejected with 400', catInvalidType.status === 400);

    // 2.3 Hairstyles boundary probes
    const hEmpty = await postHairstyle(makeRequest('/api/admin/hairstyles', 'POST', { token: contentToken, body: {} }));
    recordTest('Boundary', 'Hairstyle: Empty payload rejected with 400', hEmpty.status === 400);

    const hEmptyTitle = await postHairstyle(makeRequest('/api/admin/hairstyles', 'POST', { token: contentToken, body: { title: '   ', slug: 'style-slug' } }));
    recordTest('Boundary', 'Hairstyle: Blank whitespace title rejected with 400', hEmptyTitle.status === 400);

    const hMissingSlug = await postHairstyle(makeRequest('/api/admin/hairstyles', 'POST', { token: contentToken, body: { title: 'Layer Cut', slug: '' } }));
    recordTest('Boundary', 'Hairstyle: Empty string slug rejected with 400', hMissingSlug.status === 400);

    const hLongSummary = await postHairstyle(makeRequest('/api/admin/hairstyles', 'POST', { token: contentToken, body: { title: 'Valid Style', slug: 'valid-slug', summary: 'S'.repeat(501) } }));
    recordTest('Boundary', 'Hairstyle: Summary > 500 chars rejected with 400', hLongSummary.status === 400);

    // 2.4 Hair Colors boundary probes
    const cEmpty = await postColor(makeRequest('/api/admin/colors', 'POST', { token: superToken, body: {} }));
    recordTest('Boundary', 'Color: Empty payload rejected with 400', cEmpty.status === 400);

    const cShortName = await postColor(makeRequest('/api/admin/colors', 'POST', { token: superToken, body: { name: 'C', hexColor: '#123456' } }));
    recordTest('Boundary', 'Color: Name < 2 chars rejected with 400', cShortName.status === 400);

    const cNoHex = await postColor(makeRequest('/api/admin/colors', 'POST', { token: superToken, body: { name: 'Nâu Khói' } }));
    recordTest('Boundary', 'Color: Missing hexCode and hexColor rejected with 400', cNoHex.status === 400);

    const cInvalidHexShort = await postColor(makeRequest('/api/admin/colors', 'POST', { token: superToken, body: { name: 'Nâu Khói', hexColor: '#12' } }));
    recordTest('Boundary', 'Color: Malformed hex format (#12) rejected with 400', cInvalidHexShort.status === 400);

    const cInvalidHexChars = await postColor(makeRequest('/api/admin/colors', 'POST', { token: superToken, body: { name: 'Nâu Khói', hexColor: '#ZZZZZZ' } }));
    recordTest('Boundary', 'Color: Malformed non-hex characters (#ZZZZZZ) rejected with 400', cInvalidHexChars.status === 400);

    const cInvalidTone = await postColor(makeRequest('/api/admin/colors', 'POST', { token: superToken, body: { name: 'Nâu Khói', hexColor: '#123456', tone: 'INFRARED' } }));
    recordTest('Boundary', 'Color: Invalid Tone enum value rejected with 400', cInvalidTone.status === 400);

    const cInvalidGroup = await postColor(makeRequest('/api/admin/colors', 'POST', { token: superToken, body: { name: 'Nâu Khói', hexColor: '#123456', group: 'RAINBOW' } }));
    recordTest('Boundary', 'Color: Invalid Group enum value rejected with 400', cInvalidGroup.status === 400);

    const cNegBleach = await postColor(makeRequest('/api/admin/colors', 'POST', { token: superToken, body: { name: 'Nâu Khói', hexColor: '#123456', bleachRounds: -1 } }));
    recordTest('Boundary', 'Color: Negative bleach rounds rejected with 400', cNegBleach.status === 400);

    const cMaxBleach = await postColor(makeRequest('/api/admin/colors', 'POST', { token: superToken, body: { name: 'Nâu Khói', hexColor: '#123456', bleachRounds: 6 } }));
    recordTest('Boundary', 'Color: Bleach rounds > 5 rejected with 400', cMaxBleach.status === 400);

    const cLowBrightness = await postColor(makeRequest('/api/admin/colors', 'POST', { token: superToken, body: { name: 'Nâu Khói', hexColor: '#123456', brightnessLevel: 0 } }));
    recordTest('Boundary', 'Color: Brightness level < 1 rejected with 400', cLowBrightness.status === 400);

    const cHighBrightness = await postColor(makeRequest('/api/admin/colors', 'POST', { token: superToken, body: { name: 'Nâu Khói', hexColor: '#123456', brightnessLevel: 11 } }));
    recordTest('Boundary', 'Color: Brightness level > 10 rejected with 400', cHighBrightness.status === 400);

    // 2.5 Before & After boundary probes
    const baEmpty = await postBeforeAfter(makeRequest('/api/admin/before-after', 'POST', { token: contentToken, body: {} }));
    recordTest('Boundary', 'BeforeAfter: Empty payload rejected with 400', baEmpty.status === 400);

    const baShortTitle = await postBeforeAfter(makeRequest('/api/admin/before-after', 'POST', { token: contentToken, body: { title: 'AB', beforeImageUrl: 'http://b.jpg', afterImageUrl: 'http://a.jpg' } }));
    recordTest('Boundary', 'BeforeAfter: Title < 3 chars rejected with 400', baShortTitle.status === 400);

    const baNoBeforeImg = await postBeforeAfter(makeRequest('/api/admin/before-after', 'POST', { token: contentToken, body: { title: 'Showcase Valid', afterImageUrl: 'http://a.jpg' } }));
    recordTest('Boundary', 'BeforeAfter: Missing beforeImageUrl rejected with 400', baNoBeforeImg.status === 400);

    const baNoAfterImg = await postBeforeAfter(makeRequest('/api/admin/before-after', 'POST', { token: contentToken, body: { title: 'Showcase Valid', beforeImageUrl: 'http://b.jpg' } }));
    recordTest('Boundary', 'BeforeAfter: Missing afterImageUrl rejected with 400', baNoAfterImg.status === 400);

    const baNegOrder = await postBeforeAfter(makeRequest('/api/admin/before-after', 'POST', { token: contentToken, body: { title: 'Showcase Valid', beforeImageUrl: 'http://b.jpg', afterImageUrl: 'http://a.jpg', displayOrder: -5 } }));
    recordTest('Boundary', 'BeforeAfter: Negative displayOrder rejected with 400', baNegOrder.status === 400);

    // 2.6 Services & Combos boundary probes
    const srvEmpty = await postService(makeRequest('/api/admin/services', 'POST', { token: superToken, body: {} }));
    recordTest('Boundary', 'Service: Empty payload rejected with 400', srvEmpty.status === 400);

    const srvShortDesc = await postService(makeRequest('/api/admin/services', 'POST', { token: superToken, body: { title: 'Cắt Tóc', description: 'Ngắn', durationMinutes: 45 } }));
    recordTest('Boundary', 'Service: Description < 10 chars rejected with 400', srvShortDesc.status === 400);

    const srvShortDuration = await postService(makeRequest('/api/admin/services', 'POST', { token: superToken, body: { title: 'Cắt Tóc', description: 'Mô tả dịch vụ chuẩn dài', durationMinutes: 10 } }));
    recordTest('Boundary', 'Service: Duration < 15 min rejected with 400', srvShortDuration.status === 400);

    const srvLongDuration = await postService(makeRequest('/api/admin/services', 'POST', { token: superToken, body: { title: 'Cắt Tóc', description: 'Mô tả dịch vụ chuẩn dài', durationMinutes: 500 } }));
    recordTest('Boundary', 'Service: Duration > 480 min rejected with 400', srvLongDuration.status === 400);

    const srvNegPrice = await postService(makeRequest('/api/admin/services', 'POST', { token: superToken, body: { title: 'Cắt Tóc', description: 'Mô tả dịch vụ chuẩn dài', durationMinutes: 45, priceMin: -50000 } }));
    recordTest('Boundary', 'Service: Negative priceMin rejected with 400', srvNegPrice.status === 400);

    const comboEmptyServices = await postCombo(makeRequest('/api/admin/services/combos', 'POST', { token: superToken, body: { title: 'Combo 1', description: 'Mô tả combo chuẩn dài', packagePrice: 500000, originalPrice: 700000, serviceIds: [] } }));
    recordTest('Boundary', 'Combo: Empty serviceIds array rejected with 400', comboEmptyServices.status === 400);

    const comboNegPrice = await postCombo(makeRequest('/api/admin/services/combos', 'POST', { token: superToken, body: { title: 'Combo 1', description: 'Mô tả combo chuẩn dài', packagePrice: -50000, originalPrice: 700000, serviceIds: ['srv-1'] } }));
    recordTest('Boundary', 'Combo: Negative packagePrice rejected with 400', comboNegPrice.status === 400);

    const comboShortDuration = await postCombo(makeRequest('/api/admin/services/combos', 'POST', { token: superToken, body: { title: 'Combo 1', description: 'Mô tả combo chuẩn dài', packagePrice: 500000, originalPrice: 700000, serviceIds: ['srv-1'], durationMinutes: 20 } }));
    recordTest('Boundary', 'Combo: Duration < 30 min rejected with 400', comboShortDuration.status === 400);

    // 2.7 Articles boundary probes
    const artEmpty = await postArticle(makeRequest('/api/admin/articles', 'POST', { token: editorToken, body: {} }));
    recordTest('Boundary', 'Article: Empty payload rejected with 400', artEmpty.status === 400);

    const artShortTitle = await postArticle(makeRequest('/api/admin/articles', 'POST', { token: editorToken, body: { title: 'Hi', excerpt: 'Tóm tắt bài viết chuẩn', content: 'Nội dung bài viết đầy đủ chuẩn dài', coverImageUrl: 'http://img.jpg' } }));
    recordTest('Boundary', 'Article: Title < 3 chars rejected with 400', artShortTitle.status === 400);

    const artShortExcerpt = await postArticle(makeRequest('/api/admin/articles', 'POST', { token: editorToken, body: { title: 'Tiêu Đề Bài Viết', excerpt: 'Ngắn', content: 'Nội dung bài viết đầy đủ chuẩn dài', coverImageUrl: 'http://img.jpg' } }));
    recordTest('Boundary', 'Article: Excerpt < 10 chars rejected with 400', artShortExcerpt.status === 400);

    const artShortContent = await postArticle(makeRequest('/api/admin/articles', 'POST', { token: editorToken, body: { title: 'Tiêu Đề Bài Viết', excerpt: 'Tóm tắt bài viết chuẩn', content: 'Ngắn', coverImageUrl: 'http://img.jpg' } }));
    recordTest('Boundary', 'Article: Content < 20 chars rejected with 400', artShortContent.status === 400);

    const artNoCover = await postArticle(makeRequest('/api/admin/articles', 'POST', { token: editorToken, body: { title: 'Tiêu Đề Bài Viết', excerpt: 'Tóm tắt bài viết chuẩn', content: 'Nội dung bài viết đầy đủ chuẩn dài' } }));
    recordTest('Boundary', 'Article: Missing coverImageUrl rejected with 400', artNoCover.status === 400);
  }

  // ---------------------------------------------------------------------------
  // SUITE 3: MALFORMED INJECTIONS & ADVERSARIAL RESILIENCE
  // ---------------------------------------------------------------------------
  console.log('\n▶ SUITE 3: Malformed Payloads, Injections & Extreme Data Handling');
  {
    // 3.1 Extreme string length payload handling
    const massiveTitle = 'A'.repeat(50000);
    const massiveRes = await postBanner(makeRequest('/api/admin/banners', 'POST', { token: superToken, body: { title: massiveTitle, imageUrl: 'http://img.jpg' } }));
    recordTest('Adversarial', 'Massive 50,000 char string rejected gracefully with 400', massiveRes.status === 400);

    // 3.2 Prototype pollution injection probe
    const protoPollutionBody = JSON.parse('{"__proto__":{"polluted":true},"title":"Proto Banner","imageUrl":"http://img.jpg"}');
    const protoRes = await postBanner(makeRequest('/api/admin/banners', 'POST', { token: superToken, body: protoPollutionBody }));
    recordTest('Adversarial', 'Prototype pollution attempt does not compromise Object prototype', ({} as any).polluted === undefined);

    // 3.3 SQL injection in search query params
    const sqliSearch = "' OR '1'='1' --";
    const sqliRes = await getBanners(makeRequest(`/api/admin/banners?search=${encodeURIComponent(sqliSearch)}`, 'GET', { token: superToken }));
    recordTest('Adversarial', 'SQL injection string in search handled safely with 200', sqliRes.status === 200);

    // 3.4 XSS strings preserved safely as literal text
    const xssTitle = '<script>alert("xss")</script>';
    const xssReq = makeRequest('/api/admin/banners', 'POST', {
      token: superToken,
      body: { title: xssTitle, imageUrl: 'https://images.unsplash.com/photo-banner' },
    });
    const xssRes = await postBanner(xssReq);
    recordTest('Adversarial', 'XSS payload handled safely and persisted as literal text', xssRes.status === 201);
    if (xssRes.status === 201) {
      const bannerData = await xssRes.json();
      recordTest('Adversarial', 'XSS title contains literal script tag without evaluation', bannerData.title === xssTitle);
      // clean up
      await deleteBanner(makeRequest(`/api/admin/banners/${bannerData.id}`, 'DELETE', { token: superToken }), { params: { id: bannerData.id } });
    }
  }

  // ---------------------------------------------------------------------------
  // SUITE 4: 5-STATE FINITE STATE MACHINE BOUNDARIES & TRANSITION LOCKS
  // ---------------------------------------------------------------------------
  console.log('\n▶ SUITE 4: 5-State Finite State Machine Boundaries & Terminal Transitions');
  {
    const stamp = Date.now();
    // Create new booking for testing FSM transitions
    const bookReq = makeRequest('/api/bookings', 'POST', {
      body: {
        customerName: 'Nguyễn Thị Thu Trang',
        customerPhone: '0934567890',
        customerEmail: 'trang.nguyen@example.com',
        bookingDate: getTomorrowDateString(),
        timeSlot: '10:00',
        idempotencyKey: `fsm-adv-test-${stamp}`,
      },
    });
    const bookRes = await publicCreateBooking(bookReq);
    const bookData = await bookRes.json();
    const testBookingId = bookData.id;

    // 4.1 Illegal direct jumps from PENDING
    const illegalComplete = await patchBookingStatus(makeRequest(`/api/admin/bookings/${testBookingId}/status`, 'PATCH', { token: bookingToken, body: { status: 'COMPLETED' } }), { params: { id: testBookingId } });
    recordTest('FSM', 'Illegal direct jump PENDING -> COMPLETED rejected with 400', illegalComplete.status === 400);

    const illegalNoShow = await patchBookingStatus(makeRequest(`/api/admin/bookings/${testBookingId}/status`, 'PATCH', { token: bookingToken, body: { status: 'NO_SHOW' } }), { params: { id: testBookingId } });
    recordTest('FSM', 'Illegal direct jump PENDING -> NO_SHOW rejected with 400', illegalNoShow.status === 400);

    // 4.2 Cancellation Reason length threshold
    const cancel0Char = await patchBookingStatus(makeRequest(`/api/admin/bookings/${testBookingId}/status`, 'PATCH', { token: bookingToken, body: { status: 'CANCELLED', cancellationReason: '' } }), { params: { id: testBookingId } });
    recordTest('FSM', 'Cancellation with 0-char reason rejected with 400', cancel0Char.status === 400);

    const cancel1Char = await patchBookingStatus(makeRequest(`/api/admin/bookings/${testBookingId}/status`, 'PATCH', { token: bookingToken, body: { status: 'CANCELLED', cancellationReason: 'A' } }), { params: { id: testBookingId } });
    recordTest('FSM', 'Cancellation with 1-char reason rejected with 400', cancel1Char.status === 400);

    const cancel4Char = await patchBookingStatus(makeRequest(`/api/admin/bookings/${testBookingId}/status`, 'PATCH', { token: bookingToken, body: { status: 'CANCELLED', cancellationReason: 'ABCD' } }), { params: { id: testBookingId } });
    recordTest('FSM', 'Cancellation with 4-char reason rejected with 400', cancel4Char.status === 400);

    // 4.3 Valid transition: PENDING -> CONFIRMED
    const confirmRes = await patchBookingStatus(makeRequest(`/api/admin/bookings/${testBookingId}/status`, 'PATCH', { token: bookingToken, body: { status: 'CONFIRMED' } }), { params: { id: testBookingId } });
    recordTest('FSM', 'Valid transition PENDING -> CONFIRMED succeeds with 200', confirmRes.status === 200);

    // 4.4 Backward transition CONFIRMED -> PENDING rejected
    const backwardRes = await patchBookingStatus(makeRequest(`/api/admin/bookings/${testBookingId}/status`, 'PATCH', { token: bookingToken, body: { status: 'PENDING' } }), { params: { id: testBookingId } });
    recordTest('FSM', 'Backward transition CONFIRMED -> PENDING rejected with 400', backwardRes.status === 400);

    // 4.5 Valid transition: CONFIRMED -> COMPLETED
    const completeRes = await patchBookingStatus(makeRequest(`/api/admin/bookings/${testBookingId}/status`, 'PATCH', { token: bookingToken, body: { status: 'COMPLETED' } }), { params: { id: testBookingId } });
    recordTest('FSM', 'Valid transition CONFIRMED -> COMPLETED succeeds with 200', completeRes.status === 200);

    // 4.6 Terminal state lockdowns on COMPLETED
    const termToPending = await patchBookingStatus(makeRequest(`/api/admin/bookings/${testBookingId}/status`, 'PATCH', { token: bookingToken, body: { status: 'PENDING' } }), { params: { id: testBookingId } });
    recordTest('FSM', 'Terminal lockdown: COMPLETED -> PENDING rejected with 400', termToPending.status === 400);

    const termToConfirmed = await patchBookingStatus(makeRequest(`/api/admin/bookings/${testBookingId}/status`, 'PATCH', { token: bookingToken, body: { status: 'CONFIRMED' } }), { params: { id: testBookingId } });
    recordTest('FSM', 'Terminal lockdown: COMPLETED -> CONFIRMED rejected with 400', termToConfirmed.status === 400);

    const termToCancelled = await patchBookingStatus(makeRequest(`/api/admin/bookings/${testBookingId}/status`, 'PATCH', { token: bookingToken, body: { status: 'CANCELLED', cancellationReason: 'Khách muốn hủy' } }), { params: { id: testBookingId } });
    recordTest('FSM', 'Terminal lockdown: COMPLETED -> CANCELLED rejected with 400', termToCancelled.status === 400);

    const termToNoShow = await patchBookingStatus(makeRequest(`/api/admin/bookings/${testBookingId}/status`, 'PATCH', { token: bookingToken, body: { status: 'NO_SHOW' } }), { params: { id: testBookingId } });
    recordTest('FSM', 'Terminal lockdown: COMPLETED -> NO_SHOW rejected with 400', termToNoShow.status === 400);
  }

  // ---------------------------------------------------------------------------
  // SUITE 5: NON-EXISTENT ENTITY & IDOR RESILIENCE (404 PROBES)
  // ---------------------------------------------------------------------------
  console.log('\n▶ SUITE 5: Non-Existent Entity & IDOR Resilience (404 Probes)');
  {
    const missingId = 'non-existent-uuid-9999';

    // Banner 404
    const bGet404 = await getBannerById(makeRequest(`/api/admin/banners/${missingId}`, 'GET', { token: superToken }), { params: { id: missingId } });
    recordTest('IDOR/404', 'GET non-existent banner returns 404', bGet404.status === 404);

    const bPatch404 = await patchBanner(makeRequest(`/api/admin/banners/${missingId}`, 'PATCH', { token: superToken, body: { title: 'New' } }), { params: { id: missingId } });
    recordTest('IDOR/404', 'PATCH non-existent banner returns 404', bPatch404.status === 404);

    const bDel404 = await deleteBanner(makeRequest(`/api/admin/banners/${missingId}`, 'DELETE', { token: superToken }), { params: { id: missingId } });
    recordTest('IDOR/404', 'DELETE non-existent banner returns 404', bDel404.status === 404);

    // Category 404
    const catGet404 = await getCategoryById(makeRequest(`/api/admin/categories/${missingId}`, 'GET', { token: contentToken }), { params: { id: missingId } });
    recordTest('IDOR/404', 'GET non-existent category returns 404', catGet404.status === 404);

    const catDel404 = await deleteCategory(makeRequest(`/api/admin/categories/${missingId}`, 'DELETE', { token: contentToken }), { params: { id: missingId } });
    recordTest('IDOR/404', 'DELETE non-existent category returns 404', catDel404.status === 404);

    // Hairstyle 404
    const hGet404 = await getHairstyleById(makeRequest(`/api/admin/hairstyles/${missingId}`, 'GET', { token: contentToken }), { params: { id: missingId } });
    recordTest('IDOR/404', 'GET non-existent hairstyle returns 404', hGet404.status === 404);

    const hDel404 = await deleteHairstyle(makeRequest(`/api/admin/hairstyles/${missingId}`, 'DELETE', { token: contentToken }), { params: { id: missingId } });
    recordTest('IDOR/404', 'DELETE non-existent hairstyle returns 404', hDel404.status === 404);

    // Color 404
    const cGet404 = await getColorById(makeRequest(`/api/admin/colors/${missingId}`, 'GET', { token: superToken }), { params: { id: missingId } });
    recordTest('IDOR/404', 'GET non-existent color returns 404', cGet404.status === 404);

    const cDel404 = await deleteColor(makeRequest(`/api/admin/colors/${missingId}`, 'DELETE', { token: superToken }), { params: { id: missingId } });
    recordTest('IDOR/404', 'DELETE non-existent color returns 404', cDel404.status === 404);

    // BeforeAfter 404
    const baGet404 = await getBeforeAfterById(makeRequest(`/api/admin/before-after/${missingId}`, 'GET', { token: contentToken }), { params: { id: missingId } });
    recordTest('IDOR/404', 'GET non-existent before-after returns 404', baGet404.status === 404);

    const baDel404 = await deleteBeforeAfter(makeRequest(`/api/admin/before-after/${missingId}`, 'DELETE', { token: contentToken }), { params: { id: missingId } });
    recordTest('IDOR/404', 'DELETE non-existent before-after returns 404', baDel404.status === 404);

    // Service 404
    const srvGet404 = await getServiceById(makeRequest(`/api/admin/services/${missingId}`, 'GET', { token: superToken }), { params: { id: missingId } });
    recordTest('IDOR/404', 'GET non-existent service returns 404', srvGet404.status === 404);

    const srvDel404 = await deleteService(makeRequest(`/api/admin/services/${missingId}`, 'DELETE', { token: superToken }), { params: { id: missingId } });
    recordTest('IDOR/404', 'DELETE non-existent service returns 404', srvDel404.status === 404);

    // Combo 404
    const cmbGet404 = await getComboById(makeRequest(`/api/admin/services/combos/${missingId}`, 'GET', { token: superToken }), { params: { id: missingId } });
    recordTest('IDOR/404', 'GET non-existent combo returns 404', cmbGet404.status === 404);

    const cmbDel404 = await deleteCombo(makeRequest(`/api/admin/services/combos/${missingId}`, 'DELETE', { token: superToken }), { params: { id: missingId } });
    recordTest('IDOR/404', 'DELETE non-existent combo returns 404', cmbDel404.status === 404);

    // Article 404
    const artGet404 = await getArticleById(makeRequest(`/api/admin/articles/${missingId}`, 'GET', { token: editorToken }), { params: { id: missingId } });
    recordTest('IDOR/404', 'GET non-existent article returns 404', artGet404.status === 404);

    const artDel404 = await deleteArticle(makeRequest(`/api/admin/articles/${missingId}`, 'DELETE', { token: editorToken }), { params: { id: missingId } });
    recordTest('IDOR/404', 'DELETE non-existent article returns 404', artDel404.status === 404);

    // Booking 404
    const bkGet404 = await getAdminBookingById(makeRequest(`/api/admin/bookings/${missingId}`, 'GET', { token: bookingToken }), { params: { id: missingId } });
    recordTest('IDOR/404', 'GET non-existent booking returns 404', bkGet404.status === 404);

    const bkStatus404 = await patchBookingStatus(makeRequest(`/api/admin/bookings/${missingId}/status`, 'PATCH', { token: bookingToken, body: { status: 'CONFIRMED' } }), { params: { id: missingId } });
    recordTest('IDOR/404', 'PATCH status on non-existent booking returns 404', bkStatus404.status === 404);

    const bkAssign404 = await patchBookingAssign(makeRequest(`/api/admin/bookings/${missingId}/assign`, 'PATCH', { token: bookingToken, body: { stylistId: 'st-none' } }), { params: { id: missingId } });
    recordTest('IDOR/404', 'PATCH assign on non-existent booking returns 404', bkAssign404.status === 404);

    const bkNotes404 = await patchBookingNotes(makeRequest(`/api/admin/bookings/${missingId}/notes`, 'PATCH', { token: bookingToken, body: { internalNotes: 'Note' } }), { params: { id: missingId } });
    recordTest('IDOR/404', 'PATCH notes on non-existent booking returns 404', bkNotes404.status === 404);
  }

  // ---------------------------------------------------------------------------
  // SUMMARY REPORT
  // ---------------------------------------------------------------------------
  const total = testResults.length;
  const passed = testResults.filter((r) => r.passed).length;
  const failed = testResults.filter((r) => !r.passed).length;

  console.log('\n================================================================================');
  console.log('             M3 INDEPENDENT ADVERSARIAL PROBES SUMMARY                          ');
  console.log('================================================================================');
  console.log(`  Total Probes: ${total}`);
  console.log(`  Passed:       ${passed}`);
  console.log(`  Failed:       ${failed}`);

  if (failed > 0) {
    console.error(`\n  FAILED PROBES (${failed}):`);
    testResults
      .filter((r) => !r.passed)
      .forEach((r) => console.error(`    - [${r.suite}] ${r.name}: ${r.error}`));
    process.exit(1);
  } else {
    console.log('\n  ALL M3 ADVERSARIAL PROBES PASSED WITH 100% SUCCESS RATE!\n');
    process.exit(0);
  }
}

runAdversarialM3Probes().catch((err) => {
  console.error('Fatal adversarial probe error:', err);
  process.exit(1);
});
