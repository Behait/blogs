import { NextRequest } from 'next/server';
import { cmsFetch } from '@/lib/cms';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get('page') || '1');
  const pageSize = Number(searchParams.get('pageSize') || '10');
  const q = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const tag = searchParams.get('tag') || '';

  const fields = `fields=title,slug,summary,publishedAt`;
  const populate = `populate[site][fields]=domain&populate[category][fields]=name,slug&populate[tags][fields]=id,name,slug`;
  const pagination = `pagination[page]=${page}&pagination[pageSize]=${pageSize}`;
  const sort = `sort=publishedAt:desc`;
  const filters: string[] = [];
  if (q) {
    filters.push(`filters[$or][0][title][$containsi]=${encodeURIComponent(q)}`);
    filters.push(`filters[$or][1][summary][$containsi]=${encodeURIComponent(q)}`);
    filters.push(`filters[$or][2][content][$containsi]=${encodeURIComponent(q)}`);
  }
  if (category) filters.push(`filters[category][slug][$eq]=${encodeURIComponent(category)}`);
  if (tag) filters.push(`filters[tags][slug][$eq]=${encodeURIComponent(tag)}`);

  const url = `/api/articles?${[fields, populate, pagination, sort, ...filters].join('&')}`;
  try {
    const json = await cmsFetch(url);
    return new Response(JSON.stringify(json), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || 'fetch failed' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}