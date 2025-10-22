import { Suspense } from "react";
import { fetchArticlesFiltered, fetchCategories, fetchTags } from "@/lib/cms";
import Filters from "@/components/Filters";
import DynamicArticleCard from "@/components/DynamicArticleCard";
import Pagination from "@/components/Pagination";
import Breadcrumb from "@/components/Breadcrumb";
import Link from "next/link";
import React from "react";

export default async function Home({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  const params = searchParams || {};
  const page = parseInt(String(params.page || '1')) || 1;
  const search = typeof params.search === 'string' ? params.search : '';

  const pageSize = 20;
  const [articlesData, categories, tags] = await Promise.all([
    fetchArticlesFiltered({ page, pageSize, search }),
    fetchCategories(),
    fetchTags(),
  ]);

  // 获取模板配置
  const template = 'default'; // 使用默认模板

  const articles = articlesData?.items || [];
  const totalArticles = articlesData?.pagination?.total || 0;
  const totalPages = articlesData?.pagination?.pageCount || 1;
  const currentPage = articlesData?.pagination?.page || 1;
  const totalCategories = categories?.length || 0;

  // 生成面包屑数据（仅保留搜索）
  const breadcrumbItems: { label: string; href?: string }[] = [];
  if (search) {
    breadcrumbItems.push({ label: `搜索：${search}`, href: `/?search=${encodeURIComponent(search)}` });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30">
      {/* 英雄区域 - 重新设计为更现代化的布局 */}
      <section className="relative py-32 px-6 text-center overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600">
        {/* 动态背景装饰 */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_80%,rgba(120,119,198,0.3),transparent_50%)]"></div>
          <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_20%,rgba(120,119,198,0.3),transparent_50%)]"></div>
          {/* 浮动元素 */}
          <div className="absolute top-1/4 left-1/4 w-20 h-20 bg-white/10 rounded-full blur-2xl animate-pulse"></div>
          <div className="absolute bottom-1/3 right-1/3 w-32 h-32 bg-white/5 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        </div>
        
        <div className="max-w-5xl mx-auto relative z-10">
          {/* 状态指示器 */}
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/20 backdrop-blur-sm rounded-full text-sm text-white mb-8 border border-white/30">
            <span className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse"></span>
            <span className="font-medium">专业博客平台 · 持续更新优质内容</span>
          </div>
          
          {/* 主标题 */}
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 leading-tight">
            <span className="block mb-4 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
              探索知识的无限可能
            </span>
            <span className="block text-3xl md:text-4xl font-light text-purple-100">
              分享 · 成长 · 连接
            </span>
          </h1>
          
          {/* 副标题 */}
          <p className="text-xl md:text-2xl text-purple-100 mb-12 max-w-3xl mx-auto leading-relaxed font-light">
            在这里发现最新的技术趋势，分享有价值的见解和经验，
            <br className="hidden md:block" />
            与志同道合的人一起成长，构建知识分享社区
          </p>
          
          {/* 统计数据 */}
          <div className="flex flex-wrap justify-center gap-8 mb-12">
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-8 py-6 border border-white/30 hover:bg-white/30 transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center text-white text-2xl shadow-lg">
                  📚
                </div>
                <div className="text-left">
                  <div className="text-3xl font-bold text-white">{totalArticles}</div>
                  <div className="text-sm text-purple-200 font-medium">精选文章</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-8 py-6 border border-white/30 hover:bg-white/30 transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center text-white text-2xl shadow-lg">
                  🏷️
                </div>
                <div className="text-left">
                  <div className="text-3xl font-bold text-white">{totalCategories}</div>
                  <div className="text-sm text-purple-200 font-medium">热门分类</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-8 py-6 border border-white/30 hover:bg-white/30 transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-pink-400 to-pink-600 rounded-xl flex items-center justify-center text-white text-2xl shadow-lg">
                  👥
                </div>
                <div className="text-left">
                  <div className="text-3xl font-bold text-white">10K+</div>
                  <div className="text-sm text-purple-200 font-medium">活跃读者</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* 行动按钮 */}
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a href="#articles" className="inline-flex items-center gap-3 px-8 py-4 bg-white text-purple-600 rounded-xl hover:bg-gray-50 transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              开始探索
            </a>
            <a href="/about" className="inline-flex items-center gap-3 px-8 py-4 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all duration-200 font-semibold text-lg border border-white/50">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              了解更多
            </a>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 pb-16" id="articles">
        {/* 面包屑导航 - 统一为共享组件 */}
        {breadcrumbItems.length > 0 && (
          <div className="mb-8">
            <Breadcrumb items={breadcrumbItems} />
          </div>
        )}

        {/* 筛选器 - 重新设计 */}
        <section className="mb-16 animate-scale-in network-isolated render-layout">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-gray-200/50 optimize-backdrop optimize-shadow-lg">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  🔍 智能内容发现
                </span>
              </h2>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                通过分类、标签和关键词搜索，快速找到您感兴趣的文章内容
              </p>
            </div>
            
            <Suspense fallback={
              <div className="animate-pulse network-efficient">
                <div className="h-20 bg-gray-200 rounded-xl skeleton"></div>
              </div>
            }>
              <Filters 
                categories={categories} 
                tags={tags} 
                initial={{ 
                  q: search, 
                  category: "", 
                  tag: "", 
                  pageSize: pageSize 
                }} 
              />
            </Suspense>
          </div>
        </section>

        {/* 文章列表 - 重新设计 */}
        {articles.length > 0 ? (
          <section id="articles" className="mb-16 network-isolated render-layout">
            <div className="max-w-7xl mx-auto px-4 optimize-backdrop">
              {/* 区域标题 */}
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold text-gray-800 mb-4">
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    最新文章推荐
                  </span>
                </h2>
                <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                  精心挑选的优质内容，涵盖技术、设计、产品等多个领域
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 optimize-transitions">
                {articles.map((article, index) => (
                  <div 
                    key={article.id} 
                    className="animate-slide-in content-visibility network-efficient"
                    style={{ 
                      containIntrinsicSize: '350px 450px'
                    }}
                  >
                    <DynamicArticleCard 
                      article={article} 
                      featured={index < 2} // 前两篇文章设为精选
                      template={template}
                      className="bg-white/80 backdrop-blur-sm border-gray-200/50 hover:border-blue-300/50 hover:shadow-2xl transition-all duration-300 optimize-transitions optimize-shadow-lg render-composite"
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : (
          <section id="articles" className="text-center py-20 animate-fade-in network-isolated render-layout">
            <div className="max-w-7xl mx-auto px-4 optimize-backdrop">
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-16 shadow-lg border border-gray-200/50 max-w-lg mx-auto network-efficient skeleton">
                <div className="text-8xl mb-6 animate-bounce-in">🔍</div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">暂无相关文章</h3>
                <p className="text-gray-600 mb-8 leading-relaxed">
                  很抱歉，没有找到符合条件的文章。
                  <br />
                  试试调整筛选条件或搜索其他关键词吧！
                </p>
                <a 
                  href="/" 
                  className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  返回首页
                </a>
              </div>
            </div>
          </section>
        )}

        {/* 分页 - 重新设计 */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-16 animate-fade-in network-isolated render-layout">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50 optimize-backdrop optimize-shadow-lg">
              <Pagination 
                meta={{
                  page: currentPage,
                  pageCount: totalPages
                }}
                q={search}
                category=""
                tag=""
                pageSize={pageSize}
              />
            </div>
          </div>
        )}
        
        {/* SEO优化区域 */}
        <section className="mt-20 text-center">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-3xl p-8 border border-blue-200/50">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">构建您的知识库</h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              我们致力于提供高质量的技术文章和深度内容，帮助您在技术道路上不断成长
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500">
              <span className="bg-white px-4 py-2 rounded-full border border-gray-200">#技术分享</span>
              <span className="bg-white px-4 py-2 rounded-full border border-gray-200">#知识管理</span>
              <span className="bg-white px-4 py-2 rounded-full border border-gray-200">#职业发展</span>
              <span className="bg-white px-4 py-2 rounded-full border border-gray-200">#创新思维</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
