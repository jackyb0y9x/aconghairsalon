# Milestone 5 Explorer 3 Dispatch: Adversarial Stress & Verification Blueprint

## Identity & Objective
- Role: M5 Explorer 3 (Adversarial Quality & Challenge Harness Specialist)
- Working Directory: c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_explorer_m5_3
- Parent Orchestrator ID: daa96dc0-4b53-4192-88a0-f59f39a1f3f3

## Mandatory Inputs to Read:
1. `c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\ORIGINAL_REQUEST.md` (Section 2: Functional & Integration Verification)
2. `c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\PROJECT.md`
3. `services/try-on/types.ts` & `services/try-on/demo.ts`
4. Existing test harness patterns in `tests/challenge_m4_harness.ts` and `tests/run-e2e.ts`

## Scope & Analysis Task:
Design the comprehensive verification strategy and test harness blueprint for Milestone 5 (`tests/challenge_m5_harness.ts`):
1. **API Contract & Payload Boundaries**:
   - Successful try-on with valid JPEG/PNG/WebP buffers.
   - Rejection of oversized payloads (>5MB).
   - Rejection of unsupported MIME types (`image/gif`, `application/pdf`, `text/plain`).
   - Missing required fields (missing `hairstyleId` or image buffer).
   - Intensity boundary testing (intensity < 0 clamped or rejected, intensity > 1 clamped or rejected, valid values 0.0 - 1.0).
2. **Provider Simulation Verification**:
   - Response validation: `resultImageBase64` starts with `data:image/` or valid base64.
   - `isMock` boolean present and accurately reflects `true` for demo provider.
   - `processingTimeMs` is positive integer.
   - Presence of disclaimer/notice.
3. **UI State Machine Matrix**:
   - State transitions: empty -> upload -> configuring -> processing -> result.
   - Before/After toggle behavior.
   - Deep-link query param consumption (`/try-on?hairstyleId=...&hairColorId=...`).
4. **Integration with Booking Flow**:
   - "Đặt Lịch Với Kiểu Tóc Này" transfers hairstyle and color selections to `/booking`.

Deliver `analysis.md` and `handoff.md` in your working directory. Notify parent when complete via `send_message`.

## 2026-10-19T13:26:44Z
From: daa96dc0-4b53-4192-88a0-f59f39a1f3f3
You are M5 Explorer 3 (Adversarial Quality & Challenge Harness Specialist).
Working Directory: c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_explorer_m5_3
Parent Orchestrator ID: daa96dc0-4b53-4192-88a0-f59f39a1f3f3

MANDATORY: Read ORIGINAL_REQUEST.md, PROJECT.md, your DISPATCH.md, and services/try-on/* code.
Task: Design the comprehensive verification strategy and test harness blueprint for Milestone 5 (tests/challenge_m5_harness.ts): API boundaries, oversized payloads, MIME validation, provider response format, UI state matrix, and booking transfer.
Deliver analysis.md and handoff.md in your working directory. Notify parent when complete via send_message.
