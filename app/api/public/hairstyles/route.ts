import { NextRequest, NextResponse } from 'next/server';
import { getPublicHairstyles } from '@/lib/public-data';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const gender = searchParams.get('gender') || undefined;
    const style = searchParams.get('style') || searchParams.get('styleVibe') || undefined;
    const length = searchParams.get('length') || undefined;
    const faceShape = searchParams.get('faceShape') || undefined;
    const texture = searchParams.get('texture') || undefined;
    const careEffort = searchParams.get('careEffort') || searchParams.get('careLevel') || undefined;
    const search = searchParams.get('search') || searchParams.get('q') || undefined;
    const sort = searchParams.get('sort') || undefined;
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!, 10) : undefined;
    const pageSize = searchParams.get('pageSize') || searchParams.get('limit')
      ? parseInt((searchParams.get('pageSize') || searchParams.get('limit'))!, 10)
      : undefined;

    const data = await getPublicHairstyles({
      gender,
      style,
      length,
      faceShape,
      texture,
      careEffort,
      search,
      sort,
      page,
      pageSize,
    });

    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('Error in /api/public/hairstyles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch hairstyles' },
      { status: 500 }
    );
  }
}
