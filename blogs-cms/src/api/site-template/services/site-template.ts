import { factories } from '@strapi/strapi';

export default factories.createCoreService('api::site-template.site-template', ({ strapi }) => ({
  async getTemplateById(templateId: string) {
    const templates = await strapi.entityService.findMany('api::site-template.site-template', {
      filters: { templateId, isActive: true },
    });
    
    return templates[0] || null;
  },

  async getActiveTemplates() {
    return await strapi.entityService.findMany('api::site-template.site-template', {
      filters: { isActive: true },
      sort: { createdAt: 'desc' },
    });
  },

  async getTemplatesByCategory(category: string) {
    return await strapi.entityService.findMany('api::site-template.site-template', {
      filters: { category: category as any, isActive: true },
      sort: { createdAt: 'desc' },
    });
  },

  async createDefaultTemplates() {
    const defaultTemplates = [
      {
        name: '默认博客模板',
        templateId: 'default',
        description: '简洁的博客模板，适合个人博客和技术文章',
        category: 'blog' as const,
        config: {
          layout: 'single-column',
          showSidebar: true,
          showBreadcrumb: true,
          showTags: true,
          showCategories: true,
          showComments: true,
        },
        styles: {
          primaryColor: '#2563eb',
          secondaryColor: '#64748b',
          fontFamily: 'system-ui',
          headerStyle: 'minimal',
          cardStyle: 'shadow',
        },
        layout: {
          header: { type: 'minimal', showLogo: true, showNav: true },
          sidebar: { position: 'right', width: '300px' },
          footer: { type: 'simple', showCopyright: true },
        },
        components: {
          articleCard: 'default',
          pagination: 'numbered',
          breadcrumb: 'simple',
          navigation: 'horizontal',
        },
        isActive: true,
      },
      {
        name: '新闻资讯模板',
        templateId: 'news',
        description: '适合新闻网站和资讯平台的模板',
        category: 'news' as const,
        config: {
          layout: 'multi-column',
          showSidebar: true,
          showBreadcrumb: true,
          showTags: true,
          showCategories: true,
          showComments: true,
          featuredArticles: true,
        },
        styles: {
          primaryColor: '#dc2626',
          secondaryColor: '#374151',
          fontFamily: 'system-ui',
          headerStyle: 'bold',
          cardStyle: 'border',
        },
        layout: {
          header: { type: 'bold', showLogo: true, showNav: true, showSearch: true },
          sidebar: { position: 'right', width: '350px' },
          footer: { type: 'detailed', showCopyright: true, showLinks: true },
        },
        components: {
          articleCard: 'news',
          pagination: 'loadmore',
          breadcrumb: 'detailed',
          navigation: 'mega-menu',
        },
        isActive: true,
      },
      {
        name: '企业官网模板',
        templateId: 'corporate',
        description: '专业的企业官网模板，适合公司和机构',
        category: 'corporate' as const,
        config: {
          layout: 'corporate',
          showSidebar: false,
          showBreadcrumb: true,
          showTags: false,
          showCategories: true,
          showComments: false,
        },
        styles: {
          primaryColor: '#1f2937',
          secondaryColor: '#6b7280',
          fontFamily: 'system-ui',
          headerStyle: 'corporate',
          cardStyle: 'clean',
        },
        layout: {
          header: { type: 'corporate', showLogo: true, showNav: true, showCTA: true },
          sidebar: { position: 'none' },
          footer: { type: 'corporate', showCopyright: true, showContact: true },
        },
        components: {
          articleCard: 'corporate',
          pagination: 'simple',
          breadcrumb: 'corporate',
          navigation: 'corporate',
        },
        isActive: true,
      },
    ];

    for (const template of defaultTemplates) {
      const existing = await this.getTemplateById(template.templateId);
      if (!existing) {
        await strapi.entityService.create('api::site-template.site-template', {
          data: template,
        });
      }
    }
  },
}));