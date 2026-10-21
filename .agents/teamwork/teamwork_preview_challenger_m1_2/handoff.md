# BÁO CÁO BÀN GIAO KỸ THUẬT: MILESTONE 1 - EMPIRICAL CHALLENGE & ADVERSARIAL AUDIT

- **Đơn vị thực hiện:** M1 Challenger 2 (`teamwork_preview_challenger_m1_2`)
- **Vai trò:** Empirical Challenger (Critic, Specialist)
- **Parent Orchestrator:** `daa96dc0-4b53-4192-88a0-f59f39a1f3f3`
- **Thư mục làm việc:** `c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_challenger_m1_2`
- **Thời điểm hoàn tất:** 2026-10-19T02:45:00Z
- **Kết luận:** **CHALLENGE_DETECTED**

---

## 1. Observation

Tôi đã trực tiếp thiết kế bộ kiểm thử độc lập (`tests/stress-challenger.ts` với 103 invariant checks), tự tay thực thi toàn bộ 5 lệnh nghiệm thu bắt buộc và phân tích chi tiết siêu dữ liệu DMMF của Prisma, các ràng buộc quan hệ, hành vi cascade, bảo mật storage/try-on và tính ổn định biên dịch của dự án.

### 1.1. Kết quả thực thi các lệnh nghiệm thu chuẩn
1. `npx prisma validate`: **PASS (Exit code 0)**
   - Toàn bộ cú pháp `prisma/schema.prisma` hợp lệ.
2. `npx prisma generate`: **PASS (Exit code 0)**
   - Đã sinh mã Prisma Client v5.22.0 thành công vào `node_modules/@prisma/client`.
3. `npx tsc --noEmit`: **PASS (Exit code 0)**
   - Toàn bộ codebase đạt chuẩn TypeScript `strict: true` không có bất kỳ lỗi type nào.
4. `npm run build`: **PASS (Exit code 0)**
   - Next.js 14.2.15 hoàn thành build production thành công, tạo đầy đủ static pages (4/4).
5. `npm run test:e2e`: **PASS (Exit code 0)**
   - 15 suites, 67/67 test cases vượt qua trong chế độ SIMULATION.

### 1.2. Kết quả kiểm thử đối kháng thực nghiệm (Adversarial Stress Test: `tests/stress-challenger.ts`)
- **Tổng số invariants kiểm thử**: 103 checks
- **Thành công**: 97 checks
- **Phát hiện lỗi (Failures)**: 6 checks (Tập trung vào cơ chế MockStorage sanitization và delimiter parsing)

### 1.3. Các khiếm khuyết & điểm yếu bảo mật được xác minh thực nghiệm (Empirical Findings)

#### [Medium] Challenge 1: Regex số điện thoại chứa ký tự literal pipe `|` trong character class
- **Vị trí**: `lib/validations/booking.ts:7`
- **Mã nguồn quan sát**:
  ```typescript
  export const VIETNAMESE_PHONE_REGEX = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/;
  ```
- **Hành vi thực nghiệm**:
  Trong biểu thức chính quy (RegEx), bên trong dấu ngoặc vuông `[...]` (character class), ký tự `|` không mang ý nghĩa "hoặc" (alternation) mà là ký tự literal `|`.
  Do đó, chuỗi `'0|12345678'` hoặc `'+84|12345678'` được regex chấp nhận là số điện thoại hợp lệ!
  ```javascript
  VIETNAMESE_PHONE_REGEX.test('0|12345678') === true // BUG!
  ```
- **Hệ quả**: Cho phép dữ liệu số điện thoại sai định dạng lọt qua tầng validation của booking.
- **Biện pháp khắc phục**: Đổi thành `/^(0|\+84)[35789][0-9]{8}$/`.

#### [Medium] Challenge 2: Lỗ hổng Delimiter Parsing & Phục hồi đường dẫn trong MockStorageProvider
- **Vị trí**: `services/storage/mock.ts:18` và `services/storage/mock.ts:71-76`
- **Mã nguồn quan sát**:
  ```typescript
  // Line 18:
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  // Line 20:
  const publicId = `mock_${folder}_${timestamp}_${sanitizedFileName}`;
  // Line 71-76 (delete method):
  const parts = publicId.split('_');
  const folder = parts[1];
  const timestamp = parts[2];
  const fileName = parts.slice(3).join('_');
  ```
- **Hành vi thực nghiệm**:
  1. Khi người dùng truyền tên tệp có chứa path traversal như `../../../../etc/passwd`, regex `/[^a-zA-Z0-9.-]/g` giữ nguyên dấu chấm `.`, khiến chuỗi trở thành `.._.._.._.._etc_passwd`, làm lọt `..` vào `publicId` và `url`.
  2. Phương thức `delete()` sử dụng `publicId.split('_')`. Nếu tham số `folder` chứa dấu gạch dưới (ví dụ `folder = "hair_colors"` hoặc `folder = "before_after"`), `parts[1]` nhận giá trị `"hair"`, `parts[2]` nhận `"colors"`, làm sai lệch toàn bộ cấu trúc thư mục, timestamp và tên tệp, dẫn tới hàm `delete()` xóa nhầm hoặc không thể xóa tệp.
- **Biện pháp khắc phục**: Sử dụng `path.basename(fileName).replace(/[^a-zA-Z0-9_.-]/g, '_')` và tránh dùng dấu gạch dưới làm delimiter nếu folder có thể chứa dấu gạch dưới.

#### [Medium] Challenge 3: Lỗ hổng chèn mã XML / SVG không được mã hóa thực thể trong DemoHairTryOnProvider
- **Vị trí**: `services/try-on/demo.ts:68-70`
- **Mã nguồn quan sát**:
  ```typescript
  <text x="30" y="660" ...>Kiểu tóc: ${hairstyleLabel}</text>
  ```
- **Hành vi thực nghiệm**:
  Biến `hairstyleLabel` (hoặc `options.hairstyleTitle`) và `colorHex` được nối chuỗi trực tiếp vào XML template literal mà không qua hàm escape thực thể XML.
  Nếu tên kiểu tóc chứa ký tự `&` (ví dụ `"Uốn sóng & Nhuộm Layer"`), trình phân tích XML/SVG sẽ báo lỗi cú pháp do `&` không được đổi thành `&amp;`. Nếu chứa `</text><script>`, mã script có thể bị chèn vào tệp đồ họa vector SVG.
- **Biện pháp khắc phục**: Viết hàm `escapeXml(str)` để thay thế `&`, `<`, `>`, `"`, `'` trước khi đưa vào template SVG.

#### [Low] Challenge 4: Bất đồng bộ định danh giữa Prisma Schema và Zod Validation trong hủy lịch hẹn
- **Vị trí**: `prisma/schema.prisma:410` so với `lib/validations/booking.ts:86`
- **Mã nguồn quan sát**:
  - `prisma/schema.prisma`:
    ```prisma
    model Booking {
      ...
      cancellationReason String?
    }
    ```
  - `lib/validations/booking.ts`:
    ```typescript
    export const UpdateBookingStatusSchema = z.object({
      status: z.enum([...]),
      ...
      cancelReason: z.string().max(500).optional().nullable(),
    });
    ```
- **Hành vi thực nghiệm**:
  Trường trong cơ sở dữ liệu là `cancellationReason`, nhưng trường trong schema Zod cập nhật là `cancelReason`. Khi tầng API handler của M3 chuyển dữ liệu từ Zod vào Prisma update, nếu truyền trực tiếp `cancelReason` sẽ bị Prisma ném ngoại lệ TypeScript và runtime error `Unknown argument 'cancelReason'`.
- **Biện pháp khắc phục**: Đồng bộ tên trường thành `cancellationReason` trong cả Zod schema hoặc alias trường trong tầng Service.

#### [Low] Challenge 5: Thiếu trường `createdAt` trong `SiteSetting`
- **Vị trí**: `prisma/schema.prisma:490-511`
- **Mã nguồn quan sát**: Model `SiteSetting` chỉ có `updatedAt DateTime @updatedAt` mà không có trường `createdAt DateTime @default(now())`, lệch chuẩn với 13 model còn lại trong hệ thống.
- **Biện pháp khắc phục**: Bổ sung `createdAt DateTime @default(now())` vào model `SiteSetting`.

---

## 2. Logic Chain

1. **Từ kiểm thử cơ bản đến kiểm thử đối kháng (Observation 1.1 & 1.2):**  
   Worker M1-1 đã hoàn thành xuất sắc các yêu cầu kỹ thuật nền tảng: mã nguồn biên dịch sạch 100%, Next.js build không lỗi, Prisma generate client chuẩn xác và 67 bài test mô phỏng đều vượt qua. Điều này chứng minh khung kiến trúc M1 đã sẵn sàng cho luồng thông thường.
2. **Khám phá lỗi RegEx qua phân tích cú pháp lý thuyết số điện thoại (Observation 1.3 - Challenge 1):**  
   Khi kiểm tra chuỗi `0|12345678`, regex `/^(0|\+84)[3|5|7|8|9][0-9]{8}$/` trả về `true` vì `[3|5|7|8|9]` chứa ký tự `|`. Đây là lỗi kinh điển trong thiết kế regex khi nhầm lẫn giữa cú pháp alternation `(a|b)` và character class `[abc]`. Lỗi này cần được sửa ngay để bảo đảm toàn vẹn dữ liệu cho Milestone 4 (Public Booking Form).
3. **Phân tích cơ chế giải mã chuỗi phân tách tệp tin (Observation 1.3 - Challenge 2):**  
   Phương thức `MockStorageProvider.delete()` giả định `publicId.split('_')` luôn có đúng số phần tử xác định. Khi thư mục lưu trữ có dấu gạch dưới (`hair_colors`, `test_traversal`), hàm `split('_')` phá vỡ chỉ mục, dẫn tới đường dẫn tệp tin không tồn tại và rủi ro rò rỉ rác dữ liệu trên đĩa.
4. **Phân tích tính hợp lệ của chuẩn XML/SVG (Observation 1.3 - Challenge 3):**  
   Trong chuẩn XML/SVG, mọi chuỗi văn bản chứa `&` bắt buộc phải được mã hóa thành `&amp;`. Việc template literal nội suy trực tiếp chuỗi tiếng Việt hoặc tên dịch vụ thương mại có ký tự `&` sẽ khiến client (trình duyệt) từ chối render ảnh preview với lỗi XML parsing error.
5. **Kiểm tra tính toàn vẹn Relational Integrity của Prisma (Observation 1.2):**  
   Tuy nhiên, đối với phần lõi cơ sở dữ liệu:
   - Toàn bộ các quan hệ `onDelete: SetNull` đều trỏ vào trường có thuộc tính `isRequired: false` (nullable), triệt tiêu hoàn toàn rủi ro vi phạm ràng buộc NOT NULL của PostgreSQL.
   - Các quan hệ `onDelete: Restrict` (`Role`, `Category`, `Article.author`) bảo vệ dữ liệu nghiệp vụ không bị mồ côi hoặc xóa nhầm.
   - Quan hệ `onDelete: Cascade` trên `Session` dọn dẹp sạch sẽ token khi tài khoản bị xóa.

---

## 3. Caveats

- **Phạm vi Review-Only**: Theo quy định nghiêm ngặt của vai trò Challenger (`Review-only — do NOT modify implementation code`), tôi chỉ tạo tệp kiểm thử đối kháng `tests/stress-challenger.ts` để ghi nhận bằng chứng thực nghiệm, **tuyệt đối không can thiệp sửa đổi mã nguồn ứng dụng** trong `lib/`, `services/`, hay `prisma/`.
- **Môi trường Database**: Do máy chủ phát triển cục bộ không có dịch vụ PostgreSQL chạy trên cổng 5432, các bài kiểm tra được thực hiện thông qua mô hình phản chiếu siêu dữ liệu Prisma DMMF, kiểm tra kiểu dữ liệu TypeScript tĩnh và stress test Zod/Crypto/Service logic độc lập.

---

## 4. Conclusion

**PHÁN QUYẾT: CHALLENGE_DETECTED**

Mặc dù hệ thống cơ sở dữ liệu Prisma (14 models, 12 enums), Next.js build và bộ test E2E 67 tests đều hoạt động ổn định và đạt chuẩn 100% về mặt build, nhưng qua kiểm thử đối kháng thực nghiệm, Challenger đã phát hiện **5 điểm khiếm khuyết cần lưu ý và khắc phục** trước hoặc trong khi triển khai M2/M3:
1. Sửa lỗi regex số điện thoại `[3|5|7|8|9]` -> `[35789]`.
2. Sửa cơ chế escape XML trong `DemoHairTryOnProvider`.
3. Sửa hàm phân tách `publicId.split('_')` và bổ sung `path.basename` trong `MockStorageProvider`.
4. Đồng bộ tên trường `cancelReason` và `cancellationReason` giữa Zod và Prisma.
5. Bổ sung `createdAt` cho `SiteSetting`.

---

## 5. Verification Method

Để tái hiện độc lập toàn bộ các quan sát và chứng minh các lỗi trên, thực thi các lệnh sau từ thư mục gốc dự án:

1. **Chạy bộ kiểm thử đối kháng của Challenger 2 (103 invariant checks):**
   ```powershell
   npx tsx tests/stress-challenger.ts
   ```
   *Kết quả thực nghiệm:* Báo cáo chi tiết 6 lỗi đường dẫn/sanitization trong MockStorageProvider.

2. **Tái hiện lỗi Regex số điện thoại:**
   ```powershell
   npx tsx -e "import { VIETNAMESE_PHONE_REGEX } from './lib/validations/booking'; console.log('Pipe matched:', VIETNAMESE_PHONE_REGEX.test('0|12345678'));"
   ```
   *Kết quả thực nghiệm:* Trả về `Pipe matched: true` (chứng minh lỗi RegEx tồn tại).

3. **Tái hiện lỗi XML không escape ký tự `&` trong Try-On SVG:**
   ```powershell
   npx tsx -e "import { DemoHairTryOnProvider } from './services/try-on/demo'; new DemoHairTryOnProvider().processTryOn({ imageBuffer: Buffer.from('x'), mimeType: 'image/jpeg', hairstyleId: 'test', options: { hairstyleTitle: 'Cut & Color' } }).then(r => console.log('Contains unescaped &:', Buffer.from(r.resultImageBase64.replace('data:image/svg+xml;base64,', ''), 'base64').toString().includes('Cut & Color')));"
   ```
   *Kết quả thực nghiệm:* Trả về `Contains unescaped &: true` (chứng minh XML không escape).

4. **Xác minh các lệnh kiểm tra tiêu chuẩn của Milestone 1:**
   ```powershell
   npx prisma validate
   npx prisma generate
   npx tsc --noEmit
   npm run build
   npm run test:e2e
   ```
   *Kết quả thực nghiệm:* Toàn bộ 5 lệnh đều kết thúc với Exit code 0.
