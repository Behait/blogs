import DistributionScheduler from './lib/scheduler';
import ensureIndexes from './lib/indexer';
 
 let scheduler: DistributionScheduler;
 
 export default async ({ strapi }) => {
   console.log('🚀 Starting application bootstrap...');
 
   try {
     // 延迟初始化，确保所有服务都已加载
     setTimeout(async () => {
       try {
         // 创建默认站点模板
         const siteTemplateService = strapi.service('api::site-template.site-template');
         await siteTemplateService.createDefaultTemplates();
 
         // 创建默认内容分发规则
         const distributionService = strapi.service('api::content-distribution.content-distribution');
         await distributionService.createDefaultRules();
 
        // 确保常用数据库索引存在
        await ensureIndexes(strapi);

         // 初始化分发调度器
         scheduler = new DistributionScheduler(strapi);
         await scheduler.initialize();
 
         // 将调度器实例保存到 strapi 实例中，以便其他地方使用
         strapi.scheduler = scheduler;
 
         console.log('✅ Application bootstrap completed successfully');
       } catch (error) {
         console.error('❌ Error during delayed bootstrap:', error);
       }
     }, 5000); // 延迟 5 秒执行
 
     console.log('✅ Bootstrap initialization scheduled');
 
   } catch (error) {
     console.error('❌ Error during application bootstrap:', error);
   }
 };
 
 // 优雅关闭处理
 process.on('SIGINT', async () => {
   console.log('📡 Received SIGINT, shutting down gracefully...');
   if (scheduler) {
     await scheduler.shutdown();
   }
   process.exit(0);
 });
 
 process.on('SIGTERM', async () => {
   console.log('📡 Received SIGTERM, shutting down gracefully...');
   if (scheduler) {
     await scheduler.shutdown();
   }
   process.exit(0);
 });