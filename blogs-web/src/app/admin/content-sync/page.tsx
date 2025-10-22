'use client';

import apiClient from '@/lib/api';
import React, { useState, useEffect } from 'react';

interface SyncStatus {
  id: string;
  siteName: string;
  domain: string;
  lastSync: string;
  status: 'success' | 'error' | 'pending' | 'syncing';
  articlesCount: number;
  errorMessage?: string;
  syncDuration?: number;
}

interface ContentDistributionRule {
  id: string;
  name: string;
  sourceCategories: string[];
  targetSites: string[];
  syncInterval: number;
  isActive: boolean;
  lastRun: string;
}

export default function ContentSyncDashboard() {
  const [syncStatuses, setSyncStatuses] = useState<SyncStatus[]>([]);
  const [distributionRules, setDistributionRules] = useState<ContentDistributionRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'status' | 'rules'>('status');

  useEffect(() => {
    loadData();
    // 设置定时刷新
    const interval = setInterval(loadData, 30000); // 每30秒刷新一次
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [statusData, rulesData] = await Promise.all([
        fetchSyncStatuses(),
        fetchDistributionRules()
      ]);
      setSyncStatuses(statusData);
      setDistributionRules(rulesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSyncStatuses = async (): Promise<SyncStatus[]> => {
    try {
      const [records, stats] = await Promise.all([
        apiClient.getDistributionRecords(),
        apiClient.getDistributionStats()
      ]);

      // 按站点分组统计
      const siteStats = new Map();
      records.data?.forEach(record => {
        const site = record.targetSite;
        if (!siteStats.has(site)) {
          siteStats.set(site, {
            id: site,
            siteName: site,
            domain: `${site}`,
            lastSync: null,
            status: 'pending' as const,
            articlesCount: 0,
            successCount: 0,
            failedCount: 0,
          });
        }
        
        const siteData = siteStats.get(site);
        siteData.articlesCount++;
        
        if (record.status === 'success') {
          siteData.successCount++;
          if (!siteData.lastSync || new Date(record.distributedAt) > new Date(siteData.lastSync)) {
            siteData.lastSync = record.distributedAt;
          }
        } else if (record.status === 'failed') {
          siteData.failedCount++;
          siteData.errorMessage = record.errorMessage;
        }
        
        // 设置状态
        if (record.status === 'pending') {
          siteData.status = 'syncing';
        } else if (siteData.status !== 'syncing') {
          siteData.status = siteData.failedCount > 0 ? 'error' : 'success';
        }
        
        if (record.syncDuration) {
          siteData.syncDuration = record.syncDuration;
        }
      });

      return Array.from(siteStats.values());
    } catch (error) {
      console.error('Error fetching sync statuses:', error);
      return [];
    }
  };

  const fetchDistributionRules = async (): Promise<ContentDistributionRule[]> => {
    try {
      const response = await apiClient.getDistributionRules();
      return response.data?.map(rule => ({
        id: rule.id,
        name: rule.name,
        sourceCategories: rule.sourceCategories || [],
        targetSites: rule.targetSites || [],
        syncInterval: rule.syncInterval,
        isActive: rule.isActive,
        lastRun: rule.lastRun,
      })) || [];
    } catch (error) {
      console.error('Error fetching distribution rules:', error);
      return [];
    }
  };

  const handleManualSync = async (siteId: string) => {
    try {
      setLoading(true);
      
      // 查找对应的分发规则
      const rules = await apiClient.getActiveDistributionRules();
      const rule = rules.data?.find(r => r.targetSites?.includes(siteId));
      
      if (rule) {
        await apiClient.runDistribution(rule.id);
        
        // 更新状态
        setSyncStatuses(prev => prev.map(status => 
          status.id === siteId 
            ? { ...status, status: 'syncing' as const }
            : status
        ));
        
        // 3秒后刷新数据
        setTimeout(() => {
          loadData();
        }, 3000);
      } else {
        console.warn(`No distribution rule found for site: ${siteId}`);
      }
    } catch (error) {
      console.error('Manual sync failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: SyncStatus['status']) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'syncing':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: SyncStatus['status']) => {
    switch (status) {
      case 'success':
        return '同步成功';
      case 'error':
        return '同步失败';
      case 'pending':
        return '等待同步';
      case 'syncing':
        return '同步中...';
      default:
        return '未知状态';
    }
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) {
      return `${minutes}分${seconds % 60}秒`;
    }
    return `${seconds}秒`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载同步数据中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">内容同步仪表板</h1>
          <p className="mt-2 text-gray-600">监控和管理内容分发状态</p>
        </div>

        {/* 标签页导航 */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('status')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'status'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                同步状态
              </button>
              <button
                onClick={() => setActiveTab('rules')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'rules'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                分发规则
              </button>
            </nav>
          </div>
        </div>

        {activeTab === 'status' ? (
          <div className="space-y-6">
            {/* 概览统计 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">成功同步</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {syncStatuses.filter(s => s.status === 'success').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">同步失败</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {syncStatuses.filter(s => s.status === 'error').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">同步中</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {syncStatuses.filter(s => s.status === 'syncing').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">总文章数</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {syncStatuses.reduce((sum, s) => sum + s.articlesCount, 0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 同步状态列表 */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">站点同步状态</h3>
              </div>
              
              <div className="divide-y divide-gray-200">
                {syncStatuses.map((status) => (
                  <div key={status.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h4 className="text-lg font-medium text-gray-900">
                            {status.siteName}
                          </h4>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status.status)}`}>
                            {getStatusText(status.status)}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 mt-1">
                          {status.domain}
                        </p>
                        
                        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">最后同步：</span>
                            <span className="ml-1 text-gray-900">
                              {new Date(status.lastSync).toLocaleString('zh-CN')}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">文章数量：</span>
                            <span className="ml-1 text-gray-900">{status.articlesCount}</span>
                          </div>
                          {status.syncDuration && (
                            <div>
                              <span className="text-gray-500">同步耗时：</span>
                              <span className="ml-1 text-gray-900">
                                {formatDuration(status.syncDuration)}
                              </span>
                            </div>
                          )}
                          {status.errorMessage && (
                            <div>
                              <span className="text-gray-500">错误信息：</span>
                              <span className="ml-1 text-red-600">{status.errorMessage}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="ml-4">
                        <button
                          onClick={() => handleManualSync(status.id)}
                          disabled={status.status === 'syncing'}
                          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            status.status === 'syncing'
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          {status.status === 'syncing' ? '同步中...' : '手动同步'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 分发规则列表 */}
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">内容分发规则</h2>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                添加规则
              </button>
            </div>
            
            <div className="grid gap-6">
              {distributionRules.map((rule) => (
                <div key={rule.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {rule.name}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          rule.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {rule.isActive ? '活跃' : '停用'}
                        </span>
                      </div>
                      
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">源分类</h4>
                          <div className="flex flex-wrap gap-2">
                            {rule.sourceCategories.map((category, index) => (
                              <span 
                                key={`source-category-${rule.id}-${category}-${index}`}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                              >
                                {category}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">目标站点</h4>
                          <div className="flex flex-wrap gap-2">
                            {rule.targetSites.map((site, index) => (
                              <span 
                                key={`target-site-${rule.id}-${site}-${index}`}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                              >
                                {site}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">同步间隔：</span>
                          <span className="ml-1 text-gray-900">
                            {Math.floor(rule.syncInterval / 60)} 分钟
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">最后运行：</span>
                          <span className="ml-1 text-gray-900">
                            {new Date(rule.lastRun).toLocaleString('zh-CN')}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="ml-4 flex space-x-2">
                      <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm">
                        编辑
                      </button>
                      <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm">
                        立即运行
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}