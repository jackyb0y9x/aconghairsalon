import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { HairTryOnProvider, TryOnRequest, TryOnResponse } from './types';
import { DEFAULT_HAIRSTYLES } from '@/lib/public-data';

/**
 * Helper giả lập độ trễ ngẫu nhiên từ minMs đến maxMs
 */
function simulateLatency(minMs: number, maxMs: number): Promise<number> {
  const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise((resolve) => setTimeout(() => resolve(delay), delay));
}

/**
 * Helper thoát các ký tự đặc biệt trong XML để bảo đảm tài liệu SVG hợp lệ và chống XSS
 */
function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&"']/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case '"':
        return '&quot;';
      case "'":
        return '&apos;';
      default:
        return c;
    }
  });
}

/**
 * Truy xuất buffer ảnh kiểu tóc từ đường dẫn cục bộ hoặc URL từ xa
 */
async function getHairstyleImageBuffer(
  hairstyleId: string,
  customUrl?: string
): Promise<{ buffer: Buffer; isFromDisk: boolean } | null> {
  // 1. Kiểm tra customUrl nếu là tệp cục bộ
  if (customUrl && typeof customUrl === 'string' && customUrl.startsWith('/')) {
    const cleanPath = customUrl.replace(/^\//, '');
    const localPath = path.join(process.cwd(), 'public', cleanPath);
    if (fs.existsSync(localPath)) {
      try {
        return { buffer: fs.readFileSync(localPath), isFromDisk: true };
      } catch {}
    }
  }

  // 2. Tìm trong danh mục DEFAULT_HAIRSTYLES
  const match = DEFAULT_HAIRSTYLES.find((h) => h.id === hairstyleId || h.slug === hairstyleId);
  if (match?.coverImageUrl && match.coverImageUrl.startsWith('/')) {
    const cleanPath = match.coverImageUrl.replace(/^\//, '');
    const localPath = path.join(process.cwd(), 'public', cleanPath);
    if (fs.existsSync(localPath)) {
      try {
        return { buffer: fs.readFileSync(localPath), isFromDisk: true };
      } catch {}
    }
  }

  // 3. Tìm trực tiếp trong thư mục public/images/hairstyles/vietnam/
  const vietnamDir = path.join(process.cwd(), 'public', 'images', 'hairstyles', 'vietnam');
  if (fs.existsSync(vietnamDir)) {
    const candidates = [
      path.join(vietnamDir, `${hairstyleId}.jpg`),
      path.join(vietnamDir, `vn-${hairstyleId}.jpg`),
      path.join(vietnamDir, `${hairstyleId.replace(/^vn-/, '')}.jpg`),
    ];
    for (const cand of candidates) {
      if (fs.existsSync(cand)) {
        try {
          return { buffer: fs.readFileSync(cand), isFromDisk: true };
        } catch {}
      }
    }
  }

  // 4. Nếu là ảnh URL từ xa (Unsplash / Cloudinary)
  const remoteUrl = customUrl || match?.coverImageUrl;
  if (remoteUrl && (remoteUrl.startsWith('http://') || remoteUrl.startsWith('https://'))) {
    try {
      const res = await fetch(remoteUrl);
      if (res.ok) {
        const arr = await res.arrayBuffer();
        return { buffer: Buffer.from(arr), isFromDisk: false };
      }
    } catch {}
  }

  // 5. Mặc định fallback mẫu Side Part 7/3 rủ
  const fallback = path.join(process.cwd(), 'public', 'images', 'hairstyles', 'vietnam', 'vn-sidepart-ru.jpg');
  if (fs.existsSync(fallback)) {
    try {
      return { buffer: fs.readFileSync(fallback), isFromDisk: true };
    } catch {}
  }

  return null;
}

/**
 * Xử lý ghép kiểu tóc thực tế vào ảnh người dùng sử dụng Sharp
 */
async function createCompositeTryOn(
  userImageBuffer: Buffer,
  hairImageBuffer: Buffer,
  hairstyleLabel: string,
  colorHex: string,
  intensity: number
): Promise<string> {
  const width = 600;
  const height = 750;

  // 1. Chuẩn hóa ảnh chân dung người dùng (600x750)
  const userBase = await sharp(userImageBuffer)
    .resize(width, height, { fit: 'cover', position: 'center' })
    .toBuffer();

  // 2. Chuẩn hóa ảnh kiểu tóc tham chiếu (600x750)
  const hairResized = await sharp(hairImageBuffer)
    .resize(width, height, { fit: 'cover', position: 'top' })
    .toBuffer();

  // 3. Phủ màu nhuộm tóc nếu người dùng chọn màu
  let tintedHair = hairResized;
  if (colorHex && colorHex.startsWith('#') && colorHex.toLowerCase() !== '#c5a880') {
    const tintOpacity = (intensity * 0.38).toFixed(2);
    const tintSvg = Buffer.from(`
      <svg width="${width}" height="${height}">
        <rect width="${width}" height="${height}" fill="${escapeXml(colorHex)}" opacity="${tintOpacity}" style="mix-blend-mode: color;"/>
      </svg>
    `);
    tintedHair = await sharp(hairResized)
      .composite([{ input: tintSvg, blend: 'over' }])
      .toBuffer();
  }

  // 4. Mặt nạ chuyển sắc mượt mà (Feathered Hair Mask)
  // - Vùng tóc đỉnh đầu & mái: Giữ 100% kiểu tóc mới
  // - Vùng khuôn mặt trung tâm (mắt, mũi, miệng, cằm): Cắt thủng mượt mà để giữ nguyên 100% gương mặt thật của khách
  // - Vùng thân & vai: Giữ nguyên ảnh gốc của khách
  const maskSvg = Buffer.from(`
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <radialGradient id="faceHole" cx="50%" cy="63%" r="30%" fx="50%" fy="60%">
          <stop offset="0%" stop-color="#000000" stop-opacity="1"/>
          <stop offset="65%" stop-color="#000000" stop-opacity="0.95"/>
          <stop offset="85%" stop-color="#000000" stop-opacity="0.4"/>
          <stop offset="98%" stop-color="#000000" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="verticalHairGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="1"/>
          <stop offset="46%" stop-color="#ffffff" stop-opacity="0.98"/>
          <stop offset="60%" stop-color="#ffffff" stop-opacity="0.65"/>
          <stop offset="72%" stop-color="#ffffff" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#verticalHairGrad)"/>
      <ellipse cx="300" cy="485" rx="128" ry="175" fill="url(#faceHole)"/>
    </svg>
  `);
  const maskPng = await sharp(maskSvg).png().toBuffer();

  // 5. Tách lớp tóc đã được cắt theo mặt nạ
  const hairCutout = await sharp(tintedHair)
    .composite([{ input: maskPng, blend: 'dest-in' }])
    .png()
    .toBuffer();

  // 6. Huy hiệu Salon & Thông tin kiểu tóc
  const brandBadgeSvg = Buffer.from(`
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <g transform="translate(20, 20)">
        <rect width="210" height="34" rx="17" fill="rgba(18,18,18,0.85)" stroke="rgba(212,175,55,0.4)" stroke-width="1"/>
        <circle cx="17" cy="17" r="5" fill="#D4AF37"/>
        <text x="32" y="22" fill="#F3E5AB" font-family="'Plus Jakarta Sans', sans-serif" font-size="11" font-weight="700">CÔNG NGUYỄN HAIR SALON</text>
      </g>
      <g transform="translate(20, 690)">
        <rect width="${width - 40}" height="40" rx="12" fill="rgba(18,18,18,0.88)" stroke="rgba(212,175,55,0.3)" stroke-width="1"/>
        <text x="18" y="25" fill="#FFFFFF" font-family="'Plus Jakarta Sans', sans-serif" font-size="13" font-weight="600">${hairstyleLabel}</text>
        <text x="${width - 58}" y="25" text-anchor="end" fill="#D4AF37" font-family="'Plus Jakarta Sans', sans-serif" font-size="11" font-weight="600">${colorHex ? colorHex : 'Màu tự nhiên'}</text>
      </g>
    </svg>
  `);

  // 7. Kết hợp các lớp: Ảnh người dùng + Kiểu tóc mới + Huy hiệu
  const finalBuffer = await sharp(userBase)
    .composite([
      { input: hairCutout, blend: 'over' },
      { input: brandBadgeSvg, blend: 'over' },
    ])
    .jpeg({ quality: 92 })
    .toBuffer();

  return 'data:image/jpeg;base64,' + finalBuffer.toString('base64');
}

/**
 * Fallback SVG composite dự phòng
 */
function createFallbackSvg(
  userImageBase64: string,
  mimeType: string,
  hairstyleLabel: string,
  colorHex: string,
  intensity: number,
  disclaimer: string
): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="600" height="750" viewBox="0 0 600 750">
      <defs>
        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#D4AF37"/>
          <stop offset="100%" stop-color="#AA771C"/>
        </linearGradient>
      </defs>
      <image href="data:${mimeType};base64,${userImageBase64}" width="600" height="600" preserveAspectRatio="xMidYMid slice"/>
      <rect x="50" y="40" width="500" height="320" rx="30" fill="${colorHex}" opacity="${(intensity * 0.35).toFixed(2)}" style="mix-blend-mode: color;"/>
      <g transform="translate(20, 20)">
        <rect width="210" height="34" rx="17" fill="#1A1A1A" opacity="0.85"/>
        <circle cx="17" cy="17" r="5" fill="#D4AF37"/>
        <text x="32" y="22" fill="#FFFFFF" font-family="'Plus Jakarta Sans', sans-serif" font-size="11" font-weight="600">CÔNG NGUYỄN HAIR SALON</text>
      </g>
      <rect x="0" y="600" width="600" height="150" fill="#121212"/>
      <line x1="0" y1="600" x2="600" y2="600" stroke="url(#goldGrad)" stroke-width="2"/>
      <text x="30" y="635" fill="url(#goldGrad)" font-family="'Cinzel', serif" font-size="18" font-weight="700">CÔNG NGUYỄN HAIR SALON</text>
      <text x="30" y="660" fill="#E5E7EB" font-family="'Plus Jakarta Sans', sans-serif" font-size="14" font-weight="500">Kiểu tóc: ${hairstyleLabel}</text>
      <text x="30" y="685" fill="#9CA3AF" font-family="'Plus Jakarta Sans', sans-serif" font-size="12">Sắc độ mô phỏng: ${(intensity * 100).toFixed(0)}% • Mã màu: ${colorHex}</text>
      <text x="30" y="725" fill="#6B7280" font-family="'Plus Jakarta Sans', sans-serif" font-size="11" font-style="italic">${disclaimer}</text>
    </svg>
  `.trim();
  return 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
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

    // 2. Giả lập độ trễ xử lý chân thực của AI (1000ms - 1500ms)
    const minDelay = parseInt(process.env.TRYON_MIN_DELAY_MS || '1000', 10);
    const maxDelay = parseInt(process.env.TRYON_MAX_DELAY_MS || '1500', 10);
    await simulateLatency(minDelay, maxDelay);

    // 3. Xử lý ảnh mô phỏng trên bộ nhớ RAM (zero disk persistence)
    const userImageBase64 = request.imageBuffer.toString('base64');
    const hairstyleLabel = escapeXml(request.options?.hairstyleTitle || request.hairstyleId);
    const colorHex = escapeXml(request.options?.hairColorHex || '#C5A880');
    const intensity = Math.max(0, Math.min(1, request.options?.intensity ?? 0.85));
    const disclaimer = escapeXml('* Ảnh mô phỏng trực quan phong cách. Hãy tham vấn chuyên gia Stylist để có kết quả tốt nhất.');

    let resultBase64: string;
    let mimeType = 'image/jpeg';

    // 4. Lấy buffer ảnh kiểu tóc đã chọn
    const hairstyleResult = await getHairstyleImageBuffer(
      request.hairstyleId,
      (request.options as any)?.hairstyleImageUrl
    );

    if (hairstyleResult && hairstyleResult.buffer) {
      try {
        resultBase64 = await createCompositeTryOn(
          request.imageBuffer,
          hairstyleResult.buffer,
          hairstyleLabel,
          colorHex,
          intensity
        );
      } catch (err) {
        console.error('[DemoHairTryOnProvider] Sharp composite error, using fallback:', err);
        resultBase64 = createFallbackSvg(userImageBase64, request.mimeType, hairstyleLabel, colorHex, intensity, disclaimer);
        mimeType = 'image/svg+xml';
      }
    } else {
      resultBase64 = createFallbackSvg(userImageBase64, request.mimeType, hairstyleLabel, colorHex, intensity, disclaimer);
      mimeType = 'image/svg+xml';
    }

    const processingTimeMs = Date.now() - startTime;

    return {
      resultImageBase64: resultBase64,
      mimeType,
      isMock: true,
      provider: this.name,
      processingTimeMs,
      notice: 'Ảnh mô phỏng trực quan kiểu tóc kết hợp AI. Vui lòng tham vấn stylist tại Salon để có kết quả chính xác nhất.',
    };
  }
}
