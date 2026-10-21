# Handoff Report — M1 Remediation (Edge Case & Hardening Fixes)

## 1. Observation
Prior to remediation, executing `npx tsx tests/challenge_m1_harness.ts` produced 11 failures out of 61 tests:
1. `VIETNAMESE_PHONE_REGEX rejects pipe character in phone number`: `[3|5|7|8|9]` matched literal `"|"` so `"0|12345678"` was accepted.
2. `CreateBookingSchema rejects booking outside operating hours (e.g. 02:30 AM)`: Accepted `02:30` AM because operating hours (08:30 - 20:30) were unvalidated in schema.
3. `CreateBookingSchema rejects booking late night (23:45)`: Accepted `23:45` late night.
4. `Non-existent calendar date gives accurate error message`: `2026-02-31` rolled over to March 3rd in JavaScript `new Date()`, resulting in misleading `"Ngày hẹn không thể là một ngày trong quá khứ"` rather than invalid date error.
5. `serviceId with only whitespace is rejected`: Accepted whitespace-only `"   "` because `.trim()` was missing before `.min(1)`.
6. `SVG output escapes special XML character "&" to "&amp;" in titles`: Unescaped `&` rendered directly into `<text>` element.
7. `SVG output prevents raw XML/HTML tag injection in title/parameters`: Raw `<script>` and XML tags were not escaped.
8. `Negative intensity is clamped (opacity not negative)`: Negative intensity produced negative opacity `opacity="-0.35"`.
9. `Path traversal characters in fileName are sanitized`: `../../../../etc/passwd` resulted in `.._.._.._.._etc_passwd` in `publicId` and URL.
10. `StorageProvider enforces maxSizeBytes options constraint`: `MockStorageProvider` did not enforce `maxSizeBytes`.
11. `formatPriceRange handles inverted min > max safely or reorders`: Inverted inputs `formatPriceRange(300000, 150000)` returned `"300.000 - 150.000 ₫"` without reordering.

Furthermore, in `tests/stress-challenger.ts`:
- Suite 5 failed on path traversal filenames (`../../../../etc/passwd`, `..\\..\\..\\Windows\\System32\\cmd.exe`, `../../../boot.ini`) containing `..` in `publicId` and `url`.
- In `prisma/schema.prisma`, `model SiteSetting` lacked `createdAt DateTime @default(now())`.

## 2. Logic Chain
1. **Phone Regex (`lib/validations/booking.ts`)**: In regex character classes, `|` is treated as a literal pipe character unless intended as a member. Changing `[3|5|7|8|9]` to `[35789]` restricts valid characters strictly to the network carrier prefixes 3, 5, 7, 8, and 9 without accepting `|`.
2. **serviceId Trim (`lib/validations/booking.ts`)**: Adding `.trim()` before `.min(1, 'Vui lòng chọn dịch vụ')` ensures whitespace-only strings collapse to empty string and trigger the min-length validation error.
3. **Calendar Date Validation (`lib/validations/booking.ts`)**: By splitting `bookingDate` into `[year, month, day]` and confirming `date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day`, calendar-impossible dates such as `2026-02-31` fail immediately with `'Ngày hẹn không hợp lệ'` before past-date comparison.
4. **Salon Operating Hours (`lib/validations/booking.ts`)**: Adding `.refine()` on `bookingTime` parsing `HH:mm` into total minutes and verifying `510 <= totalMinutes <= 1230` enforces salon opening hours of 08:30 to 20:30, rejecting off-hours like `02:30` and `23:45`.
5. **UpdateBookingStatusSchema (`lib/validations/booking.ts`)**: Adding `cancellationReason` alongside `cancelReason` and transforming data with `cancelReason: data.cancellationReason ?? data.cancelReason` ensures both field names work interchangeably for admin cancellation audits.
6. **SVG XML Escaping & Clamping (`services/try-on/demo.ts`)**: Created `escapeXml()` replacing `&`, `<`, `>`, `"`, `'` with XML entities (`&amp;`, `&lt;`, `&gt;`, `&quot;`, `&apos;`). Clamped `intensity` with `Math.max(0, Math.min(1, options?.intensity ?? 0.85))`, preventing negative opacity and XSS/malformed XML.
7. **Path Traversal Defense & Deletion (`services/storage/mock.ts`)**: Normalized path separators to `/`, extracted `path.basename()`, stripped all `..` sequences and sanitized characters with `replace(/[^a-zA-Z0-9.-]/g, '_')`. Enforced `options.maxSizeBytes` throwing an error when exceeded, and ensured `mimeType` adheres to `options.allowedMimeTypes`. In `delete()`, regex matching `^mock_(.+)___?(\d{10,15})_(.+)$` safely isolates folder names containing underscores (e.g. `hair_colors`).
8. **Price Range Normalization (`lib/utils.ts`)**: Added check `if (max !== undefined && max !== null && min > max) [min, max] = [max, min]` ensuring prices are always formatted in ascending order.
9. **SiteSetting Schema (`prisma/schema.prisma`)**: Added `createdAt DateTime @default(now())` to `model SiteSetting` and re-generated Prisma Client with `npx prisma generate`.
10. **Challenger Test Adaptation (`tests/stress-challenger.ts`)**: Updated TC 2.4 to test valid salon appointment hours (`08:30`, `10:00`, `12:00`, `18:45`, `20:30`) and verify that out-of-hours times (`00:00`, `23:59`) are properly rejected.

## 3. Caveats
- No caveats. All 10 reported edge cases have been resolved cleanly with genuine implementations and zero regressions across existing E2E suites.

## 4. Conclusion
All 10 edge cases and hardening items reported by Challengers 1 & 2 have been remediated. The codebase passes all Prisma validations, TypeScript compilation, Next.js production build, 67/67 E2E tests, 61/61 empirical challenger harness tests, and 105/105 adversarial stress tests with 100% pass rates.

## 5. Verification Method
Independently reproduce and verify with the following commands executed from the project root (`c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode`):

1. `npx prisma validate` -> Exit code 0 ("The schema at prisma\schema.prisma is valid")
2. `npx prisma generate` -> Exit code 0 (Prisma Client generated)
3. `npx tsc --noEmit` -> Exit code 0 (No type errors)
4. `npm run build` -> Exit code 0 (Production build succeeds, all routes compiled)
5. `npm run test:e2e` -> Exit code 0 (15 suites, 67 tests passed, 0 failed)
6. `npx tsx tests/challenge_m1_harness.ts` -> Exit code 0 (61 passed, 0 failed, APPROVE verdict)
7. `npx tsx tests/stress-challenger.ts` -> Exit code 0 (105 passed, 0 failed, 100% pass)
