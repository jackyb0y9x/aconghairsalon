# Dispatch: M2 Remediation Worker (Security Hardening & Settings Merge Fix)

- Role: Worker / Implementer
- Working Directory: c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_worker_m2_2
- Parent Orchestrator ID: daa96dc0-4b53-4192-88a0-f59f39a1f3f3
- Milestone: M2 - Auth, RBAC & Admin Core (Iteration 2 Remediation)
- Project Root: c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode
- Project Specification: c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\PROJECT.md
- Original Request File: c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\ORIGINAL_REQUEST.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Remediation Tasks (Reported by Reviewer 1 & Challenger 2):
1. `lib/auth.ts`:
   - Eliminate the static mock token backdoor in production.
   - Do NOT allow static mock tokens in production (`process.env.NODE_ENV === 'production'`). Only accept them if `process.env.NODE_ENV !== 'production'` AND `process.env.ALLOW_TEST_MOCK_AUTH === 'true'`.
   - Ensure genuine database session lookup is always performed for all session validations.
2. `app/api/admin/settings/route.ts` (Resolving VULN-M2-01):
   - In `PUT` handler, do NOT initialize fallback nested objects (`socialLinks`, `defaultSeoMetadata`, `footerContent`) to empty `{}`.
   - Fetch the existing settings or default settings and perform deep merging, so updating a single nested field (e.g., `instagram`) preserves all sibling fields (`facebook`, `tiktok`, `zalo`), satisfying `TC2.20`.
3. `services/audit.ts` (Resolving VULN-M2-02):
   - Wrap `getAuditLogs()` in `try...catch` so database connection errors are caught safely.
   - Ensure `totalPages = Math.max(1, Math.ceil(total / pageSize))`, preventing `totalPages = 0` UI glitches when no logs exist.

Run Verification Commands:
- `npx prisma validate`
- `npx tsc --noEmit`
- `npm run build`
- `npm run test:e2e` (67/67 tests passing)
- `npx tsx tests/challenge_m2_harness.ts` (Ensure 100% of 79 checks pass)

Deliver handoff.md and notify parent via `send_message` when complete.


## 2026-10-19T03:48:30Z
You are the M2 Remediation Worker.
Working Directory: c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_worker_m2_2
Parent Orchestrator ID: daa96dc0-4b53-4192-88a0-f59f39a1f3f3

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

MANDATORY INPUTS:
Read your dispatch file at:
c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_worker_m2_2\DISPATCH.md

Execute the 3 remediation tasks:
1. lib/auth.ts: Eliminate production mock token backdoor. Only allow mock tokens when process.env.NODE_ENV !== 'production' && process.env.ALLOW_TEST_MOCK_AUTH === 'true'.
2. app/api/admin/settings/route.ts: Fix VULN-M2-01 by deep merging nested fields (socialLinks, defaultSeoMetadata, footerContent) so partial updates preserve sibling fields and satisfy TC2.20.
3. services/audit.ts: Fix VULN-M2-02 by adding fail-safe try-catch to getAuditLogs() and enforcing totalPages >= 1.

Run verification commands:
- npx prisma validate
- npx tsc --noEmit
- npm run build
- npm run test:e2e
- npx tsx tests/challenge_m2_harness.ts

Deliver handoff.md and notify parent when complete via send_message.


## 2026-10-19T04:30:19Z
**Context**: Milestone 2 Remediation Verification
**Content**: Please check the completion status of your background task-259 (challenge_m2_harness.ts), ensure all 3 remediation tasks are fully verified, compile your final results, write handoff.md in your working directory, and report back your verdict.
**Action**: Complete handoff.md and reply with your final completion report.
