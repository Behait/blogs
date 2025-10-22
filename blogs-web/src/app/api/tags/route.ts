import { NextRequest } from 'next/server';
import { fetchTags } from '@/lib/cms';

export async function GET(request: NextRequest) {
  try {
    const tags = await fetchTags();
    return Response.json(tags);
  } catch (error) {
    console.error('Error fetching tags:', error);
    return Response.json(
      { error: 'Failed to fetch tags' },
      { status: 500 }
    );
  }
}