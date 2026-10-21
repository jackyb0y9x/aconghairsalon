/**
 * Adversarial Stress-Testing Harness for Milestone 4 Booking Wizard & Validation
 * Focus areas:
 * 1. Boundary testing for operating hours (08:29, 08:30, 20:30, 20:31, invalid formats, midnight, noon)
 * 2. Vietnamese phone regex stress-testing (all valid prefixes 03/05/07/08/09, +84, invalid prefixes, letter injection, length variants)
 * 3. Customer name length boundaries (0, 1, 2, 99, 100, 101, whitespace trimming, Unicode Vietnamese diacritics)
 * 4. Date validation (leap years, 2026-02-29 invalid, 2026-02-28 valid, 2026-04-31 invalid, past dates vs today vs tomorrow)
 * 5. Anti-duplicate submission & Idempotency key lock (concurrent parallel calls, duplicate sequential calls)
 * 6. Email & notes boundaries (email format, 500 vs 501 chars notes)
 * 7. End-to-end API POST /api/bookings request handling
 */

import { NextRequest } from 'next/server';
import { POST as createBookingRoute } from '../app/api/bookings/route';
import { CreateBookingSchema, VIETNAMESE_PHONE_REGEX } from '../lib/validations/booking';

interface AdversarialTestResult {
  category: string;
  name: string;
  passed: boolean;
  error?: string;
}

const testResults: AdversarialTestResult[] = [];

function check(condition: boolean, category: string, name: string, errMsg?: string) {
  if (condition) {
    testResults.push({ category, name, passed: true });
    console.log(`  ✓ [PASS] [${category}] ${name}`);
  } else {
    testResults.push({ category, name, passed: false, error: errMsg });
    console.error(`  ✗ [FAIL] [${category}] ${name}: ${errMsg || 'Check failed'}`);
  }
}

async function runAdversarialTests() {
  console.log('================================================================================');
  console.log('       ADVERSARIAL STRESS TEST: BOOKING WIZARD & VALIDATION (M4)');
  console.log('================================================================================\n');

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const baseValidPayload = {
    serviceId: 'srv-adv-test-01',
    bookingDate: tomorrowStr,
    bookingTime: '10:00',
    customerName: 'Nguyễn Văn A',
    customerPhone: '0912345678',
    customerEmail: 'customer@example.com',
    notes: 'Yêu cầu kiểm tra kỹ da đầu',
    idempotencyKey: 'idemp-' + Date.now(),
  };

  // ---------------------------------------------------------------------------
  // 1. OPERATING HOURS BOUNDARIES (08:30 - 20:30)
  // ---------------------------------------------------------------------------
  console.log('▶ CATEGORY 1: OPERATING HOURS BOUNDARIES (08:30 - 20:30)');

  const hoursTestCases = [
    { time: '08:29', expectedPass: false, desc: '1 minute before opening (08:29)' },
    { time: '08:30', expectedPass: true, desc: 'Exact opening time (08:30)' },
    { time: '08:31', expectedPass: true, desc: '1 minute after opening (08:31)' },
    { time: '12:00', expectedPass: true, desc: 'Midday slot (12:00)' },
    { time: '20:29', expectedPass: true, desc: '1 minute before closing (20:29)' },
    { time: '20:30', expectedPass: true, desc: 'Exact closing time (20:30)' },
    { time: '20:31', expectedPass: false, desc: '1 minute after closing (20:31)' },
    { time: '00:00', expectedPass: false, desc: 'Midnight (00:00)' },
    { time: '23:59', expectedPass: false, desc: 'Late night (23:59)' },
    { time: '06:00', expectedPass: false, desc: 'Early morning (06:00)' },
    { time: '24:00', expectedPass: false, desc: 'Invalid hour 24:00' },
    { time: '08:60', expectedPass: false, desc: 'Invalid minute 08:60' },
    { time: '8:30', expectedPass: false, desc: 'Single digit hour 8:30 without leading zero' },
    { time: '08:3', expectedPass: false, desc: 'Single digit minute 08:3' },
    { time: 'invalid', expectedPass: false, desc: 'String literal "invalid"' },
  ];

  for (const tc of hoursTestCases) {
    const res = CreateBookingSchema.safeParse({
      ...baseValidPayload,
      bookingTime: tc.time,
    });
    check(
      res.success === tc.expectedPass,
      'Operating Hours',
      `${tc.desc} -> ${tc.expectedPass ? 'ACCEPT' : 'REJECT'}`
    );
  }

  // ---------------------------------------------------------------------------
  // 2. VIETNAMESE PHONE REGEX STRESS-TESTING
  // ---------------------------------------------------------------------------
  console.log('\n▶ CATEGORY 2: VIETNAMESE PHONE NUMBER REGEX');

  const phoneTestCases = [
    // Standard 10-digit prefixes with 0
    { phone: '0321234567', expectedPass: true, desc: 'Viettel prefix 032' },
    { phone: '0389876543', expectedPass: true, desc: 'Viettel prefix 038' },
    { phone: '0561234567', expectedPass: true, desc: 'Vietnamobile prefix 056' },
    { phone: '0581234567', expectedPass: true, desc: 'Vietnamobile prefix 058' },
    { phone: '0701234567', expectedPass: true, desc: 'MobiFone prefix 070' },
    { phone: '0791234567', expectedPass: true, desc: 'MobiFone prefix 079' },
    { phone: '0812345678', expectedPass: true, desc: 'VinaPhone prefix 081' },
    { phone: '0881234567', expectedPass: true, desc: 'VinaPhone prefix 088' },
    { phone: '0901234567', expectedPass: true, desc: 'MobiFone prefix 090' },
    { phone: '0912345678', expectedPass: true, desc: 'VinaPhone prefix 091' },
    { phone: '0987654321', expectedPass: true, desc: 'Viettel prefix 098' },

    // International format with +84
    { phone: '+84321234567', expectedPass: true, desc: 'International +8432' },
    { phone: '+84908123456', expectedPass: true, desc: 'International +8490' },
    { phone: '+84888123456', expectedPass: true, desc: 'International +8488' },

    // Invalid formats
    { phone: '0123456789', expectedPass: false, desc: 'Obsolete 11-digit prefix 012' },
    { phone: '02438234567', expectedPass: false, desc: 'Hanoi Landline 024' },
    { phone: '02838234567', expectedPass: false, desc: 'HCMC Landline 028' },
    { phone: '090812345', expectedPass: false, desc: 'Too short (9 digits)' },
    { phone: '09081234567', expectedPass: false, desc: 'Too long (11 digits starting with 0)' },
    { phone: '+840908123456', expectedPass: false, desc: '+84 followed by redundant 0' },
    { phone: '84908123456', expectedPass: false, desc: 'Missing + prefix for 84' },
    { phone: '0908 123 456', expectedPass: false, desc: 'Internal spaces' },
    { phone: '0908-123-456', expectedPass: false, desc: 'Dashes in phone' },
    { phone: '0908a12345', expectedPass: false, desc: 'Letter inside phone number' },
    { phone: '', expectedPass: false, desc: 'Empty phone string' },
  ];

  for (const tc of phoneTestCases) {
    const res = CreateBookingSchema.safeParse({
      ...baseValidPayload,
      customerPhone: tc.phone,
    });
    check(
      res.success === tc.expectedPass,
      'Phone Format',
      `${tc.desc} (${tc.phone || '""'}) -> ${tc.expectedPass ? 'ACCEPT' : 'REJECT'}`
    );
  }

  // ---------------------------------------------------------------------------
  // 3. CUSTOMER NAME LENGTH BOUNDARIES
  // ---------------------------------------------------------------------------
  console.log('\n▶ CATEGORY 3: CUSTOMER NAME BOUNDARIES (2 - 100 CHARS)');

  const nameTestCases = [
    { name: '', expectedPass: false, desc: 'Empty name (0 chars)' },
    { name: 'A', expectedPass: false, desc: '1 char ("A")' },
    { name: 'An', expectedPass: true, desc: 'Exact min boundary 2 chars ("An")' },
    { name: 'Lê', expectedPass: true, desc: '2 chars Vietnamese Unicode ("Lê")' },
    { name: 'Nguyễn Phương Thảo', expectedPass: true, desc: 'Standard Vietnamese name' },
    { name: 'A'.repeat(99), expectedPass: true, desc: '99 chars (below max)' },
    { name: 'A'.repeat(100), expectedPass: true, desc: 'Exact max boundary 100 chars' },
    { name: 'A'.repeat(101), expectedPass: false, desc: '101 chars (above max)' },
    { name: '   ', expectedPass: false, desc: 'Whitespace only ("   ") -> trims to empty' },
    { name: '   A   ', expectedPass: false, desc: '1 char padded with spaces -> trims to 1 char' },
    { name: '   An   ', expectedPass: true, desc: '2 chars padded with spaces -> trims to 2 chars' },
  ];

  for (const tc of nameTestCases) {
    const res = CreateBookingSchema.safeParse({
      ...baseValidPayload,
      customerName: tc.name,
    });
    check(
      res.success === tc.expectedPass,
      'Customer Name',
      `${tc.desc} -> ${tc.expectedPass ? 'ACCEPT' : 'REJECT'}`
    );
  }

  // ---------------------------------------------------------------------------
  // 4. CALENDAR DATE LOGIC & EDGE CASES
  // ---------------------------------------------------------------------------
  console.log('\n▶ CATEGORY 4: CALENDAR DATE VALIDATION & CALENDAR INTEGRITY');

  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${mm}-${dd}`;

  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 10);
  const pastDateStr = pastDate.toISOString().split('T')[0];

  const dateTestCases = [
    { date: todayStr, expectedPass: true, desc: 'Today date is accepted' },
    { date: tomorrowStr, expectedPass: true, desc: 'Tomorrow date is accepted' },
    { date: pastDateStr, expectedPass: false, desc: 'Past date is rejected' },
    { date: '2026-02-29', expectedPass: false, desc: 'Non-leap year Feb 29 (2026 is not leap year)' },
    { date: '2027-02-28', expectedPass: true, desc: 'Valid Feb 28 in future (2027-02-28)' },
    { date: '2027-04-31', expectedPass: false, desc: 'April 31 in future (April has only 30 days)' },
    { date: '2026-13-01', expectedPass: false, desc: 'Month 13 is invalid' },
    { date: '2026-00-15', expectedPass: false, desc: 'Month 00 is invalid' },
    { date: '2026-05-32', expectedPass: false, desc: 'Day 32 is invalid' },
    { date: '26-05-2026', expectedPass: false, desc: 'Wrong format DD-MM-YYYY' },
    { date: '2026/05/20', expectedPass: false, desc: 'Wrong separator slash' },
  ];

  for (const tc of dateTestCases) {
    const res = CreateBookingSchema.safeParse({
      ...baseValidPayload,
      bookingDate: tc.date,
    });
    check(
      res.success === tc.expectedPass,
      'Date Validation',
      `${tc.desc} (${tc.date}) -> ${tc.expectedPass ? 'ACCEPT' : 'REJECT'}`
    );
  }

  // ---------------------------------------------------------------------------
  // 5. EMAIL & NOTES BOUNDARIES
  // ---------------------------------------------------------------------------
  console.log('\n▶ CATEGORY 5: EMAIL & NOTES BOUNDARIES');

  // Email
  check(
    CreateBookingSchema.safeParse({ ...baseValidPayload, customerEmail: '' }).success,
    'Email Boundary',
    'Empty string email is accepted (optional)'
  );
  check(
    CreateBookingSchema.safeParse({ ...baseValidPayload, customerEmail: undefined }).success,
    'Email Boundary',
    'Undefined email is accepted (optional)'
  );
  check(
    CreateBookingSchema.safeParse({ ...baseValidPayload, customerEmail: 'valid.user@salon.vn' }).success,
    'Email Boundary',
    'Standard valid email is accepted'
  );
  check(
    !CreateBookingSchema.safeParse({ ...baseValidPayload, customerEmail: 'invalid-email-format' }).success,
    'Email Boundary',
    'Malformed email without @ is rejected'
  );

  // Notes (max 500 chars)
  check(
    CreateBookingSchema.safeParse({ ...baseValidPayload, notes: 'A'.repeat(500) }).success,
    'Notes Boundary',
    'Exact 500 characters notes accepted'
  );
  check(
    !CreateBookingSchema.safeParse({ ...baseValidPayload, notes: 'A'.repeat(501) }).success,
    'Notes Boundary',
    '501 characters notes rejected'
  );

  // ---------------------------------------------------------------------------
  // 6. IDEMPOTENCY KEY CONCURRENCY & DUPLICATE SUBMISSION
  // ---------------------------------------------------------------------------
  console.log('\n▶ CATEGORY 6: IDEMPOTENCY KEY ANTI-DUPLICATE & CONCURRENCY LOCK');

  const testIdempotencyKey = 'test-idemp-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);

  const bookingReq1 = new NextRequest('http://localhost:3000/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...baseValidPayload,
      customerName: 'Trần Minh Quân',
      customerPhone: '0977889900',
      idempotencyKey: testIdempotencyKey,
    }),
  });

  const res1 = await createBookingRoute(bookingReq1);
  const data1 = await res1.json();

  check(
    res1.status === 201 || res1.status === 200,
    'Idempotency Lock',
    'Initial booking submission succeeds with HTTP 201/200'
  );
  check(
    Boolean(data1.bookingCode && data1.bookingCode.startsWith('BK')),
    'Idempotency Lock',
    `Initial booking generated bookingCode (${data1.bookingCode})`
  );

  // Sequential duplicate submission with SAME idempotencyKey
  const bookingReq2 = new NextRequest('http://localhost:3000/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...baseValidPayload,
      customerName: 'Trần Minh Quân',
      customerPhone: '0977889900',
      idempotencyKey: testIdempotencyKey,
    }),
  });

  const res2 = await createBookingRoute(bookingReq2);
  const data2 = await res2.json();

  check(
    res2.status === 200,
    'Idempotency Lock',
    'Duplicate submission returns HTTP 200 (idempotent cached response)'
  );
  check(
    data2.bookingCode === data1.bookingCode,
    'Idempotency Lock',
    `Duplicate submission returns EXACT same bookingCode: ${data2.bookingCode} === ${data1.bookingCode}`
  );
  check(
    data2.id === data1.id,
    'Idempotency Lock',
    `Duplicate submission returns EXACT same booking ID: ${data2.id} === ${data1.id}`
  );

  // Parallel concurrent duplicate submission test (race condition check)
  const concurrentKey = 'test-concurrent-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
  const makeReq = () =>
    new NextRequest('http://localhost:3000/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...baseValidPayload,
        customerName: 'Lê Hoàng Long',
        customerPhone: '0933445566',
        idempotencyKey: concurrentKey,
      }),
    });

  const [concRes1, concRes2] = await Promise.all([
    createBookingRoute(makeReq()),
    createBookingRoute(makeReq()),
  ]);

  const concData1 = await concRes1.json();
  const concData2 = await concRes2.json();

  check(
    (concRes1.status === 201 || concRes1.status === 200) &&
    (concRes2.status === 201 || concRes2.status === 200),
    'Concurrency Lock',
    `Concurrent submissions both succeed without crashing (${concRes1.status}, ${concRes2.status})`
  );
  check(
    concData1.bookingCode === concData2.bookingCode,
    'Concurrency Lock',
    `Concurrent submissions resolve to IDENTICAL bookingCode (${concData1.bookingCode})`
  );
  check(
    concData1.id === concData2.id,
    'Concurrency Lock',
    `Concurrent submissions produce single database entity (ID ${concData1.id})`
  );

  // ---------------------------------------------------------------------------
  // 7. TIME SLOT VS BOOKING TIME COMPATIBILITY
  // ---------------------------------------------------------------------------
  console.log('\n▶ CATEGORY 7: TIME SLOT FIELD ALIAS COMPATIBILITY');

  // Payload with only timeSlot (as used by some legacy forms)
  const timeSlotPayload = {
    serviceId: baseValidPayload.serviceId,
    bookingDate: baseValidPayload.bookingDate,
    timeSlot: '14:30',
    customerName: 'Hoàng Kim Chi',
    customerPhone: '0988112233',
  };

  const reqTimeSlot = new NextRequest('http://localhost:3000/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(timeSlotPayload),
  });

  const resTimeSlot = await createBookingRoute(reqTimeSlot);
  const dataTimeSlot = await resTimeSlot.json();

  check(
    resTimeSlot.status === 201 || resTimeSlot.status === 200,
    'Field Compatibility',
    'Payload with timeSlot alias succeeds with HTTP 201/200'
  );
  check(
    dataTimeSlot.timeSlot === '14:30' || dataTimeSlot.bookingTime === '14:30',
    'Field Compatibility',
    `Stored time slot matches input (14:30): got ${dataTimeSlot.timeSlot}`
  );

  // ---------------------------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------------------------
  console.log('\n================================================================================');
  console.log('              ADVERSARIAL STRESS TEST SUMMARY REPORT');
  console.log('================================================================================');

  const total = testResults.length;
  const passed = testResults.filter((r) => r.passed).length;
  const failed = testResults.filter((r) => !r.passed).length;

  console.log(`  Total Checks: ${total}`);
  console.log(`  Passed:       ${passed}`);
  console.log(`  Failed:       ${failed}`);
  console.log('================================================================================\n');

  if (failed > 0) {
    console.error(`❌ STRESS TEST FOUND ${failed} DEFECT(S)!`);
    process.exit(1);
  } else {
    console.log(`🎉 ALL ${total} ADVERSARIAL STRESS TEST CHECKS PASSED EMPIRICALLY!`);
    process.exit(0);
  }
}

runAdversarialTests().catch((err) => {
  console.error('Fatal unhandled error during adversarial run:', err);
  process.exit(1);
});
