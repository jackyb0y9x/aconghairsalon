# Milestone 3 Challenger 2 Adversarial Report: Booking Operations & Lifecycle

**Verdict**: `CHALLENGE_DETECTED`

---

## 1. Observation

### 1.1 Empirical Test Suite Executions
- **Worker Challenger Harness**: Executed `npx tsx tests/challenge_m3_harness.ts`
  - Output: 72 assertions, 72 passed, 0 failed (100% pass rate, exit code 0).
- **Full E2E Regression Suite**: Executed `npm run test:e2e`
  - Output: 15 suites, 67 tests, 67 passed, 0 failed (100% pass rate, exit code 0).
- **Independent Adversarial Probe Suite**: Executed `npx tsx tests/adversarial_m3_bookings.test.ts`
  - Output: 87 probes executed across 6 categories.
  - Passed: 85 probes.
  - Failed: 2 probes (Exit code 1).

### 1.2 Verbatim Probe Failure Output
```
================================================================================
             ADVERSARIAL CHALLENGER PROBES SUMMARY (M3)                         
================================================================================
  Total Probes:  87
  Passed:        85
  Failed:        2

❌ ADVERSARIAL CHALLENGES DETECTED:
  - [Idempotency] High-concurrency: All 10 responses return the exact same booking record: Returned IDs: bk-1792390440334-wmhsl,bk-1792390440334-h4bu6,bk-1792390440334-0hudi,bk-1792390440334-8fcrx,bk-1792390440335-u0q2q,bk-1792390440335-c5udj,bk-1792390440335-l1qme,bk-1792390440335-8gc20,bk-1792390440335-1tt8z,bk-1792390440335-jieqh
  - [Idempotency] High-concurrency: Exactly 1 record created in persistence store (count=10): Found 10 records in store
```

### 1.3 Code Inspection Findings
1. In `app/api/bookings/route.ts` (lines 52–71):
   ```typescript
   // 1. Anti-duplicate submission check (Idempotency Lock)
   if (input.idempotencyKey) {
     let existing: any = null;
     try {
       existing = await prisma.booking.findUnique({
         where: { idempotencyKey: input.idempotencyKey },
         include: { ... },
       });
     } catch {
       existing = memoryStore.findBookingByIdempotency(input.idempotencyKey);
     }
     if (existing) {
       return NextResponse.json(serializeBooking(existing), { status: 200 });
     }
   }
   ```
2. In `lib/memory-store.ts` (lines 330–339):
   ```typescript
   createBooking(data: any) {
     const booking = {
       id: generateId('bk'),
       ...data,
       createdAt: new Date(),
       updatedAt: new Date(),
     };
     this.bookings.push(booking);
     return booking;
   }
   ```
   `createBooking` has no deduplication check on `data.idempotencyKey` and blindly pushes each request into `this.bookings`.
3. In `app/api/bookings/route.ts`:
   There is no in-flight promise deduplication map or mutex lock (e.g. `Map<string, Promise<any>>`). When multiple requests arrive concurrently in Node.js event loop, all of them execute the async lookup `await prisma.booking.findUnique` simultaneously. Before any request completes creation, all 10 requests evaluate `existing === null`, pass the lock check, and generate 10 distinct booking records.

---

## 2. Logic Chain

1. **Robust State Machine & RBAC Gates (Verified Robust)**:
   - The 5-state finite state machine in `lib/booking-state-machine.ts` correctly enforced all valid and invalid transitions across the entire 5x5 matrix (25/25 verified).
   - Illegal state jumps (`PENDING` -> `COMPLETED`, `PENDING` -> `NO_SHOW`, `CANCELLED` -> `CONFIRMED`, `COMPLETED` -> `PENDING`, `NO_SHOW` -> `CONFIRMED`, `COMPLETED` -> `CANCELLED`) were all rejected with HTTP 400.
   - Terminal states (`COMPLETED`, `CANCELLED`, `NO_SHOW`) strictly rejected transitions to any other state.
   - Cancellation reason enforcement was verified with zero tolerance for whitespace, empty strings, tabs, newlines, or <5 characters. Aliased fields (`cancelReason` and `cancellationReason`) both functioned correctly.
   - RBAC privilege escalation attempts by `CONTENT_ADMIN` and `EDITOR` against booking mutations and reads were strictly blocked with HTTP 403.
2. **Concurrency Race Condition in Idempotency Submissions**:
   - Sequential duplicate submissions with the same `idempotencyKey` succeed because the first request completes and stores the booking before the second request arrives.
   - However, under real-world burst concurrency (e.g. rapid double clicks, network retries, or concurrent microservice calls fired via `Promise.all`), all requests yield at the first `await` (lines 55 and 85 of `app/api/bookings/route.ts`).
   - In environments where PostgreSQL is offline or experiencing latency, `memoryStore.findBookingByIdempotency(input.idempotencyKey)` is queried by all competing requests before any has inserted.
   - None of the requests find an existing booking. All 10 requests proceed to insert.
   - Because `memoryStore.createBooking` does not check for existing `idempotencyKey`, 10 distinct booking records (`bk-1792390440334-wmhsl`, `bk-1792390440334-h4bu6`, ...) were pushed to the store, and 10 distinct booking IDs were returned to the clients.
   - Even when PostgreSQL is connected, relying solely on DB unique constraint rollback without an in-flight async lock exposes the endpoint to unnecessary connection pool saturation and uncoordinated retries.
3. **Conclusion**:
   - The idempotency lock mechanism fails under high concurrency in the current fallback and async flow, violating the non-duplicate booking guarantee (R1, R4).

---

## 3. Caveats

- In a live PostgreSQL environment with table constraints active, Prisma would throw error `P2002` (Unique constraint failed on `idempotencyKey`), which triggers the `catch` block in `app/api/bookings/route.ts` (lines 237–259). However:
  1. The fallback `memoryStore` (used in test runners, CI, and serverless edge contexts) completely breaks idempotency, creating duplicate database entries.
  2. The `catch` block in `route.ts` tries to re-read the body with `request.clone().json()`, which can fail if the body stream is locked or consumed, and still falls back to `memoryStore.findBookingByIdempotency`.
  3. No in-flight promise lock exists at the application layer.

---

## 4. Conclusion & Recommended Remediation

**Verdict**: `CHALLENGE_DETECTED`

### Root Cause
1. Missing duplicate check in `lib/memory-store.ts` `createBooking`.
2. Missing in-flight deduplication / async mutex in `app/api/bookings/route.ts`.

### Recommended Fix (For Worker Remediation)
1. **Update `lib/memory-store.ts` (`createBooking`)**:
   ```typescript
   createBooking(data: any) {
     if (data.idempotencyKey) {
       const existing = this.findBookingByIdempotency(data.idempotencyKey);
       if (existing) {
         return existing;
       }
     }
     const booking = {
       id: generateId('bk'),
       ...data,
       createdAt: new Date(),
       updatedAt: new Date(),
     };
     this.bookings.push(booking);
     return booking;
   }
   ```
2. **Add in-flight promise deduplication in `app/api/bookings/route.ts`**:
   ```typescript
   const inFlightIdempotencyMap = new Map<string, Promise<NextResponse>>();
   ```
   If `input.idempotencyKey` is present and an in-flight promise exists, return or await the in-flight promise instead of launching a redundant database pipeline.

---

## 5. Verification Method

To independently verify this finding:
1. Run the empirical adversarial harness:
   ```bash
   npx tsx tests/adversarial_m3_bookings.test.ts
   ```
   **Expected Outcome before fix**: Exit code 1 with:
   `❌ ADVERSARIAL CHALLENGES DETECTED: [Idempotency] High-concurrency: All 10 responses return the exact same booking record`
   `Found 10 records in store`.

2. Inspect the failure location in `tests/adversarial_m3_bookings.test.ts` (lines 268–315).
3. Once the Worker implements the deduplication check in `memoryStore.createBooking` and route handler, re-running `npx tsx tests/adversarial_m3_bookings.test.ts` will pass with 87/87 probes (100% success rate).
