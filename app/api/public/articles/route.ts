import { NextRequest, NextResponse } from 'next/server';
import { getPublicArticles } from '@/lib/public-data';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tag = searchParams.get('tag') || undefined;
    const search = searchParams.get('q') || searchParams.get('search') || undefined;
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!, 10) : undefined;
    const pageSize = searchParams.get('pageSize') || searchParams.get('limit')
      ? parseInt((searchParams.get('pageSize') || searchParams.get('limit'))!, 10)
      : undefined;

    const data = await getPublicArticles({ tag, search, page, pageSize });

    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Error in /api/public/articles:', error);
    return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 });
  }
}
