# Handoff Report: Admin Shell Layout, Role-Filtered Navigation & Dashboard Telemetry

- **Agent:** M2 Explorer 2 (`teamwork_preview_explorer_m2_2`)
- **Recipient:** Parent Orchestrator (`daa96dc0-4b53-4192-88a0-f59f39a1f3f3`) & M2 Implementers
- **Working Directory:** `c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_explorer_m2_2`
- **Associated Artifact:** `analysis.md`

---

## 1. Observation

1. **Current Codebase State & Directory Layout:**
   - In `c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\app`: currently contains only `globals.css`, `layout.tsx`, and `page.tsx`.
   - The directory `app/admin/` and `components/admin/` do not exist yet in the codebase.
   - `prisma/schema.prisma` is fully created and validated, containing 14 models: `Role`, `User`, `Session`, `Category`, `Hairstyle`, `HairColor`, `Service`, `ServiceCombo`, `BeforeAfter`, `Booking`, `Banner`, `Article`, `SiteSetting`, and `AuditLog`.
   - `prisma/schema.prisma` line 370-424 defines the `Booking` model with fields `bookingDate DateTime @db.Date`, `status BookingStatus @default(PENDING)`, `customerName`, `customerPhone`, `serviceId`, `hairstyleRefId`, etc.
   - `prisma/schema.prisma` line 528-549 defines the `AuditLog` model with `action AuditAction`, `entityType String`, `actorName String?`, `actorRole String?`, `createdAt DateTime @default(now())`.

2. **Existing Authentication & RBAC Infrastructure (`lib/auth.ts`):**
   - Line 8: `export const SESSION_COOKIE_NAME = 'salon_session';`
   - Line 14: `export type AdminRole = 'SUPER_ADMIN' | 'CONTENT_ADMIN' | 'BOOKING_STAFF' | 'EDITOR';`
   - Line 16-27: Defines `SessionUserData` interface with `id`, `email`, `fullName`, `avatarUrl`, and `role: { id, name: AdminRole, description, permissions }`.
   - Line 117-165: Implements `verifySession(token: string): Promise<SessionUserData | null>`.
   - Line 171-180: Implements `getCurrentUser(): Promise<SessionUserData | null>`.
   - Line 202-216: Implements `requireAdmin(allowedRoles?: AdminRole[]): Promise<SessionUserData>` with automatic `redirect('/admin/login')` when unauthenticated.

3. **E2E Test Harness & Authoritative Contracts:**
   - `tests/e2e/tier1-features/admin.test.ts` lines 10-25 (TC1.7):
     ```typescript
     ctx.client.withRole('SUPER_ADMIN');
     const res = await ctx.client.get('/api/admin/dashboard');
     expect(res.status).toBe(200);
     expect(res.data).toHaveProperty('totalHairstyles');
     expect(res.data).toHaveProperty('totalColors');
     expect(res.data).toHaveProperty('totalServices');
     expect(res.data).toHaveProperty('pendingBookingsCount');
     expect(res.data.totalHairstyles).toBeGreaterThanOrEqual(2);
     expect(res.data.totalServices).toBeGreaterThanOrEqual(2);
     ```
   - `tests/e2e/tier1-features/auth.test.ts` lines 81-88 (TC1.27):
     ```typescript
     ctx.client.clearAuth();
     const dashboardRes = await ctx.client.get('/api/admin/dashboard');
     expect(dashboardRes.status).toBe(401);
     expect(dashboardRes.data.error).toContain('Unauthorized');
     ```
   - `tests/e2e/tier4-scenarios/customer-booking-journey.test.ts` lines 64-67 (TC4.1):
     ```typescript
     ctx.client.withRole('BOOKING_STAFF');
     const dashboardRes = await ctx.client.get('/api/admin/dashboard');
     expect(dashboardRes.status).toBe(200);
     expect(dashboardRes.data.pendingBookingsCount).toBeGreaterThanOrEqual(1);
     ```
   - `tests/e2e/tier4-scenarios/content-management-lifecycle.test.ts` lines 133-151 (TC4.6):
     Verifies `totalHairstyles` increments after adding a hairstyle via `/api/admin/hairstyles`.
   - `tests/harness/client.ts` lines 48-78:
     `withRole()` sets `this.cookies['session'] = user.token` and `headers['authorization'] = Bearer ${user.token}`.
   - `tests/harness/contract-simulator.ts` lines 213-227:
     The mock simulator returns:
     `{ totalHairstyles, totalColors, totalServices, totalArticles, pendingBookingsCount, todayBookingsCount, recentAuditLogs }`.

4. **Design Tokens & Styling Environment (`tailwind.config.ts` & `package.json`):**
   - Palette includes `salon.noir` (`#0B0F17`), `salon.charcoal` (`#161B26`), `salon.gold` (`#D4AF37`), `salon.ivory` (`#FDFBF7`), `salon.surface` (`#1F293D`).
   - `lucide-react` version `^0.453.0` is installed.

---

## 2. Logic Chain

1. **Premise 1 (Layout & Route Protection):**
   Next.js 14 App Router layout files (`app/admin/layout.tsx`) wrap all descendant pages, including `app/admin/login/page.tsx`.
   - From Observation 2, `requireAdmin()` redirects to `/admin/login` if `getCurrentUser()` returns `null`.
   - If `app/admin/layout.tsx` unconditionally redirects unauthenticated users, any request to `/admin/login` will trigger `redirect('/admin/login')`, creating an infinite redirect loop.
   - Therefore, `app/admin/layout.tsx` must inspect the incoming path (via request headers). When `isLoginPage` is true: if the user is already authenticated, redirect to `/admin`; if unauthenticated, render `{children}` without the sidebar and header shell. For all other admin subpaths, require authentication and render the full luxury layout.

2. **Premise 2 (Role-Filtered Navigation):**
   From Observation 2 and `PROJECT.md`, there are 4 distinct admin roles: `SUPER_ADMIN`, `CONTENT_ADMIN`, `BOOKING_STAFF`, `EDITOR`.
   - In `components/admin/AdminSidebar.tsx`, navigation items must be filtered using `item.roles.includes(user.role.name)`.
   - `Dashboard` is accessible to all 4 roles.
   - `Bookings` (`/admin/bookings`) is accessible to `SUPER_ADMIN` and `BOOKING_STAFF`.
   - Content management (`/admin/hairstyles`, `/admin/colors`, `/admin/services`, `/admin/before-after`, `/admin/banners`) is accessible to `SUPER_ADMIN` and `CONTENT_ADMIN`.
   - Articles (`/admin/articles`) is accessible to `SUPER_ADMIN`, `CONTENT_ADMIN`, and `EDITOR`.
   - System settings (`/admin/settings`) and audit logs (`/admin/audit-logs`) are strictly restricted to `SUPER_ADMIN`.
   - Sidebar must be a Client Component (`"use client"`) using `usePathname()` for active link indicators and responsive drawer toggle.

3. **Premise 3 (Dashboard Telemetry API Contract):**
   From Observation 3, the telemetry endpoint `GET /api/admin/dashboard` is queried by test cases TC1.7, TC1.27, TC4.1, and TC4.6.
   - It must return HTTP 401 when unauthenticated.
   - From Observation 3 (`client.ts`), test calls send `session` cookie or `Authorization: Bearer <token>`, while web browsers send `salon_session` cookie. The API handler must extract tokens from all three sources: `salon_session`, `session`, and `Authorization: Bearer`.
   - It must return HTTP 200 with `{ totalHairstyles, totalColors, totalServices, totalArticles, pendingBookingsCount, todayBookingsCount, recentAuditLogs }`.
   - In `AuditLog`, Prisma defines `entityType: String`. Test TC1.12 expects `latestLog.entity`. Therefore, the response must map `entity: log.entityType` alongside `entityType`.

4. **Premise 4 (Timezone Boundary Handling):**
   From Observation 1, `bookingDate` is `@db.Date`.
   - Vercel serverless runs in UTC (GMT+0), whereas Vietnam is GMT+7. Calculating today's boundaries using UTC `new Date()` causes off-by-one errors for bookings between 00:00 and 07:00 local time.
   - Therefore, the calculation of `startOfToday` and `endOfToday` must use `Asia/Ho_Chi_Minh` local date conversion.

5. **Premise 5 (Dashboard UI Performance):**
   In `app/admin/page.tsx`, server component direct querying via Prisma executes queries concurrently with zero-waterfall latency, avoids layout shifts (CLS), and immediately presents the pending booking alert banner and the 4 primary KPI cards.

---

## 3. Caveats

1. **Middleware Header Forwarding:**
   The logic checking `headers().get('x-pathname')` in `app/admin/layout.tsx` is safest when `middleware.ts` sets `request.headers.set('x-pathname', request.nextUrl.pathname)`. If middleware is omitted, `referer` or route checking provides a fallback, but having `middleware.ts` configured by Explorer 1/Implementer ensures 100% reliability.
2. **Database Seed Dependency:**
   Initial counts for `totalHairstyles` and `totalServices` in TC1.7 require `>= 2`. The database must be seeded via `npm run prisma:seed` before running live integration tests.
3. **Audit Log Volume:**
   `recentAuditLogs` takes the latest 5 records. On fresh environments without prior actions, this array may be empty unless seed data or a preceding operation has populated it.

---

## 4. Conclusion

The blueprints provided in `analysis.md` deliver a complete, type-safe, and production-ready architecture for:
1. `app/admin/layout.tsx`: Server component with session guard, login bypass, and luxury dark atelier layout.
2. `components/admin/AdminSidebar.tsx`: Role-filtered navigation for the 4 roles, active route highlighting, mobile drawer, and staff profile/logout.
3. `components/admin/AdminHeader.tsx`: Breadcrumb trail, pending alert badge, external site preview, and staff role indicator.
4. `app/api/admin/dashboard/route.ts`: Highly performant aggregation endpoint matching all E2E assertions (TC1.7, TC1.27, TC4.1, TC4.6).
5. `app/admin/page.tsx`: Server-rendered dashboard with KPI cards, pending booking alert banner, quick actions, and recent activity feeds.

---

## 5. Verification Method

To verify the implementation once coded:

1. **Static Typing & Build Verification:**
   ```bash
   npx tsc --noEmit
   ```
   *Expected:* Exits with code 0 (0 type errors).

2. **E2E Test Suite Execution:**
   ```bash
   npm run test:e2e -- --grep="Dashboard"
   npm run test:e2e -- --grep="Admin"
   npm run test:e2e
   ```
   *Expected:* All 67 tests pass (100% success rate).

3. **Inspection of Created Files:**
   Verify the presence and syntax of:
   - `app/admin/layout.tsx`
   - `app/admin/page.tsx`
   - `app/api/admin/dashboard/route.ts`
   - `components/admin/AdminSidebar.tsx`
   - `components/admin/AdminHeader.tsx`
