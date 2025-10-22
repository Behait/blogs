"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const strapi_1 = require("@strapi/strapi");
exports.default = strapi_1.factories.createCoreController('api::site-template.site-template', ({ strapi }) => ({
    async find(ctx) {
        const { query } = ctx;
        // 添加默认排序
        const sanitizedQuery = await this.sanitizeQuery(ctx);
        const { results, pagination } = await strapi.entityService.findPage('api::site-template.site-template', {
            ...sanitizedQuery,
            sort: { createdAt: 'desc' },
        });
        const sanitizedResults = await this.sanitizeOutput(results, ctx);
        return this.transformResponse(sanitizedResults, { pagination });
    },
    async findOne(ctx) {
        const { id } = ctx.params;
        const { query } = ctx;
        const sanitizedQuery = await this.sanitizeQuery(ctx);
        const entity = await strapi.entityService.findOne('api::site-template.site-template', id, sanitizedQuery);
        return this.sanitizeOutput(entity, ctx);
    },
    async create(ctx) {
        const { data } = ctx.request.body;
        // 验证模板ID唯一性
        const existingTemplate = await strapi.entityService.findMany('api::site-template.site-template', {
            filters: { templateId: data.templateId },
        });
        if (existingTemplate.length > 0) {
            return ctx.badRequest('Template ID already exists');
        }
        const entity = await strapi.entityService.create('api::site-template.site-template', {
            data,
        });
        return this.sanitizeOutput(entity, ctx);
    },
    async update(ctx) {
        const { id } = ctx.params;
        const { data } = ctx.request.body;
        const entity = await strapi.entityService.update('api::site-template.site-template', id, {
            data,
        });
        return this.sanitizeOutput(entity, ctx);
    },
    async delete(ctx) {
        const { id } = ctx.params;
        // 检查是否有站点正在使用此模板
        const sitesUsingTemplate = await strapi.entityService.findMany('api::site.site', {
            filters: { templateId: ctx.params.templateId },
        });
        if (sitesUsingTemplate.length > 0) {
            return ctx.badRequest('Cannot delete template that is in use by sites');
        }
        const entity = await strapi.entityService.delete('api::site-template.site-template', id);
        return this.sanitizeOutput(entity, ctx);
    },
}));
