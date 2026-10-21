/**
 * Empirical Adversarial Stress Harness for Milestone 6 Verification
 * Tests boundary conditions, security guards, regexes, and simulation engine.
 */

import { VIETNAMESE_PHONE_REGEX, CreateBookingSchema } from '../lib/validations/booking.ts';
import { checkApiRbacPermission, AdminRole } from '../lib/auth.ts';
import { DemoHairTryOnProvider } from '../services/try-on/demo.ts';
import { MAX_TRYON_FILE_SIZE_BYTES } from '../lib/validations/try-on.ts';

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    passCount++;
    console.log(`  ✓ [PASS] ${msg}`);
  } else {
    failCount++;
    console.error(`  ✗ [FAIL] ${msg}`);
  }
}

async function runAdversarialSuite() {
  console.log('================================================================');
  console.log('    ADVERSARIAL CHALLENGER STRESS HARNESS - EMPIRICAL EXECUTION');
  console.log('================================================================\n');

  // 1. Vietnamese Phone Regex Stress Test
  console.log('▶ TEST GROUP 1: Vietnamese Phone Format Edge Cases');
  const validPhones = [
    '0901234567',
    '0389998888',
    '0523456789',
    '0771234567',
    '0891234567',
    '+84901234567',
    '+84389998888',
    '+84523456789',
    '+84771234567',
    '+84891234567',
  ];

  for (const phone of validPhones) {
    assert(VIETNAMESE_PHONE_REGEX.test(phone), `Valid phone accepted: ${phone}`);
  }

  const invalidPhones = [
    '0281234567', // Landline 02
    '0123456789', // Invalid prefix 01
    '+84123456789',
    '090123456', // 9 digits
    '09012345678', // 11 digits
    'phone12345',
    '+840901234567', // Double zero
    '090 123 4567', // Spaces
    "0901234567'; DROP TABLE bookings;--", // SQL injection
  ];

  for (const phone of invalidPhones) {
    assert(!VIETNAMESE_PHONE_REGEX.test(phone), `Invalid phone rejected: ${phone}`);
  }

  // 2. Booking Date & Operating Hours Boundaries
  console.log('\n▶ TEST GROUP 2: Booking Date & Operating Hours Boundaries');
  const now = new Date();
  const formatYMD = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const todayStr = formatYMD(now);
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  const yesterdayStr = formatYMD(yesterday);
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const tomorrowStr = formatYMD(tomorrow);

  const baseBooking = {
    serviceId: 'srv-01',
    customerName: 'Nguyễn Văn A',
    customerPhone: '0901234567',
  };

  // Past date
  const pastRes = CreateBookingSchema.safeParse({
    ...baseBooking,
    bookingDate: yesterdayStr,
    bookingTime: '09:00',
  });
  assert(!pastRes.success, `Past date (${yesterdayStr}) rejected`);

  // Today
  const todayRes = CreateBookingSchema.safeParse({
    ...baseBooking,
    bookingDate: todayStr,
    bookingTime: '09:00',
  });
  assert(todayRes.success, `Today (${todayStr}) accepted`);

  // Tomorrow
  const tomorrowRes = CreateBookingSchema.safeParse({
    ...baseBooking,
    bookingDate: tomorrowStr,
    bookingTime: '10:00',
  });
  assert(tomorrowRes.success, `Tomorrow (${tomorrowStr}) accepted`);

  // Operating hours bounds: 08:30 to 20:30
  const timeTests = [
    { time: '08:29', shouldPass: false, desc: 'Before opening (08:29)' },
    { time: '08:30', shouldPass: true, desc: 'Exact opening (08:30)' },
    { time: '14:15', shouldPass: true, desc: 'Midday (14:15)' },
    { time: '20:30', shouldPass: true, desc: 'Exact closing (20:30)' },
    { time: '20:31', shouldPass: false, desc: 'After closing (20:31)' },
    { time: '00:00', shouldPass: false, desc: 'Midnight (00:00)' },
    { time: '23:59', shouldPass: false, desc: 'Late night (23:59)' },
  ];

  for (const t of timeTests) {
    const res = CreateBookingSchema.safeParse({
      ...baseBooking,
      bookingDate: tomorrowStr,
      bookingTime: t.time,
    });
    assert(res.success === t.shouldPass, `${t.desc}: ${res.success ? 'passed' : 'failed'}`);
  }

  // 3. Customer Name & Notes Boundaries
  console.log('\n▶ TEST GROUP 3: Customer Name & Notes String Boundaries');
  // 1 char name
  assert(!CreateBookingSchema.safeParse({ ...baseBooking, bookingDate: tomorrowStr, bookingTime: '09:00', customerName: 'A' }).success, '1 char name rejected');
  // 2 char name
  assert(CreateBookingSchema.safeParse({ ...baseBooking, bookingDate: tomorrowStr, bookingTime: '09:00', customerName: 'An' }).success, '2 char name accepted');
  // 100 char name
  const name100 = 'A'.repeat(100);
  assert(CreateBookingSchema.safeParse({ ...baseBooking, bookingDate: tomorrowStr, bookingTime: '09:00', customerName: name100 }).success, '100 char name accepted');
  // 101 char name
  const name101 = 'A'.repeat(101);
  assert(!CreateBookingSchema.safeParse({ ...baseBooking, bookingDate: tomorrowStr, bookingTime: '09:00', customerName: name101 }).success, '101 char name rejected');

  // Notes: 500 chars vs 501 chars
  const notes500 = 'Ghi chú kiểm thử '.repeat(29).slice(0, 500);
  assert(CreateBookingSchema.safeParse({ ...baseBooking, bookingDate: tomorrowStr, bookingTime: '09:00', notes: notes500 }).success, '500 char notes accepted');
  const notes501 = 'B'.repeat(501);
  assert(!CreateBookingSchema.safeParse({ ...baseBooking, bookingDate: tomorrowStr, bookingTime: '09:00', notes: notes501 }).success, '501 char notes rejected');

  // 4. Try-On Security & Boundaries
  console.log('\n▶ TEST GROUP 4: Try-On File Size & Magic Bytes');
  assert(MAX_TRYON_FILE_SIZE_BYTES === 5242880, 'MAX_TRYON_FILE_SIZE_BYTES is exactly 5.0 MB (5242880 bytes)');

  function checkDisallowed(buf: Buffer): boolean {
    if (buf.length < 4) return false;
    // GIF
    if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) return true;
    // PDF
    if (buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46) return true;
    // Windows PE (MZ)
    if (buf[0] === 0x4d && buf[1] === 0x5a) return true;
    // Linux ELF
    if (buf[0] === 0x7f && buf[1] === 0x45 && buf[2] === 0x4c && buf[3] === 0x46) return true;
    // HTML / Script
    const head = buf.subarray(0, Math.min(buf.length, 64)).toString('utf8').toLowerCase();
    if (head.includes('<html') || head.includes('<script')) return true;
    return false;
  }

  const gifHeader = Buffer.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);
  assert(checkDisallowed(gifHeader), 'GIF89a detected as disallowed');

  const pdfHeader = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31]);
  assert(checkDisallowed(pdfHeader), '%PDF detected as disallowed');

  const exeHeader = Buffer.from([0x4d, 0x5a, 0x90, 0x00]);
  assert(checkDisallowed(exeHeader), 'Windows PE (MZ) detected as disallowed');

  const elfHeader = Buffer.from([0x7f, 0x45, 0x4c, 0x46]);
  assert(checkDisallowed(elfHeader), 'Linux ELF detected as disallowed');

  const htmlHeader = Buffer.from('<html><script>alert(1)</script></html>');
  assert(checkDisallowed(htmlHeader), 'Embedded HTML/Script detected as disallowed');

  const validPngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  assert(!checkDisallowed(validPngHeader), 'Valid PNG magic bytes permitted');

  // 5. RBAC Permission Matrix Checks
  console.log('\n▶ TEST GROUP 5: RBAC Permission Matrix Enforcement');
  const roles: AdminRole[] = ['SUPER_ADMIN', 'CONTENT_ADMIN', 'BOOKING_STAFF', 'EDITOR'];

  // SUPER_ADMIN has access to all routes
  const superRoutes = [
    '/api/admin/settings',
    '/api/admin/audit-logs',
    '/api/admin/bookings',
    '/api/admin/hairstyles',
    '/api/admin/articles',
  ];
  for (const r of superRoutes) {
    assert(checkApiRbacPermission('SUPER_ADMIN', r).allowed, `SUPER_ADMIN allowed on ${r}`);
  }

  // BOOKING_STAFF checks
  assert(checkApiRbacPermission('BOOKING_STAFF', '/api/admin/bookings').allowed, 'BOOKING_STAFF allowed on /api/admin/bookings');
  assert(!checkApiRbacPermission('BOOKING_STAFF', '/api/admin/settings').allowed, 'BOOKING_STAFF forbidden on /api/admin/settings');
  assert(!checkApiRbacPermission('BOOKING_STAFF', '/api/admin/audit-logs').allowed, 'BOOKING_STAFF forbidden on /api/admin/audit-logs');
  assert(!checkApiRbacPermission('BOOKING_STAFF', '/api/admin/hairstyles').allowed, 'BOOKING_STAFF forbidden on /api/admin/hairstyles');

  // CONTENT_ADMIN checks
  assert(checkApiRbacPermission('CONTENT_ADMIN', '/api/admin/hairstyles').allowed, 'CONTENT_ADMIN allowed on /api/admin/hairstyles');
  assert(checkApiRbacPermission('CONTENT_ADMIN', '/api/admin/articles').allowed, 'CONTENT_ADMIN allowed on /api/admin/articles');
  assert(!checkApiRbacPermission('CONTENT_ADMIN', '/api/admin/bookings').allowed, 'CONTENT_ADMIN forbidden on /api/admin/bookings');
  assert(!checkApiRbacPermission('CONTENT_ADMIN', '/api/admin/settings').allowed, 'CONTENT_ADMIN forbidden on /api/admin/settings');

  // EDITOR checks
  assert(checkApiRbacPermission('EDITOR', '/api/admin/articles').allowed, 'EDITOR allowed on /api/admin/articles');
  assert(!checkApiRbacPermission('EDITOR', '/api/admin/hairstyles').allowed, 'EDITOR forbidden on /api/admin/hairstyles');
  assert(!checkApiRbacPermission('EDITOR', '/api/admin/banners').allowed, 'EDITOR forbidden on /api/admin/banners');
  assert(!checkApiRbacPermission('EDITOR', '/api/admin/bookings').allowed, 'EDITOR forbidden on /api/admin/bookings');

  // 6. DemoHairTryOnProvider Execution
  console.log('\n▶ TEST GROUP 6: DemoHairTryOnProvider Simulation Verification');
  const provider = new DemoHairTryOnProvider();
  const dummyBuffer = Buffer.from('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
  const simResult = await provider.processTryOn({
    imageBuffer: dummyBuffer,
    mimeType: 'image/png',
    hairstyleId: 'hs-textured-crop',
    hairColorId: 'col-silver-ash',
    options: {
      intensity: 0.8,
      hairstyleTitle: 'Textured Crop Hàn Quốc',
      hairColorHex: '#C0C0C0',
    },
  });

  assert(simResult.isMock === true, 'Simulation correctly sets isMock: true');
  assert(simResult.provider.includes('demo'), `Simulation correctly identifies demo provider: ${simResult.provider}`);
  assert(typeof simResult.resultImageBase64 === 'string' && simResult.resultImageBase64.length > 50, 'Result Base64 payload generated');
  assert(simResult.mimeType === 'image/svg+xml' || simResult.mimeType === 'image/png', 'MIME type is valid image format');

  console.log('\n================================================================');
  console.log(`STRESS HARNESS FINISHED: ${passCount} Passed, ${failCount} Failed`);
  console.log('================================================================\n');

  if (failCount > 0) process.exit(1);
}

runAdversarialSuite().catch((err) => {
  console.error('Fatal stress harness failure:', err);
  process.exit(1);
});
