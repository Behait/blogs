"use strict";
/*
 * Internal management service: autoTag
 * Scans articles and tags, matches keywords, and wires tag-article relations.
 * Designed for Strapi v5 with Documents API fallback.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
function isChinese(str) {
    return /[\u4e00-\u9fff]/.test(str);
}
function stripHtml(html) {
    return (html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}
function buildRegexForKeyword(kw) {
    if (!kw)
        return /$a/; // never match
    if (isChinese(kw))
        return new RegExp(escapeRegExp(kw), 'i');
    return new RegExp(`\\b${escapeRegExp(kw.toLowerCase())}\\b`, 'i');
}
function normalizeText(t) {
    return (t || '').toLowerCase();
}
/**
 * Load keyword mapping if provided; otherwise derive from tag name/slug.
 */
function buildTagKeywordMap(tags, mapPath) {
    const derived = {};
    for (const t of tags) {
        const base = [];
        base.push(String(t.name || '').trim());
        base.push(String(t.slug || '').trim());
        // split slug by hyphen/underscore for English multi-words
        for (const p of String(t.slug || '').split(/[\-_]+/).filter(Boolean)) {
            if (!base.includes(p))
                base.push(p);
        }
        derived[t.slug] = base.filter(Boolean);
    }
    if (!mapPath)
        return derived;
    try {
        const abs = path_1.default.resolve(process.cwd(), mapPath);
        if (!fs_1.default.existsSync(abs))
            return derived;
        const text = fs_1.default.readFileSync(abs, 'utf8');
        const parsed = JSON.parse(text);
        if (parsed && typeof parsed === 'object') {
            for (const [slug, v] of Object.entries(parsed)) {
                const arr = Array.isArray(v) ? v : Array.isArray(v === null || v === void 0 ? void 0 : v.keywords) ? v.keywords : [];
                if (arr.length)
                    derived[slug] = Array.from(new Set([...(derived[slug] || []), ...arr.map(String)])).filter(Boolean);
            }
        }
    }
    catch { }
    return derived;
}
async function getSiteByDomain(strapi, domain) {
    if (!domain)
        return null;
    const found = await strapi.entityService.findMany('api::site.site', { filters: { domain }, limit: 1 });
    return (found === null || found === void 0 ? void 0 : found[0]) || null;
}
async function paginateArticles(strapi, siteId, limit) {
    const pageSize = 100;
    const max = typeof limit === 'number' && limit > 0 ? limit : Number.POSITIVE_INFINITY;
    const results = [];
    let page = 1;
    while (results.length < max) {
        const chunk = await strapi.entityService.findMany('api::article.article', {
            page,
            pageSize,
            filters: siteId ? { site: siteId } : undefined,
        });
        if (!chunk || !chunk.length)
            break;
        for (const a of chunk) {
            results.push(a);
            if (results.length >= max)
                break;
        }
        if (chunk.length < pageSize)
            break;
        page += 1;
    }
    return results;
}
async function loadTags(strapi) {
    const tags = await strapi.entityService.findMany('api::tag.tag');
    return (tags || []).map((t) => ({ id: Number(t.id), documentId: t.documentId ? String(t.documentId) : undefined, slug: String(t.slug), name: String(t.name) }));
}
async function connectTagArticle(strapi, tag, article) {
    try {
        const populated = await strapi.entityService.findOne('api::tag.tag', tag.id, { populate: { articles: { fields: ['id'] } } });
        const existing = ((populated === null || populated === void 0 ? void 0 : populated.articles) || []).some((r) => Number(r.id) === Number(article.id) || (r.documentId && r.documentId === article.documentId));
        if (existing)
            return false;
    }
    catch { }
    const articleDocId = article.documentId ? String(article.documentId) : undefined;
    if (articleDocId && tag.documentId) {
        try {
            await strapi.documents('api::tag.tag').update({
                documentId: tag.documentId,
                data: { articles: { connect: [articleDocId] } },
            });
            return true;
        }
        catch { }
    }
    try {
        const populated = await strapi.entityService.findOne('api::tag.tag', tag.id, { populate: { articles: { fields: ['id'] } } });
        const ids = (((populated === null || populated === void 0 ? void 0 : populated.articles) || []).map((r) => Number(r.id)));
        if (!ids.includes(Number(article.id)))
            ids.push(Number(article.id));
        await strapi.entityService.update('api::tag.tag', tag.id, { data: { articles: ids } });
        return true;
    }
    catch (e) {
        strapi.log.warn(`[autoTag] Failed to connect tag ${tag.slug} -> article ${article.slug}: ${(e === null || e === void 0 ? void 0 : e.message) || e}`);
        return false;
    }
}
exports.default = ({ strapi }) => ({
    async autoTag(opts) {
        const dryRun = !!(opts === null || opts === void 0 ? void 0 : opts.dryRun);
        const minScore = typeof (opts === null || opts === void 0 ? void 0 : opts.minScore) === 'number' ? opts.minScore : 2;
        const site = await getSiteByDomain(strapi, opts === null || opts === void 0 ? void 0 : opts.siteDomain);
        const siteId = (site === null || site === void 0 ? void 0 : site.id) ? Number(site.id) : undefined;
        const [articles, tags] = await Promise.all([
            strapi.entityService.findMany('api::article.article', {
                filters: siteId ? { site: siteId } : undefined,
            }),
            loadTags(strapi),
        ]);
        const kwMap = buildTagKeywordMap(tags, opts === null || opts === void 0 ? void 0 : opts.mapPath);
        const tagRegexMap = {};
        for (const t of tags) {
            const kws = kwMap[t.slug] || [];
            tagRegexMap[t.slug] = kws.map(buildRegexForKeyword);
        }
        let updated = 0;
        let skipped = 0;
        const perArticleMatches = {};
        for (const a of articles) {
            const text = normalizeText(`${a.title}\n${a.summary}\n${stripHtml(a.content || '')}`);
            const matched = [];
            for (const t of tags) {
                const regs = tagRegexMap[t.slug];
                if (!regs || !regs.length)
                    continue;
                let score = 0;
                for (const r of regs) {
                    if (r.test(text))
                        score += 1;
                    if (score >= minScore)
                        break;
                }
                if (score >= minScore)
                    matched.push(t.slug);
            }
            perArticleMatches[a.slug] = matched;
            if (!matched.length) {
                skipped += 1;
                continue;
            }
            if (dryRun) {
                continue;
            }
            for (const slug of matched) {
                const tag = tags.find((x) => x.slug === slug);
                const ok = await connectTagArticle(strapi, tag, a);
                if (ok)
                    updated += 1;
            }
        }
        return {
            dryRun,
            minScore,
            siteDomain: (opts === null || opts === void 0 ? void 0 : opts.siteDomain) || null,
            articles: articles.length,
            tags: tags.length,
            updated,
            skipped,
            matches: perArticleMatches,
        };
    },
    async aiGenerate(opts) {
        var _a, _b, _c;
        const topics = Array.isArray(opts === null || opts === void 0 ? void 0 : opts.topics) ? opts.topics.map(String).filter(Boolean) : [];
        if (!topics.length)
            throw new Error('No topics provided');
        const categorySlug = String((opts === null || opts === void 0 ? void 0 : opts.categorySlug) || 'general');
        const tagSlugs = Array.isArray(opts === null || opts === void 0 ? void 0 : opts.tagSlugs) ? opts.tagSlugs.map(String).filter(Boolean) : [];
        const publish = !!(opts === null || opts === void 0 ? void 0 : opts.publish);
        let siteId;
        if (opts === null || opts === void 0 ? void 0 : opts.siteDomain) {
            const s = await strapi.entityService.findMany('api::site.site', { filters: { domain: opts.siteDomain }, limit: 1 });
            const site = s === null || s === void 0 ? void 0 : s[0];
            siteId = site ? Number(site.id) : undefined;
        }
        if (!siteId) {
            const anySites = await strapi.entityService.findMany('api::site.site', { limit: 1 });
            const site = anySites === null || anySites === void 0 ? void 0 : anySites[0];
            siteId = site ? Number(site.id) : undefined;
        }
        if (!siteId)
            throw new Error('No site available');
        const tagRecords = [];
        const slugMap = { '小说': 'novel', '玄幻': 'xuanhuan', '修仙': 'xiuxian' };
        for (const slug of tagSlugs) {
            const preferred = slugMap[slug] || slug;
            const safeSlug = slugify(preferred);
            let tag = (_a = (await strapi.entityService.findMany('api::tag.tag', { filters: { slug: safeSlug }, limit: 1 }))) === null || _a === void 0 ? void 0 : _a[0];
            if (!tag)
                tag = await strapi.entityService.create('api::tag.tag', { data: { name: slug, slug: safeSlug, enabled: true } });
            tagRecords.push(tag);
        }
        const rawCategory = categorySlug;
        const preferredCategory = slugMap[rawCategory] || rawCategory;
        const safeCategorySlug = slugify(preferredCategory);
        let category = (_b = (await strapi.entityService.findMany('api::category.category', { filters: { slug: safeCategorySlug }, limit: 1 }))) === null || _b === void 0 ? void 0 : _b[0];
        if (!category) {
            // Try by name matching when slug differs
            category = (_c = (await strapi.entityService.findMany('api::category.category', { filters: { name: rawCategory }, limit: 1 }))) === null || _c === void 0 ? void 0 : _c[0];
        }
        if (!category) {
            category = await strapi.entityService.create('api::category.category', { data: { name: rawCategory, slug: safeCategorySlug, enabled: true } });
        }
        function slugify(input) {
            const base = (input || '').toLowerCase();
            // Normalize and strip diacritics
            const normalized = base.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
            // Only allow characters that match Strapi slug validation: A-Za-z0-9-_.~
            let s = normalized.replace(/[^A-Za-z0-9\-_.~]+/g, '-')
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, '');
            if (!s)
                s = 'article-' + Math.random().toString(36).slice(2, 8);
            return s;
        }
        function strip(html) { return (html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(); }
        async function generateByAI(topic) {
            var _a, _b, _c;
            const provider = process.env.AI_PROVIDER || 'openai';
            const baseUrl = process.env.AI_BASE_URL || 'https://api.openai.com/v1';
            const model = process.env.AI_MODEL || 'gpt-4o-mini';
            const apiKey = process.env.AI_API_KEY || '';
            if (!apiKey) {
                const title = String(topic).slice(0, 60);
                const html = `<h2>${title}</h2>\n<p>本文围绕主题展开，包含背景、关键点与实践建议。</p>`;
                return { title, summary: '本文为模板占位内容，请通过 AI 生成或人工补充完善。', html };
            }
            const url = `${baseUrl.replace(/\/$/, '')}/chat/completions`;
            const systemPrompt = [
                '你是资深中文技术写手，输出结构化 JSON 内容：',
                '{',
                '  "title": <不超过60字的标题>,',
                '  "summary": <80-160字摘要>,',
                '  "html": <正文 HTML，包含多个 <h2>/<h3> 和 <p>，适度使用 <ul>/<ol>，不包含外部脚本>',
                '}',
                '要求：避免夸大和广告语，内容专业、可读；段落简洁，中文标点规范。'
            ].join('\n');
            const body = { model, temperature: 0.6, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: `主题：${topic}\n请按要求生成。` }] };
            const res = await fetch(url, { method: 'POST', headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            if (!res.ok) {
                const title = String(topic).slice(0, 60);
                const html = `<h2>${title}</h2>\n<p>（AI 生成失败，使用模板占位）</p>`;
                return { title, summary: '本文为模板占位内容，请补充。', html };
            }
            const json = await res.json();
            const content = ((_c = (_b = (_a = json === null || json === void 0 ? void 0 : json.choices) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.message) === null || _c === void 0 ? void 0 : _c.content) || '';
            try {
                const obj = JSON.parse(content);
                return { title: String(obj.title || topic).slice(0, 60), summary: strip(String(obj.summary || '')), html: String(obj.html || `<h2>${topic}</h2><p>（待补充）</p>`) };
            }
            catch {
                const title = String(topic).slice(0, 60);
                return { title, summary: '', html: `<h2>${title}</h2>\n<p>${content}</p>` };
            }
        }
        const created = [];
        for (const topic of topics) {
            const gen = await generateByAI(topic);
            const title = gen.title || String(topic).slice(0, 60);
            const slug = slugify(title);
            const content = gen.html;
            const summary = gen.summary || strip(content).slice(0, 160);
            const dup = await strapi.entityService.findMany('api::article.article', { filters: { slug }, limit: 1 });
            if (dup && dup.length)
                continue;
            const data = {
                title,
                slug,
                summary,
                content,
                site: { id: siteId },
                category: { id: category.id },
                publishedAt: publish ? new Date() : null,
            };
            const article = await strapi.entityService.create('api::article.article', { data });
            created.push(String((article === null || article === void 0 ? void 0 : article.slug) || slug));
        }
        return { siteDomain: (opts === null || opts === void 0 ? void 0 : opts.siteDomain) || null, categorySlug, tags: tagSlugs, publish, topics: topics.length, created };
    },
});
