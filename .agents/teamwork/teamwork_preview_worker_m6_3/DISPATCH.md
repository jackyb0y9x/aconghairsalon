## 2026-10-19T17:07:33Z
You are teamwork_preview_worker_m6_3, assigned to Milestone 6: Production Hardening, Comprehensive Vietnamese README.md, .env.example & Verification.

Working Directory: c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_worker_m6_3
Project Root: c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode
Parent Orchestrator ID: 3aaffdfb-a226-41d9-a9cd-747c0319398c

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

MANDATORY INPUTS:
You MUST read:
- c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\ORIGINAL_REQUEST.md
- c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\PROJECT.md
- c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\TEST_READY.md
- c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\package.json
- c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\prisma\schema.prisma
- c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\prisma\seed.ts

TASKS & DELIVERABLES:
1. Write a complete, highly polished, professional Vietnamese `README.md` at project root (`c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\README.md`).
   The Vietnamese README must cover in detail:
   - Giới thiệu Hệ thống Modern Hair Salon (Lumière Hair Atelier): Website Khách hàng (Public Web) và Hệ thống Quản trị Salon (Admin CMS)
   - Kiến trúc Hệ thống & Cấu trúc Thư mục (Next.js 14 App Router: app/(public), app/admin, components/, lib/, services/, prisma/, tests/)
   - Yêu cầu môi trường & Cài đặt (Node.js 20+, npm, PostgreSQL)
   - Hướng dẫn cấu hình Biến Môi trường (.env & .env.example)
   - Khởi tạo Database, Prisma Migrations & Nạp Dữ liệu Mẫu (npx prisma migrate dev, npx prisma db seed / npm run prisma:seed)
   - Bảng tài khoản nhân viên mặc định cho 4 vai trò RBAC (SUPER_ADMIN, CONTENT_ADMIN, BOOKING_STAFF, EDITOR) kèm email và mật khẩu mẫu
   - Chạy ứng dụng (npm run dev, npm run build, npm start)
   - Hệ thống Thử màu & Kiểu tóc tương tác (Interactive Hair Try-On) & Cam kết Bảo mật Sinh trắc học (In-memory buffer proxy, Zero Disk Persistence)
   - Cấu hình Nhà cung cấp Lưu trữ (Storage Providers: Mock, Cloudinary, Supabase)
   - Hướng dẫn Chạy Kiểm thử Toàn diện: Standalone E2E Test Runner (node tests/run-e2e.ts, npm run test:e2e, các tùy chọn --tier, --grep, --verbose) và các bài test challenge M1-M5
   - Hướng dẫn Triển khai Production lên Vercel + PostgreSQL (Neon / Supabase / Vercel Postgres) từng bước chi tiết

2. Write a comprehensive, well-documented `.env.example` at project root (`c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.env.example`) containing all environment variables, comments explaining each variable, safe defaults, and optional service keys (Database, Session Secret, Storage Providers, Try-On Provider, Public App URLs).

3. Run and verify all 4 required project commands using run_command:
   - `npx prisma validate && npx prisma generate`
   - `npx tsc --noEmit`
   - `npm run build`
   - `node tests/run-e2e.ts` (or `npm run test:e2e`)

4. Write a comprehensive `handoff.md` in your working directory (`c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_worker_m6_3\handoff.md`) documenting:
   - Files created / updated
   - Exact command outputs, exit codes, and test pass counts (67/67 tests passing)
   - Summary of Vietnamese README.md sections
   - Verification status
   Then notify the parent orchestrator via `send_message`.
