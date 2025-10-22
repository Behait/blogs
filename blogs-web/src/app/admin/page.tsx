'use client';

import apiClient from '@/lib/api';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    activeSites: 0,
    availableTemplates: 0,
    syncSuccessRate: '0.0',
    totalArticles: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const [generalStats, distributionStats] = await Promise.all([
        apiClient.getStats(),
        apiClient.getDistributionStats()
      ]);

      setStats({
        activeSites: generalStats.activeSites,
        availableTemplates: generalStats.availableTemplates,
        syncSuccessRate: distributionStats.successRate,
        totalArticles: generalStats.totalArticles,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };
  const statsData = [
    {
      name: '活跃站点',
      value: loading ? '...' : stats.activeSites.toString(),
      change: '+1',
      changeType: 'increase',
      icon: (
        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    },
    {
      name: '可用模板',
      value: loading ? '...' : stats.availableTemplates.toString(),
      change: '+2',
      changeType: 'increase',
      icon: (
        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
      )
    },
    {
      name: '同步成功率',
      value: loading ? '...' : `${stats.syncSuccessRate}%`,
      change: '+2.1%',
      changeType: 'increase',
      icon: (
        <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      name: '总文章数',
      value: loading ? '...' : stats.totalArticles.toString(),
      change: '+89',
      changeType: 'increase',
      icon: (
        <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    }
  ];

  const quickActions = [
    {
      name: '创建新站点',
      description: '添加一个新的站点配置',
      href: '/admin/sites',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      name: '管理模板',
      description: '查看和编辑站点模板',
      href: '/admin/templates',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
      ),
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      name: '内容同步',
      description: '监控内容分发状态',
      href: '/admin/content-sync',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      ),
      color: 'bg-purple-500 hover:bg-purple-600'
    }
  ];

  const recentActivities = [
    {
      id: 1,
      type: 'sync',
      message: '主站内容同步完成',
      time: '2分钟前',
      status: 'success'
    },
    {
      id: 2,
      type: 'template',
      message: '新闻模板已更新',
      time: '15分钟前',
      status: 'info'
    },
    {
      id: 3,
      type: 'site',
      message: '企业站配置已修改',
      time: '1小时前',
      status: 'info'
    },
    {
      id: 4,
      type: 'error',
      message: '新闻站同步失败',
      time: '2小时前',
      status: 'error'
    }
  ];

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">仪表板</h1>
          <p className="mt-2 text-gray-600">站群管理系统概览</p>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsData.map((stat) => (
            <div key={stat.name} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  {stat.icon}
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                  <div className="flex items-baseline">
                    <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                    <p className={`ml-2 text-sm font-medium ${
                      stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stat.change}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 快速操作 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">快速操作</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {quickActions.map((action) => (
                    <Link
                      key={action.name}
                      href={action.href}
                      className="group relative bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`flex-shrink-0 w-10 h-10 ${action.color} rounded-lg flex items-center justify-center text-white transition-colors`}>
                          {action.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 group-hover:text-blue-600">
                            {action.name}
                          </h4>
                          <p className="text-sm text-gray-500 mt-1">
                            {action.description}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* 系统状态 */}
            <div className="mt-8 bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">系统状态</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-900">CMS 服务</span>
                    </div>
                    <span className="text-sm text-green-600">正常运行</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-900">前端服务</span>
                    </div>
                    <span className="text-sm text-green-600">正常运行</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-900">同步服务</span>
                    </div>
                    <span className="text-sm text-yellow-600">部分异常</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-900">数据库</span>
                    </div>
                    <span className="text-sm text-green-600">正常运行</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 最近活动 */}
          <div>
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">最近活动</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                        activity.status === 'success' ? 'bg-green-500' :
                        activity.status === 'error' ? 'bg-red-500' : 'bg-blue-500'
                      }`}></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">{activity.message}</p>
                        <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6">
                  <Link 
                    href="/admin/content-sync"
                    className="text-sm text-blue-600 hover:text-blue-500 font-medium"
                  >
                    查看所有活动 →
                  </Link>
                </div>
              </div>
            </div>

            {/* 快速链接 */}
            <div className="mt-8 bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">快速链接</h3>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  <Link 
                    href="/"
                    className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    <span>访问前台</span>
                  </Link>
                  
                  <Link 
                    href="/admin/templates"
                    className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                    </svg>
                    <span>模板库</span>
                  </Link>
                  
                  <Link 
                    href="/admin/sites"
                    className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>站点设置</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}