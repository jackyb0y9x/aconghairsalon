# Original User Request

## 2026-10-19T02:04:23Z

Xây dựng ứng dụng web hoàn chỉnh phục vụ giới thiệu, quảng bá thương hiệu và hỗ trợ trải nghiệm dịch vụ cho Salon tóc Nam và Nữ hiện đại gồm hai phân hệ độc lập: Website thông tin (Public Website) và Website quản trị (Admin CMS) được tối ưu hóa cho Vercel và PostgreSQL.

Working directory: c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode
Integrity mode: development

## Requirements

### R1. Website thông tin (Public Website)
Phát triển giao diện web công khai chuẩn SEO, thân thiện di động với nhận diện thương hiệu cao cấp:
- **Trang chủ:** Hero banner động, danh mục nổi bật (Nam, Nữ, Nhuộm, Chăm sóc), xu hướng tóc mới, kiểu tóc yêu thích, Before/After slider, đội ngũ stylist, đánh giá khách hàng, ưu đãi, bài viết tư vấn, thông tin liên hệ và CTA. Toàn bộ nội dung hiển thị lấy từ CMS.
- **Thư viện kiểu tóc:** Tìm kiếm và lọc đa tiêu chí (đối tượng Nam/Nữ/Unisex, phong cách Hàn/Nhật/Cổ điển/Tối giản..., độ dài tóc, dáng khuôn mặt, chất tóc, mức độ chăm sóc). Trang chi tiết từng mẫu tóc đầy đủ đặc điểm, gợi ý chăm sóc, dịch vụ liên quan, giá tham khảo, nút lưu yêu thích và nút chuyển sang đặt lịch/thử tóc.
- **Tư vấn màu tóc & Swatch:** Thư viện màu tóc phân loại theo tông (ấm/lạnh/trung tính), nhóm màu, độ sáng, yêu cầu tẩy tóc, tông da phù hợp và lưu ý duy trì màu.
- **Bộ sưu tập Before/After:** Trực quan hóa kết quả thực tế với thanh trượt so sánh 2 ảnh (trước - sau), lọc theo dịch vụ và liên kết đến kiểu tóc/dịch vụ tương ứng.
- **Dịch vụ & Bảng giá:** Danh mục dịch vụ chi tiết (Cắt, Uốn, Nhuộm, Tẩy, Phục hồi, Combo...), thời lượng thực hiện, khoảng giá và lưu ý trước/sau khi làm.
- **Đặt lịch trực tuyến:** Form đặt lịch theo từng bước (chọn dịch vụ, kiểu tóc tham khảo, stylist, ngày/giờ hẹn, thông tin cá nhân khách hàng, ghi chú) có validation chặt chẽ, chống gửi trùng và hiển thị thông báo tiếp nhận yêu cầu chờ Salon xác nhận.
- **Chuyên mục tin tức & bài viết:** Hiển thị bài viết tư vấn chăm sóc tóc, xu hướng làm đẹp chuẩn SEO metadata và Open Graph.

### R2. Trải nghiệm thử kiểu tóc trên ảnh cá nhân (Hair Try-On Tool)
- Xây dựng giao diện thử nghiệm trực quan cho phép khách hàng tải ảnh chân portrait chính diện, chọn kiểu tóc và màu tóc trong thư viện để xem kết quả mô phỏng.
- Thiết kế kiến trúc dịch vụ với interface trừu tượng `HairTryOnProvider` độc lập, sẵn sàng tích hợp các AI Image API bên thứ ba mà không cần sửa đổi giao diện người dùng.
- Cung cấp triển khai mặc định (MVP / demo provider) minh họa trực quan an toàn, phân biệt rõ giữa kết quả minh họa và AI thực tế.
- Xử lý đầy đủ các trạng thái người dùng: chưa tải ảnh, đang upload, đang xử lý, thành công, lỗi, vượt quá kích thước hoặc hết thời gian chờ (timeout).
- Đảm bảo chính sách riêng tư: kiểm tra file ở server-side, không lưu trữ ảnh cá nhân vĩnh viễn và không để lộ API key ra phía client.

### R3. Website quản trị (Admin CMS tại `/admin`)
Phân hệ quản trị độc lập, bảo mật phía máy chủ:
- **Xác thực & Phân quyền (RBAC):** Đăng nhập an toàn, quản lý phiên làm việc, phân quyền theo vai trò (Super Admin, Content Admin, Booking Staff, Editor). Bảo vệ toàn bộ route `/admin` và API endpoints phía server.
- **Dashboard quản trị:** Hiển thị số liệu thống kê thời gian thực từ cơ sở dữ liệu (tổng kiểu tóc, màu tóc, dịch vụ, bài viết, số lịch hẹn hôm nay, số lịch chờ xác nhận và hoạt động mới nhất).
- **Quản lý nội dung:** CRUD đầy đủ cho Banner trang chủ, Danh mục & Kiểu tóc, Bảng màu tóc, Bộ sưu tập Before/After, Dịch vụ & Combo, Bài viết tin tức chuẩn SEO.
- **Quản lý lịch hẹn:** Danh sách lịch hẹn có tìm kiếm, lọc theo ngày/trạng thái; xem chi tiết, cập nhật trạng thái (Chờ xác nhận, Đã xác nhận, Hoàn thành, Hủy, Không đến), ghi chú nội bộ và gán stylist.
- **Cấu hình hệ thống (Site Settings):** Quản lý động tên thương hiệu, logo, favicon, địa chỉ, hotline, giờ mở cửa, mạng xã hội, Google Maps nhúng, SEO mặc định và thông tin footer.
- **Nhật ký hệ thống (Audit Logs):** Ghi nhận các thao tác quan trọng (đăng nhập, thêm/sửa/xóa nội dung, cập nhật trạng thái lịch hẹn) phục vụ truy vết và an toàn dữ liệu.

### R4. Kiến trúc kỹ thuật và Cơ sở dữ liệu
- Framework: Next.js (phiên bản ổn định mới nhất, App Router) với TypeScript ở chế độ `strict: true`.
- Giao diện: Tailwind CSS kết hợp shadcn/ui components, phong cách sang trọng, tối ưu cho thiết bị di động.
- Form & Validation: React Hook Form kết hợp Zod schema ở cả frontend và backend.
- Cơ sở dữ liệu & ORM: PostgreSQL sử dụng Prisma ORM. Thiết kế mô hình dữ liệu chuẩn hóa, quan hệ toàn vẹn, migration có thể tái tạo và bộ seed data phong phú phục vụ kiểm thử ngay sau khi cài đặt.
- Lưu trữ file/ảnh: Thiết kế abstraction tích hợp Object Storage bên ngoài (Cloudinary / Supabase Storage), không lưu file upload trên filesystem của serverless container.
- Tối ưu Serverless: Không phụ thuộc vào state trong RAM hoặc tiến trình chạy ngầm vô hạn; tương thích hoàn toàn khi triển khai trên Vercel.

## Acceptance Criteria

### 1. Build & Code Quality Verification
- [ ] TypeScript biên dịch thành công 100% không có lỗi type (`npx tsc --noEmit`).
- [ ] Next.js build production thành công không có lỗi (`npm run build`).
- [ ] Schema Prisma hợp lệ và sinh mã client thành công (`npx prisma validate && npx prisma generate`).
- [ ] Mã nguồn tuân thủ cấu trúc phân tầng rõ ràng (`app/(public)`, `app/admin`, `app/api`, `components/public`, `components/admin`, `components/ui`, `lib`, `services`, `types`, `prisma`).

### 2. Functional & Integration Verification
- [ ] Phân hệ Public Website và Admin CMS hoạt động độc lập về layout, navigation và bảo mật.
- [ ] Mọi route quản trị `/admin` và các API nội bộ đều từ chối truy cập trái phép nếu chưa đăng nhập hoặc không đủ thẩm quyền (Server-side session check).
- [ ] Thao tác CRUD trên Admin CMS (kiểu tóc, màu tóc, dịch vụ, banner, bài viết, cấu hình) lưu trữ thành công vào cơ sở dữ liệu và dữ liệu mới được hiển thị tương ứng ra ngoài Public Website.
- [ ] Luồng đặt lịch hoàn tất từ lúc khách hàng gửi form ở Public Website đến khi xuất hiện trong danh sách quản lý của Admin CMS và quản trị viên có thể đổi trạng thái lịch hẹn.
- [ ] Công cụ thử tóc xử lý đúng các trạng thái (loading, success, error) và tuân thủ abstraction `HairTryOnProvider`.
- [ ] Dự án có sẵn file `.env.example`, tài liệu `README.md` hướng dẫn chi tiết cách cài đặt, chạy migration, seed dữ liệu mẫu và các bước deploy lên Vercel.


## Follow-up — 2026-10-19T12:50:26Z

User requested to continue ('tiếp tục'). Please continue project execution: verify completion of Milestone 3, and proceed with Milestone 4 (Public Website frontend pages: hairstyles library & detail, colors swatches, before-after, services, booking wizard, blog), Milestone 5 (Hair Try-On tool with DemoHairTryOnProvider), and Milestone 6 (verification & production build).


## Follow-up — 2026-10-19T13:22:13Z

User requested to continue ('tiếp tục') following server restart. Please resume execution: collect M4 gate verdicts, close M4, and advance directly to Milestone 5 (Hair Try-On subsystem with DemoHairTryOnProvider and privacy proxy) and Milestone 6 (final verification, README, and production build).
