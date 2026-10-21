# Handoff Report: Booking & Appointment Operations Blueprint (Milestone 3)

**Agent Role**: M3 Explorer 3 (Booking & Appointment Operations Specialist)  
**Parent Orchestrator ID**: `daa96dc0-4b53-4192-88a0-f59f39a1f3f3`  
**Working Directory**: `c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_explorer_m3_3`  
**Deliverable Document**: `analysis.md` (Detailed Implementation Blueprint)  
**Handoff Type**: Hard Handoff (Investigation & Architecture Design Complete)

---

## 1. Observation

1. **Prisma Relational Schema & Models**:
   - In `prisma/schema.prisma` lines 372-423, the `BookingStatus` enum is defined with 5 states:
     ```prisma
     enum BookingStatus {
       PENDING      // Chờ xác nhận
       CONFIRMED    // Đã xác nhận lịch
       COMPLETED    // Đã hoàn thành dịch vụ
       CANCELLED    // Đã hủy lịch
       NO_SHOW      // Khách không đến
     }
     ```
   - In `prisma/schema.prisma` lines 380-423, the `Booking` model contains fields: `id` (uuid), `bookingCode` (@unique), `customerName`, `customerPhone`, `customerEmail`, `bookingDate` (@db.Date), `timeSlot`, `serviceId`, `comboId`, `hairstyleRefId`, `hairColorRefId`, `assignedStylistId`, `status` (@default(PENDING)), `notes` (@db.Text), `internalNotes` (@db.Text), `estimatedPrice`, `cancellationReason`, and `idempotencyKey` (@unique).
   - In `prisma/schema.prisma` lines 39-72, stylists are represented by the `User` model with `isStylist: true`, `bio`, `experienceYears`, and `specialties: String[]`.
   - In `prisma/schema.prisma` lines 518-549, the `AuditLog` model tracks `action` (`AuditAction`), `entityType`, `entityId`, and `details` (Json).

2. **Existing RBAC Guards & Permissions**:
   - In `lib/auth.ts` lines 269 & 348-356, route permissions for booking operations are restricted to `SUPER_ADMIN` and `BOOKING_STAFF`:
     ```typescript
     // Quản lý Lịch hẹn: SUPER_ADMIN và BOOKING_STAFF
     if (pathname.startsWith('/api/admin/bookings')) {
       if (role !== 'BOOKING_STAFF') {
         return {
           allowed: false,
           error: `Forbidden: Role ${role} cannot manage bookings`,
         };
       }
     }
     ```
   - In `lib/auth.ts` lines 322-324, `SUPER_ADMIN` is automatically granted full access (`{ allowed: true }`).
   - In `lib/auth.ts` lines 391-427, `authenticateAdminRequest` verifies session cookies or Authorization Bearer tokens and applies `checkApiRbacPermission`.

3. **Existing Validations & Discrepancies**:
   - In `lib/validations/booking.ts` lines 120-136, `UpdateBookingStatusSchema` currently checks:
     `status: z.enum(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'])`, `assignedStylistId`, `internalNotes`, `cancelReason`, `cancellationReason`.
   - In `tests/e2e/tier1-features/booking.test.ts` lines 72-76, the PUT payload sends `stylistId` and `notes`:
     ```typescript
     const confirmRes = await ctx.client.put(`/api/admin/bookings/${bookingId}/status`, {
       status: 'CONFIRMED',
       stylistId: 'sty-master-tran',
       notes: 'Đã gọi điện xác nhận lịch với khách lúc 09:15'
     });
     ```
   - Furthermore, lines 78-79 and 107 assert:
     `expect(confirmRes.data.stylistId).toBe('sty-master-tran');`
     `expect(cancelRes.data.internalNotes).toContain('Khách bận');`
   - In `tests/e2e/tier4-scenarios/customer-booking-journey.test.ts` line 57, the bookingCode format is strictly verified:
     `expect(bookingRes.data.bookingCode).toMatch(/^BK\d{6}$/);`
   - In `tests/e2e/tier2-boundaries/content-boundaries.test.ts` lines 53-54, invalid status strings must return HTTP 400 and contain `'Invalid status'`:
     `expect(badStatusRes.status).toBe(400);`
     `expect(badStatusRes.data.error).toContain('Invalid status');`

4. **Missing Production Routes**:
   - Directory search revealed that neither `app/admin/bookings` nor `app/api/admin/bookings` nor `app/api/bookings` currently exist on the filesystem.
   - The test suite passed in `TEST_READY.md` because `node tests/run-e2e.ts` was evaluated in Contract Simulator mode (`tests/harness/contract-simulator.ts` lines 304-321).
   - Milestone 3 requires implementing the actual Next.js production routes and UI components.

5. **Audit Logging Integration**:
   - In `services/audit.ts` lines 51-73, `logAuditEvent` provides a fail-safe async function recording events to `prisma.auditLog`.
   - On the Admin Dashboard (`app/admin/page.tsx` lines 65-73), `pendingBookingsCount` queries `prisma.booking.count({ where: { status: 'PENDING' } })` to render live pending booking alert banners.

---

## 2. Logic Chain

1. **State Machine Integrity**:
   - Based on Observation 1 and 3, a booking transitions through 5 defined states. Because `COMPLETED`, `CANCELLED`, and `NO_SHOW` represent terminal lifecycle stages, allowing transitions out of them would corrupt business accounting and salon staff scheduling.
   - Therefore, a dedicated `lib/booking-state-machine.ts` module with `ALLOWED_TRANSITIONS` must guard all updates:
     - `PENDING` $\to$ `CONFIRMED`, `CANCELLED`
     - `CONFIRMED` $\to$ `COMPLETED`, `CANCELLED`, `NO_SHOW`
     - Direct jump from `PENDING` to `COMPLETED` or `NO_SHOW` must return HTTP 400 Bad Request.
   - Transition to `CANCELLED` must strictly enforce a non-empty `cancellationReason` (min 5 characters) to capture customer churn reasons.

2. **Schema & Field Harmonization**:
   - Observation 3 showed that test suites submit `{ stylistId, notes, cancelReason }` while Prisma models use `{ assignedStylistId, internalNotes, cancellationReason }`.
   - Therefore, `UpdateBookingStatusSchema` in `lib/validations/booking.ts` must be extended with `.transform()` to map both sets of keys interchangeably.
   - All API response serializers must provide both alias fields (`stylistId` and `assignedStylistId`, `notes` and `internalNotes`, `hairstyleId` and `hairstyleRefId`, `hairColorId` and `hairColorRefId`). This guarantees 100% test compatibility while preserving clean Prisma relations.

3. **API Contracts & Compatibility**:
   - In `tests/e2e/tier3-combinations/booking-style-color.test.ts` lines 47-48 and `tier4-scenarios/customer-booking-journey.test.ts` line 71, `ctx.client.get('/api/admin/bookings')` expects `res.data` to be an array with `.find()`.
   - Meanwhile, administrative data tables require pagination metadata (`total`, `page`, `pageSize`, `totalPages`).
   - Therefore, `GET /api/admin/bookings` must return a JSON array by default accompanied by pagination HTTP response headers (`X-Total-Count`, `X-Page`, `X-Page-Size`, `X-Total-Pages`, `X-Pending-Count`), and support `?format=paginated` when structured JSON envelopes are requested.
   - Status updates in E2E tests are issued via `PUT /api/admin/bookings/[id]/status` while modern REST conventions also use `PATCH`. Therefore, the route handler must export both `PUT` and `PATCH`.

4. **Booking Code Generation Compliance**:
   - Observation 3 showed that `customer-booking-journey.test.ts` asserts `expect(bookingRes.data.bookingCode).toMatch(/^BK\d{6}$/)`.
   - Therefore, `POST /api/bookings` must generate codes matching `BK` followed by 6 numeric digits (e.g., `BK123456`), rather than custom hyphenated alphanumeric strings, with database collision retry logic.

5. **Security & Audit Traceability**:
   - Observation 2 established that only `SUPER_ADMIN` and `BOOKING_STAFF` have permission to manage bookings. By invoking `authenticateAdminRequest` at the entry of every `/api/admin/bookings/*` route handler, unauthorized attempts by `CONTENT_ADMIN` or `EDITOR` will immediately fail with HTTP 403, and unauthenticated requests with HTTP 401.
   - Every mutation must invoke `logAuditEvent` in `services/audit.ts` with `action: 'STATUS_CHANGE'`, `entity: 'Booking'`, and before/after transition details.

---

## 3. Caveats

1. **Live Database vs Simulator**:
   The existing E2E test suite defaults to Contract Simulator mode unless `TEST_BASE_URL` is set. When running against live Next.js routes, database seed data (`prisma/seed.ts`) must have run so that stylists like `sty-master-tran` (or mapped user IDs) and services like `srv-layer-cut-vip` exist in PostgreSQL.
2. **Double Cancellation Rationale**:
   If a booking is already `CANCELLED`, resubmitting a cancellation with a different reason is treated as an illegal state transition from a terminal state (HTTP 400), not an in-place reason edit. Reason editing after cancellation must be performed via internal notes if needed.
3. **SMS / Email Notifications**:
   External SMS gateway integration (e.g., SpeedSMS, Twilio) for booking confirmation and customer reminder was not part of Milestone 3's internal scope and can be added via webhooks or background workers in future milestones.

---

## 4. Conclusion

A comprehensive, production-ready implementation blueprint for the 5-state Appointment Management system has been designed and documented in `analysis.md`. The design completely resolves:
1. The 5-state transition lifecycle engine (`PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED`, `NO_SHOW`) with strict terminal state guarantees and mandatory cancellation reasons.
2. The full suite of Admin Booking APIs (`/api/admin/bookings`, `/api/admin/bookings/[id]`, `/api/admin/bookings/[id]/status` supporting `PUT`/`PATCH`, `/api/admin/bookings/[id]/assign`, `/api/admin/bookings/[id]/notes`, `/api/admin/stylists`, and `/api/bookings`).
3. An administrative UI (`/admin/bookings`) featuring status count badges, date range & stylist filters, responsive tables, CSV export with UTF-8 BOM, and an interactive slide-over drawer modal (`BookingDetailModal.tsx`) with customer card, service/style preview, quick stylist assignment, internal notes, dynamic action buttons, and audit trail timeline.
4. Seamless integration with `services/audit.ts` and live Dashboard KPI synchronization.

---

## 5. Verification Method

1. **Type Checking & Prisma Validation**:
   ```bash
   npx prisma validate
   npx prisma generate
   npx tsc --noEmit
   ```
   *Expected result*: 0 type errors, clean compilation in strict mode.

2. **Run Booking-Specific E2E Tests**:
   ```bash
   node tests/run-e2e.ts --grep="booking"
   ```
   *Expected result*: 100% passing across:
   - `TC1.18`: Minimum Booking Creation
   - `TC1.19`: Full Detail Booking Creation
   - `TC1.20`: Anti-Duplicate Idempotency
   - `TC1.21`: Booking Lifecycle Progression (`PENDING` $\to$ `CONFIRMED` $\to$ `COMPLETED`)
   - `TC1.22`: Booking Cancellation Flow
   - `TC2.1 - TC2.6`: Name, Notes, Phone Regex, Date, and Operating Hours Boundaries
   - `TC2.14`: RBAC Appointment Mutation Isolation (CONTENT_ADMIN denied)
   - `TC2.19`: Booking Status State Machine Guard (Invalid status rejected with 400)
   - `TC3.1`: Pairwise Booking + Style + Color
   - `TC3.2`: Bleach Requirement Interaction
   - `TC3.3`: Partial Combinations Matrix
   - `TC3.7`: Try-On to Booking Conversion
   - `TC4.1`: Full Customer Booking Journey (matching `/^BK\d{6}$/`)
   - `TC4.2`: Reschedule Workflow
   - `TC4.3`: Concurrent Submission Lock
   - `TC4.11`: IDOR & Privilege Escalation Defense

3. **Verify All 67 E2E Tests**:
   ```bash
   node tests/run-e2e.ts
   ```
   *Expected result*: 67/67 tests passing.

4. **File Inspection**:
   - Inspect `analysis.md` in `c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_explorer_m3_3\analysis.md` for complete code listings, types, and architectural schematics.
