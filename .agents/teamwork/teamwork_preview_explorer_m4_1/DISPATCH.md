# Milestone 4 Explorer 1 Dispatch: Layout, Home Page & Blog CMS

## Identity & Objective
- Role: M4 Explorer 1 (Layout, Home Page & Blog)
- Working Directory: c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_explorer_m4_1
- Parent Orchestrator ID: daa96dc0-4b53-4192-88a0-f59f39a1f3f3

## Mandatory Inputs to Read:
1. `c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\ORIGINAL_REQUEST.md` (Features R1.1, R1.2, R1.7)
2. `c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\PROJECT.md`
3. Site Settings schema & API: `prisma/schema.prisma` (`SiteSetting`, `Banner`, `Article`), `/api/admin/settings`, `/api/admin/banners`, `/api/admin/articles`

## Exploration & Design Tasks:
1. **Public Layout & Branding (`app/(public)/layout.tsx`)**:
   - Header with luxury Obsidian Noir / Champagne Gold theme (`#0B0F17`, `#D4AF37`).
   - Sticky navigation, logo, mobile hamburger drawer, booking CTA button, hotline link.
   - Footer rendered dynamically from Site Settings (address, opening hours, social links, copyright).
2. **Dynamic Home Page (`app/(public)/page.tsx`)**:
   - Hero banner slider populated from active Banners.
   - Quick service categories grid.
   - Featured & trending hairstyles carousel.
   - Mini Before/After showcase slider.
   - Master stylists introduction section.
   - Customer testimonials/reviews section.
   - Latest hair care blog articles preview.
   - Direct CTA section to Try-On tool & Booking wizard.
3. **Blog & Hair Care Editorial (`app/(public)/blog/page.tsx` & `app/(public)/blog/[slug]/page.tsx`)**:
   - Article list with tag filtering, search, pagination, reading time indicator.
   - Article detail page with rich markdown rendering, author info, published date, related articles, dynamic Open Graph / SEO metadata.

Deliver your detailed blueprint in `analysis.md` and handoff in `handoff.md`.
Notify parent orchestrator via `send_message`.

## 2026-10-19T07:02:59Z
You are M4 Explorer 1 (Layout, Home Page & Blog).
Working Directory: c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_explorer_m4_1
Parent Orchestrator ID: daa96dc0-4b53-4192-88a0-f59f39a1f3f3

MANDATORY: Read ORIGINAL_REQUEST.md, PROJECT.md, and your DISPATCH.md.
Design the implementation blueprint for:
1. Public Layout & Branding (app/(public)/layout.tsx) with Obsidian Noir / Champagne Gold theme, sticky navbar, mobile drawer, footer from Site Settings.
2. Dynamic Home Page (app/(public)/page.tsx) with hero carousel, trending styles, mini before/after, testimonials, blog preview.
3. Blog & Editorial (app/(public)/blog/page.tsx, [slug]/page.tsx) with SEO metadata, tag filtering, reading time.
Deliver analysis.md and handoff.md in your working directory. Notify parent via send_message when complete.
