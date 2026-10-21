/**
 * M1 Empirical Challenge & Adversarial Stress Harness
 * Executed independently to find bugs, edge-case failures, and contract discrepancies.
 */

import { CreateBookingSchema, VIETNAMESE_PHONE_REGEX, UpdateBookingStatusSchema } from '../lib/validations/booking';
import { LoginSchema, ChangePasswordSchema } from '../lib/validations/auth';
import { cn, formatVND, formatPriceRange, formatDateVN, formatDateTimeVN, formatTimeVN, formatRelativeTimeVN, slugify, formatPhoneNumber, truncate, formatDuration } from '../lib/utils';
import { DemoHairTryOnProvider } from '../services/try-on/demo';
import { MockStorageProvider } from '../services/storage/mock';
import { hasRole, hasPermission, ROUTE_PERMISSIONS } from '../lib/auth';

interface TestResult {
  category: string;
  name: string;
  status: 'PASS' | 'FAIL';
  details?: string;
  bugReported?: boolean;
}

const results: TestResult[] = [];

function assert(condition: boolean, category: string, name: string, failureDetails: string = '') {
  if (condition) {
    results.push({ category, name, status: 'PASS' });
  } else {
    results.push({ category, name, status: 'FAIL', details: failureDetails, bugReported: true });
  }
}

async function runAllChallenges() {
  console.log('================================================================');
  console.log('       STARTING M1 EMPIRICAL ADVERSARIAL STRESS HARNESS         ');
  console.log('================================================================\n');

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. ZOD VALIDATION: VIETNAMESE PHONE REGEX & BOOKING SCHEMA
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('▶ Challenging Zod Validations & Regex...');

  // Bug Challenge 1.1: Pipe symbol in character class [3|5|7|8|9]
  const pipePhone1 = '0|12345678';
  const pipePhone2 = '+84|12345678';
  const acceptsPipe1 = VIETNAMESE_PHONE_REGEX.test(pipePhone1);
  const acceptsPipe2 = VIETNAMESE_PHONE_REGEX.test(pipePhone2);
  assert(
    !acceptsPipe1 && !acceptsPipe2,
    'Zod/Regex',
    'VIETNAMESE_PHONE_REGEX rejects pipe character in phone number',
    `CRITICAL REGEX BUG: Regex incorrectly matches literal "|" character! "0|12345678" => ${acceptsPipe1}, "+84|12345678" => ${acceptsPipe2}`
  );

  // Standard phones
  assert(VIETNAMESE_PHONE_REGEX.test('0908123456'), 'Zod/Regex', 'Valid 09x phone accepted');
  assert(VIETNAMESE_PHONE_REGEX.test('0328123456'), 'Zod/Regex', 'Valid 03x phone accepted');
  assert(VIETNAMESE_PHONE_REGEX.test('+84908123456'), 'Zod/Regex', 'Valid +84 9x phone accepted');
  assert(!VIETNAMESE_PHONE_REGEX.test('0208123456'), 'Zod/Regex', 'Invalid 02x phone rejected');
  assert(!VIETNAMESE_PHONE_REGEX.test('090812345'), 'Zod/Regex', '9-digit phone rejected');
  assert(!VIETNAMESE_PHONE_REGEX.test('09081234567'), 'Zod/Regex', '11-digit phone rejected');

  // Challenge 1.2: Operating Hours in CreateBookingSchema
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const midnightBooking = {
    serviceId: 'srv-01',
    bookingDate: tomorrowStr,
    bookingTime: '02:30', // Salon closed (2:30 AM)
    customerName: 'Nguyễn Văn A',
    customerPhone: '0908123456',
  };
  const midnightResult = CreateBookingSchema.safeParse(midnightBooking);
  assert(
    !midnightResult.success,
    'Zod/Booking',
    'CreateBookingSchema rejects booking outside operating hours (e.g. 02:30 AM)',
    'SCHEMA DEFECT: CreateBookingSchema accepts 02:30 AM! Operating hours (08:30 - 20:30) are not validated in schema.'
  );

  // Challenge 1.3: Late night booking in CreateBookingSchema
  const lateNightBooking = {
    serviceId: 'srv-01',
    bookingDate: tomorrowStr,
    bookingTime: '23:45', // Salon closed (11:45 PM)
    customerName: 'Nguyễn Văn A',
    customerPhone: '0908123456',
  };
  const lateNightResult = CreateBookingSchema.safeParse(lateNightBooking);
  assert(
    !lateNightResult.success,
    'Zod/Booking',
    'CreateBookingSchema rejects booking late night (23:45)',
    'SCHEMA DEFECT: CreateBookingSchema accepts 23:45! Operating hours are not validated in schema.'
  );

  // Challenge 1.4: Valid operating hours
  const validBooking = {
    serviceId: 'srv-01',
    bookingDate: tomorrowStr,
    bookingTime: '09:30',
    customerName: 'Trần Thị Mai',
    customerPhone: '0912345678',
    customerEmail: 'mai@example.com',
    notes: 'Tư vấn cắt tóc layer',
  };
  assert(CreateBookingSchema.safeParse(validBooking).success, 'Zod/Booking', 'Valid booking passes schema');

  // Challenge 1.5: Non-existent calendar date (e.g. 2026-02-31)
  const invalidDateBooking = {
    serviceId: 'srv-01',
    bookingDate: '2026-02-31',
    bookingTime: '10:00',
    customerName: 'Nguyễn Văn A',
    customerPhone: '0908123456',
  };
  const invalidDateResult = CreateBookingSchema.safeParse(invalidDateBooking);
  const invalidDateErrorMsg = invalidDateResult.success ? '' : invalidDateResult.error.errors[0]?.message;
  assert(
    !invalidDateResult.success && invalidDateErrorMsg.includes('hợp lệ'),
    'Zod/Booking',
    'Non-existent calendar date gives accurate error message (not misleading past date error)',
    `DATE VALIDATION DEFECT: 2026-02-31 gave error: "${invalidDateErrorMsg}" (claimed date in past instead of invalid calendar date)`
  );

  // Challenge 1.6: Empty string serviceId
  const emptyServiceBooking = {
    ...validBooking,
    serviceId: '   ',
  };
  // Note: z.string().min(1) without trim allows spaces!
  const emptyServiceResult = CreateBookingSchema.safeParse(emptyServiceBooking);
  assert(
    !emptyServiceResult.success,
    'Zod/Booking',
    'serviceId with only whitespace is rejected',
    'TRIM DEFECT: serviceId with whitespace "   " is accepted because .trim() is missing on serviceId!'
  );

  // Challenge 1.7: Customer name whitespace only
  const whitespaceNameBooking = {
    ...validBooking,
    customerName: '     ',
  };
  const whitespaceNameResult = CreateBookingSchema.safeParse(whitespaceNameBooking);
  assert(!whitespaceNameResult.success, 'Zod/Booking', 'customerName with only whitespace is rejected');

  // Challenge 1.8: Customer phone with SQL injection / XSS
  const sqlPhoneBooking = {
    ...validBooking,
    customerPhone: "0908123456' OR '1'='1",
  };
  assert(!CreateBookingSchema.safeParse(sqlPhoneBooking).success, 'Zod/Booking', 'SQL injection in phone rejected');

  // Challenge 1.9: Customer name > 100 chars
  const longNameBooking = {
    ...validBooking,
    customerName: 'A'.repeat(101),
  };
  assert(!CreateBookingSchema.safeParse(longNameBooking).success, 'Zod/Booking', 'Name > 100 chars rejected');

  // Challenge 1.10: Notes > 500 chars
  const longNotesBooking = {
    ...validBooking,
    notes: 'A'.repeat(501),
  };
  assert(!CreateBookingSchema.safeParse(longNotesBooking).success, 'Zod/Booking', 'Notes > 500 chars rejected');

  // Challenge 1.11: UpdateBookingStatusSchema with invalid status
  assert(!UpdateBookingStatusSchema.safeParse({ status: 'INVALID_STATUS' }).success, 'Zod/Booking', 'Invalid booking status rejected');
  assert(UpdateBookingStatusSchema.safeParse({ status: 'CONFIRMED' }).success, 'Zod/Booking', 'Valid booking status CONFIRMED accepted');
  assert(UpdateBookingStatusSchema.safeParse({ status: 'CANCELLED', cancelReason: 'Bận việc đột xuất' }).success, 'Zod/Booking', 'Valid CANCELLED status accepted');

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. AUTH VALIDATION & RBAC PERMISSIONS
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('▶ Challenging Auth Validations & RBAC...');

  // Challenge 2.1: LoginSchema email trimming & validation
  assert(!LoginSchema.safeParse({ email: 'notanemail', password: 'password123' }).success, 'Zod/Auth', 'Invalid email rejected');
  assert(!LoginSchema.safeParse({ email: 'admin@salon.vn', password: '123' }).success, 'Zod/Auth', 'Password < 6 chars rejected');
  assert(!LoginSchema.safeParse({ email: 'admin@salon.vn', password: 'a'.repeat(101) }).success, 'Zod/Auth', 'Password > 100 chars rejected');

  // Challenge 2.2: ChangePasswordSchema mismatch
  assert(
    !ChangePasswordSchema.safeParse({
      currentPassword: 'oldPassword123',
      newPassword: 'newPassword123',
      confirmPassword: 'differentPassword',
    }).success,
    'Zod/Auth',
    'Password confirmation mismatch rejected'
  );

  // Challenge 2.3: RBAC hasRole behavior
  assert(hasRole('SUPER_ADMIN', ['BOOKING_STAFF']), 'RBAC', 'SUPER_ADMIN bypasses role restrictions');
  assert(hasRole('BOOKING_STAFF', ['BOOKING_STAFF']), 'RBAC', 'BOOKING_STAFF allowed for booking role');
  assert(!hasRole('EDITOR', ['BOOKING_STAFF', 'CONTENT_ADMIN']), 'RBAC', 'EDITOR forbidden from booking/content');

  // Challenge 2.4: RBAC ROUTE_PERMISSIONS matrix completeness
  assert(Boolean(ROUTE_PERMISSIONS['/admin/site-settings']), 'RBAC', 'Route /admin/site-settings has explicit permission rule');
  assert(Boolean(ROUTE_PERMISSIONS['/admin/audit-logs']), 'RBAC', 'Route /admin/audit-logs has explicit permission rule');
  assert(Boolean(ROUTE_PERMISSIONS['/admin/bookings']), 'RBAC', 'Route /admin/bookings has explicit permission rule');

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. HAIR TRY-ON SIMULATION: SECURITY, XML MALFORMATION & BOUNDARIES
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('▶ Challenging Hair Try-On Provider...');

  const tryOnProvider = new DemoHairTryOnProvider();
  process.env.TRYON_MIN_DELAY_MS = '5';
  process.env.TRYON_MAX_DELAY_MS = '10';

  // Challenge 3.1: Empty buffer check
  try {
    await tryOnProvider.processTryOn({
      imageBuffer: Buffer.alloc(0),
      mimeType: 'image/png',
      hairstyleId: 'hs-01',
    });
    assert(false, 'TryOn', '0-byte buffer rejected with error');
  } catch (err: any) {
    assert(true, 'TryOn', '0-byte buffer rejected with error');
  }

  // Challenge 3.2: Missing hairstyleId check
  try {
    await tryOnProvider.processTryOn({
      imageBuffer: Buffer.from('mock-bytes'),
      mimeType: 'image/png',
      hairstyleId: '',
    });
    assert(false, 'TryOn', 'Empty hairstyleId rejected with error');
  } catch (err: any) {
    assert(true, 'TryOn', 'Empty hairstyleId rejected with error');
  }

  // Challenge 3.3: XML Well-formedness & Ampersand Escaping in SVG
  const testBuffer = Buffer.from('mock-image-data-payload');
  const resWithAmpersand = await tryOnProvider.processTryOn({
    imageBuffer: testBuffer,
    mimeType: 'image/png',
    hairstyleId: 'hs-01',
    options: {
      hairstyleTitle: 'Cut & Style Special',
      hairColorHex: '#D4AF37',
      intensity: 0.85,
    },
  });

  const rawSvgBase64 = resWithAmpersand.resultImageBase64.replace('data:image/svg+xml;base64,', '');
  const svgContent = Buffer.from(rawSvgBase64, 'base64').toString('utf-8');

  // In XML, unescaped & outside of entity reference is a fatal parse error!
  // e.g. "Cut & Style Special" inside <text> without &amp; causes XML parsing failure
  const hasUnescapedAmpersand = /Ki\u1ec3u t\u00f3c: [^<]*&[^a-zA-Z0-9#]/i.test(svgContent) || svgContent.includes('Cut & Style Special');
  assert(
    !hasUnescapedAmpersand,
    'TryOn/SVG',
    'SVG output escapes special XML character "&" to "&amp;" in titles',
    `MALFORMED XML BUG: DemoHairTryOnProvider inserted unescaped "&" in SVG <text> tag! Raw SVG snippet: "${svgContent.split('\n').find(l => l.includes('Cut & Style'))?.trim()}"`
  );

  // Challenge 3.4: SVG Attribute / XSS Injection in colorHex or title
  const resWithXss = await tryOnProvider.processTryOn({
    imageBuffer: testBuffer,
    mimeType: 'image/png',
    hairstyleId: 'hs-01',
    options: {
      hairstyleTitle: '</text><script>alert("XSS")</script><text>',
      hairColorHex: '#D4AF37" style="stroke:red',
      intensity: 0.85,
    },
  });
  const svgXssContent = Buffer.from(resWithXss.resultImageBase64.replace('data:image/svg+xml;base64,', ''), 'base64').toString('utf-8');
  const allowsSvgTagInjection = svgXssContent.includes('<script>alert("XSS")</script>');
  assert(
    !allowsSvgTagInjection,
    'TryOn/SVG',
    'SVG output prevents raw XML/HTML tag injection in title/parameters',
    'SECURITY/INJECTION DEFECT: Raw <script> or XML closing tags injected into SVG composite without sanitization/escaping!'
  );

  // Challenge 3.5: Extreme intensity values
  const resNegativeIntensity = await tryOnProvider.processTryOn({
    imageBuffer: testBuffer,
    mimeType: 'image/png',
    hairstyleId: 'hs-01',
    options: {
      intensity: -10,
    },
  });
  const svgNegative = Buffer.from(resNegativeIntensity.resultImageBase64.replace('data:image/svg+xml;base64,', ''), 'base64').toString('utf-8');
  assert(!svgNegative.includes('opacity="-'), 'TryOn/SVG', 'Negative intensity is clamped (opacity not negative)', `DEFECT: Negative opacity generated in SVG: ${svgNegative.match(/opacity="[^"]*"/)?.[0]}`);

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. STORAGE PROVIDER ABSTRACTION & PATH TRAVERSAL
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('▶ Challenging Storage Providers...');

  const mockStorage = new MockStorageProvider();

  // Challenge 4.1: Path traversal protection in fileName
  const uploadResult = await mockStorage.upload(
    Buffer.from('mock-bytes'),
    '../../etc/passwd.jpg',
    { folder: 'hairstyles' }
  );
  assert(
    !uploadResult.publicId.includes('..') && !uploadResult.url.includes('..'),
    'Storage',
    'Path traversal characters in fileName are sanitized'
  );

  // Challenge 4.2: allowedMimeTypes enforcement
  const invalidMimeUpload = await mockStorage.upload(
    Buffer.from('fake-exe-bytes'),
    'malware.exe',
    {
      folder: 'avatars',
      allowedMimeTypes: ['image/jpeg', 'image/png'],
    }
  );
  // Does it check allowedMimeTypes or silently upload?
  assert(
    invalidMimeUpload.mimeType.startsWith('image/'),
    'Storage',
    'MockStorageProvider returns safe image mimeType even for .exe'
  );

  // Challenge 4.3: maxSizeBytes enforcement
  const oversizedBuffer = Buffer.alloc(10 * 1024 * 1024); // 10 MB
  let oversizedRejected = false;
  try {
    const res = await mockStorage.upload(oversizedBuffer, 'huge.jpg', {
      folder: 'hairstyles',
      maxSizeBytes: 5 * 1024 * 1024,
    });
    // If it didn't throw, was it rejected or ignored?
    oversizedRejected = false;
  } catch {
    oversizedRejected = true;
  }
  assert(
    oversizedRejected,
    'Storage',
    'StorageProvider enforces maxSizeBytes options constraint',
    'STORAGE DEFECT: MockStorageProvider does not enforce maxSizeBytes constraint specified in UploadOptions.'
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. CORE UTILITIES: FORMATTERS, SLUGIFY & EDGE CASES
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('▶ Challenging Utility Functions...');

  // Challenge 5.1: slugify Vietnamese characters with Đ and mixed cases
  const slug1 = slugify('Kiểu Tóc Layer Nữ Hàn Quốc Đẹp 2026!');
  assert(slug1 === 'kieu-toc-layer-nu-han-quoc-dep-2026', 'Utils/slugify', 'slugify handles Vietnamese diacritics including Đ correctly', `Received: "${slug1}"`);

  // Challenge 5.2: slugify edge cases
  assert(slugify('') === '', 'Utils/slugify', 'slugify handles empty string');
  assert(slugify('     ') === '', 'Utils/slugify', 'slugify handles whitespace string');
  assert(slugify('$$$###@@@') === '', 'Utils/slugify', 'slugify handles special characters string');
  assert(slugify('Tóc---Layer   Nữ') === 'toc-layer-nu', 'Utils/slugify', 'slugify collapses multiple dashes and spaces');

  // Challenge 5.3: formatVND edge cases
  assert(formatVND(0) === '0 ₫' || formatVND(0) === '0 ₫', 'Utils/formatVND', 'formatVND handles 0 VND');
  assert(formatVND(NaN) === '0 ₫', 'Utils/formatVND', 'formatVND handles NaN safely');
  assert(formatVND(null as any) === '0 ₫', 'Utils/formatVND', 'formatVND handles null safely');
  assert(formatVND(undefined as any) === '0 ₫', 'Utils/formatVND', 'formatVND handles undefined safely');

  // Challenge 5.4: formatPriceRange edge cases
  const rangeSingle = formatPriceRange(150000);
  assert(rangeSingle.includes('150.000'), 'Utils/formatPriceRange', 'formatPriceRange single value produces formatted VND');
  const rangeSame = formatPriceRange(150000, 150000);
  assert(rangeSame.includes('150.000') && !rangeSame.includes('-'), 'Utils/formatPriceRange', 'formatPriceRange min === max collapses to single price');
  const rangeDiff = formatPriceRange(150000, 300000);
  assert(rangeDiff.includes('150.000') && rangeDiff.includes('300.000'), 'Utils/formatPriceRange', 'formatPriceRange min < max produces range');

  // Inverted price range: min > max (e.g. 300000, 150000)
  const rangeInverted = formatPriceRange(300000, 150000);
  assert(
    !rangeInverted.startsWith('300.000 - 150.000'),
    'Utils/formatPriceRange',
    'formatPriceRange handles inverted min > max safely or reorders',
    `UNHANDLED INVERSION: formatPriceRange(300000, 150000) returned "${rangeInverted}" without normalizing min <= max.`
  );

  // Challenge 5.5: formatPhoneNumber formatting
  assert(formatPhoneNumber('0908123456') === '0908 123 456', 'Utils/formatPhoneNumber', '10-digit phone formatted with spaces');
  assert(formatPhoneNumber('+84908123456') === '+84 908 123 456', 'Utils/formatPhoneNumber', '+84 phone formatted with spaces');
  assert(formatPhoneNumber('') === '', 'Utils/formatPhoneNumber', 'Empty phone handled safely');

  // Challenge 5.6: formatDuration
  assert(formatDuration(0) === '0 phút', 'Utils/formatDuration', '0 minutes formatted as "0 phút"');
  assert(formatDuration(-15) === '0 phút', 'Utils/formatDuration', 'Negative minutes formatted as "0 phút"');
  assert(formatDuration(45) === '45 phút', 'Utils/formatDuration', '45 minutes formatted as "45 phút"');
  assert(formatDuration(60) === '1 giờ', 'Utils/formatDuration', '60 minutes formatted as "1 giờ"');
  assert(formatDuration(90) === '1 giờ 30 phút', 'Utils/formatDuration', '90 minutes formatted as "1 giờ 30 phút"');

  // Challenge 5.7: truncate
  assert(truncate('Ngắn', 10) === 'Ngắn', 'Utils/truncate', 'Short text not truncated');
  assert(truncate('Đây là đoạn văn bản khá dài cần được rút gọn để hiển thị trên thẻ card', 20).endsWith('...'), 'Utils/truncate', 'Long text truncated with ellipsis');
  assert(truncate('', 10) === '', 'Utils/truncate', 'Empty text truncate handled');

  // ─────────────────────────────────────────────────────────────────────────────
  // SUMMARY REPORT
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n================================================================');
  console.log('                   CHALLENGE HARNESS SUMMARY                    ');
  console.log('================================================================');
  const total = results.length;
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;

  console.log(`Total Challenges: ${total}`);
  console.log(`Passed:           ${passed}`);
  console.log(`Failed / Defect:  ${failed}`);

  if (failed > 0) {
    console.log('\n--- DETECTED DEFECTS & VULNERABILITIES ---');
    for (const r of results.filter(r => r.status === 'FAIL')) {
      console.log(`\n❌ [${r.category}] ${r.name}`);
      console.log(`   Details: ${r.details}`);
    }
  }

  return { total, passed, failed, results };
}

runAllChallenges().then(summary => {
  if (summary.failed > 0) {
    console.log('\n[CHALLENGER VERDICT]: CHALLENGE_DETECTED');
    process.exit(1);
  } else {
    console.log('\n[CHALLENGER VERDICT]: APPROVE');
    process.exit(0);
  }
});
