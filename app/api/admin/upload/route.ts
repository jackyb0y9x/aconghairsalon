import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdminRequest } from '@/lib/auth';
import { getStorageProvider } from '@/services/storage';

export async function POST(request: NextRequest) {
  const auth = await authenticateAdminRequest(request);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'salon-content';

    if (!file) {
      return NextResponse.json({ error: 'Không tìm thấy tệp để tải lên' }, { status: 400 });
    }

    // 5MB max check
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Kích thước tệp vượt quá giới hạn cho phép (tối đa 5MB)' }, { status: 413 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const storage = getStorageProvider();
    const uploadResult = await storage.upload(buffer, file.name, {
      folder,
      maxSizeBytes: 5 * 1024 * 1024,
    });

    return NextResponse.json({
      url: uploadResult.url,
      publicId: uploadResult.publicId,
      width: uploadResult.width,
      height: uploadResult.height,
      sizeBytes: uploadResult.sizeBytes,
      mimeType: uploadResult.mimeType,
    });
  } catch (err: any) {
    console.error('Error in /api/admin/upload:', err);
    return NextResponse.json(
      { error: err.message || 'Lỗi khi xử lý tải tệp lên' },
      { status: 500 }
    );
  }
}
