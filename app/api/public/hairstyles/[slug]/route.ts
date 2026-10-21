import { NextRequest, NextResponse } from 'next/server';
import { getPublicHairstyleBySlug } from '@/lib/public-data';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    if (!slug) {
      return NextResponse.json({ error: 'Hairstyle slug is required' }, { status: 400 });
    }

    const hairstyle = await getPublicHairstyleBySlug(slug);
    if (!hairstyle) {
      return NextResponse.json({ error: 'Hairstyle not found' }, { status: 404 });
    }

    return NextResponse.json(hairstyle, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Error fetching hairstyle by slug:', error);
    return NextResponse.json({ error: 'Failed to fetch hairstyle' }, { status: 500 });
  }
}
