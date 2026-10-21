# Milestone 5 Explorer 2 Dispatch: Backend API & Privacy Proxy Architecture

## Identity & Objective
- Role: M5 Explorer 2 (Backend API & In-Memory Privacy Proxy Specialist)
- Working Directory: c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_explorer_m5_2
- Parent Orchestrator ID: daa96dc0-4b53-4192-88a0-f59f39a1f3f3

## Mandatory Inputs to Read:
1. `c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\ORIGINAL_REQUEST.md` (Features R1.7, R3.2)
2. `c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\PROJECT.md`
3. `services/try-on/types.ts`, `services/try-on/demo.ts`, and `services/try-on/index.ts`
4. Validation patterns in `lib/validations/`

## Scope & Analysis Task:
Design the architectural blueprint and server-side route handler for `app/api/try-on/route.ts`:
1. **Multipart Form & Base64 Payload Handling**:
   - Ingest user portrait photo either via `multipart/form-data` or JSON with base64 data.
   - Enforce 5MB file size limit (`5 * 1024 * 1024` bytes) with clear 413 Payload Too Large error.
   - Strict MIME validation (`image/jpeg`, `image/png`, `image/webp`).
2. **In-Memory Privacy Guarantee**:
   - Ensure image buffers are processed purely in ephemeral RAM buffers.
   - Zero temporary disk storage write operations (`/tmp` or local filesystem) to protect customer biometric privacy.
   - Immediate garbage collection eligibility.
3. **Provider Factory & Integration**:
   - Invoke `getHairTryOnProvider()` (`HairTryOnProvider` abstraction).
   - Pass `TryOnRequest` (imageBuffer, mimeType, hairstyleId, hairColorId, options).
   - Receive `TryOnResponse` (resultImageBase64, mimeType, isMock, provider, processingTimeMs, notice).
4. **Resilience & Timeout Guard**:
   - AbortController timeout protection (e.g. 15-second timeout).
   - Graceful error response formatting with localized Vietnamese error messages.
   - Audit event logging (record try-on simulation event without persisting user photo).

Deliver `analysis.md` and `handoff.md` in your working directory. Notify parent when complete via `send_message`.


## 2026-10-19T13:26:44Z
[Message] timestamp=2026-10-19T13:26:44Z sender=daa96dc0-4b53-4192-88a0-f59f39a1f3f3 priority=MESSAGE_PRIORITY_HIGH content=You are M5 Explorer 2 (Backend API & In-Memory Privacy Proxy Specialist).
Working Directory: c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_explorer_m5_2
Parent Orchestrator ID: daa96dc0-4b53-4192-88a0-f59f39a1f3f3

MANDATORY: Read ORIGINAL_REQUEST.md, PROJECT.md, your DISPATCH.md, and services/try-on/* code.
Task: Design the implementation blueprint for the server-side route handler app/api/try-on/route.ts: in-memory buffer processing, zero disk persistence, 5MB limit, MIME validation, getHairTryOnProvider integration, timeout guard, and audit logging.
Deliver analysis.md and handoff.md in your working directory. Notify parent when complete via send_message.
