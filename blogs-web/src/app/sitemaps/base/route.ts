import { NextRequest } from 'next/server';
import { cmsFetch } from '@/lib/cms';
import { ensureCurrentSiteIdFromDomain } from '@/lib/sites';

export const revalidate = 3600;

export async function GET(req: NextRequest) {
  ensureCurrentSiteIdFromDomain();
  const protocol = process.env.BAIDU_PUSH_PROTOCOL || 'https';
  const fallbackSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const hostHeader = req.headers.get('host') || '';
  const envDomain = fallbackSiteUrl.replace(/^https?:\/\//, '');
  const siteDomain = hostHeader || envDomain;
  const baseUrl = `${protocol}://${siteDomain}`;

  let categoriesRes: any = null;
  let tagsRes: any = null;
  try {
    const res = await Promise.all([
      cmsFetch('/api/categories?fields=slug&pagination[pageSize]=500'),
      cmsFetch('/api/tags?fields=slug&pagination[pageSize]=1000'),
    ]);
    categoriesRes = res[0];
    tagsRes = res[1];
  } catch (err) {
    console.warn('sitemaps/base: fetch failed, fallback to empty lists');
  }

  const categories = (categoriesRes?.data ?? []) as any[];
  const tags = (tagsRes?.data ?? []) as any[];

  const now = new Date().toISOString();

  let xml = '';
  xml += '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  // 首页
  xml += `  <url><loc>${baseUrl}/</loc><lastmod>${now}</lastmod><changefreq>daily</changefreq><priority>1.0</priority></url>\n`;

  // 分类
  for (const c of categories) {
    xml += `  <url><loc>${baseUrl}/c/${c.slug}</loc><lastmod>${now}</lastmod><changefreq>weekly</changefreq><priority>0.6</priority></url>\n`;
  }

  // 标签
  for (const t of tags) {
    xml += `  <url><loc>${baseUrl}/t/${t.slug}</loc><lastmod>${now}</lastmod><changefreq>weekly</changefreq><priority>0.5</priority></url>\n`;
  }

  xml += '</urlset>';

  return new Response(xml, {
    status: 200,
    headers: { 'content-type': 'text/xml; charset=utf-8' },
  });
}