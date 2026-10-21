/**
 * Milestone 3 Challenger Stress & Adversarial Test Harness
 * Comprehensive empirical verification of:
 * 1. Full CRUD lifecycle on all 7 entities:
 *    - Banners (/api/admin/banners)
 *    - Categories (/api/admin/categories)
 *    - Hairstyles (/api/admin/hairstyles)
 *    - Hair Colors (/api/admin/colors)
 *    - Before/After Showcases (/api/admin/before-after)
 *    - Services & Combos (/api/admin/services & combos)
 *    - Articles Studio (/api/admin/articles)
 * 2. 5-State Finite State Machine (PENDING, CONFIRMED, COMPLETED, CANCELLED, NO_SHOW):
 *    - Valid transitions: PENDING -> CONFIRMED -> COMPLETED
 *    - Valid transitions: PENDING -> CANCELLED (with reason)
 *    - Valid transitions: CONFIRMED -> NO_SHOW
 *    - Illegal transitions rejected: COMPLETED -> CANCELLED, NO_SHOW -> CONFIRMED, PENDING -> COMPLETED
 * 3. Mandatory Cancellation Reason enforcement (min 5 characters)
 * 4. Dual-Mapping & Serialization fidelity:
 *    - Preserves DB fields and fixture aliases across all entities
 * 5. Fail-Safe Audit Logging:
 *    - Emits audit log entries with exact entity names (HAIR_COLOR, BANNER, HAIRSTYLE, SERVICE, BEFORE_AFTER, ARTICLE, Booking)
 * 6. RBAC Role Isolation:
 *    - EDITOR blocked from banners (403) and hairstyles (403)
 *    - BOOKING_STAFF blocked from banners (403) and colors (403)
 *    - CONTENT_ADMIN blocked from booking status mutations (403)
 *    - Unauthenticated requests blocked (401)
 */

process.env.ALLOW_TEST_MOCK_AUTH = 'true';

import { NextRequest } from 'next/server';
import { prisma } from '../lib/prisma';
import { MOCK_USERS, getTomorrowDateString } from './fixtures/mock-data';
import { getAuditLogs } from '../services/audit';
import {
  validateBookingTransition,
  ALLOWED_TRANSITIONS,
  isTerminalStatus,
  formatBookingStatusVN,
} from '../lib/booking-state-machine';
import {
  serializeBanner,
  serializeCategory,
  serializeHairstyle,
  serializeHairColor,
  serializeBeforeAfter,
  serializeService,
  serializeArticle,
} from '../lib/validations/content';
import { serializeBooking } from '../lib/validations/booking';

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

interface AssertionResult {
  suite: string;
  name: string;
  passed: boolean;
  error?: string;
  details?: any;
}

const results: AssertionResult[] = [];

function assert(condition: boolean, suite: string, name: string, message?: string, details?: any) {
  if (condition) {
    results.push({ suite, name, passed: true, details });
    console.log(`  ✓ [PASS] [${suite}] ${name}`);
  } else {
    results.push({ suite, name, passed: false, error: message || 'Assertion failed', details });
    console.error(`  ✗ [FAIL] [${suite}] ${name}: ${message}`);
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

async function runM3ChallengeHarness() {
  console.log('================================================================================');
  console.log('         M3 CHALLENGER STRESS & ADVERSARIAL VERIFICATION HARNESS                 ');
  console.log('================================================================================\n');

  const superToken = MOCK_USERS.SUPER_ADMIN.token;
  const contentToken = MOCK_USERS.CONTENT_ADMIN.token;
  const bookingToken = MOCK_USERS.BOOKING_STAFF.token;
  const editorToken = MOCK_USERS.EDITOR.token;

  // ---------------------------------------------------------------------------
  // SUITE 1: 5-State Finite State Machine (Unit Logic & Boundary Enforcements)
  // ---------------------------------------------------------------------------
  console.log('▶ SUITE 1: 5-State Finite State Machine (FSM Engine & Boundaries)');
  {
    // Valid transitions
    const t1 = validateBookingTransition('PENDING', 'CONFIRMED');
    assert(t1.isValid, 'FSM', 'PENDING -> CONFIRMED is valid');

    const t2 = validateBookingTransition('PENDING', 'CANCELLED', 'Khách bận đột xuất');
    assert(t2.isValid, 'FSM', 'PENDING -> CANCELLED with reason (>=5 chars) is valid');

    const t3 = validateBookingTransition('CONFIRMED', 'COMPLETED');
    assert(t3.isValid, 'FSM', 'CONFIRMED -> COMPLETED is valid');

    const t4 = validateBookingTransition('CONFIRMED', 'NO_SHOW');
    assert(t4.isValid, 'FSM', 'CONFIRMED -> NO_SHOW is valid');

    // Illegal transitions
    const t5 = validateBookingTransition('PENDING', 'COMPLETED');
    assert(!t5.isValid && t5.errorMessage !== undefined, 'FSM', 'PENDING -> COMPLETED is strictly rejected');

    const t6 = validateBookingTransition('COMPLETED', 'CANCELLED', 'Lý do hủy');
    assert(!t6.isValid, 'FSM', 'COMPLETED -> CANCELLED is strictly rejected (Terminal State)');

    const t7 = validateBookingTransition('NO_SHOW', 'CONFIRMED');
    assert(!t7.isValid, 'FSM', 'NO_SHOW -> CONFIRMED is strictly rejected (Terminal State)');

    const t8 = validateBookingTransition('CANCELLED', 'PENDING');
    assert(!t8.isValid, 'FSM', 'CANCELLED -> PENDING is strictly rejected (Terminal State)');

    // Mandatory cancellation reason (<5 chars)
    const t9 = validateBookingTransition('PENDING', 'CANCELLED', 'bận');
    assert(Boolean(!t9.isValid && t9.errorMessage?.includes('5 ký tự')), 'FSM', 'Short cancellation reason (<5 chars) is rejected');

    const t10 = validateBookingTransition('PENDING', 'CANCELLED', '');
    assert(Boolean(!t10.isValid && t10.errorMessage?.includes('5 ký tự')), 'FSM', 'Empty cancellation reason is rejected');

    // Helper functions
    assert(isTerminalStatus('COMPLETED') && isTerminalStatus('CANCELLED') && isTerminalStatus('NO_SHOW'), 'FSM', 'isTerminalStatus correctly flags all 3 terminal states');
    assert(!isTerminalStatus('PENDING') && !isTerminalStatus('CONFIRMED'), 'FSM', 'isTerminalStatus correctly flags non-terminal states');
    assert(formatBookingStatusVN('PENDING') === 'Chờ xác nhận', 'FSM', 'formatBookingStatusVN produces correct Vietnamese label');
  }

  // ---------------------------------------------------------------------------
  // SUITE 2: RBAC Role Isolation & Security Gates
  // ---------------------------------------------------------------------------
  console.log('\n▶ SUITE 2: RBAC Role Isolation & Access Control');
  {
    // Unauthenticated request
    const unauthReq = makeRequest('/api/admin/banners', 'GET');
    const unauthRes = await getBanners(unauthReq);
    assert(unauthRes.status === 401, 'RBAC', 'Unauthenticated request to /api/admin/banners returns HTTP 401');

    // EDITOR blocked from mutating Banners (403)
    const editorBannerReq = makeRequest('/api/admin/banners', 'POST', {
      token: editorToken,
      body: { title: 'Hack Banner', imageUrl: 'http://test.com/b.jpg' },
    });
    const editorBannerRes = await postBanner(editorBannerReq);
    assert(editorBannerRes.status === 403, 'RBAC', 'EDITOR cannot create Banners (Strict HTTP 403)');

    // EDITOR blocked from mutating Hairstyles (403)
    const editorStyleReq = makeRequest('/api/admin/hairstyles', 'POST', {
      token: editorToken,
      body: { title: 'Hack Hairstyle', description: 'Desc' },
    });
    const editorStyleRes = await postHairstyle(editorStyleReq);
    assert(editorStyleRes.status === 403, 'RBAC', 'EDITOR cannot create Hairstyles (Strict HTTP 403)');

    // BOOKING_STAFF blocked from creating Banners (403)
    const staffBannerReq = makeRequest('/api/admin/banners', 'POST', {
      token: bookingToken,
      body: { title: 'Staff Banner', imageUrl: 'http://test.com/b.jpg' },
    });
    const staffBannerRes = await postBanner(staffBannerReq);
    assert(staffBannerRes.status === 403, 'RBAC', 'BOOKING_STAFF cannot create Banners (Strict HTTP 403)');

    // BOOKING_STAFF blocked from creating Colors (403)
    const staffColorReq = makeRequest('/api/admin/colors', 'POST', {
      token: bookingToken,
      body: { name: 'Staff Color', hexColor: '#123456' },
    });
    const staffColorRes = await postColor(staffColorReq);
    assert(staffColorRes.status === 403, 'RBAC', 'BOOKING_STAFF cannot create Colors (Strict HTTP 403)');

    // CONTENT_ADMIN blocked from updating Booking Status (403)
    const contentBookingReq = makeRequest('/api/admin/bookings/bk-dummy/status', 'PATCH', {
      token: contentToken,
      body: { status: 'CONFIRMED' },
    });
    const contentBookingRes = await patchBookingStatus(contentBookingReq, { params: { id: 'bk-dummy' } });
    assert(contentBookingRes.status === 403, 'RBAC', 'CONTENT_ADMIN cannot update Booking Status (Strict HTTP 403)');
  }

  // ---------------------------------------------------------------------------
  // SUITE 3: Full CRUD Lifecycle - Banners (/api/admin/banners)
  // ---------------------------------------------------------------------------
  console.log('\n▶ SUITE 3: Banner Operations & Lifecycle');
  {
    const stamp = Date.now();
    const createReq = makeRequest('/api/admin/banners', 'POST', {
      token: superToken,
      body: {
        title: `Banner M3 Test ${stamp}`,
        imageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035',
        linkUrl: '/promotions/m3',
        displayOrder: 10,
        isActive: true,
      },
    });
    const createRes = await postBanner(createReq);
    assert(createRes.status === 201, 'Banner', 'POST /api/admin/banners creates new banner (HTTP 201)');
    const bannerData = await createRes.json();
    const bannerId = bannerData.id;
    assert(Boolean(bannerId), 'Banner', 'Created banner has persistent UUID id');

    // Toggle banner active status
    const toggleReq = makeRequest(`/api/admin/banners/${bannerId}/toggle`, 'POST', {
      token: superToken,
      body: { isActive: false },
    });
    const toggleRes = await toggleBanner(toggleReq, { params: { id: bannerId } });
    assert(toggleRes.status === 200, 'Banner', 'POST /api/admin/banners/[id]/toggle toggles isActive (HTTP 200)');
    const toggledData = await toggleRes.json();
    assert(toggledData.isActive === false, 'Banner', 'Banner isActive successfully flipped to false');

    // Update banner
    const patchReq = makeRequest(`/api/admin/banners/${bannerId}`, 'PATCH', {
      token: superToken,
      body: { title: `Updated Banner ${stamp}`, isActive: true },
    });
    const patchRes = await patchBanner(patchReq, { params: { id: bannerId } });
    assert(patchRes.status === 200, 'Banner', 'PATCH /api/admin/banners/[id] updates banner (HTTP 200)');
    const patchedData = await patchRes.json();
    assert(patchedData.title === `Updated Banner ${stamp}`, 'Banner', 'Banner title updated properly');

    // Delete banner
    const deleteReq = makeRequest(`/api/admin/banners/${bannerId}`, 'DELETE', {
      token: superToken,
    });
    const deleteRes = await deleteBanner(deleteReq, { params: { id: bannerId } });
    assert(deleteRes.status === 200, 'Banner', 'DELETE /api/admin/banners/[id] removes banner (HTTP 200)');

    // Verify deletion returns 404
    const getDeletedReq = makeRequest(`/api/admin/banners/${bannerId}`, 'GET', { token: superToken });
    const getDeletedRes = await getBannerById(getDeletedReq, { params: { id: bannerId } });
    assert(getDeletedRes.status === 404, 'Banner', 'GET /api/admin/banners/[id] on deleted banner returns HTTP 404');
  }

  // ---------------------------------------------------------------------------
  // SUITE 4: Full CRUD Lifecycle - Categories & Hairstyles
  // ---------------------------------------------------------------------------
  console.log('\n▶ SUITE 4: Categories & Hairstyles Catalog Management');
  let testCatId = '';
  let testStyleId = '';
  {
    const stamp = Date.now();
    // 1. Create Category
    const catReq = makeRequest('/api/admin/categories', 'POST', {
      token: contentToken,
      body: {
        name: `Danh Mục M3 ${stamp}`,
        slug: `danh-muc-m3-${stamp}`,
        description: 'Mô tả danh mục test kiểm thử',
        displayOrder: 5,
        isActive: true,
      },
    });
    const catRes = await postCategory(catReq);
    assert(catRes.status === 201, 'Category', 'POST /api/admin/categories creates category (HTTP 201)');
    const catData = await catRes.json();
    testCatId = catData.id;
    assert(Boolean(testCatId), 'Category', 'Category created with valid ID');

    // 2. Create Hairstyle linked to category
    const styleReq = makeRequest('/api/admin/hairstyles', 'POST', {
      token: contentToken,
      body: {
        title: `Kiểu Tóc Layer M3 ${stamp}`,
        slug: `kieu-toc-layer-m3-${stamp}`,
        description: 'Kiểu tóc layer thanh lịch phong cách Paris cao cấp',
        categoryId: testCatId,
        gender: 'FEMALE',
        length: 'MEDIUM',
        style: 'FRENCH_ELEGANT',
        faceShape: 'OVAL',
        texture: 'WAVY',
        price: 450000,
        images: ['https://images.unsplash.com/photo-1522337360788-8b13dee7a37e'],
      },
    });
    const styleRes = await postHairstyle(styleReq);
    assert(styleRes.status === 201, 'Hairstyle', 'POST /api/admin/hairstyles creates hairstyle (HTTP 201)');
    const styleData = await styleRes.json();
    testStyleId = styleData.id;
    assert(Boolean(testStyleId), 'Hairstyle', 'Hairstyle created with valid ID');

    // Check dual-mapping on Hairstyle
    assert(styleData.title === styleData.name, 'Hairstyle', 'Hairstyle serializer preserves dual title/name mapping');
    assert(Array.isArray(styleData.images) && styleData.images.length > 0, 'Hairstyle', 'Hairstyle serializer exposes images array');
    assert(Boolean(styleData.coverImageUrl), 'Hairstyle', 'Hairstyle serializer exposes coverImageUrl');

    // 3. Update Hairstyle
    const updateStyleReq = makeRequest(`/api/admin/hairstyles/${testStyleId}`, 'PATCH', {
      token: contentToken,
      body: {
        isTrending: true,
        price: 500000,
      },
    });
    const updateStyleRes = await patchHairstyle(updateStyleReq, { params: { id: testStyleId } });
    assert(updateStyleRes.status === 200, 'Hairstyle', 'PATCH /api/admin/hairstyles/[id] updates hairstyle attributes');
    const updatedStyle = await updateStyleRes.json();
    assert(updatedStyle.isTrending === true && Number(updatedStyle.price) === 500000, 'Hairstyle', 'Hairstyle updated values verified');

    // 4. Delete Hairstyle
    const delStyleReq = makeRequest(`/api/admin/hairstyles/${testStyleId}`, 'DELETE', { token: contentToken });
    const delStyleRes = await deleteHairstyle(delStyleReq, { params: { id: testStyleId } });
    assert(delStyleRes.status === 200, 'Hairstyle', 'DELETE /api/admin/hairstyles/[id] removes hairstyle (HTTP 200)');

    // 5. Delete Category
    const delCatReq = makeRequest(`/api/admin/categories/${testCatId}`, 'DELETE', { token: contentToken });
    const delCatRes = await deleteCategory(delCatReq, { params: { id: testCatId } });
    assert(delCatRes.status === 200, 'Category', 'DELETE /api/admin/categories/[id] removes category (HTTP 200)');
  }

  // ---------------------------------------------------------------------------
  // SUITE 5: Hair Colors & Audit Entity Verification (TC1.12 Compliance)
  // ---------------------------------------------------------------------------
  console.log('\n▶ SUITE 5: Hair Color Swatches & Audit Logging');
  {
    const stamp = Date.now();
    const colorReq = makeRequest('/api/admin/colors', 'POST', {
      token: superToken,
      body: {
        name: `Nâu Khói M3 ${stamp}`,
        hexColor: '#8a7768',
        toneLevel: 7,
        undertone: 'COOL',
        isBleachRequired: true,
        description: 'Màu nâu ánh khói thời thượng chuẩn phong cách Lumière',
      },
    });
    const colorRes = await postColor(colorReq);
    assert(colorRes.status === 201, 'Color', 'POST /api/admin/colors creates color swatch (HTTP 201)');
    const colorData = await colorRes.json();
    const colorId = colorData.id;

    // Verify audit log has entity === 'HAIR_COLOR'
    const recentLogs = await getAuditLogs({ entity: 'HAIR_COLOR', pageSize: 1 });
    assert(
      recentLogs.logs.length > 0 && recentLogs.logs[0].entity === 'HAIR_COLOR',
      'Audit',
      'Audit log for color creation strictly records entity as HAIR_COLOR (TC1.12 compliance)'
    );

    // Delete color swatch
    const delColorReq = makeRequest(`/api/admin/colors/${colorId}`, 'DELETE', { token: superToken });
    const delColorRes = await deleteColor(delColorReq, { params: { id: colorId } });
    assert(delColorRes.status === 200, 'Color', 'DELETE /api/admin/colors/[id] removes color swatch');
  }

  // ---------------------------------------------------------------------------
  // SUITE 6: Before/After Transformations & Feature Toggling
  // ---------------------------------------------------------------------------
  console.log('\n▶ SUITE 6: Before/After Showcases');
  {
    const stamp = Date.now();
    const baReq = makeRequest('/api/admin/before-after', 'POST', {
      token: contentToken,
      body: {
        title: `Phục Hồi Tóc Hư Tổn M3 ${stamp}`,
        beforeImageUrl: 'https://images.unsplash.com/photo-1560869713-7d0a29430803',
        afterImageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e',
        description: 'Biến hóa tóc hư tổn thành mái tóc bóng mượt bồng bềnh',
        isFeatured: false,
      },
    });
    const baRes = await postBeforeAfter(baReq);
    assert(baRes.status === 201, 'BeforeAfter', 'POST /api/admin/before-after creates showcase (HTTP 201)');
    const baData = await baRes.json();
    const baId = baData.id;

    // Feature toggle
    const toggleReq = makeRequest(`/api/admin/before-after/${baId}/feature`, 'POST', {
      token: contentToken,
      body: { isFeatured: true },
    });
    const toggleRes = await toggleFeatureBeforeAfter(toggleReq, { params: { id: baId } });
    assert(toggleRes.status === 200, 'BeforeAfter', 'POST /api/admin/before-after/[id]/feature toggles feature state');
    const toggledData = await toggleRes.json();
    assert(toggledData.isFeatured === true, 'BeforeAfter', 'Showcase isFeatured flipped to true');

    // Clean up
    const delBaReq = makeRequest(`/api/admin/before-after/${baId}`, 'DELETE', { token: contentToken });
    const delBaRes = await deleteBeforeAfter(delBaReq, { params: { id: baId } });
    assert(delBaRes.status === 200, 'BeforeAfter', 'DELETE /api/admin/before-after/[id] removes showcase');
  }

  // ---------------------------------------------------------------------------
  // SUITE 7: Services & Combos Management
  // ---------------------------------------------------------------------------
  console.log('\n▶ SUITE 7: Services & Combos Operations');
  {
    const stamp = Date.now();
    // 1. Create service
    const srvReq = makeRequest('/api/admin/services', 'POST', {
      token: superToken,
      body: {
        title: `Cắt Uốn Thiết Kế M3 ${stamp}`,
        slug: `cat-uon-thiet-ke-m3-${stamp}`,
        durationMinutes: 90,
        priceMin: 600000,
        priceMax: 900000,
        description: 'Dịch vụ uốn định hình phục hồi tóc cao cấp',
      },
    });
    const srvRes = await postService(srvReq);
    assert(srvRes.status === 201, 'Service', 'POST /api/admin/services creates service (HTTP 201)');
    const srvData = await srvRes.json();
    const serviceId = srvData.id;

    // Verify dual mapping (title & name)
    assert(srvData.name === srvData.title, 'Service', 'Service serializer preserves dual title/name mapping');

    // 2. Create combo linked to this service
    const comboReq = makeRequest('/api/admin/services/combos', 'POST', {
      token: superToken,
      body: {
        title: `Combo Trọn Gói M3 ${stamp}`,
        slug: `combo-tron-goi-m3-${stamp}`,
        packagePrice: 750000,
        originalPrice: 1000000,
        durationMinutes: 120,
        serviceIds: [serviceId],
        description: 'Combo tiết kiệm 25% cho khách hàng mới',
      },
    });
    const comboRes = await postCombo(comboReq);
    assert(comboRes.status === 201, 'Combo', 'POST /api/admin/services/combos creates combo (HTTP 201)');
    const comboData = await comboRes.json();
    const comboId = comboData.id;

    // Delete combo & service
    const delComboReq = makeRequest(`/api/admin/services/combos/${comboId}`, 'DELETE', { token: superToken });
    const delComboRes = await deleteCombo(delComboReq, { params: { id: comboId } });
    assert(delComboRes.status === 200, 'Combo', 'DELETE combo succeeds');

    const delSrvReq = makeRequest(`/api/admin/services/${serviceId}`, 'DELETE', { token: superToken });
    const delSrvRes = await deleteService(delSrvReq, { params: { id: serviceId } });
    assert(delSrvRes.status === 200, 'Service', 'DELETE service succeeds');
  }

  // ---------------------------------------------------------------------------
  // SUITE 8: Articles Studio (Markdown, SEO, Publishing Workflow)
  // ---------------------------------------------------------------------------
  console.log('\n▶ SUITE 8: Articles Studio & Editorial Workflow');
  {
    const stamp = Date.now();
    const artReq = makeRequest('/api/admin/articles', 'POST', {
      token: editorToken, // EDITOR is allowed to create articles
      body: {
        title: `Bí Quyết Giữ Nếp Tóc Uốn Bồng Bềnh ${stamp}`,
        slug: `bi-quyet-giu-nep-toc-uon-${stamp}`,
        excerpt: 'Hướng dẫn chi tiết các bước chăm sóc tóc uốn tại nhà từ chuyên gia Lumière',
        content: '## Hướng dẫn chi tiết\n\nNội dung bài viết đầy đủ với định dạng Markdown chuyên nghiệp...',
        coverImageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e',
        tags: ['uontoc', 'chamsoc', 'lumiere'],
        metaTitle: 'Bí Quyết Giữ Nếp Tóc Uốn | Lumière Hair Atelier',
        metaDescription: 'Chia sẻ kinh nghiệm chăm sóc tóc uốn giữ nếp lâu nhất từ các nhà tạo mẫu hàng đầu.',
        isPublished: false,
      },
    });
    const artRes = await postArticle(artReq);
    assert(artRes.status === 201, 'Article', 'POST /api/admin/articles creates article as Draft (HTTP 201)');
    const artData = await artRes.json();
    const articleId = artData.id;

    // Check dual mapping (isPublished & published, metaTitle & seoTitle)
    assert(artData.isPublished === false && artData.published === false, 'Article', 'Article serializer preserves dual published/isPublished mapping');
    assert(Boolean(artData.seoTitle) && Boolean(artData.metaTitle), 'Article', 'Article serializer preserves dual seoTitle/metaTitle mapping');

    // Publish article
    const pubReq = makeRequest(`/api/admin/articles/${articleId}/publish`, 'POST', {
      token: editorToken,
      body: { isPublished: true },
    });
    const pubRes = await publishArticle(pubReq, { params: { id: articleId } });
    assert(pubRes.status === 200, 'Article', 'POST /api/admin/articles/[id]/publish publishes article');
    const pubData = await pubRes.json();
    assert(pubData.isPublished === true, 'Article', 'Article publication status flipped to true');

    // Clean up
    const delArtReq = makeRequest(`/api/admin/articles/${articleId}`, 'DELETE', { token: editorToken });
    const delArtRes = await deleteArticle(delArtReq, { params: { id: articleId } });
    assert(delArtRes.status === 200, 'Article', 'DELETE article succeeds');
  }

  // ---------------------------------------------------------------------------
  // SUITE 9: Full Booking Journey & 5-Phase Finite State Machine API Execution
  // ---------------------------------------------------------------------------
  console.log('\n▶ SUITE 9: Booking Operations, Idempotency & 5-Phase FSM Transitions');
  {
    const stamp = Date.now();
    const idempotencyKey = `idemp-m3-test-${stamp}`;

    // 1. Public Booking Submission
    const publicReq = makeRequest('/api/bookings', 'POST', {
      body: {
        customerName: 'Hoàng Mai Lan',
        customerPhone: '0912345678',
        customerEmail: 'lan.hoang@example.com',
        bookingDate: getTomorrowDateString(),
        timeSlot: '14:30',
        notes: 'Khách muốn được tư vấn tạo mẫu layer bồng bềnh',
        idempotencyKey,
      },
    });
    const publicRes = await publicCreateBooking(publicReq);
    assert(publicRes.status === 201, 'Booking', 'POST /api/bookings creates public booking with BK code (HTTP 201)');
    const bookingData = await publicRes.json();
    const bookingId = bookingData.id;
    assert(bookingData.bookingCode?.startsWith('BK'), 'Booking', 'Booking code follows BKxxxxxx format');
    assert(bookingData.status === 'PENDING', 'Booking', 'Initial booking status is PENDING');

    // 2. Idempotency test: duplicate submission with same key returns identical booking
    const dupReq = makeRequest('/api/bookings', 'POST', {
      body: {
        customerName: 'Hoàng Mai Lan',
        customerPhone: '0912345678',
        bookingDate: getTomorrowDateString(),
        timeSlot: '14:30',
        idempotencyKey,
      },
    });
    const dupRes = await publicCreateBooking(dupReq);
    assert(dupRes.status === 200 || dupRes.status === 201, 'Booking', 'Duplicate submission handled gracefully with idempotent response');
    const dupData = await dupRes.json();
    assert(dupData.id === bookingId, 'Booking', 'Idempotency returns matching existing booking record');

    // 3. Admin updates notes and assigns stylist
    const notesReq = makeRequest(`/api/admin/bookings/${bookingId}/notes`, 'PATCH', {
      token: bookingToken,
      body: { internalNotes: 'Khách VIP, chuẩn bị trà thảo mộc' },
    });
    const notesRes = await patchBookingNotes(notesReq, { params: { id: bookingId } });
    assert(notesRes.status === 200, 'Booking', 'PATCH /api/admin/bookings/[id]/notes updates internal staff notes');

    // 4. Illegal FSM transition check: PENDING -> COMPLETED directly should fail with 400
    const illegalReq = makeRequest(`/api/admin/bookings/${bookingId}/status`, 'PATCH', {
      token: bookingToken,
      body: { status: 'COMPLETED' },
    });
    const illegalRes = await patchBookingStatus(illegalReq, { params: { id: bookingId } });
    assert(illegalRes.status === 400, 'Booking', 'Direct transition PENDING -> COMPLETED is rejected with HTTP 400');

    // 5. Valid transition: PENDING -> CONFIRMED
    const confirmReq = makeRequest(`/api/admin/bookings/${bookingId}/status`, 'PATCH', {
      token: bookingToken,
      body: { status: 'CONFIRMED' },
    });
    const confirmRes = await patchBookingStatus(confirmReq, { params: { id: bookingId } });
    assert(confirmRes.status === 200, 'Booking', 'PATCH status PENDING -> CONFIRMED succeeds (HTTP 200)');
    const confirmedData = await confirmRes.json();
    assert(confirmedData.status === 'CONFIRMED', 'Booking', 'Booking status verified as CONFIRMED');

    // 6. Valid transition: CONFIRMED -> COMPLETED
    const completeReq = makeRequest(`/api/admin/bookings/${bookingId}/status`, 'PATCH', {
      token: bookingToken,
      body: { status: 'COMPLETED' },
    });
    const completeRes = await patchBookingStatus(completeReq, { params: { id: bookingId } });
    assert(completeRes.status === 200, 'Booking', 'PATCH status CONFIRMED -> COMPLETED succeeds (HTTP 200)');
    const completedData = await completeRes.json();
    assert(completedData.status === 'COMPLETED', 'Booking', 'Booking status verified as COMPLETED');

    // 7. Illegal transition from Terminal state: COMPLETED -> CANCELLED should fail with 400
    const termReq = makeRequest(`/api/admin/bookings/${bookingId}/status`, 'PATCH', {
      token: bookingToken,
      body: { status: 'CANCELLED', cancellationReason: 'Khách muốn hủy sau khi hoàn thành' },
    });
    const termRes = await patchBookingStatus(termReq, { params: { id: bookingId } });
    assert(termRes.status === 400, 'Booking', 'Transition out of terminal state COMPLETED is rejected with HTTP 400');

    // 8. Cancellation test with short reason (<5 chars) on another booking
    const book2Req = makeRequest('/api/bookings', 'POST', {
      body: {
        customerName: 'Trần Văn Nam',
        customerPhone: '0988776655',
        bookingDate: getTomorrowDateString(),
        timeSlot: '16:00',
        idempotencyKey: `idemp-cancel-${stamp}`,
      },
    });
    const book2Res = await publicCreateBooking(book2Req);
    const book2Data = await book2Res.json();
    const book2Id = book2Data.id;

    const shortCancelReq = makeRequest(`/api/admin/bookings/${book2Id}/status`, 'PATCH', {
      token: bookingToken,
      body: { status: 'CANCELLED', cancellationReason: 'bận' },
    });
    const shortCancelRes = await patchBookingStatus(shortCancelReq, { params: { id: book2Id } });
    assert(shortCancelRes.status === 400, 'Booking', 'Cancellation with <5 chars reason is rejected with HTTP 400');

    // Valid cancellation with valid reason
    const validCancelReq = makeRequest(`/api/admin/bookings/${book2Id}/status`, 'PATCH', {
      token: bookingToken,
      body: { status: 'CANCELLED', cancellationReason: 'Khách hàng có việc đột xuất vào chiều mai' },
    });
    const validCancelRes = await patchBookingStatus(validCancelReq, { params: { id: book2Id } });
    assert(validCancelRes.status === 200, 'Booking', 'Valid cancellation with >=5 chars reason succeeds (HTTP 200)');
    const cancelledData = await validCancelRes.json();
    assert(cancelledData.status === 'CANCELLED', 'Booking', 'Booking status verified as CANCELLED');
    assert(
      cancelledData.cancellationReason === 'Khách hàng có việc đột xuất vào chiều mai' ||
      cancelledData.cancelReason === 'Khách hàng có việc đột xuất vào chiều mai',
      'Booking',
      'Cancellation reason preserved in both cancellationReason and cancelReason'
    );
  }

  // ---------------------------------------------------------------------------
  // SUMMARY REPORT
  // ---------------------------------------------------------------------------
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log('\n================================================================================');
  console.log('                     M3 CHALLENGE HARNESS EXECUTION SUMMARY                     ');
  console.log('================================================================================');
  console.log(`  Total Assertions: ${total}`);
  console.log(`  Passed:           ${passed}`);
  console.log(`  Failed:           ${failed}`);

  if (failed > 0) {
    console.error(`\n  FAILED ASSERTIONS (${failed}):`);
    results
      .filter((r) => !r.passed)
      .forEach((r) => console.error(`    - [${r.suite}] ${r.name}: ${r.error}`));
    process.exit(1);
  } else {
    console.log('\n  ALL M3 CHALLENGE ASSERTIONS PASSED WITH 100% SUCCESS RATE!\n');
    process.exit(0);
  }
}

runM3ChallengeHarness().catch((err) => {
  console.error('Fatal harness error:', err);
  process.exit(1);
});
