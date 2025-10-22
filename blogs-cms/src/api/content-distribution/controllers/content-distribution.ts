import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::content-distribution.content-distribution', ({ strapi }) => ({
  async find(ctx) {
    const { query } = ctx;
    
    const entity = await strapi.entityService.findMany('api::content-distribution.content-distribution', {
      ...query,
    });

    const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
    return this.transformResponse(sanitizedEntity);
  },

  async findOne(ctx) {
    const { id } = ctx.params;
    const { query } = ctx;

    const entity = await strapi.entityService.findOne('api::content-distribution.content-distribution', id, {
      ...query,
    });

    const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
    return this.transformResponse(sanitizedEntity);
  },

  async create(ctx) {
    const { data } = ctx.request.body;

    // 验证分发规则名称唯一性
    const existingRule = await strapi.entityService.findMany('api::content-distribution.content-distribution', {
      filters: { name: data.name },
    });

    if (existingRule.length > 0) {
      return ctx.badRequest('Distribution rule name already exists');
    }

    // 验证源分类和目标站点
    if (!data.sourceCategories || !Array.isArray(data.sourceCategories) || data.sourceCategories.length === 0) {
      return ctx.badRequest('Source categories are required');
    }

    if (!data.targetSites || !Array.isArray(data.targetSites) || data.targetSites.length === 0) {
      return ctx.badRequest('Target sites are required');
    }

    // 设置默认值
    const ruleData = {
      ...data,
      lastRunStatus: 'pending',
      statistics: {
        totalRuns: 0,
        successfulRuns: 0,
        failedRuns: 0,
        lastSuccessfulRun: null,
        totalArticlesDistributed: 0,
      },
    };

    const entity = await strapi.entityService.create('api::content-distribution.content-distribution', {
      data: ruleData,
    });

    const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
    return this.transformResponse(sanitizedEntity);
  },

  async update(ctx) {
    const { id } = ctx.params;
    const { data } = ctx.request.body;

    // 如果更新名称，检查唯一性
    if (data.name) {
      const existingRule = await strapi.entityService.findMany('api::content-distribution.content-distribution', {
        filters: { 
          name: data.name,
          id: { $ne: id },
        },
      });

      if (existingRule.length > 0) {
        return ctx.badRequest('Distribution rule name already exists');
      }
    }

    const entity = await strapi.entityService.update('api::content-distribution.content-distribution', id, {
      data,
    });

    const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
    return this.transformResponse(sanitizedEntity);
  },

  async delete(ctx) {
    const { id } = ctx.params;

    // 检查是否有正在运行的分发任务
    const rule = await strapi.entityService.findOne('api::content-distribution.content-distribution', id);
    
    if (rule && rule.lastRunStatus === 'running') {
      return ctx.badRequest('Cannot delete distribution rule while it is running');
    }

    const entity = await strapi.entityService.delete('api::content-distribution.content-distribution', id);
    const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
    return this.transformResponse(sanitizedEntity);
  },

  async findActive(ctx) {
    const { query } = ctx;
    
    const entity = await strapi.entityService.findMany('api::content-distribution.content-distribution', {
      ...query,
      filters: {
        isActive: true,
      },
    });

    const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
    return this.transformResponse(sanitizedEntity);
  },

  async runDistribution(ctx) {
    const { id } = ctx.params;
    
    try {
      const rule = await strapi.entityService.findOne('api::content-distribution.content-distribution', id);
      
      if (!rule) {
        return ctx.notFound('Distribution rule not found');
      }

      if (!rule.isActive) {
        return ctx.badRequest('Distribution rule is not active');
      }

      if (rule.lastRunStatus === 'running') {
        return ctx.badRequest('Distribution rule is already running');
      }

      // 更新状态为运行中
      await strapi.entityService.update('api::content-distribution.content-distribution', id, {
        data: {
          lastRunStatus: 'running',
          lastRun: new Date(),
        },
      });

      // 异步执行分发任务
      setImmediate(async () => {
        try {
          const distributionService = strapi.service('api::content-distribution.content-distribution');
          await distributionService.executeDistribution(id);
        } catch (error) {
          console.error('Distribution execution error:', error);
          
          // 更新状态为失败
          await strapi.entityService.update('api::content-distribution.content-distribution', id, {
            data: {
              lastRunStatus: 'error',
              errorMessage: error.message,
            },
          });
        }
      });

      return ctx.send({
        message: 'Distribution started successfully',
        status: 'running',
      });
    } catch (error) {
      console.error('Error starting distribution:', error);
      return ctx.internalServerError('Failed to start distribution');
    }
  },

  async getStatus(ctx) {
    const { id } = ctx.params;
    const { query } = ctx;
    
    const rule = await strapi.entityService.findOne('api::content-distribution.content-distribution', id, {
      ...query,
    });

    if (!rule) {
      return ctx.notFound('Distribution rule not found');
    }

    const sanitizedEntity = await this.sanitizeOutput(rule, ctx);
    return this.transformResponse(sanitizedEntity);
  },
}));