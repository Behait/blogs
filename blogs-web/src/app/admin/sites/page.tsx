'use client';

import React, { useState, useEffect } from 'react';
import { fetchAvailableTemplates, SiteTemplate } from '@/lib/template';

interface Site {
  id: number;
  name: string;
  domain: string;
  templateId: string;
  siteConfig: any;
  contentDistribution: any;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function SiteManagementPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [templates, setTemplates] = useState<SiteTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [sitesData, templatesData] = await Promise.all([
        fetchSites(),
        fetchAvailableTemplates()
      ]);
      setSites(sitesData);
      setTemplates(templatesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSites = async (): Promise<Site[]> => {
    // 这里应该调用实际的API
    // 暂时返回模拟数据
    return [
      {
        id: 1,
        name: '主站',
        domain: 'main.example.com',
        templateId: 'news-template',
        siteConfig: { showSidebar: true, showComments: true },
        contentDistribution: { autoSync: true, syncInterval: 3600 },
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-15T00:00:00Z'
      },
      {
        id: 2,
        name: '企业站',
        domain: 'corporate.example.com',
        templateId: 'corporate-template',
        siteConfig: { showSidebar: false, showComments: false },
        contentDistribution: { autoSync: false, syncInterval: 7200 },
        isActive: true,
        createdAt: '2024-01-02T00:00:00Z',
        updatedAt: '2024-01-16T00:00:00Z'
      }
    ];
  };

  const handleEditSite = (site: Site) => {
    setSelectedSite(site);
    setIsEditing(true);
  };

  const handleSaveSite = async (updatedSite: Site) => {
    try {
      // 这里应该调用实际的API来保存站点配置
      console.log('Saving site:', updatedSite);
      
      // 更新本地状态
      setSites(sites.map(site => 
        site.id === updatedSite.id ? updatedSite : site
      ));
      
      setIsEditing(false);
      setSelectedSite(null);
    } catch (error) {
      console.error('Error saving site:', error);
    }
  };

  const getTemplateName = (templateId: string) => {
    const template = templates.find(t => t.templateId === templateId);
    return template ? template.name : templateId;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载站点数据中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">站点配置管理</h1>
          <p className="mt-2 text-gray-600">管理多个站点的配置和模板</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 站点列表 */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">站点列表</h2>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                添加站点
              </button>
            </div>
            
            <div className="space-y-4">
              {sites.map((site) => (
                <div key={site.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {site.name}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          site.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {site.isActive ? '活跃' : '停用'}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mt-1">
                        域名: {site.domain}
                      </p>
                      
                      <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">模板：</span>
                          <span className="ml-1 text-gray-900">
                            {getTemplateName(site.templateId)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">自动同步：</span>
                          <span className="ml-1 text-gray-900">
                            {site.contentDistribution?.autoSync ? '启用' : '禁用'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">侧边栏：</span>
                          <span className="ml-1 text-gray-900">
                            {site.siteConfig?.showSidebar ? '显示' : '隐藏'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">评论：</span>
                          <span className="ml-1 text-gray-900">
                            {site.siteConfig?.showComments ? '启用' : '禁用'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="ml-4 flex space-x-2">
                      <button
                        onClick={() => handleEditSite(site)}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm"
                      >
                        编辑
                      </button>
                      <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm">
                        预览
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
                    创建时间: {new Date(site.createdAt).toLocaleDateString('zh-CN')} | 
                    更新时间: {new Date(site.updatedAt).toLocaleDateString('zh-CN')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 站点配置面板 */}
          <div className="lg:sticky lg:top-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">站点配置</h2>
            
            {selectedSite && isEditing ? (
              <SiteConfigForm 
                site={selectedSite}
                templates={templates}
                onSave={handleSaveSite}
                onCancel={() => {
                  setIsEditing(false);
                  setSelectedSite(null);
                }}
              />
            ) : selectedSite ? (
              <SiteConfigView site={selectedSite} templates={templates} />
            ) : (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <p className="text-gray-500">选择一个站点来查看或编辑配置</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// 站点配置查看组件
function SiteConfigView({ site, templates }: { site: Site; templates: SiteTemplate[] }) {
  const template = templates.find(t => t.templateId === site.templateId);
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="bg-gray-900 text-white p-4">
        <h3 className="font-semibold">{site.name}</h3>
        <p className="text-sm text-gray-300 mt-1">{site.domain}</p>
      </div>
      
      <div className="p-6 space-y-6">
        <div>
          <h4 className="font-medium text-gray-900 mb-3">基本信息</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">状态：</span>
              <span className={site.isActive ? 'text-green-600' : 'text-red-600'}>
                {site.isActive ? '活跃' : '停用'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">模板：</span>
              <span className="text-gray-900">{template?.name || site.templateId}</span>
            </div>
          </div>
        </div>
        
        <div>
          <h4 className="font-medium text-gray-900 mb-3">站点配置</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">侧边栏：</span>
              <span className="text-gray-900">
                {site.siteConfig?.showSidebar ? '显示' : '隐藏'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">评论：</span>
              <span className="text-gray-900">
                {site.siteConfig?.showComments ? '启用' : '禁用'}
              </span>
            </div>
          </div>
        </div>
        
        <div>
          <h4 className="font-medium text-gray-900 mb-3">内容分发</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">自动同步：</span>
              <span className="text-gray-900">
                {site.contentDistribution?.autoSync ? '启用' : '禁用'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">同步间隔：</span>
              <span className="text-gray-900">
                {site.contentDistribution?.syncInterval || 0} 秒
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 站点配置编辑组件
function SiteConfigForm({ 
  site, 
  templates, 
  onSave, 
  onCancel 
}: { 
  site: Site; 
  templates: SiteTemplate[]; 
  onSave: (site: Site) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState(site);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="bg-gray-900 text-white p-4">
        <h3 className="font-semibold">编辑站点配置</h3>
        <p className="text-sm text-gray-300 mt-1">{site.name}</p>
      </div>
      
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            站点名称
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            域名
          </label>
          <input
            type="text"
            value={formData.domain}
            onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            模板
          </label>
          <select
            value={formData.templateId}
            onChange={(e) => setFormData({ ...formData, templateId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {templates.map((template) => (
              <option key={template.templateId} value={template.templateId}>
                {template.name}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            站点配置
          </label>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.siteConfig?.showSidebar || false}
                onChange={(e) => setFormData({
                  ...formData,
                  siteConfig: {
                    ...formData.siteConfig,
                    showSidebar: e.target.checked
                  }
                })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">显示侧边栏</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.siteConfig?.showComments || false}
                onChange={(e) => setFormData({
                  ...formData,
                  siteConfig: {
                    ...formData.siteConfig,
                    showComments: e.target.checked
                  }
                })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">启用评论</span>
            </label>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            内容分发
          </label>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.contentDistribution?.autoSync || false}
                onChange={(e) => setFormData({
                  ...formData,
                  contentDistribution: {
                    ...formData.contentDistribution,
                    autoSync: e.target.checked
                  }
                })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">自动同步</span>
            </label>
            
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                同步间隔（秒）
              </label>
              <input
                type="number"
                value={formData.contentDistribution?.syncInterval || 3600}
                onChange={(e) => setFormData({
                  ...formData,
                  contentDistribution: {
                    ...formData.contentDistribution,
                    syncInterval: parseInt(e.target.value)
                  }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
        
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">站点激活</span>
          </label>
        </div>
        
        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            保存
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
          >
            取消
          </button>
        </div>
      </form>
    </div>
  );
}