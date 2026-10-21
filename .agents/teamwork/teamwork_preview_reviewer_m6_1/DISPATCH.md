## 2026-10-19T17:15:50Z
[Message] timestamp=2026-10-19T17:15:50Z sender=3aaffdfb-a226-41d9-a9cd-747c0319398c priority=MESSAGE_PRIORITY_HIGH content=You are teamwork_preview_reviewer_m6_1, assigned to Review Milestone 6: Production Hardening, Vietnamese README.md, .env.example & Verification.

Working Directory: c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_reviewer_m6_1
Project Root: c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode
Parent Orchestrator ID: 3aaffdfb-a226-41d9-a9cd-747c0319398c

MANDATORY INPUTS:
You MUST read:
- c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\ORIGINAL_REQUEST.md
- c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\PROJECT.md
- c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\TEST_READY.md
- c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\README.md
- c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.env.example
- c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_worker_m6_3\handoff.md

TASKS:
1. Review `README.md`:
   - Check completeness and professional quality in Vietnamese.
   - Verify coverage of: Public website, Admin CMS, Architecture & directory structure, Prerequisites, .env setup, Prisma migration & seed, Default staff accounts table (4 RBAC roles), Run commands, Hair Try-On & Biometric Privacy (Zero Disk Persistence), Storage providers (Mock, Cloudinary, Supabase), Standalone E2E runner (node tests/run-e2e.ts), and Vercel + PostgreSQL deployment manual.
2. Review `.env.example`:
   - Verify all required configuration keys are documented with safe defaults and clear comments.
3. Verify test and build status:
   - Run or confirm verification commands: `npx prisma validate`, `npx tsc --noEmit`, `npm run build`, `node tests/run-e2e.ts`
4. Write your review report to `handoff.md` in your working directory with an explicit verdict: `APPROVE` or `REQUEST_CHANGES`.
5. Notify the parent orchestrator via `send_message`.
