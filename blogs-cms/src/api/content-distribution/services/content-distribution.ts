import { factories } from '@strapi/strapi';

export default factories.createCoreService('api::content-distribution.content-distribution', ({ strapi }) => ({
  async executeDistribution(ruleId: number) {
    try {
      const rule = await strapi.entityService.findOne('api::content-distribution.content-distribution', ruleId);
      
      if (!rule || !rule.isActive) {
        throw new Error('Distribution rule not found or inactive');
      }

      console.log(`Starting distribution for rule: ${rule.name}`);

      // 获取源文章
      const sourceArticles = await this.getSourceArticles(rule);
      console.log(`Found ${sourceArticles.length} articles to distribute`);

      // 执行分发
      const results = await this.distributeArticles(sourceArticles, rule);

      // 更新统计信息
      const statistics = (rule.statistics as any) || {
        totalRuns: 0,
        successfulRuns: 0,
        failedRuns: 0,
        lastSuccessfulRun: null,
        totalArticlesDistributed: 0,
      };

      (statistics as any).totalRuns += 1;
      (statistics as any).successfulRuns += 1;
      (statistics as any).lastSuccessfulRun = new Date();
      (statistics as any).totalArticlesDistributed += results.distributed;

      // 更新规则状态
      await strapi.entityService.update('api::content-distribution.content-distribution', ruleId, {
        data: {
          lastRunStatus: 'success',
          lastRun: new Date(),
          statistics,
          errorMessage: null,
        },
      });

      console.log(`Distribution completed successfully. Distributed ${results.distributed} articles`);
      return results;

    } catch (error) {
      console.error('Distribution execution failed:', error);

      // 更新失败统计
      const rule = await strapi.entityService.findOne('api::content-distribution.content-distribution', ruleId);
      const statistics = (rule.statistics as any) || {
        totalRuns: 0,
        successfulRuns: 0,
        failedRuns: 0,
        lastSuccessfulRun: null,
        totalArticlesDistributed: 0,
      };

      (statistics as any).totalRuns += 1;
      (statistics as any).failedRuns += 1;

      await strapi.entityService.update('api::content-distribution.content-distribution', ruleId, {
        data: {
          lastRunStatus: 'error',
          errorMessage: error.message,
          statistics,
        },
      });

      throw error;
    }
  },

  async getSourceArticles(rule: any) {
    const { sourceCategories, conditions } = rule;
    
    // 构建查询条件
    const filters: any = {};

    // 分类过滤
    if (sourceCategories && sourceCategories.length > 0) {
      filters.category = {
        name: {
          $in: sourceCategories,
        },
      };
    }

    // 额外条件过滤
    if (conditions) {
      if (conditions.publishedAfter) {
        filters.publishedAt = {
          $gte: conditions.publishedAfter,
        };
      }

      if (conditions.tags && conditions.tags.length > 0) {
        filters.tags = {
          name: {
            $in: conditions.tags,
          },
        };
      }

      if (conditions.status) {
        filters.status = conditions.status;
      }
    }

    // 获取文章
    const articles = await strapi.entityService.findMany('api::article.article', {
      filters,
      populate: {
        category: true,
        tags: true,
        author: true,
      },
      sort: { publishedAt: 'desc' },
    });

    return articles;
  },

  async distributeArticles(articles: any[], rule: any) {
    const { targetSites, transformations } = rule;
    let distributed = 0;
    let failed = 0;

    for (const article of articles) {
      try {
        // 检查文章是否已经分发到目标站点
        const alreadyDistributed = await this.checkIfAlreadyDistributed(article.id, targetSites);
        
        if (alreadyDistributed.length === targetSites.length) {
          console.log(`Article ${article.id} already distributed to all target sites`);
          continue;
        }

        // 应用转换规则
        const transformedArticle = this.applyTransformations(article, transformations);

        // 分发到各个目标站点
        for (const siteId of targetSites) {
          if (!alreadyDistributed.includes(siteId)) {
            await this.distributeToSite(transformedArticle, siteId, rule.id);
            distributed++;
          }
        }

      } catch (error) {
        console.error(`Failed to distribute article ${article.id}:`, error);
        failed++;
      }
    }

    return { distributed, failed, total: articles.length };
  },

  async checkIfAlreadyDistributed(articleId: number, targetSites: string[]) {
    const recordService = strapi.service('api::distribution-record.distribution-record');
    return await recordService.checkIfDistributed(articleId, targetSites);
  },

  applyTransformations(article: any, transformations: any) {
    if (!transformations) {
      return article;
    }

    let transformedArticle = { ...article };

    // 标题转换
    if (transformations.titlePrefix) {
      transformedArticle.title = `${transformations.titlePrefix}${article.title}`;
    }

    if (transformations.titleSuffix) {
      transformedArticle.title = `${transformedArticle.title}${transformations.titleSuffix}`;
    }

    // 内容转换
    if (transformations.contentPrefix) {
      transformedArticle.content = `${transformations.contentPrefix}\n\n${article.content}`;
    }

    if (transformations.contentSuffix) {
      transformedArticle.content = `${transformedArticle.content}\n\n${transformations.contentSuffix}`;
    }

    // 标签转换
    if (transformations.addTags && transformations.addTags.length > 0) {
      const existingTags = article.tags || [];
      const newTags = transformations.addTags.filter(tag => 
        !existingTags.some(existingTag => existingTag.name === tag)
      );
      
      transformedArticle.tags = [
        ...existingTags,
        ...newTags.map(name => ({ name }))
      ];
    }

    // SEO 转换
    if (transformations.seoTitle) {
      transformedArticle.seoTitle = transformations.seoTitle.replace('{title}', article.title);
    }

    if (transformations.seoDescription) {
      transformedArticle.seoDescription = transformations.seoDescription.replace('{title}', article.title);
    }

    return transformedArticle;
  },

  async distributeToSite(article: any, siteId: string, ruleId: number) {
    try {
      // 获取目标站点信息
      const site = await strapi.entityService.findMany('api::site.site', {
        filters: { domain: siteId },
      });

      if (!site || site.length === 0) {
        throw new Error(`Target site ${siteId} not found`);
      }

      // 创建分发记录
      await this.createDistributionRecord(article.id, siteId, ruleId, 'success');

      console.log(`Article ${article.id} distributed to site ${siteId}`);
      
      // 这里可以添加实际的分发逻辑，比如：
      // - 调用目标站点的 API
      // - 更新数据库
      // - 发送通知等

    } catch (error) {
      // 创建失败记录
      await this.createDistributionRecord(article.id, siteId, ruleId, 'failed', error.message);
      throw error;
    }
  },

  async createDistributionRecord(articleId: number, siteId: string, ruleId: number, status: string, errorMessage?: string) {
    const recordService = strapi.service('api::distribution-record.distribution-record');
    return await recordService.createRecord(articleId, siteId, ruleId, status, errorMessage);
  },

  async getActiveRules() {
    return await strapi.entityService.findMany('api::content-distribution.content-distribution', {
      filters: { isActive: true },
    });
  },

  async createDefaultRules() {
    const existingRules = await strapi.entityService.findMany('api::content-distribution.content-distribution');
    
    if (existingRules.length > 0) {
      console.log('Distribution rules already exist, skipping default creation');
      return;
    }

    const defaultRules = [
      {
        name: '科技新闻分发',
        description: '将科技和互联网相关文章分发到主站和新闻站',
        sourceCategories: ['科技', '互联网', 'AI'],
        targetSites: ['main.example.com', 'news.example.com'],
        distributionRules: {
          autoDistribute: true,
          requireApproval: false,
        },
        syncInterval: 3600,
        isActive: true,
        priority: 1,
        conditions: {
          publishedAfter: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 最近7天
          status: 'published',
        },
        transformations: {
          titlePrefix: '[科技] ',
          addTags: ['科技新闻', '热点'],
          seoTitle: '{title} - 科技资讯',
          seoDescription: '最新科技资讯：{title}',
        },
        statistics: {
          totalRuns: 0,
          successfulRuns: 0,
          failedRuns: 0,
          lastSuccessfulRun: null,
          totalArticlesDistributed: 0,
        },
      },
      {
        name: '企业资讯分发',
        description: '将企业动态和行业资讯分发到企业站',
        sourceCategories: ['企业动态', '行业资讯', '商业'],
        targetSites: ['corporate.example.com'],
        distributionRules: {
          autoDistribute: false,
          requireApproval: true,
        },
        syncInterval: 7200,
        isActive: true,
        priority: 2,
        conditions: {
          status: 'published',
        },
        transformations: {
          contentSuffix: '\n\n---\n本文来源于企业官方资讯',
          addTags: ['企业资讯'],
          seoTitle: '{title} | 企业官网',
        },
        statistics: {
          totalRuns: 0,
          successfulRuns: 0,
          failedRuns: 0,
          lastSuccessfulRun: null,
          totalArticlesDistributed: 0,
        },
      },
    ];

    for (const ruleData of defaultRules) {
      try {
        await strapi.entityService.create('api::content-distribution.content-distribution', {
          data: ruleData,
        });
        console.log(`✅ Created default distribution rule: ${ruleData.name}`);
      } catch (error) {
        console.error(`❌ Error creating distribution rule ${ruleData.name}:`, error);
      }
    }
  },

  async scheduleDistributions() {
    const activeRules = await this.getActiveRules();
    
    for (const rule of activeRules) {
      const now = new Date();
      const lastRun = rule.lastRun ? new Date(rule.lastRun) : new Date(0);
      const timeSinceLastRun = now.getTime() - lastRun.getTime();
      const intervalMs = rule.syncInterval * 1000;

      if (timeSinceLastRun >= intervalMs && rule.lastRunStatus !== 'running') {
        console.log(`Scheduling distribution for rule: ${rule.name}`);
        
        // 异步执行分发
        setImmediate(async () => {
          try {
            await this.executeDistribution(Number(rule.id));
          } catch (error) {
            console.error(`Scheduled distribution failed for rule ${rule.name}:`, error);
          }
        });
      }
    }
  },
}));