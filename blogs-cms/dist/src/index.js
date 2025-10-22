"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    register( /* { strapi }: { strapi: Core.Strapi } */) { },
    async bootstrap({ strapi }) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
        // 配置 Public 角色权限：允许读取文章与站点、允许创建评论
        try {
            const role = await strapi.query('plugin::users-permissions.role').findOne({ where: { type: 'public' } });
            if (role) {
                const actions = [
                    'api::article.article.find',
                    'api::article.article.findOne',
                    'api::site.site.find',
                    'api::category.category.find',
                    'api::tag.tag.find',
                    'api::comment.comment.find',
                    'api::comment.comment.create',
                ];
                for (const action of actions) {
                    const existing = await strapi.query('plugin::users-permissions.permission').findOne({
                        where: { role: role.id, action },
                    });
                    if (existing) {
                        await strapi.query('plugin::users-permissions.permission').update({
                            where: { id: existing.id },
                            data: { enabled: true },
                        });
                    }
                    else {
                        await strapi.query('plugin::users-permissions.permission').create({
                            data: { role: role.id, action, enabled: true },
                        });
                    }
                }
            }
        }
        catch (err) {
            strapi.log.warn('Failed to setup public permissions automatically');
        }
        // 数据种子：创建本地站点与示例文章
        try {
            const siteDomain = 'localhost:3000';
            let site = (_a = (await strapi.entityService.findMany('api::site.site', {
                filters: { domain: siteDomain },
                limit: 1,
            }))) === null || _a === void 0 ? void 0 : _a[0];
            if (!site) {
                site = await strapi.entityService.create('api::site.site', {
                    data: { name: 'Local Site', domain: siteDomain, enabled: true },
                });
            }
            // 种子分类与标签
            const categoryName = 'General';
            let category = (_b = (await strapi.entityService.findMany('api::category.category', {
                filters: { name: categoryName },
                limit: 1,
            }))) === null || _b === void 0 ? void 0 : _b[0];
            if (!category) {
                category = await strapi.entityService.create('api::category.category', {
                    data: { name: categoryName, slug: 'general' },
                });
            }
            const tagName = 'intro';
            let tag = (_c = (await strapi.entityService.findMany('api::tag.tag', {
                filters: { name: tagName },
                limit: 1,
            }))) === null || _c === void 0 ? void 0 : _c[0];
            if (!tag) {
                tag = await strapi.entityService.create('api::tag.tag', {
                    data: { name: tagName, slug: 'intro' },
                });
            }
            const slug = 'hello-world';
            const existingArticle = (_d = (await strapi.entityService.findMany('api::article.article', {
                filters: { slug },
                limit: 1,
            }))) === null || _d === void 0 ? void 0 : _d[0];
            if (!existingArticle) {
                await strapi.entityService.create('api::article.article', {
                    data: {
                        title: 'Hello World',
                        slug,
                        summary: '示例文章摘要',
                        content: '<p>这是一个示例文章，用于预览与联调。</p>',
                        site: { id: site.id },
                        category: { id: category.id },
                        publishedAt: new Date(),
                    },
                });
            }
            // 额外两篇测试文章
            const extraArticles = [
                {
                    slug: 'nextjs-first-steps',
                    title: 'Next.js 入门指南',
                    summary: '快速了解 Next.js 的基本用法与目录结构。',
                    content: '<p>本文介绍 Next.js 的基础概念、目录结构与常用命令。</p>',
                },
                {
                    slug: 'strapi-quick-start',
                    title: 'Strapi 快速上手',
                    summary: '从零开始搭建 Strapi 并创建第一个接口。',
                    content: '<p>本文讲解如何初始化 Strapi 项目、定义内容类型与权限。</p>',
                },
            ];
            for (const a of extraArticles) {
                const exist = (_e = (await strapi.entityService.findMany('api::article.article', {
                    filters: { slug: a.slug },
                    limit: 1,
                }))) === null || _e === void 0 ? void 0 : _e[0];
                if (!exist) {
                    await strapi.entityService.create('api::article.article', {
                        data: {
                            title: a.title,
                            slug: a.slug,
                            summary: a.summary,
                            content: a.content,
                            site: { id: site.id },
                            category: { id: category.id },
                            publishedAt: new Date(),
                        },
                    });
                }
            }
            // 扩充：更多站点、分类、标签与文章
            // 站点
            const moreSitesPayload = [
                { name: 'Demo Site 1', domain: 'demo1.local', enabled: true },
                { name: 'Demo Site 2', domain: 'demo2.local', enabled: true },
            ];
            const moreSites = [];
            for (const s of moreSitesPayload) {
                let found = (_f = (await strapi.entityService.findMany('api::site.site', {
                    filters: { domain: s.domain },
                    limit: 1,
                }))) === null || _f === void 0 ? void 0 : _f[0];
                if (!found) {
                    found = await strapi.entityService.create('api::site.site', { data: s });
                }
                moreSites.push(found);
            }
            // 分类
            const moreCategoriesPayload = [
                { name: 'Tutorials', slug: 'tutorials' },
                { name: 'News', slug: 'news' },
                { name: 'Tips', slug: 'tips' },
            ];
            const moreCategories = [category];
            for (const c of moreCategoriesPayload) {
                let found = (_g = (await strapi.entityService.findMany('api::category.category', {
                    filters: { slug: c.slug },
                    limit: 1,
                }))) === null || _g === void 0 ? void 0 : _g[0];
                if (!found) {
                    found = await strapi.entityService.create('api::category.category', { data: c });
                }
                moreCategories.push(found);
            }
            // 标签
            const moreTagsPayload = [
                { name: 'nextjs', slug: 'nextjs' },
                { name: 'strapi', slug: 'strapi' },
                { name: 'react', slug: 'react' },
                { name: 'typescript', slug: 'typescript' },
                { name: 'tailwind', slug: 'tailwind' },
            ];
            const moreTags = [tag];
            for (const t of moreTagsPayload) {
                let found = (_h = (await strapi.entityService.findMany('api::tag.tag', {
                    filters: { slug: t.slug },
                    limit: 1,
                }))) === null || _h === void 0 ? void 0 : _h[0];
                if (!found) {
                    found = await strapi.entityService.create('api::tag.tag', { data: t });
                }
                moreTags.push(found);
            }
            // 帮助函数：过去 n 天的时间
            const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);
            // 更多文章（分布到不同站点与分类/标签）
            const moreArticles = [
                {
                    slug: 'react-hooks-overview',
                    title: 'React Hooks 全览',
                    summary: '常用 Hook 与最佳实践。',
                    content: '<p>介绍 useState/useEffect/useMemo 等常用 Hook。</p>',
                    site: site,
                    categorySlug: 'tips',
                    tagSlugs: ['react', 'typescript'],
                    publishedAt: daysAgo(5),
                },
                {
                    slug: 'tailwind-best-practices',
                    title: 'Tailwind 最佳实践',
                    summary: '原子化样式组织与抽象技巧。',
                    content: '<p>如何在大型项目中组织 Tailwind 类。</p>',
                    site: site,
                    categorySlug: 'tutorials',
                    tagSlugs: ['tailwind'],
                    publishedAt: daysAgo(4),
                },
                {
                    slug: 'deploy-next-on-vercel',
                    title: '部署 Next.js 到 Vercel',
                    summary: '从本地到云端的部署流程。',
                    content: '<p>一步步完成 Vercel 部署与域名绑定。</p>',
                    site: moreSites[0],
                    categorySlug: 'tutorials',
                    tagSlugs: ['nextjs'],
                    publishedAt: daysAgo(3),
                },
                {
                    slug: 'strapi-auth-guide',
                    title: 'Strapi 权限与认证指南',
                    summary: '理解角色、权限与公共访问。',
                    content: '<p>配置 Public 角色与基于插件的权限。</p>',
                    site: moreSites[0],
                    categorySlug: 'news',
                    tagSlugs: ['strapi'],
                    publishedAt: daysAgo(2),
                },
                {
                    slug: 'typescript-tips',
                    title: 'TypeScript 小贴士',
                    summary: '类型推断、联合类型与工具类型。',
                    content: '<p>提升 TS 使用效率的技巧合集。</p>',
                    site: moreSites[1],
                    categorySlug: 'tips',
                    tagSlugs: ['typescript'],
                    publishedAt: daysAgo(2),
                },
                {
                    slug: 'web-performance-basics',
                    title: 'Web 性能基础',
                    summary: '关键指标与优化路径。',
                    content: '<p>FCP/LCP/CLS 等指标与优化建议。</p>',
                    site: moreSites[1],
                    categorySlug: 'news',
                    tagSlugs: ['react', 'nextjs'],
                    publishedAt: daysAgo(1),
                },
            ];
            for (const a of moreArticles) {
                const exist = (_j = (await strapi.entityService.findMany('api::article.article', {
                    filters: { slug: a.slug },
                    limit: 1,
                }))) === null || _j === void 0 ? void 0 : _j[0];
                if (!exist) {
                    const cat = moreCategories.find((c) => c.slug === a.categorySlug) || category;
                    const created = await strapi.entityService.create('api::article.article', {
                        data: {
                            title: a.title,
                            slug: a.slug,
                            summary: a.summary,
                            content: a.content,
                            site: { id: a.site.id },
                            category: { id: cat.id },
                            publishedAt: a.publishedAt,
                        },
                    });
                    // 为部分文章创建示例评论
                    if (['react-hooks-overview', 'deploy-next-on-vercel', 'web-performance-basics'].includes(a.slug)) {
                        await strapi.entityService.create('api::comment.comment', {
                            data: {
                                article: { id: created.id },
                                authorName: 'Alice',
                                authorLink: 'https://example.com',
                                content: '很实用的内容，受益匪浅！',
                                status: 'approved',
                                sourceSite: { id: a.site.id },
                            },
                        });
                    }
                }
            }
            // 统一从 Tag 的 owning 侧写入文章关系
            const tagToArticleSlugs = {
                intro: ['hello-world', 'nextjs-first-steps', 'strapi-quick-start'],
                react: ['react-hooks-overview', 'web-performance-basics'],
                nextjs: ['deploy-next-on-vercel', 'web-performance-basics'],
                typescript: ['react-hooks-overview', 'typescript-tips'],
                tailwind: ['tailwind-best-practices'],
                strapi: ['strapi-auth-guide'],
            };
            for (const [tagSlug, articleSlugs] of Object.entries(tagToArticleSlugs)) {
                const tagRecord = (_k = (await strapi.entityService.findMany('api::tag.tag', {
                    filters: { slug: tagSlug },
                    limit: 1,
                }))) === null || _k === void 0 ? void 0 : _k[0];
                if (!tagRecord)
                    continue;
                const articleIds = [];
                const articleDocIds = [];
                for (const s of articleSlugs) {
                    const art = (_l = (await strapi.entityService.findMany('api::article.article', {
                        filters: { slug: s },
                        limit: 1,
                    }))) === null || _l === void 0 ? void 0 : _l[0];
                    if (art) {
                        articleIds.push(Number(art.id));
                        if (art.documentId)
                            articleDocIds.push(String(art.documentId));
                    }
                }
                if (articleIds.length || articleDocIds.length) {
                    try {
                        // 优先使用 documents API，利用 documentId 与 set 长手写法
                        await strapi.documents('api::tag.tag').update({
                            documentId: tagRecord.documentId,
                            data: { articles: { set: articleDocIds.length ? articleDocIds : articleIds } },
                        });
                    }
                    catch (e) {
                        // 回退到 entityService：直接使用 ID 数组
                        await strapi.entityService.update('api::tag.tag', tagRecord.id, {
                            data: { articles: articleIds },
                        });
                    }
                }
            }
        }
        catch (err) {
            strapi.log.warn('Failed to seed initial data');
        }
    },
};
