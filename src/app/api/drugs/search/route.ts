import { NextRequest, NextResponse } from 'next/server';
import { searchEgyptianDrugs } from '@/lib/drugs/drug-search';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20', 10), 1), 50);

    const results = searchEgyptianDrugs(query, limit);

    return NextResponse.json(
      {
        query,
        results,
        total: results.length,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      }
    );
  } catch (error) {
    console.error('API /api/drugs/search error:', error);
    return NextResponse.json(
      { error: 'Failed to search drug database', results: [], total: 0 },
      { status: 500 }
    );
  }
}
