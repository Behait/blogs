"use strict";
// Baidu active push utilities
Object.defineProperty(exports, "__esModule", { value: true });
exports.collectRecentArticleUrls = exports.pushUrlsToBaidu = void 0;
async function pushUrlsToBaidu(urls, site, token, logger) {
    var _a, _b, _c;
    const s = site || process.env.BAIDU_SITE || '';
    const t = token || process.env.BAIDU_TOKEN || '';
    if (!s || !t) {
        (_a = logger === null || logger === void 0 ? void 0 : logger.warn) === null || _a === void 0 ? void 0 : _a.call(logger, '[Baidu Push] BAIDU_SITE 或 BAIDU_TOKEN 未配置，跳过推送');
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
        (_b = logger === null || logger === void 0 ? void 0 : logger.warn) === null || _b === void 0 ? void 0 : _b.call(logger, `[Baidu Push] Failed: ${res.status} ${text}`);
    }
    else {
        (_c = logger === null || logger === void 0 ? void 0 : logger.info) === null || _c === void 0 ? void 0 : _c.call(logger, `[Baidu Push] Submitted ${urls.length} url(s)`);
    }
    return { ok: res.ok, status: res.status, response: text };
}
exports.pushUrlsToBaidu = pushUrlsToBaidu;
async function collectRecentArticleUrls(strapi, hours = 24) {
    var _a;
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
    const urls = [];
    for (const it of items) {
        const domain = (_a = it === null || it === void 0 ? void 0 : it.site) === null || _a === void 0 ? void 0 : _a.domain;
        if (!domain)
            continue;
        if (site && domain !== site)
            continue; // 若配置了 BAIDU_SITE，仅推送该域名
        urls.push(`${protocol}://${domain}/${it.slug}`);
    }
    // 去重
    return Array.from(new Set(urls));
}
exports.collectRecentArticleUrls = collectRecentArticleUrls;
