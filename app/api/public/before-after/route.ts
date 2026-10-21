import { NextRequest, NextResponse } from 'next/server';
import { getPublicBeforeAfters } from '@/lib/public-data';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const gender = searchParams.get('gender') || undefined;
    const category = searchParams.get('category') || undefined;

    const items = await getPublicBeforeAfters({ gender, category });

    return NextResponse.json(
      {
        items,
        total: items.length,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=900',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching before-after items:', error);
    return NextResponse.json({ error: 'Failed to fetch before-after items' }, { status: 500 });
  }
}
