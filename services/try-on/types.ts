export type SupportedTryOnMimeType = 'image/jpeg' | 'image/png' | 'image/webp';

/**
 * Yêu cầu gửi đến dịch vụ thử tóc
 */
export interface TryOnRequest {
  /** Buffer ảnh chân dung người dùng (nhận từ multipart form / base64) */
  imageBuffer: Buffer;
  /** Định dạng ảnh hợp lệ */
  mimeType: SupportedTryOnMimeType;
  /** Định danh kiểu tóc muốn thử */
  hairstyleId: string;
  /** Định danh màu tóc muốn thử (tùy chọn) */
  hairColorId?: string;
  /** Các tùy chọn bổ sung */
  options?: {
    /** Độ đậm của màu tóc hoặc mức độ hòa trộn (0.0 - 1.0) */
    intensity?: number;
    /** Tên kiểu tóc (nếu có, để watermark) */
    hairstyleTitle?: string;
    /** Mã màu tóc hex (nếu có) */
    hairColorHex?: string;
    /** URL hoặc đường dẫn ảnh kiểu tóc được chọn để ghép */
    hairstyleImageUrl?: string;
  };
}

/**
 * Kết quả trả về từ dịch vụ thử tóc
 */
export interface TryOnResponse {
  /** Ảnh kết quả được mã hóa dưới dạng Base64 Data URL hoặc raw base64 */
  resultImageBase64: string;
  /** Định dạng MIME của ảnh kết quả */
  mimeType: string;
  /** Cờ đánh dấu rõ: true = kết quả mô phỏng (Mock/Demo), false = AI thực tế */
  isMock: boolean;
  /** Tên định danh của Engine đã xử lý */
  provider: string;
  /** Thời gian xử lý tính bằng mili-giây */
  processingTimeMs: number;
  /** Thông điệp watermark hoặc khuyến cáo stylist */
  notice?: string;
}

/**
 * Interface trừu tượng cho động cơ thử tóc
 */
export interface HairTryOnProvider {
  /** Tên của Provider (ví dụ: 'demo-tryon-provider', 'replicate-ai-provider') */
  readonly name: string;

  /**
   * Xử lý mô phỏng diện mạo tóc mới
   */
  processTryOn(request: TryOnRequest): Promise<TryOnResponse>;
}
