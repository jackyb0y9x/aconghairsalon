## 2026-10-19T02:13:46Z
# Dispatch: E2E Test Suite & Infrastructure Writer

- Role: E2E Test Suite & Infrastructure Specialist
- Working Directory: c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_test_writer_e2e_infra
- Parent Orchestrator ID: daa96dc0-4b53-4192-88a0-f59f39a1f3f3
- Project Root: c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode
- Project Specification: c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\PROJECT.md
- Original Request File: c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\ORIGINAL_REQUEST.md

Task:
Design and build the complete E2E Testing Infrastructure and comprehensive opaque-box test suite according to the Project Pattern dual-track specifications:
1. Create `TEST_INFRA.md` at project root documenting:
   - Test philosophy: Opaque-box, requirement-driven, zero implementation internals dependency.
   - Methodology: Category-Partition + Boundary Value Analysis + Pairwise Combinatorial + Real-World Workload Testing.
   - Feature inventory mapping to test tiers.
   - Test architecture, directory layout (`tests/e2e/`), test runner command, pass/fail semantics.
2. Build the standalone E2E test runner (`tests/runner.ts` or `tests/run-e2e.ts` runnable via `npm run test:e2e` or `npx ts-node tests/run-e2e.ts`):
   - Clear colored terminal output, total tests, passing, failing, duration.
   - Structured JSON test report artifact.
3. Design and implement test cases across all 4 Tiers:
   - Tier 1: Feature Coverage (>=5 test cases per feature covering Public, Admin, Try-On, Booking, Auth).
   - Tier 2: Boundary & Corner Cases (empty inputs, maximum lengths, invalid phone formats, off-hour booking, edge case image sizes >5MB, invalid RBAC attempts).
   - Tier 3: Cross-Feature Combinations (Pairwise coverage: booking + specific style + color swatch; admin CRUD mutation + public display reflection; Try-on + booking flow).
   - Tier 4: Real-World Application Scenarios (Full customer booking journey; Full content management lifecycle; Full unauthorized penetration attempt).
4. Once all test suites are written and verified, create `TEST_READY.md` at project root detailing the runner command, coverage table, and feature checklist.

Output:
Write `TEST_INFRA.md` and test suite files in `tests/`, and deliver a self-contained handoff report to:
`c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_test_writer_e2e_infra\handoff.md`.
Notify parent via `send_message` when done.
