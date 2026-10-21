import { z } from 'zod';

/**
 * Định dạng MIME ảnh hợp lệ cho công cụ thử tóc AI
 */
export const ALLOWED_TRYON_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export type AllowedTryOnMimeType = (typeof ALLOWED_TRYON_MIME_TYPES)[number];

/**
 * Giới hạn dung lượng tệp tối đa: 5.0 MB (5,242,880 bytes)
 */
export const MAX_TRYON_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Zod Schema cho các tùy chọn mô phỏng nâng cao
 */
export const TryOnOptionsSchema = z.object({
  /** Độ đậm màu sắc hoặc mức hòa trộn (0.0 - 1.0) */
  intensity: z
    .number()
    .min(0, 'Mức độ đậm tối thiểu là 0.0')
    .max(1, 'Mức độ đậm tối đa là 1.0')
    .optional(),
  /** Tên hiển thị của kiểu tóc để watermark */
  hairstyleTitle: z.string().max(100, 'Tên kiểu tóc tối đa 100 ký tự').optional(),
  /** Mã màu hex (ví dụ: #C5A880) */
  hairColorHex: z
    .string()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Mã màu hex không hợp lệ')
    .optional(),
});

export type TryOnOptionsInput = z.infer<typeof TryOnOptionsSchema>;

/**
 * Zod Schema cho dữ liệu JSON gửi lên API /api/try-on
 */
export const TryOnJsonRequestSchema = z.object({
  imageBase64: z.string().optional(),
  imageBuffer: z.any().optional(),
  mimeType: z
    .string({ required_error: 'Định dạng ảnh là bắt buộc' })
    .optional(),
  hairstyleId: z
    .string({ required_error: 'Vui lòng chọn kiểu tóc cần thử nghiệm' })
    .min(1, 'Vui lòng chọn kiểu tóc cần thử nghiệm'),
  hairColorId: z.string().optional().nullable(),
  options: TryOnOptionsSchema.optional(),
  fileName: z.string().optional(),
});

export type TryOnJsonRequestInput = z.infer<typeof TryOnJsonRequestSchema>;

/**
 * Cấu trúc phản hồi từ API /api/try-on
 */
export interface TryOnApiResponse {
  success?: boolean;
  resultImageBase64: string;
  mimeType: string;
  isMock: boolean;
  provider: string;
  processingTimeMs: number;
  appliedStyleId: string;
  appliedColorId: string | null;
  privacyValidated: boolean;
  notice?: string;
  // BẢO MẬT: Tuyệt đối không chứa diskPath hoặc serverFilePath
  diskPath?: undefined;
  serverFilePath?: undefined;
}
