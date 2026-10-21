# Dispatch: M1 Remediation Worker (Edge Case & Hardening Fixes)

- Role: Worker / Implementer
- Working Directory: c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_worker_m1_2
- Parent Orchestrator ID: daa96dc0-4b53-4192-88a0-f59f39a1f3f3
- Milestone: M1 - Foundation & Database Layer (Iteration 2 Remediation)
- Project Root: c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode
- Project Specification: c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\PROJECT.md
- Original Request File: c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\ORIGINAL_REQUEST.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Remediation Tasks (Reported by Challengers 1 & 2):
1. `lib/validations/booking.ts`:
   - Fix phone regex: Change `[3|5|7|8|9]` to `[35789]`.
   - Fix `serviceId`: Add `.trim().min(1, 'Vui lòng chọn dịch vụ')`.
   - Add opening hours validation: Salon hours are 08:30 to 20:30. In `bookingTime` or via `.refine()`, reject times outside 08:30 - 20:30.
   - Refine `bookingDate`: Verify real calendar dates (e.g. reject 2026-02-31 with a clear date validity error) and ensure not in the past.
   - Support `cancellationReason` in `UpdateBookingStatusSchema` (while accepting `cancelReason` as alias).
2. `services/try-on/demo.ts`:
   - Add XML entity escaping helper for SVG text: escape `&` -> `&amp;`, `<` -> `&lt;`, `>` -> `&gt;`, `"` -> `&quot;`, `'` -> `&apos;`. Apply to hairstyle name, color name, and disclaimers.
   - Clamp `intensity`: `Math.max(0, Math.min(1, options?.intensity ?? 0.8))`.
3. `services/storage/mock.ts`:
   - Sanitize file names with `path.basename` and strip path traversal sequences (`..`).
   - In `delete()`: Parse publicId safely without breaking when folders contain underscores (`hair_colors`, etc.).
   - Enforce `maxSizeBytes` and `allowedMimeTypes` if provided in options.
4. `lib/utils.ts`:
   - In `formatPriceRange(min, max)`: If `min > max`, swap them `[min, max] = [max, min]`.
5. `prisma/schema.prisma`:
   - Add `createdAt DateTime @default(now())` to `model SiteSetting`.

Run Verification Commands:
- `npx prisma validate`
- `npx prisma generate`
- `npx tsc --noEmit`
- `npm run build`
- `npm run test:e2e`
- Run challenger tests: `npx tsx tests/challenge_m1_harness.ts` and `npx tsx tests/stress-challenger.ts`

Deliver handoff.md and report to parent via `send_message` when complete.
