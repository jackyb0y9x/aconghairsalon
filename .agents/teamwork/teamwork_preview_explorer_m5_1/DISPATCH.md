# Milestone 5 Explorer 1 Dispatch: Interactive Try-On UI & Client Flow

## Identity & Objective
- Role: M5 Explorer 1 (Interactive Try-On UI & Client Experience Specialist)
- Working Directory: c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_explorer_m5_1
- Parent Orchestrator ID: daa96dc0-4b53-4192-88a0-f59f39a1f3f3

## Mandatory Inputs to Read:
1. `c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\ORIGINAL_REQUEST.md` (Feature R1.7: Công cụ thử kiểu tóc trực quan)
2. `c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\PROJECT.md`
3. `services/try-on/types.ts` & `services/try-on/demo.ts`
4. Existing public layout and components in `components/public/*` and `lib/public-data.ts`

## Scope & Analysis Task:
Design the architectural blueprint and UI components for `app/(public)/try-on/page.tsx` and `components/public/TryOnClient.tsx`:
1. **Interactive Workspace Layout**: Obsidian Noir & Champagne Gold theme.
2. **Portrait Upload & Capture**: Drag-and-drop zone, file picker, camera capture option, frontal portrait guideline overlay (oval face frame guide), 5MB size warning, and instant client image preview.
3. **Hairstyle & Color Selector Trays**:
   - Hairstyle picker with gender filters and search.
   - Hair color swatch picker with tone tabs and sheen preview.
   - Intensity slider (0% to 100% color/style blend).
4. **State Machine Transitions**:
   - `EMPTY` -> `PHOTO_READY` -> `CONFIGURING` -> `PROCESSING` -> `SUCCESS` / `ERROR`.
   - Loading animation with luxury salon progress steps.
   - Before/After interactive split slider or tap-to-toggle view.
   - Simulation Disclaimer: "Hình ảnh mang tính chất tham khảo phong cách. Chuyên viên stylist sẽ trực tiếp tư vấn sắc độ và kết cấu tóc thực tế trước khi thực hiện."
5. **Post-Simulation CTAs**:
   - "Đặt Lịch Với Kiểu Tóc Này" (direct transfer to `/booking?hairstyleId=...&hairColorId=...`).
   - "Lưu Ảnh Kết Quả" (download high-res composite image).
   - "Thử Kiểu Khác" (reset to configuring).

Deliver `analysis.md` and `handoff.md` in your working directory. Notify parent when complete via `send_message`.


## 2026-10-19T13:26:44Z
You are M5 Explorer 1 (Interactive Try-On UI & Client Experience Specialist).
Working Directory: c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_explorer_m5_1
Parent Orchestrator ID: daa96dc0-4b53-4192-88a0-f59f39a1f3f3

MANDATORY: Read ORIGINAL_REQUEST.md, PROJECT.md, your DISPATCH.md, and services/try-on/types.ts & demo.ts.
Task: Design the implementation blueprint for the interactive Try-On UI (app/(public)/try-on/page.tsx, components/public/TryOnClient.tsx): upload zone, face guideline frame, hairstyle & color selector trays, intensity slider, before/after comparison toggle, state machine transitions, and CTAs.
Deliver analysis.md and handoff.md in your working directory. Notify parent when complete via send_message.
