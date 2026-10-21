# Báo Cáo Thiết Kế Kiến Trúc & UI Giao Diện Thử Kiểu Tóc Trực Quan (Milestone 5)

**Chuyên viên:** M5 Explorer 1 (Interactive Try-On UI & Client Experience Specialist)  
**Phân hệ:** Public Website (`app/(public)/try-on/page.tsx`, `components/public/TryOnClient.tsx`)  
**Ngày thực hiện:** 2026-10-19  
**Mã yêu cầu:** R1.7 / R2 (Công cụ thử kiểu tóc trên ảnh cá nhân - Hair Try-On Tool)

---

## 1. Tổng Quan & Triết Lý Thiết Kế

Công cụ Thử Kiểu Tóc Trực Quan (Interactive Hair Try-On Atelier) là tính năng trọng tâm của phân hệ Public Website, cho phép khách hàng:
1. Tải ảnh chân dung cá nhân (hoặc chụp trực tiếp từ webcam/camera điện thoại).
2. Tự do ướm thử hơn 50+ mẫu tóc thịnh hành (Hàn Quốc, Paris Bob, Wolf Cut, Layer...) và bảng màu nhuộm phong phú.
3. Tinh chỉnh cường độ ánh màu & độ hòa trộn (Blend Intensity 0% - 100%).
4. Trực tiếp so sánh hiệu ứng Trước/Sau thông qua thanh trượt tương tác (Before/After Slider) hoặc thao tác chạm giữ.
5. Chuyển đổi liền mạch (Conversion) từ ảnh mô phỏng sang Đặt lịch hẹn làm tóc (`/booking?hairstyleId=...&hairColorId=...`) mà không làm mất thông tin lựa chọn.

### Nhận diện Thương hiệu (Luxury Obsidian Noir & Champagne Gold)
- Nền tảng màu sắc: `bg-salon-noir` (#0B0F17), thẻ bề mặt `bg-salon-charcoal` (#161B26), đường viền `border-salon-gold/30`, điểm nhấn `text-salon-gold` (#D4AF37), hiệu ứng tỏa sáng `shadow-gold-glow`.
- Typography: Font Serif thanh lịch (`font-serif`) cho tiêu đề và font sans-serif hiện đại (`font-sans`) cho nhãn điều khiển.
- Cam kết bảo mật sinh trắc học: Huy hiệu hiển thị cam kết xử lý hoàn toàn trong bộ nhớ đệm (RAM-only), không ghi đĩa serverless, bảo vệ tuyệt đối hình ảnh chân dung người dùng.

---

## 2. Kiến Trúc Trang Chủ Thử Tóc: `app/(public)/try-on/page.tsx`

`app/(public)/try-on/page.tsx` là Server Component chịu trách nhiệm nạp dữ liệu danh mục tóc và bảng màu song song từ database/memory-store và truyền xuống Client Component bên dưới.

### 2.1. Server Pre-fetching & SEO
- Gọi đồng thời `getPublicHairstyles({ pageSize: 100 })` và `getPublicColors()` từ `@/lib/public-data`.
- Cấu hình Metadata chuẩn SEO:
  - Title: `"Thử Kiểu Tóc & Màu Nhuộm AI Trực Quan | Salon Hoàng Gia Prestige"`
  - Description: `"Trải nghiệm mô phỏng hơn 50+ kiểu tóc Nam & Nữ và bảng màu nhuộm cao cấp trên gương mặt bạn trước khi cắt. Công nghệ bảo mật bộ nhớ đệm an toàn tuyệt đối."`
  - OpenGraph tags đầy đủ cho việc chia sẻ mạng xã hội.
- Cấu hình Dynamic Rendering: `export const revalidate = 0;` để hỗ trợ tiếp nhận dynamic URL search params (`?hairstyleId=...`, `?hairColorId=...`).

### 2.2. Header & Privacy Assurance Banner
- **Atelier Badge:** `"LUMIÈRE AI STYLING ATELIER • CÔNG NGHỆ THỬ TÓC TRỰC QUAN"`
- **Heading H1:** Chữ gradient vàng hoàng gia `"Gương Soi Phong Cách Trực Quan"`
- **Mô tả:** Giới thiệu ngắn gọn lợi ích trải nghiệm kiểu tóc trước khi cắt và cam kết bảo mật.
- **Huy hiệu Bảo Mật Biometric (Privacy Chip):**
  - Icon `ShieldCheck` (màu emerald/gold).
  - Nội dung: *"Cam kết bảo mật: Ảnh chân dung được xử lý trực tiếp trong bộ nhớ tạm thời (In-Memory RAM), không lưu trữ vĩnh viễn và không chia sẻ bên thứ ba."*

---

## 3. Kiến Trúc Client Component: `components/public/TryOnClient.tsx`

Component tương tác hai cột (Two-Column Workspace Layout) trên Desktop và ngăn xếp thông minh (Single Column Stack) kèm thanh điều khiển cố định (Sticky Action Bar) trên Mobile.

```
+-----------------------------------------------------------------------------------------+
|                                      HERO HEADER                                        |
|             LUMIÈRE AI STYLING ATELIER • GƯƠNG SOI PHONG CÁCH TRỰC QUAN                 |
+------------------------------------------------------------+----------------------------+
| CỘT TRÁI: WORKSPACE CANVAS & PREVIEW (5/12 hoặc 1/2)       | CỘT PHẢI: CONTROLS (7/12)  |
|                                                            |                            |
| +--------------------------------------------------------+ | +------------------------+ |
| | VÙNG HIỂN THỊ CHÂN DUNG / CAMERA / KẾT QUẢ SO SÁNH     | | | KHAY CHỌN KIỂU TÓC     | |
| |                                                        | | | - Tabs: Tất cả/Nữ/Nam  | |
| |  [ Khung Hướng Dẫn Bầu Dục Vàng (Oval Guide Frame) ]   | | | - Thanh tìm kiếm       | |
| |  [ Eye Level Line --------------------------------- ]   | | | - Lưới thẻ kiểu tóc    | |
| |  [ Chin Placement Marker \_________/               ]   | | +------------------------+ |
| |                                                        | |                            |
| |  * Trạng thái EMPTY: Dropzone + Nút Chụp Webcam        | | +------------------------+ |
| |  * Trạng thái PHOTO_READY: Ảnh gốc + Khung căn chỉnh   | | | KHAY CHỌN MÀU NHUỘM    | |
| |  * Trạng thái PROCESSING: Salon Multi-Step Loading     | | | - Tone: Ấm/Lạnh/Trung  | |
| |  * Trạng thái SUCCESS: Before/After Slider Tương Tác   | | | - Swatches ánh bóng    | |
| +--------------------------------------------------------+ | +------------------------+ |
|                                                            |                            |
| [ Huy hiệu DEMO SIMULATION ]                               | +------------------------+ |
| [ Khuyến cáo Stylist / Disclaimer ]                        | | THANH TRƯỢT CƯỜNG ĐỘ   | |
|                                                            | | (Intensity 0% - 100%)  | |
| CÁC NÚT ĐIỀU KHIỂN & HÀNH ĐỘNG DƯỚI CANVAS:               | +------------------------+ |
| [ Đặt Lịch Với Kiểu Này ]  [ Lưu Ảnh ]  [ Thử Kiểu Khác ]  |                            |
|                                                            | [ BẮT ĐẦU MÔ PHỎNG ] CTA   |
+------------------------------------------------------------+----------------------------+
```

---

## 4. Đặc Tả Chi Tiết 5 Phân Hệ Trải Nghiệm Khách Hàng

### 4.1. Phân Hệ 1: Vùng Tải & Chụp Ảnh Chân Dung (Portrait Ingestion)

#### A. Hỗ trợ Đa Phương Thức
1. **Kéo & Thả (Drag & Drop Zone):**
   - Hỗ trợ sự kiện `dragover`, `dragleave`, `drop`.
   - Hiệu ứng thị giác khi kéo file vào: Viền chuyển sang vàng rực rỡ (`border-salon-gold bg-salon-gold/10 scale-[1.01] transition-all duration-200`).
2. **Chọn Tệp (File Picker):**
   - Input ẩn `<input type="file" accept="image/jpeg,image/png,image/webp" />`.
   - Nút gọi tệp phong cách nút viền vàng sang trọng.
3. **Chụp Webcam/Camera Trực Tiếp (Live Camera Mode):**
   - Sử dụng WebRTC `navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } })`.
   - Khi bật, luồng video hiển thị trực tiếp bên trong Khung Hướng Dẫn Bầu Dục giúp khách hàng căn chỉnh khuôn mặt chuẩn xác trước khi bấm chụp.
   - Nút Chụp (Snapshot) vẽ frame video vào hidden `<canvas>` và xuất ra Blob/Data URL định dạng `image/jpeg`.
   - Nút Đổi Camera / Đóng Camera tiện lợi.
   - Fallback tự động trên thiết bị di động thông qua input capture: `<input type="file" accept="image/*" capture="user">`.

#### B. Khung Hướng Dẫn Chân Dung Chính Diện (Oval Face Guideline Frame)
- Lớp phủ bán trong suốt với đường viền bầu dục vàng đứt nét (Golden Oval Guide Overlay).
- Tích hợp 2 đường kẻ chuẩn nhân trắc học:
  - **Đường ngang mắt (Eye-level Reference Line):** Giúp định vị tầm mắt ở 1/3 phía trên bức ảnh.
  - **Vạch đáy cằm (Chin Reference Guide):** Đảm bảo góc chụp chính diện, không cúi hoặc ngửa mặt quá mức.
- Nút bật/tắt hướng dẫn (`Ẩn/Hiện khung căn chỉnh`) để khách hàng thoải mái xem lại ảnh mộc.
- Hộp gợi ý ngắn gọn (Tips):
  1. Giữ khuôn mặt chính diện, nhìn thẳng vào ống kính.
  2. Đảm bảo ánh sáng đều hai bên, tránh bóng đổ gắt.
  3. Vén tóc mai hoặc búi gọn gàng để lộ trán và đường viền xương hàm.

#### C. Kiểm Soát Giới Hạn & Phòng Vệ Client-Side
- **Giới hạn dung lượng 5MB:** Hằng số `MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024` (5MB).
  - Kiểm tra `file.size` ngay lập tức tại trình duyệt.
  - Nếu `> 5MB`: Hiển thị cảnh báo màu hổ phách/đỏ: *"Dung lượng ảnh vượt quá 5MB ({size}MB). Vui lòng chọn ảnh nhỏ hơn để đảm bảo tốc độ mô phỏng."* Không gửi request lên server!
- **Kiểm tra định dạng MIME:** Chỉ cho phép `image/jpeg`, `image/png`, `image/webp`.
  - Nếu chọn file GIF, PDF, hoặc tệp văn bản: Lập tức từ chối và báo lỗi: *"Định dạng ảnh không được hỗ trợ. Vui lòng chọn ảnh JPG, PNG hoặc WebP."*
- **Xem trước ảnh tức thì (Instant Client Preview):** Dùng `FileReader.readAsDataURL` hoặc `URL.createObjectURL` cho trải nghiệm zero-latency.

---

### 4.2. Phân Hệ 2: Khay Chọn Kiểu Tóc & Bảng Màu Nhuộm

#### A. Khay Chọn Kiểu Tóc (Hairstyle Picker Tray)
- **Bộ lọc Đối Tượng (Gender Tabs):** `TẤT CẢ`, `NỮ`, `NAM`, `UNISEX`.
- **Thanh Tìm Kiếm Nhanh (Live Search):** Lọc theo tên kiểu tóc, phong cách (Hàn Quốc, French Bob, Wolf Cut, Layer...) và độ dài tóc.
- **Thẻ Kiểu Tóc (Hairstyle Cards):**
  - Kích thước thẻ trực quan với ảnh mẫu chất lượng cao.
  - Hiển thị nhãn phong cách (`styleVibe`), độ dài (`length`), mức độ chăm sóc (`careEffort`).
  - Giá tham khảo (`formatVND(price)`).
  - Trạng thái được chọn: Hiệu ứng viền vàng đôi (`ring-2 ring-salon-gold shadow-gold-glow`), huy hiệu tích xanh vàng ở góc trên bên phải.
- **Tự động đồng bộ URL (Deep-link Integration):**
  - Đọc `searchParams.get('hairstyleId')` hoặc `searchParams.get('styleId')`.
  - Tự động kích hoạt chọn kiểu tóc tương ứng ngay khi người dùng truy cập từ trang chi tiết kiểu tóc (`/hairstyles/[slug]`).

#### B. Khay Chọn Màu Tóc & Ánh Sắc (Hair Color Swatch Tray)
- **Bộ lọc Tông Màu (Tone Tabs):** `TẤT CẢ`, `TÔNG ẤM` (WARM), `TÔNG LẠNH` (COOL), `TRUNG TÍNH` (NEUTRAL).
- **Tùy chọn Mặc Định:** *"Giữ màu tóc nguyên bản / Không nhuộm"* (bỏ chọn mã màu, chỉ mô phỏng phom tóc).
- **Thẻ Màu (Color Swatches):**
  - Mẫu màu tròn/bo góc lớn với mã màu thực (`hexCode` / `hexColor`).
  - Lớp phủ ánh bóng (Sheen preview gradient) tạo cảm giác sợi tóc bóng mượt dưới ánh đèn salon.
  - Nhãn cảnh báo tẩy tóc: Huy hiệu `Tẩy tóc` (Vàng/Cam) hoặc `Không tẩy` (Xanh ngọc).
  - Trạng thái được chọn: Vòng tròn viền vàng kép và dấu tích nổi bật.
  - Tự động đồng bộ URL: Đọc `searchParams.get('hairColorId')` hoặc `searchParams.get('colorId')`.

#### C. Thanh Trượt Cường Độ (Intensity Slider)
- Thanh trượt giá trị từ `0%` đến `100%` (mặc định: `85%` tương ứng `0.85` trong `TryOnRequest.options.intensity`).
- Tùy biến thanh trượt theo phong cách hoàng gia:
  - Rãnh trượt nền tối, phần đã kéo có dải gradient vàng óng.
  - Nút kéo tròn viền vàng sáng có đổ bóng phát quang `shadow-gold-glow`.
- Hiển thị văn bản giải thích sinh động theo ngưỡng:
  - `0% - 35%`: *"Ánh sắc nhẹ thoang thoảng tự nhiên"*
  - `40% - 75%`: *"Sắc độ tiêu chuẩn, hài hòa với khuôn mặt"*
  - `80% - 100%`: *"Sắc nét rực rỡ, chuẩn màu thời trang Haute Couture"*

---

### 4.3. Phân Hệ 3: Máy Trạng Thái Tương Tác (State Machine Transitions)

Toàn bộ quy trình trải nghiệm tuân thủ máy trạng thái 5 bước chặt chẽ:

```
[ EMPTY ]
   │
   │ (Người dùng tải ảnh hoặc chụp webcam)
   ▼
[ PHOTO_READY ]
   │
   │ (Chọn kiểu tóc từ khay)
   ▼
[ CONFIGURING ]  ◄───────────────────────────────────────┐
   │                                                     │
   │ (Nhấn "Bắt đầu mô phỏng phong cách")                │ ("Thử kiểu khác"
   ▼                                                     │  giữ nguyên ảnh)
[ PROCESSING ] (Hiệu ứng 4 bước Salon)                   │
   │                                                     │
   ├───────────────(Thành công 200 OK)──────────────┐    │
   │                                                ▼    │
   │                                           [ SUCCESS ]
   │                                                │
   │ (Lỗi mạng / 400 / 413 / timeout)               │ (Tải ảnh mới)
   ▼                                                ▼
[ ERROR ] ────────────────────────────────────► [ EMPTY ]
```

#### Chi Tiết Các Trạng Thái:

1. **`EMPTY`:**
   - Chưa có ảnh.
   - Hiển thị Dropzone kèm Khung Hướng Dẫn mờ và nút Chụp Webcam.
   - Khay chọn tóc và màu vẫn cho phép xem trước nhưng nút Mô Phỏng hiển thị thông báo: *"Vui lòng tải ảnh chân dung trước"*.

2. **`PHOTO_READY`:**
   - Ảnh đã được load vào state client.
   - Khung Hướng Dẫn hiển thị rõ trên ảnh người dùng.
   - Nếu chưa chọn kiểu tóc: Hộp thoại khuyến khích: *"Bước tiếp theo: Hãy chọn một kiểu tóc bạn yêu thích ở khay bên phải."*

3. **`CONFIGURING`:**
   - Đã có ảnh và đã chọn kiểu tóc.
   - Nút chính chuyển sang trạng thái sẵn sàng: *"Bắt đầu mô phỏng diện mạo mới"* (Nền gradient vàng, hiệu ứng nhấp nháy thu hút).
   - Cho phép điều chỉnh màu nhuộm và thanh trượt cường độ.

4. **`PROCESSING`:**
   - Đang gửi request `POST /api/try-on` với payload `{ imageBase64, mimeType, hairstyleId, hairColorId, options: { intensity, hairstyleTitle, hairColorHex } }`.
   - Màn hình chuyển sang giao diện Loading sang trọng với thanh tiến trình 4 giai đoạn mô phỏng thời gian thực (1.5s - 2.0s):
     - **Bước 1 (0% - 25%):** *"Phân tích cấu trúc khuôn mặt và chất tóc..."*
     - **Bước 2 (25% - 60%):** *"Căn chỉnh tỉ lệ phom tóc [Tên Kiểu Tóc]..."*
     - **Bước 3 (60% - 85%):** *"Hòa sắc phủ màu [Tên Màu Tóc] (Độ đậm {intensity}%)..."*
     - **Bước 4 (85% - 100%):** *"Hoàn tất diện mạo & áp dụng ánh sáng chuẩn Salon..."*
   - Vòng tròn hạt vàng kim chuyển động (Golden shimmer pulse animation).

5. **`SUCCESS`:**
   - Nhận phản hồi thành công từ API (`TryOnResponse`).
   - Hiển thị kết quả kèm hai chế độ so sánh:
     - **Chế độ 1: Thanh trượt so sánh phân chia (Split Before/After Slider):** Tái sử dụng component `BeforeAfterSlider.tsx` với ảnh Trước là ảnh gốc khách hàng, ảnh Sau là ảnh composite mô phỏng.
     - **Chế độ 2: Nhấn giữ so sánh tức thì (Press-and-Hold Preview):** Khách hàng nhấn giữ nút để xem ảnh mộc và thả tay để thấy kết quả.
   - **Huy hiệu phân biệt rõ ràng:** Badge `"DEMO SIMULATION"` với chấm vàng phát sáng (Đáp ứng tuyệt đối tiêu chuẩn R2).
   - **Khuyến cáo bắt buộc từ Stylist:**
     > *"Hình ảnh mang tính chất tham khảo phong cách. Chuyên viên stylist sẽ trực tiếp tư vấn sắc độ và kết cấu tóc thực tế trước khi thực hiện."*
   - Thông số xử lý: Hiển thị thời gian hoàn thành (ví dụ: `1.8 giây`) và Provider xử lý.

6. **`ERROR`:**
   - Hiển thị khi gặp lỗi (Kích thước > 5MB, mạng chập chờn, API timeout > 15s).
   - Thông báo lỗi tiếng Việt dễ hiểu, phân loại cụ thể theo mã HTTP (400, 413, 504, 500).
   - Nút hành động:
     - *"Thử lại"* (Giữ nguyên cấu hình và gửi lại).
     - *"Đặt lịch tư vấn trực tiếp với Stylist"* (Chuyển sang đặt lịch hẹn salon).

---

### 4.4. Phân Hệ 4: Các Nút Hành Động Sau Khi Thử Tóc (Post-Simulation CTAs)

Sau khi có kết quả mô phỏng ưng ý, khách hàng được cung cấp 3 hành động chiến lược:

1. **CTA Chính (Primary Gold Button): "Đặt Lịch Với Kiểu Tóc Này"**
   - Chuyển hướng trực tiếp sang trang đặt lịch:
     `/booking?hairstyleId=${selectedHairstyle.id}&hairColorId=${selectedColor?.id || ''}&notes=${encodeURIComponent('Khách hàng đã thử trên công cụ Try-On và ưng ý kiểu này')}`
   - Trang `/booking` (với `BookingWizardClient.tsx`) tự động bắt lấy `hairstyleId` và `hairColorId`, tự động tick chọn dịch vụ liên quan và kiểu tóc tại Bước 2, giúp tỷ lệ chuyển đổi đạt tối đa.

2. **CTA Phụ (Secondary Outlined Button): "Lưu Ảnh Kết Quả"**
   - Tải file ảnh kết quả trực tiếp về máy người dùng với tên tệp chuẩn hóa:
     `lumiere-tryon-${hairstyleSlug}-${Date.now()}.png` (hoặc `.svg`).
   - Sử dụng cơ chế tạo thẻ `<a>` ảo với thuộc tính `download` và click tự động, không yêu cầu cấp quyền phức tạp.

3. **CTA Điều Hướng: "Thử Kiểu Khác" & "Tải Ảnh Mới"**
   - *"Thử Kiểu Khác"*: Chuyển trạng thái về `CONFIGURING`, giữ nguyên ảnh chân dung đã tải, cho phép chọn mẫu tóc hoặc màu tóc khác để thử nghiệm liên tục.
   - *"Tải Ảnh Mới"*: Chuyển trạng thái về `EMPTY`, dọn sạch bộ nhớ đệm client để bắt đầu phiên thử với ảnh mới.

---

## 5. Bản Thiết Kế Mã Nguồn Chi Tiết (Implementation Blueprints)

### 5.1. File `app/(public)/try-on/page.tsx`

```tsx
import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { ShieldCheck, Sparkles, Wand2 } from 'lucide-react';
import { getPublicHairstyles, getPublicColors } from '@/lib/public-data';
import { TryOnClient } from '@/components/public/TryOnClient';

export const metadata: Metadata = {
  title: 'Thử Kiểu Tóc & Màu Nhuộm AI Trực Quan | Salon Hoàng Gia Prestige',
  description: 'Trải nghiệm mô phỏng hơn 50+ kiểu tóc Nam & Nữ và bảng màu nhuộm cao cấp trên gương mặt bạn trước khi cắt. Công nghệ bảo mật bộ nhớ đệm an toàn tuyệt đối.',
  openGraph: {
    title: 'Thử Kiểu Tóc & Màu Nhuộm AI Trực Quan | Salon Hoàng Gia Prestige',
    description: 'Trải nghiệm mô phỏng 50+ kiểu tóc và màu nhuộm thời thượng trên ảnh chân dung cá nhân.',
  },
};

export const revalidate = 0; // Dynamic try-on tool supporting deep-links

export default async function TryOnPage() {
  // Fetch hairstyles and colors in parallel
  const [hairstylesResult, colorsResult] = await Promise.all([
    getPublicHairstyles({ pageSize: 100 }),
    getPublicColors(),
  ]);

  return (
    <div className="min-h-screen bg-salon-noir text-white">
      {/* Hero Header Section */}
      <section className="relative pt-24 pb-10 px-4 sm:px-6 lg:px-8 border-b border-salon-gold/15 overflow-hidden">
        <div className="max-w-7xl mx-auto text-center relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-salon-gold/30 bg-salon-gold/10 text-salon-gold-light text-xs font-semibold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5 text-salon-gold animate-pulse" />
            <span>AI Styling Atelier • Công Nghệ Thử Tóc Trực Quan</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-salon-gold-light via-salon-gold to-salon-gold-dark">
            Gương Soi Phong Cách Trực Quan
          </h1>

          <p className="text-neutral-300 max-w-2xl mx-auto text-sm md:text-base font-light leading-relaxed">
            Ướm thử ngay các kiểu tóc thời thượng và sắc màu nhuộm cao cấp trên gương mặt bạn trước khi thực hiện. Khám phá phiên bản hoàn hảo nhất của chính mình.
          </p>

          {/* Biometric Privacy Assurance Chip */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs mt-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Cam kết bảo mật: Ảnh chân dung xử lý trong bộ nhớ tạm (In-Memory RAM), không lưu trữ trên máy chủ</span>
          </div>
        </div>
      </section>

      {/* Main Interactive Try-On Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Suspense
          fallback={
            <div className="py-28 text-center space-y-4">
              <div className="w-12 h-12 mx-auto rounded-full border-2 border-salon-gold border-t-transparent animate-spin" />
              <p className="text-salon-gold-light font-medium text-sm animate-pulse">
                Đang khởi tạo không gian gương soi trực quan...
              </p>
            </div>
          }
        >
          <TryOnClient
            initialHairstyles={hairstylesResult.items}
            initialColors={colorsResult.colors}
          />
        </Suspense>
      </main>
    </div>
  );
}
```

---

### 5.2. File `components/public/TryOnClient.tsx` (Bản Đặc Tả Cấu Trúc Toàn Diện)

```tsx
'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  UploadCloud,
  Camera,
  RotateCcw,
  Sparkles,
  Calendar,
  Download,
  AlertCircle,
  CheckCircle2,
  Sliders,
  Eye,
  EyeOff,
  Search,
  Scissors,
  Palette,
  Layers,
  ShieldCheck,
  Check,
  ArrowRight,
  RefreshCw,
  X,
} from 'lucide-react';
import { BeforeAfterSlider } from '@/components/public/BeforeAfterSlider';
import { formatVND } from '@/lib/utils';

// Maximum file size: 5MB
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export type TryOnStepState = 'EMPTY' | 'PHOTO_READY' | 'CONFIGURING' | 'PROCESSING' | 'SUCCESS' | 'ERROR';

export interface HairstyleOption {
  id: string;
  name: string;
  title?: string;
  slug: string;
  coverImageUrl?: string;
  gender: string;
  length?: string;
  style?: string;
  styleVibe?: string;
  price?: number;
  features?: string[];
}

export interface HairColorOption {
  id: string;
  name: string;
  code?: string;
  hexCode?: string;
  hexColor?: string;
  secondaryHex?: string | null;
  tone: string;
  group?: string;
  requiresBleach?: boolean;
}

interface TryOnClientProps {
  initialHairstyles: HairstyleOption[];
  initialColors: HairColorOption[];
}
```

#### Các Khối Chức Năng Chính Bên Trong `TryOnClient`:

1. **State Management:**
   - `stepState`: Quản lý 5 trạng thái (`EMPTY`, `PHOTO_READY`, `CONFIGURING`, `PROCESSING`, `SUCCESS`, `ERROR`).
   - `userImageBase64`: Dữ liệu ảnh chân dung người dùng (dạng Data URL base64).
   - `userImageMime`: MIME type chuẩn xác (`image/jpeg`, `image/png`, `image/webp`).
   - `selectedHairstyle`: Kiểu tóc được chọn (Object hoặc null).
   - `selectedColor`: Màu tóc được chọn (Object hoặc null).
   - `intensity`: Mức độ ánh màu (0.00 đến 1.00, mặc định `0.85`).
   - `simulationResult`: Kết quả trả về từ API (`resultImageBase64`, `processingTimeMs`, `provider`, `isMock`, `notice`).
   - `showGuidelines`: Boolean bật/tắt khung bầu dục hướng dẫn khuôn mặt.
   - `isCameraActive`: Boolean bật/tắt modal chụp trực tiếp webcam.
   - `progressStep`: Số thứ tự bước loading salon (1 đến 4) hiển thị trong trạng thái `PROCESSING`.
   - `errorMessage`: Chuỗi thông báo lỗi khi có ngoại lệ.

2. **Webcam Capture Hook & Canvas Stream:**
   - Tham chiếu `videoRef` và `canvasRef`.
   - Phương thức `startCamera()`, `stopCamera()`, `capturePhoto()`.
   - Lớp phủ khung hướng dẫn hiển thị trực tiếp trên video stream để căn góc mặt chuẩn nhất.

3. **Drag & Drop & Validation Engine:**
   - Xử lý file đầu vào an toàn.
   - Kiểm tra kích thước `< 5MB` và MIME type hợp lệ.
   - Tạo ảnh Data URL và tự động chuyển trạng thái sang `PHOTO_READY` (hoặc `CONFIGURING` nếu đã có `hairstyleId` từ URL).

4. **URL SearchParams Syncer:**
   - Tự động bắt `hairstyleId` và `hairColorId` từ URL khi người dùng chuyển hướng từ các trang khác đến.

5. **Simulation Execution (`handleSimulate`):**
   - Chuyển `stepState` sang `PROCESSING`.
   - Kích hoạt timer luân phiên đổi 4 thông điệp salon cao cấp.
   - Gọi `fetch('/api/try-on', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(...) })`.
   - Xử lý phản hồi 200 OK -> Lưu `simulationResult`, chuyển sang `SUCCESS`.
   - Bắt lỗi HTTP 400, 413, 500 -> Lưu `errorMessage`, chuyển sang `ERROR`.

6. **Comparison Engine (Interactive Before/After Slider):**
   - Khi ở trạng thái `SUCCESS`, render `BeforeAfterSlider` với:
     - `beforeImageUrl={userImageBase64}` (Ảnh trước khi làm).
     - `afterImageUrl={simulationResult.resultImageBase64}` (Ảnh kết quả mô phỏng).
   - Tích hợp thêm nút "Nhấn giữ xem ảnh gốc" dành cho người dùng di động muốn so sánh tức thì bằng một chạm.

7. **CTAs & Booking Link Builder:**
   - Nút "Đặt Lịch Với Kiểu Tóc Này":
     - `href={`/booking?hairstyleId=${selectedHairstyle.id}&hairColorId=${selectedColor?.id || ''}`}`
   - Nút "Lưu Ảnh Kết Quả":
     - Khởi tạo thẻ `<a>` ảo với `href={simulationResult.resultImageBase64}` và `download="lumiere-tryon-result.svg"`, tự động kích hoạt `click()`.
   - Nút "Thử Kiểu Khác":
     - Đặt `stepState = 'CONFIGURING'` và giữ nguyên `userImageBase64`.

---

## 6. Ma Trận Xử Lý Lỗi & Tình Huống Biên (Edge Cases Matrix)

| Tình huống biên | Phản ứng phía UI Client | Trạng thái hiển thị |
|-----------------|------------------------|---------------------|
| Người dùng chọn file ảnh > 5MB (ví dụ 6.2MB) | Chặn ngay tại Client, không gọi API, hiển thị alert vàng/đỏ | `EMPTY` hoặc giữ ảnh cũ kèm thông báo lỗi kích thước |
| Người dùng chọn file không hợp lệ (PDF, Word, GIF) | Báo lỗi định dạng: *"Chỉ chấp nhận JPG, PNG, WebP"* | Giữ nguyên trạng thái hiện tại, highlight viền đỏ |
| Chưa tải ảnh mà nhấn thử mô phỏng | Nút bị disabled hoặc hiển thị tooltip yêu cầu tải ảnh | Nút mờ với gợi ý *"Vui lòng tải ảnh chân dung"* |
| Đã tải ảnh nhưng chưa chọn kiểu tóc | Nút hiển thị *"Chọn 1 kiểu tóc để tiếp tục"*, highlight khay tóc | `PHOTO_READY`, focus vào khay kiểu tóc |
| Người dùng đổi ý muốn giữ màu tóc đen tự nhiên | Nhấn vào ô *"Màu tóc tự nhiên / Không nhuộm"* | `selectedColor = null`, cường độ bị ẩn hoặc khóa |
| API `/api/try-on` quá thời gian chờ (15s timeout) | Hủy request, chuyển sang `ERROR`, hiển thị nút Thử lại | `ERROR` kèm nút *"Thử lại"* & *"Đặt lịch trực tiếp"* |
| Khách hàng truy cập từ link `/try-on?hairstyleId=hs-korean-wolf-cut` | Tự động chọn mẫu Korean Wolf Cut và cuộn nhẹ đến ảnh mẫu | Tự động pre-fill `selectedHairstyle` |
| Khách hàng nhấn "Đặt lịch với kiểu tóc này" | Chuyển mượt sang `/booking?hairstyleId=...&hairColorId=...` | Điều hướng Next.js router với pre-fill đầy đủ |

---

## 7. Kế Hoạch Chuyển Giao & Hướng Dẫn Thực Hiện

- **Tệp giao diện trang:** `app/(public)/try-on/page.tsx`
- **Tệp component tương tác:** `components/public/TryOnClient.tsx`
- **Tệp so sánh Before/After:** Đã có sẵn tại `components/public/BeforeAfterSlider.tsx` (tương thích 100%).
- **Tệp Backend API Proxy:** Được thiết kế đồng bộ bởi M5 Explorer 2 tại `app/api/try-on/route.ts`.
- **Bộ dữ liệu mẫu:** Sử dụng các hàm `getPublicHairstyles` và `getPublicColors` từ `lib/public-data.ts`.
