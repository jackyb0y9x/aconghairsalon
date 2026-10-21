import { z } from 'zod';

/**
 * Regex số điện thoại di động Việt Nam chuẩn
 * Hỗ trợ đầu số 0 hoặc +84 kết hợp với các đầu mạng 3, 5, 7, 8, 9 và 8 chữ số tiếp theo
 */
export const VIETNAMESE_PHONE_REGEX = /^(0|\+84)[35789][0-9]{8}$/;

/**
 * Regex định dạng ngày YYYY-MM-DD
 */
export const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Regex định dạng giờ HH:mm (24 giờ)
 */
export const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * Schema xác thực khi khách hàng gửi yêu cầu đặt lịch hẹn mới
 */
export const CreateBookingSchema = z
  .object({
    serviceId: z
      .string()
      .trim()
      .min(1, 'Vui lòng chọn dịch vụ')
      .optional()
      .or(z.null()),
    hairstyleId: z.string().optional(),
    hairColorId: z.string().optional(),
    stylistId: z.string().optional(),
    bookingDate: z
      .string({ required_error: 'Vui lòng chọn ngày hẹn' })
      .regex(DATE_REGEX, 'Ngày hẹn không hợp lệ (định dạng chuẩn YYYY-MM-DD)')
      .refine(
        (val) => {
          const parts = val.split('-').map(Number);
          if (parts.length !== 3) return false;
          const [year, month, day] = parts;
          const date = new Date(year, month - 1, day);
          return (
            date.getFullYear() === year &&
            date.getMonth() === month - 1 &&
            date.getDate() === day
          );
        },
        {
          message: 'Ngày hẹn không hợp lệ',
        }
      ),
    bookingTime: z
      .string({ required_error: 'Vui lòng chọn giờ hẹn' })
      .regex(TIME_REGEX, 'Giờ hẹn không hợp lệ (định dạng chuẩn HH:mm)')
      .refine(
        (val) => {
          const match = val.match(/^(\d{2}):(\d{2})$/);
          if (!match) return false;
          const hours = parseInt(match[1], 10);
          const minutes = parseInt(match[2], 10);
          const totalMinutes = hours * 60 + minutes;
          return totalMinutes >= 8 * 60 + 30 && totalMinutes <= 20 * 60 + 30;
        },
        {
          message: 'Giờ hẹn phải nằm trong khung giờ mở cửa (08:30 - 20:30)',
        }
      )
      .optional(),
    timeSlot: z
      .string()
      .regex(TIME_REGEX, 'Giờ hẹn không hợp lệ (định dạng chuẩn HH:mm)')
      .refine(
        (val) => {
          const match = val.match(/^(\d{2}):(\d{2})$/);
          if (!match) return false;
          const hours = parseInt(match[1], 10);
          const minutes = parseInt(match[2], 10);
          const totalMinutes = hours * 60 + minutes;
          return totalMinutes >= 8 * 60 + 30 && totalMinutes <= 20 * 60 + 30;
        },
        {
          message: 'Giờ hẹn phải nằm trong khung giờ mở cửa (08:30 - 20:30)',
        }
      )
      .optional(),
    customerName: z
      .string({ required_error: 'Vui lòng nhập họ và tên' })
      .trim()
      .min(2, 'Họ tên tối thiểu 2 ký tự')
      .max(100, 'Họ tên tối đa 100 ký tự'),
    customerPhone: z
      .string({ required_error: 'Vui lòng nhập số điện thoại' })
      .trim()
      .regex(VIETNAMESE_PHONE_REGEX, 'Số điện thoại không hợp lệ (Ví dụ: 0908123456 hoặc +84908123456)'),
    customerEmail: z
      .string()
      .trim()
      .email('Email không hợp lệ')
      .optional()
      .or(z.literal('')),
    notes: z
      .string()
      .max(500, 'Ghi chú tối đa 500 ký tự')
      .optional()
      .or(z.literal('')),
    idempotencyKey: z
      .string()
      .min(1)
      .max(100)
      .optional(),
  })
  .refine(
    (data) => {
      // Kiểm tra ngày hẹn không được trong quá khứ
      const parts = data.bookingDate.split('-').map(Number);
      if (parts.length !== 3) return false;
      const [year, month, day] = parts;
      const selectedDate = new Date(year, month - 1, day);
      if (
        selectedDate.getFullYear() !== year ||
        selectedDate.getMonth() !== month - 1 ||
        selectedDate.getDate() !== day
      ) {
        return false;
      }
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return selectedDate >= today;
    },
    {
      message: 'Ngày hẹn không thể là một ngày trong quá khứ',
      path: ['bookingDate'],
    }
  )
  .refine(
    (data) => Boolean(data.bookingTime || data.timeSlot),
    {
      message: 'Vui lòng chọn giờ hẹn',
      path: ['bookingTime'],
    }
  );

export type CreateBookingInput = z.infer<typeof CreateBookingSchema>;

/**
 * Schema cập nhật trạng thái lịch hẹn dành cho Admin CMS
 */
export const UpdateBookingStatusSchema = z
  .object({
    status: z.enum(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'], {
      required_error: 'Trạng thái lịch hẹn không hợp lệ',
    }),
    assignedStylistId: z.string().optional().nullable(),
    stylistId: z.string().optional().nullable(),
    internalNotes: z.string().max(1000, 'Ghi chú nội bộ tối đa 1000 ký tự').optional().nullable(),
    notes: z.string().max(1000, 'Ghi chú nội bộ tối đa 1000 ký tự').optional().nullable(),
    cancelReason: z.string().max(500, 'Lý do hủy tối đa 500 ký tự').optional().nullable(),
    cancellationReason: z.string().max(500, 'Lý do hủy tối đa 500 ký tự').optional().nullable(),
  })
  .transform((data) => {
    const finalStylist = data.stylistId !== undefined ? data.stylistId : data.assignedStylistId;
    const finalNotes = data.notes !== undefined ? data.notes : data.internalNotes;
    const finalReason = data.cancellationReason !== undefined ? data.cancellationReason : (data.cancelReason !== undefined ? data.cancelReason : finalNotes);

    return {
      status: data.status,
      assignedStylistId: finalStylist ?? null,
      stylistId: finalStylist ?? null,
      internalNotes: finalNotes ?? null,
      notes: finalNotes ?? null,
      cancelReason: finalReason ?? null,
      cancellationReason: finalReason ?? null,
    };
  });

export type UpdateBookingStatusInput = z.infer<typeof UpdateBookingStatusSchema>;

export function serializeBooking(b: any) {
  if (!b) return null;
  const dateStr = b.bookingDate instanceof Date
    ? b.bookingDate.toISOString().split('T')[0]
    : typeof b.bookingDate === 'string'
    ? b.bookingDate.split('T')[0]
    : b.bookingDate;

  const timeSlot = b.timeSlot || b.bookingTime || '09:00';
  const notes = b.notes || null;
  const internalNotes = b.internalNotes || null;
  const cancellationReason = b.cancellationReason || b.cancelReason || null;
  const stylistId = b.assignedStylistId || b.stylistId || null;
  const hairstyleId = b.hairstyleRefId || b.hairstyleId || null;
  const hairColorId = b.hairColorRefId || b.hairColorId || null;

  return {
    id: b.id,
    bookingCode: b.bookingCode,
    customerName: b.customerName,
    customerPhone: b.customerPhone,
    customerEmail: b.customerEmail || null,
    bookingDate: dateStr,
    timeSlot,
    bookingTime: timeSlot,
    status: b.status,
    notes,
    internalNotes,
    cancellationReason,
    cancelReason: cancellationReason,
    serviceId: b.serviceId || null,
    service: b.service ? {
      id: b.service.id,
      title: b.service.title,
      name: b.service.title,
      durationMinutes: b.service.durationMinutes,
      priceMin: b.service.priceMin !== undefined ? Number(b.service.priceMin) : undefined,
      priceMax: b.service.priceMax !== undefined && b.service.priceMax !== null ? Number(b.service.priceMax) : undefined,
    } : null,
    comboId: b.comboId || null,
    combo: b.combo ? {
      id: b.combo.id,
      title: b.combo.title,
      packagePrice: Number(b.combo.packagePrice),
      durationMinutes: b.combo.durationMinutes,
    } : null,
    hairstyleId,
    hairstyleRefId: hairstyleId,
    hairstyleRef: b.hairstyleRef ? {
      id: b.hairstyleRef.id,
      title: b.hairstyleRef.title,
      coverImageUrl: b.hairstyleRef.coverImageUrl,
      slug: b.hairstyleRef.slug,
    } : null,
    hairColorId,
    hairColorRefId: hairColorId,
    hairColorRef: b.hairColorRef ? {
      id: b.hairColorRef.id,
      name: b.hairColorRef.name,
      hexColor: b.hairColorRef.hexColor,
      code: b.hairColorRef.code,
    } : null,
    stylistId,
    assignedStylistId: stylistId,
    assignedStylist: b.assignedStylist ? {
      id: b.assignedStylist.id,
      fullName: b.assignedStylist.fullName,
      avatarUrl: b.assignedStylist.avatarUrl,
      specialties: b.assignedStylist.specialties || [],
    } : null,
    estimatedPrice: b.estimatedPrice ? Number(b.estimatedPrice) : null,
    idempotencyKey: b.idempotencyKey || null,
    createdAt: b.createdAt ? new Date(b.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: b.updatedAt ? new Date(b.updatedAt).toISOString() : new Date().toISOString(),
  };
}
