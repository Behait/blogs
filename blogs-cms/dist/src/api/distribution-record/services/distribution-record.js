"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const strapi_1 = require("@strapi/strapi");
exports.default = strapi_1.factories.createCoreService('api::distribution-record.distribution-record', ({ strapi }) => ({
    async createRecord(articleId, ruleId, targetSite, status, errorMessage, transformedData) {
        try {
            const record = await strapi.entityService.create('api::distribution-record.distribution-record', {
                data: {
                    article: articleId,
                    distributionRule: ruleId,
                    targetSite,
                    status,
                    errorMessage,
                    transformedData,
                    distributedAt: status === 'success' ? new Date() : null,
                    retryCount: 0,
                },
            });
            return record;
        }
        catch (error) {
            console.error('Error creating distribution record:', error);
            throw error;
        }
    },
    async updateRecord(recordId, updates) {
        try {
            const record = await strapi.entityService.update('api::distribution-record.distribution-record', recordId, {
                data: {
                    ...updates,
                    distributedAt: updates.status === 'success' ? new Date() : undefined,
                },
            });
            return record;
        }
        catch (error) {
            console.error('Error updating distribution record:', error);
            throw error;
        }
    },
    async getRecordsByArticle(articleId) {
        return await strapi.entityService.findMany('api::distribution-record.distribution-record', {
            filters: { article: articleId },
            populate: {
                distributionRule: true,
            },
        });
    },
    async getRecordsBySite(targetSite, limit) {
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
    async getFailedRecords(limit) {
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
    async getPendingRecords(limit) {
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
    async getDistributionStats(targetSite, ruleId) {
        const filters = {};
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
    async checkIfDistributed(articleId, targetSites) {
        const records = await strapi.entityService.findMany('api::distribution-record.distribution-record', {
            filters: {
                article: articleId,
                targetSite: { $in: targetSites },
                status: { $in: ['success', 'pending'] },
            },
        });
        return records.map(record => record.targetSite);
    },
    async cleanupOldRecords(daysOld = 30) {
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
        }
        catch (error) {
            console.error('Error cleaning up old records:', error);
            throw error;
        }
    },
    async retryFailedRecords(maxRetries = 3) {
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
                if (record.distributionRule && record.article) {
                    const distributionService = strapi.service('api::content-distribution.content-distribution');
                    await distributionService.distributeToSite(record.article, record.targetSite, record.distributionRule.id);
                    await this.updateRecord(record.id, {
                        status: 'success',
                        errorMessage: null,
                    });
                    results.successful++;
                }
            }
            catch (error) {
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
