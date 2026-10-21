import { NextResponse } from 'next/server';
import { getPublicServices } from '@/lib/public-data';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getPublicServices();
    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=900',
      },
    });
  } catch (error) {
    console.error('Error fetching public services:', error);
    return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
  }
}
