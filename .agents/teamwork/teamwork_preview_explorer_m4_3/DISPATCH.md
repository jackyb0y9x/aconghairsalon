# Milestone 4 Explorer 3 Dispatch: Multi-Step Booking Wizard & Services

## Identity & Objective
- Role: M4 Explorer 3 (Booking Wizard & Services Showcase)
- Working Directory: c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_explorer_m4_3
- Parent Orchestrator ID: daa96dc0-4b53-4192-88a0-f59f39a1f3f3

## Mandatory Inputs to Read:
1. `c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\ORIGINAL_REQUEST.md` (Features R1.6, R1.8)
2. `c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\PROJECT.md`
3. Existing booking validations & API: `lib/validations/booking.ts`, `app/api/bookings/route.ts`, `prisma/schema.prisma` (`Booking`, `Service`, `Stylist`)

## Exploration & Design Tasks:
1. **Services & Transparent Pricing (`app/(public)/services/page.tsx`)**:
   - Categorized service catalog (Haircut, Perm & Texture, Color & Balayage, Scalp & Treatment, Luxury Combos).
   - Transparent price tiers, estimated duration chips (e.g. 45 min, 120 min), pre-service preparation guide, post-service care recommendations.
   - Quick "Book Service" button passing `serviceId` to the booking wizard via URL params.
2. **Multi-Step Booking Wizard (`app/(public)/booking/page.tsx`)**:
   - 5-Step Progress Stepper:
     - Step 1: Select Main Service / Combo (with category tabs and price details).
     - Step 2: Choose Desired Hairstyle & Hair Color (optional / recommended pairings).
     - Step 3: Select Preferred Stylist (or "Any Available Master Stylist").
     - Step 4: Pick Date & Time Slot (interactive calendar, salon operating hours 08:30 - 20:30, slot availability check).
     - Step 5: Customer Details & Confirmation (Full name, phone with Vietnamese format validation, email, notes, booking summary with pricing breakdown).
   - Robust state management with URL param initialization (pre-selecting service or style).
   - Client-side Zod validation with real-time field error messaging.
   - High-concurrency anti-duplicate submission lock with generated `idempotencyKey` (UUID).
   - Submission state transitions: Submitting, Success Modal with Booking Code (`BKxxxxxx`), status banner, and calendar add link.

Deliver your detailed blueprint in `analysis.md` and handoff in `handoff.md`.
Notify parent orchestrator via `send_message`.


## 2026-10-19T07:03:00Z
You are M4 Explorer 3 (Booking Wizard & Services Showcase).
Working Directory: c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_explorer_m4_3
Parent Orchestrator ID: daa96dc0-4b53-4192-88a0-f59f39a1f3f3

MANDATORY: Read ORIGINAL_REQUEST.md, PROJECT.md, and your DISPATCH.md.
Design the implementation blueprint for:
1. Services & Transparent Pricing (app/(public)/services/page.tsx) with duration, price tiers, prep & care guides.
2. 5-Step Multi-Step Booking Wizard (app/(public)/booking/page.tsx) with service/stylist/datetime/customer steps, Zod client validation, operating hours check, and idempotency key lock.
Deliver analysis.md and handoff.md in your working directory. Notify parent via send_message when complete.
