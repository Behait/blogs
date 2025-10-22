import type { Core } from '@strapi/strapi';
import fs from 'fs';
import path from 'path';

export default ({ strapi }: { strapi: Core.Strapi }) => {
  // 鉴权与 IP 白名单
  const getClientIp = (ctx: any) => {
    const xf = ctx.request.headers['x-forwarded-for'];
    const forwarded = Array.isArray(xf) ? xf[0] : xf;
    const ip = (forwarded ? String(forwarded).split(',')[0].trim() : '') || ctx.request.ip || ctx.ip;
    return ip;
  };
  const isIpAllowed = (ip: string) => {
    const raw = process.env.INTERNAL_ALLOWED_IPS || '';
    const allow = raw.split(',').map(s => s.trim()).filter(Boolean);
    if (!allow.length) return true;
    return allow.includes(ip);
  };
  const getAuthToken = (ctx: any) => {
    const auth = ctx.request.headers['authorization'];
    if (typeof auth === 'string' && auth.startsWith('Bearer ')) return auth.slice(7);
    const tokenHeader = ctx.request.headers['x-admin-token'] || ctx.request.headers['X-Admin-Token'];
    return Array.isArray(tokenHeader) ? tokenHeader[0] : tokenHeader;
  };
  const ensureAuthorized = (ctx: any) => {
    const expected = process.env.INTERNAL_ADMIN_TOKEN || '';
    const token = getAuthToken(ctx);
    const ip = getClientIp(ctx);
    if (!expected || !token || token !== expected || !isIpAllowed(ip)) {
      ctx.status = 401;
      ctx.body = { error: 'Unauthorized' };
      return false;
    }
    return true;
  };

  return {
    async autoTag(ctx) {
      if (!ensureAuthorized(ctx)) return;

      const siteDomain = String(ctx.query.site || ctx.request.body?.site || '') || undefined;
      const dryRun = String(ctx.query.dry || ctx.request.body?.dry || '').toLowerCase() === 'true';
      const limitRaw = ctx.query.limit || ctx.request.body?.limit;
      const minScoreRaw = ctx.query.minScore || ctx.request.body?.minScore;
      const mapPath = (ctx.query.mapPath || ctx.request.body?.mapPath) ? String(ctx.query.mapPath || ctx.request.body?.mapPath) : undefined;

      const limit = limitRaw ? Number(limitRaw) : undefined;
      const minScore = minScoreRaw ? Number(minScoreRaw) : undefined;

      try {
        const res = await (strapi.service('api::internal.internal') as any).autoTag({ siteDomain, dryRun, limit, minScore, mapPath });
        ctx.body = { ok: true, ...res };
      } catch (e) {
        ctx.status = 500;
        ctx.body = { ok: false, error: (e as any)?.message || e };
      }
    },

    async aiGenerate(ctx) {
      if (!ensureAuthorized(ctx)) return;

      const siteDomain = String(ctx.request.body?.siteDomain || ctx.query?.siteDomain || '');
      const category = String(ctx.request.body?.category || ctx.query?.category || 'general');
      const tags = Array.isArray(ctx.request.body?.tags) ? ctx.request.body.tags.map(String).filter(Boolean) : (typeof ctx.query?.tags === 'string' ? String(ctx.query?.tags).split(',').map(s => s.trim()).filter(Boolean) : []);
      const publish = ['true', '1', 'yes'].includes(String(ctx.request.body?.publish || ctx.query?.publish || 'false'));

      let topics: string[] = [];
      const filePath = String(ctx.request.body?.file || ctx.query?.file || '');
      if (filePath) {
        try {
          const abs = path.resolve(process.cwd(), filePath);
          const text = fs.readFileSync(abs, 'utf8');
          topics = text.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
        } catch (e) {
          ctx.status = 400;
          ctx.body = { error: `Failed to read file: ${filePath}`, detail: String((e as any)?.message || e) };
          return;
        }
      } else {
        topics = Array.isArray(ctx.request.body?.topics) ? ctx.request.body.topics.map(String).filter(Boolean) : [];
      }

      if (!topics.length) {
        ctx.status = 400;
        ctx.body = { error: 'No topics provided' };
        return;
      }

      const service = (strapi as any).service('api::internal.internal');
      const res = await service.aiGenerate({ topics, categorySlug: category, tagSlugs: tags, siteDomain, publish });

      ctx.body = res;
    },
  };
};