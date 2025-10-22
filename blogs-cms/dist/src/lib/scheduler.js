"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const cron = __importStar(require("node-cron"));
class DistributionScheduler {
    constructor(strapi) {
        this.jobs = new Map();
        this.strapi = strapi;
    }
    async initialize() {
        console.log('🚀 Initializing Distribution Scheduler...');
        // 启动主调度任务 - 每分钟检查一次
        this.scheduleMainTask();
        // 启动清理任务 - 每天凌晨2点执行
        this.scheduleCleanupTask();
        // 启动重试任务 - 每小时执行一次
        this.scheduleRetryTask();
        // 启动百度主动推送任务（仅当配置了 BAIDU_SITE 与 BAIDU_TOKEN）
        this.scheduleBaiduPushTask();
        console.log('✅ Distribution Scheduler initialized successfully');
    }
    scheduleMainTask() {
        const task = cron.schedule('* * * * *', async () => {
            try {
                const distributionService = this.strapi.service('api::content-distribution.content-distribution');
                await distributionService.scheduleDistributions();
            }
            catch (error) {
                console.error('❌ Error in main distribution task:', error);
            }
        }, {
            timezone: 'Asia/Shanghai'
        });
        this.jobs.set('main-distribution', task);
        task.start();
        console.log('📅 Main distribution task scheduled (every minute)');
    }
    scheduleCleanupTask() {
        const task = cron.schedule('0 2 * * *', async () => {
            try {
                console.log('🧹 Starting cleanup task...');
                const recordService = this.strapi.service('api::distribution-record.distribution-record');
                const cleaned = await recordService.cleanupOldRecords(30);
                console.log(`✅ Cleanup completed: ${cleaned} old records removed`);
            }
            catch (error) {
                console.error('❌ Error in cleanup task:', error);
            }
        }, {
            timezone: 'Asia/Shanghai'
        });
        this.jobs.set('cleanup', task);
        task.start();
        console.log('🧹 Cleanup task scheduled (daily at 2:00 AM)');
    }
    scheduleRetryTask() {
        const task = cron.schedule('0 * * * *', async () => {
            try {
                console.log('🔄 Starting retry task...');
                const recordService = this.strapi.service('api::distribution-record.distribution-record');
                const results = await recordService.retryFailedRecords(3);
                console.log(`✅ Retry completed: ${results.successful}/${results.processed} successful`);
            }
            catch (error) {
                console.error('❌ Error in retry task:', error);
            }
        }, {
            timezone: 'Asia/Shanghai'
        });
        this.jobs.set('retry', task);
        task.start();
        console.log('🔄 Retry task scheduled (hourly)');
    }
    scheduleBaiduPushTask() {
        const site = process.env.BAIDU_SITE;
        const token = process.env.BAIDU_TOKEN;
        if (!site || !token) {
            console.log('🔕 Baidu push disabled: BAIDU_SITE/BAIDU_TOKEN not set');
            return;
        }
        const expression = process.env.BAIDU_PUSH_CRON || '0 3 * * *'; // 默认每天 3:00 执行
        const recentHours = Number(process.env.BAIDU_PUSH_RECENT_HOURS || '24');
        const task = cron.schedule(expression, async () => {
            try {
                console.log('📣 Starting Baidu push task...');
                const baidu = await Promise.resolve().then(() => __importStar(require('./baidu')));
                const urls = await baidu.collectRecentArticleUrls(this.strapi, recentHours);
                if (!urls.length) {
                    console.log('ℹ️ Baidu push: no recent URLs to submit');
                    return;
                }
                await baidu.pushUrlsToBaidu(urls, site, token, this.strapi.log);
            }
            catch (error) {
                console.error('❌ Error in Baidu push task:', error);
            }
        }, { timezone: 'Asia/Shanghai' });
        this.jobs.set('baidu-push', task);
        task.start();
        console.log(`📣 Baidu push task scheduled with expression: ${expression}`);
    }
    async scheduleCustomRule(ruleId, cronExpression) {
        var _a;
        const jobKey = `rule-${ruleId}`;
        // 停止现有任务
        if (this.jobs.has(jobKey)) {
            (_a = this.jobs.get(jobKey)) === null || _a === void 0 ? void 0 : _a.stop();
            this.jobs.delete(jobKey);
        }
        // 创建新任务
        const task = cron.schedule(cronExpression, async () => {
            try {
                console.log(`🎯 Executing custom rule ${ruleId}...`);
                const distributionService = this.strapi.service('api::content-distribution.content-distribution');
                await distributionService.executeDistribution(ruleId);
                console.log(`✅ Custom rule ${ruleId} executed successfully`);
            }
            catch (error) {
                console.error(`❌ Error executing custom rule ${ruleId}:`, error);
            }
        }, {
            timezone: 'Asia/Shanghai'
        });
        this.jobs.set(jobKey, task);
        task.start();
        console.log(`📅 Custom rule ${ruleId} scheduled with expression: ${cronExpression}`);
    }
    async unscheduleRule(ruleId) {
        var _a;
        const jobKey = `rule-${ruleId}`;
        if (this.jobs.has(jobKey)) {
            (_a = this.jobs.get(jobKey)) === null || _a === void 0 ? void 0 : _a.stop();
            this.jobs.delete(jobKey);
            console.log(`🛑 Custom rule ${ruleId} unscheduled`);
        }
    }
    async updateRuleSchedule(ruleId, cronExpression) {
        await this.unscheduleRule(ruleId);
        await this.scheduleCustomRule(ruleId, cronExpression);
    }
    getActiveJobs() {
        const activeJobs = [];
        for (const [key, task] of this.jobs.entries()) {
            activeJobs.push({
                key,
                running: task.getStatus() === 'scheduled',
            });
        }
        return activeJobs;
    }
    async shutdown() {
        console.log('🛑 Shutting down Distribution Scheduler...');
        for (const [key, task] of this.jobs.entries()) {
            task.stop();
            console.log(`🛑 Stopped job: ${key}`);
        }
        this.jobs.clear();
        console.log('✅ Distribution Scheduler shutdown complete');
    }
    // 将秒转换为 cron 表达式
    static intervalToCron(intervalSeconds) {
        if (intervalSeconds < 60) {
            // 小于1分钟，每分钟执行
            return '* * * * *';
        }
        else if (intervalSeconds < 3600) {
            // 小于1小时，按分钟间隔
            const minutes = Math.floor(intervalSeconds / 60);
            return `*/${minutes} * * * *`;
        }
        else if (intervalSeconds < 86400) {
            // 小于1天，按小时间隔
            const hours = Math.floor(intervalSeconds / 3600);
            return `0 */${hours} * * *`;
        }
        else {
            // 1天或以上，每天执行
            return '0 0 * * *';
        }
    }
    // 验证 cron 表达式
    static validateCronExpression(expression) {
        try {
            cron.validate(expression);
            return true;
        }
        catch {
            return false;
        }
    }
}
exports.default = DistributionScheduler;
