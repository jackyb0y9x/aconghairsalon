# Dispatch: Survey Subagent 1 (Public Website & Hair Try-On Tool)

- Role: Specification Miner
- Working Directory: c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_spec_miner_survey_1
- Parent Orchestrator ID: daa96dc0-4b53-4192-88a0-f59f39a1f3f3
- Original Request File: c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\ORIGINAL_REQUEST.md

Task:
Read ORIGINAL_REQUEST.md thoroughly. Investigate and document all requirements, features, user flows, edge cases, and acceptance criteria for:
1. R1: Public Website
   - Home page: dynamic hero banner, highlighted categories (Nam, Nữ, Nhuộm, Chăm sóc), new trends, favorite styles, Before/After slider, stylists team, reviews, promotions, blog/advice articles, contact info, CTA. All CMS-driven.
   - Hairstyle library: multi-criteria search and filter (Nam/Nữ/Unisex, Korean/Japanese/Classic/Minimalist..., hair length, face shape, hair texture, care effort). Detailed style page with features, care advice, related services, price range, favorite button, booking / try-on CTA.
   - Hair color consultation & Swatch library: tone (warm/cool/neutral), color groups, brightness, bleaching requirement, matching skin tone, maintenance tips.
   - Before/After showcase: 2-image comparison slider, filter by service, links to style/service.
   - Services & Price list: detailed categories (Cut, Perm, Dye, Bleach, Treatment, Combo...), duration, price range, pre/post-care notes.
   - Multi-step online booking form: service selection, reference style, stylist, date/time, customer details, notes, client & server validation, anti-duplicate submission, pending confirmation banner.
   - News & advisory articles: care guides, trends, SEO metadata, Open Graph.
2. R2: Hair Try-On Tool
   - UI: portrait photo upload, hairstyle & color selection, simulation visualization.
   - Architecture: abstract `HairTryOnProvider` interface, pluggable AI Image API readiness without UI changes.
   - Default provider (MVP/demo provider): safe visual illustration, clearly distinguished between mock preview and actual AI.
   - User states: empty/no photo, uploading, processing, success, error, file size exceeded, timeout.
   - Privacy & security: server-side file validation, no permanent personal photo storage, zero client-exposed API keys.

Output:
Write a comprehensive specification report to `c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_spec_miner_survey_1\spec_report.md` and deliver a self-contained `handoff.md`. Notify parent when complete via `send_message`.


## 2026-10-19T02:07:05Z
From: daa96dc0-4b53-4192-88a0-f59f39a1f3f3
You are Survey Spec Miner 1.
Your working directory is: c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_spec_miner_survey_1
Parent Orchestrator ID: daa96dc0-4b53-4192-88a0-f59f39a1f3f3

MANDATORY: Read ORIGINAL_REQUEST.md at:
c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\ORIGINAL_REQUEST.md
Also read your dispatch instructions at:
c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_spec_miner_survey_1\DISPATCH.md

Your task is to conduct an exhaustive specification survey of:
1. R1: Public Website (Home, Hairstyle Library with multi-criteria filters, Color Swatch & Consultation, Before/After Slider, Services & Price List, Multi-step Booking Form with validation & anti-duplicate, News & Blog articles with SEO/OG).
2. R2: Hair Try-On Tool (UI, HairTryOnProvider interface abstraction, default demo provider, state handling, privacy & server-side validation).

Write your detailed findings to:
c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_spec_miner_survey_1\spec_report.md
and write a self-contained handoff report to:
c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_spec_miner_survey_1\handoff.md

When complete, use send_message to report completion to parent daa96dc0-4b53-4192-88a0-f59f39a1f3f3.
