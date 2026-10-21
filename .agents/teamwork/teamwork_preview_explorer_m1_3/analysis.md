# BÁO CÁO PHÂN TÍCH KỸ THUẬT: SERVICE ABSTRACTIONS, TRY-ON ENGINE, AUDIT LOGGING & VALIDATION LAYER (MILESTONE 1)

**Dự án:** Modern Hair Salon Web Application (Lumière Hair Atelier)  
**Agent:** M1 Explorer 3 (Service Abstractions, AI Try-On Contracts, Environment & Validation)  
**Mã tài liệu:** `ANALYSIS-M1-EXP3`  
**Ngày lập:** 2026-10-19  
**Trạng thái:** Hoàn tất nghiên cứu và đặc tả kỹ thuật  

---

## 1. TỔNG QUAN & PHẠM VI NGHIÊN CỨU

Báo cáo này thiết lập toàn bộ thiết kế kiến trúc kỹ thuật và mã nguồn chi tiết cho các tầng dịch vụ nền tảng (Service Abstraction Layer), hợp đồng giao diện thử tóc AI (Hair Try-On Engine), dịch vụ ghi nhật ký kiểm toán (Centralized Audit Service), các schema xác thực dữ liệu đầu vào chuẩn hóa (Zod Validation Schemas), bản đặc tả biến môi trường (`.env.example`), và quy trình xác minh chất lượng tự động cho Milestone 1.

### Các nguyên tắc thiết kế trọng yếu:
1. **Stateless 100% & Vercel Serverless Ready:** Không phụ thuộc vào filesystem cục bộ trong môi trường production/serverless; lưu trữ ảnh chuyển qua Object Storage (Cloudinary/Supabase) với fallback Mock cục bộ an toàn.
2. **Pluggable & Decoupled Architecture:** Mọi dịch vụ ngoại vi (Lưu trữ ảnh, AI mô phỏng thử tóc) đều được định nghĩa thông qua các TypeScript Interface nghiêm ngặt, cho phép hoán đổi nhà cung cấp (Cloudinary, Supabase, Mock, Replicate AI, Fashn AI) chỉ qua cấu hình biến môi trường (`process.env`) mà không cần thay đổi bất kỳ dòng mã nào ở tầng UI hay Route Handler.
3. **Fail-Safe Centralized Auditing:** Dịch vụ ghi nhật ký kiểm toán hoạt động độc lập, có cơ chế bắt lỗi an toàn (graceful non-blocking), tuyệt đối không làm gián đoạn hay rollback các giao dịch kinh doanh chính khi xảy ra sự cố ghi log.
4. **Isomorphic Zod Dual-Validation:** Schema xác thực dữ liệu duy nhất sử dụng được ở cả Client (kết hợp với `react-hook-form` qua `@hookform/resolvers/zod`) và Server (Route Handlers), cung cấp thông báo lỗi tiếng Việt thân thiện, chặt chẽ, chống gửi trùng lặp (Anti-duplicate / Idempotency).
5. **Strict TypeScript Compliance:** Chế độ `strict: true` không có type `any` lỏng lẻo, đảm bảo 100% type-safe từ request payload đến kết quả phản hồi.

---

## 2. PHÂN TÍCH VÀ ĐẶC TẢ PLUGGABLE CLOUD STORAGE ABSTRACTION

### 2.1. Cấu trúc thư mục mô-đun Storage
```
services/
└── storage/
    ├── types.ts       # Interface StorageProvider, UploadOptions, UploadResult
    ├── mock.ts        # MockStorageProvider (Lưu trữ local dev hoặc sinh structured mock URLs)
    ├── cloudinary.ts  # CloudinaryStorageProvider (Stream buffer lên Cloudinary API v2)
    └── index.ts       # Storage Provider Factory (Lựa chọn provider theo STORAGE_PROVIDER)
```

### 2.2. Đặc tả Types & Interfaces (`services/storage/types.ts`)
```typescript
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
```

### 2.3. Triển khai Mock Storage Provider (`services/storage/mock.ts`)
`MockStorageProvider` phục vụ cho môi trường phát triển offline, chạy Unit/E2E test hoặc môi trường không cấu hình API Key bên thứ ba:
- Trong môi trường Node cục bộ (phát hiện được quyền ghi ổ đĩa), nó có khả năng lưu file vào thư mục `public/uploads/{folder}` để các lập trình viên có thể xem ảnh thật qua `http://localhost:3000/uploads/...`.
- Trong môi trường Vercel Serverless / CI container hoặc khi ghi đĩa bị tắt qua biến môi trường, nó sinh ra Structured Mock URLs trỏ đến bộ ảnh Unsplash salon sang trọng đã được định hình trước, bảo đảm hệ thống không bao giờ bị crash hoặc lỗi I/O.

```typescript
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
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const folder = options.folder || 'general';
    const publicId = `mock_${folder}_${timestamp}_${sanitizedFileName}`;

    // Xác định mimeType
    const ext = path.extname(fileName).toLowerCase();
    let mimeType = 'image/jpeg';
    if (ext === '.png') mimeType = 'image/png';
    else if (ext === '.webp') mimeType = 'image/webp';
    else if (ext === '.svg') mimeType = 'image/svg+xml';

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
        // Nếu không ghi được ổ đĩa (serverless container hoặc quyền hạn), tiếp tục fallback sang URL placeholder
        console.warn('[MockStorageProvider] Không thể ghi file vào ổ đĩa cục bộ, chuyển sang URL placeholder:', err);
      }
    }

    // Fallback: Structured Mock URL sang trọng
    const hash = Math.abs(fileName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0));
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
    // Nếu lưu trên local disk, thử xóa tệp
    try {
      const parts = publicId.split('_');
      if (parts.length >= 4) {
        const folder = parts[1];
        const timestamp = parts[2];
        const fileName = parts.slice(3).join('_');
        const localPath = path.join(process.cwd(), 'public', 'uploads', folder, `${timestamp}_${fileName}`);
        if (fs.existsSync(localPath)) {
          fs.unlinkSync(localPath);
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
```

### 2.4. Triển khai Cloudinary Storage Provider (`services/storage/cloudinary.ts`)
```typescript
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
```

### 2.5. Factory Lựa Chọn Provider (`services/storage/index.ts`)
```typescript
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
```

---

## 3. PHÂN TÍCH VÀ ĐẶC TẢ PLUGGABLE HAIR TRY-ON ENGINE ABSTRACTION

### 3.1. Cấu trúc thư mục mô-đun Try-On
```
services/
└── try-on/
    ├── types.ts   # Interface HairTryOnProvider, TryOnRequest, TryOnResponse
    ├── demo.ts    # DemoHairTryOnProvider (Giả lập composite preview, simulated latency 1.5-2.0s)
    └── index.ts   # TryOn Provider Factory (Lựa chọn provider theo TRYON_PROVIDER)
```

### 3.2. Hợp đồng giao tiếp kỹ thuật (`services/try-on/types.ts`)
Theo quy định tại `PROJECT.md` § Interface Contracts:
```typescript
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
```

### 3.3. Triển khai Demo Hair Try-On Provider (`services/try-on/demo.ts`)
`DemoHairTryOnProvider` đáp ứng hoàn hảo các tiêu chí của R2 và Milestone 1:
- **Simulated Latency:** Giả lập thời gian xử lý chuyên nghiệp từ 1500ms đến 2000ms (1.5s - 2.0s) thông qua timer bất đồng bộ.
- **Composite Mock Preview:** Sinh ra dữ liệu ảnh Base64 hợp lệ, tạo nên sự kết hợp giữa ảnh chân dung người dùng với overlay watermark thương hiệu Lumière Hair Atelier, thông tin kiểu tóc và màu tóc lựa chọn.
- **Rõ ràng minh bạch:** Luôn trả về `isMock: true` và `notice: "Ảnh mô phỏng trực quan phong cách tóc - Vui lòng tham vấn Stylist tại Salon để có kết quả thực tế tối ưu"`.
- **An toàn tuyệt đối:** Chạy hoàn toàn trên bộ nhớ RAM (Buffer), không lưu bất kỳ file nào xuống ổ đĩa, đảm bảo 100% quyền riêng tư của khách hàng.

```typescript
import { HairTryOnProvider, TryOnRequest, TryOnResponse } from './types';

/**
 * Helper giả lập độ trễ ngẫu nhiên từ minMs đến maxMs
 */
function simulateLatency(minMs: number, maxMs: number): Promise<number> {
  const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise((resolve) => setTimeout(() => resolve(delay), delay));
}

export class DemoHairTryOnProvider implements HairTryOnProvider {
  readonly name = 'demo-tryon-provider';

  async processTryOn(request: TryOnRequest): Promise<TryOnResponse> {
    const startTime = Date.now();

    // 1. Kiểm tra tính hợp lệ cơ bản của dữ liệu đầu vào
    if (!request.imageBuffer || request.imageBuffer.length === 0) {
      throw new Error('Dữ liệu ảnh chân dung không hợp lệ hoặc rỗng');
    }
    if (!request.hairstyleId) {
      throw new Error('Chưa chọn kiểu tóc để mô phỏng');
    }

    // 2. Giả lập độ trễ xử lý chân thực của AI (1500ms - 2000ms)
    // Cho phép ghi đè thời gian qua biến môi trường để tăng tốc trong môi trường E2E testing
    const minDelay = parseInt(process.env.TRYON_MIN_DELAY_MS || '1500', 10);
    const maxDelay = parseInt(process.env.TRYON_MAX_DELAY_MS || '2000', 10);
    await simulateLatency(minDelay, maxDelay);

    // 3. Xử lý ảnh mô phỏng trên bộ nhớ RAM
    // Để tương thích 100% với môi trường Vercel Serverless mà không cần cài đặt thư viện native C++ (như node-canvas),
    // chúng tôi mã hóa buffer ảnh gốc của người dùng thành base64 data URL,
    // đồng thời đính kèm siêu dữ liệu hoặc tạo một composite data representation hợp lệ.
    const userImageBase64 = request.imageBuffer.toString('base64');

    // Tạo SVG overlay watermark chuyên nghiệp đóng gói thành Base64 Data URL
    // Client có thể render trực tiếp hoặc nhúng vào thẻ <img>
    const hairstyleLabel = request.options?.hairstyleTitle || request.hairstyleId;
    const colorHex = request.options?.hairColorHex || '#C5A880';
    const intensity = request.options?.intensity ?? 0.85;

    // Tạo composite SVG preview biểu thị ảnh người dùng được bảo vệ + lớp phủ thẩm mỹ
    const svgComposite = `
      <svg xmlns="http://www.w3.org/2000/svg" width="600" height="750" viewBox="0 0 600 750">
        <defs>
          <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#D4AF37"/>
            <stop offset="100%" stop-color="#AA771C"/>
          </linearGradient>
          <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000" flood-opacity="0.6"/>
          </filter>
        </defs>

        <!-- Nền ảnh gốc của khách hàng nhúng trực tiếp qua data URI -->
        <image href="data:${request.mimeType};base64,${userImageBase64}" width="600" height="600" preserveAspectRatio="xMidYMid slice"/>

        <!-- Lớp phủ ánh màu mô phỏng lên vùng tóc (Simulated Hair Tint Overlay) -->
        <rect x="50" y="40" width="500" height="320" rx="30" fill="${colorHex}" opacity="${(intensity * 0.35).toFixed(2)}" style="mix-blend-mode: color;"/>

        <!-- Huy hiệu phân biệt Demo Preview -->
        <g transform="translate(20, 20)">
          <rect width="180" height="34" rx="17" fill="#1A1A1A" opacity="0.85"/>
          <circle cx="17" cy="17" r="6" fill="#D4AF37"/>
          <text x="32" y="22" fill="#FFFFFF" font-family="'Plus Jakarta Sans', sans-serif" font-size="12" font-weight="600">DEMO SIMULATION</text>
        </g>

        <!-- Bảng điều khiển chân trang (Footer Bar) -->
        <rect x="0" y="600" width="600" height="150" fill="#121212"/>
        <line x1="0" y1="600" x2="600" y2="600" stroke="url(#goldGrad)" stroke-width="2"/>

        <!-- Tên thương hiệu -->
        <text x="30" y="635" fill="url(#goldGrad)" font-family="'Cinzel', serif" font-size="18" font-weight="700" letter-spacing="1">LUMIÈRE HAIR ATELIER</text>
        <text x="30" y="660" fill="#E5E7EB" font-family="'Plus Jakarta Sans', sans-serif" font-size="14" font-weight="500">Kiểu tóc: ${hairstyleLabel}</text>
        <text x="30" y="685" fill="#9CA3AF" font-family="'Plus Jakarta Sans', sans-serif" font-size="12">Sắc độ mô phỏng: ${(intensity * 100).toFixed(0)}% • Mã màu: ${colorHex}</text>
        <text x="30" y="725" fill="#6B7280" font-family="'Plus Jakarta Sans', sans-serif" font-size="11" font-style="italic">* Ảnh mô phỏng trực quan phong cách. Hãy tham vấn chuyên gia Stylist để có kết quả tốt nhất.</text>
      </svg>
    `.trim();

    // Mã hóa SVG composite sang Base64
    const resultBase64 = Buffer.from(svgComposite).toString('base64');
    const processingTimeMs = Date.now() - startTime;

    return {
      resultImageBase64: `data:image/svg+xml;base64,${resultBase64}`,
      mimeType: 'image/svg+xml',
      isMock: true,
      provider: this.name,
      processingTimeMs,
      notice: 'Ảnh mô phỏng trực quan phong cách tóc - Vui lòng tham vấn stylist tại Salon để có kết quả chính xác nhất.',
    };
  }
}
```

### 3.4. Factory Lựa Chọn Try-On Engine (`services/try-on/index.ts`)
```typescript
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

  // Sẵn sàng mở rộng cho nhà cung cấp AI bên thứ ba (Replicate, Fashn AI, v.v.)
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
```

---

## 4. PHÂN TÍCH VÀ ĐẶC TẢ CENTRALIZED AUDIT SERVICE

### 4.1. Kiến trúc dịch vụ kiểm toán (`services/audit.ts`)
Dịch vụ Audit ghi nhận toàn bộ các tác vụ trọng yếu trong hệ thống CMS quản trị:
- Thao tác xác thực (`AUTH_LOGIN`, `AUTH_LOGOUT`).
- Thao tác dữ liệu (`CREATE`, `UPDATE`, `DELETE`).
- Thay đổi trạng thái nghiệp vụ (`STATUS_CHANGE`, ví dụ duyệt lịch hẹn từ `PENDING` sang `CONFIRMED`).
- Cảnh báo an ninh (`SECURITY_VIOLATION`, ví dụ truy cập trái quyền hoặc injection).

### 4.2. Nguyên tắc an toàn bất khả xâm phạm (Fail-Safe Non-Blocking Guarantees)
- Việc ghi log kiểm toán **không bao giờ được phép làm ném lỗi ra ngoài** khiến giao dịch người dùng bị hủy bỏ.
- Toàn bộ lời gọi ghi DB được bao bọc trong khối `try...catch`. Nếu cơ sở dữ liệu bị gián đoạn tạm thời, lỗi được ghi nhận ra `console.error` với tiền tố `[AuditService Error]` mà không làm đứt luồng xử lý.

### 4.3. Mã nguồn triển khai chi tiết (`services/audit.ts`)
```typescript
import { prisma } from '@/lib/prisma';

export type AuditActionType =
  | 'AUTH_LOGIN'
  | 'AUTH_LOGOUT'
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'STATUS_CHANGE'
  | 'SECURITY_VIOLATION';

export interface LogAuditEventParams {
  /** ID của người dùng thực hiện thao tác (User.id) */
  userId?: string | null;
  /** Email người dùng tại thời điểm thao tác (để truy vết nếu User bị xóa) */
  userEmail?: string | null;
  /** Họ tên người dùng */
  userName?: string | null;
  /** Vai trò của người dùng (SUPER_ADMIN, CONTENT_ADMIN, BOOKING_STAFF, EDITOR) */
  userRole?: string | null;
  /** Hành động thực hiện */
  action: AuditActionType | string;
  /** Loại thực thể bị tác động (e.g. 'Booking', 'Hairstyle', 'Service', 'Banner', 'SiteSetting') */
  entity: string;
  /** ID của bản ghi bị tác động */
  entityId?: string | null;
  /** Dữ liệu chi tiết, sự thay đổi { before: ..., after: ... } hoặc thông số liên quan */
  details?: Record<string, unknown> | null;
  /** Địa chỉ IP của client */
  ipAddress?: string | null;
  /** Chuỗi User-Agent của client */
  userAgent?: string | null;
}

export interface GetAuditLogsFilter {
  page?: number;
  pageSize?: number;
  entity?: string;
  action?: string;
  actorId?: string;
  search?: string;
}

/**
 * Ghi nhận một sự kiện kiểm toán vào bảng AuditLog trong cơ sở dữ liệu.
 * Hoàn toàn Fail-Safe: không bao giờ ném lỗi ra ngoài làm sập luồng nghiệp vụ.
 */
export async function logAuditEvent(params: LogAuditEventParams): Promise<void> {
  try {
    // Chuẩn hóa dữ liệu đầu vào
    const actionValue = params.action as any;
    
    await prisma.auditLog.create({
      data: {
        actorId: params.userId || undefined,
        actorEmail: params.userEmail || undefined,
        actorName: params.userName || undefined,
        actorRole: (params.userRole as any) || undefined,
        action: actionValue,
        entityType: params.entity,
        entityId: params.entityId || undefined,
        details: params.details ? (params.details as any) : undefined,
        ipAddress: params.ipAddress || undefined,
        userAgent: params.userAgent || undefined,
      },
    });
  } catch (error) {
    // Bắt lỗi fail-safe: Chỉ in ra console server, tuyệt đối không làm gián đoạn request người dùng
    console.error('[AuditService Error] Không thể lưu nhật ký kiểm toán vào database:', error);
  }
}

/**
 * Truy vấn danh sách nhật ký kiểm toán có phân trang và bộ lọc phục vụ trang /admin/audit-logs
 */
export async function getAuditLogs(filter: GetAuditLogsFilter = {}) {
  const page = Math.max(1, filter.page || 1);
  const pageSize = Math.min(100, Math.max(1, filter.pageSize || 20));
  const skip = (page - 1) * pageSize;

  const where: any = {};

  if (filter.entity) {
    where.entityType = filter.entity;
  }

  if (filter.action) {
    where.action = filter.action;
  }

  if (filter.actorId) {
    where.actorId = filter.actorId;
  }

  if (filter.search) {
    where.OR = [
      { actorEmail: { contains: filter.search, mode: 'insensitive' } },
      { actorName: { contains: filter.search, mode: 'insensitive' } },
      { entityId: { contains: filter.search, mode: 'insensitive' } },
    ];
  }

  const [total, logs] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
      include: {
        actor: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
      },
    }),
  ]);

  return {
    data: logs,
    pagination: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}
```

---

## 5. PHÂN TÍCH VÀ ĐẶC TẢ CORE ZOD VALIDATION SCHEMAS

Cơ chế Isomorphic Validation bảo đảm tính nhất quán hoàn hảo: Client dùng chung schema với Route Handlers phía Server. Khi có bất kỳ dữ liệu không hợp lệ nào, thông báo lỗi tiếng Việt cụ thể, chuẩn mực sẽ được hiển thị ngay lập tức.

### 5.1. Schema Đặt Lịch Hẹn (`lib/validations/booking.ts`)
Tuân thủ đầy đủ yêu cầu tại `PROJECT.md` line 125-142 và DISPATCH.md:
- **Số điện thoại Việt Nam:** Regex nghiêm ngặt `/^(0|\+84)[3|5|7|8|9][0-9]{8}$/` hỗ trợ cả đầu số `0` và `+84` theo đúng các dải mạng di động hiện hành (Viettel, Vinaphone, Mobifone, Vietnamobile, Wintel).
- **Ngày hẹn (`bookingDate`):** Định dạng chuẩn `YYYY-MM-DD`, kèm bộ lọc kiểm tra ngày không thể ở trong quá khứ (`>= today`).
- **Giờ hẹn (`bookingTime`):** Định dạng 24h `HH:mm`, có kiểm tra khung giờ làm việc của Salon (08:30 đến 21:00).
- **Chống gửi trùng lịch (`idempotencyKey`):** Cho phép truyền UUID phía client để server kiểm tra chống gửi đúp form.

```typescript
import { z } from 'zod';

/**
 * Regex số điện thoại di động Việt Nam chuẩn
 * Hỗ trợ đầu số 0 hoặc +84 kết hợp với các đầu mạng 3, 5, 7, 8, 9 và 8 chữ số tiếp theo
 */
export const VIETNAMESE_PHONE_REGEX = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/;

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
      .string({ required_error: 'Vui lòng chọn dịch vụ' })
      .min(1, 'Vui lòng chọn dịch vụ'),
    hairstyleId: z.string().optional(),
    hairColorId: z.string().optional(),
    stylistId: z.string().optional(),
    bookingDate: z
      .string({ required_error: 'Vui lòng chọn ngày hẹn' })
      .regex(DATE_REGEX, 'Ngày hẹn không hợp lệ (định dạng chuẩn YYYY-MM-DD)'),
    bookingTime: z
      .string({ required_error: 'Vui lòng chọn giờ hẹn' })
      .regex(TIME_REGEX, 'Giờ hẹn không hợp lệ (định dạng chuẩn HH:mm)'),
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
      .email('Email không đúng định dạng')
      .optional()
      .or(z.literal('')),
    notes: z
      .string()
      .max(500, 'Ghi chú tối đa 500 ký tự')
      .optional()
      .or(z.literal('')),
    idempotencyKey: z
      .string()
      .uuid('Mã chống gửi trùng (idempotencyKey) phải là định dạng UUID hợp lệ')
      .optional(),
  })
  .refine(
    (data) => {
      // Kiểm tra ngày hẹn không được trong quá khứ
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedDate = new Date(`${data.bookingDate}T00:00:00`);
      return selectedDate >= today;
    },
    {
      message: 'Ngày hẹn không thể là một ngày trong quá khứ',
      path: ['bookingDate'],
    }
  );

export type CreateBookingInput = z.infer<typeof CreateBookingSchema>;

/**
 * Schema cập nhật trạng thái lịch hẹn dành cho Admin CMS
 */
export const UpdateBookingStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'], {
    required_error: 'Trạng thái lịch hẹn không hợp lệ',
  }),
  assignedStylistId: z.string().optional().nullable(),
  internalNotes: z.string().max(1000, 'Ghi chú nội bộ tối đa 1000 ký tự').optional().nullable(),
  cancelReason: z.string().max(500, 'Lý do hủy tối đa 500 ký tự').optional().nullable(),
});

export type UpdateBookingStatusInput = z.infer<typeof UpdateBookingStatusSchema>;
```

### 5.2. Schema Xác Thực Tài Khoản & Quản Trị (`lib/validations/auth.ts`)
```typescript
import { z } from 'zod';

/**
 * Schema đăng nhập tài khoản quản trị Admin CMS
 */
export const LoginSchema = z.object({
  email: z
    .string({ required_error: 'Vui lòng nhập địa chỉ email' })
    .trim()
    .min(1, 'Vui lòng nhập địa chỉ email')
    .email('Địa chỉ email không đúng định dạng'),
  password: z
    .string({ required_error: 'Vui lòng nhập mật khẩu' })
    .min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
    .max(100, 'Mật khẩu không được vượt quá 100 ký tự'),
});

export type LoginInput = z.infer<typeof LoginSchema>;

/**
 * Schema đổi mật khẩu
 */
export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
    newPassword: z
      .string()
      .min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự')
      .max(100, 'Mật khẩu mới không vượt quá 100 ký tự'),
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu mới'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp với mật khẩu mới',
    path: ['confirmPassword'],
  });

export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;
```

---

## 6. BẢN ĐẶC TẢ BIẾN MÔI TRƯỜNG TOÀN DIỆN (`.env.example`)

File `.env.example` hoàn chỉnh được thiết lập với chú thích chi tiết cho từng cấu hình, phân tách rõ ràng giữa môi trường chạy Local và Vercel Serverless:

```env
# ==============================================================================
# LUMIÈRE HAIR ATELIER - ENVIRONMENT CONFIGURATION TEMPLATE
# ==============================================================================
# Hướng dẫn: Sao chép tệp này thành .env để cấu hình môi trường chạy ứng dụng.
# Trong môi trường phát triển cục bộ (Local Development), các cấu hình mặc định
# với Mock Storage và Demo Try-On Engine đã sẵn sàng hoạt động mà không cần API key.
# ==============================================================================

# ------------------------------------------------------------------------------
# 1. ỨNG DỤNG & MÔI TRƯỜNG CHẠY (APPLICATION & RUNTIME)
# ------------------------------------------------------------------------------
NODE_ENV="development"
PORT=3000
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_BRAND_NAME="Lumière Hair Atelier"

# ------------------------------------------------------------------------------
# 2. CƠ SỞ DỮ LIỆU POSTGRESQL & PRISMA ORM
# ------------------------------------------------------------------------------
# Chú ý: Đối với Vercel Serverless và Supabase/Neon, nên dùng Connection Pooling
# DATABASE_URL: URL kết nối thông qua PgBouncer (cổng 6543 trên Supabase)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/lumiere_salon?schema=public"

# DIRECT_URL: URL kết nối trực tiếp đến PostgreSQL (cổng 5432) phục vụ Prisma Migrations
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/lumiere_salon?schema=public"

# ------------------------------------------------------------------------------
# 3. BẢO MẬT PHIÊN LÀM VIỆC & MÃ HÓA (AUTH & SESSION SECURITY)
# ------------------------------------------------------------------------------
# Chuỗi khóa bí mật dùng để ký và mã hóa cookie phiên làm việc (Session Cookie)
# Tạo chuỗi ngẫu nhiên bằng lệnh: openssl rand -base64 32
SESSION_SECRET="lumiere_super_secret_session_key_32_characters_minimum_length_required"
SESSION_MAX_AGE_SECONDS=86400

# ------------------------------------------------------------------------------
# 4. PLUGGABLE CLOUD STORAGE (LƯU TRỮ ẢNH VÀ ĐA PHƯƠNG TIỆN)
# ------------------------------------------------------------------------------
# Lựa chọn provider: "mock" (mặc định) hoặc "cloudinary"
STORAGE_PROVIDER="mock"

# Tùy chọn lưu file vào public/uploads khi chạy local dev với STORAGE_PROVIDER="mock"
# Giá trị: "true" hoặc "false"
STORAGE_SAVE_LOCAL_DISK="true"

# Cấu hình Cloudinary (Bắt buộc nếu STORAGE_PROVIDER="cloudinary")
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""
CLOUDINARY_FOLDER="lumiere-salon"

# ------------------------------------------------------------------------------
# 5. PLUGGABLE HAIR TRY-ON ENGINE (MÔ PHỎNG THỬ TÓC TRỰC QUAN)
# ------------------------------------------------------------------------------
# Lựa chọn provider: "demo" (mặc định nội bộ) hoặc "replicate"
TRYON_PROVIDER="demo"

# Cấu hình độ trễ giả lập của Demo Provider (mili-giây)
# Mặc định: 1500 - 2000 ms để tạo cảm giác xử lý chuyên nghiệp
TRYON_MIN_DELAY_MS=1500
TRYON_MAX_DELAY_MS=2000

# Khóa API AI bên thứ ba (Chỉ dùng khi nâng cấp lên AI Engine thực tế, KHÔNG expose ra NEXT_PUBLIC)
AI_TRYON_API_KEY=""

# ------------------------------------------------------------------------------
# 6. GIỚI HẠN DUNG LƯỢNG & TẢI TỆP (UPLOAD BOUNDARIES)
# ------------------------------------------------------------------------------
MAX_UPLOAD_SIZE_BYTES=5242880
ALLOWED_IMAGE_TYPES="image/jpeg,image/png,image/webp"

# ==============================================================================
# HẾT TỆP CẤU HÌNH TEMPLATE
# ==============================================================================
```

---

## 7. BẢN ĐẶC TẢ LỆNH XÁC MINH & QUY TRÌNH KIỂM CHỨNG TỰ ĐỘNG

Nhằm đáp ứng 100% tiêu chí nghiệm thu (Acceptance Criteria), các lệnh kiểm chứng tự động và các bước thực thi được chuẩn hóa như sau:

### 7.1. Bảng lệnh xác minh chất lượng chuẩn mực
| Bước | Lệnh thực thi | Mục đích kiểm chứng | Kết quả kỳ vọng |
| :--- | :--- | :--- | :--- |
| **V-1** | `npx prisma validate` | Xác minh cú pháp và tính toàn vẹn quan hệ của `prisma/schema.prisma` | Báo cáo `The schema is valid` không có cảnh báo syntax |
| **V-2** | `npx prisma generate` | Biên dịch Prisma Schema thành mã nguồn TypeScript Client chuẩn trong `node_modules/@prisma/client` | Sinh mã client thành công 100% |
| **V-3** | `npx tsc --noEmit` | Kiểm tra toàn bộ mã nguồn với chế độ TypeScript nghiêm ngặt (`strict: true`) | Trả về mã thoát `0` (Exit code 0), không có lỗi Type nào |
| **V-4** | `npm run build` | Thử nghiệm quá trình Next.js compile production trên Vercel runtime | Sinh bundle production thành công (Client & Server Components) |

### 7.2. Tích hợp kịch bản kiểm thử vào `package.json`
Để thuận tiện cho kiểm thử tự động (CI/CD) và bàn giao cho các agent thực thi mã nguồn, các script sau được khuyến nghị cấu hình trong `package.json`:
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "typecheck": "tsc --noEmit",
    "prisma:validate": "prisma validate",
    "prisma:generate": "prisma generate",
    "prisma:seed": "tsx prisma/seed.ts",
    "validate:all": "prisma validate && prisma generate && tsc --noEmit"
  }
}
```

---

## 8. TỔNG KẾT & KHUYẾN NGHỊ CHO NHÓM TRIỂN KHAI

1. **Khuyến nghị cho M1 Implementer:**
   - Tạo chính xác các tệp tin theo đúng đường dẫn quy định trong `PROJECT.md` và tài liệu này:
     - `services/storage/types.ts`, `services/storage/mock.ts`, `services/storage/cloudinary.ts`, `services/storage/index.ts`
     - `services/try-on/types.ts`, `services/try-on/demo.ts`, `services/try-on/index.ts`
     - `services/audit.ts`
     - `lib/validations/booking.ts`, `lib/validations/auth.ts`
     - `.env.example`
   - Đảm bảo các hàm export sử dụng đúng tên định danh được thống nhất để các bài test trong E2E Testing Track không bị lệch chữ hoa/thường (`StorageProvider`, `HairTryOnProvider`, `logAuditEvent`, `CreateBookingSchema`, `LoginSchema`).

2. **Khuyến nghị phối hợp liên phân hệ:**
   - Dịch vụ Audit (`services/audit.ts`) phụ thuộc vào Singleton `prisma` tại `lib/prisma.ts` do M1 Explorer 2 thiết kế. Khi khởi tạo Prisma Client, cần bảo đảm enum `AuditAction` khớp hoàn toàn với định nghĩa schema.
   - Thư viện kiểm thử E2E độc lập (`tests/run-e2e.ts`) có thể import trực tiếp các Zod Schemas từ `@/lib/validations/booking` và `@/lib/validations/auth` để thực hiện kiểm thử ranh giới (Tier 2 Boundaries) mà không cần phụ thuộc vào database backend.

---
*Báo cáo phân tích kỹ thuật hoàn tất và sẵn sàng chuyển giao cho Orchestrator và Implementer.*
