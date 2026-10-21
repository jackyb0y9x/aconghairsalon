import { v2 as cloudinary } from 'cloudinary';
import { StorageProvider, UploadOptions, UploadResult } from './types';

export class CloudinaryStorageProvider implements StorageProvider {
  readonly name = 'cloudinary';

  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
  }

  async upload(fileBuffer: Buffer, fileName: string, options: UploadOptions): Promise<UploadResult> {
    const folder = `lumiere-salon/${options.folder || 'general'}`;
    const cleanFileName = fileName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: `${Date.now()}_${cleanFileName}`,
          resource_type: 'image',
          transformation: [
            {
              quality: options.transformation?.quality || 'auto',
              fetch_format: 'auto',
              width: options.transformation?.width,
              height: options.transformation?.height,
              crop: options.transformation?.crop || 'limit',
            },
          ],
        },
        (error, result) => {
          if (error || !result) {
            return reject(new Error(`[CloudinaryStorageProvider] Tải ảnh lên thất bại: ${error?.message || 'Không có phản hồi'}`));
          }

          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            sizeBytes: result.bytes,
            mimeType: `image/${result.format}`,
            width: result.width,
            height: result.height,
          });
        }
      );

      uploadStream.end(fileBuffer);
    });
  }

  async delete(publicId: string): Promise<boolean> {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result.result === 'ok';
    } catch (err) {
      console.error(`[CloudinaryStorageProvider] Lỗi khi xóa tệp ${publicId}:`, err);
      return false;
    }
  }

  getOptimizedUrl(publicId: string, options?: UploadOptions['transformation']): string {
    return cloudinary.url(publicId, {
      quality: options?.quality || 'auto',
      fetch_format: 'auto',
      width: options?.width,
      height: options?.height,
      crop: options?.crop || 'fill',
      secure: true,
    });
  }
}
