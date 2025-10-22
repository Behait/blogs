"use strict";
/*
 * Article lifecycles: auto-generate summary when missing, and push newly published URLs to Baidu.
 */
Object.defineProperty(exports, "__esModule", { value: true });
function stripHtml(html) {
    return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}
async function pushToBaidu(strapi, article) {
    var _a, _b, _c;
    try {
        const enabled = process.env.BAIDU_PUSH_ENABLED === "true";
        if (!enabled)
            return;
        // Resolve site domain
        const siteRel = (_c = (_b = (_a = article.site) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : article.site) !== null && _c !== void 0 ? _c : null;
        if (!siteRel)
            return;
        const site = await strapi.entityService.findOne('api::site.site', siteRel, { fields: ['domain'] });
        const domain = (site === null || site === void 0 ? void 0 : site.domain) || undefined;
        if (!domain)
            return;
        // Token mapping per domain (optional), fallback to BAIDU_PUSH_TOKEN
        let token = process.env.BAIDU_PUSH_TOKEN || "";
        const tokensRaw = process.env.BAIDU_TOKENS || "";
        if (tokensRaw) {
            try {
                const map = JSON.parse(tokensRaw);
                if (typeof map === 'object' && domain in map)
                    token = String(map[domain] || token);
            }
            catch { }
        }
        if (!token)
            return;
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
        }
        else {
            strapi.log.info(`[Baidu Push] Submitted: ${articleUrl}`);
        }
    }
    catch (err) {
        strapi.log.warn(`[Baidu Push] Error: ${(err === null || err === void 0 ? void 0 : err.message) || err}`);
    }
}
exports.default = {
    beforeCreate(event) {
        var _a;
        const data = ((_a = event.params) === null || _a === void 0 ? void 0 : _a.data) || {};
        if (!data.summary && typeof data.content === 'string' && data.content) {
            const text = stripHtml(data.content);
            data.summary = text.slice(0, 160);
        }
    },
    beforeUpdate(event) {
        var _a;
        const data = ((_a = event.params) === null || _a === void 0 ? void 0 : _a.data) || {};
        if (!data.summary && typeof data.content === 'string' && data.content) {
            const text = stripHtml(data.content);
            data.summary = text.slice(0, 160);
        }
    },
    async afterCreate(event) {
        const article = event.result;
        if (article === null || article === void 0 ? void 0 : article.publishedAt) {
            await pushToBaidu(strapi, article);
        }
    },
    async afterUpdate(event) {
        const article = event.result;
        if (article === null || article === void 0 ? void 0 : article.publishedAt) {
            await pushToBaidu(strapi, article);
        }
    },
};
