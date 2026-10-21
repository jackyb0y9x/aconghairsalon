# E2E Test Infrastructure Specification

## 1. Test Philosophy

The Modern Hair Salon E2E Testing Suite is architected under an **Opaque-Box (Black-Box)**, requirement-driven methodology. Testing evaluates system behavior exclusively through external interfaces and observable outcomes, maintaining zero dependency on internal implementation details, private functions, or internal framework wiring.

### Key Principles
1. **Opaque-Box Independence**: Test cases interact solely with public HTTP endpoints (`/api/*`), standard request/response payloads, HTTP status codes, headers, and public contracts. Internal database models or private state machines are evaluated purely by their observable side effects (e.g., admin mutation reflected on public endpoints).
2. **Contract-Driven Fidelity**: Expected behaviors and validation rules are derived directly from authoritative requirements in `ORIGINAL_REQUEST.md` (R1-R4) and interface contracts specified in `PROJECT.md` (§ Interface Contracts: TryOnRequest/Response, StorageProvider, CreateBookingSchema, RBAC Permission Matrix).
3. **Dual-Mode Execution (Live & Contract Simulation)**:
   - **Live Mode**: When `TEST_BASE_URL` is set or a local Next.js server is active (e.g. `http://localhost:3000`), the runner sends real HTTP requests over network sockets.
   - **Contract Simulation Mode**: In CI or standalone environments without an active server, the test harness transparently executes against a high-fidelity contract simulator that strictly validates Zod schemas, HTTP status semantics, RBAC access boundaries, and business rules.
4. **Deterministic & Isolated**: Every test case sets up its own fixtures, avoids execution order coupling, cleans up mock state, and enforces idempotency.
5. **Adversarial & Security-Focused**: Beyond happy-path verification, the test suite actively probes boundary limits, malformed inputs, malicious injections (SQLi, XSS, Path Traversal), and unauthorized privilege escalation.

---

## 2. Testing Methodology

The test suite applies four industry-standard testing methodologies across four distinct tiers:

```
+-----------------------------------------------------------------------------------+
|                           Tier 4: Real-World Scenarios                            |
|             (Full Customer Booking Journey, Content Lifecycle, Security)          |
+-----------------------------------------------------------------------------------+
|                      Tier 3: Cross-Feature Combinations                           |
|             (Pairwise: Booking + Style + Color, Admin CRUD -> Public, Try-On)     |
+-----------------------------------------------------------------------------------+
|                       Tier 2: Boundary & Corner Cases                             |
|          (Zod limits, Phone regex, Past dates, 5MB image limit, RBAC 403s)        |
+-----------------------------------------------------------------------------------+
|                         Tier 1: Feature Coverage                                  |
|         (Core functionality across Public, Admin, Try-On, Booking, Auth)          |
+-----------------------------------------------------------------------------------+
```

### A. Category-Partition Method (Tier 1)
Identifies input domain partitions and operational categories for each functional component:
- **Public Domain**: Discovery, browsing, filtering, search, detail inspection, content reading.
- **Admin Domain**: Telemetry analytics, catalog CRUD, appointment management, site configuration, audit trails.
- **Try-On Domain**: Image ingestion, format verification, composite simulation, privacy enforcement.
- **Booking Domain**: Step validation, slot reservation, idempotency locking, status transitions.
- **Authentication Domain**: Credential verification, session tokens, cookie lifecycles, route guards.

### B. Boundary Value Analysis (BVA) (Tier 2)
Tests inputs directly on, just above, and just below permissible boundaries:
- **String Lengths**: Customer name (min 2, max 100), Notes (max 500 chars).
- **Format Formulations**: Vietnamese telephone regex (`^(0|\+84)[3|5|7|8|9][0-9]{8}$`), email validation, ISO dates (`YYYY-MM-DD`), 24h time (`HH:mm`).
- **File Upload Limits**: Empty buffer (0 bytes), maximum payload (5MB boundary), oversized payloads (>5MB).
- **Temporal Boundaries**: Booking dates in the past vs today vs tomorrow; salon operating hours (08:30 - 20:30).
- **Access Control Boundaries**: Strict 403 Forbidden for insufficient role permissions (`BOOKING_STAFF` vs `CONTENT_ADMIN` vs `EDITOR` vs `SUPER_ADMIN`).

### C. Pairwise Combinatorial Testing (Tier 3)
Evaluates interactions between multiple subsystems that intersect during user operations:
- **Booking + Hairstyle + Color Swatch**: Validates cross-entity compatibility, references, and total pricing calculation.
- **Admin CRUD Mutation -> Public Display Reflection**: Validates that changes in Admin CMS immediately update Public Website views (data integrity across subsystems).
- **Try-On Simulation -> Booking Conversion**: Validates passing simulated hairstyle and color selections from Try-On canvas directly into the booking wizard state.

### D. Real-World Workload Testing (Tier 4)
Executes end-to-end user and administrator journeys mimicking production conditions:
- **Complete Customer Booking Journey**: Multi-step discovery, filtering, booking submission, confirmation code receipt, and salon status progression.
- **Full Content Management Lifecycle**: Salon initialization, brand configuration, category creation, style & color publishing, Before/After linking, and SEO blog authoring.
- **Penetration & Adversarial Security Audit**: Injection prevention (SQLi, XSS), path traversal prevention in file uploads, session forgery protection, and IDOR validation.

---

## 3. Feature Inventory Mapping

All 33 features defined in `PROJECT.md` are comprehensively mapped to test tiers:

| Feature # | Feature Name | Primary Test Tier | Test Suite File | Coverage Target |
|-----------|--------------|-------------------|-----------------|-----------------|
| F1 | Next.js & TS Foundation | Tier 1 | `tests/e2e/tier1-features/public.test.ts` | Status 200, Valid HTML/JSON headers |
| F2 | Prisma Schema & Models | Tier 1 & Tier 3 | Across all suites | Schema validation & relational integrity |
| F3 | Rich Seed Dataset | Tier 1 | `tests/e2e/tier1-features/public.test.ts` | Default styles, colors, services present |
| F4 | Cloud Storage Abstraction | Tier 1 & Tier 2 | `tests/e2e/tier1-features/try-on.test.ts` | Zero disk persistence, base64 payload |
| F5 | Hair Try-On Provider Interface | Tier 1 | `tests/e2e/tier1-features/try-on.test.ts` | `HairTryOnProvider` contract validation |
| F6 | Auth & Session Management | Tier 1 | `tests/e2e/tier1-features/auth.test.ts` | Login, Session, Logout, Cookie handling |
| F7 | RBAC Authorization Guard | Tier 1 & Tier 2 | `auth.test.ts`, `rbac-boundaries.test.ts` | 4 roles (`SUPER_ADMIN`, `CONTENT_ADMIN`, `BOOKING_STAFF`, `EDITOR`) |
| F8 | Admin Layout & Navigation | Tier 1 | `tests/e2e/tier1-features/admin.test.ts` | Admin route protection & shell data |
| F9 | Dashboard Telemetry | Tier 1 | `tests/e2e/tier1-features/admin.test.ts` | Live metrics & pending booking count |
| F10 | Site Settings Management | Tier 1 & Tier 4 | `admin.test.ts`, `content-management-lifecycle.test.ts` | Dynamic branding, hours, SEO defaults |
| F11 | Audit Logging Subsystem | Tier 1 & Tier 4 | `admin.test.ts`, `unauthorized-penetration.test.ts` | Action logging, actor, diff details |
| F12 | Banner Content CRUD | Tier 1 & Tier 3 | `admin.test.ts`, `admin-crud-public-reflection.test.ts` | Create, reorder, active toggle, public display |
| F13 | Category & Hairstyle CRUD | Tier 1 & Tier 3 | `admin.test.ts`, `admin-crud-public-reflection.test.ts` | Full CRUD, multi-criteria attributes |
| F14 | Hair Color Swatch CRUD | Tier 1 & Tier 3 | `admin.test.ts`, `booking-style-color.test.ts` | Color tones, hex code, bleach requirements |
| F15 | Before/After Showcase CRUD | Tier 1 & Tier 4 | `admin.test.ts`, `content-management-lifecycle.test.ts` | Image pairs, service tag, hairstyle link |
| F16 | Service & Combo CRUD | Tier 1 & Tier 3 | `admin.test.ts`, `booking-style-color.test.ts` | Pricing, duration, package bundling |
| F17 | News & Article CRUD | Tier 1 & Tier 4 | `admin.test.ts`, `content-management-lifecycle.test.ts` | Rich content, SEO meta, publishing status |
| F18 | Appointment Management | Tier 1 & Tier 4 | `booking.test.ts`, `customer-booking-journey.test.ts` | 5-state lifecycle, stylist assignment, notes |
| F19 | Public Layout & Branding | Tier 1 | `tests/e2e/tier1-features/public.test.ts` | Branding injected from Site Settings |
| F20 | Dynamic Home Page | Tier 1 | `tests/e2e/tier1-features/public.test.ts` | All dynamic CMS sections rendered |
| F21 | Hairstyle Exploration Library | Tier 1 | `tests/e2e/tier1-features/public.test.ts` | 6-criteria filter query parameters |
| F22 | Hairstyle Detail View | Tier 1 | `tests/e2e/tier1-features/public.test.ts` | Attributes, care guide, related services |
| F23 | Color Swatches & Consultation | Tier 1 | `tests/e2e/tier1-features/public.test.ts` | Tones, skin compatibility, maintenance advice |
| F24 | Before/After Interactive Showcase | Tier 1 | `tests/e2e/tier1-features/public.test.ts` | Before/after image pair display & filters |
| F25 | Services & Price Transparency | Tier 1 | `tests/e2e/tier1-features/public.test.ts` | Tiered pricing, durations, care instructions |
| F26 | Multi-Step Booking Wizard | Tier 1 & Tier 2 | `booking.test.ts`, `booking-boundaries.test.ts` | Step validation, anti-duplicate lock |
| F27 | Blog & Hair Care Knowledge | Tier 1 | `tests/e2e/tier1-features/public.test.ts` | Category tags, SEO Open Graph data |
| F28 | Hair Try-On User Interface | Tier 1 | `tests/e2e/tier1-features/try-on.test.ts` | Photo upload ingestion & response shape |
| F29 | Demo Simulation Engine | Tier 1 | `tests/e2e/tier1-features/try-on.test.ts` | Composite output, mock indicator, latency |
| F30 | Try-On State Machine | Tier 2 | `tests/e2e/tier2-boundaries/tryon-boundaries.test.ts` | Empty, processing, success, error, oversized |
| F31 | In-Memory Privacy Proxy | Tier 1 & Tier 2 | `try-on.test.ts`, `tryon-boundaries.test.ts` | Zero disk persistence, memory buffer check |
| F32 | E2E Testing Suite | Meta | Standalone Runner (`tests/run-e2e.ts`) | Self-testing, report generation, 100% pass |
| F33 | Production Build & Docs | Meta | `TEST_READY.md`, `README.md` | Clear setup and verification commands |

---

## 4. Directory Layout

The E2E test suite adheres to the co-located, clean testing architecture under `tests/`:

```
c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\
├── tests/
│   ├── run-e2e.ts                         # Standalone E2E Test Runner CLI
│   ├── harness/
│   │   ├── types.ts                       # Test context, assertion, result types
│   │   ├── assertions.ts                  # Fluent opaque-box assertion library
│   │   ├── client.ts                      # Unified HTTP & Mock API client
│   │   ├── contract-simulator.ts          # Contract simulation engine for offline CI
│   │   ├── reporter.ts                    # ANSI colored terminal and JSON reporter
│   │   └── runner.ts                      # Core suite execution & filtering engine
│   ├── fixtures/
│   │   └── mock-data.ts                   # Realistic test data, tokens, images, payloads
│   └── e2e/
│       ├── tier1-features/
│       │   ├── public.test.ts             # Tier 1: Public Website features (6 tests)
│       │   ├── admin.test.ts              # Tier 1: Admin CMS features (6 tests)
│       │   ├── try-on.test.ts             # Tier 1: Hair Try-On features (5 tests)
│       │   ├── booking.test.ts            # Tier 1: Booking subsystem features (5 tests)
│       │   └── auth.test.ts               # Tier 1: Auth & RBAC features (5 tests)
│       ├── tier2-boundaries/
│       │   ├── booking-boundaries.test.ts # Tier 2: Validation limits, phone regex, past dates (6 tests)
│       │   ├── tryon-boundaries.test.ts   # Tier 2: File size >5MB, 0-byte, invalid MIME (5 tests)
│       │   ├── rbac-boundaries.test.ts    # Tier 2: RBAC 403 Forbidden violations (5 tests)
│       │   └── content-boundaries.test.ts # Tier 2: Content length limits, slug duplicates (4 tests)
│       ├── tier3-combinations/
│       │   ├── booking-style-color.test.ts            # Tier 3: Booking + Style + Color pair (3 tests)
│       │   ├── admin-crud-public-reflection.test.ts   # Tier 3: Admin mutation -> Public reflection (3 tests)
│       │   └── tryon-to-booking.test.ts               # Tier 3: Try-On simulation to Booking conversion (3 tests)
│       └── tier4-scenarios/
│           ├── customer-booking-journey.test.ts       # Tier 4: Full customer appointment lifecycle (3 tests)
│           ├── content-management-lifecycle.test.ts   # Tier 4: Full salon content publishing lifecycle (3 tests)
│           └── unauthorized-penetration.test.ts       # Tier 4: Security penetration & injection audit (5 tests)
├── test-results/
│   └── e2e-report.json                    # Automated JSON test report artifact
├── TEST_INFRA.md                          # This specification document
└── TEST_READY.md                          # Test readiness certificate & instructions
```

---

## 5. Execution Command & CLI Options

The test runner is standalone and requires zero global test framework dependencies (runs natively via Node 24+):

### Running All Tests
```bash
node tests/run-e2e.ts
```
*(Alternative commands: `npm run test:e2e` or `npx ts-node tests/run-e2e.ts`)*

### CLI Options
- `--tier=<1|2|3|4>`: Filter execution to a single tier.
  ```bash
  node tests/run-e2e.ts --tier=1
  node tests/run-e2e.ts --tier=4
  ```
- `--grep=<pattern>`: Run tests matching a specific substring or pattern.
  ```bash
  node tests/run-e2e.ts --grep="booking"
  ```
- `--verbose`: Enable detailed request/response logs for debugging.
  ```bash
  node tests/run-e2e.ts --verbose
  ```
- `--report-path=<path>`: Output test results JSON to custom destination (defaults to `test-results/e2e-report.json`).
  ```bash
  node tests/run-e2e.ts --report-path=./test-results/ci-run.json
  ```
- `TEST_BASE_URL`: Environment variable to point to a live deployment.
  ```bash
  TEST_BASE_URL=http://localhost:3000 node tests/run-e2e.ts
  ```

---

## 6. Pass/Fail Semantics & Reporting

- **Exit Code 0**: 100% of executed test cases passed successfully.
- **Exit Code 1**: One or more test cases failed or encountered an unhandled exception.
- **Terminal Output**:
  - Distinct colored headers per Tier (Cyan for Tier 1, Yellow for Tier 2, Magenta for Tier 3, Green for Tier 4).
  - Individual test case results with timing: `✓ [PASS] (12ms) - TC1.1: GET /api/public/home returns dynamic sections`.
  - In case of failure: exact expected vs. actual values, error diff, and execution stack trace.
  - Final execution table displaying:
    - Total Suites
    - Total Tests
    - Passed Count
    - Failed Count
    - Total Execution Time
- **JSON Report Artifact**:
  - Saved to `test-results/e2e-report.json`.
  - Contains full metadata: ISO timestamp, environment, summary metrics, and a structured array of all suites, tests, status, duration, and error details for CI/CD integration.
