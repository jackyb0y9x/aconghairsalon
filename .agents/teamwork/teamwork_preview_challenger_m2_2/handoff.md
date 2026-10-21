# Challenger 2 Handoff Report: Milestone 2 — Adversarial Stress & Empirical Verification

- **Agent:** M2 Challenger 2 (`teamwork_preview_challenger_m2_2`)
- **Roles:** Critic, Specialist (Empirical Challenger)
- **Working Directory:** `c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_challenger_m2_2`
- **Parent Orchestrator ID:** `daa96dc0-4b53-4192-88a0-f59f39a1f3f3`
- **Milestone:** M2 — Auth, RBAC & Admin Core
- **Completion Date:** 2026-10-19T03:45:00Z
- **Verdict:** `CHALLENGE_DETECTED`

---

## 1. Observation

### 1.1 Baseline Verification Commands & Results
The standard verification pipeline was executed directly on the repository:
1. `npx prisma validate`:
   ```
   Environment variables loaded from .env
   Prisma schema loaded from prisma\schema.prisma
   The schema at prisma\schema.prisma is valid 🚀
   Exit code: 0
   ```
2. `npx tsc --noEmit`:
   ```
   Exit code: 0 (0 errors)
   ```
3. `npm run build`:
   ```
   ▲ Next.js 14.2.15
   Creating an optimized production build ...
   ✓ Compiled successfully
   Linting and checking validity of types ...
   Collecting page data ...
   ✓ Generating static pages (10/10)
   Finalizing page optimization ...
   Route (app)                              Size     First Load JS
   ┌ ○ /                                    176 B          94.1 kB
   ├ ○ /_not-found                          873 B            88 kB
   ├ ƒ /admin                               176 B          94.1 kB
   ├ ƒ /admin/audit-logs                    6.22 kB        93.3 kB
   ├ ƒ /admin/login                         3.2 kB          123 kB
   ├ ƒ /admin/settings                      5.06 kB         118 kB
   ├ ƒ /api/admin/audit-logs                0 B                0 B
   ├ ƒ /api/admin/dashboard                 0 B                0 B
   ├ ƒ /api/admin/settings                  0 B                0 B
   ├ ƒ /api/auth/login                      0 B                0 B
   ├ ƒ /api/auth/logout                     0 B                0 B
   └ ƒ /api/auth/session                    0 B                0 B
   ƒ Middleware                             26.6 kB
   Exit code: 0
   ```
4. `npm run test:e2e`:
   ```
   Execution Mode: SIMULATION
   Total Suites:   15
   Total Tests:    67
   Passed Tests:   67
   Failed Tests:   0
   Exit code: 0
   ```

### 1.2 Empirical Stress Harness Execution (`tests/challenge_m2_harness.ts`)
To move beyond the in-memory simulation runner, a live empirical stress harness was authored at `tests/challenge_m2_harness.ts` executing 79 rigorous adversarial checks directly against the Next.js App Router route handlers (`app/api/admin/dashboard`, `app/api/admin/settings`, `app/api/admin/audit-logs`, `app/api/auth/*`), middleware, and services.

Command executed:
```bash
npx tsx tests/challenge_m2_harness.ts
```

Output:
```
================================================================================
                         M2 STRESS SUITE SUMMARY                                
================================================================================
  Total Checks:  79
  Passed Checks: 77
  Failed Checks: 2

❌ FAILED CHECKS:
  - [Settings] Pre-existing facebook social link preserved: Facebook: undefined
  - [AuditLogs] services/audit.ts:getAuditLogs() uncaught DB exception: getAuditLogs() threw uncaught PrismaClientInitializationError
```

### 1.3 Verbatim Defect Observations

#### Defect 1: Site Settings Partial Updates Reset Nested Fields to Empty on Unseeded / Fallback Records (Violation of TC2.20 Contract)
- **File**: `app/api/admin/settings/route.ts`, lines 148–165:
  ```typescript
  148: if (!current) {
  149:   current = {
  150:     id: 'default_setting',
  151:     brandName: 'Lumière Hair Atelier',
  152:     brandSlogan: 'Định Hình Khí Chất - Tỏa Sáng Phong Cách',
  153:     hotlinePrimary: '0908123456',
  154:     emailContact: 'contact@lumierehair.vn',
  155:     addressFull: '128 Pasteur, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
  156:     openingHours: {
  157:       monday_friday: '08:30 - 21:00',
  158:       weekend: '08:00 - 21:30',
  159:       rawText: '08:30 - 20:30 Hàng ngày',
  160:     },
  161:     socialLinks: {},
  162:     defaultSeoMetadata: {},
  163:     footerContent: {},
  164:   };
  165: }
  ```
- **File**: `app/api/admin/settings/route.ts`, lines 204–209:
  ```typescript
  204: const mergedSocial = { ...currentSocial, ...(input.socialLinks || {}) };
  205: if (input.socialFacebook !== undefined) mergedSocial.facebook = input.socialFacebook;
  206: if (input.socialInstagram !== undefined) mergedSocial.instagram = input.socialInstagram;
  207: if (input.socialTikTok !== undefined) mergedSocial.tiktok = input.socialTikTok;
  208: if (input.socialZalo !== undefined) mergedSocial.zalo = input.socialZalo;
  209: if (Object.keys(mergedSocial).length > 0) updateData.socialLinks = mergedSocial;
  ```
- **Discrepancy with `GET /api/admin/settings`** (lines 59–76 and 94–106):
  In `GET`, unseeded or fallback records are populated with full defaults (`facebook: 'https://facebook.com/lumierehair'`, `title: 'Lumière Hair Atelier - Đẳng Cấp Chăm Sóc & Tạo Mẫu Tóc'`, `copyright: '© 2026 Lumière Hair Atelier. All rights reserved.'`).
  In `PUT`, `socialLinks`, `defaultSeoMetadata`, and `footerContent` are initialized to `{}` (empty objects).
  When an admin submits a partial update modifying only one social link (e.g., `PUT /api/admin/settings` with `{ socialLinks: { instagram: 'https://instagram.com/updated' } }`), `mergedSocial` merges into `{}`. The resulting database record has `instagram` defined, but pre-existing default keys (`facebook`, `tiktok`, `zalo`) are erased (`undefined`), violating `TC2.20`.

#### Defect 2: `services/audit.ts:getAuditLogs()` Throws Uncaught Exception on Database Outage & Inconsistent `totalPages`
- **File**: `services/audit.ts`, lines 115–133:
  ```typescript
  115: const [total, logs] = await Promise.all([
  116:   prisma.auditLog.count({ where }),
  117:   prisma.auditLog.findMany({
  118:     where,
  119:     orderBy: { createdAt: 'desc' },
  120:     skip,
  121:     take: pageSize,
  ...
  133: ]);
  ```
- **Verbatim Error**:
  When called while the database is unreachable, `getAuditLogs()` crashes with:
  ```
  PrismaClientInitializationError: Invalid `prisma.auditLog.count()` invocation:
  Can't reach database server at `localhost:5432`
  ```
- **Discrepancy within the same service**:
  `logAuditEvent` (lines 51–73) wraps database calls in `try...catch` and is documented as *"Hoàn toàn Fail-Safe: không bao giờ ném lỗi ra ngoài làm sập luồng nghiệp vụ"*. However, `getAuditLogs()` omitted this fail-safe pattern.
- **Inconsistency in Pagination**:
  `services/audit.ts` line 159 calculates `totalPages: Math.ceil(total / pageSize)`. When `total === 0`, `totalPages` is `0`.
  In contrast, `app/api/admin/audit-logs/route.ts` line 127 calculates `totalPages: Math.ceil(total / pageSize) || 1`.
  When `total === 0`, server components pre-fetching via `getAuditLogs()` receive `totalPages: 0`, leading to UI anomalies like "Trang 1 / 0".

---

## 2. Logic Chain

1. **Test Contract Requirements vs. Implementation**:
   - `TC2.20` explicitly mandates that partial updates on Site Settings preserve all existing unmodified fields.
   - Observation 1.3 shows that `PUT /api/admin/settings` initializes fallback `current` with empty nested objects (`socialLinks: {}`, `defaultSeoMetadata: {}`, `footerContent: {}`).
   - Consequently, when an admin executes a partial update modifying one nested field (e.g. `instagram`), `mergedSocial` becomes `{ instagram: '...' }` without the default `facebook`, `tiktok`, and `zalo` links. This was proven by the failing check in `tests/challenge_m2_harness.ts` (`Facebook: undefined`).

2. **Service Reliability & Architecture**:
   - The system is architected to operate safely in serverless environments where database cold-starts, connection pool exhaustion, or transient downtime may occur.
   - Observation 1.3 demonstrates that `services/audit.ts:getAuditLogs()` lacks the fail-safe try/catch present in `logAuditEvent` and `app/api/admin/audit-logs/route.ts`.
   - Direct consumers of `services/audit.ts:getAuditLogs()` crash unhandled under database latency/offline conditions.

3. **Telemetry & RBAC Resilience**:
   - On the positive side, Observation 1.2 confirmed that:
     - All 4 roles (`SUPER_ADMIN`, `CONTENT_ADMIN`, `BOOKING_STAFF`, `EDITOR`) access `/api/admin/dashboard` cleanly.
     - 20 concurrent requests to `/api/admin/dashboard` returned HTTP 200 in 4195ms with 0 deadlocks.
     - Non-`SUPER_ADMIN` roles are strictly blocked from `/api/admin/settings` (HTTP 403) and `/api/admin/audit-logs` (HTTP 403), satisfying `TC2.12` and `TC2.13`.
     - SQL injection payloads (`' OR 1=1 --`) and regex metacharacters in search queries are handled safely without 500 errors.

---

## 3. Caveats

- **No Caveats on Bug Reproduction**: Both bugs are 100% reproducible via `npx tsx tests/challenge_m2_harness.ts` and require 0 external dependencies.
- **Worker E2E Runner Limitation**: The default `npm run test:e2e` runner executes in `SIMULATION` mode against `ContractSimulator`, which masked Defect 1 because the simulator operates in-memory on mock fixtures rather than exercising the App Router route handlers.

---

## 4. Conclusion

**Verdict: `CHALLENGE_DETECTED`**

While Milestone 2 establishes an impressive, luxury dark atelier foundation with strict TypeScript typing (0 errors) and successful Next.js production builds, adversarial empirical probing detected 2 concrete flaws that must be addressed:

1. **`VULN-M2-01` (High Severity — Functional Regression in TC2.20)**:
   In `app/api/admin/settings/route.ts`, lines 161–163, default values for `socialLinks`, `defaultSeoMetadata`, and `footerContent` are set to `{}` instead of the full standard salon defaults. Partial updates on newly initialized or fallback environments wipe out sibling social links, SEO tags, and copyright information.
2. **`VULN-M2-02` (Medium Severity — Service Reliability & Inconsistency)**:
   In `services/audit.ts:getAuditLogs()`, lines 115–133 lack a fail-safe `try...catch` fallback (throwing `PrismaClientInitializationError` on DB timeout), and line 159 calculates `totalPages = 0` when `total = 0` (inconsistent with route.ts which enforces `>= 1`).

---

## 5. Verification Method

To independently reproduce and verify these findings:

1. **Run the Empirical Challenge Suite**:
   ```bash
   npx tsx tests/challenge_m2_harness.ts
   ```
   *Observed result:* 79 total checks, 77 passed, 2 failed.

2. **Inspect the Code Points**:
   - `app/api/admin/settings/route.ts`: Lines 161–163 vs. lines 59–76.
   - `services/audit.ts`: Lines 115–133 and line 159 vs. `app/api/admin/audit-logs/route.ts` lines 80–102 and 127.

3. **Required Fixes for M2 Worker**:
   - In `app/api/admin/settings/route.ts` (lines 161–163), replace `{}` with the exact default objects for `socialLinks`, `defaultSeoMetadata`, and `footerContent` matching `GET`.
   - In `services/audit.ts:getAuditLogs()`, wrap `Promise.all` in `try...catch` with empty fallback data and set `totalPages: Math.ceil(total / pageSize) || 1`.
