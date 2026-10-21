# Milestone 4 Explorer 2 Dispatch: Hairstyle Library, Colors & Before-After

## Identity & Objective
- Role: M4 Explorer 2 (Hairstyles, Colors & Before-After)
- Working Directory: c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_explorer_m4_2
- Parent Orchestrator ID: daa96dc0-4b53-4192-88a0-f59f39a1f3f3

## Mandatory Inputs to Read:
1. `c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\ORIGINAL_REQUEST.md` (Features R1.3, R1.4, R1.5)
2. `c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\PROJECT.md`
3. Prisma models & APIs: `Hairstyle`, `HairColor`, `BeforeAfter`, `/api/admin/hairstyles`, `/api/admin/colors`, `/api/admin/before-after`

## Exploration & Design Tasks:
1. **Hairstyle Exploration Library (`app/(public)/hairstyles/page.tsx`)**:
   - 6-criteria multi-filter synchronized with URL query params:
     1. Gender: All, Male, Female, Unisex (`gender`)
     2. Length: All, Short, Medium, Long (`length`)
     3. Face Shape: Oval, Round, Square, Heart, Long (`faceShape`)
     4. Texture: Straight, Wavy, Curly, Coily (`texture`)
     5. Care Effort: Low, Medium, High (`careLevel`)
     6. Category/Style Tag: Cut, Perm, Dye, Treatment (`category`)
   - Search bar with instant client/server filtering, active filter pills, reset button.
   - Hairstyle card with thumbnail, title, tags, starting price, favorite button, and "Try On" CTA.
2. **Hairstyle Detail Page (`app/(public)/hairstyles/[slug]/page.tsx`)**:
   - Multi-angle image gallery, face shape recommendations, maintenance advice, suitable hair colors, associated services, direct "Book this Style" and "Try On" buttons.
3. **Hair Color Swatches & Consultation (`app/(public)/colors/page.tsx`)**:
   - Filter by Tone (`WARM`, `COOL`, `NEUTRAL`), Color Group (Brown, Blonde, Red, Pastel, Ash, Fashion), and Bleach Requirement.
   - Interactive color swatch card with real hex preview, brightness scale, skin tone compatibility guide, and aftercare tips.
4. **Before/After Interactive Showcase (`app/(public)/before-after/page.tsx`)**:
   - Interactive split-image comparison slider (drag slider handle left/right to reveal before vs after).
   - Filter by service tag (Cut, Perm, Bleach, Dye, Treatment).
   - Card details: stylist, service, description, direct booking button.

Deliver your detailed blueprint in `analysis.md` and handoff in `handoff.md`.
Notify parent orchestrator via `send_message`.

## 2026-10-19T07:03:00Z
You are M4 Explorer 2 (Hairstyles, Colors & Before-After).
Working Directory: c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_explorer_m4_2
Parent Orchestrator ID: daa96dc0-4b53-4192-88a0-f59f39a1f3f3

MANDATORY: Read ORIGINAL_REQUEST.md, PROJECT.md, and your DISPATCH.md.
Design the implementation blueprint for:
1. Hairstyle Exploration Library (app/(public)/hairstyles/page.tsx) with 6-criteria URL-synced multi-filter.
2. Hairstyle Detail (app/(public)/hairstyles/[slug]/page.tsx) with multi-angle gallery, recommendations, try-on & booking links.
3. Hair Color Swatches & Consultation (app/(public)/colors/page.tsx) with tone/bleach filters, visual hex cards, skin tone guide.
4. Before/After Interactive Showcase (app/(public)/before-after/page.tsx) with drag-handle comparison slider.
Deliver analysis.md and handoff.md in your working directory. Notify parent via send_message when complete.
