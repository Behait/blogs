// Baidu active push utilities

export async function pushUrlsToBaidu(urls: string[], site?: string, token?: string, logger?: { info: Function; warn: Function }) {
  const s = site || process.env.BAIDU_SITE || '';
  const t = token || process.env.BAIDU_TOKEN || '';
  if (!s || !t) {
    logger?.warn?.('[Baidu Push] BAIDU_SITE 或 BAIDU_TOKEN 未配置，跳过推送');
    return { ok: false, status: 400, response: 'BAIDU_SITE/BAIDU_TOKEN not configured' };
  }
  const endpoint = `http://data.zz.baidu.com/urls?site=${encodeURIComponent(s)}&token=${encodeURIComponent(t)}`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: urls.join('\n'),
  });
  const text = await res.text().catch(() => '');
  if (!res.ok) {
    logger?.warn?.(`[Baidu Push] Failed: ${res.status} ${text}`);
  } else {
    logger?.info?.(`[Baidu Push] Submitted ${urls.length} url(s)`);
  }
  return { ok: res.ok, status: res.status, response: text };
}

export async function collectRecentArticleUrls(strapi: any, hours: number = 24) {
  const protocol = process.env.BAIDU_PUSH_PROTOCOL || 'https';
  const site = process.env.BAIDU_SITE || '';
  const since = new Date(Date.now() - Math.max(1, hours) * 3600 * 1000).toISOString();

  const items = await strapi.entityService.findMany('api::article.article', {
    filters: {
      publishedAt: { $gte: since },
    },
    fields: ['slug', 'publishedAt'],
    populate: { site: { fields: ['domain'] } },
    sort: { publishedAt: 'desc' },
    limit: 2000,
  });

  // 仅推送与 BAIDU_SITE 匹配的文章，避免跨域推送错误
  const urls: string[] = [];
  for (const it of items) {
    const domain = it?.site?.domain;
    if (!domain) continue;
    if (site && domain !== site) continue; // 若配置了 BAIDU_SITE，仅推送该域名
    urls.push(`${protocol}://${domain}/${it.slug}`);
  }

  // 去重
  return Array.from(new Set(urls));
}