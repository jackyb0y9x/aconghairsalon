# Milestone 3 Remediation Worker Dispatch: Concurrency Idempotency Fix

## Identity & Objective
- Role: M3 Remediation Worker
- Working Directory: c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_worker_m3_2
- Parent Orchestrator ID: daa96dc0-4b53-4192-88a0-f59f39a1f3f3

## MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Mandatory Inputs to Read:
1. `c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\ORIGINAL_REQUEST.md`
2. `c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\PROJECT.md`
3. Challenger 2 Handoff: `c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_challenger_m3_2\handoff.md`
4. Code files to inspect:
   - `lib/memory-store.ts`
   - `app/api/bookings/route.ts`
   - `tests/adversarial_m3_bookings.test.ts`

## Specific Remediation Tasks:
1. **Update `lib/memory-store.ts` (`createBooking`)**:
   Add a check for `data.idempotencyKey`. If an existing record with that `idempotencyKey` is found (via `this.findBookingByIdempotency(data.idempotencyKey)`), return the existing record immediately instead of pushing a duplicate into `this.bookings`.
2. **Add In-Flight Deduplication in `app/api/bookings/route.ts`**:
   Implement an in-flight promise map `const inFlightIdempotencyMap = new Map<string, Promise<NextResponse>>();` at module level.
   When `input.idempotencyKey` is present:
   - If `inFlightIdempotencyMap.has(input.idempotencyKey)`, await the existing in-flight promise and return a clone of its response.
   - Otherwise, wrap the creation process in a promise, store it in `inFlightIdempotencyMap.set(input.idempotencyKey, promise)`, and ensure it is cleaned up in a `finally` block `inFlightIdempotencyMap.delete(input.idempotencyKey)`.
3. **Verify with Full Test Suites**:
   - `npx prisma validate`
   - `npx tsc --noEmit`
   - `npm run build`
   - `npm run test:e2e`
   - `npx tsx tests/challenge_m3_harness.ts`
   - `npx tsx tests/adversarial_m3_bookings.test.ts` (MUST pass 87/87 probes, 100% success)

Deliver your completed remediation in `handoff.md` and notify the parent orchestrator via `send_message`.


## 2026-10-19T06:19:50Z
Received dispatch message:
You are M3 Remediation Worker.
Working Directory: c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_worker_m3_2
Parent Orchestrator ID: daa96dc0-4b53-4192-88a0-f59f39a1f3f3
Remediate the high-concurrency idempotency race condition:
1. In lib/memory-store.ts createBooking: Check data.idempotencyKey first and return existing record if found.
2. In app/api/bookings/route.ts: Implement module-level in-flight promise deduplication map for idempotencyKey.
3. Verification commands:
   - npx prisma validate
   - npx tsc --noEmit
   - npm run build
   - npm run test:e2e
   - npx tsx tests/challenge_m3_harness.ts
   - npx tsx tests/adversarial_m3_bookings.test.ts (must pass 87/87)
