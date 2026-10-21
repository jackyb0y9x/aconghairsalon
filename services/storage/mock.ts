import fs from 'fs';
import path from 'path';
import { StorageProvider, UploadOptions, UploadResult } from './types';

// Danh sách URL ảnh chất lượng cao dự phòng cho salon sang trọng
const LUXURY_SALON_FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1605497788044-5a32c7078486?auto=format&fit=crop&w=800&q=80',
];

export class MockStorageProvider implements StorageProvider {
  readonly name = 'mock';

  async upload(fileBuffer: Buffer, fileName: string, options: UploadOptions): Promise<UploadResult> {
    // 1. Kiểm tra giới hạn kích thước tệp nếu có
    if (options.maxSizeBytes !== undefined && options.maxSizeBytes > 0 && fileBuffer.length > options.maxSizeBytes) {
      throw new Error(`Dung lượng tệp (${fileBuffer.length} bytes) vượt quá giới hạn cho phép (${options.maxSizeBytes} bytes)`);
    }

    const timestamp = Date.now();

    // 2. Làm sạch tên tệp và chống tấn công Path Traversal
    const normalizedName = fileName.replace(/\\/g, '/');
    const baseName = path.basename(normalizedName);
    let sanitizedFileName = baseName
      .replace(/\.\.+/g, '')
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/\.\.+/g, '')
      .replace(/^\.+/, '');

    if (!sanitizedFileName || sanitizedFileName === '.') {
      sanitizedFileName = `file_${timestamp}.jpg`;
    }

    // 3. Làm sạch folder
    const folder = (options.folder || 'general')
      .replace(/\\/g, '/')
      .replace(/\.\.+/g, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_');

    const publicId = `mock_${folder}_${timestamp}_${sanitizedFileName}`;

    // 4. Xác định mimeType
    const ext = path.extname(sanitizedFileName).toLowerCase();
    let mimeType = 'image/jpeg';
    if (ext === '.png') mimeType = 'image/png';
    else if (ext === '.webp') mimeType = 'image/webp';
    else if (ext === '.svg') mimeType = 'image/svg+xml';
    else if (ext === '.gif') mimeType = 'image/gif';

    // Đảm bảo mimeType nằm trong allowedMimeTypes nếu được chỉ định
    if (options.allowedMimeTypes && options.allowedMimeTypes.length > 0) {
      if (!options.allowedMimeTypes.includes(mimeType)) {
        mimeType = options.allowedMimeTypes[0];
      }
    }

    // Thử ghi tệp vào public/uploads nếu cho phép và đang chạy trong môi trường local
    const shouldSaveToDisk = process.env.STORAGE_SAVE_LOCAL_DISK === 'true' || process.env.NODE_ENV === 'development';

    if (shouldSaveToDisk) {
      try {
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', folder);
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        const targetFilePath = path.join(uploadDir, `${timestamp}_${sanitizedFileName}`);
        fs.writeFileSync(targetFilePath, fileBuffer);

        return {
          url: `/uploads/${folder}/${timestamp}_${sanitizedFileName}`,
          publicId,
          sizeBytes: fileBuffer.length,
          mimeType,
          width: 800,
          height: 800,
        };
      } catch (err) {
        console.warn('[MockStorageProvider] Không thể ghi file vào ổ đĩa cục bộ (có thể do môi trường Serverless/Vercel read-only):', err);
      }
    }

    // Fallback thông minh: Nếu không ghi được vào ổ đĩa (Vercel Serverless read-only),
    // chuyển đổi tệp thành Data URI Base64 để ảnh thực tế của người dùng được lưu trữ và hiển thị 100% chính xác
    if (fileBuffer.length <= 4.5 * 1024 * 1024) {
      const dataUri = `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
      return {
        url: dataUri,
        publicId,
        sizeBytes: fileBuffer.length,
        mimeType,
        width: 800,
        height: 800,
      };
    }

    // Fallback cuối cùng: Structured Mock URL sang trọng nếu tệp quá lớn
    const hash = Math.abs(sanitizedFileName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0));
    const fallbackImage = LUXURY_SALON_FALLBACK_IMAGES[hash % LUXURY_SALON_FALLBACK_IMAGES.length];
    const structuredUrl = `${fallbackImage}&mock_id=${publicId}`;

    return {
      url: structuredUrl,
      publicId,
      sizeBytes: fileBuffer.length,
      mimeType,
      width: 800,
      height: 800,
    };
  }

  async delete(publicId: string): Promise<boolean> {
    try {
      // Định dạng publicId: mock_<folder>_<timestamp>_<fileName>
      // folder có thể chứa dấu gạch dưới (ví dụ: hair_colors, before_after)
      // timestamp là chuỗi số 10-15 chữ số
      const match = publicId.match(/^mock_(.+)___?(\d{10,15})_(.+)$/) || publicId.match(/^mock_(.+)_(\d{10,15})_(.+)$/);
      if (match) {
        const folder = match[1];
        const timestamp = match[2];
        const fileName = match[3];
        const localPath = path.join(process.cwd(), 'public', 'uploads', folder, `${timestamp}_${fileName}`);
        if (fs.existsSync(localPath)) {
          fs.unlinkSync(localPath);
        }
      } else {
        const parts = publicId.split('_');
        if (parts.length >= 4) {
          const folder = parts.slice(1, -2).join('_');
          const timestamp = parts[parts.length - 2];
          const fileName = parts[parts.length - 1];
          const localPath = path.join(process.cwd(), 'public', 'uploads', folder, `${timestamp}_${fileName}`);
          if (fs.existsSync(localPath)) {
            fs.unlinkSync(localPath);
          }
        }
      }
    } catch {
      // Bỏ qua lỗi xóa cục bộ
    }
    return true;
  }

  getOptimizedUrl(publicId: string, options?: UploadOptions['transformation']): string {
    const width = options?.width || 800;
    const quality = options?.quality || 80;
    return `https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=${width}&q=${quality}#${publicId}`;
  }
}
