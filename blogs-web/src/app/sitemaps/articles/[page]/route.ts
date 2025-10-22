import { NextRequest } from 'next/server';
import { cmsFetch } from '@/lib/cms';
import { ensureCurrentSiteIdFromDomain } from '@/lib/sites';

export const revalidate = 3600;

const PAGE_SIZE = 500; // 分片大小

export async function GET(req: NextRequest, context: any) {
  ensureCurrentSiteIdFromDomain();
  const protocol = process.env.BAIDU_PUSH_PROTOCOL || 'https';
  const fallbackSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const hostHeader = req.headers.get('host') || '';
  const envDomain = fallbackSiteUrl.replace(/^https?:\/\//, '');
  const siteDomain = hostHeader || envDomain;
  const baseUrl = `${protocol}://${siteDomain}`;
  const siteId = process.env.CURRENT_SITE_ID;

  const maybeParams = context?.params;
  const params = typeof maybeParams?.then === 'function' ? await maybeParams : maybeParams;
  const page = Math.max(1, Number((params?.page ?? '1')));

  const filters: string[] = [];
  if (siteId) filters.push(`filters[site][id][$eq]=${encodeURIComponent(siteId)}`);

  const url = `/api/articles?fields=slug,publishedAt&populate[site][fields]=domain&sort=publishedAt:desc&pagination[page]=${page}&pagination[pageSize]=${PAGE_SIZE}${filters.length ? `&${filters.join('&')}` : ''}`;
  let articles: any[] = [];
  try {
    const res = await cmsFetch(url);
    articles = (res?.data ?? []) as any[];
  } catch (err) {
    console.warn('sitemaps/articles: fetch failed, fallback to empty list');
  }

  let xml = '';
  xml += '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  for (const a of articles) {
    const domain = a?.site?.domain || siteDomain;
    if (!siteId && domain !== siteDomain) continue; // 无站点ID时按域名过滤
    const lastmod = a.publishedAt ? new Date(a.publishedAt).toISOString() : new Date().toISOString();
    xml += `  <url><loc>${baseUrl}/${a.slug}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>\n`;
  }

  xml += '</urlset>';

  return new Response(xml, {
    status: 200,
    headers: { 'content-type': 'text/xml; charset=utf-8' },
  });
}