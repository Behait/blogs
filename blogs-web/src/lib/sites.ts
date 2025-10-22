/**
 * 站点域名与站点ID映射工具
 * - 从 NEXT_PUBLIC_SITE_URL 解析当前域名
 * - 从 NEXT_PUBLIC_SITE_MAP(JSON) 映射域名 -> 站点ID
 * - 如 CURRENT_SITE_ID 未设置则按映射填充，确保 fetchArticles 的站点过滤可用
 */

export function getCurrentDomain(): string | null {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) return null;
  return siteUrl.replace(/^https?:\/\//, '');
}

export function getMappedSiteId(domain?: string | null): string | null {
  try {
    const raw = process.env.NEXT_PUBLIC_SITE_MAP;
    if (!raw) return null;
    const map = JSON.parse(raw);
    const d = (domain || getCurrentDomain() || '').toLowerCase();
    const id = map?.[d];
    return id ? String(id) : null;
  } catch {
    return null;
  }
}

export function getCurrentSiteId(): string | null {
  const envId = process.env.CURRENT_SITE_ID;
  if (envId) return String(envId);
  const mapped = getMappedSiteId();
  return mapped || null;
}

export function ensureCurrentSiteIdFromDomain(): string | null {
  const id = getCurrentSiteId();
  if (id && !process.env.CURRENT_SITE_ID) {
    process.env.CURRENT_SITE_ID = id;
  }
  return id;
}