// 模板系统核心逻辑
export interface TemplateConfig {
  layout: string;
  showSidebar: boolean;
  showBreadcrumb: boolean;
  showTags: boolean;
  showCategories: boolean;
  showComments: boolean;
  featuredArticles?: boolean;
}

export interface TemplateStyles {
  primaryColor: string;
  secondaryColor: string;
  background: string;
  foreground: string;
  fontFamily: string;
  headerStyle: string;
  cardStyle: string;
}

export interface TemplateLayout {
  header: {
    type: string;
    showLogo: boolean;
    showNav: boolean;
    showSearch?: boolean;
    showCTA?: boolean;
  };
  sidebar: {
    position: string;
    width?: string;
  };
  footer: {
    type: string;
    showCopyright: boolean;
    showLinks?: boolean;
    showContact?: boolean;
  };
}

export interface TemplateComponents {
  articleCard: string;
  pagination: string;
  breadcrumb: string;
  navigation: string;
}

export interface SiteTemplate {
  id: number;
  name: string;
  templateId: string;
  description: string;
  category: string | { name: string; slug?: string } | null;
  config: TemplateConfig;
  styles: TemplateStyles;
  layout: TemplateLayout;
  components: TemplateComponents;
  isActive: boolean;
}

export interface SiteConfig {
  templateId: string;
  customStyles?: Partial<TemplateStyles>;
  customConfig?: Partial<TemplateConfig>;
  customLayout?: Partial<TemplateLayout>;
  customComponents?: Partial<TemplateComponents>;
}

// 默认模板配置
export const DEFAULT_TEMPLATE: SiteTemplate = {
  id: 0,
  name: '默认模板',
  templateId: 'default',
  description: '默认博客模板',
  category: 'blog',
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
    background: '#ffffff',
    foreground: '#000000',
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
};

// 获取站点模板
export async function fetchSiteTemplate(templateId: string): Promise<SiteTemplate | null> {
  try {
    const response = await fetch(`${process.env.CMS_URL || process.env.NEXT_PUBLIC_CMS_URL}/api/site-templates?filters[templateId][$eq]=${templateId}&filters[isActive][$eq]=true`);
    if (!response.ok) return null;
    
    const data = await response.json();
    return data.data?.[0] || null;
  } catch (error) {
    console.error('Error fetching site template:', error);
    return null;
  }
}

// 获取所有可用模板
export async function fetchAvailableTemplates(): Promise<SiteTemplate[]> {
  try {
    const response = await fetch(`${process.env.CMS_URL || process.env.NEXT_PUBLIC_CMS_URL}/api/site-templates?filters[isActive][$eq]=true&sort=createdAt:desc`);
    if (!response.ok) return [];
    
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching available templates:', error);
    return [];
  }
}

// 获取站点配置
export async function fetchSiteConfig(domain: string): Promise<{ template: SiteTemplate; siteConfig: SiteConfig } | null> {
  const cmsUrl = process.env.CMS_URL || process.env.NEXT_PUBLIC_CMS_URL;
  // 当未配置 CMS 地址时，直接使用默认模板，避免报错
  if (!cmsUrl) {
    console.warn('CMS URL 未配置，使用默认模板');
    return { template: DEFAULT_TEMPLATE, siteConfig: { templateId: 'default' } };
  }

  try {
    const response = await fetch(`${cmsUrl}/api/sites?filters[domain][$eq]=${domain}&populate=*`);
    if (!response.ok) {
      console.warn('站点配置接口返回非 200，使用默认模板');
      return { template: DEFAULT_TEMPLATE, siteConfig: { templateId: 'default' } };
    }

    const data = await response.json();
    const site = data.data?.[0];

    if (!site) {
      console.warn('未找到站点配置，使用默认模板');
      return { template: DEFAULT_TEMPLATE, siteConfig: { templateId: 'default' } };
    }

    const templateId = site.templateId || 'default';
    const template = await fetchSiteTemplate(templateId);

    // 如果模板拉取失败，回退默认模板
    const finalTemplate = template || DEFAULT_TEMPLATE;

    return {
      template: finalTemplate,
      siteConfig: site.siteConfig || { templateId }
    };
  } catch (error) {
    // 捕获网络错误，降级为默认模板，避免在浏览器控制台输出错误
    console.warn('获取站点配置失败，使用默认模板');
    return { template: DEFAULT_TEMPLATE, siteConfig: { templateId: 'default' } };
  }
}

// 合并模板配置和站点自定义配置
export function mergeTemplateConfig(template: SiteTemplate | null | undefined, siteConfig: SiteConfig): {
  config: TemplateConfig;
  styles: TemplateStyles;
  layout: TemplateLayout;
  components: TemplateComponents;
} {
  const baseTemplate = template || DEFAULT_TEMPLATE;
  return {
    config: { ...baseTemplate.config, ...siteConfig.customConfig },
    styles: { ...baseTemplate.styles, ...siteConfig.customStyles },
    layout: { ...baseTemplate.layout, ...siteConfig.customLayout },
    components: { ...baseTemplate.components, ...siteConfig.customComponents },
  };
}

// 生成CSS变量
export function generateCSSVariables(styles: TemplateStyles): string {
  return `
    :root {
      --primary-color: ${styles.primaryColor};
      --secondary-color: ${styles.secondaryColor};
      --background: ${styles.background};
      --foreground: ${styles.foreground};
      --font-family: ${styles.fontFamily};
    }
  `;
}

// 获取组件样式类名
export function getComponentClasses(componentType: string, style: string): string {
  const classMap: Record<string, Record<string, string>> = {
    articleCard: {
      default: 'rounded-none md:rounded transition',
      news: 'transition',
      corporate: 'md:rounded-lg transition',
    },
    header: {
      minimal: 'border-b mb-6',
      bold: 'bg-red-600 text-white shadow-lg mb-6',
      corporate: 'bg-gray-900 text-white shadow-xl mb-8',
    },
    pagination: {
      numbered: 'flex justify-center space-x-2 mt-8',
      loadmore: 'text-center mt-8',
      simple: 'flex justify-between mt-8',
    },
  };
  
  return classMap[componentType]?.[style] || '';
}

// 模板列表
const templates: { [key: string]: SiteTemplate } = {
  default: DEFAULT_TEMPLATE,
  // 在这里可以添加更多模板
};

// 根据名称获取模板
export function getTemplateByName(name: string): SiteTemplate {
  return templates[name] || DEFAULT_TEMPLATE;
}