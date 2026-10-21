# Kiến Trúc & Thiết Kế Kỹ Thuật: Hệ Thống Quản Lý Lịch Hẹn 5 Trạng Thái (Milestone 3)

> **Phân hệ**: Quản trị Lịch hẹn & Vận hành Salon (Booking & Appointment Operations)  
> **Route quản trị**: `/admin/bookings`  
> **API endpoints**: `/api/admin/bookings`, `/api/admin/bookings/[id]`, `/api/admin/bookings/[id]/status`, `/api/admin/bookings/[id]/assign`, `/api/admin/bookings/[id]/notes`, `/api/bookings`, `/api/admin/stylists`  
> **Tài liệu tham chiếu**: `ORIGINAL_REQUEST.md` (R3.4), `PROJECT.md` (Feature 18), `prisma/schema.prisma` (Booking, BookingStatus, User, AuditLog)  
> **Tác giả**: M3 Explorer 3 (Booking & Appointment Operations Specialist)  
> **Ngày lập**: 2026-10-19

---

## 1. Tổng Quan & Mục Tiêu Nghiệp Vụ

Hệ thống Quản trị Lịch hẹn tại `/admin/bookings` đóng vai trò là "trung tâm điều phối dòng khách hàng" của Salon tóc Lumière Hair Atelier. Hệ thống chịu trách nhiệm kết nối liền mạch từ lúc khách hàng gửi yêu cầu hẹn trực tuyến tại Website công khai (`app/(public)/booking`) đến các bước tiếp nhận, gọi điện xác nhận, điều phối chuyên viên tạo kiểu (Stylist), theo dõi tiến trình thực hiện dịch vụ, cho đến khi hoàn thành hoặc ghi nhận hủy/vắng mặt.

### Các Nguyên Tắc Thiết Kế Trọng Tâm:
1. **Máy trạng thái hữu hạn 5 pha (5-State Finite State Machine)**: Quản lý chặt chẽ chu kỳ sống của một lịch hẹn gồm: `PENDING` (Chờ xác nhận) $\to$ `CONFIRMED` (Đã xác nhận) $\to$ `COMPLETED` (Hoàn thành) | `CANCELLED` (Đã hủy) | `NO_SHOW` (Không đến). Ngăn chặn tuyệt đối các bước nhảy trạng thái phi logic (ví dụ: từ `PENDING` nhảy thẳng lên `COMPLETED` hoặc sửa đổi lịch đã hoàn tất).
2. **Quy chuẩn bắt buộc lý do hủy lịch**: Mọi thao tác hủy hẹn (`CANCELLED`) từ nhân viên đều bắt buộc phải ghi nhận lý do rõ ràng (tối thiểu 5 ký tự) để phục vụ phân tích tỷ lệ rớt khách (churn rate) và hoàn thiện dịch vụ.
3. **Phân quyền truy cập nghiêm ngặt (RBAC)**: Chỉ hai vai trò `SUPER_ADMIN` và `BOOKING_STAFF` được phép truy cập `/admin/bookings` và thực hiện các API `/api/admin/bookings/*`. Các vai trò khác (`CONTENT_ADMIN`, `EDITOR`) và người dùng vãng lai sẽ bị chặn bằng mã HTTP 403 Forbidden hoặc 401 Unauthorized.
4. **Bảo toàn bằng chứng & Nhật ký kiểm toán (Audit Trail)**: Mọi thay đổi trạng thái, gán stylist, hoặc bổ sung ghi chú nội bộ đều được lưu vết tức thời vào bảng `audit_logs` thông qua `services/audit.ts`.
5. **Đồng bộ thời gian thực với Dashboard**: Số lượng lịch hẹn `PENDING` tự động tác động đến chuông cảnh báo và Banner nhắc nhở trên trang chủ `/admin`.

---

## 2. Máy Trạng Thái Lịch Hẹn (5-State Booking Lifecycle Engine)

### 2.1. Định nghĩa 5 trạng thái (Enums theo `prisma/schema.prisma`)

| Trạng thái (`BookingStatus`) | Tên hiển thị tiếng Việt | Ý nghĩa nghiệp vụ | Hành động khả dụng tiếp theo |
|---|---|---|---|
| `PENDING` | **Chờ xác nhận** | Khách vừa gửi form trực tuyến hoặc gọi hotline đăng ký. Cần nhân viên kiểm tra lịch trống và gọi điện xác nhận. | `CONFIRMED`, `CANCELLED` |
| `CONFIRMED` | **Đã xác nhận** | Nhân viên đã liên hệ khách thành công, chốt thời gian, dịch vụ và gán Stylist phụ trách. | `COMPLETED`, `CANCELLED`, `NO_SHOW` |
| `COMPLETED` | **Hoàn thành** | Khách hàng đã đến salon, trải nghiệm trọn vẹn dịch vụ và thanh toán. *(Trạng thái kết thúc - Terminal)* | Không cho phép đổi trạng thái |
| `CANCELLED` | **Đã hủy lịch** | Khách báo hủy trước giờ hẹn hoặc Salon không liên hệ được khách / kín lịch. *(Trạng thái kết thúc - Terminal)* | Không cho phép đổi trạng thái |
| `NO_SHOW` | **Khách không đến** | Lịch đã chốt `CONFIRMED` nhưng khách không đến đúng giờ hẹn và không báo trước. *(Trạng thái kết thúc - Terminal)* | Không cho phép đổi trạng thái |

### 2.2. Ma trận chuyển dịch trạng thái (State Transition Matrix)

```
        ┌────────────────────────────────────────────────────────┐
        │                                                        │
        ▼                                                        │
   [ PENDING ] ──────────(Xác nhận / Gán Stylist)──────────► [ CONFIRMED ]
        │                                                        │
        │                                       ┌────────────────┼────────────────┐
        │ (Hủy hẹn + Lý do)                     │                │                │
        │                                       ▼                ▼                ▼
        └───────────────────────────────► [ CANCELLED ]   [ COMPLETED ]     [ NO_SHOW ]
                                            (Terminal)      (Terminal)       (Terminal)
```

| Từ trạng thái (Current) | Chuyển đến (Target) | Hợp lệ? | Điều kiện ràng buộc & Xử lý nghiệp vụ |
|---|---|:---:|---|
| `PENDING` | `CONFIRMED` | ✅ | Nhân viên gọi xác nhận với khách; cho phép chọn/gán `stylistId`; ghi chú nội bộ. |
| `PENDING` | `CANCELLED` | ✅ | Bắt buộc nhập `cancellationReason` (tối thiểu 5 ký tự). |
| `PENDING` | `COMPLETED` | ❌ | **Bị từ chối (400 Bad Request)**. Không thể hoàn thành dịch vụ khi chưa từng được xác nhận. |
| `PENDING` | `NO_SHOW` | ❌ | **Bị từ chối (400 Bad Request)**. Chưa xác nhận thì không thể coi là No-show. |
| `CONFIRMED` | `COMPLETED` | ✅ | Chốt hóa đơn / kết thúc ca phục vụ; ghi nhận audit log thời gian hoàn tất. |
| `CONFIRMED` | `CANCELLED` | ✅ | Bắt buộc nhập `cancellationReason`. Lưu lý do và gửi thông báo nếu cần. |
| `CONFIRMED` | `NO_SHOW` | ✅ | Quá giờ hẹn mà khách không xuất hiện; lưu ghi chú nhân viên đã liên lạc nhưng không được. |
| `CONFIRMED` | `PENDING` | ❌ | **Bị từ chối (400 Bad Request)**. Không được hạ cấp trạng thái đã chốt. |
| `COMPLETED` | Bất kỳ | ❌ | **Bị từ chối (400 Bad Request)**. Lịch hoàn thành là bất biến (Terminal State). |
| `CANCELLED` | Bất kỳ | ❌ | **Bị từ chối (400 Bad Request)**. Lịch đã hủy là bất biến. Nếu khách muốn đặt lại, tạo lịch mới. |
| `NO_SHOW` | Bất kỳ | ❌ | **Bị từ chối (400 Bad Request)**. Lịch vắng mặt là bất biến. |
| `X` | `X` (Trùng trạng thái) | ⚠️ | **Idempotent (200 OK)**: Không báo lỗi, giữ nguyên trạng thái, cập nhật ghi chú/stylist nếu có. |

### 2.3. Module Máy Trạng Thái: `lib/booking-state-machine.ts`

```typescript
import { BookingStatus } from '@prisma/client';

export interface StateTransitionResult {
  isValid: boolean;
  errorMessage?: string;
}

/**
 * Bản đồ danh sách trạng thái kế tiếp được phép cho từng trạng thái hiện tại
 */
export const ALLOWED_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['COMPLETED', 'CANCELLED', 'NO_SHOW'],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
};

/**
 * Kiểm tra tính hợp lệ của chuyển dịch trạng thái
 */
export function validateBookingTransition(
  currentStatus: BookingStatus,
  targetStatus: BookingStatus,
  cancellationReason?: string | null
): StateTransitionResult {
  // 1. Trường hợp cùng trạng thái (Idempotent update)
  if (currentStatus === targetStatus) {
    return { isValid: true };
  }

  // 2. Kiểm tra xem trạng thái đích có nằm trong danh sách cho phép không
  const allowed = ALLOWED_TRANSITIONS[currentStatus];
  if (!allowed || !allowed.includes(targetStatus)) {
    return {
      isValid: false,
      errorMessage: `Không thể chuyển trạng thái lịch hẹn từ "${formatBookingStatusVN(currentStatus)}" sang "${formatBookingStatusVN(targetStatus)}"`,
    };
  }

  // 3. Ràng buộc bắt buộc lý do khi hủy lịch (CANCELLED)
  if (targetStatus === 'CANCELLED') {
    if (!cancellationReason || cancellationReason.trim().length < 5) {
      return {
        isValid: false,
        errorMessage: 'Vui lòng cung cấp lý do hủy lịch hẹn cụ thể (tối thiểu 5 ký tự)',
      };
    }
  }

  return { isValid: true };
}

/**
 * Định dạng nhãn hiển thị tiếng Việt
 */
export function formatBookingStatusVN(status: BookingStatus): string {
  switch (status) {
    case 'PENDING':
      return 'Chờ xác nhận';
    case 'CONFIRMED':
      return 'Đã xác nhận';
    case 'COMPLETED':
      return 'Đã hoàn thành';
    case 'CANCELLED':
      return 'Đã hủy lịch';
    case 'NO_SHOW':
      return 'Khách không đến';
    default:
      return status;
  }
}
```

---

## 3. Quy Chuẩn Xác Thực (Validation Schemas - `lib/validations/booking.ts`)

Để tương thích 100% với cả bộ E2E Test Fixtures (`tests/e2e/tier1-features/booking.test.ts`, `tests/e2e/tier2-boundaries/*`) và giao diện Web Admin, Zod Schema được nâng cấp để hỗ trợ cả tên trường nguyên thủy và trường ánh xạ alias:

```typescript
import { z } from 'zod';

export const BookingStatusEnum = z.enum([
  'PENDING',
  'CONFIRMED',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
]);

/**
 * Schema cập nhật trạng thái lịch hẹn trong Admin CMS
 * Hỗ trợ linh hoạt cả stylistId / assignedStylistId, notes / internalNotes, cancelReason / cancellationReason
 */
export const UpdateBookingStatusSchema = z
  .object({
    status: BookingStatusEnum,
    // Stylist ID: chấp nhận cả 2 khóa
    assignedStylistId: z.string().optional().nullable(),
    stylistId: z.string().optional().nullable(),
    // Internal Notes: chấp nhận cả 2 khóa
    internalNotes: z.string().max(1000, 'Ghi chú nội bộ tối đa 1000 ký tự').optional().nullable(),
    notes: z.string().max(1000, 'Ghi chú nội bộ tối đa 1000 ký tự').optional().nullable(),
    // Lý do hủy: chấp nhận cả 2 khóa
    cancellationReason: z.string().max(500, 'Lý do hủy tối đa 500 ký tự').optional().nullable(),
    cancelReason: z.string().max(500, 'Lý do hủy tối đa 500 ký tự').optional().nullable(),
  })
  .transform((data) => {
    const finalStylistId = data.stylistId !== undefined ? data.stylistId : data.assignedStylistId;
    const finalNotes = data.notes !== undefined ? data.notes : data.internalNotes;
    const finalReason = data.cancellationReason !== undefined ? data.cancellationReason : data.cancelReason;

    return {
      status: data.status,
      assignedStylistId: finalStylistId,
      stylistId: finalStylistId,
      internalNotes: finalNotes,
      notes: finalNotes,
      cancellationReason: finalReason,
      cancelReason: finalReason,
    };
  });

export type UpdateBookingStatusInput = z.infer<typeof UpdateBookingStatusSchema>;

/**
 * Schema gán chuyên viên tạo kiểu (Stylist Assignment)
 */
export const AssignStylistSchema = z.object({
  stylistId: z.string().nullable().optional(),
  assignedStylistId: z.string().nullable().optional(),
}).transform((data) => ({
  stylistId: data.stylistId !== undefined ? data.stylistId : data.assignedStylistId ?? null,
}));

/**
 * Schema cập nhật ghi chú nội bộ salon
 */
export const UpdateInternalNotesSchema = z.object({
  internalNotes: z.string().max(1000, 'Ghi chú tối đa 1000 ký tự'),
});

/**
 * Schema bộ lọc danh sách lịch hẹn trong Admin
 */
export const AdminBookingFilterSchema = z.object({
  status: z.union([BookingStatusEnum, z.literal('ALL')]).optional().default('ALL'),
  search: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  stylistId: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
  format: z.enum(['array', 'paginated']).optional(),
});
```

---

## 4. Đặc Tả Chi Tiết Các API Endpoints (`/api/admin/bookings`)

### 4.1. Quy ước Phân Quyền (RBAC Protocol)
Mọi endpoint bắt đầu bằng `/api/admin/bookings` đều được bọc bởi guard:
```typescript
const authResult = await authenticateAdminRequest(request);
if ('errorResponse' in authResult) {
  return authResult.errorResponse;
}
const currentUser = authResult.user; // Có quyền SUPER_ADMIN hoặc BOOKING_STAFF
```
Nếu người dùng chưa đăng nhập $\to$ Trả về **HTTP 401 Unauthorized**.  
Nếu người dùng có vai trò `CONTENT_ADMIN` hoặc `EDITOR` $\to$ Trả về **HTTP 403 Forbidden** với thông điệp: `"Forbidden: Role [ROLE] cannot manage bookings"`.

---

### 4.2. `GET /api/admin/bookings`
**Mục đích**: Tìm kiếm, lọc và phân trang danh sách lịch hẹn phục vụ màn hình quản trị `/admin/bookings`.

- **Headers**: `Authorization: Bearer <token>` hoặc Cookie `salon_session=<token>`
- **Query Parameters**:
  - `status`: Lọc theo trạng thái (`PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED`, `NO_SHOW`, hoặc `ALL` - mặc định).
  - `search`: Chuỗi tìm kiếm (không phân biệt hoa thường theo `customerName`, `customerPhone`, `bookingCode`).
  - `startDate`, `endDate`: Khoảng ngày hẹn theo chuẩn `YYYY-MM-DD`.
  - `date`: Ngày hẹn cụ thể.
  - `stylistId`: Lọc theo chuyên viên tạo kiểu được gán (`assignedStylistId`).
  - `page`: Số trang hiện tại (mặc định 1).
  - `pageSize`: Số bản ghi mỗi trang (mặc định 20).
  - `format`: Nếu đặt là `paginated`, trả về cấu trúc Object `{ bookings, pagination, stats }`. Nếu không truyền (mặc định cho các test E2E), trả về mảng `Booking[]` kèm Header phân trang.

- **Định dạng dữ liệu trả về (Response Payload)**:
  Mỗi bản ghi `Booking` trả về phải chứa đầy đủ các thuộc tính chuẩn hóa và các trường alias:
  ```json
  [
    {
      "id": "bk-uuid-001",
      "bookingCode": "BK123456",
      "customerName": "Nguyễn Kiều Oanh",
      "customerPhone": "0978123456",
      "customerEmail": "kieuoanh@gmail.com",
      "bookingDate": "2026-10-20",
      "timeSlot": "10:30",
      "status": "PENDING",
      "notes": "Khách hàng mới, tư vấn uốn nhuộm",
      "internalNotes": null,
      "cancellationReason": null,
      "serviceId": "srv-color-perm-combo",
      "service": {
        "id": "srv-color-perm-combo",
        "title": "Combo Cắt Uốn Nhuộm Cao Cấp",
        "durationMinutes": 150,
        "priceMin": 1200000,
        "priceMax": 1800000
      },
      "hairstyleId": "hs-korean-wolf-cut",
      "hairstyleRefId": "hs-korean-wolf-cut",
      "hairstyleRef": {
        "id": "hs-korean-wolf-cut",
        "title": "Korean Wolf Cut Textured",
        "coverImageUrl": "/images/styles/wolf-cut.jpg"
      },
      "hairColorId": "col-ash-blonde",
      "hairColorRefId": "col-ash-blonde",
      "hairColorRef": {
        "id": "col-ash-blonde",
        "name": "Bạch Kim Khói (Ash Blonde)",
        "hexColor": "#D9D2C7",
        "code": "ASH-9.1"
      },
      "stylistId": "sty-master-tran",
      "assignedStylistId": "sty-master-tran",
      "assignedStylist": {
        "id": "sty-master-tran",
        "fullName": "Alex Trần",
        "avatarUrl": "/avatars/alex.jpg",
        "specialties": ["Skin Fade", "Textured Crop"]
      },
      "createdAt": "2026-10-19T05:00:00.000Z",
      "updatedAt": "2026-10-19T05:00:00.000Z"
    }
  ]
  ```
- **Response Headers bổ trợ**:
  - `X-Total-Count`: Tổng số bản ghi thỏa điều kiện lọc.
  - `X-Page`: Trang hiện tại.
  - `X-Page-Size`: Kích thước trang.
  - `X-Total-Pages`: Tổng số trang.
  - `X-Pending-Count`: Số lịch hẹn đang ở trạng thái `PENDING`.

---

### 4.3. `GET /api/admin/bookings/[id]`
**Mục đích**: Lấy thông tin chi tiết toàn diện của một lịch hẹn cụ thể, bao gồm quan hệ dịch vụ, kiểu tóc, bảng màu, stylist và **lịch sử kiểm toán (Audit Trail)** liên quan.

- **URL Param**: `[id]` (có thể là UUID `id` hoặc `bookingCode`).
- **Thực thi Database**:
  - Truy vấn `prisma.booking.findFirst` kèm `include: { service: true, combo: true, hairstyleRef: true, hairColorRef: true, assignedStylist: true }`.
  - Truy vấn bổ sung danh sách vết kiểm toán:
    ```typescript
    const auditHistory = await prisma.auditLog.findMany({
      where: {
        entityType: 'Booking',
        entityId: booking.id,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    ```
- **Mã phản hồi**:
  - `200 OK`: Trả về chi tiết bản ghi kèm mảng `auditHistory`.
  - `404 Not Found`: Khi không tìm thấy lịch hẹn.

---

### 4.4. `PUT` & `PATCH /api/admin/bookings/[id]/status`
**Mục đích**: Thay đổi trạng thái lịch hẹn tuân thủ máy trạng thái 5 pha, gán stylist và cập nhật ghi chú nội bộ.

- **HTTP Method**: Hỗ trợ đồng thời cả `PUT` và `PATCH`.
- **Payload Input (JSON)**:
  ```json
  {
    "status": "CONFIRMED",
    "stylistId": "sty-master-tran",
    "notes": "Đã gọi điện xác nhận lịch với khách lúc 09:15"
  }
  ```
  *Hoặc khi hủy lịch:*
  ```json
  {
    "status": "CANCELLED",
    "notes": "Khách bận đột xuất xin hủy hẹn",
    "cancellationReason": "Khách bận đột xuất xin hủy hẹn"
  }
  ```

- **Quy trình xử lý nghiệp vụ (Business Execution Pipeline)**:
  1. Kiểm tra xác thực RBAC qua `authenticateAdminRequest`.
  2. Parse body với Zod. Nếu chuỗi `status` không hợp lệ $\to$ trả về **400 Bad Request** với `{ error: 'Invalid status: ' + body.status }` (tuân thủ `TC2.19`).
  3. Tìm bản ghi hiện tại trong database qua `prisma.booking.findUnique`. Nếu không thấy $\to$ **404 Not Found** `{ error: 'Booking not found' }`.
  4. Chạy kiểm tra máy trạng thái `validateBookingTransition(current.status, target.status, reason)`:
     - Nếu không hợp lệ $\to$ **400 Bad Request** `{ error: result.errorMessage }`.
  5. Nếu có truyền `stylistId`:
     - Kiểm tra trong bảng `User`: người dùng phải tồn tại, có `isStylist: true` và `isActive: true`. Nếu không tìm thấy $\to$ **400 Bad Request** `{ error: 'Chuyên viên tạo kiểu không tồn tại hoặc đã ngừng hoạt động' }`.
  6. Thực hiện giao dịch cập nhật trong database:
     ```typescript
     const updated = await prisma.booking.update({
       where: { id: booking.id },
       data: {
         status: targetStatus,
         assignedStylistId: finalStylistId !== undefined ? finalStylistId : undefined,
         internalNotes: finalNotes !== undefined ? finalNotes : undefined,
         cancellationReason: targetStatus === 'CANCELLED' ? finalReason : undefined,
       },
       include: {
         service: true,
         combo: true,
         hairstyleRef: true,
         hairColorRef: true,
         assignedStylist: true,
       },
     });
     ```
  7. **Ghi nhận vết kiểm toán (Audit Log)**:
     ```typescript
     await logAuditEvent({
       userId: currentUser.id,
       userEmail: currentUser.email,
       userName: currentUser.fullName,
       userRole: currentUser.role.name,
       action: 'STATUS_CHANGE',
       entity: 'Booking',
       entityId: booking.id,
       details: {
         previousStatus: booking.status,
         newStatus: targetStatus,
         stylistId: updated.assignedStylistId,
         cancellationReason: updated.cancellationReason,
         internalNotes: updated.internalNotes,
         customerName: booking.customerName,
         customerPhone: booking.customerPhone,
         bookingDate: booking.bookingDate,
         timeSlot: booking.timeSlot,
       },
       ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
       userAgent: request.headers.get('user-agent'),
     });
     ```
  8. Trả về **200 OK** với bản ghi `updated` đã chuẩn hóa (chứa cả `stylistId`, `internalNotes`, `status`).

---

### 4.5. `PATCH /api/admin/bookings/[id]/assign`
**Mục đích**: Gán hoặc chuyển đổi chuyên viên tạo kiểu (Stylist) mà không cần thay đổi trạng thái lịch hẹn.

- **Payload**: `{ "stylistId": "sty-master-tran" }` (hoặc `null` để gỡ stylist).
- **Xử lý**:
  - Kiểm tra stylist hợp lệ trong DB nếu `stylistId !== null`.
  - Cập nhật `assignedStylistId`.
  - Ghi Audit Log với `action: 'UPDATE'`, `details: { action: 'ASSIGN_STYLIST', oldStylistId: ..., newStylistId: ... }`.
  - Trả về **200 OK** với booking đã cập nhật.

---

### 4.6. `PATCH /api/admin/bookings/[id]/notes`
**Mục đích**: Cập nhật ghi chú nội bộ salon (`internalNotes`) giữa các nhân viên trực quầy và stylist (ví dụ: "Khách da đầu nhạy cảm, dặn gội nhẹ tay").

- **Payload**: `{ "internalNotes": "Khách dặn cắt ngắn hơn mẫu 1cm" }`
- **Xử lý**:
  - Kiểm tra độ dài tối đa 1000 ký tự.
  - Cập nhật trường `internalNotes`.
  - Ghi Audit Log với `action: 'UPDATE'`, `details: { action: 'UPDATE_INTERNAL_NOTES' }`.
  - Trả về **200 OK**.

---

### 4.7. `GET /api/admin/stylists`
**Mục đích**: Cung cấp danh sách chuyên viên tạo kiểu đang hoạt động để hiển thị trên các dropdown chọn lọc và gán ca trực.

- **Truy vấn**: `prisma.user.findMany({ where: { isStylist: true, isActive: true }, select: { id: true, fullName: true, phone: true, avatarUrl: true, specialties: true, experienceYears: true } })`.
- **Trả về**: Mảng các Stylist `{ id, fullName, avatarUrl, specialties }`.

---

### 4.8. `POST /api/bookings` (Public Booking Endpoint)
**Mục đích**: Tiếp nhận đặt lịch từ khách hàng ngoài trang chủ, đảm bảo cơ chế chống gửi trùng (Idempotency) và tạo mã lịch chuẩn `/^BK\d{6}$/`.

- **Payload**: Xác thực qua `CreateBookingSchema` (Service, Date, Time, Customer Name, Phone, Email, Style, Color, IdempotencyKey).
- **Cơ chế chống gửi trùng (Anti-Duplicate Idempotency Lock)**:
  ```typescript
  if (data.idempotencyKey) {
    const existing = await prisma.booking.findUnique({
      where: { idempotencyKey: data.idempotencyKey },
    });
    if (existing) {
      // Trả về 200 OK với bản ghi có sẵn (tuân thủ TC1.20 và TC4.3)
      return NextResponse.json(formatBookingResponse(existing), { status: 200 });
    }
  }
  ```
- **Sinh mã lịch hẹn chuẩn (`bookingCode`)**:
  - Test `TC4.1` đặt kỳ vọng: `expect(bookingRes.data.bookingCode).toMatch(/^BK\d{6}$/)`.
  - Hàm tạo: `BK` + 6 chữ số ngẫu nhiên (ví dụ `BK847291`), kiểm tra không trùng lặp trong DB.
- **Trạng thái ban đầu**: Luôn luôn là `PENDING`.
- **Ghi nhận Audit Log**:
  - `action: 'CREATE'`, `entity: 'Booking'`, `details: { source: 'PUBLIC_WEBSITE', customerName, customerPhone, bookingDate, timeSlot }`.
- **Mã phản hồi**: **201 Created** kèm bản ghi mới.

---

## 5. Kiến Trúc Giao Diện Quản Trị (`/admin/bookings`)

### 5.1. Cấu Trúc Thành Phần Giao Diện (Component Hierarchy)

```
app/admin/bookings/page.tsx (Server Component)
 │
 ├── AdminHeader (Breadcrumb, Account Profile)
 └── BookingsManagementClient.tsx (Client Component - Luxury Theme)
      │
      ├── SummaryKpiRow (Tổng lịch hôm nay, Lịch chờ duyệt, Tỷ lệ hoàn thành)
      │
      ├── StatusTabsBar (Pills đếm số: Tất cả, Chờ duyệt, Đã chốt, Hoàn thành, Hủy, Vắng mặt)
      │
      ├── FilterToolbar (Ô tìm kiếm, Bộ chọn ngày/khoảng ngày, Dropdown chọn Stylist, Nút Xuất Excel)
      │
      ├── BookingsDataTable (Bảng danh sách cao cấp với Responsive Mobile Cards)
      │    └── TableRow (Mã BK, Khách hàng, Giờ hẹn, Dịch vụ/Mẫu tóc, Stylist badge, Trạng thái pill, Nút hành động nhanh)
      │
      ├── BookingDetailModal.tsx (Drawer / Modal trượt xem toàn diện chi tiết)
      │    ├── CustomerCard (Tên, SĐT gọi nhanh, Email, Ghi chú khách gửi)
      │    ├── ServiceAndSpecsCard (Dịch vụ, Kiểu tóc mẫu, Màu tóc swatch, Giá dự kiến)
      │    ├── StylistAssignSection (Dropdown đổi stylist tức thì + nút lưu)
      │    ├── InternalNotesEditor (Textarea ghi chú nội bộ cho thợ)
      │    ├── StateActionBar (Nút Xác nhận, Hoàn thành, Đánh dấu vắng mặt, Hủy hẹn)
      │    └── AuditTrailTimeline (Dòng thời gian truy vết ai đã đổi trạng thái gì)
      │
      └── CancelBookingModal.tsx (Hộp thoại xác nhận hủy hẹn + bắt buộc lý do)
```

---

### 5.2. Chi Tiết Thành Phần Giao Diện

#### 1. Server Component: `app/admin/bookings/page.tsx`
- Kiểm tra phiên làm việc phía máy chủ qua `await requireAdmin(['SUPER_ADMIN', 'BOOKING_STAFF'])`.
- Nạp trước dữ liệu ban đầu trực tiếp từ Prisma:
  - 20 lịch hẹn mới nhất.
  - Số lượng lịch theo từng trạng thái để hiển thị ngay trên Tab Badges:
    - `allCount`
    - `pendingCount`
    - `confirmedCount`
    - `completedCount`
    - `cancelledCount`
    - `noShowCount`
  - Danh sách Stylist đang hoạt động (`isStylist: true, isActive: true`).
- Truyền dữ liệu vào Client Component `<BookingsManagementClient />`.

#### 2. Client Component: `components/admin/BookingsManagementClient.tsx`
- **Bộ Tab trạng thái (Status Tabs with Badges)**:
  - **Tất cả**: Badge số lượng trung tính.
  - **Chờ xác nhận (PENDING)**: Badge màu hổ phách/vàng kim phát sáng nhấp nháy (`bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse`), kèm chấm trạng thái.
  - **Đã xác nhận (CONFIRMED)**: Badge màu xanh biển sang trọng (`bg-blue-500/20 text-blue-300 border-blue-500/30`).
  - **Hoàn thành (COMPLETED)**: Badge màu xanh lục bảo (`bg-emerald-500/20 text-emerald-300 border-emerald-500/30`).
  - **Đã hủy (CANCELLED)**: Badge màu đỏ hoa hồng (`bg-rose-500/20 text-rose-300 border-rose-500/30`).
  - **Không đến (NO_SHOW)**: Badge màu xám đá (`bg-zinc-500/20 text-zinc-300 border-zinc-500/30`).

- **Thanh công cụ lọc (Filter Toolbar)**:
  - Ô tìm kiếm tức thì (Search input) hỗ trợ tìm theo Tên khách, Số điện thoại hoặc Mã lịch `#BK...`.
  - Bộ chọn thời gian: "Hôm nay", "Ngày mai", "7 ngày tới", "Tất cả", hoặc chọn ngày tùy ý.
  - Dropdown lọc theo Stylist: "Tất cả stylist", "Chưa phân công", hoặc từng Stylist cụ thể.
  - Nút **Xuất danh sách Excel (CSV with UTF-8 BOM)**: Tương thích hoàn toàn với Microsoft Excel trên Windows tiếng Việt có dấu.
  - Nút **Làm mới dữ liệu** với hiệu ứng xoay mượt mà.

- **Bảng dữ liệu (Luxury Data Table)**:
  - Hiển thị ngày giờ hẹn nổi bật với cờ báo "Hôm nay" nếu trùng ngày hiện tại.
  - Số điện thoại có thẻ bấm gọi trực tiếp `tel:...`.
  - Kiểu tóc & màu tóc có ảnh đại diện thu nhỏ và mã màu thực tế.
  - Thao tác nhanh 1 chạm:
    - Nếu `PENDING`: Nút xanh "Xác nhận ngay" $\to$ chuyển thẳng `CONFIRMED`.
    - Nếu `CONFIRMED`: Nút ngọc bích "Hoàn thành ca" $\to$ chuyển `COMPLETED`.
    - Nút đỏ "Hủy hẹn" mở Popup nhập lý do hủy.

#### 3. Modal / Drawer Chi Tiết Lịch Hẹn: `components/admin/BookingDetailModal.tsx`
- **Phần đầu**: Hiển thị Mã lịch `#BK...`, Ngày giờ hẹn, Tag trạng thái lớn.
- **Thẻ Khách Hàng**: Họ tên, Số điện thoại, Email, Ghi chú ban đầu của khách khi đặt form.
- **Thẻ Dịch Vụ & Kiểu Tóc**:
  - Tên dịch vụ hoặc Combo, thời lượng ước tính, khung giá dự kiến.
  - Mẫu tóc tham khảo (ảnh bìa, tên kiểu tóc).
  - Màu tóc tham khảo (hình tròn swatch thể hiện mã màu HEX thực tế, nhãn báo nếu tóc cần tẩy).
- **Bộ Điều Phối Stylist (Inline Stylist Selector)**:
  - Hiển thị Stylist đang phụ trách (ảnh đại diện, tên, số năm kinh nghiệm).
  - Dropdown cho phép chọn đổi thợ khác và nút "Lưu phân công" gọi API `PATCH /assign`.
- **Ghi Chú Nội Bộ (Internal Notes)**:
  - Hộp nhập văn bản nhiều dòng cho lễ tân và thợ trao đổi.
  - Đếm ký tự (0/1000) và nút lưu tức thời gọi API `PATCH /notes`.
- **Thanh Hành Động Chuyển Trạng Thái (State Action Bar)**:
  - Chỉ hiển thị các nút hành động hợp lệ với trạng thái hiện hành:
    - Khi `PENDING`: [Xác nhận lịch] (Gold) | [Hủy lịch hẹn] (Rose).
    - Khi `CONFIRMED`: [Hoàn thành dịch vụ] (Emerald) | [Khách không đến] (Zinc) | [Hủy lịch hẹn] (Rose).
    - Khi `COMPLETED` / `CANCELLED` / `NO_SHOW`: Hiển thị dòng trạng thái đóng (Không cho phép thao tác sửa).
- **Dòng Thời Gian Kiểm Toán (Audit Trail History)**:
  - Liệt kê các lần đổi trạng thái trước đó: Người thực hiện, chức vụ, thời gian tương đối (`5 phút trước`), và lý do hủy nếu có.

#### 4. Hộp Thoại Hủy Lịch Hẹn: `components/admin/CancelBookingModal.tsx`
- Hộp thoại cảnh báo màu đỏ - đen sang trọng.
- Các nút chọn nhanh lý do phổ biến:
  - *"Khách bận việc đột xuất xin dời lịch"*
  - *"Gọi xác nhận 3 lần khách không nghe máy"*
  - *"Khách thay đổi ý định không muốn làm dịch vụ"*
  - *"Salon quá tải khung giờ yêu cầu, khách không đồng ý dời giờ"*
- Ô nhập văn bản bổ sung chi tiết (bắt buộc tối thiểu 5 ký tự).
- Nút "Xác nhận hủy hẹn" gọi API `PUT /status` với `status: 'CANCELLED'` và `cancellationReason`.

---

## 6. Tích Hợp Kiểm Toán & Đo Lường Hệ Thống (Audit & Telemetry)

### 6.1. Ma trận hành động kiểm toán (Audit Action Matrix)

| Thao tác nghiệp vụ | Hành động (`action`) | Thực thể (`entity`) | Chi tiết lưu vết (`details`) |
|---|---|---|---|
| Khách đặt lịch mới online | `CREATE` | `Booking` | Nguồn tạo `PUBLIC_WEBSITE`, thông tin dịch vụ, ngày giờ, số điện thoại, idempotencyKey |
| Lễ tân xác nhận lịch | `STATUS_CHANGE` | `Booking` | `from: 'PENDING'`, `to: 'CONFIRMED'`, `stylistId`, `notes` |
| Hoàn thành ca phục vụ | `STATUS_CHANGE` | `Booking` | `from: 'CONFIRMED'`, `to: 'COMPLETED'`, thời gian hoàn tất |
| Hủy lịch hẹn | `STATUS_CHANGE` | `Booking` | `from: [CŨ]`, `to: 'CANCELLED'`, `cancellationReason`, `internalNotes` |
| Đánh dấu không đến | `STATUS_CHANGE` | `Booking` | `from: 'CONFIRMED'`, `to: 'NO_SHOW'`, `internalNotes` |
| Đổi Stylist phụ trách | `UPDATE` | `Booking` | `action: 'ASSIGN_STYLIST'`, `oldStylistId`, `newStylistId` |
| Sửa ghi chú nội bộ | `UPDATE` | `Booking` | `action: 'UPDATE_INTERNAL_NOTES'`, nội dung ghi chú |

### 6.2. Đồng Bộ Hóa Chỉ Số Dashboard Thời Gian Thực
- Trang `/admin/page.tsx` và API `/api/admin/dashboard` liên tục theo dõi chỉ số `pendingBookingsCount`:
  ```typescript
  const pendingBookingsCount = await prisma.booking.count({
    where: { status: 'PENDING' },
  });
  ```
- Khi một lịch hẹn chuyển từ `PENDING` sang `CONFIRMED` hoặc `CANCELLED`:
  - `pendingBookingsCount` lập tức giảm 1.
  - Banner cảnh báo `"Có X lịch hẹn trực tuyến đang chờ xác nhận"` trên Dashboard sẽ tự động cập nhật hoặc biến mất khi hết lịch chờ duyệt.
  - Thao tác chuyển đổi kích hoạt `revalidatePath('/admin')` và `revalidatePath('/admin/bookings')` để đảm bảo Next.js evict cache ISR/SSR ngay lập tức.

---

## 7. Ma Trận Đối Soát Bộ Kiểm Thử E2E (E2E Test Suite Matrix)

Hệ thống được thiết kế để vượt qua 100% các ca kiểm thử E2E liên quan đến lịch hẹn:

| Mã Ca Kiểm Thử | Tên Kịch Bản Kiểm Thử | Kết Quả Kỳ Vọng Đáp Ứng | Thành Phần Thiết Kế Tương Ứng |
|---|---|---|---|
| **TC1.18** | Tạo lịch với các trường tối thiểu | HTTP 201, `status: 'PENDING'`, sinh mã `bookingCode` | `POST /api/bookings` |
| **TC1.19** | Tạo lịch đầy đủ kiểu tóc, màu, stylist, ghi chú | HTTP 201, lưu trọn vẹn `hairstyleId`, `hairColorId`, `stylistId` | `POST /api/bookings` |
| **TC1.20** | Chống gửi trùng lặp qua `idempotencyKey` | Lần 1: 201 Created; Lần 2 (cùng key): 200 OK trả về booking cũ | `POST /api/bookings` Idempotency Guard |
| **TC1.21** | Chu trình chuyển đổi: PENDING $\to$ CONFIRMED $\to$ COMPLETED | HTTP 200 tại mỗi bước, cập nhật stylist và ghi chú | `PUT /api/admin/bookings/[id]/status` |
| **TC1.22** | Luồng hủy lịch kèm lý do kiểm toán | HTTP 200, `status: 'CANCELLED'`, lưu `internalNotes` | `PUT /api/admin/bookings/[id]/status` |
| **TC2.1 - 2.6** | Giới hạn ký tự tên, ghi chú, regex SĐT Việt Nam, chặn ngày quá khứ, giờ mở cửa (08:30 - 20:30) | HTTP 400 Bad Request kèm chi tiết lỗi chuẩn xác | `CreateBookingSchema` trong `lib/validations/booking.ts` |
| **TC2.14** | `CONTENT_ADMIN` không được sửa lịch hẹn | HTTP 403 Forbidden (`Role CONTENT_ADMIN cannot manage bookings`) | RBAC Guard trong `lib/auth.ts` |
| **TC2.19** | Chặn chuỗi trạng thái không hợp lệ | HTTP 400 Bad Request (`Invalid status: ...`) | `UpdateBookingStatusSchema` & State Machine |
| **TC3.1** | Đặt lịch phối hợp Dịch vụ + Kiểu tóc + Màu sắc | Lễ tân thấy đủ `hairstyleId`, `hairColorId` qua `GET /api/admin/bookings` | `GET /api/admin/bookings` format & Prisma include |
| **TC3.7** | Chuyển đổi từ Hair Try-On sang Đặt lịch | Lễ tân kiểm tra thấy ghi chú mô phỏng của khách | `GET /api/admin/bookings` & `Booking.notes` |
| **TC4.1** | Hành trình khách hàng đầy đủ từ Website đến Salon | Mã `bookingCode` khớp regex `/^BK\d{6}$/`, chuyển đổi trạng thái mượt mà | `bookingCode` Generator & Full Lifecycle |
| **TC4.2** | Khách hủy và đặt lại lịch mới | Lịch cũ chuyển `CANCELLED`, lịch mới sinh ID khác biệt | State Machine Isolation |
| **TC4.3** | Khóa đồng thời (High-concurrency duplicate submission) | Hai request đồng thời đều nhận phản hồi thành công cùng 1 ID | Prisma Unique Index trên `idempotencyKey` |
| **TC4.11** | Chống tấn công IDOR & leo thang đặc quyền từ Editor / Vãng lai | Khách vãng lai: 401; Editor: 403 Forbidden | `authenticateAdminRequest` Guard |

---

## 8. Kế Hoạch Triển Khai Mã Nguồn (Implementation Checklist)

Khi tiến hành hiện thực mã nguồn trong Milestone 3, các file sau đây cần được tạo và cấu hình:

1. **`lib/booking-state-machine.ts`**: Cài đặt logic máy trạng thái, kiểm tra chuyển dịch hợp lệ và thông báo lỗi tiếng Việt.
2. **`lib/validations/booking.ts`**: Bổ sung `UpdateBookingStatusSchema` chuẩn hóa các khóa alias (`stylistId` / `assignedStylistId`, `notes` / `internalNotes`, `cancellationReason` / `cancelReason`).
3. **`app/api/bookings/route.ts`**: Xây dựng endpoint đặt lịch công khai có chống trùng lặp `idempotencyKey` và sinh mã `BKxxxxxx`.
4. **`app/api/admin/bookings/route.ts`**: Xây dựng endpoint tra cứu, tìm kiếm, lọc đa tiêu chí, trả về mảng kèm header phân trang.
5. **`app/api/admin/bookings/[id]/route.ts`**: Endpoint xem chi tiết kèm quan hệ và vết kiểm toán (`auditLog`).
6. **`app/api/admin/bookings/[id]/status/route.ts`**: Endpoint cập nhật trạng thái (hỗ trợ `PUT` & `PATCH`), bắt buộc lý do hủy, ghi log kiểm toán.
7. **`app/api/admin/bookings/[id]/assign/route.ts`**: Endpoint gán stylist riêng biệt.
8. **`app/api/admin/bookings/[id]/notes/route.ts`**: Endpoint cập nhật ghi chú nội bộ riêng biệt.
9. **`app/api/admin/stylists/route.ts`**: Endpoint nạp danh sách stylist phục vụ chọn lựa.
10. **`app/admin/bookings/page.tsx`**: Server component giao diện `/admin/bookings` với kiểm tra quyền `SUPER_ADMIN` & `BOOKING_STAFF`.
11. **`components/admin/BookingsManagementClient.tsx`**: Client Component bảng quản trị, thanh tìm kiếm, bộ lọc ngày, tabs trạng thái và nút xuất Excel.
12. **`components/admin/BookingDetailModal.tsx`**: Drawer/Modal hiển thị chi tiết lịch hẹn, gán stylist, ghi chú và các nút chuyển đổi trạng thái động.
13. **`components/admin/CancelBookingModal.tsx`**: Hộp thoại bắt buộc nhập lý do hủy lịch.
