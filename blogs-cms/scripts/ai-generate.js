#!/usr/bin/env node
/*
AI Content Generator for Strapi (blogs-cms)
- Generates articles via an AI provider (OpenAI-compatible) or a template fallback
- Creates articles directly using Strapi entityService (no public API needed)

Env variables:
  AI_PROVIDER=openai            # optional, default openai
  AI_BASE_URL=https://api.openai.com/v1
  AI_MODEL=gpt-4o-mini          # or any chat model your provider supports
  AI_API_KEY=sk-...             # required for real AI generation
  SITE_DOMAIN=example.com       # used to pick target site (fallback to first site)

CLI args:
  --count=5                     # generate N articles (ignored if --topics provided)
  --category=general            # category slug; created if missing
  --tags=tag1,tag2              # optional tag slugs; created if missing (relation wiring deferred)
  --topics=./topics.json        # optional path to JSON array or .txt (one topic per line)

Usage:
  node ./scripts/ai-generate.js --count=3 --category=general
  node ./scripts/ai-generate.js --topics=./topics.json --category=ai
*/

const path = require('path');
const fs = require('fs');
const { createStrapi } = require('@strapi/strapi');

function getArg(name, defVal) {
  const raw = process.argv.find(a => a.startsWith(`--${name}=`));
  if (!raw) return defVal;
  const v = raw.split('=').slice(1).join('=');
  return v === undefined || v === '' ? defVal : v;
}

function slugify(input) {
  const base = (input || '').toLowerCase();
  const normalized = base.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
  let s = normalized.replace(/[^A-Za-z0-9\-_.~]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return s || ('article-' + Math.random().toString(36).slice(2, 8));
}

function stripHtml(html) {
  return (html || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

function readTopics(topicsPath, fallbackCount) {
  if (!topicsPath) return Array.from({ length: fallbackCount }, (_, i) => `主题 ${i + 1}`);
  const abs = path.resolve(process.cwd(), topicsPath);
  if (!fs.existsSync(abs)) throw new Error(`Topics file not found: ${abs}`);
  const content = fs.readFileSync(abs, 'utf8');
  if (abs.endsWith('.json')) {
    const arr = JSON.parse(content);
    if (!Array.isArray(arr)) throw new Error('Topics JSON must be an array of strings');
    return arr.map(String).filter(Boolean);
  }
  // treat as plain text, one topic per line
  return content.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
}

async function generateByAI({ topic, provider, baseUrl, model, apiKey }) {
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
  const userPrompt = `主题：${topic}\n请按要求生成。`;

  const body = {
    model,
    temperature: 0.6,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`AI HTTP ${res.status}: ${t.slice(0, 200)}`);
  }
  const json = await res.json();
  const content = json?.choices?.[0]?.message?.content || '';
  let obj;
  try {
    obj = JSON.parse(content);
  } catch (e) {
    // fallback: try to extract title line and treat rest as html
    const titleMatch = content.match(/\"title\"\s*:\s*\"([^\"]+)/);
    const summaryMatch = content.match(/\"summary\"\s*:\s*\"([^\"]+)/);
    const htmlMatch = content.match(/\"html\"\s*:\s*\"([\s\S]*)\"\s*\}?\s*$/);
    obj = {
      title: titleMatch ? titleMatch[1] : String(topic).slice(0, 60),
      summary: summaryMatch ? summaryMatch[1] : '',
      html: htmlMatch ? htmlMatch[1] : `<h2>${topic}</h2><p>${content}</p>`,
    };
  }
  return {
    title: String(obj.title || topic).slice(0, 60),
    summary: stripHtml(String(obj.summary || '')),
    html: String(obj.html || `<h2>${topic}</h2><p>（待补充）</p>`),
  };
}

function fallbackGenerate(topic) {
  const title = String(topic).slice(0, 60);
  const paragraphs = [
    `<h2>${title}</h2>`,
    '<p>本文概述该主题的核心概念与背景。</p>',
    '<h3>关键点</h3>',
    '<ul><li>术语与定义</li><li>应用场景</li><li>注意事项</li></ul>',
    '<h3>实践建议</h3>',
    '<p>从简单示例入手，逐步扩展；记录问题与结论。</p>',
  ];
  return {
    title,
    summary: '本文为模板占位内容，请通过 AI 生成或人工补充完善。',
    html: paragraphs.join('\n'),
  };
}

(async () => {
  const count = parseInt(getArg('count', '1'), 10) || 1;
  const topicsPath = getArg('topics', '');
  const categorySlug = getArg('category', 'general');
  const tagSlugs = (getArg('tags', '') || '').split(',').map(s => s.trim()).filter(Boolean);

  const provider = process.env.AI_PROVIDER || 'openai';
  const baseUrl = process.env.AI_BASE_URL || 'https://api.openai.com/v1';
  const model = process.env.AI_MODEL || 'gpt-4o-mini';
  const apiKey = process.env.AI_API_KEY || '';

  const topics = readTopics(topicsPath, count);

  const strapi = await createStrapi().load();
  await strapi.start();
  try {
    // Resolve target site
    const siteDomain = process.env.SITE_DOMAIN || '';
    let site;
    if (siteDomain) {
      const sitesByDomain = await strapi.entityService.findMany('api::site.site', {
        filters: { domain: siteDomain },
        limit: 1,
      });
      site = sitesByDomain?.[0];
    }
    if (!site) {
      const anySites = await strapi.entityService.findMany('api::site.site', { limit: 1 });
      site = anySites?.[0];
    }
    if (!site) throw new Error('未找到可用站点（site）。请先在 CMS 中创建站点。');

    // Ensure category exists
    let category = (await strapi.entityService.findMany('api::category.category', {
      filters: { slug: categorySlug },
      limit: 1,
    }))?.[0];
    if (!category) {
      category = await strapi.entityService.create('api::category.category', {
        data: { name: categorySlug, slug: categorySlug, enabled: true },
      });
      console.log('已创建分类：', categorySlug);
    }

    // Ensure tags exist (relation wiring deferred to keep script simple)
    const tags = [];
    for (const slug of tagSlugs) {
      let tag = (await strapi.entityService.findMany('api::tag.tag', {
        filters: { slug },
        limit: 1,
      }))?.[0];
      if (!tag) {
        tag = await strapi.entityService.create('api::tag.tag', { data: { name: slug, slug, enabled: true } });
        console.log('已创建标签：', slug);
      }
      tags.push(tag);
    }

    for (const topic of topics) {
      let gen;
      if (apiKey) {
        try {
          gen = await generateByAI({ topic, provider, baseUrl, model, apiKey });
        } catch (err) {
          console.warn('AI 生成失败，使用模板占位：', err.message);
          gen = fallbackGenerate(topic);
        }
      } else {
        gen = fallbackGenerate(topic);
      }

      const title = gen.title || String(topic).slice(0, 60);
      const slug = slugify(title);
      const content = gen.html;
      const summary = gen.summary || stripHtml(content).slice(0, 160);

      // Skip if article with same slug exists
      const dup = await strapi.entityService.findMany('api::article.article', {
        filters: { slug },
        fields: ['id', 'slug'],
        limit: 1,
      });
      if (dup && dup.length) {
        console.log('跳过重复：', slug);
        continue;
      }

      const data = {
        title,
        slug,
        summary,
        content,
        site: { id: site.id },
        category: { id: category.id },
        publishedAt: null,
      };

      const article = await strapi.entityService.create('api::article.article', { data });
      console.log('已创建文章：', article.slug);
    }
  } finally {
    await strapi.destroy();
  }
})();