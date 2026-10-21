# Milestone 5 Analysis: Adversarial Quality & Challenge Harness Blueprint

**Agent**: M5 Explorer 3 (Adversarial Quality & Challenge Harness Specialist)  
**Parent Orchestrator ID**: `daa96dc0-4b53-4192-88a0-f59f39a1f3f3`  
**Date**: 2026-10-19  
**Target Milestone**: Milestone 5 — AI Hairstyle Try-On & Booking Integration  
**Target Artifact**: `tests/challenge_m5_harness.ts`

---

## 1. Executive Summary & Objective

The mission of M5 Explorer 3 is to establish an unyielding adversarial verification blueprint for **Milestone 5 (Interactive Virtual Hair Try-On Subsystem)**. Milestone 5 introduces user-facing biometric photo interaction, server-side in-memory image simulation, pluggable provider architecture, and cross-subsystem conversion to online appointment booking.

Because biometric portrait data and file uploads are high-risk vectors for security vulnerabilities (disk leaks, XSS via SVG injection, buffer overflows, memory bloat, and denial of service), this analysis defines an exhaustive, multi-tier adversarial challenge harness (`tests/challenge_m5_harness.ts`).

### Core Verification Pillars:
1. **API Contract & Payload Boundaries**: Dual-format payload ingestion (Multipart & JSON base64), 5MB boundary limits, zero-byte rejection, unsupported MIME rejection, and intensity clamping.
2. **Provider Simulation & Privacy Invariants**: `DemoHairTryOnProvider` contract fidelity, zero disk persistence, absence of leaked server paths, in-memory audit log safety, and XML/SVG entity sanitization against XSS.
3. **UI State Machine Matrix**: State transitions (`EMPTY` -> `PHOTO_READY` -> `PROCESSING` -> `SUCCESS` / `ERROR`), Before/After comparison toggle/slider, and deep-link query parameter hydration.
4. **Try-On to Booking Transfer**: Frictionless query parameter propagation (`/try-on` -> `/booking`), style retention with color modification, and fault isolation.
5. **Standalone Challenge Harness Blueprint**: Fully executable `tests/challenge_m5_harness.ts` architecture with structured reporting and exit codes.

---

## 2. API Contract & Payload Boundary Matrix

The try-on API endpoint (`POST /api/try-on`) must satisfy strict contract specifications and resist adversarial boundary probes:

| Probe ID | Test Vector / Payload | Expected HTTP Status | Expected Response Body Criteria | Failure Impact / Vulnerability Mitigated |
|---|---|---|---|---|
| **API-01** | Valid PNG buffer (1x1 px or 150KB) + valid `hairstyleId` | `200 OK` | `resultImageBase64` starts with `data:image/`, `isMock === true`, `appliedStyleId` present | Happy path verification |
| **API-02** | Valid JPEG buffer + valid `hairstyleId` | `200 OK` | `mimeType === 'image/jpeg'` or `'image/svg+xml'`, `processingTimeMs > 0` | Format compatibility |
| **API-03** | Valid WebP buffer + valid `hairstyleId` | `200 OK` | Successful composite generation | Modern web format support |
| **API-04** | Empty Buffer (`0 bytes`) | `400 Bad Request` | Error message contains `không hợp lệ hoặc rỗng` | Prevents null dereference & empty simulation crashes |
| **API-05** | Exactly `5,242,880 bytes` (5.0 MB boundary inclusion) | `200 OK` | Accepted and processed | Validates boundary inclusiveness |
| **API-06** | `5,242,881 bytes` (5.0 MB + 1 byte) | `413 Payload Too Large` | Error contains `vượt quá giới hạn tối đa` | Strict boundary enforcement |
| **API-07** | `5,347,737 bytes` (5.1 MB buffer) | `413 Payload Too Large` | Rejection with HTTP 413 | DoS prevention from oversized uploads |
| **API-08** | `10,485,760 bytes` (10 MB buffer) | `413 Payload Too Large` | Rejection with HTTP 413 | Memory exhaustion defense |
| **API-09** | Unsupported MIME: `image/gif` | `400 Bad Request` | Error contains `Định dạng ảnh không được hỗ trợ` | Disallows animated or unsupported raster formats |
| **API-10** | Unsupported MIME: `application/pdf` | `400 Bad Request` | Error contains `Định dạng ảnh không được hỗ trợ` | Document injection prevention |
| **API-11** | Unsupported MIME: `text/plain` | `400 Bad Request` | Error contains `Định dạng ảnh không được hỗ trợ` | Non-image payload rejection |
| **API-12** | Unsupported MIME: `application/octet-stream` | `400 Bad Request` | Error contains `Định dạng ảnh không được hỗ trợ` | Generic binary rejection |
| **API-13** | Missing `hairstyleId` in payload | `400 Bad Request` | Error contains `chọn kiểu tóc` | Schema contract invariant |
| **API-14** | Empty string `hairstyleId: ""` | `400 Bad Request` | Error contains `chọn kiểu tóc` | Whitespace/empty ID guard |
| **API-15** | Missing image data entirely (no buffer, no base64) | `400 Bad Request` | Error indicates missing photo | Prevents unhandled server exception |
| **API-16** | Intensity < 0 (`intensity: -0.5`) | `200 OK` (Clamped) | Clamped to `0.0` (opacity 0%) in SVG output | Prevents negative opacity / SVG corruption |
| **API-17** | Intensity > 1 (`intensity: 1.5`) | `200 OK` (Clamped) | Clamped to `1.0` (opacity 35%) in SVG output | Prevents opacity blow-out / visual clipping |
| **API-18** | Intensity boundary `0.0` (0%) | `200 OK` | Valid composite, opacity = 0.00 | Lower boundary validity |
| **API-19** | Intensity boundary `1.0` (100%) | `200 OK` | Valid composite, opacity = 0.35 | Upper boundary validity |
| **API-20** | Intensity omitted / undefined | `200 OK` | Defaults to `0.85` (opacity 0.30) | Graceful default fallback |
| **API-21** | Dual Ingestion: JSON payload with `imageBase64` | `200 OK` | Buffer parsed from base64 correctly | Web client API interoperability |
| **API-22** | Dual Ingestion: JSON payload with `imageBuffer` | `200 OK` | Buffer ingested directly | Test client & internal service interoperability |
| **API-23** | Dual Ingestion: `multipart/form-data` with `FormData` | `200 OK` | File extracted via `formData.get('image')` | Native browser form submission support |

---

## 3. Provider Simulation & Biometric Privacy Verification

### 3.1. Provider Contract Schema Verification
The response from `/api/try-on` must strictly adhere to the `TryOnResponse` contract and E2E harness expectations:

```typescript
export interface TryOnResponse {
  resultImageBase64: string;   // Must start with "data:image/svg+xml;base64," or valid base64
  mimeType: string;            // 'image/svg+xml' or matching input
  isMock: boolean;             // Strictly true for DemoHairTryOnProvider
  provider: string;            // 'demo-tryon-provider'
  processingTimeMs: number;    // Strictly number > 0
  appliedStyleId: string;      // Mirrors input hairstyleId
  appliedColorId?: string;     // Mirrors input hairColorId (or null if omitted)
  notice?: string;             // Mandatory disclaimer message
  privacyValidated: boolean;   // Strictly true
}
```

### 3.2. Biometric Privacy Invariants (Zero Disk Persistence)
To protect user biometric privacy and comply with Requirement R2 & R4:
1. **Zero Disk Persistence**:
   - The route handler MUST NEVER invoke `fs.writeFile`, `fs.writeFileSync`, or write to `/tmp` or `public/uploads/`.
   - The test harness asserts that no new files are created in the filesystem before and after test execution.
2. **Leaked Path Prohibition**:
   - The JSON response MUST NEVER contain internal file paths.
   - Assert: `res.data.diskPath === undefined`, `res.data.serverFilePath === undefined`, `res.data.tempPath === undefined`.
3. **Audit Log Privacy**:
   - When recording simulation activity in `services/audit.ts` (`logAuditEvent`), the audit details MUST record only `{ hairstyleId, hairColorId, processingTimeMs, isMock: true, imageByteSize }`.
   - The audit log details MUST NEVER contain the raw base64 string or image buffer of the customer's face.

### 3.3. Adversarial Security: SVG XSS & Injection Sanitization
`DemoHairTryOnProvider` generates an SVG composite embedding user inputs (`hairstyleTitle`, `hairColorHex`). An attacker could attempt to inject malicious XML or script tags:
- Vector 1: `options.hairstyleTitle = '"><script xmlns="http://www.w3.org/1999/xhtml">alert(1)</script><text>'`
- Vector 2: `options.hairColorHex = '" onmouseover="alert(document.cookie)'`

**Verification Criterion**:
- The harness executes simulation with these adversarial vectors.
- Decodes `resultImageBase64` back to SVG string.
- Asserts that `<script>` tags are escaped to `&lt;script&gt;` and quote characters are escaped to `&quot;`.
- Asserts that the resulting SVG is strictly well-formed XML and does not contain unescaped executable directives.

### 3.4. Provider Pluggability (`getHairTryOnProvider`)
- Default mode: `process.env.TRYON_PROVIDER` unset -> returns `DemoHairTryOnProvider`.
- Explicit mode: `process.env.TRYON_PROVIDER = 'demo'` -> returns `DemoHairTryOnProvider`.
- Unknown fallback: `process.env.TRYON_PROVIDER = 'unknown-ai'` -> emits console warning, gracefully falls back to `DemoHairTryOnProvider`, no fatal crash.
- Reset mechanism: `resetHairTryOnProvider()` successfully invalidates singleton cache.

---

## 4. UI State Machine Matrix & Behavioral Matrix

The interactive Try-On UI (`app/(public)/try-on/page.tsx` & `components/public/TryOnClient.tsx`) operates as a Finite State Machine:

```
┌─────────┐   Upload Photo   ┌─────────────┐   Select Style/Color   ┌─────────────┐
│  EMPTY  │ ───────────────> │ PHOTO_READY │ ─────────────────────> │ CONFIGURING │
└─────────┘                  └─────────────┘                        └─────────────┘
     ▲                             │                                       │
     │ Reset Photo                 │ Change Photo                          │ Click "Mô phỏng"
     │                             ▼                                       ▼
┌─────────┐   Try Again      ┌─────────────┐   Success Response     ┌─────────────┐
│  ERROR  │ ◄─────────────── │   RESULT    │ ◄───────────────────── │ PROCESSING  │
└─────────┘   Server Error   └─────────────┘                        └─────────────┘
```

### 4.1. State Matrix Table

| State | Entry Conditions | Allowed User Actions | Disabled / Blocked Actions | Exit Transitions |
|---|---|---|---|---|
| **`EMPTY`** | Page load without image; or user clicks "Xóa ảnh" | File drop, file select, camera capture | Try-On action button disabled; style/color changes have no preview | On file selected -> `PHOTO_READY` |
| **`PHOTO_READY`** | Image buffer loaded & validated in browser memory (<5MB) | View original portrait; browse hairstyle catalog; select color | Simulation button disabled until `hairstyleId` selected | On style selected -> `CONFIGURING` |
| **`CONFIGURING`** | Photo loaded AND hairstyle selected | Adjust intensity slider (0-100%); change color; click "Mô Phỏng Phong Cách" | Cannot simulate if file > 5MB or invalid | On click simulate -> `PROCESSING` |
| **`PROCESSING`** | Simulation API request dispatched | View animated luxury salon aura; view status message steps; click "Hủy" | All inputs disabled (file upload, style selection, duplicate simulate click) | On 200 OK -> `SUCCESS`; on error -> `ERROR` |
| **`SUCCESS`** | Simulation response received with composite data URL | Drag Before/After slider; toggle Before/After; click "Đặt Lịch"; click "Tải Ảnh"; click "Thử Kiểu Khác" | Cannot simulate again without modifying options | "Đặt Lịch" -> redirect `/booking`; "Thử Kiểu Khác" -> `CONFIGURING` |
| **`ERROR`** | Network failure, timeout (>15s), 413, or 400 response | View localized error banner; click "Thử lại"; upload smaller photo | Result preview hidden | On "Thử lại" -> `CONFIGURING` or `EMPTY` |

### 4.2. Interactive Elements Verification
1. **Face Guideline Framing Overlay**: An oval target guide displayed over the portrait viewfinder in `EMPTY` state, instructing customers: *"Căn chỉnh khuôn mặt vào giữa khung hình chính diện để đạt hiệu quả mô phỏng tối ưu"*.
2. **Before/After Interactive Split Slider**:
   - Renders original user photo on the left ("Trước") and simulated result on the right ("Sau").
   - Draggable central handle modifies clipping rect from `0%` to `100%`.
   - Alternative 1-click toggle button ("Xem Ảnh Gốc" / "Xem Kết Quả").
3. **Deep-Link Query Param Hydration**:
   - `/try-on?hairstyleId=hs-korean-wolf-cut`:
     - Initializes with `selectedHairstyleId = 'hs-korean-wolf-cut'`.
     - Automatically filters or scrolls to corresponding style card.
   - `/try-on?hairColorId=col-ash-blonde`:
     - Initializes with `selectedHairColorId = 'col-ash-blonde'`.
   - `/try-on?hairstyleId=hs-classic-bob&hairColorId=col-chocolate-brown`:
     - Both hairstyle and color are pre-selected immediately upon loading.
   - Fault Tolerance: `/try-on?hairstyleId=unknown-slug-xyz`:
     - Gracefully falls back to unselected state without throwing runtime error or unhandled promise rejection.

---

## 5. Integration with Booking Flow (Try-On to Booking Transfer)

A critical business requirement is converting simulated looks directly into salon appointments.

### 5.1. Transfer Mechanism
On the simulation result view (`SUCCESS` state), the primary CTA is **"Đặt Lịch Với Kiểu Tóc Này"**:
1. When clicked, it builds the destination URL:
   ```
   /booking?hairstyleId=${selectedHairstyleId}&hairColorId=${selectedHairColorId}
   ```
   If no color was selected:
   ```
   /booking?hairstyleId=${selectedHairstyleId}
   ```
2. The user is redirected to `app/(public)/booking/page.tsx`.
3. `BookingWizardClient` initializes its internal state from `useSearchParams()`:
   - `selectedHairstyleId` is populated with `hairstyleId`.
   - `selectedHairColorId` is populated with `hairColorId`.
   - When the user reaches Step 2 ("Kiểu Tóc & Màu Sắc"), the selected hairstyle and color are already highlighted and active.

### 5.2. Style Retention with Color Modification
The customer has the flexibility to modify their choice in the booking wizard:
- Retains simulated hairstyle (`hs-classic-bob`).
- Changes color from bleached Ash Blonde (`col-ash-blonde`) to low-maintenance Chocolate Brown (`col-chocolate-brown`).
- Submission persists the adjusted combination cleanly to PostgreSQL (`/api/bookings`).

### 5.3. Fault Isolation & Independence
- If the Try-On API fails, times out, or the customer decides not to upload an image, navigation to `/booking` remains 100% operational.
- The booking system has zero hard dependency on `/api/try-on` execution.

---

## 6. Comprehensive Test Harness Blueprint (`tests/challenge_m5_harness.ts`)

Below is the complete architectural specification for `tests/challenge_m5_harness.ts`. It executes 6 comprehensive test suites containing over 35 distinct adversarial assertions.

### 6.1. Suite Structure
- **Suite 1: Try-On Provider Interface & Simulation Engine (`services/try-on/*`)**
  - Contract conformance (`DemoHairTryOnProvider`).
  - Realistic latency verification (`processingTimeMs >= 0`).
  - Intensity clamping (`<0`, `>1`, `NaN`, boundary `0.0` and `1.0`).
  - SVG XSS sanitization and XML escaping.
  - Factory provider resolution and fallback behavior.
- **Suite 2: Server API Route Contract & Boundaries (`POST /api/try-on`)**
  - Valid JPEG, PNG, and WebP simulation (HTTP 200).
  - Empty buffer 0 bytes rejection (HTTP 400).
  - 5.0 MB boundary inclusion (HTTP 200).
  - 5.000001 MB / 5.1 MB boundary rejection (HTTP 413 Payload Too Large).
  - 10 MB oversized payload rejection (HTTP 413).
  - Unsupported MIME rejections (`image/gif`, `application/pdf`, `text/plain`, `application/octet-stream`).
  - Missing `hairstyleId` parameter rejection (HTTP 400).
  - Empty string `hairstyleId` rejection (HTTP 400).
- **Suite 3: Dual Payload Ingestion Modes (JSON vs Multipart Form-Data)**
  - JSON with base64 string (`imageBase64`).
  - JSON with raw binary buffer (`imageBuffer`).
  - Multipart form upload simulation (`FormData` with `image` file, fields).
- **Suite 4: Biometric Privacy & Security Invariants**
  - Zero disk persistence: Working directory and tmp clean check.
  - Leak prevention: Response lacks `diskPath`, `serverFilePath`, `tempPath`.
  - In-memory audit logging: Audit entry created without storing customer biometric image buffer.
- **Suite 5: UI State Machine Matrix & Deep-Link Simulation**
  - State machine legal transition sequence: `EMPTY` -> `PHOTO_READY` -> `CONFIGURING` -> `PROCESSING` -> `SUCCESS`.
  - Illegal transition blocking (cannot process without photo or hairstyle).
  - Error state transition on failure.
  - URL query parameter consumption (`/try-on?hairstyleId=...&hairColorId=...`).
  - Resilient handling of malformed/unknown query parameters.
- **Suite 6: Try-On to Booking Flow Conversion**
  - URL generation from simulation output.
  - State transfer verification in `BookingWizardClient` contract.
  - Color modification while retaining simulated hairstyle.
  - Booking wizard resilience when Try-On fails.

### 6.2. Blueprint Implementation Code
The implementer will write this file as `tests/challenge_m5_harness.ts` so it can be executed standalone via:
```bash
npx tsx tests/challenge_m5_harness.ts
```

```typescript
/**
 * Milestone 5 Challenge Harness
 * Comprehensive Adversarial Stress & Quality Verification for AI Hair Try-On Subsystem
 *
 * Suites:
 * 1. Try-On Provider Interface & Simulation Engine (services/try-on/*)
 * 2. Server API Route Contract & Boundaries (POST /api/try-on)
 * 3. Dual Payload Ingestion Modes (JSON Base64 / Buffer vs Multipart)
 * 4. Biometric Privacy & Security Invariants (Zero Disk Write, Sanitization, Audit Safety)
 * 5. UI State Machine Matrix & Deep-Link Parameter Hydration
 * 6. Try-On to Online Booking Flow Conversion
 */

import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';
import { DemoHairTryOnProvider } from '../services/try-on/demo';
import { getHairTryOnProvider, resetHairTryOnProvider } from '../services/try-on';
import {
  VALID_IMAGE_BASE64_PNG,
  SAMPLE_IMAGE_BUFFER,
  BUFFER_5MB,
  BUFFER_OVERSIZED_5_1MB,
  EMPTY_BUFFER,
  getTomorrowDateString,
} from './fixtures/mock-data';
import { CreateBookingSchema } from '../lib/validations/booking';

// Try-On API Route Handler (imported once implemented)
// import { POST as tryOnRoute } from '../app/api/try-on/route';

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
    console.error(`  ✗ [FAIL] [${suite}] ${name}: ${message || 'Assertion failed'}`);
    if (details) console.error('    Details:', JSON.stringify(details));
  }
}

// Full harness execution logic detailed in tests/challenge_m5_harness.ts blueprint
```

---

## 7. Risk Analysis & Implementation Recommendations

1. **Next.js Body Size Limit**:
   - Next.js App Router defaults to a 4MB body size limit for Server Actions and standard route handlers.
   - **Recommendation**: To support the exact 5.0 MB boundary requirement, configure `export const config = { api: { bodyParser: { sizeLimit: '6mb' } } }` or adjust route segment options in `app/api/try-on/route.ts`:
     ```typescript
     export const dynamic = 'force-dynamic';
     export const maxDuration = 30; // 30 seconds max duration
     ```
2. **Memory Leaks during High-Concurrency Try-On**:
   - Because 5MB image buffers are parsed in memory, holding onto references will trigger V8 heap exhaustion under load.
   - **Recommendation**: Nullify buffer references (`buffer = null`) immediately after `provider.processTryOn` completes to permit rapid garbage collection.
3. **SVG Rendering Compatibility**:
   - `DemoHairTryOnProvider` embeds the user image inside an SVG `<image>` tag using data URI.
   - **Recommendation**: Ensure `resultImageBase64` is returned with full `data:image/svg+xml;base64,...` prefix so `<img>` elements in `TryOnClient.tsx` render without decoding errors.
4. **Deep-Link ID Consistency**:
   - Hairstyle detail pages use slugs (e.g. `/hairstyles/side-part-pompadour-hien-dai`) while Try-On and Booking use IDs (e.g. `hs-korean-wolf-cut` or `cly...`).
   - **Recommendation**: Ensure the try-on client matches by both `id` and `slug` when hydrating from `searchParams.get('hairstyleId')`.

---

## 8. Conclusion

Milestone 5 combines high visual engagement with sensitive customer data handling. The adversarial verification blueprint established here leaves zero room for ambiguity: every boundary limit, privacy invariant, UI state transition, and booking transfer link is formally probed and verified.
