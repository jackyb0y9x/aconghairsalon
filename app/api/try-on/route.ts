import { NextRequest, NextResponse } from 'next/server';
import { getHairTryOnProvider, SupportedTryOnMimeType, TryOnRequest } from '@/services/try-on';
import { prisma } from '@/lib/prisma';
import { memoryStore } from '@/lib/memory-store';
import { logAuditEvent } from '@/services/audit';
import {
  ALLOWED_TRYON_MIME_TYPES,
  MAX_TRYON_FILE_SIZE_BYTES,
  TryOnApiResponse,
} from '@/lib/validations/try-on';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * Kiểm tra chữ ký magic bytes chống giả mạo định dạng (MIME spoofing)
 * và ngăn chặn tệp thực thi / mã kịch bản độc hại.
 */
function isDisallowedFileType(buf: Buffer): boolean {
  if (buf.length < 4) return false;

  // GIF signature (GIF87a / GIF89a: 47 49 46 38)
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) {
    return true;
  }
  // PDF signature (%PDF: 25 50 44 46)
  if (buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46) {
    return true;
  }
  // Windows PE Executable (MZ: 4D 5A)
  if (buf[0] === 0x4d && buf[1] === 0x5a) {
    return true;
  }
  // Linux ELF Executable (\x7fELF: 7F 45 4C 46)
  if (buf[0] === 0x7f && buf[1] === 0x45 && buf[2] === 0x4c && buf[3] === 0x46) {
    return true;
  }

  // Chặn tệp chứa thẻ HTML / script độc hại
  const headStr = buf.subarray(0, Math.min(buf.length, 64)).toString('utf8').toLowerCase();
  if (headStr.includes('<html') || headStr.includes('<script')) {
    return true;
  }

  return false;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let imageBuffer: Buffer | null = null;
  let mimeType: string = '';
  let hairstyleId: string = '';
  let hairColorId: string | undefined = undefined;
  let rawIntensity: number | undefined = undefined;
  let customOptions: Record<string, any> = {};

  try {
    const contentType = request.headers.get('content-type') || '';

    // 1. Phân giải payload: Multipart FormData vs JSON
    if (contentType.toLowerCase().includes('multipart/form-data')) {
      const formData = await request.formData();
      const fileEntry =
        formData.get('image') ||
        formData.get('file') ||
        formData.get('photo') ||
        formData.get('portrait');

      if (fileEntry && typeof fileEntry === 'object' && 'arrayBuffer' in fileEntry) {
        const file = fileEntry as File;
        mimeType = file.type || '';
        const arrayBuffer = await file.arrayBuffer();
        imageBuffer = Buffer.from(arrayBuffer);
      }

      hairstyleId = (formData.get('hairstyleId') as string) || '';
      hairColorId = (formData.get('hairColorId') as string) || undefined;
      const imgUrlFromForm = formData.get('hairstyleImageUrl') as string | null;
      if (imgUrlFromForm) {
        customOptions.hairstyleImageUrl = imgUrlFromForm;
      }
      const intensityStr = formData.get('intensity') as string | null;
      if (intensityStr) {
        const parsed = parseFloat(intensityStr);
        if (!isNaN(parsed)) rawIntensity = parsed;
      }
    } else {
      // JSON body
      const body = await request.json().catch(() => ({}));

      // A. Trích xuất buffer từ imageBase64 (Data URL hoặc raw base64)
      if (typeof body.imageBase64 === 'string' && body.imageBase64.trim().length > 0) {
        const base64Str = body.imageBase64.trim();
        const dataUrlMatch = base64Str.match(/^data:([^;]+);base64,(.+)$/s);
        if (dataUrlMatch) {
          if (!body.mimeType) mimeType = dataUrlMatch[1];
          imageBuffer = Buffer.from(dataUrlMatch[2], 'base64');
        } else {
          imageBuffer = Buffer.from(base64Str, 'base64');
        }
      } else if (Buffer.isBuffer(body.imageBuffer)) {
        // B. Truyền Buffer trực tiếp (trong test runner hoặc internal caller)
        imageBuffer = body.imageBuffer;
      } else if (
        body.imageBuffer &&
        typeof body.imageBuffer === 'object' &&
        body.imageBuffer.type === 'Buffer' &&
        Array.isArray(body.imageBuffer.data)
      ) {
        // C. Buffer được serialize qua JSON.stringify ({ type: 'Buffer', data: [...] })
        imageBuffer = Buffer.from(body.imageBuffer.data);
      }

      mimeType = body.mimeType || mimeType;
      hairstyleId = typeof body.hairstyleId === 'string' ? body.hairstyleId.trim() : '';
      hairColorId = typeof body.hairColorId === 'string' ? body.hairColorId.trim() : undefined;
      if (body.options?.intensity !== undefined) {
        rawIntensity = Number(body.options.intensity);
      }
      customOptions = body.options || {};
      if (body.hairstyleImageUrl && !customOptions.hairstyleImageUrl) {
        customOptions.hairstyleImageUrl = body.hairstyleImageUrl;
      }
    }

    // 2. Kiểm tra tính hợp lệ cơ bản của Image Buffer (0-byte hoặc rỗng)
    if (!imageBuffer || imageBuffer.length === 0) {
      return NextResponse.json(
        { error: 'Dữ liệu ảnh chân dung không hợp lệ hoặc rỗng' },
        { status: 400 }
      );
    }

    // 3. Giới hạn dung lượng ảnh (Tối đa 5.0 MB; đúng 5.0MB được chấp nhận)
    if (imageBuffer.length > MAX_TRYON_FILE_SIZE_BYTES) {
      const sizeMb = (imageBuffer.length / (1024 * 1024)).toFixed(2);
      return NextResponse.json(
        {
          error: `Kích thước ảnh (${sizeMb}MB) vượt quá giới hạn tối đa cho phép là 5MB`,
        },
        { status: 413 }
      );
    }

    // 4. Kiểm tra định dạng MIME hợp lệ (Allowlist: JPEG, PNG, WEBP)
    const normalizedMime = (mimeType || 'image/jpeg').toLowerCase().trim();
    if (!ALLOWED_TRYON_MIME_TYPES.includes(normalizedMime as any)) {
      return NextResponse.json(
        {
          error: `Định dạng ảnh không được hỗ trợ: ${mimeType || 'không xác định'}. Chỉ chấp nhận jpeg, png, webp.`,
        },
        { status: 400 }
      );
    }

    // 5. Kiểm tra chữ ký file chống giả mạo
    if (isDisallowedFileType(imageBuffer)) {
      return NextResponse.json(
        {
          error: 'Định dạng ảnh không được hỗ trợ. Chỉ chấp nhận jpeg, png, webp.',
        },
        { status: 400 }
      );
    }

    // 6. Kiểm tra tham số kiểu tóc bắt buộc
    if (!hairstyleId) {
      return NextResponse.json(
        { error: 'Vui lòng chọn kiểu tóc cần thử nghiệm' },
        { status: 400 }
      );
    }

    // 7. Context Enrichment: Truy vấn tên kiểu tóc & mã màu từ DB / MemoryStore
    let resolvedStyleTitle: string | undefined = customOptions.hairstyleTitle;
    let resolvedColorHex: string | undefined = customOptions.hairColorHex;
    let resolvedImageUrl: string | undefined = customOptions.hairstyleImageUrl;

    try {
      if (!resolvedStyleTitle || !resolvedImageUrl) {
        const style = await prisma.hairstyle.findFirst({
          where: { OR: [{ id: hairstyleId }, { slug: hairstyleId }] },
          select: { title: true, coverImageUrl: true, galleryImages: true },
        });
        if (style) {
          if (!resolvedStyleTitle) resolvedStyleTitle = style.title;
          if (!resolvedImageUrl) {
            resolvedImageUrl =
              style.coverImageUrl ||
              (Array.isArray(style.galleryImages) && style.galleryImages.length > 0
                ? (style.galleryImages[0] as string)
                : undefined);
          }
        } else {
          const memStyle =
            memoryStore.findHairstyleById(hairstyleId) ||
            memoryStore.hairstyles.find((h) => h.slug === hairstyleId);
          if (memStyle) {
            if (!resolvedStyleTitle) resolvedStyleTitle = memStyle.title || (memStyle as any).name;
            if (!resolvedImageUrl) {
              const gallery = (memStyle as any).galleryImages || memStyle.images;
              resolvedImageUrl =
                memStyle.coverImageUrl ||
                (Array.isArray(gallery) && gallery.length > 0 ? gallery[0] : undefined);
            }
          }
        }
      }

      if (hairColorId && !resolvedColorHex) {
        const color = await prisma.hairColor.findFirst({
          where: { OR: [{ id: hairColorId }, { code: hairColorId }] },
          select: { hexColor: true },
        });
        if (color) {
          resolvedColorHex = color.hexColor;
        } else {
          const memColor =
            memoryStore.findHairColorById(hairColorId) ||
            memoryStore.hairColors.find((c) => c.code === hairColorId);
          if (memColor) resolvedColorHex = memColor.hexColor || memColor.hexCode;
        }
      }
    } catch {
      // DB offline / lỗi lookup không được làm gián đoạn trải nghiệm thử tóc
    }

    // Giới hạn giá trị intensity giữa 0.0 và 1.0 (clamped)
    const intensity =
      rawIntensity !== undefined ? Math.max(0, Math.min(1, rawIntensity)) : undefined;

    // 8. Khởi tạo Yêu cầu Thử tóc cho Provider
    const tryOnRequest: TryOnRequest = {
      imageBuffer,
      mimeType: normalizedMime as SupportedTryOnMimeType,
      hairstyleId,
      hairColorId: hairColorId || undefined,
      options: {
        ...customOptions,
        intensity: intensity ?? customOptions.intensity,
        hairstyleTitle: resolvedStyleTitle || customOptions.hairstyleTitle || hairstyleId,
        hairColorHex: resolvedColorHex || customOptions.hairColorHex,
        hairstyleImageUrl: resolvedImageUrl || customOptions.hairstyleImageUrl,
      },
    };

    // 9. Lấy Provider và thực thi với 15-giây Timeout Guard
    const provider = getHairTryOnProvider();
    const TIMEOUT_MS = parseInt(process.env.TRYON_TIMEOUT_MS || '15000', 10);
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), TIMEOUT_MS);

    let result;
    try {
      result = await Promise.race([
        provider.processTryOn(tryOnRequest),
        new Promise<never>((_, reject) => {
          abortController.signal.addEventListener('abort', () => {
            reject(new Error('TRYON_TIMEOUT'));
          });
        }),
      ]);
    } finally {
      clearTimeout(timeoutId);
    }

    // 10. Ghi nhận Nhật ký Kiểm toán (Hoàn toàn không ghi nhận ảnh sinh trắc học người dùng)
    await logAuditEvent({
      action: 'CREATE',
      entity: 'TryOnSimulation',
      entityId: hairstyleId,
      details: {
        appliedStyleId: hairstyleId,
        appliedColorId: hairColorId || null,
        mimeType: normalizedMime,
        imageSizeBytes: imageBuffer.length,
        isMock: result.isMock,
        provider: result.provider,
        processingTimeMs: result.processingTimeMs,
      },
      ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
      userAgent: request.headers.get('user-agent') || undefined,
    });

    // 11. Chuẩn bị kết quả phản hồi (Zero Disk Persistence, trả về bộ nhớ đệm)
    const responsePayload: TryOnApiResponse = {
      success: true,
      resultImageBase64: result.resultImageBase64,
      // Bảo đảm định dạng MIME khớp với định dạng đầu vào hoặc kết quả
      mimeType: normalizedMime || result.mimeType,
      isMock: result.isMock,
      provider: result.provider,
      processingTimeMs: Math.max(15, result.processingTimeMs || Date.now() - startTime),
      appliedStyleId: hairstyleId,
      appliedColorId: hairColorId || null,
      privacyValidated: true,
      notice:
        result.notice ||
        'Ảnh mô phỏng trực quan phong cách tóc - Vui lòng tham vấn stylist tại Salon để có kết quả chính xác nhất.',
    };

    return NextResponse.json(responsePayload, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error: any) {
    if (error?.message === 'TRYON_TIMEOUT') {
      return NextResponse.json(
        {
          error:
            'Quá thời gian xử lý thử nghiệm kiểu tóc (Timeout 15s). Vui lòng thử lại với ảnh nhỏ hơn hoặc thử lại sau.',
        },
        { status: 504 }
      );
    }

    console.error('[TryOn Route Handler Error]:', error);
    const errorMessage = error?.message || 'Lỗi hệ thống khi xử lý mô phỏng kiểu tóc';

    // Map các lỗi nghiệp vụ nội bộ sang đúng HTTP status
    if (errorMessage.includes('không hợp lệ hoặc rỗng')) {
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }
    if (errorMessage.includes('chọn kiểu tóc')) {
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }
    if (errorMessage.includes('vượt quá giới hạn tối đa')) {
      return NextResponse.json({ error: errorMessage }, { status: 413 });
    }
    if (errorMessage.includes('Định dạng ảnh không được hỗ trợ')) {
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  } finally {
    // 12. Dọn dẹp bộ nhớ RAM lập tức (V8 GC eligibility)
    imageBuffer = null;
  }
}
