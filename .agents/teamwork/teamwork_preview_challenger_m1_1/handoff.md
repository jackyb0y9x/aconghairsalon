# BÁO CÁO PHẢN BIỆN KỸ THUẬT: MILESTONE 1 - ADVERSARIAL CHALLENGE REPORT

- **Người thực hiện:** M1 Challenger 1 (`teamwork_preview_challenger_m1_1`)
- **Vai trò:** Critic, Empirical Specialist
- **Parent Orchestrator:** `daa96dc0-4b53-4192-88a0-f59f39a1f3f3`
- **Thư mục làm việc:** `c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_challenger_m1_1`
- **Kết luận:** **CHALLENGE_DETECTED** (Phát hiện lỗi kỹ thuật, sai sót kiểm thực và lỗ hổng biên)

---

## 1. Observation

Tôi đã trực tiếp chạy các lệnh kiểm chứng độc lập trên hệ thống và thiết lập bộ kiểm thử phản biện sâu (`tests/challenge_m1_harness.ts`) gồm 61 bài test biên và đối kháng (adversarial vectors).

### 1.1. Kết quả kiểm chứng độc lập các lệnh cơ sở từ Worker
1. `npx prisma validate`: **PASS (Exit 0)** - Prisma Schema hợp lệ, 14 models đầy đủ.
2. `npx tsc --noEmit`: **PASS (Exit 0)** - Không có lỗi cú pháp hoặc sai lệch kiểu dữ liệu tĩnh.
3. `npm run test:e2e`: **PASS (Exit 0, 67/67 tests passed)**.
   - *Phát hiện bất thường:* Bộ test `npm run test:e2e` chạy ở chế độ `SIMULATION` dựa trên `tests/harness/contract-simulator.ts`. Bản thân simulator này **tự viết lại logic kiểm tra độc lập** mà không gọi trực tiếp các module sản xuất trong `lib/validations/booking.ts` hay `services/try-on/demo.ts`. Điều này tạo ra điểm mù kiểm thử (testing blindspot).

### 1.2. Kết quả chạy bộ Harness Phản biện Biên & Đối kháng (`npx tsx tests/challenge_m1_harness.ts`)
```text
================================================================
       STARTING M1 EMPIRICAL ADVERSARIAL STRESS HARNESS         
================================================================
Total Challenges: 61 | Passed: 50 | Failed / Defect: 11
[CHALLENGER VERDICT]: CHALLENGE_DETECTED
Exit Code: 1
```

### 1.3. Trích dẫn trực tiếp các sai sót và lỗ hổng quan sát được

#### 1. Lỗi Regex số điện thoại chấp nhận ký tự `|` (Pipe)
- **Tệp:** `lib/validations/booking.ts`, Dòng 7:
  ```typescript
  export const VIETNAMESE_PHONE_REGEX = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/;
  ```
- **Hành vi quan sát:** Trong regex character class `[...]`, ký tự `|` không phải là toán tử "OR" (alternation) mà là ký tự `|` nguyên bản.
- **Chứng minh thực nghiệm:**
  - `VIETNAMESE_PHONE_REGEX.test('0|12345678')` trả về **`true`**
  - `VIETNAMESE_PHONE_REGEX.test('+84|12345678')` trả về **`true`**
- **Hậu quả:** Số điện thoại rác chứa dấu `|` vượt qua validation tầng frontend và backend, lưu vào database.

#### 2. Schema `CreateBookingSchema` không chặn giờ ngoài giờ mở cửa (Operating Hours Leak)
- **Tệp:** `lib/validations/booking.ts`, Dòng 17, 33-35:
  ```typescript
  export const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
  // Trong CreateBookingSchema:
  bookingTime: z.string({ required_error: 'Vui lòng chọn giờ hẹn' }).regex(TIME_REGEX, 'Giờ hẹn không hợp lệ (định dạng chuẩn HH:mm)'),
  ```
- **Hành vi quan sát:** Schema chỉ kiểm tra định dạng giờ `00:00 - 23:59`, hoàn toàn **không kiểm tra khung giờ mở cửa của salon** (`08:30 - 20:30`).
- **Chứng minh thực nghiệm:**
  - Payload `{ bookingTime: '02:30', ... }` (2 giờ rưỡi sáng) -> `CreateBookingSchema.safeParse()` trả về **`success: true`**!
  - Payload `{ bookingTime: '23:45', ... }` (11 giờ 45 đêm) -> `CreateBookingSchema.safeParse()` trả về **`success: true`**!
- **Hậu quả:** Khách hàng có thể đặt lịch hẹn vào ban đêm khi salon đã đóng cửa. Lưu ý rằng E2E test `TC2.5` pass là do `ContractSimulator` tự cài đặt điều kiện `body.bookingTime < '08:30' || body.bookingTime > '20:30'` trong file test simulator, che giấu thiếu sót trong production code.

#### 3. Chấp nhận `serviceId` chỉ toàn khoảng trắng (Missing Trim)
- **Tệp:** `lib/validations/booking.ts`, Dòng 24-26:
  ```typescript
  serviceId: z
    .string({ required_error: 'Vui lòng chọn dịch vụ' })
    .min(1, 'Vui lòng chọn dịch vụ'),
  ```
- **Hành vi quan sát:** Thiếu `.trim()`.
- **Chứng minh thực nghiệm:** Payload với `serviceId: "   "` (3 khoảng trắng) thỏa mãn `.min(1)` và trả về **`success: true`**.

#### 4. Thông báo lỗi sai lệch khi ngày đặt hẹn không tồn tại trên lịch
- **Tệp:** `lib/validations/booking.ts`, Dòng 61-73:
  ```typescript
  .refine(
    (data) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedDate = new Date(`${data.bookingDate}T00:00:00`);
      return selectedDate >= today;
    },
    { message: 'Ngày hẹn không thể là một ngày trong quá khứ', path: ['bookingDate'] }
  );
  ```
- **Hành vi quan sát:** Với ngày phi thực tế trong tương lai như `2026-02-31` (tháng 2 không có ngày 31), `new Date('2026-02-31T00:00:00')` trả về `Invalid Date` (`NaN`). Phép so sánh `NaN >= today` ra `false`, dẫn đến thông báo lỗi: `"Ngày hẹn không thể là một ngày trong quá khứ"`.
- **Hậu quả:** Báo lỗi sai bản chất nghiệp vụ, gây khó hiểu cho người dùng.

#### 5. Trình tạo ảnh Demo SVG sinh mã XML hỏng khi tiêu đề chứa ký tự `&`
- **Tệp:** `services/try-on/demo.ts`, Dòng 68:
  ```typescript
  <text x="30" y="660" fill="#E5E7EB" font-family="'Plus Jakarta Sans', sans-serif" font-size="14" font-weight="500">Kiểu tóc: ${hairstyleLabel}</text>
  ```
- **Hành vi quan sát:** Chuỗi `hairstyleLabel` được nối chuỗi trực tiếp vào XML template mà không encode ký tự đặc biệt XML.
- **Chứng minh thực nghiệm:** Khi kiểu tóc có tên chứa `&` (rất phổ biến tại salon như *"Cut & Style"* hoặc *"Uốn & Nhuộm Hàn Quốc"*), SVG sinh ra chứa thẻ `<text>Kiểu tóc: Cut & Style</text>`. Theo chuẩn XML 1.0, ký tự `&` chưa được escape thành `&amp;` gây lỗi nghiêm trọng `XML Parsing Error: not well-formed`.
- **Hậu quả:** Trình duyệt hoặc thẻ `<img>` không thể render được ảnh SVG Data URI này.

#### 6. Lỗ hổng XML / SVG Injection trong `DemoHairTryOnProvider`
- **Tệp:** `services/try-on/demo.ts`, Dòng 53, 68-70:
- **Hành vi quan sát:** Các tham số `hairstyleTitle` và `hairColorHex` không được làm sạch ký tự `<`, `>`, `"`.
- **Chứng minh thực nghiệm:** Gửi `hairstyleTitle: '</text><script>alert("XSS")</script><text>'` hoặc `hairColorHex: '#D4AF37" style="stroke:red'`. Kết quả là thẻ `<script>` được nhúng nguyên vẹn vào SVG payload Base64 Data URL.

#### 7. Không giới hạn biên độ `intensity` gây ra thuộc tính SVG không hợp lệ
- **Tệp:** `services/try-on/demo.ts`, Dòng 34, 53:
  ```typescript
  const intensity = request.options?.intensity ?? 0.85;
  <rect ... opacity="${(intensity * 0.35).toFixed(2)}" .../>
  ```
- **Hành vi quan sát:** `intensity` không được clamp trong khoảng `[0.0, 1.0]` như định nghĩa tại `services/try-on/types.ts`. Nếu truyền `intensity = -10`, thuộc tính SVG trở thành `opacity="-3.50"`, vi phạm đặc tả SVG W3C.

#### 8. MockStorageProvider giữ lại ký tự Directory Traversal `..`
- **Tệp:** `services/storage/mock.ts`, Dòng 18:
  ```typescript
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  ```
- **Hành vi quan sát:** Whitelist giữ lại dấu chấm `.`. Khi truyền `fileName = "../../etc/passwd.jpg"`, kết quả trở thành `.._.._etc_passwd.jpg`. Ký tự `..` được lưu nguyên trong `publicId` (`mock_folder_123_.._.._etc_passwd.jpg`).

#### 9. MockStorageProvider hoàn toàn bỏ qua `maxSizeBytes` và `allowedMimeTypes`
- **Tệp:** `services/storage/mock.ts`, Dòng 16-67:
- **Hành vi quan sát:** Tham số `options: UploadOptions` có khai báo `maxSizeBytes` và `allowedMimeTypes`, nhưng hàm `upload()` không thực hiện bất kỳ kiểm tra nào đối với 2 ràng buộc này. Khi upload 10MB file nhị phân với tùy chọn `maxSizeBytes: 5MB`, provider vẫn âm thầm chấp nhận.

#### 10. `formatPriceRange` không xử lý trường hợp đảo ngược `min > max`
- **Tệp:** `lib/utils.ts`, Dòng 32-37:
- **Hành vi quan sát:** `formatPriceRange(300000, 150000)` trả về `"300.000 - 150.000 ₫"`. Hàm thiếu chuẩn hóa `[Math.min(min, max), Math.max(min, max)]`.

---

## 2. Logic Chain

1. **Từ Quan sát 1.1:** Worker xác nhận các lệnh cơ sở `prisma validate`, `tsc --noEmit`, và `test:e2e` pass. Tuy nhiên, `test:e2e` chạy hoàn toàn trên mô hình `ContractSimulator` in-memory giả lập, không triệu gọi trực tiếp mã sản xuất trong `lib/validations/booking.ts` hay `services/try-on/demo.ts`. Do đó, kết quả pass của test suite không bảo đảm tính đúng đắn của các module sản xuất.
2. **Từ Quan sát 1.3.1:** Ký tự `|` trong biểu thức chính quy `[3|5|7|8|9]` của `VIETNAMESE_PHONE_REGEX` là ký tự literal, dẫn đến việc chấp nhận số điện thoại sai định dạng như `0|12345678`.
3. **Từ Quan sát 1.3.2:** Khác với bộ test simulator (tự gắn logic lọc giờ), schema sản xuất `CreateBookingSchema` chỉ áp dụng `TIME_REGEX` (24h) và không có bất kỳ bước `.refine()` nào để giới hạn khung giờ mở cửa của salon. Do đó, việc đặt lịch hẹn lúc 2 giờ sáng vẫn hợp lệ qua schema.
4. **Từ Quan sát 1.3.5 & 1.3.6:** Trong `DemoHairTryOnProvider`, dữ liệu chuỗi từ người dùng/CMS được nội suy trực tiếp vào cấu trúc XML của SVG mà không qua hàm escape các thực thể XML (`&` -> `&amp;`, `<` -> `&lt;`, v.v.). Điều này trực tiếp gây lỗi parse XML khi tiêu đề chứa ký tự `&` (ví dụ: tên kiểu tóc thông dụng "Cut & Style") và mở ra nguy cơ chèn mã Script độc hại vào SVG Data URL.
5. **Từ Quan sát 1.3.8 & 1.3.9:** `MockStorageProvider` thiếu kiểm tra ràng buộc dung lượng tệp (`maxSizeBytes`) và loại tệp (`allowedMimeTypes`), đồng thời để lọt ký tự `..` trong tên định danh tệp (`publicId`).
6. **Tổng hợp:** Các phát hiện trên là những sai sót kỹ thuật thực tế, có thể tái lập 100% bằng mã thực thi và có thể dẫn đến lỗi runtime hoặc lỗ hổng dữ liệu khi triển khai các Milestone tiếp theo (M2 - M5).

---

## 3. Caveats

- **Phạm vi kiểm thử:** Challenger tuân thủ nghiêm ngặt nguyên tắc **Review-only**, không sửa đổi bất kỳ tệp tin mã nguồn sản xuất nào của dự án.
- **Tác động đến Milestone 1:** Các lỗi trên không gây lỗi biên dịch TypeScript (`tsc --noEmit` vẫn exit code 0) hay lỗi build Next.js tĩnh, nhưng ảnh hưởng trực tiếp đến tính đúng đắn của dữ liệu nghiệp vụ và bảo mật luồng try-on/booking.
- **Khuyến nghị khắc phục:** Toàn bộ các lỗi đã được xác định vị trí chính xác đến từng dòng lệnh và có phương án sửa chữa tối ưu, đơn giản.

---

## 4. Conclusion

**PHÁN QUYẾT: CHALLENGE_DETECTED**

Yêu cầu Worker xử lý 10 điểm kỹ thuật sau trước khi chốt Milestone 1:

1. **Sửa Regex số điện thoại:** Đổi `[3|5|7|8|9]` thành `[35789]` trong `VIETNAMESE_PHONE_REGEX` tại `lib/validations/booking.ts:7`.
2. **Thêm xác thực giờ mở cửa trong `CreateBookingSchema`:** Thêm `.refine()` kiểm tra `bookingTime >= '08:30' && bookingTime <= '20:30'` với thông báo: *"Giờ hẹn phải nằm trong khung giờ mở cửa (08:30 - 20:30)"*.
3. **Thêm `.trim()` cho `serviceId`:** Đổi `z.string().min(1)` thành `z.string().trim().min(1)`.
4. **Sửa xác thực ngày lịch hợp lệ:** Kiểm tra `isNaN(selectedDate.getTime())` để thông báo lỗi ngày không hợp lệ thay vì báo "ngày trong quá khứ".
5. **Escape XML entities trong `DemoHairTryOnProvider`:** Tạo hàm helper `escapeXml(str)` để thay thế `&` -> `&amp;`, `<` -> `&lt;`, `>` -> `&gt;`, `"` -> `&quot;` trước khi nhúng vào SVG template.
6. **Clamp `intensity` trong `DemoHairTryOnProvider`:** Đảm bảo `intensity = Math.max(0, Math.min(1, request.options?.intensity ?? 0.85))`.
7. **Làm sạch Directory Traversal trong `MockStorageProvider`:** Loại bỏ chuỗi `..` trong tên tệp: `fileName.replace(/\.\./g, '').replace(/[^a-zA-Z0-9.-]/g, '_')`.
8. **Thực thi `maxSizeBytes` và `allowedMimeTypes` trong `MockStorageProvider`:** Ném `Error` nếu `options.maxSizeBytes && fileBuffer.length > options.maxSizeBytes` hoặc `options.allowedMimeTypes && !options.allowedMimeTypes.includes(mimeType)`.
9. **Chuẩn hóa khoảng giá trong `formatPriceRange`:** Hoán đổi nếu `min > max`.

---

## 5. Verification Method

Để kiểm chứng độc lập các phát hiện trên, thực thi lệnh sau từ thư mục gốc dự án:

```powershell
npx tsx tests/challenge_m1_harness.ts
```

*Kết quả kỳ vọng:*
- Chương trình xuất chi tiết 11 lỗi vi phạm với thông báo cụ thể.
- Exit code: 1 với dòng chữ `[CHALLENGER VERDICT]: CHALLENGE_DETECTED`.

Để kiểm chứng từng lỗi riêng biệt (ví dụ lỗi regex pipe):
```powershell
node -e "const { VIETNAMESE_PHONE_REGEX } = require('./lib/validations/booking.ts'); console.log('Chấp nhận dấu pipe:', VIETNAMESE_PHONE_REGEX.test('0|12345678'));"
```
*Kết quả:* In ra `true` chứng minh lỗi tồn tại.
