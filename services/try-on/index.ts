import { HairTryOnProvider } from './types';
import { DemoHairTryOnProvider } from './demo';

let cachedTryOnProvider: HairTryOnProvider | null = null;

/**
 * Trả về instance của HairTryOnProvider dựa trên biến môi trường TRYON_PROVIDER.
 * Mặc định trả về DemoHairTryOnProvider.
 */
export function getHairTryOnProvider(): HairTryOnProvider {
  if (cachedTryOnProvider) {
    return cachedTryOnProvider;
  }

  const providerType = (process.env.TRYON_PROVIDER || 'demo').toLowerCase().trim();

  if (providerType === 'demo') {
    cachedTryOnProvider = new DemoHairTryOnProvider();
    return cachedTryOnProvider;
  }

  // Fallback an toàn nếu providerType không được hỗ trợ
  console.warn(`[TryOnFactory] TRYON_PROVIDER='${providerType}' chưa được đăng ký, tự động dùng DemoHairTryOnProvider.`);
  cachedTryOnProvider = new DemoHairTryOnProvider();
  return cachedTryOnProvider;
}

export function resetHairTryOnProvider(): void {
  cachedTryOnProvider = null;
}

export * from './types';
export * from './demo';
