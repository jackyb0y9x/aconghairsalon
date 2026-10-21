import { NextResponse } from 'next/server';
import { getPublicColors } from '@/lib/public-data';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getPublicColors();
    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=900',
      },
    });
  } catch (error) {
    console.error('Error fetching public hair colors:', error);
    return NextResponse.json({ error: 'Failed to fetch colors' }, { status: 500 });
  }
}
