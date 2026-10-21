import { StorageProvider } from './types';
import { MockStorageProvider } from './mock';
import { CloudinaryStorageProvider } from './cloudinary';

let cachedStorageProvider: StorageProvider | null = null;

/**
 * Trả về instance của StorageProvider dựa trên biến môi trường STORAGE_PROVIDER.
 * Tự động fallback về MockStorageProvider nếu cấu hình Cloudinary thiếu hoặc provider là 'mock'.
 */
export function getStorageProvider(): StorageProvider {
  if (cachedStorageProvider) {
    return cachedStorageProvider;
  }

  const providerType = (process.env.STORAGE_PROVIDER || 'mock').toLowerCase().trim();

  if (providerType === 'cloudinary') {
    const hasCloudinaryKeys =
      Boolean(process.env.CLOUDINARY_CLOUD_NAME) &&
      Boolean(process.env.CLOUDINARY_API_KEY) &&
      Boolean(process.env.CLOUDINARY_API_SECRET);

    if (hasCloudinaryKeys) {
      cachedStorageProvider = new CloudinaryStorageProvider();
      return cachedStorageProvider;
    }

    console.warn(
      '[StorageFactory] STORAGE_PROVIDER=cloudinary nhưng thiếu thông tin xác thực trong .env. Tự động fallback về MockStorageProvider.'
    );
  }

  cachedStorageProvider = new MockStorageProvider();
  return cachedStorageProvider;
}

/**
 * Hàm hỗ trợ reset provider cache phục vụ cho Unit / Integration Testing
 */
export function resetStorageProvider(): void {
  cachedStorageProvider = null;
}

export * from './types';
export * from './mock';
export * from './cloudinary';
