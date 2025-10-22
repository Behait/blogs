'use client';

import React, { useState, useEffect } from 'react';
import { fetchAvailableTemplates, SiteTemplate } from '@/lib/template';

export default function TemplateManagementPage() {
  const [templates, setTemplates] = useState<SiteTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<SiteTemplate | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const data = await fetchAvailableTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = (template: SiteTemplate) => {
    setSelectedTemplate(template);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载模板中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">站点模板管理</h1>
          <p className="mt-2 text-gray-600">管理和预览不同的站点模板</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 模板列表 */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">可用模板</h2>
            
            <div className="grid gap-4">
              {templates.map((template) => (
                <div 
                  key={template.id} 
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handlePreview(template)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {template.name}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {template.description}
                      </p>
                      
                      <div className="flex items-center space-x-4 mt-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {typeof template.category === 'string' ? template.category : template.category?.name || '未分类'}
                        </span>
                        <span className="text-xs text-gray-500">
                          ID: {template.templateId}
                        </span>
                      </div>
                    </div>
                    
                    <div className="ml-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePreview(template);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                      >
                        预览
                      </button>
                    </div>
                  </div>
                  
                  {/* 模板特性 */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">布局：</span>
                        <span className="ml-1 text-gray-900">{template.config.layout}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">侧边栏：</span>
                        <span className="ml-1 text-gray-900">
                          {template.config.showSidebar ? '显示' : '隐藏'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">评论：</span>
                        <span className="ml-1 text-gray-900">
                          {template.config.showComments ? '启用' : '禁用'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">标签：</span>
                        <span className="ml-1 text-gray-900">
                          {template.config.showTags ? '显示' : '隐藏'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 模板预览 */}
          <div className="lg:sticky lg:top-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">模板预览</h2>
            
            {selectedTemplate ? (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                {/* 预览头部 */}
                <div className="bg-gray-900 text-white p-4">
                  <h3 className="font-semibold">{selectedTemplate.name}</h3>
                  <p className="text-sm text-gray-300 mt-1">
                    {selectedTemplate.description}
                  </p>
                </div>
                
                {/* 配置详情 */}
                <div className="p-6 space-y-6">
                  {/* 样式配置 */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">样式配置</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">主色调：</span>
                        <div className="flex items-center mt-1">
                          <div 
                            className="w-4 h-4 rounded border mr-2"
                            style={{ backgroundColor: selectedTemplate.styles.primaryColor }}
                          ></div>
                          <span className="text-gray-900">{selectedTemplate.styles.primaryColor}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">辅助色：</span>
                        <div className="flex items-center mt-1">
                          <div 
                            className="w-4 h-4 rounded border mr-2"
                            style={{ backgroundColor: selectedTemplate.styles.secondaryColor }}
                          ></div>
                          <span className="text-gray-900">{selectedTemplate.styles.secondaryColor}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">字体：</span>
                        <span className="ml-1 text-gray-900">{selectedTemplate.styles.fontFamily}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">头部样式：</span>
                        <span className="ml-1 text-gray-900">{selectedTemplate.styles.headerStyle}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* 布局配置 */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">布局配置</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">头部类型：</span>
                        <span className="text-gray-900">{selectedTemplate.layout.header.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">侧边栏位置：</span>
                        <span className="text-gray-900">{selectedTemplate.layout.sidebar.position}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">页脚类型：</span>
                        <span className="text-gray-900">{selectedTemplate.layout.footer.type}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* 组件配置 */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">组件配置</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">文章卡片：</span>
                        <span className="text-gray-900">{selectedTemplate.components.articleCard}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">分页样式：</span>
                        <span className="text-gray-900">{selectedTemplate.components.pagination}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">面包屑：</span>
                        <span className="text-gray-900">{selectedTemplate.components.breadcrumb}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">导航样式：</span>
                        <span className="text-gray-900">{selectedTemplate.components.navigation}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-gray-500">选择一个模板来预览其配置</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}