# Handoff Report: Specification Mining for Public Website (R1) & Hair Try-On Tool (R2)

## 1. Observation
- Read dispatch assignment and authoritative requirements from `ORIGINAL_REQUEST.md`:
  - Lines 12-21: Section `### R1. Website thông tin (Public Website)` specifying the 7 core public modules: Home page with CMS-driven sections (hero banner, categories, trends, favorite styles, before/after slider, stylists, reviews, promotions, blog, contact, CTA); Hairstyle library with multi-criteria filters (Nam/Nữ/Unisex, Korean/Japanese/Classic/Minimalist, length, face shape, hair texture, care effort) and rich detail view; Hair color consultation & swatch library (warm/cool/neutral, groups, brightness, bleaching requirements, skin tone match, maintenance); Before/After showcase with 2-image slider and service filtering; Services & price list with duration, price ranges, and care notes; Multi-step online booking form with strict client/server validation, anti-duplicate protection, and pending confirmation banner; News & care advisory articles with dynamic SEO and Open Graph metadata.
  - Lines 22-28: Section `### R2. Trải nghiệm thử kiểu tóc trên ảnh cá nhân (Hair Try-On Tool)` specifying: portrait photo upload interface, hairstyle & color selection, simulation visualization; `HairTryOnProvider` abstract interface decoupling AI engine from UI; default demo/MVP provider with distinct mock visual indicator; full state handling (no photo, upload, processing, success, error, size exceeded, timeout); privacy & security constraints (server-side file validation, zero permanent photo storage, zero client-exposed API keys).
  - Lines 38-45: Section `### R4. Kiến trúc kỹ thuật và Cơ sở dữ liệu` specifying Next.js (App Router), TypeScript (`strict: true`), Tailwind CSS + shadcn/ui components, React Hook Form + Zod, PostgreSQL + Prisma ORM, external Object Storage abstraction, and serverless optimization for Vercel.
- Probed and synthesized the full specification report in `spec_report.md` (Total 50 discrete features discovered and 15 edge case specifications).

## 2. Logic Chain
- Step 1: `ORIGINAL_REQUEST.md` lines 12-21 explicitly require a high-end luxury public experience that is 100% CMS-driven and optimized for mobile devices. Therefore, the public subsystem is structured under the Next.js App Router route group `app/(public)` with corresponding server-side data fetching and client components where interactivity is needed (`components/public/*`).
- Step 2: The Hairstyle Library requires 6 distinct filter dimensions (Gender, Style, Length, Face Shape, Texture, Care Effort). To provide seamless deep linking, bookmarking, and SEO discoverability, these filters must synchronize bidirectionally with URL search parameters (`useSearchParams`).
- Step 3: The Multi-step Booking Form has critical business risks (duplicate submissions, spam, invalid slots). To address this, a 5-step wizard is specified with Zod validation on both client and server, client-side button state locking (`isSubmitting`), idempotency key tracking via UUID, and operating hour constraints (08:30 - 20:30).
- Step 4: Requirement R2 mandates the `HairTryOnProvider` abstraction so that third-party AI image APIs (e.g. Replicate, SDXL, Fal.ai) can be swapped in without modifying any frontend code. We defined a clean TypeScript interface (`HairTryOnProvider`) with a default `DemoHairTryOnProvider` providing composite previewing with simulated latency (1.5-2.5s) and `isMock: true` marking.
- Step 5: Privacy and serverless requirements dictate that user portrait images must never be saved to the serverless container filesystem. Thus, the `/api/try-on` route acts as an ephemeral in-memory proxy, validating magic bytes, checking size limits (<= 5MB), and returning base64/temporary data without disk persistence.

## 3. Caveats
- While `ORIGINAL_REQUEST.md` specifies that 3rd party AI APIs can be plugged in, the default implementation for Phase 1 must be the `DemoHairTryOnProvider` (MVP mock) to enable immediate offline testing and deterministic behavior without requiring paid 3rd party API tokens during initial development.
- Storage of reference images and CMS assets should follow the external Object Storage abstraction (Cloudinary / Supabase Storage), with fallback local mock static assets in `public/` for local development.

## 4. Conclusion
The specification mining for R1 (Public Website) and R2 (Hair Try-On Tool) is complete, comprehensive, and fully documented in `spec_report.md`. It covers:
- Complete breakdown of 7 public modules and the hair try-on tool.
- 50 discrete features enumerated with Category, Inputs, Outputs, Error Behavior, and Specification Source.
- 15 critical edge cases and boundary conditions with concrete behaviors.
- Complete Zod schemas, TypeScript provider interfaces, and API contracts.
The orchestrator and downstream implementation workers have all requisite architectural, UI, and data contracts to proceed with database schema design and feature implementation.

## 5. Verification Method
- Inspect specification report:
  `c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_spec_miner_survey_1\spec_report.md`
- Verify that all 50 features and 15 edge cases match `ORIGINAL_REQUEST.md` requirements.
- Verify TypeScript interface compliance: Interface definitions for `HairTryOnProvider` and `CreateBookingSchema` compile cleanly with `strict: true`.
- Invalidation condition: If any requirement in `ORIGINAL_REQUEST.md` regarding R1 or R2 is altered or if client-side AI API key exposure is introduced, this report must be amended.
