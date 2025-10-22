import { withCache, generateCacheKey } from './cache';

export const CMS_URL = process.env.NEXT_PUBLIC_CMS_URL || 'http://localhost:1337';
export const CURRENT_SITE_ID = process.env.CURRENT_SITE_ID || '';

export async function cmsFetch(path: string, opts?: RequestInit) {
  const url = `${CMS_URL}${path}`;
  const res = await fetch(url, { 
    ...opts, 
    next: { revalidate: 3600 },
    // 添加性能优化
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...opts?.headers,
    }
  });
  if (!res.ok) throw new Error(`CMS fetch failed: ${res.status} ${res.statusText}`);
  return res.json();
}

// 使用缓存包装的获取函数
export const fetchArticles = withCache(
  async (params: { page?: number; pageSize?: number; siteFilter?: boolean } = {}) => {
    const { page = 1, pageSize = 10, siteFilter = true } = params;
    
    let query = `populate=*&pagination[page]=${page}&pagination[pageSize]=${pageSize}&sort=publishedAt:desc`;
    
    if (siteFilter && CURRENT_SITE_ID) {
      query += `&filters[site][id][$eq]=${CURRENT_SITE_ID}`;
    }
    
    const data = await cmsFetch(`/api/articles?${query}`);
    
    // 处理返回的数据，确保category和tags是字符串格式
    if (data?.data) {
      data.data = data.data.map((item: any) => ({
        ...item,
        category: item.category?.name || null,
        categorySlug: item.category?.slug || null,
        tags: (item.tags ?? []).map((t: any) => t.name),
        site: item.site?.domain || null,
      }));
    }
    
    return data;
  },
  (params = {}) => generateCacheKey('articles', params),
  300000 // 5分钟缓存
);

export async function fetchArticleBySlug(slug: string) {
  const siteFilter = CURRENT_SITE_ID ? `&filters[site][id][$eq]=${encodeURIComponent(CURRENT_SITE_ID)}` : '';
  const url = `/api/articles?filters[slug][$eq]=${encodeURIComponent(slug)}${siteFilter}&fields=title,slug,summary,content,publishedAt&populate[site][fields]=domain&populate[category][fields]=name,slug&populate[tags][fields]=id,name,slug&populate[comments][fields]=id,content,authorName,authorLink,status&populate[comments][sort]=createdAt:desc`;
  const res = await cmsFetch(url);
  const item = (res?.data ?? [])[0];
  if (!item) return null;
  return {
    id: item.id,
    title: item.title,
    slug: item.slug,
    summary: item.summary,
    content: item.content,
    site: item.site?.domain || null,
    category: item.category?.name || null,
    categorySlug: item.category?.slug || null,
    tags: (item.tags ?? []).map((t: any) => t.name),
    publishedAt: item.publishedAt || null,
    comments: (item.comments ?? []).map((c: any) => ({
      id: c.id,
      content: c.content,
      authorName: c.authorName,
      authorLink: c.authorLink,
      status: c.status,
    })),
  };
}

export function makeArticleUrl(article: { slug: string; site?: string | null }) {
  if (article.site && article.site !== 'localhost:3000') {
    return `https://${article.site}/articles/${article.slug}`;
  }
  // 统一站内链接为 /<slug>
  return `/${article.slug}`;
}

export const fetchCategories = withCache(
  async () => {
    const data = await cmsFetch('/api/categories?populate=*');
    return data.data || [];
  },
  () => 'categories',
  600000 // 10分钟缓存
);

export const fetchTags = withCache(
  async () => {
    const data = await cmsFetch('/api/tags?populate=*');
    return data.data || [];
  },
  () => 'tags',
  600000 // 10分钟缓存
);

function qs(params: Record<string, any>) {
  const esc = encodeURIComponent;
  return Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${esc(k)}=${esc(String(v))}`)
    .join('&');
}

export async function fetchArticlesFiltered({ page = 1, pageSize = 20, search, category, tag }: { page?: number; pageSize?: number; search?: string; category?: string; tag?: string; }) {
  const filters: string[] = [];
  if (CURRENT_SITE_ID) filters.push(`filters[site][id][$eq]=${encodeURIComponent(CURRENT_SITE_ID)}`);
  if (search) filters.push(`filters[$or][0][title][$containsi]=${encodeURIComponent(search)}`, `filters[$or][1][summary][$containsi]=${encodeURIComponent(search)}`);
  if (category) filters.push(`filters[category][slug][$eq]=${encodeURIComponent(category)}`);
  if (tag) filters.push(`filters[tags][slug][$eq]=${encodeURIComponent(tag)}`);
  const query = filters.join('&');
  const url = `/api/articles?fields=title,slug,summary,publishedAt&populate[site][fields]=domain&populate[category][fields]=name,slug&populate[tags][fields]=id,name,slug&sort=publishedAt:desc&pagination[page]=${page}&pagination[pageSize]=${pageSize}${query ? `&${query}` : ''}`;
  const res = await cmsFetch(url);
  const list = res?.data ?? [];
  const meta = res?.meta ?? {};
  return {
    items: list.map((item: any) => ({
      id: item.id,
      title: item.title,
      slug: item.slug,
      summary: item.summary,
      site: item.site?.domain || null,
      category: item.category?.name || null,
      tags: (item.tags ?? []).map((t: any) => t.name),
      publishedAt: item.publishedAt || null,
    })),
    pagination: meta?.pagination ?? { page: 1, pageSize: pageSize, pageCount: 1, total: list.length },
  };
}

export async function fetchRelatedArticles({ slug, categorySlug, limit = 5 }: { slug: string; categorySlug?: string | null; limit?: number; }) {
  const filters: string[] = [];
  if (CURRENT_SITE_ID) filters.push(`filters[site][id][$eq]=${encodeURIComponent(CURRENT_SITE_ID)}`);
  filters.push(`filters[slug][$ne]=${encodeURIComponent(slug)}`);
  if (categorySlug) filters.push(`filters[category][slug][$eq]=${encodeURIComponent(categorySlug)}`);
  const query = filters.join('&');
  const url = `/api/articles?fields=id,title,slug,summary,publishedAt&populate[site][fields]=domain&populate[category][fields]=name,slug&sort=publishedAt:desc&pagination[pageSize]=${limit}${query ? `&${query}` : ''}`;
  const res = await cmsFetch(url);
  const list = res?.data ?? [];
  return list.map((item: any) => ({
    id: item.id,
    title: item.title,
    slug: item.slug,
    summary: item.summary,
    site: item.site?.domain || null,
    category: item.category?.name || null,
    tags: (item.tags ?? []).map((t: any) => t.name),
    publishedAt: item.publishedAt || null,
  }));
}