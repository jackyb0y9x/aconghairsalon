# Milestone 5 Explorer 3: Adversarial Quality & Challenge Harness Blueprint Handoff

**Agent**: M5 Explorer 3 (Adversarial Quality & Challenge Harness Specialist)  
**Parent Orchestrator ID**: `daa96dc0-4b53-4192-88a0-f59f39a1f3f3`  
**Date**: 2026-10-19  
**Type**: Hard Handoff (Investigation Complete)  
**Deliverables**: `analysis.md`, `handoff.md`

---

## 1. Observation

1. **Try-On Provider & Abstraction Contracts**:
   - `services/try-on/types.ts:1-24`: Defines `SupportedTryOnMimeType = 'image/jpeg' | 'image/png' | 'image/webp'` and `TryOnRequest` requiring `imageBuffer: Buffer`, `mimeType: SupportedTryOnMimeType`, `hairstyleId: string`, optional `hairColorId?: string`, and `options?: { intensity?: number, hairstyleTitle?: string, hairColorHex?: string }`.
   - `services/try-on/types.ts:29-42`: Defines `TryOnResponse` specifying `resultImageBase64: string`, `mimeType: string`, `isMock: boolean`, `provider: string`, `processingTimeMs: number`, and `notice?: string`.
   - `services/try-on/demo.ts:36-108`: Implements `DemoHairTryOnProvider`. Line 40 checks `!request.imageBuffer || request.imageBuffer.length === 0` throwing `'Dữ liệu ảnh chân dung không hợp lệ hoặc rỗng'`. Line 43 checks `!request.hairstyleId` throwing `'Chưa chọn kiểu tóc để mô phỏng'`. Line 56 clamps intensity `Math.max(0, Math.min(1, request.options?.intensity ?? 0.85))`. Lines 60-95 generate composite SVG embedding the image as data URI, tint overlay, DEMO SIMULATION badge, and salon footer. Lines 100-108 return `resultImageBase64: "data:image/svg+xml;base64,..."`, `isMock: true`, `provider: 'demo-tryon-provider'`, and disclaimer notice.
   - `services/try-on/index.ts:10-31`: Defines `getHairTryOnProvider()` with singleton cache and fallback to `DemoHairTryOnProvider`, plus `resetHairTryOnProvider()`.

2. **Existing E2E Test Expectations for Try-On**:
   - `tests/e2e/tier1-features/try-on.test.ts:21-27`: Asserts `POST /api/try-on` returns HTTP 200, `resultImageBase64` string, `isMock === true`, `provider` contains `'demo'`, `appliedStyleId` matches `hairstyleId`.
   - `tests/e2e/tier1-features/try-on.test.ts:80-86`: Asserts `privacyValidated === true` and strict absence of disk paths: `res.data.diskPath === undefined` and `res.data.serverFilePath === undefined`.
   - `tests/e2e/tier2-boundaries/tryon-boundaries.test.ts:19-22`: Asserts 0-byte buffer is rejected with HTTP 400 (`error` contains `'không hợp lệ hoặc rỗng'`).
   - `tests/e2e/tier2-boundaries/tryon-boundaries.test.ts:35-38`: Asserts exactly 5.0 MB buffer (`BUFFER_5MB`) is accepted with HTTP 200.
   - `tests/e2e/tier2-boundaries/tryon-boundaries.test.ts:51-54`: Asserts 5.1 MB buffer (`BUFFER_OVERSIZED_5_1MB`) is rejected with HTTP 413 Payload Too Large (`error` contains `'vượt quá giới hạn tối đa'`).
   - `tests/e2e/tier2-boundaries/tryon-boundaries.test.ts:67-70`: Asserts missing `hairstyleId` returns HTTP 400 (`error` contains `'chọn kiểu tóc'`).
   - `tests/e2e/tier2-boundaries/tryon-boundaries.test.ts:83-86`: Asserts unsupported MIME (`image/gif`, `application/pdf`) returns HTTP 400 (`error` contains `'Định dạng ảnh không được hỗ trợ'`).

3. **Booking Transfer Integration**:
   - `components/public/BookingWizardClient.tsx:124-125, 130-131`:
     ```typescript
     const hId = searchParams.get('hairstyleId') || searchParams.get('styleId');
     const colId = searchParams.get('hairColorId') || searchParams.get('colorId');
     if (hId) setSelectedHairstyleId(hId);
     if (colId) setSelectedHairColorId(colId);
     ```
   - `tests/e2e/tier3-combinations/tryon-to-booking.test.ts:12-51`: Validates complete user journey where customer simulates in try-on tool, clicks "Đặt lịch ngay với kiểu này", passes `appliedStyleId` and `appliedColorId` into `/api/bookings`, and creates appointment with status `PENDING`.
   - `app/(public)/hairstyles/[slug]/page.tsx:168`: Directly links to `/try-on?hairstyleId=${hairstyle.id}`.
   - `components/public/ColorCatalogClient.tsx:305`: Directly links to `/try-on?hairColorId=${color.id}`.

4. **Challenge Harness Precedents**:
   - `tests/challenge_m4_harness.ts:67-76`: Uses `assert(condition, suite, name, message, details)` pushing to `results: AssertionResult[]`, logging `✓ [PASS]` / `✗ [FAIL]`, and exiting with `process.exit(failed > 0 ? 1 : 0)`.
   - `tests/challenge_m3_harness.ts:1-27`: Implements 6 comprehensive suites with direct route handler invocation and database verification.

---

## 2. Logic Chain

1. **From Observations 1 & 2**: The backend try-on subsystem centers on `HairTryOnProvider` and `DemoHairTryOnProvider`. Because the simulation engine operates entirely in memory and outputs an SVG data URL, the API route handler (`app/api/try-on/route.ts`) must act as an ephemeral proxy. It must never persist incoming image buffers to disk (verifying biometric privacy).
2. **From Observation 2**: `DemoHairTryOnProvider` includes XML escaping (`escapeXml`), but adversarial inputs (such as XSS strings in `hairstyleTitle` or `hairColorHex`) could compromise SVG integrity if improperly escaped. The test harness must probe SVG output to verify XSS immunity.
3. **From Observations 2 & 5**: The payload boundary is strictly fixed at 5.0 MB. A 5,242,880-byte payload must succeed (HTTP 200), while any payload exceeding 5MB (such as 5,242,881 bytes or 5.1MB) must be rejected with HTTP 413 Payload Too Large. Furthermore, empty buffers (0 bytes) and unsupported MIME types (`image/gif`, `application/pdf`, `text/plain`) must be rejected with HTTP 400.
4. **From Observations 3 & 7**: The public booking wizard already supports `hairstyleId` and `hairColorId` URL search parameters. Therefore, the "Đặt Lịch Với Kiểu Tóc Này" CTA on the try-on result view only needs to route to `/booking?hairstyleId=${selectedHairstyleId}&hairColorId=${selectedHairColorId}` to achieve 100% automated transfer.
5. **From Observations 2 & 4**: In order for Milestone 5 to pass both the standalone challenge harness and the existing 67 E2E tests, the response of `POST /api/try-on` must include `resultImageBase64`, `mimeType`, `isMock: true`, `provider`, `processingTimeMs`, `appliedStyleId`, `appliedColorId`, and `privacyValidated: true`, while leaving `diskPath` and `serverFilePath` strictly `undefined`.
6. **From Observation 10**: Implementing `tests/challenge_m5_harness.ts` following the battle-tested pattern of M1-M4 allows automated, empirical verification of all 6 test suites with a single terminal command: `npx tsx tests/challenge_m5_harness.ts`.

---

## 3. Caveats

1. **Route Handler Existence**: `app/api/try-on/route.ts` and `app/(public)/try-on/page.tsx` are currently being designed by M5 Explorer 2 and M5 Explorer 1 respectively, and will be coded by M5 Worker. The test harness blueprint is designed to run both directly against the route handler once implemented, or via the HTTP simulator / live server.
2. **Next.js App Router Body Size Configuration**: Next.js App Router default request body limit is 4MB. The worker implementing `app/api/try-on/route.ts` must ensure route segment config (`export const dynamic = 'force-dynamic'`) or Next.js server config allows 5.0MB payloads without server-level 413 truncation before the handler runs.
3. **No Caveats** regarding the core requirements: API boundaries, MIME validation, provider response schema, UI state machine transitions, and booking transfer are fully understood, mapped, and specified.

---

## 4. Conclusion

1. **Verification Strategy Ready**: A comprehensive 6-suite verification strategy has been established in `analysis.md`, covering:
   - Suite 1: Try-On Provider Interface & Simulation Engine (`DemoHairTryOnProvider`).
   - Suite 2: Server API Route Contract & Boundaries (`POST /api/try-on`).
   - Suite 3: Dual Payload Ingestion Modes (JSON Base64 / Buffer & Multipart).
   - Suite 4: Biometric Privacy & Security Invariants (Zero Disk Write, Sanitization, Audit Safety).
   - Suite 5: UI State Machine Matrix & Deep-Link Parameter Hydration.
   - Suite 6: Try-On to Online Booking Flow Conversion.
2. **Key Architectural Constraints Validated**:
   - Exact 5.0 MB boundary acceptance vs 5.1 MB rejection with HTTP 413.
   - Strict MIME whitelist (`image/jpeg`, `image/png`, `image/webp`).
   - Ephemeral in-memory handling with zero disk persistence.
   - Seamless booking transfer via `/booking?hairstyleId=...&hairColorId=...`.
3. **Test Harness Blueprint Complete**: The full blueprint for `tests/challenge_m5_harness.ts` is ready for immediate realization by the test writer / challenger agent.

---

## 5. Verification Method

To independently verify this analysis:
1. **Inspect Artifacts**:
   - `c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_explorer_m5_3\analysis.md`
   - `c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_explorer_m5_3\handoff.md`
2. **Execute Existing Test Baseline**:
   ```bash
   npm run test:e2e
   ```
   *Expected*: 67/67 tests passing (including Tier 1, Tier 2, and Tier 3 try-on suites against the Contract Simulator).
3. **Execute Standalone Milestone Harnesses**:
   ```bash
   npx tsx tests/challenge_m4_harness.ts
   ```
   *Expected*: 100% pass (0 failures), confirming stability of the preceding public website milestone.
4. **Invalidation Conditions**:
   - Any requirement for server-side disk storage of customer face images.
   - Inability of `POST /api/try-on` to accept a 5.0 MB image payload.
   - Failure of `BookingWizardClient` to read `hairstyleId` or `hairColorId` from URL query parameters.
