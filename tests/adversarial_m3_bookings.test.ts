/**
 * Independent Adversarial Challenger Test Suite for Milestone 3
 * Focus: Booking Lifecycle, 5-State Finite State Machine, Cancellation Enforcement,
 * Idempotency Locks, and RBAC Privilege Escalation.
 */

process.env.ALLOW_TEST_MOCK_AUTH = 'true';

import { NextRequest } from 'next/server';
import { BookingStatus } from '@prisma/client';
import { MOCK_USERS, getTomorrowDateString } from './fixtures/mock-data';
import { memoryStore } from '../lib/memory-store';
import {
  validateBookingTransition,
  ALLOWED_TRANSITIONS,
  isTerminalStatus,
  formatBookingStatusVN,
} from '../lib/booking-state-machine';

// Route Handlers
import { POST as publicCreateBooking } from '../app/api/bookings/route';
import { GET as getAdminBookings } from '../app/api/admin/bookings/route';
import { GET as getAdminBookingById } from '../app/api/admin/bookings/[id]/route';
import { PATCH as patchBookingStatus } from '../app/api/admin/bookings/[id]/status/route';
import { PATCH as patchBookingAssign } from '../app/api/admin/bookings/[id]/assign/route';
import { PATCH as patchBookingNotes } from '../app/api/admin/bookings/[id]/notes/route';

interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  error?: string;
  detail?: any;
}

const testResults: TestResult[] = [];

function recordTest(suite: string, name: string, passed: boolean, error?: string, detail?: any) {
  testResults.push({ suite, name, passed, error, detail });
  if (passed) {
    console.log(`  ✓ [PASS] [${suite}] ${name}`);
  } else {
    console.error(`  ✗ [FAIL] [${suite}] ${name}: ${error || 'Test failed'}`);
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

async function runAdversarialM3Suite() {
  console.log('================================================================================');
  console.log('      ADVERSARIAL CHALLENGER SUITE: M3 BOOKING LIFECYCLE & SECURITY             ');
  console.log('================================================================================\n');

  const superToken = MOCK_USERS.SUPER_ADMIN.token;
  const contentToken = MOCK_USERS.CONTENT_ADMIN.token;
  const bookingToken = MOCK_USERS.BOOKING_STAFF.token;
  const editorToken = MOCK_USERS.EDITOR.token;

  const allStatuses: BookingStatus[] = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];

  // ---------------------------------------------------------------------------
  // 1. FSM 5x5 COMPLETE MATRIX ADVERSARIAL VERIFICATION (Unit + Boundary)
  // ---------------------------------------------------------------------------
  console.log('▶ CATEGORY 1: FSM 5x5 COMPLETE TRANSITION MATRIX VERIFICATION');

  for (const from of allStatuses) {
    for (const to of allStatuses) {
      const allowedTarget = ALLOWED_TRANSITIONS[from];
      const isAllowedByFSM = from === to || (allowedTarget && allowedTarget.includes(to));

      if (to === 'CANCELLED' && isAllowedByFSM && from !== to) {
        // Without reason -> must fail
        const withoutReason = validateBookingTransition(from, to, '');
        recordTest(
          'FSM Matrix',
          `${from} -> ${to} without cancellation reason is rejected`,
          !withoutReason.isValid,
          withoutReason.isValid ? 'Allowed without reason' : undefined
        );

        // With valid reason -> must pass
        const withReason = validateBookingTransition(from, to, 'Khách có lịch hẹn khác trùng giờ');
        recordTest(
          'FSM Matrix',
          `${from} -> ${to} with valid reason (>=5 chars) is accepted`,
          withReason.isValid,
          !withReason.isValid ? withReason.errorMessage : undefined
        );
      } else {
        const result = validateBookingTransition(from, to);
        if (isAllowedByFSM) {
          recordTest(
            'FSM Matrix',
            `Valid transition ${from} -> ${to} is allowed`,
            result.isValid,
            !result.isValid ? result.errorMessage : undefined
          );
        } else {
          recordTest(
            'FSM Matrix',
            `Illegal transition ${from} -> ${to} is strictly rejected`,
            !result.isValid,
            result.isValid ? `Unexpectedly allowed ${from} -> ${to}` : undefined
          );
        }
      }
    }
  }

  // Specific high-risk illegal jumps specified in dispatch
  console.log('\n▶ CATEGORY 1.1: SPECIFIC HIGH-RISK ILLEGAL JUMPS (DISPATCH REQUIREMENTS)');
  const highRiskJumps: [BookingStatus, BookingStatus][] = [
    ['PENDING', 'COMPLETED'],
    ['PENDING', 'NO_SHOW'],
    ['CANCELLED', 'CONFIRMED'],
    ['COMPLETED', 'PENDING'],
    ['NO_SHOW', 'CONFIRMED'],
    ['COMPLETED', 'CANCELLED'],
  ];

  for (const [from, to] of highRiskJumps) {
    const res = validateBookingTransition(from, to, 'Lý do kiểm thử');
    recordTest(
      'FSM High-Risk',
      `Illegal jump ${from} -> ${to} is strictly rejected with descriptive error`,
      !res.isValid && typeof res.errorMessage === 'string' && res.errorMessage.length > 0,
      res.isValid ? `Allowed ${from} -> ${to}` : undefined
    );
  }

  // ---------------------------------------------------------------------------
  // 2. CANCELLATION REASON ADVERSARIAL BOUNDARY PROBES
  // ---------------------------------------------------------------------------
  console.log('\n▶ CATEGORY 2: CANCELLATION REASON ADVERSARIAL BOUNDARIES');

  // Helper to create a fresh booking in PENDING state
  async function createFreshBooking(idemp: string): Promise<string> {
    const req = makeRequest('/api/bookings', 'POST', {
      body: {
        customerName: 'Nguyễn Thùy Dung',
        customerPhone: '0977112233',
        bookingDate: getTomorrowDateString(),
        timeSlot: '10:00',
        idempotencyKey: idemp,
      },
    });
    const res = await publicCreateBooking(req);
    const data = await res.json();
    return data.id;
  }

  const cancelProbes = [
    { name: 'Empty string ""', reason: '', expectedStatus: 400 },
    { name: 'Whitespace only "    "', reason: '    ', expectedStatus: 400 },
    { name: 'Whitespace with newlines & tabs "\\t \\n  \\r "', reason: '\t \n  \r ', expectedStatus: 400 },
    { name: 'Exactly 1 character "a"', reason: 'a', expectedStatus: 400 },
    { name: 'Exactly 4 characters "bận!"', reason: 'bận!', expectedStatus: 400 },
    { name: '4 characters with trailing spaces "  ab  "', reason: '  ab  ', expectedStatus: 400 },
    { name: 'Undefined reason (missing field)', reason: undefined, expectedStatus: 400 },
    { name: 'Null reason', reason: null, expectedStatus: 400 },
    { name: 'Valid exactly 5 characters "12345"', reason: '12345', expectedStatus: 200 },
    { name: 'Valid Vietnamese reason "Khách bận việc đột xuất"', reason: 'Khách bận việc đột xuất', expectedStatus: 200 },
  ];

  for (let i = 0; i < cancelProbes.length; i++) {
    const probe = cancelProbes[i];
    const bId = await createFreshBooking(`idemp-cancel-probe-${Date.now()}-${i}`);

    const bodyPayload: any = { status: 'CANCELLED' };
    if (probe.reason !== undefined) {
      bodyPayload.cancellationReason = probe.reason;
    }

    const patchReq = makeRequest(`/api/admin/bookings/${bId}/status`, 'PATCH', {
      token: bookingToken,
      body: bodyPayload,
    });
    const patchRes = await patchBookingStatus(patchReq, { params: { id: bId } });

    recordTest(
      'Cancel Enforcement',
      `Cancellation probe: ${probe.name} -> HTTP ${probe.expectedStatus}`,
      patchRes.status === probe.expectedStatus,
      patchRes.status !== probe.expectedStatus ? `Got HTTP ${patchRes.status}, expected ${probe.expectedStatus}` : undefined
    );
  }

  // Alias support for cancelReason vs cancellationReason
  {
    const bId = await createFreshBooking(`idemp-cancel-alias-${Date.now()}`);
    const aliasReq = makeRequest(`/api/admin/bookings/${bId}/status`, 'PATCH', {
      token: bookingToken,
      body: {
        status: 'CANCELLED',
        cancelReason: 'Khách hủy qua điện thoại hotline',
      },
    });
    const aliasRes = await patchBookingStatus(aliasReq, { params: { id: bId } });
    const aliasData = await aliasRes.json();
    recordTest(
      'Cancel Enforcement',
      'Cancellation via alias "cancelReason" succeeds with HTTP 200',
      aliasRes.status === 200 && (aliasData.cancellationReason === 'Khách hủy qua điện thoại hotline' || aliasData.cancelReason === 'Khách hủy qua điện thoại hotline'),
      aliasRes.status !== 200 ? `HTTP ${aliasRes.status}` : undefined
    );
  }

  // ---------------------------------------------------------------------------
  // 3. HIGH-CONCURRENCY BOOKING SUBMISSIONS & IDEMPOTENCY LOCK
  // ---------------------------------------------------------------------------
  console.log('\n▶ CATEGORY 3: HIGH-CONCURRENCY SUBMISSIONS & IDEMPOTENCY LOCK');

  // 3.1 Sequential Idempotency
  {
    const key = `idemp-seq-${Date.now()}`;
    const req1 = makeRequest('/api/bookings', 'POST', {
      body: {
        customerName: 'Lê Hoàng Nam',
        customerPhone: '0903334455',
        bookingDate: getTomorrowDateString(),
        timeSlot: '11:00',
        idempotencyKey: key,
      },
    });
    const res1 = await publicCreateBooking(req1);
    const data1 = await res1.json();

    const req2 = makeRequest('/api/bookings', 'POST', {
      body: {
        customerName: 'Lê Hoàng Nam',
        customerPhone: '0903334455',
        bookingDate: getTomorrowDateString(),
        timeSlot: '11:00',
        idempotencyKey: key,
      },
    });
    const res2 = await publicCreateBooking(req2);
    const data2 = await res2.json();

    recordTest(
      'Idempotency',
      'Sequential duplicate request returns HTTP 200 or 201',
      res1.status === 201 && (res2.status === 200 || res2.status === 201)
    );
    recordTest(
      'Idempotency',
      'Sequential duplicate request returns identical booking id & code',
      data1.id === data2.id && data1.bookingCode === data2.bookingCode
    );
  }

  // 3.2 High-Concurrency Parallel Submissions (10 simultaneous requests)
  {
    const concurrentKey = `idemp-concurrent-${Date.now()}`;
    const parallelCount = 10;
    const promises: Promise<Response>[] = [];

    for (let i = 0; i < parallelCount; i++) {
      const req = makeRequest('/api/bookings', 'POST', {
        body: {
          customerName: 'Trịnh Thanh Hằng',
          customerPhone: '0918889900',
          bookingDate: getTomorrowDateString(),
          timeSlot: '15:00',
          idempotencyKey: concurrentKey,
        },
      });
      promises.push(publicCreateBooking(req));
    }

    const responses = await Promise.all(promises);
    const resultsData = await Promise.all(responses.map((r) => r.json()));

    const allSuccessful = responses.every((r) => r.status === 200 || r.status === 201);
    const firstId = resultsData[0]?.id;
    const allMatchSameId = resultsData.every((d) => d?.id === firstId);

    // Count how many records exist in memoryStore with this idempotencyKey
    const matchingInStore = memoryStore.bookings.filter((b) => b.idempotencyKey === concurrentKey);

    recordTest(
      'Idempotency',
      `High-concurrency: All ${parallelCount} simultaneous requests return 200/201`,
      allSuccessful,
      !allSuccessful ? `Statuses: ${responses.map((r) => r.status).join(',')}` : undefined
    );

    recordTest(
      'Idempotency',
      `High-concurrency: All ${parallelCount} responses return the exact same booking record`,
      allMatchSameId,
      !allMatchSameId ? `Returned IDs: ${resultsData.map((d) => d?.id).join(',')}` : undefined
    );

    recordTest(
      'Idempotency',
      `High-concurrency: Exactly 1 record created in persistence store (count=${matchingInStore.length})`,
      matchingInStore.length === 1,
      matchingInStore.length !== 1 ? `Found ${matchingInStore.length} records in store` : undefined
    );
  }

  // ---------------------------------------------------------------------------
  // 4. RBAC PRIVILEGE ESCALATION & ACCESS GATES
  // ---------------------------------------------------------------------------
  console.log('\n▶ CATEGORY 4: RBAC PRIVILEGE ESCALATION & ACCESS CONTROL GATES');

  const testBookingId = await createFreshBooking(`idemp-rbac-test-${Date.now()}`);

  // 4.1 CONTENT_ADMIN blocked from booking endpoints
  const contentEndpoints = [
    { name: 'PATCH status', method: 'PATCH', path: `/api/admin/bookings/${testBookingId}/status`, body: { status: 'CONFIRMED' } },
    { name: 'PATCH notes', method: 'PATCH', path: `/api/admin/bookings/${testBookingId}/notes`, body: { internalNotes: 'Notes' } },
    { name: 'PATCH assign', method: 'PATCH', path: `/api/admin/bookings/${testBookingId}/assign`, body: { stylistId: 'stylist-1' } },
    { name: 'GET booking by id', method: 'GET', path: `/api/admin/bookings/${testBookingId}` },
    { name: 'GET bookings list', method: 'GET', path: '/api/admin/bookings' },
  ];

  for (const ep of contentEndpoints) {
    const req = makeRequest(ep.path, ep.method, { token: contentToken, body: ep.body });
    let res: Response;
    if (ep.path.endsWith('/status')) {
      res = await patchBookingStatus(req, { params: { id: testBookingId } });
    } else if (ep.path.endsWith('/notes')) {
      res = await patchBookingNotes(req, { params: { id: testBookingId } });
    } else if (ep.path.endsWith('/assign')) {
      res = await patchBookingAssign(req, { params: { id: testBookingId } });
    } else if (ep.path === '/api/admin/bookings') {
      res = await getAdminBookings(req);
    } else {
      res = await getAdminBookingById(req, { params: { id: testBookingId } });
    }

    recordTest(
      'RBAC Escalation',
      `CONTENT_ADMIN blocked from ${ep.name} with HTTP 403 Forbidden`,
      res.status === 403,
      res.status !== 403 ? `Got HTTP ${res.status}` : undefined
    );
  }

  // 4.2 EDITOR blocked from booking endpoints
  for (const ep of contentEndpoints) {
    const req = makeRequest(ep.path, ep.method, { token: editorToken, body: ep.body });
    let res: Response;
    if (ep.path.endsWith('/status')) {
      res = await patchBookingStatus(req, { params: { id: testBookingId } });
    } else if (ep.path.endsWith('/notes')) {
      res = await patchBookingNotes(req, { params: { id: testBookingId } });
    } else if (ep.path.endsWith('/assign')) {
      res = await patchBookingAssign(req, { params: { id: testBookingId } });
    } else if (ep.path === '/api/admin/bookings') {
      res = await getAdminBookings(req);
    } else {
      res = await getAdminBookingById(req, { params: { id: testBookingId } });
    }

    recordTest(
      'RBAC Escalation',
      `EDITOR blocked from ${ep.name} with HTTP 403 Forbidden`,
      res.status === 403,
      res.status !== 403 ? `Got HTTP ${res.status}` : undefined
    );
  }

  // 4.3 Unauthenticated requests blocked with HTTP 401
  for (const ep of contentEndpoints) {
    const req = makeRequest(ep.path, ep.method, { body: ep.body });
    let res: Response;
    if (ep.path.endsWith('/status')) {
      res = await patchBookingStatus(req, { params: { id: testBookingId } });
    } else if (ep.path.endsWith('/notes')) {
      res = await patchBookingNotes(req, { params: { id: testBookingId } });
    } else if (ep.path.endsWith('/assign')) {
      res = await patchBookingAssign(req, { params: { id: testBookingId } });
    } else if (ep.path === '/api/admin/bookings') {
      res = await getAdminBookings(req);
    } else {
      res = await getAdminBookingById(req, { params: { id: testBookingId } });
    }

    recordTest(
      'RBAC Escalation',
      `Unauthenticated request to ${ep.name} rejected with HTTP 401 Unauthorized`,
      res.status === 401,
      res.status !== 401 ? `Got HTTP ${res.status}` : undefined
    );
  }

  // 4.4 Authorized roles (BOOKING_STAFF, SUPER_ADMIN) succeed
  {
    const reqStaff = makeRequest(`/api/admin/bookings/${testBookingId}`, 'GET', { token: bookingToken });
    const resStaff = await getAdminBookingById(reqStaff, { params: { id: testBookingId } });
    recordTest('RBAC Authorized', 'BOOKING_STAFF permitted to view booking (HTTP 200)', resStaff.status === 200);

    const reqSuper = makeRequest(`/api/admin/bookings/${testBookingId}`, 'GET', { token: superToken });
    const resSuper = await getAdminBookingById(reqSuper, { params: { id: testBookingId } });
    recordTest('RBAC Authorized', 'SUPER_ADMIN permitted to view booking (HTTP 200)', resSuper.status === 200);
  }

  // ---------------------------------------------------------------------------
  // 5. MALFORMED PAYLOADS & BOUNDARY ATTACKS
  // ---------------------------------------------------------------------------
  console.log('\n▶ CATEGORY 5: MALFORMED PAYLOADS & BOUNDARY ATTACKS');

  // 5.1 Invalid status enum values
  const invalidStatuses = ['INVALID_STATUS', 'HACKED', 'DELETED', '', 12345, null];
  for (const inv of invalidStatuses) {
    const req = makeRequest(`/api/admin/bookings/${testBookingId}/status`, 'PATCH', {
      token: bookingToken,
      body: { status: inv },
    });
    const res = await patchBookingStatus(req, { params: { id: testBookingId } });
    recordTest(
      'Malformed Payload',
      `Invalid status ${JSON.stringify(inv)} rejected with HTTP 400`,
      res.status === 400,
      res.status !== 400 ? `Got HTTP ${res.status}` : undefined
    );
  }

  // 5.2 Non-existent booking ID
  {
    const req = makeRequest('/api/admin/bookings/non-existent-booking-9999/status', 'PATCH', {
      token: bookingToken,
      body: { status: 'CONFIRMED' },
    });
    const res = await patchBookingStatus(req, { params: { id: 'non-existent-booking-9999' } });
    recordTest('Boundary', 'Non-existent booking ID returns HTTP 404 Not Found', res.status === 404);
  }

  // 5.3 Internal notes length boundary (1000 allowed, 1001 rejected)
  {
    const notes1000 = 'A'.repeat(1000);
    const req1000 = makeRequest(`/api/admin/bookings/${testBookingId}/notes`, 'PATCH', {
      token: bookingToken,
      body: { internalNotes: notes1000 },
    });
    const res1000 = await patchBookingNotes(req1000, { params: { id: testBookingId } });
    recordTest('Boundary', 'Internal notes at 1000 chars accepted (HTTP 200)', res1000.status === 200);

    const notes1001 = 'A'.repeat(1001);
    const req1001 = makeRequest(`/api/admin/bookings/${testBookingId}/notes`, 'PATCH', {
      token: bookingToken,
      body: { internalNotes: notes1001 },
    });
    const res1001 = await patchBookingNotes(req1001, { params: { id: testBookingId } });
    recordTest('Boundary', 'Internal notes at 1001 chars rejected (HTTP 400)', res1001.status === 400);
  }

  // ---------------------------------------------------------------------------
  // 6. TERMINAL STATE IMMUTABILITY (COMPLETED, CANCELLED, NO_SHOW)
  // ---------------------------------------------------------------------------
  console.log('\n▶ CATEGORY 6: TERMINAL STATE IMMUTABILITY STRESS');

  // Terminal state 1: COMPLETED
  {
    const bId = await createFreshBooking(`idemp-term-comp-${Date.now()}`);
    // PENDING -> CONFIRMED -> COMPLETED
    await patchBookingStatus(makeRequest(`/api/admin/bookings/${bId}/status`, 'PATCH', {
      token: bookingToken,
      body: { status: 'CONFIRMED' },
    }), { params: { id: bId } });

    await patchBookingStatus(makeRequest(`/api/admin/bookings/${bId}/status`, 'PATCH', {
      token: bookingToken,
      body: { status: 'COMPLETED' },
    }), { params: { id: bId } });

    // Attempt mutation to any other state
    for (const target of ['PENDING', 'CONFIRMED', 'CANCELLED', 'NO_SHOW'] as BookingStatus[]) {
      const res = await patchBookingStatus(makeRequest(`/api/admin/bookings/${bId}/status`, 'PATCH', {
        token: bookingToken,
        body: { status: target, cancellationReason: 'Test reason' },
      }), { params: { id: bId } });
      recordTest(
        'Terminal Immutability',
        `COMPLETED state cannot transition to ${target} (HTTP 400)`,
        res.status === 400,
        res.status !== 400 ? `Got HTTP ${res.status}` : undefined
      );
    }
  }

  // Terminal state 2: CANCELLED
  {
    const bId = await createFreshBooking(`idemp-term-canc-${Date.now()}`);
    await patchBookingStatus(makeRequest(`/api/admin/bookings/${bId}/status`, 'PATCH', {
      token: bookingToken,
      body: { status: 'CANCELLED', cancellationReason: 'Khách đổi kế hoạch' },
    }), { params: { id: bId } });

    for (const target of ['PENDING', 'CONFIRMED', 'COMPLETED', 'NO_SHOW'] as BookingStatus[]) {
      const res = await patchBookingStatus(makeRequest(`/api/admin/bookings/${bId}/status`, 'PATCH', {
        token: bookingToken,
        body: { status: target },
      }), { params: { id: bId } });
      recordTest(
        'Terminal Immutability',
        `CANCELLED state cannot transition to ${target} (HTTP 400)`,
        res.status === 400,
        res.status !== 400 ? `Got HTTP ${res.status}` : undefined
      );
    }
  }

  // Terminal state 3: NO_SHOW
  {
    const bId = await createFreshBooking(`idemp-term-noshow-${Date.now()}`);
    await patchBookingStatus(makeRequest(`/api/admin/bookings/${bId}/status`, 'PATCH', {
      token: bookingToken,
      body: { status: 'CONFIRMED' },
    }), { params: { id: bId } });

    await patchBookingStatus(makeRequest(`/api/admin/bookings/${bId}/status`, 'PATCH', {
      token: bookingToken,
      body: { status: 'NO_SHOW' },
    }), { params: { id: bId } });

    for (const target of ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'] as BookingStatus[]) {
      const res = await patchBookingStatus(makeRequest(`/api/admin/bookings/${bId}/status`, 'PATCH', {
        token: bookingToken,
        body: { status: target, cancellationReason: 'Test reason' },
      }), { params: { id: bId } });
      recordTest(
        'Terminal Immutability',
        `NO_SHOW state cannot transition to ${target} (HTTP 400)`,
        res.status === 400,
        res.status !== 400 ? `Got HTTP ${res.status}` : undefined
      );
    }
  }

  // ---------------------------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------------------------
  console.log('\n================================================================================');
  console.log('             ADVERSARIAL CHALLENGER PROBES SUMMARY (M3)                         ');
  console.log('================================================================================');

  const total = testResults.length;
  const passed = testResults.filter((t) => t.passed).length;
  const failed = testResults.filter((t) => !t.passed).length;

  console.log(`  Total Probes:  ${total}`);
  console.log(`  Passed:        ${passed}`);
  console.log(`  Failed:        ${failed}`);

  if (failed > 0) {
    console.error('\n❌ ADVERSARIAL CHALLENGES DETECTED:');
    testResults
      .filter((t) => !t.passed)
      .forEach((t) => {
        console.error(`  - [${t.suite}] ${t.name}: ${t.error}`);
      });
    process.exit(1);
  } else {
    console.log('\n✅ ALL ADVERSARIAL PROBES PASSED WITH 100% SUCCESS RATE!\n');
    process.exit(0);
  }
}

runAdversarialM3Suite().catch((err) => {
  console.error('Fatal adversarial runner error:', err);
  process.exit(1);
});
