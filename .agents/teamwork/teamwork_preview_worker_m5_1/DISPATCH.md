# Milestone 5 Implementation Dispatch: Interactive Hair Try-On Subsystem

**Agent**: M5 Implementation Worker (`teamwork_preview_worker_m5_1`)  
**Parent Orchestrator ID**: `daa96dc0-4b53-4192-88a0-f59f39a1f3f3`  
**Timestamp**: 2026-10-19T13:35:00Z  

---

## MANDATORY INTEGRITY WARNING
> DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

---

## 1. Mission Objectives
Implement the complete Milestone 5 subsystem for Lumière Hair Atelier:
1. Interactive Hair Try-On User Interface (`app/(public)/try-on/page.tsx`, `components/public/TryOnClient.tsx`) with Obsidian Noir & Champagne Gold luxury aesthetic, oval frontal face guide overlay, hairstyle & hair color selector trays, intensity slider, progressive simulation loader, before/after comparison toggle/slider, demo simulation disclaimer, and seamless transfer to the booking wizard.
2. In-Memory Privacy Proxy API (`app/api/try-on/route.ts`) and validation schema (`lib/validations/try-on.ts`) with dual ingestion (JSON base64 & multipart), strict 5.0 MB boundary handling (exact 5.0MB accepted with HTTP 200, >5.0MB rejected with HTTP 413), strict MIME allowlist (`image/jpeg`, `image/png`, `image/webp`), dangerous binary signature rejection, 15-second timeout protection, non-biometric audit logging, and zero disk persistence.
3. Standalone Challenge Harness (`tests/challenge_m5_harness.ts`) covering all 6 test suites designed by Explorer 3.

---

## 2. Authoritative Inputs & Blueprints
You MUST read and adhere strictly to these architecture blueprints:
1. `c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\ORIGINAL_REQUEST.md` (lines 22-28, Feature R2)
2. `c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\PROJECT.md` (Features 28-31, Milestone 5, Interface Contracts)
3. UI Blueprint: `c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_explorer_m5_1\analysis.md`
4. Backend API Blueprint: `c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_explorer_m5_2\analysis.md`
5. Verification Blueprint: `c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_explorer_m5_3\analysis.md`
6. Existing Try-On services:
   - `services/try-on/types.ts`
   - `services/try-on/demo.ts`
   - `services/try-on/index.ts`
7. Existing reusable components & data layers:
   - `components/public/BeforeAfterSlider.tsx`
   - `components/public/BookingWizardClient.tsx`
   - `lib/public-data.ts`
   - `services/audit.ts`

---

## 3. Files to Create & Exclusive Ownership
You have exclusive write ownership of these files:
- `lib/validations/try-on.ts`
- `app/api/try-on/route.ts`
- `components/public/TryOnClient.tsx`
- `app/(public)/try-on/page.tsx`
- `tests/challenge_m5_harness.ts`

*(Do NOT edit files owned by other milestones without justification).*

---

## 4. Key Implementation Requirements & Constraints

### A. Backend Route & Privacy Proxy (`app/api/try-on/route.ts`, `lib/validations/try-on.ts`)
1. **Dynamic Config**:
   ```typescript
   export const dynamic = 'force-dynamic';
   export const maxDuration = 30;
   ```
2. **Dual Payload Ingestion**:
   - JSON: `{ imageBase64: string, mimeType?: string, hairstyleId: string, hairColorId?: string, options?: { intensity?: number } }` or raw buffer payloads.
   - Multipart: `formData.get('image')` as File/Blob, along with `hairstyleId`, `hairColorId`, `intensity`.
3. **Strict Validation & Exact Rejection Messages**:
   - 0-byte or empty buffer: HTTP 400 with message containing `'không hợp lệ hoặc rỗng'`.
   - Missing `hairstyleId`: HTTP 400 with message containing `'chọn kiểu tóc'`.
   - Unsupported MIME (e.g. `image/gif`, `application/pdf`, `text/plain`): HTTP 400 with message containing `'Định dạng ảnh không được hỗ trợ'`.
   - Payload > 5.0 MB (`5 * 1024 * 1024` bytes): HTTP 413 with message containing `'vượt quá giới hạn tối đa'`.
   - Payload == exactly 5.0 MB: MUST be accepted and processed successfully with HTTP 200.
4. **Dangerous Signature Guard**:
   - Inspect leading bytes to reject GIF (`GIF87a`/`GIF89a`), PDF (`%PDF`), executable PE/ELF (`MZ` / `\x7fELF`), script tags (`<script`, `<html`).
   - Do NOT reject arbitrary byte buffers that declare valid MIME (`image/jpeg`, `image/png`, `image/webp`) so synthetic test buffers (like `BUFFER_5MB`) succeed.
5. **Zero Disk Persistence Invariant**:
   - Customer photos must NEVER touch disk (`/tmp`, `public/uploads/`, local filesystem).
   - Process purely in Node.js RAM `Buffer`. In a `finally` block, explicitly set `buffer = null` to allow immediate V8 garbage collection.
   - Response MUST NOT contain `diskPath` or `serverFilePath` (must be `undefined`).
   - Response MUST include `privacyValidated: true`.
6. **Provider Integration & Response Schema**:
   - Call `const provider = getHairTryOnProvider(); const result = await provider.processTryOn(...)`.
   - Response on HTTP 200 must include:
     ```json
     {
       "success": true,
       "resultImageBase64": "data:image/svg+xml;base64,...",
       "mimeType": "image/webp", // or requested MIME
       "isMock": true,
       "provider": "demo-tryon-provider",
       "processingTimeMs": 1520,
       "appliedStyleId": "...",
       "appliedColorId": "...",
       "privacyValidated": true,
       "notice": "..."
     }
     ```
7. **Timeout Protection**:
   - Guard execution with a 15-second timeout (`Promise.race` with AbortController).
8. **Audit Logging**:
   - Call `logAuditEvent` with `action: 'CREATE'`, `entity: 'TryOnSimulation'`. Do NOT include raw image buffer or result base64 in `details`.

### B. Client UI Experience (`components/public/TryOnClient.tsx`, `app/(public)/try-on/page.tsx`)
1. **Suspense Boundary**:
   - Because `TryOnClient` consumes `useSearchParams()` for deep-link pre-selection (`hairstyleId`, `hairColorId`, `styleId`, `colorId`), `app/(public)/try-on/page.tsx` MUST wrap `TryOnClient` inside a `<Suspense>` boundary to prevent build prerender bailouts.
2. **Design Language**:
   - Luxury Obsidian Noir (`#0B0F17`) & Champagne Gold (`#D4AF37`) palette.
   - Glassmorphism card surfaces with subtle gold borders.
3. **Upload Zone & Face Guideline**:
   - Drag-and-drop, file picker, and camera capture fallback.
   - Frontal portrait oval guideline overlay (SVG/CSS silhouette with eye-line, nose bridge, chin marker) to help visitors frame their face properly.
4. **Selector Trays**:
   - Hairstyle tray with category pills, search bar, card preview.
   - Hair Color tray with tone filter tabs (Warm, Cool, Neutral, Bleach), hex swatch chips.
   - Intensity slider (0% to 100%, step 5%, default 85%).
5. **State Transitions & Progressive Loader**:
   - States: `EMPTY` -> `PHOTO_READY` -> `PROCESSING` -> `SUCCESS` / `ERROR`.
   - During `PROCESSING`: Luxury 4-phase step animation ("Phân tích khuôn mặt" -> "Tạo kiểu tóc" -> "Phủ sắc độ màu" -> "Hoàn thiện độ bóng").
6. **Result View & Comparison**:
   - Render `BeforeAfterSlider` comparing original portrait with composite simulation.
   - Prominent `DEMO SIMULATION` luxury badge and mandatory disclaimer:
     *"Hình ảnh mang tính chất tham khảo phong cách. Chuyên viên stylist sẽ trực tiếp tư vấn sắc độ và kết cấu tóc thực tế trước khi thực hiện."*
7. **Conversion CTAs**:
   - Primary: "Đặt Lịch Với Kiểu Tóc Này" button linking to `/booking?hairstyleId=${selectedHairstyleId}&hairColorId=${selectedHairColorId}`.
   - Secondary: "Tải Ảnh Về Máy", "Thử Kiểu Khác", "Đặt Lại".

### C. Challenge Harness (`tests/challenge_m5_harness.ts`)
Implement the 6 test suites detailed in Explorer 3's analysis:
- Suite 1: Provider Interface & `DemoHairTryOnProvider` simulation
- Suite 2: API Route Contract & Boundaries (`POST /api/try-on`)
- Suite 3: Dual Ingestion (JSON & Multipart)
- Suite 4: Biometric Privacy & Zero Disk Persistence
- Suite 5: UI State Machine & Query Hydration
- Suite 6: Try-On to Booking Flow Conversion

---

## 5. Required Verification Commands
Before completing your handoff, you MUST run and verify that all of the following commands pass cleanly:
1. `npx prisma validate`
2. `npx tsc --noEmit` (0 errors)
3. `npm run build` (Clean production build compiling all routes)
4. `npm run test:e2e` (67/67 tests passing)
5. `npx tsx tests/challenge_m5_harness.ts` (All assertions passing)

Deliver `handoff.md` in your working directory and notify the parent orchestrator via `send_message`.


## 2026-10-19T13:36:13Z
[Message] timestamp=2026-10-19T13:36:13Z sender=daa96dc0-4b53-4192-88a0-f59f39a1f3f3 priority=MESSAGE_PRIORITY_HIGH content=You are the M5 Implementation Worker (Interactive Hair Try-On Subsystem).
Working Directory: c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_worker_m5_1
Parent Orchestrator ID: daa96dc0-4b53-4192-88a0-f59f39a1f3f3

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

MANDATORY INPUTS TO READ:
1. c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\ORIGINAL_REQUEST.md
2. c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\PROJECT.md
3. c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_worker_m5_1\DISPATCH.md
4. Explorer 1 Blueprint (UI): c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_explorer_m5_1\analysis.md
5. Explorer 2 Blueprint (API & Proxy): c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_explorer_m5_2\analysis.md
6. Explorer 3 Blueprint (Verification): c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_explorer_m5_3\analysis.md
