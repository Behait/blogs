"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
exports.default = ({ strapi }) => {
    // 鉴权与 IP 白名单
    const getClientIp = (ctx) => {
        const xf = ctx.request.headers['x-forwarded-for'];
        const forwarded = Array.isArray(xf) ? xf[0] : xf;
        const ip = (forwarded ? String(forwarded).split(',')[0].trim() : '') || ctx.request.ip || ctx.ip;
        return ip;
    };
    const isIpAllowed = (ip) => {
        const raw = process.env.INTERNAL_ALLOWED_IPS || '';
        const allow = raw.split(',').map(s => s.trim()).filter(Boolean);
        if (!allow.length)
            return true;
        return allow.includes(ip);
    };
    const getAuthToken = (ctx) => {
        const auth = ctx.request.headers['authorization'];
        if (typeof auth === 'string' && auth.startsWith('Bearer '))
            return auth.slice(7);
        const tokenHeader = ctx.request.headers['x-admin-token'] || ctx.request.headers['X-Admin-Token'];
        return Array.isArray(tokenHeader) ? tokenHeader[0] : tokenHeader;
    };
    const ensureAuthorized = (ctx) => {
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
            var _a, _b, _c, _d, _e, _f;
            if (!ensureAuthorized(ctx))
                return;
            const siteDomain = String(ctx.query.site || ((_a = ctx.request.body) === null || _a === void 0 ? void 0 : _a.site) || '') || undefined;
            const dryRun = String(ctx.query.dry || ((_b = ctx.request.body) === null || _b === void 0 ? void 0 : _b.dry) || '').toLowerCase() === 'true';
            const limitRaw = ctx.query.limit || ((_c = ctx.request.body) === null || _c === void 0 ? void 0 : _c.limit);
            const minScoreRaw = ctx.query.minScore || ((_d = ctx.request.body) === null || _d === void 0 ? void 0 : _d.minScore);
            const mapPath = (ctx.query.mapPath || ((_e = ctx.request.body) === null || _e === void 0 ? void 0 : _e.mapPath)) ? String(ctx.query.mapPath || ((_f = ctx.request.body) === null || _f === void 0 ? void 0 : _f.mapPath)) : undefined;
            const limit = limitRaw ? Number(limitRaw) : undefined;
            const minScore = minScoreRaw ? Number(minScoreRaw) : undefined;
            try {
                const res = await strapi.service('api::internal.internal').autoTag({ siteDomain, dryRun, limit, minScore, mapPath });
                ctx.body = { ok: true, ...res };
            }
            catch (e) {
                ctx.status = 500;
                ctx.body = { ok: false, error: (e === null || e === void 0 ? void 0 : e.message) || e };
            }
        },
        async aiGenerate(ctx) {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
            if (!ensureAuthorized(ctx))
                return;
            const siteDomain = String(((_a = ctx.request.body) === null || _a === void 0 ? void 0 : _a.siteDomain) || ((_b = ctx.query) === null || _b === void 0 ? void 0 : _b.siteDomain) || '');
            const category = String(((_c = ctx.request.body) === null || _c === void 0 ? void 0 : _c.category) || ((_d = ctx.query) === null || _d === void 0 ? void 0 : _d.category) || 'general');
            const tags = Array.isArray((_e = ctx.request.body) === null || _e === void 0 ? void 0 : _e.tags) ? ctx.request.body.tags.map(String).filter(Boolean) : (typeof ((_f = ctx.query) === null || _f === void 0 ? void 0 : _f.tags) === 'string' ? String((_g = ctx.query) === null || _g === void 0 ? void 0 : _g.tags).split(',').map(s => s.trim()).filter(Boolean) : []);
            const publish = ['true', '1', 'yes'].includes(String(((_h = ctx.request.body) === null || _h === void 0 ? void 0 : _h.publish) || ((_j = ctx.query) === null || _j === void 0 ? void 0 : _j.publish) || 'false'));
            let topics = [];
            const filePath = String(((_k = ctx.request.body) === null || _k === void 0 ? void 0 : _k.file) || ((_l = ctx.query) === null || _l === void 0 ? void 0 : _l.file) || '');
            if (filePath) {
                try {
                    const abs = path_1.default.resolve(process.cwd(), filePath);
                    const text = fs_1.default.readFileSync(abs, 'utf8');
                    topics = text.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
                }
                catch (e) {
                    ctx.status = 400;
                    ctx.body = { error: `Failed to read file: ${filePath}`, detail: String((e === null || e === void 0 ? void 0 : e.message) || e) };
                    return;
                }
            }
            else {
                topics = Array.isArray((_m = ctx.request.body) === null || _m === void 0 ? void 0 : _m.topics) ? ctx.request.body.topics.map(String).filter(Boolean) : [];
            }
            if (!topics.length) {
                ctx.status = 400;
                ctx.body = { error: 'No topics provided' };
                return;
            }
            const service = strapi.service('api::internal.internal');
            const res = await service.aiGenerate({ topics, categorySlug: category, tagSlugs: tags, siteDomain, publish });
            ctx.body = res;
        },
    };
};
