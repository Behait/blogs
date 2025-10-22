/*
 * Internal management service: autoTag
 * Scans articles and tags, matches keywords, and wires tag-article relations.
 * Designed for Strapi v5 with Documents API fallback.
 */

import type { Core } from '@strapi/strapi';
import fs from 'fs';
import path from 'path';

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isChinese(str: string): boolean {
  return /[\u4e00-\u9fff]/.test(str);
}

function stripHtml(html: string): string {
  return (html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function buildRegexForKeyword(kw: string): RegExp {
  if (!kw) return /$a/; // never match
  if (isChinese(kw)) return new RegExp(escapeRegExp(kw), 'i');
  return new RegExp(`\\b${escapeRegExp(kw.toLowerCase())}\\b`, 'i');
}

function normalizeText(t: string): string {
  return (t || '').toLowerCase();
}

type AutoTagOptions = {
  siteDomain?: string;
  dryRun?: boolean;
  limit?: number;
  minScore?: number; // minimum score to attach tag
  mapPath?: string; // optional JSON mapping path
};

type TagRecord = { id: number; documentId?: string; slug: string; name: string };

/**
 * Load keyword mapping if provided; otherwise derive from tag name/slug.
 */
function buildTagKeywordMap(tags: TagRecord[], mapPath?: string): Record<string, string[]> {
  const derived: Record<string, string[]> = {};
  for (const t of tags) {
    const base: string[] = [];
    base.push(String(t.name || '').trim());
    base.push(String(t.slug || '').trim());
    // split slug by hyphen/underscore for English multi-words
    for (const p of String(t.slug || '').split(/[\-_]+/).filter(Boolean)) {
      if (!base.includes(p)) base.push(p);
    }
    derived[t.slug] = base.filter(Boolean);
  }

  if (!mapPath) return derived;
  try {
    const abs = path.resolve(process.cwd(), mapPath);
    if (!fs.existsSync(abs)) return derived;
    const text = fs.readFileSync(abs, 'utf8');
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === 'object') {
      for (const [slug, v] of Object.entries(parsed as Record<string, any>)) {
        const arr: string[] = Array.isArray(v) ? v : Array.isArray((v as any)?.keywords) ? (v as any).keywords : [];
        if (arr.length) derived[slug] = Array.from(new Set([...(derived[slug] || []), ...arr.map(String)])).filter(Boolean);
      }
    }
  } catch {}
  return derived;
}

async function getSiteByDomain(strapi: Core.Strapi, domain?: string) {
  if (!domain) return null;
  const found = await strapi.entityService.findMany('api::site.site', { filters: { domain }, limit: 1 });
  return found?.[0] || null;
}

async function paginateArticles(strapi: Core.Strapi, siteId?: number, limit?: number) {
  const pageSize = 100;
  const max = typeof limit === 'number' && limit > 0 ? limit : Number.POSITIVE_INFINITY;
  const results: any[] = [];
  let page = 1;
  while (results.length < max) {
    const chunk = await (strapi.entityService as any).findMany('api::article.article', {
      page,
      pageSize,
      filters: siteId ? { site: siteId } : undefined,
    });
    if (!chunk || !chunk.length) break;
    for (const a of chunk) {
      results.push(a);
      if (results.length >= max) break;
    }
    if (chunk.length < pageSize) break;
    page += 1;
  }
  return results;
}

async function loadTags(strapi: Core.Strapi): Promise<TagRecord[]> {
  const tags = await (strapi.entityService as any).findMany('api::tag.tag');
  return (tags || []).map((t: any) => ({ id: Number(t.id), documentId: t.documentId ? String(t.documentId) : undefined, slug: String(t.slug), name: String(t.name) }));
}

async function connectTagArticle(strapi: Core.Strapi, tag: TagRecord, article: any): Promise<boolean> {
  try {
    const populated = await (strapi.entityService as any).findOne('api::tag.tag', tag.id, { populate: { articles: { fields: ['id'] } } });
    const existing = (((populated as any)?.articles) || []).some((r: any) => Number(r.id) === Number(article.id) || (r.documentId && r.documentId === article.documentId));
    if (existing) return false;
  } catch {}
  const articleDocId = article.documentId ? String(article.documentId) : undefined;
  if (articleDocId && tag.documentId) {
    try {
      await (strapi as any).documents('api::tag.tag').update({
        documentId: tag.documentId,
        data: { articles: { connect: [articleDocId] } },
      });
      return true;
    } catch {}
  }
  try {
    const populated = await (strapi.entityService as any).findOne('api::tag.tag', tag.id, { populate: { articles: { fields: ['id'] } } });
    const ids = ((((populated as any)?.articles) || []).map((r: any) => Number(r.id)));
    if (!ids.includes(Number(article.id))) ids.push(Number(article.id));
    await (strapi.entityService as any).update('api::tag.tag', tag.id, { data: { articles: ids as any } });
    return true;
  } catch (e) {
    strapi.log.warn(`[autoTag] Failed to connect tag ${tag.slug} -> article ${article.slug}: ${(e as any)?.message || e}`);
    return false;
  }
}

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  async autoTag(opts: AutoTagOptions) {
    const dryRun = !!opts?.dryRun;
    const minScore = typeof opts?.minScore === 'number' ? opts.minScore : 2;
    const site = await getSiteByDomain(strapi, opts?.siteDomain);
    const siteId = site?.id ? Number(site.id) : undefined;

    const [articles, tags] = await Promise.all([
      (strapi.entityService as any).findMany('api::article.article', {
        filters: siteId ? { site: siteId } : undefined,
      }),
      loadTags(strapi),
    ]);

    const kwMap = buildTagKeywordMap(tags, opts?.mapPath);
    const tagRegexMap: Record<string, RegExp[]> = {};
    for (const t of tags) {
      const kws = kwMap[t.slug] || [];
      tagRegexMap[t.slug] = kws.map(buildRegexForKeyword);
    }

    let updated = 0;
    let skipped = 0;
    const perArticleMatches: Record<string, string[]> = {};

    for (const a of articles) {
      const text = normalizeText(`${a.title}\n${a.summary}\n${stripHtml(a.content || '')}`);
      const matched: string[] = [];
      for (const t of tags) {
        const regs = tagRegexMap[t.slug];
        if (!regs || !regs.length) continue;
        let score = 0;
        for (const r of regs) {
          if (r.test(text)) score += 1;
          if (score >= minScore) break;
        }
        if (score >= minScore) matched.push(t.slug);
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
        const tag = tags.find((x) => x.slug === slug)!;
        const ok = await connectTagArticle(strapi, tag, a);
        if (ok) updated += 1;
      }
    }

    return {
      dryRun,
      minScore,
      siteDomain: opts?.siteDomain || null,
      articles: articles.length,
      tags: tags.length,
      updated,
      skipped,
      matches: perArticleMatches,
    };
  },
  async aiGenerate(opts: { topics: string[]; categorySlug?: string; tagSlugs?: string[]; siteDomain?: string; publish?: boolean }) {
    const topics = Array.isArray(opts?.topics) ? opts.topics.map(String).filter(Boolean) : [];
    if (!topics.length) throw new Error('No topics provided');
    const categorySlug = String(opts?.categorySlug || 'general');
    const tagSlugs = Array.isArray(opts?.tagSlugs) ? opts.tagSlugs.map(String).filter(Boolean) : [];
    const publish = !!opts?.publish;

    let siteId: number | undefined;
    if (opts?.siteDomain) {
      const s = await (strapi.entityService as any).findMany('api::site.site', { filters: { domain: opts.siteDomain }, limit: 1 });
      const site = s?.[0];
      siteId = site ? Number((site as any).id) : undefined;
    }
    if (!siteId) {
      const anySites = await (strapi.entityService as any).findMany('api::site.site', { limit: 1 });
      const site = anySites?.[0];
      siteId = site ? Number((site as any).id) : undefined;
    }
    if (!siteId) throw new Error('No site available');

    const tagRecords: any[] = [];
    const slugMap: Record<string, string> = { '小说': 'novel', '玄幻': 'xuanhuan', '修仙': 'xiuxian' };
    for (const slug of tagSlugs) {
      const preferred = slugMap[slug] || slug;
      const safeSlug = slugify(preferred);
      let tag = (await (strapi.entityService as any).findMany('api::tag.tag', { filters: { slug: safeSlug }, limit: 1 }))?.[0];
      if (!tag) tag = await (strapi.entityService as any).create('api::tag.tag', { data: { name: slug, slug: safeSlug, enabled: true } });
      tagRecords.push(tag);
    }

    const rawCategory = categorySlug;
    const preferredCategory = slugMap[rawCategory] || rawCategory;
    const safeCategorySlug = slugify(preferredCategory);
    let category = (await (strapi.entityService as any).findMany('api::category.category', { filters: { slug: safeCategorySlug }, limit: 1 }))?.[0];
    if (!category) {
      // Try by name matching when slug differs
      category = (await (strapi.entityService as any).findMany('api::category.category', { filters: { name: rawCategory }, limit: 1 }))?.[0];
    }
    if (!category) {
      category = await (strapi.entityService as any).create('api::category.category', { data: { name: rawCategory, slug: safeCategorySlug, enabled: true } });
    }

    function slugify(input: string): string {
      const base = (input || '').toLowerCase();
      // Normalize and strip diacritics
      const normalized = base.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
      // Only allow characters that match Strapi slug validation: A-Za-z0-9-_.~
      let s = normalized.replace(/[^A-Za-z0-9\-_.~]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      if (!s) s = 'article-' + Math.random().toString(36).slice(2, 8);
      return s;
    }
    function strip(html: string): string { return (html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(); }

    async function generateByAI(topic: string) {
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
      const body = { model, temperature: 0.6, messages: [ { role: 'system', content: systemPrompt }, { role: 'user', content: `主题：${topic}\n请按要求生成。` } ] };
      const res = await fetch(url, { method: 'POST', headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) {
        const title = String(topic).slice(0, 60);
        const html = `<h2>${title}</h2>\n<p>（AI 生成失败，使用模板占位）</p>`;
        return { title, summary: '本文为模板占位内容，请补充。', html };
      }
      const json = await res.json();
      const content = (json as any)?.choices?.[0]?.message?.content || '';
      try {
        const obj = JSON.parse(content);
        return { title: String(obj.title || topic).slice(0, 60), summary: strip(String(obj.summary || '')), html: String(obj.html || `<h2>${topic}</h2><p>（待补充）</p>`) };
      } catch {
        const title = String(topic).slice(0, 60);
        return { title, summary: '', html: `<h2>${title}</h2>\n<p>${content}</p>` };
      }
    }

    const created: string[] = [];
    for (const topic of topics) {
      const gen = await generateByAI(topic);
      const title = gen.title || String(topic).slice(0, 60);
      const slug = slugify(title);
      const content = gen.html;
      const summary = gen.summary || strip(content).slice(0, 160);

      const dup = await (strapi.entityService as any).findMany('api::article.article', { filters: { slug }, limit: 1 });
      if (dup && dup.length) continue;

      const data: any = {
        title,
        slug,
        summary,
        content,
        site: { id: siteId },
        category: { id: (category as any).id },
        publishedAt: publish ? new Date() : null,
      };
      const article = await (strapi.entityService as any).create('api::article.article', { data });
      created.push(String((article as any)?.slug || slug));
    }

    return { siteDomain: opts?.siteDomain || null, categorySlug, tags: tagSlugs, publish, topics: topics.length, created };
  },
});