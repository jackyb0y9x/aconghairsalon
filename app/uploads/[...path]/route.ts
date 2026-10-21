import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const filePathSegments = params.path || [];
    // Sanitize to prevent path traversal
    const safePath = filePathSegments.map(seg => seg.replace(/\.\.+/g, '')).filter(Boolean);
    const fullPath = path.join(process.cwd(), 'public', 'uploads', ...safePath);

    if (!fs.existsSync(fullPath)) {
      return NextResponse.json({ error: 'Tệp không tồn tại' }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(fullPath);
    const ext = path.extname(fullPath).toLowerCase();

    let contentType = 'application/octet-stream';
    if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    else if (ext === '.png') contentType = 'image/png';
    else if (ext === '.webp') contentType = 'image/webp';
    else if (ext === '.svg') contentType = 'image/svg+xml';
    else if (ext === '.gif') contentType = 'image/gif';

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      },
    });
  } catch (error) {
    console.error('Error serving upload:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ khi đọc tệp' }, { status: 500 });
  }
}
