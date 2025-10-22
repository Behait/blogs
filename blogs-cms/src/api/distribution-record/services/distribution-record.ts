import { factories } from '@strapi/strapi';

export default factories.createCoreService('api::distribution-record.distribution-record', ({ strapi }) => ({
  async createRecord(articleId: string | number, ruleId: string | number, targetSite: string, status: 'success' | 'pending' | 'failed' | 'cancelled', errorMessage?: string, transformedData?: any) {
    try {
      const record = await strapi.entityService.create('api::distribution-record.distribution-record', {
        data: {
          article: articleId as any,
          distributionRule: ruleId as any,
          targetSite,
          status,
          errorMessage,
          transformedData,
          distributedAt: status === 'success' ? new Date() : null,
          retryCount: 0,
        },
      });

      return record;
    } catch (error) {
      console.error('Error creating distribution record:', error);
      throw error;
    }
  },

  async updateRecord(recordId: string | number, updates: any) {
    try {
      const record = await strapi.entityService.update('api::distribution-record.distribution-record', recordId, {
        data: {
          ...updates,
          distributedAt: updates.status === 'success' ? new Date() : undefined,
        },
      });

      return record;
    } catch (error) {
      console.error('Error updating distribution record:', error);
      throw error;
    }
  },

  async getRecordsByArticle(articleId: string | number) {
    return await strapi.entityService.findMany('api::distribution-record.distribution-record', {
      filters: { article: articleId as any },
      populate: {
        distributionRule: true,
      },
    });
  },

  async getRecordsBySite(targetSite: string, limit?: number) {
    return await strapi.entityService.findMany('api::distribution-record.distribution-record', {
      filters: { targetSite },
      populate: {
        article: {
          populate: {
            category: true,
            tags: true,
          },
        },
        distributionRule: true,
      },
      sort: { createdAt: 'desc' },
      limit: limit || 50,
    });
  },

  async getFailedRecords(limit?: number) {
    return await strapi.entityService.findMany('api::distribution-record.distribution-record', {
      filters: { status: 'failed' },
      populate: {
        article: {
          populate: {
            category: true,
            tags: true,
          },
        },
        distributionRule: true,
      },
      sort: { createdAt: 'desc' },
      limit: limit || 20,
    });
  },

  async getPendingRecords(limit?: number) {
    return await strapi.entityService.findMany('api::distribution-record.distribution-record', {
      filters: { status: 'pending' },
      populate: {
        article: {
          populate: {
            category: true,
            tags: true,
          },
        },
        distributionRule: true,
      },
      sort: { createdAt: 'asc' },
      limit: limit || 50,
    });
  },

  async getDistributionStats(targetSite?: string, ruleId?: number) {
    const filters: any = {};
    
    if (targetSite) {
      filters.targetSite = targetSite;
    }
    
    if (ruleId) {
      filters.distributionRule = ruleId;
    }

    const [total, successful, failed, pending] = await Promise.all([
      strapi.entityService.count('api::distribution-record.distribution-record', { filters }),
      strapi.entityService.count('api::distribution-record.distribution-record', { 
        filters: { ...filters, status: 'success' } 
      }),
      strapi.entityService.count('api::distribution-record.distribution-record', { 
        filters: { ...filters, status: 'failed' } 
      }),
      strapi.entityService.count('api::distribution-record.distribution-record', { 
        filters: { ...filters, status: 'pending' } 
      }),
    ]);

    return {
      total,
      successful,
      failed,
      pending,
      successRate: total > 0 ? (successful / total * 100).toFixed(2) : '0.00',
    };
  },

  async checkIfDistributed(articleId: string | number, targetSites: string[]) {
    const records = await strapi.entityService.findMany('api::distribution-record.distribution-record', {
      filters: {
        article: articleId as any,
        targetSite: { $in: targetSites },
        status: { $in: ['success', 'pending'] },
      },
    });

    return records.map(record => record.targetSite);
  },

  async cleanupOldRecords(daysOld: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    try {
      const oldRecords = await strapi.entityService.findMany('api::distribution-record.distribution-record', {
        filters: {
          createdAt: { $lt: cutoffDate },
          status: { $in: ['success', 'failed'] },
        },
      });

      for (const record of oldRecords) {
        await strapi.entityService.delete('api::distribution-record.distribution-record', record.id);
      }

      console.log(`Cleaned up ${oldRecords.length} old distribution records`);
      return oldRecords.length;

    } catch (error) {
      console.error('Error cleaning up old records:', error);
      throw error;
    }
  },

  async retryFailedRecords(maxRetries: number = 3) {
    const failedRecords = await strapi.entityService.findMany('api::distribution-record.distribution-record', {
      filters: {
        status: 'failed',
        retryCount: { $lt: maxRetries },
      },
      populate: {
        article: true,
        distributionRule: true,
      },
    });

    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
    };

    for (const record of failedRecords) {
      try {
        results.processed++;

        // 更新重试状态
        await this.updateRecord(record.id, {
          status: 'pending',
          retryCount: (record.retryCount || 0) + 1,
          lastRetryAt: new Date(),
          errorMessage: null,
        });

        // 执行重试分发
        if ((record as any).distributionRule && (record as any).article) {
          const distributionService = strapi.service('api::content-distribution.content-distribution');
          await distributionService.distributeToSite(
            (record as any).article,
            record.targetSite,
            ((record as any).distributionRule as any).id
          );

          await this.updateRecord(record.id, {
            status: 'success',
            errorMessage: null,
          });

          results.successful++;
        }

      } catch (error) {
        await this.updateRecord(record.id, {
          status: 'failed',
          errorMessage: error.message,
        });

        results.failed++;
      }
    }

    return results;
  },
}));