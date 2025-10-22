import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::distribution-record.distribution-record', ({ strapi }) => ({
  async find(ctx) {
    const { query } = ctx;
    
    const records = await strapi.entityService.findMany('api::distribution-record.distribution-record', {
      ...query,
      populate: {
        article: {
          populate: {
            category: true,
            tags: true,
          },
        },
        distributionRule: true,
      },
    });

    return records;
  },

  async findOne(ctx) {
    const { id } = ctx.params;
    
    const record = await strapi.entityService.findOne('api::distribution-record.distribution-record', id, {
      populate: {
        article: {
          populate: {
            category: true,
            tags: true,
            author: true,
          },
        },
        distributionRule: true,
      },
    });

    return record;
  },

  async create(ctx) {
    const { data } = ctx.request.body;

    // 验证必需字段
    if (!data.article || !data.targetSite) {
      return ctx.badRequest('Article and target site are required');
    }

    // 检查是否已存在相同的分发记录
    const existingRecord = await strapi.entityService.findMany('api::distribution-record.distribution-record', {
      filters: {
        article: data.article,
        targetSite: data.targetSite,
        status: {
          $in: ['pending', 'success'],
        },
      },
    });

    if (existingRecord.length > 0) {
      return ctx.badRequest('Distribution record already exists for this article and target site');
    }

    const record = await strapi.entityService.create('api::distribution-record.distribution-record', {
      data: {
        ...data,
        distributedAt: data.status === 'success' ? new Date() : null,
      },
      populate: {
        article: true,
        distributionRule: true,
      },
    });

    return record;
  },

  async update(ctx) {
    const { id } = ctx.params;
    const { data } = ctx.request.body;

    // 如果状态更新为成功，设置分发时间
    if (data.status === 'success' && !data.distributedAt) {
      data.distributedAt = new Date();
    }

    const record = await strapi.entityService.update('api::distribution-record.distribution-record', id, {
      data,
      populate: {
        article: true,
        distributionRule: true,
      },
    });

    return record;
  },

  async delete(ctx) {
    const { id } = ctx.params;

    const record = await strapi.entityService.delete('api::distribution-record.distribution-record', id);
    return record;
  },

  async findByArticle(ctx) {
    const { articleId } = ctx.params;
    const { query } = ctx;

    const records = await strapi.entityService.findMany('api::distribution-record.distribution-record', {
      ...query,
      filters: {
        article: articleId,
        ...((query as any)?.filters || {}),
      },
      populate: {
        distributionRule: true,
      },
    });

    return records;
  },

  async findBySite(ctx) {
    const { siteId } = ctx.params;
    const { query } = ctx;

    const records = await strapi.entityService.findMany('api::distribution-record.distribution-record', {
      ...query,
      filters: {
        targetSite: siteId,
        ...((query as any)?.filters || {}),
      },
      populate: {
        article: {
          populate: {
            category: true,
            tags: true,
          },
        },
        distributionRule: true,
      },
    });

    return records;
  },

  async retry(ctx) {
    const { id } = ctx.params;

    try {
      const record = await strapi.entityService.findOne('api::distribution-record.distribution-record', id, {
        populate: {
          article: true,
          distributionRule: true,
        },
      });

      if (!record) {
        return ctx.notFound('Distribution record not found');
      }

      if (record.status === 'success') {
        return ctx.badRequest('Cannot retry successful distribution');
      }

      // 更新重试计数和状态
      const updatedRecord = await strapi.entityService.update('api::distribution-record.distribution-record', id, {
        data: {
          status: 'pending',
          retryCount: (record.retryCount || 0) + 1,
          lastRetryAt: new Date(),
          errorMessage: null,
        },
      });

      // 异步执行重试分发
      setImmediate(async () => {
        try {
          if ((record as any).distributionRule) {
            const distributionService = strapi.service('api::content-distribution.content-distribution');
            await distributionService.distributeToSite(
              (record as any).article,
              record.targetSite,
              (record as any).distributionRule.id
            );

            // 更新为成功状态
            await strapi.entityService.update('api::distribution-record.distribution-record', id, {
              data: {
                status: 'success',
                distributedAt: new Date(),
                errorMessage: null,
              },
            });
          }
        } catch (error) {
          // 更新为失败状态
          await strapi.entityService.update('api::distribution-record.distribution-record', id, {
            data: {
              status: 'failed',
              errorMessage: error.message,
            },
          });
        }
      });

      return { message: 'Retry initiated', record: updatedRecord };

    } catch (error) {
      console.error('Error retrying distribution:', error);
      return ctx.internalServerError('Failed to retry distribution');
    }
  },
}));