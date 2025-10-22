import { NextRequest } from 'next/server';

// POST /api/baidu/push
// Body: { urls?: string[]; slugs?: string[] }
// Headers: x-admin-token: <INTERNAL_ADMIN_TOKEN> (可选，若设置则需要匹配)
export async function POST(req: NextRequest) {
  try {
    const adminTokenHeader = req.headers.get('x-admin-token') || req.headers.get('authorization') || '';
    const expected = process.env.INTERNAL_ADMIN_TOKEN;
    if (expected) {
      const token = adminTokenHeader.startsWith('Bearer ')
        ? adminTokenHeader.slice('Bearer '.length).trim()
        : adminTokenHeader.trim();
      if (!token || token !== expected) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'content-type': 'application/json' } });
      }
    }

    const site = process.env.BAIDU_SITE || '';
    const token = process.env.BAIDU_TOKEN || '';
    if (!site || !token) {
      return new Response(JSON.stringify({ error: 'BAIDU_SITE 或 BAIDU_TOKEN 未配置' }), { status: 400, headers: { 'content-type': 'application/json' } });
    }

    const protocol = process.env.BAIDU_PUSH_PROTOCOL || 'https';
    const json = await req.json().catch(() => ({}));
    let urls: string[] = Array.isArray(json?.urls) ? json.urls : [];
    const slugs: string[] = Array.isArray(json?.slugs) ? json.slugs : [];

    if (slugs.length) {
      urls = urls.concat(slugs.map((s) => `${protocol}://${site}/${s}`));
    }

    urls = urls.filter((u) => typeof u === 'string' && u.startsWith('http'));
    urls = Array.from(new Set(urls)); // 去重

    if (!urls.length) {
      return new Response(JSON.stringify({ error: '缺少待推送的 URL 或 slug' }), { status: 400, headers: { 'content-type': 'application/json' } });
    }

    if (urls.length > 1000) {
      return new Response(JSON.stringify({ error: '批量数量过大（>1000）' }), { status: 400, headers: { 'content-type': 'application/json' } });
    }

    const endpoint = `http://data.zz.baidu.com/urls?site=${encodeURIComponent(site)}&token=${encodeURIComponent(token)}`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: urls.join('\n'),
    });

    const text = await res.text().catch(() => '');
    const ok = res.ok;
    const status = res.status;

    return new Response(JSON.stringify({ ok, status, response: text }), {
      status: ok ? 200 : 502,
      headers: { 'content-type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || 'push failed' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}