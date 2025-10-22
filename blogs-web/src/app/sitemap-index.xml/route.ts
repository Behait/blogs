import { NextRequest } from 'next/server';
import { cmsFetch } from '@/lib/cms';
import { ensureCurrentSiteIdFromDomain } from '@/lib/sites';

export const revalidate = 3600;

const PAGE_SIZE = 500; // 文章分片大小

export async function GET(req: NextRequest) {
  ensureCurrentSiteIdFromDomain();
  const protocol = process.env.BAIDU_PUSH_PROTOCOL || 'https';
  const fallbackSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const siteDomain = fallbackSiteUrl.replace(/^https?:\/\//, '');
  const baseUrl = `${protocol}://${siteDomain}`;
  const siteId = process.env.CURRENT_SITE_ID;

  const filters: string[] = [];
  if (siteId) filters.push(`filters[site][id][$eq]=${encodeURIComponent(siteId)}`);

  // 获取文章总数以计算分片数量
  const res = await cmsFetch(`/api/articles?fields=id&pagination[pageSize]=1${filters.length ? `&${filters.join('&')}` : ''}`);
  const total: number = res?.meta?.pagination?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const now = new Date().toISOString();

  let xml = '';
  xml += '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  // 基础 sitemap
  xml += `  <sitemap><loc>${baseUrl}/sitemaps/base</loc><lastmod>${now}</lastmod></sitemap>\n`;

  // 文章分片 sitemap
  for (let i = 1; i <= pages; i++) {
    xml += `  <sitemap><loc>${baseUrl}/sitemaps/articles/${i}</loc><lastmod>${now}</lastmod></sitemap>\n`;
  }

  xml += '</sitemapindex>';

  return new Response(xml, {
    status: 200,
    headers: { 'content-type': 'application/xml; charset=utf-8' },
  });
}