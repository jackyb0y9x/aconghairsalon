import { NextResponse } from 'next/server';
import { getPublicHomeData } from '@/lib/public-data';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const data = await getPublicHomeData();
    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('Error fetching public home data:', error);
    return NextResponse.json(
      { error: 'Failed to load public home data' },
      { status: 500 }
    );
  }
}
