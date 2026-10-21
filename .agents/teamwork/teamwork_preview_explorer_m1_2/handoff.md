# Handoff Report: Milestone 1 Database Layer Blueprint (14 Prisma Models, Pooling & Rich Seed Dataset)

**Agent:** M1 Explorer 2 (`teamwork_preview_explorer_m1_2`)  
**Parent Orchestrator:** `daa96dc0-4b53-4192-88a0-f59f39a1f3f3`  
**Working Directory:** `c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_explorer_m1_2`  
**Handoff Type:** Hard (Task complete)  
**Deliverable Document:** `c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_explorer_m1_2\analysis.md`  
**Date:** 2026-10-19  

---

## 1. Observation

1. **Dispatch Directives (`DISPATCH.md`, lines 11–32)**:
   > "Task: Analyze the database layer blueprint for Milestone 1 (Focus: Prisma ORM Schema and Rich Seed Data):  
   > 1. Review `prisma/schema.prisma` covering all 14 models:  
   >    - `User`, `Role` (enum: SUPER_ADMIN, CONTENT_ADMIN, BOOKING_STAFF, EDITOR), `Session`  
   >    - `Category`, `Hairstyle`, `HairColor`  
   >    - `Service`, `ServiceCombo`  
   >    - `BeforeAfter`  
   >    - `Booking` (enum: PENDING, CONFIRMED, COMPLETED, CANCELLED, NO_SHOW)  
   >    - `Banner`, `Article`, `SiteSetting`, `AuditLog`  
   > 2. Specify constraints, foreign keys, cascade deletes, indexes for high performance search/filtering.  
   > 3. Design `lib/prisma.ts`: Singleton pattern preventing connection leaks in Next.js hot-reloading and Vercel serverless environments.  
   > 4. Design the complete seed dataset in `prisma/seed.ts`..."

2. **Project Specification (`PROJECT.md`, lines 22–23, 127–139, 194–195, 204–206)**:
   - Line 22: Specifies 14 models: `User, Role, Session, Category, Hairstyle, HairColor, Service, ServiceCombo, BeforeAfter, Booking, Banner, Article, SiteSetting, AuditLog`.
   - Lines 127–139: Booking validation schema includes `serviceId`, `hairstyleId`, `hairColorId`, `stylistId`, `bookingDate`, `bookingTime`, `customerName`, `customerPhone`, `customerEmail`, `notes`, `idempotencyKey`.
   - Lines 194–195: `lib/prisma.ts` specified as `PrismaClient singleton with serverless pooling`.
   - Lines 204–206: `prisma/schema.prisma` (Complete 14-model relational schema) and `prisma/seed.ts` (Rich seed dataset with realistic salon data).

3. **Workspace File Status (`list_dir` on root `Teamcode`)**:
   - The workspace root currently contains only `.agents`, `ORIGINAL_REQUEST.md`, and `PROJECT.md`.
   - `prisma/schema.prisma`, `lib/prisma.ts`, and `prisma/seed.ts` do not yet exist in the codebase; they must be created during the implementation phase.

4. **Architecture Research (`teamwork_preview_explorer_survey_3/architecture_report.md`, lines 402–952, 956–1005, 1315–1341)**:
   - Contains preliminary definitions of Prisma models, seed targets, and global singleton pooling strategy.
   - Requires unification of booking reference fields (adding `hairColorRefId` to match `CreateBookingSchema`), explicit cascade definitions, and a fully executable, self-contained `seed.ts` script.

---

## 2. Logic Chain

1. **Model Scope Reconciliation**:
   - Observations 1 and 2 define exactly 14 primary entities. By modeling `Role` as a distinct model containing `permissions: Json` and constrained by an enum `RoleName { SUPER_ADMIN, CONTENT_ADMIN, BOOKING_STAFF, EDITOR }`, we satisfy both dynamic permission storage and relational integrity (`User.roleId -> Role.id`).
   - Many-to-many associations (`Hairstyle` <-> `Service`, `Service` <-> `ServiceCombo`) are best expressed via Prisma's native implicit M:N relations (`services Service[]`, `combos ServiceCombo[]`). This avoids unnecessary intermediary models in `schema.prisma`, retaining exactly 14 primary models while Prisma auto-manages the underlying join tables (`_HairstyleToService`, `_ServiceToServiceCombo`) with automatic cascade deletes.

2. **Relational Integrity and Cascade Rules**:
   - `onDelete: Restrict` is enforced on `User -> Role` (roles with users cannot be dropped) and `Hairstyle/Service -> Category` (categories with active items cannot be deleted).
   - `onDelete: Cascade` is enforced on `Session -> User` (revoking all sessions upon staff account removal).
   - `onDelete: SetNull` is enforced on `Booking` references (`serviceId`, `comboId`, `hairstyleRefId`, `hairColorRefId`, `assignedStylistId`) and `AuditLog.actorId`. This guarantees that historical bookings and immutable audit trails remain fully preserved even if catalog items or staff members are retired.

3. **Search Indexing Rationale**:
   - The public website requires fast 6D multi-filtering on `/hairstyles`. A composite index `@@index([gender, length, careEffort])` directly services the primary filter combination.
   - The color swatches catalog relies on `@@index([tone, group, requiresBleach])`.
   - The Admin CMS operational dashboard frequently filters bookings by date and status, which is accelerated by `@@index([bookingDate, status])`.
   - Duplicate booking submissions under spotty mobile networks are prevented at the database level by a `@unique` constraint on `Booking.idempotencyKey`.

4. **Serverless Connection Pooling Singleton**:
   - Next.js development HMR re-evaluates modules on file edits. Without attaching the Prisma client to `globalThis`, each reload spawns fresh database connections, causing quick exhaustion.
   - In production on Vercel, serverless function concurrency requires connection pooling. Specifying `url = env("DATABASE_URL")` (pointing to PgBouncer port 6543) and `directUrl = env("DIRECT_URL")` (pointing to direct PostgreSQL port 5432) ensures runtime queries are multiplexed while CLI migrations execute without pooler limitations.

5. **Rich Seed Dataset Design**:
   - Realistic salon data is essential for immediate usability in Milestones 2–6. The seed script in Section 5 of `analysis.md` provides 4 default staff credentials (`Admin@123456`, pre-hashed with `bcryptjs`), 3 master stylists with bios and specialties, 7 Vietnamese salon categories, 13 detailed hairstyles with multi-angle photos and 6D attributes, 11 hair color swatches across warm/cool/neutral tones, 6 individual services, 3 bundled combos, 4 before/after transformations, 4 hero banners, 3 SEO advice articles, complete site settings, 5 bookings covering all 5 workflow states, and 3 initial audit log entries.
   - The script executes cleanup in reverse dependency order, ensuring safe re-execution (idempotency).

---

## 3. Caveats

- **External Database Availability**: The actual execution of `npx prisma db push` and `npx prisma db seed` requires a valid PostgreSQL connection string in `.env`. For local testing without a live PostgreSQL instance, developers can use a local Docker PostgreSQL container or a cloud instance (Supabase/Neon).
- **Array Fields in PostgreSQL**: Models utilize native PostgreSQL text arrays (`String[]`) and enum arrays (`FaceShape[]`, `HairTexture[]`). SQLite does not support native scalar/enum arrays; PostgreSQL is mandatory as specified in `PROJECT.md`.
- **Seed Script Dependencies**: The seed script relies on `bcryptjs` and `tsx`. These dependencies must be included in `package.json` (`dependencies` and `devDependencies` respectively).

---

## 4. Conclusion

The database layer blueprint for Milestone 1 is fully defined, strictly verified against project specifications, and documented in `analysis.md`. It provides complete drop-in implementations for:
1. `prisma/schema.prisma` with 14 models and 12 enums.
2. `lib/prisma.ts` with the global serverless connection pooling singleton.
3. `prisma/seed.ts` with comprehensive real-world Vietnamese salon data.

The implementer can directly copy these implementations into the codebase during Milestone 1 execution.

---

## 5. Verification Method

To independently verify the database layer once implemented:

1. **Inspect Artifacts**:
   - Read `c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_explorer_m1_2\analysis.md`.
   - Verify all 14 models are present and match Section 2.1 table.

2. **Validate Prisma Schema**:
   ```bash
   npx prisma validate
   ```
   *Pass Condition*: Output must state `The schema at prisma/schema.prisma is valid.`

3. **Generate Prisma Client**:
   ```bash
   npx prisma generate
   ```
   *Pass Condition*: Client generates successfully with TypeScript definitions in `node_modules/@prisma/client`.

4. **Verify TypeScript Compilation**:
   ```bash
   npx tsc --noEmit
   ```
   *Pass Condition*: Zero type errors in `lib/prisma.ts` and `prisma/seed.ts`.

5. **Test Seed Execution (against live DB)**:
   ```bash
   npx prisma db push
   npx prisma db seed
   ```
   *Pass Condition*: Console logs confirm completion of all 13 seed steps with 0 errors.

6. **Invalidation Conditions**:
   - Any missing model from the 14 specified in `PROJECT.md`.
   - Schema validation errors from circular or un-indexed foreign relations.
   - Connection pool exhaustion under multiple rapid requests due to missing `globalThis` assignment in `lib/prisma.ts`.
