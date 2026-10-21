# Handoff Report: Survey Spec Miner 2 (Admin CMS & RBAC — R3)

**Author:** Survey Spec Miner 2 (`teamwork_preview_spec_miner_survey_2`)  
**Parent Orchestrator:** `daa96dc0-4b53-4192-88a0-f59f39a1f3f3`  
**Working Directory:** `c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_spec_miner_survey_2`  
**Type:** Hard Handoff (Task Complete)

---

## 1. Observation
1. **Authoritative Specification Document**:
   - Location: `c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\ORIGINAL_REQUEST.md`
   - Lines 29–37 verbatim define requirement R3:
     > "### R3. Website quản trị (Admin CMS tại `/admin`)"
     > "- **Xác thực & Phân quyền (RBAC):** Đăng nhập an toàn, quản lý phiên làm việc, phân quyền theo vai trò (Super Admin, Content Admin, Booking Staff, Editor). Bảo vệ toàn bộ route `/admin` và API endpoints phía server."
     > "- **Dashboard quản trị:** Hiển thị số liệu thống kê thời gian thực từ cơ sở dữ liệu (tổng kiểu tóc, màu tóc, dịch vụ, bài viết, số lịch hẹn hôm nay, số lịch chờ xác nhận và hoạt động mới nhất)."
     > "- **Quản lý nội dung:** CRUD đầy đủ cho Banner trang chủ, Danh mục & Kiểu tóc, Bảng màu tóc, Bộ sưu tập Before/After, Dịch vụ & Combo, Bài viết tin tức chuẩn SEO."
     > "- **Quản lý lịch hẹn:** Danh sách lịch hẹn có tìm kiếm, lọc theo ngày/trạng thái; xem chi tiết, cập nhật trạng thái (Chờ xác nhận, Đã xác nhận, Hoàn thành, Hủy, Không đến), ghi chú nội bộ và gán stylist."
     > "- **Cấu hình hệ thống (Site Settings):** Quản lý động tên thương hiệu, logo, favicon, địa chỉ, hotline, giờ mở cửa, mạng xã hội, Google Maps nhúng, SEO mặc định và thông tin footer."
     > "- **Nhật ký hệ thống (Audit Logs):** Ghi nhận các thao tác quan trọng (đăng nhập, thêm/sửa/xóa nội dung, cập nhật trạng thái lịch hẹn) phục vụ truy vết và an toàn dữ liệu."
2. **Acceptance Criteria**:
   - Lines 54–61 verbatim mandate:
     > "- [ ] Phân hệ Public Website và Admin CMS hoạt động độc lập về layout, navigation và bảo mật."
     > "- [ ] Mọi route quản trị `/admin` và các API nội bộ đều từ chối truy cập trái phép nếu chưa đăng nhập hoặc không đủ thẩm quyền (Server-side session check)."
     > "- [ ] Thao tác CRUD trên Admin CMS (kiểu tóc, màu tóc, dịch vụ, banner, bài viết, cấu hình) lưu trữ thành công vào cơ sở dữ liệu và dữ liệu mới được hiển thị tương ứng ra ngoài Public Website."
     > "- [ ] Luồng đặt lịch hoàn tất từ lúc khách hàng gửi form ở Public Website đến khi xuất hiện trong danh sách quản lý của Admin CMS và quản trị viên có thể đổi trạng thái lịch hẹn."
3. **Workspace State**:
   - Workspace root currently contains only `.agents` and `ORIGINAL_REQUEST.md`, indicating a greenfield implementation phase.
   - Dispatch instructions confirmed our role as pure specification discovery and analysis.

---

## 2. Logic Chain
1. From Observation 1 (R3 requirements) and Observation 2 (Acceptance criteria), the Admin CMS requires 6 tightly integrated subsystems:
   - **Auth & RBAC**: Needs a 4-role hierarchy (`SUPER_ADMIN`, `CONTENT_ADMIN`, `BOOKING_STAFF`, `EDITOR`) with strict server-side protection at both Next.js App Router layout/middleware level and API route handlers (`/api/admin/*`).
   - **Dashboard Telemetry**: Must execute live SQL/Prisma aggregations on request rather than relying on stale cached data, specifically prioritizing the pending booking alert counter.
   - **Content Management**: Demands full CRUD capabilities for 6 distinct data models (Banners, Categories/Hairstyles, Hair Colors, Before/After showcases, Services/Combos, SEO Articles).
   - **Appointment Management**: Requires a rigorous 5-state finite state machine (`PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED`, `NO_SHOW`) with validation guards, internal notes, and stylist assignment.
   - **Site Settings**: Requires a centralized key-value or singleton configuration store with automatic Next.js cache revalidation (`revalidatePath`) on update.
   - **Audit Logs**: Requires an append-only, immutable event log capturing all state changes with diff payloads and actor credentials.
2. We mapped each subsystem to concrete REST endpoints, Prisma schema definitions, Zod validation rules, UI components, and error responses.
3. We identified 33 distinct features and 17 edge cases (including concurrent booking status updates, session timeout form preservation, unauthorized privilege escalation, aspect ratio mismatches in before/after images, and price range inversions).
4. All specifications have been compiled into `spec_report.md`.

---

## 3. Caveats
- No existing backend code exists yet in the workspace (greenfield build). All models, routes, and components specified here are ready for immediate generation by the architecture and implementation subagents.
- Image storage abstraction assumes an external Object Storage provider (e.g. Cloudinary or Supabase Storage) as mandated by R4.
- Third-party notification channels (e.g., automated SMS/Zalo messages upon appointment confirmation) are mapped as service hooks ready for plug-and-play integration.

---

## 4. Conclusion
The specification for **R3: Admin CMS & RBAC** is 100% complete, fully articulated, and documented in:
`c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_spec_miner_survey_2\spec_report.md`

Key Deliverables:
- **RBAC Matrix**: 4 roles across all administrative routes and API endpoints.
- **Feature Inventory**: 33 fully probed features with inputs, outputs, error behaviors, and acceptance criteria.
- **Edge Cases**: 17 edge conditions and handling protocols documented.
- **Database Schema**: Complete Prisma ORM schema models covering User, Role, Banner, Category, Hairstyle, HairColor, BeforeAfter, Service, ServiceCombo, Article, Booking, SiteSetting, and AuditLog.
- **Acceptance Tests**: Concrete end-to-end verification criteria for Milestone R3.

---

## 5. Verification Method
1. **File Inspection**:
   - Inspect `c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_spec_miner_survey_2\spec_report.md`
   - Verify presence of:
     - Section 2: Roles and RBAC Permission Matrix
     - Section 3: Dashboard live telemetry aggregations
     - Section 4: 6 Content Management CRUD specifications
     - Section 5: Appointment 5-state lifecycle diagram and transitions
     - Section 6: Site Settings dictionary and revalidation strategy
     - Section 7: Audit Log immutable event structure
     - Section 8: 33 Discovered Features Table
     - Section 9: 17 Edge Cases Table
     - Section 10: Complete Prisma Schema definitions
     - Section 11: Acceptance Criteria
2. **Invalidation Conditions**:
   - Any omission of the 4 specified roles (`SUPER_ADMIN`, `CONTENT_ADMIN`, `BOOKING_STAFF`, `EDITOR`).
   - Failure to specify server-side rejection for unauthorized access.
   - Any missing CRUD entity from the 6 specified in ORIGINAL_REQUEST.md § R3.3.
