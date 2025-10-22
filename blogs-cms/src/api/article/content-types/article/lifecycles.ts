/*
 * Article lifecycles: auto-generate summary when missing, and push newly published URLs to Baidu.
 */

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

async function pushToBaidu(strapi: any, article: any) {
  try {
    const enabled = process.env.BAIDU_PUSH_ENABLED === "true";
    if (!enabled) return;

    // Resolve site domain
    const siteRel = article.site?.id ?? article.site ?? null;
    if (!siteRel) return;
    const site = await strapi.entityService.findOne('api::site.site', siteRel, { fields: ['domain'] });
    const domain: string | undefined = site?.domain || undefined;
    if (!domain) return;

    // Token mapping per domain (optional), fallback to BAIDU_PUSH_TOKEN
    let token = process.env.BAIDU_PUSH_TOKEN || "";
    const tokensRaw = process.env.BAIDU_TOKENS || "";
    if (tokensRaw) {
      try {
        const map = JSON.parse(tokensRaw);
        if (typeof map === 'object' && domain in map) token = String(map[domain] || token);
      } catch {}
    }
    if (!token) return;

    const protocol = process.env.BAIDU_PUSH_PROTOCOL || 'https';
    const articleUrl = `${protocol}://${domain}/${article.slug}`;
    const endpoint = `http://data.zz.baidu.com/urls?site=${encodeURIComponent(domain)}&token=${encodeURIComponent(token)}`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: articleUrl,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      strapi.log.warn(`[Baidu Push] Failed for ${articleUrl}: ${res.status} ${text}`);
    } else {
      strapi.log.info(`[Baidu Push] Submitted: ${articleUrl}`);
    }
  } catch (err) {
    strapi.log.warn(`[Baidu Push] Error: ${(err as any)?.message || err}`);
  }
}

export default {
  beforeCreate(event: any) {
    const data = event.params?.data || {};
    if (!data.summary && typeof data.content === 'string' && data.content) {
      const text = stripHtml(data.content);
      data.summary = text.slice(0, 160);
    }
  },
  beforeUpdate(event: any) {
    const data = event.params?.data || {};
    if (!data.summary && typeof data.content === 'string' && data.content) {
      const text = stripHtml(data.content);
      data.summary = text.slice(0, 160);
    }
  },
  async afterCreate(event: any) {
    const article = event.result;
    if (article?.publishedAt) {
      await pushToBaidu(strapi, article);
    }
  },
  async afterUpdate(event: any) {
    const article = event.result;
    if (article?.publishedAt) {
      await pushToBaidu(strapi, article);
    }
  },
};