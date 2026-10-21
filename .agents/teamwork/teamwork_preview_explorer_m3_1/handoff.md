# HANDOFF REPORT — MILESTONE 3 CONTENT CATALOG BLUEPRINT
**Agent:** M3 Explorer 1 (Content Catalog Specialist)  
**Recipient:** Orchestrator (`daa96dc0-4b53-4192-88a0-f59f39a1f3f3`) & M3 Workers  
**Working Directory:** `c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_explorer_m3_1`  
**Delivery File:** `analysis.md` & `handoff.md`  
**Date:** 2026-10-19  

---

## 1. OBSERVATION

1. **Prisma Models Investigation (`prisma/schema.prisma`)**:
   - `Banner` (lines 429-448): Fields are `id`, `title`, `subtitle`, `badgeText`, `imageUrl`, `mobileImageUrl`, `linkUrl`, `ctaText`, `displayOrder`, `isActive`, `startDate`, `endDate`.
   - `Category` (lines 99-119): Fields are `id`, `name`, `slug`, `description`, `type` (`CategoryType`: `HAIRSTYLE`, `SERVICE`, `ARTICLE`), `imageUrl`, `displayOrder`, `isActive`. Relational delete behavior is `onDelete: Restrict` in `Hairstyle` and `Service`.
   - `Hairstyle` (lines 174-220): Fields are `id`, `title`, `slug`, `summary`, `description`, `coverImageUrl`, `galleryImages` (`String[]`), `gender` (`GenderTarget`), `length` (`HairLength`), `suitableFaces` (`FaceShape[]`), `suitableTexture` (`HairTexture[]`), `careEffort` (`CareEffort`), `styleVibe` (`StyleVibe`), `careAdvice`, `stylingTips`, `priceRefMin` (`Decimal?`), `priceRefMax` (`Decimal?`), `isTrending`, `isFeatured`, `isActive`, `viewCount`, `categoryId`.
   - *Crucial Observation on Schema Models*: In `schema.prisma`, there are NO separate tables `HairstyleImage` or `HairstylePriceTier`. Instead, `Hairstyle` directly contains `galleryImages: String[]` (PostgreSQL native text array) and `priceRefMin`/`priceRefMax` (`Decimal`).
   - `HairColor` (lines 242-272): Fields are `id`, `name`, `code` (`@unique`), `hexColor`, `secondaryHex`, `tone` (`ColorTone`), `group` (`ColorGroup`), `brightnessLevel` (`Int`), `requiresBleach` (`Boolean`), `bleachRounds` (`Int`), `suitableSkinTones` (`String[]`), `maintenanceLevel` (`CareEffort`), `colorFadingAdvice`, `swatchImageUrl`, `samplePortraitUrl`, `isTrending`, `isActive`, `displayOrder`.

2. **Opaque-Box E2E Testing Contracts (`tests/e2e/` & `tests/harness/contract-simulator.ts`)**:
   - `tests/e2e/tier1-features/admin.test.ts`:
     - Line 33-47 (TC1.8): POST `/api/admin/hairstyles` sends `{ name, slug, gender, style, length, faceShape, texture, careLevel, price, tags, images, features, careAdvice }`. Expects HTTP 201 with `data.id` and `data.name === newStylePayload.name`.
     - Line 62-69 (TC1.8): PUT `/api/admin/hairstyles/${id}` sends `{ price: 480000, careLevel: 'EASY' }`. Expects HTTP 200 with `data.price === 480000`, `data.careLevel === 'EASY'`.
     - Line 71-73 (TC1.8): DELETE `/api/admin/hairstyles/${id}` expects HTTP 200 `{ success: true }`.
     - Line 84-105 (TC1.9): POST `/api/admin/banners` sends `{ title, subtitle, imageUrl, ctaLink, order: 2, active: true }`. Expects HTTP 201 with `data.id`. PUT updates `{ active: false, order: 99 }`.
     - Line 114-136 (TC1.10): POST `/api/admin/colors` sends `{ name, hexCode, tone, group, brightness, requiresBleach: true, skinSuitability, maintenanceAdvice }`. Expects HTTP 201 with `data.requiresBleach === true`.
     - Line 178-183 (TC1.12): Expects `latestLog.entity` to equal `'HAIR_COLOR'` (Audit entity name).
   - `tests/e2e/tier2-boundaries/content-boundaries.test.ts`:
     - Line 15-23 (TC2.17): POST `/api/admin/hairstyles` with empty name/slug strictly expects HTTP 400 with `data.error` containing `'bắt buộc'`.
     - Line 32-37 (TC2.18): PUT `/api/admin/hairstyles/hs-does-not-exist` strictly expects HTTP 404 with `data.error` containing `'not found'`.
   - `tests/e2e/tier2-boundaries/rbac-boundaries.test.ts`:
     - Line 58-71 (TC2.15): `EDITOR` role attempting POST `/api/admin/hairstyles` or DELETE `/api/admin/hairstyles/...` strictly receives HTTP 403 Forbidden.
     - Line 78-86 (TC2.16): `EDITOR` role attempting POST `/api/admin/banners` strictly receives HTTP 403 Forbidden.

3. **Existing Codebase Infrastructure**:
   - `lib/auth.ts` (lines 358-374): `checkApiRbacPermission` already permits `SUPER_ADMIN` and `CONTENT_ADMIN` for `/api/admin/hairstyles`, `/api/admin/banners`, `/api/admin/colors`, `/api/admin/hair-colors`, `/api/admin/categories`.
   - `services/audit.ts` (lines 51-73): `logAuditEvent` handles async fail-safe persistence into `prisma.auditLog`.
   - `components/admin/AdminSidebar.tsx` (lines 61-96): Already features links for `/admin/hairstyles`, `/admin/colors`, `/admin/banners` with roles `['SUPER_ADMIN', 'CONTENT_ADMIN']`.
   - `lib/utils.ts`: Contains existing helpers `slugify`, `formatVND`, `formatPriceRange`, `formatDateVN`, `cn`.

---

## 2. LOGIC CHAIN

1. **Step 1 (Schema & Contract Reconciliation)**:  
   From Observation 1 and 2, the Prisma models use canonical field names (`title`, `isActive`, `displayOrder`, `linkUrl`, `hexColor`, `priceRefMin`), while the E2E test suite uses alternative naming conventions (`name`, `active`, `order`, `ctaLink`, `hexCode`, `price`, `careLevel`).  
   *Inference*: If the API route handlers only support Prisma field names, the E2E tests (TC1.8, TC1.9, TC1.10) will fail. Therefore, a **Dual-Mapping** architecture in `lib/validations/content.ts` is mandatory:
   - Input parsers accept both variants (e.g. `z.union` or optional aliases).
   - Output serializers emit both variants (e.g. returning both `active` and `isActive`, `name` and `title`, `hexCode` and `hexColor`, `price` and `priceRefMin`).

2. **Step 2 (Auto-resolution of Unspecified Foreign Keys)**:  
   From Observation 2, TC1.8 and TC3.4 create hairstyles without providing a `categoryId`. However, from Observation 1, `Hairstyle.categoryId` is a non-null foreign key with `onDelete: Restrict`.  
   *Inference*: To avoid database constraint errors (`P2003`), the `POST /api/admin/hairstyles` handler must auto-detect or resolve a default active `HAIRSTYLE` category from the database if `categoryId` is omitted in the request.

3. **Step 3 (RBAC Enforcement)**:  
   From Observation 2 (TC2.15, TC2.16) and Observation 3 (`lib/auth.ts`), only `SUPER_ADMIN` and `CONTENT_ADMIN` are authorized to mutate catalog data.  
   *Inference*: Every route handler must call `extractAuthToken`, `verifySession`, and verify that `user.role.name` is either `SUPER_ADMIN` or `CONTENT_ADMIN`. Any other role (such as `EDITOR` or `BOOKING_STAFF`) must return HTTP 403 Forbidden with `{ error: 'Forbidden: ...' }`.

4. **Step 4 (Audit Logging Entity Consistency)**:  
   From Observation 2 (TC1.12), the test explicitly asserts `expect(latestLog.entity).toBe('HAIR_COLOR')`.  
   *Inference*: In the color creation/update/delete route handlers, `logAuditEvent` must pass `entity: 'HAIR_COLOR'` (rather than `'COLOR'` or `'HairColor'`) to guarantee 100% test passing. For Banners, it must log `entity: 'BANNER'`; for Hairstyles, `entity: 'HAIRSTYLE'`; and for Categories, `entity: 'CATEGORY'`.

5. **Step 5 (Boundary Handling for Missing Resources)**:  
   From Observation 2 (TC2.18), attempting to update a non-existent hairstyle ID (`hs-does-not-exist`) must return HTTP 404 with error message containing `'not found'`.  
   *Inference*: All PUT and DELETE route handlers must perform a pre-flight `findUnique` check or catch Prisma error `P2025` and return HTTP 404 `{ error: 'Resource not found' }`.

---

## 3. CAVEATS

1. **Object Storage vs Static URLs**: The current design supports URL strings for images (`imageUrl`, `galleryImages`). When integrating with cloud storage (Cloudinary/Supabase), a client-side file upload component can upload directly to `/api/admin/upload` and pass the returned URL to the catalog forms.
2. **Category Deletion Cascading**: Categories cannot be deleted if child entities exist (`onDelete: Restrict`). The UI component (`CategoryTable.tsx`) must disable the delete action or display a warning dialog showing the count of linked items.
3. **No Caveats on Other Areas**: The Prisma schema, auth middleware, and E2E simulator have all been directly inspected and verified.

---

## 4. CONCLUSION

A comprehensive, production-ready blueprint has been formulated and written to `.agents/teamwork/teamwork_preview_explorer_m3_1/analysis.md`. It provides complete implementation details across:
1. **Validation & Serialization Layer** (`lib/validations/content.ts`): Zod schemas for Banner, Category, Hairstyle, and HairColor with dual-mapping serialization.
2. **API Routes**:
   - Banners: `GET /api/admin/banners`, `POST /api/admin/banners`, `PUT /api/admin/banners/[id]`, `DELETE /api/admin/banners/[id]`, `PATCH /api/admin/banners/[id]/toggle`.
   - Categories: `GET /api/admin/categories`, `POST /api/admin/categories`, `PUT /api/admin/categories/[id]`, `DELETE /api/admin/categories/[id]`.
   - Hairstyles: `GET /api/admin/hairstyles`, `POST /api/admin/hairstyles`, `PUT /api/admin/hairstyles/[id]`, `DELETE /api/admin/hairstyles/[id]`.
   - Hair Colors: `GET /api/admin/colors`, `POST /api/admin/colors`, `PUT /api/admin/colors/[id]`, `DELETE /api/admin/colors/[id]`.
3. **RBAC & Security**: Strict server-side enforcement restricting access to `SUPER_ADMIN` and `CONTENT_ADMIN`.
4. **Audit Logging**: Fail-safe event capture with correct entity names (`'HAIR_COLOR'`, `'BANNER'`, `'HAIRSTYLE'`, `'CATEGORY'`).
5. **Luxury UI Components**: Luxury theme styling for tables, modals, filters, and color swatch cards.

---

## 5. VERIFICATION METHOD

To independently verify the blueprint and its future implementation:

1. **Inspect Blueprint Artifacts**:
   - `view_file` on `c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_explorer_m3_1\analysis.md`
   - `view_file` on `c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_explorer_m3_1\handoff.md`

2. **Run E2E Feature Test Suite**:
   ```bash
   node tests/run-e2e.ts --tier=1 --grep="Hairstyle Catalog CRUD"
   node tests/run-e2e.ts --tier=1 --grep="Banner Management CRUD"
   node tests/run-e2e.ts --tier=1 --grep="Color Swatch CRUD"
   node tests/run-e2e.ts --tier=1 --grep="Audit Trail Subsystem"
   ```

3. **Run Boundary & RBAC Test Suite**:
   ```bash
   node tests/run-e2e.ts --tier=2 --grep="TC2.15"
   node tests/run-e2e.ts --tier=2 --grep="TC2.16"
   node tests/run-e2e.ts --tier=2 --grep="TC2.17"
   node tests/run-e2e.ts --tier=2 --grep="TC2.18"
   ```

4. **Run Cross-Feature Reflection Test Suite**:
   ```bash
   node tests/run-e2e.ts --tier=3 --grep="TC3.4"
   node tests/run-e2e.ts --tier=3 --grep="TC3.5"
   node tests/run-e2e.ts --tier=3 --grep="TC3.6"
   ```

5. **Type Safety & Build Verification**:
   ```bash
   npx tsc --noEmit
   npm run build
   ```

6. **Invalidation Conditions**:
   - Any modification to `prisma/schema.prisma` removing `galleryImages: String[]` or altering enum values.
   - Any change in test harness contracts in `tests/harness/contract-simulator.ts`.
