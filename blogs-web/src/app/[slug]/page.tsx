import { fetchArticleBySlug, fetchRelatedArticles, makeArticleUrl } from "@/lib/cms";
import SafeHtmlRenderer from '@/components/SafeHtmlRenderer';
import { notFound } from "next/navigation";
import ArticleContent from "@/components/ArticleContent";
import Breadcrumb, { generateArticleBreadcrumb } from "@/components/Breadcrumb";
import CrossCommentButton from "@/components/CrossCommentButton";
import CommentForm from "@/components/CommentForm";
import Link from "next/link";
import type { Metadata } from 'next';

export const revalidate = 300;

export async function generateStaticParams() {
  const { fetchArticles } = await import("@/lib/cms");
  try {
    const response = await fetchArticles({ pageSize: 100, siteFilter: false });
    const articles = response?.data || [];
    return articles.map((a: any) => ({ slug: a.slug }));
  } catch (err) {
    console.warn("[slug]/generateStaticParams: CMS unavailable, returning empty params");
    return [];
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { slug } = params;
  try {
    const article: any = await fetchArticleBySlug(slug);
    if (!article) return {};
  
    const title = `${article.title} | 专业技术博客`;
    const description = article.summary || article.excerpt || article.title;
    const keywords = [
      ...article.tags?.map((tag: any) => tag.name) || [],
      article.category?.name,
      '技术文章', '博客', '教程', '开发'
    ].filter(Boolean).join(', ');
  
    const protocol = process.env.BAIDU_PUSH_PROTOCOL || 'https';
    const fallbackSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain.com';
    const siteDomain = article.site || fallbackSiteUrl.replace(/^https?:\/\//, '');
    const canonicalUrl = `${protocol}://${siteDomain}/${article.slug}`;
  
    return {
      title,
      description,
      keywords,
      authors: [{ name: article.author?.name || '技术编辑团队' }],
      openGraph: {
        title,
        description,
        type: 'article',
        publishedTime: article.publishedAt,
        modifiedTime: article.updatedAt,
        authors: [article.author?.name || '技术编辑团队'],
        images: article.featuredImage?.url ? [
          {
            url: article.featuredImage.url,
            width: 1200,
            height: 630,
            alt: article.title
          }
        ] : [],
        siteName: '专业技术博客',
        locale: 'zh_CN',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: article.featuredImage?.url ? [article.featuredImage.url] : [],
        creator: '@your_twitter_handle',
      },
      alternates: {
        canonical: canonicalUrl,
      },
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-video-preview': -1,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      },
    };
  } catch (err) {
    console.warn(`[slug]/generateMetadata: fetch failed for slug=${slug}, returning empty metadata`);
    return {};
  }
}

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  let article: any = null;
  try {
    article = await fetchArticleBySlug(slug);
  } catch (err) {
    console.warn(`[slug]/page: fetchArticleBySlug failed for slug=${slug}`, err);
    article = null;
  }
  if (!article) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-12 shadow-lg border border-white/50 max-w-md mx-auto text-center">
          <div className="text-6xl mb-4">📄</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">文章未找到</h1>
          <p className="text-gray-600 mb-6">可能文章不存在或 CMS 暂不可用，请稍后再试。</p>
          <a 
            href="/" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            返回首页
          </a>
        </div>
      </div>
    );
  }
  let related: any[] = [];
  try {
    related = await fetchRelatedArticles({ slug, categorySlug: article.categorySlug || undefined, limit: 5 });
  } catch (err) {
    console.warn(`[slug]/page: fetchRelatedArticles failed for slug=${slug}`, err);
    related = [];
  }
  const protocol = process.env.BAIDU_PUSH_PROTOCOL || 'https';
  const fallbackSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain.com';
  const siteDomain = article.site || fallbackSiteUrl.replace(/^https?:\/\//, '');
  const siteUrl = `${protocol}://${siteDomain}`;
  const canonical = `${siteUrl}/${article.slug}`;
  
  // 增强的JSON-LD结构化数据（使用站点实际域名）
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.summary || article.excerpt || article.title,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    author: {
      '@type': 'Person',
      name: article.author?.name || '技术编辑团队',
      url: article.author?.link || siteUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: '专业技术博客',
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/logo.png`,
      }
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonical,
    },
    image: article.featuredImage?.url || `${siteUrl}/default-article-image.jpg`,
    keywords: article.tags?.map((tag: any) => tag.name).join(', ') || undefined,
    articleSection: article.category?.name || '技术',
    wordCount: article.content?.length || 0,
    url: canonical,
  } as const;
  
  // 面包屑结构化数据
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: '首页',
        item: siteUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: article.category?.name || '文章',
        item: `${siteUrl}/c/${article.categorySlug}`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: article.title,
        item: canonical,
      },
    ],
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30">
      {/* 结构化数据 */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* 面包屑导航 - 统一为共享组件 */}
        <div className="max-w-7xl mx-auto px-6 py-4 mb-6 animate-slide-in">
          <Breadcrumb 
            items={generateArticleBreadcrumb({
              title: article.title,
              category: typeof article.category === 'string' ? article.category : article.category?.name || null,
              categorySlug: article.categorySlug || null,
            })}
          />
        </div>
        
        {/* 文章头部 - 重新设计 */}
        <article className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200/50 overflow-hidden mb-8 hover:shadow-2xl transition-all duration-300">
          {/* 特色图片 */}
          {article.featuredImage?.url && (
            <div className="relative w-full h-64 md:h-80 overflow-hidden">
              <img 
                src={article.featuredImage.url} 
                alt={article.title}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
              {article.category && (
                <div className="absolute top-6 left-6">
                  <span className="bg-white/90 backdrop-blur-sm text-gray-800 px-4 py-2 rounded-full text-sm font-medium border border-white/50">
                    {typeof article.category === 'string' ? article.category : article.category.name}
                  </span>
                </div>
              )}
            </div>
          )}
          
          <div className="p-8 md:p-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-8 leading-tight text-gray-800">
              {article.title}
            </h1>
            
            {/* 文章摘要 */}
            {article.excerpt && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 mb-8 border-l-4 border-blue-500">
                <p className="text-lg text-gray-700 leading-relaxed font-medium">
                  {article.excerpt}
                </p>
              </div>
            )}
            
            {/* 文章元信息 - 重新设计 */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600 mb-8 bg-gray-50 rounded-2xl p-6 border border-gray-200/50">
              <div className="flex items-center gap-3 group">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm shadow-lg group-hover:scale-110 transition-transform">
                  📅
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 font-medium">发布时间</span>
                  <span className="font-semibold text-gray-800">{new Date(article.publishedAt).toLocaleDateString('zh-CN')}</span>
                </div>
              </div>
              
              {article.category && (
                <div className="flex items-center gap-3 group">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center text-white text-sm shadow-lg group-hover:scale-110 transition-transform">
                    🏷️
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 font-medium">所属分类</span>
                    <a href={`/c/${article.categorySlug}`} className="font-semibold text-gray-800 hover:text-blue-600 transition-colors">
                      {typeof article.category === 'string' ? article.category : article.category.name}
                    </a>
                  </div>
                </div>
              )}
              
              {article.tags && article.tags.length > 0 && (
                <div className="flex items-center gap-3 group">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center text-white text-sm shadow-lg group-hover:scale-110 transition-transform">
                    🔖
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 font-medium">文章标签</span>
                    <div className="flex flex-wrap gap-2">
                      {article.tags.map((tag: any, index: number) => (
                        <a key={index} href={`/t/${tag.slug}`} className="bg-gradient-to-r from-orange-100 to-red-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium hover:from-orange-200 hover:to-red-200 transition-all">
                                           #{tag.name}
                                         </a>
                                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {/* 阅读时间估算 */}
              <div className="flex items-center gap-3 group">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white text-sm shadow-lg group-hover:scale-110 transition-transform">
                  ⏱️
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 font-medium">阅读时间</span>
                  <span className="font-semibold text-gray-800">约 {Math.ceil((article.content?.length || 0) / 500)} 分钟</span>
                </div>
              </div>
            </div>
            
            {/* 文章内容 - 优化阅读体验 */}
            {article.content && (
              <div className="prose prose-lg max-w-none prose-headings:text-gray-800 prose-p:text-gray-700 prose-p:leading-relaxed prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-800 prose-code:text-purple-600 prose-code:bg-purple-50 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-pre:bg-gray-900 prose-pre:text-gray-100">
                <ArticleContent 
                  content={article.content || ''}
                  currentSlug={article.slug}
                  className="article-content text-lg leading-relaxed text-gray-700 bg-white/50 rounded-2xl p-8 border border-gray-200/50 shadow-inner"
                />
              </div>
            )}
            
            {/* 文章结尾 - 添加分享和版权信息 */}
            <div className="mt-12 pt-8 border-t border-gray-200/50">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 mb-8 border border-gray-200/50">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">📢 分享这篇文章</h3>
                <div className="flex flex-wrap gap-3">
                  <button className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg">
                    分享到微博
                  </button>
                  <button className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-green-600 hover:to-green-700 transition-all shadow-lg">
                    分享到微信
                  </button>
                  <button className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-purple-600 hover:to-purple-700 transition-all shadow-lg">
                    复制链接
                  </button>
                </div>
              </div>
              
              <div className="text-center text-gray-500 text-sm">
                <p>© 2024 专业技术博客 | 转载请注明出处 | 文章版权归作者所有</p>
              </div>
            </div>
          </div>
        </article>

        {/* 站群评论触发按钮 */}
        <div className="mb-8">
          <CrossCommentButton articleId={article.id} />
        </div>

        {/* 评论区 - 重新设计 */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200/50 p-8 hover:shadow-2xl transition-all duration-300 mb-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
              💬
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
              评论区
            </h2>
            {article.comments?.length ? (
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                {article.comments.length}
              </span>
            ) : null}
          </div>
          
          <div className="space-y-8">
            {/* 跨站点评论 */}
            <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-6 border border-gray-200/50 hover:shadow-lg transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-sm">
                  🌐
                </div>
                <h3 className="font-bold text-lg text-gray-800">跨站点评论系统</h3>
              </div>
              <p className="text-gray-600 mb-4 leading-relaxed">
                这里将显示来自其他站点的评论，实现跨站点评论聚合，让讨论更加活跃和多元化。
              </p>
              <div className="bg-white/70 rounded-xl p-4 border border-gray-200/30">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-300 rounded-full animate-pulse"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-3">评论系统正在加载中...</p>
              </div>
            </div>
            
            {/* 已有评论 */}
            {article.comments?.length ? (
              <div className="space-y-6">
                {article.comments.map((c: any) => (
                  <div key={c.id} className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 border border-gray-200/50 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                        {c.authorName?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {c.authorLink ? (
                            <a 
                              href={c.authorLink} 
                              rel="nofollow" 
                              className="font-bold text-gray-800 hover:text-blue-600 transition-colors"
                            >
                              {c.authorName}
                            </a>
                          ) : (
                            <span className="font-bold text-gray-800">{c.authorName}</span>
                          )}
                          <span className="text-gray-400">•</span>
                          <time className="text-sm text-gray-500">
                            {c.createdAt ? new Date(c.createdAt).toLocaleDateString('zh-CN') : '刚刚'}
                          </time>
                        </div>
                        <SafeHtmlRenderer 
                          html={c.content} 
                          className="text-gray-700 leading-relaxed" 
                          uniqueId={c.id} 
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl border border-gray-200/50">
                <div className="text-5xl mb-4">💬</div>
                <p className="text-gray-500 mb-6">暂无评论，来发表第一条评论吧！</p>
              </div>
            )}
            
            {/* 发表评论 */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border border-gray-200/50 hover:shadow-lg transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center text-white text-sm">
                  ✍️
                </div>
                <h3 className="font-bold text-lg text-gray-800">发表评论</h3>
              </div>
              
              <form className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">昵称 *</label>
                    <input 
                      type="text" 
                      placeholder="请输入您的昵称" 
                      className="w-full bg-white/70 border border-gray-300/50 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all shadow-sm"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">邮箱 *</label>
                    <input 
                      type="email" 
                      placeholder="请输入您的邮箱" 
                      className="w-full bg-white/70 border border-gray-300/50 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all shadow-sm"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">评论内容 *</label>
                  <textarea 
                    placeholder="分享您的想法和建议..." 
                    rows={5}
                    className="w-full bg-white/70 border border-gray-300/50 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all resize-none shadow-sm"
                    required
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    您的邮箱地址不会被公开。必填项已标记 *
                  </p>
                  <button 
                    type="submit" 
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    发表评论
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* 相关文章 - 重新设计 */}
        {related && related.length > 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200/50 p-8 mb-8 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                📚
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
                相关文章推荐
              </h2>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2">
              {related.map((item: any) => (
                <a key={item.slug} href={makeArticleUrl({ slug: item.slug, site: item.site })} className="group">
                  <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-6 hover:from-blue-50 hover:to-purple-50 transition-all duration-300 border border-gray-200/50 hover:border-blue-300/50 hover:shadow-lg">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-xl shadow-lg group-hover:scale-105 transition-transform">
                        {item.category?.charAt(0) || '📝'}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-2 text-gray-800 group-hover:text-blue-600 transition-colors line-clamp-2">
                          {item.title}
                        </h3>
                        {item.excerpt && (
                          <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">
                            {item.excerpt}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <span className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">📅</span>
                            {new Date(item.publishedAt).toLocaleDateString('zh-CN')}
                          </span>
                          {item.category && (
                            <span className="flex items-center gap-1">
                              <span className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">🏷️</span>
                              {typeof item.category === 'string' ? item.category : item.category.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}