import { NextRequest } from 'next/server';
import { fetchCategories } from '@/lib/cms';

export async function GET(request: NextRequest) {
  try {
    const categories = await fetchCategories();
    return Response.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return Response.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}