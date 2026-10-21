/**
 * Tùy chọn tải lên tệp tin
 */
export interface UploadOptions {
  /** Thư mục phân loại trên storage (ví dụ: 'hairstyles', 'colors', 'before-after', 'avatars') */
  folder: string;
  /** Danh sách định dạng MIME được phép tải lên */
  allowedMimeTypes?: string[];
  /** Dung lượng tối đa tính bằng byte (mặc định: 5MB = 5 * 1024 * 1024) */
  maxSizeBytes?: number;
  /** Tùy chọn chuyển đổi và tối ưu ảnh */
  transformation?: {
    width?: number;
    height?: number;
    crop?: 'fill' | 'fit' | 'scale' | 'thumb';
    quality?: number | 'auto';
  };
}

/**
 * Kết quả trả về sau khi tải lên tệp tin thành công
 */
export interface UploadResult {
  /** URL truy cập công khai của tệp tin */
  url: string;
  /** Định danh duy nhất của tệp tin trên storage phục vụ việc xóa hoặc truy vấn */
  publicId: string;
  /** Dung lượng tệp tính bằng byte */
  sizeBytes: number;
  /** Định dạng MIME của tệp (ví dụ: 'image/jpeg', 'image/png') */
  mimeType: string;
  /** Chiều rộng ảnh (nếu là ảnh) */
  width?: number;
  /** Chiều cao ảnh (nếu là ảnh) */
  height?: number;
}

/**
 * Interface trừu tượng cho nhà cung cấp dịch vụ lưu trữ đám mây
 */
export interface StorageProvider {
  /** Tên định danh của provider (ví dụ: 'mock', 'cloudinary', 'supabase') */
  readonly name: string;

  /**
   * Tải buffer tệp tin lên kho lưu trữ
   * @param fileBuffer Buffer nhị phân của tệp tin
   * @param fileName Tên tệp gốc kèm phần mở rộng
   * @param options Các tùy chọn thư mục, kích thước và định dạng
   */
  upload(fileBuffer: Buffer, fileName: string, options: UploadOptions): Promise<UploadResult>;

  /**
   * Xóa tệp tin khỏi kho lưu trữ dựa vào publicId
   * @param publicId Định danh tệp cần xóa
   * @returns true nếu xóa thành công, false nếu thất bại
   */
  delete(publicId: string): Promise<boolean>;

  /**
   * Tạo URL tối ưu hóa (tùy chọn)
   */
  getOptimizedUrl?(publicId: string, options?: UploadOptions['transformation']): string;
}
