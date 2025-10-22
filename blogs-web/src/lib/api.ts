const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337/api';

interface ApiResponse<T> {
  data: T;
  meta?: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`API request failed: ${url}`, error);
      throw error;
    }
  }

  // 站点模板相关API
  async getSiteTemplates() {
    return this.request<any[]>('/site-templates?populate=*');
  }

  async getSiteTemplate(id: string) {
    return this.request<any>(`/site-templates/${id}?populate=*`);
  }

  async getActiveTemplates() {
    return this.request<any[]>('/site-templates?filters[isActive][$eq]=true&populate=*');
  }

  async getTemplatesByCategory(category: string) {
    return this.request<any[]>(`/site-templates?filters[category][$eq]=${category}&populate=*`);
  }

  // 站点配置相关API
  async getSites() {
    return this.request<any[]>('/sites?populate=*');
  }

  async getSite(id: string) {
    return this.request<any>(`/sites/${id}?populate=*`);
  }

  async getSiteByDomain(domain: string) {
    return this.request<any[]>(`/sites?filters[domain][$eq]=${domain}&populate=*`);
  }

  async createSite(data: any) {
    return this.request<any>('/sites', {
      method: 'POST',
      body: JSON.stringify({ data }),
    });
  }

  async updateSite(id: string, data: any) {
    return this.request<any>(`/sites/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ data }),
    });
  }

  // 内容分发相关API
  async getDistributionRules() {
    return this.request<any[]>('/content-distributions?populate=*');
  }

  async getDistributionRule(id: string) {
    return this.request<any>(`/content-distributions/${id}?populate=*`);
  }

  async getActiveDistributionRules() {
    return this.request<any[]>('/content-distributions/active');
  }

  async createDistributionRule(data: any) {
    return this.request<any>('/content-distributions', {
      method: 'POST',
      body: JSON.stringify({ data }),
    });
  }

  async updateDistributionRule(id: string, data: any) {
    return this.request<any>(`/content-distributions/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ data }),
    });
  }

  async runDistribution(id: string) {
    return this.request<any>(`/content-distributions/${id}/run`, {
      method: 'POST',
    });
  }

  async getDistributionStatus(id: string) {
    return this.request<any>(`/content-distributions/${id}/status`);
  }

  // 分发记录相关API
  async getDistributionRecords(params?: any) {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.request<any[]>(`/distribution-records${queryString}&populate=*`);
  }

  async getDistributionRecord(id: string) {
    return this.request<any>(`/distribution-records/${id}?populate=*`);
  }

  async getRecordsByArticle(articleId: string) {
    return this.request<any[]>(`/distribution-records/by-article/${articleId}?populate=*`);
  }

  async getRecordsBySite(siteId: string) {
    return this.request<any[]>(`/distribution-records/by-site/${siteId}?populate=*`);
  }

  async retryDistribution(recordId: string) {
    return this.request<any>(`/distribution-records/${recordId}/retry`, {
      method: 'POST',
    });
  }

  // 文章相关API
  async getArticles(params?: any) {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.request<any[]>(`/articles${queryString}&populate=*`);
  }

  async getArticle(id: string) {
    return this.request<any>(`/articles/${id}?populate=*`);
  }

  async getArticleBySlug(slug: string) {
    return this.request<any[]>(`/articles?filters[slug][$eq]=${slug}&populate=*`);
  }

  // 分类相关API
  async getCategories() {
    return this.request<any[]>('/categories?populate=*');
  }

  async getCategory(id: string) {
    return this.request<any>(`/categories/${id}?populate=*`);
  }

  // 标签相关API
  async getTags() {
    return this.request<any[]>('/tags?populate=*');
  }

  async getTag(id: string) {
    return this.request<any>(`/tags/${id}?populate=*`);
  }

  // 统计相关API
  async getStats() {
    try {
      const [sites, templates, articles, categories] = await Promise.all([
        this.getSites(),
        this.getSiteTemplates(),
        this.getArticles({ 'pagination[limit]': 1 }),
        this.getCategories(),
      ]);

      return {
        activeSites: sites.data?.length || 0,
        availableTemplates: templates.data?.length || 0,
        totalArticles: articles.meta?.pagination?.total || 0,
        totalCategories: categories.data?.length || 0,
      };
    } catch (error) {
      console.error('Error fetching stats:', error);
      return {
        activeSites: 0,
        availableTemplates: 0,
        totalArticles: 0,
        totalCategories: 0,
      };
    }
  }

  async getDistributionStats() {
    try {
      const records = await this.getDistributionRecords();
      const recordsData = records.data || [];

      const total = recordsData.length;
      const successful = recordsData.filter(r => r.status === 'success').length;
      const failed = recordsData.filter(r => r.status === 'failed').length;
      const pending = recordsData.filter(r => r.status === 'pending').length;

      return {
        total,
        successful,
        failed,
        pending,
        successRate: total > 0 ? ((successful / total) * 100).toFixed(1) : '0.0',
      };
    } catch (error) {
      console.error('Error fetching distribution stats:', error);
      return {
        total: 0,
        successful: 0,
        failed: 0,
        pending: 0,
        successRate: '0.0',
      };
    }
  }
}

// 创建默认实例
const apiClient = new ApiClient();

export default apiClient;
export { ApiClient };
export type { ApiResponse };