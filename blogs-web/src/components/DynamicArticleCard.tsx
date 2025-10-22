'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { makeArticleUrl } from '@/lib/cms';
import { useTemplate } from './TemplateProvider';
import { getComponentClasses } from '@/lib/template';

interface Article {
  id: number;
  title: string;
  slug: string;
  summary?: string;
  category?: string | { name: string };
  tags?: string[];
  publishedAt?: string;
  author?: string;
  site?: string | null;
}

interface DynamicArticleCardProps {
  article: Article;
  featured?: boolean;
}

export default function DynamicArticleCard({ article, featured = false }: DynamicArticleCardProps) {
  const { config, styles, components } = useTemplate();
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLElement>(null);
  
  const cardClasses = getComponentClasses('articleCard', components.articleCard);
  const baseClasses = cardClasses;

  // 懒加载实现
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (cardRef.current) {
            observer.unobserve(cardRef.current);
          }
        }
      },
      {
        rootMargin: '50px', // 提前50px开始加载
        threshold: 0.1 // 10%可见时触发
      }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    };
  }, []);

  // 格式化日期
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // 根据不同的卡片样式渲染
  const renderCard = () => {
    // 如果卡片不可见，显示骨架屏
    if (!isVisible) {
      return (
        <article className={`${baseClasses} animate-pulse`}>
          <div className="skeleton-card">
            <div className="flex items-center mb-4">
              <div className="skeleton-avatar mr-3"></div>
              <div className="flex-1">
                <div className="skeleton-text w-24 mb-2"></div>
                <div className="skeleton-text w-16"></div>
              </div>
            </div>
            <div className="skeleton-text w-full mb-2"></div>
            <div className="skeleton-text w-3/4 mb-4"></div>
            <div className="flex flex-wrap gap-2 mb-4">
              <div className="skeleton-text w-12"></div>
              <div className="skeleton-text w-16"></div>
              <div className="skeleton-text w-10"></div>
            </div>
            <div className="skeleton-text w-20"></div>
          </div>
        </article>
      );
    }

    switch (components.articleCard) {
      case 'news':
        return (
          <article className={`${baseClasses} group relative overflow-hidden animate-fade-in`}>
            <div className="bg-white h-full rounded-none md:rounded-2xl border border-gray-100 hover:border-gray-200 transition-colors">
              {/* 特色标签 */}
              {featured && (
                <div className="absolute top-4 right-4 z-10">
                  <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg animate-pulse">
                    ⭐ 精选
                  </span>
                </div>
              )}

              <div className="p-4 md:p-6">
                {/* 标题 */}
                <Link href={makeArticleUrl({ slug: article.slug, site: article.site })} className="block group">
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-300 line-clamp-2">
                    {article.title}
                  </h3>
                </Link>

                {/* 元信息 */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4">
                  {article.publishedAt && (
                    <time className="flex items-center gap-1" dateTime={article.publishedAt}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {formatDate(article.publishedAt)}
                    </time>
                  )}
                  {article.author && (
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {article.author}
                    </span>
                  )}
                  {config.showCategories && article.category && (
                    <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                      {typeof article.category === 'string' ? article.category : article.category?.name || '未分类'}
                    </span>
                  )}
                </div>
                
                {/* 摘要 */}
                {article.summary && (
                  <p className="text-gray-600 mb-4 line-clamp-3 leading-relaxed">{article.summary}</p>
                )}
                
                {/* 标签 */}
                {config.showTags && article.tags?.length && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {article.tags.slice(0, 3).map((tag, index) => (
                      <span 
                        key={`tag-${tag}-${index}`}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer"
                      >
                        #{tag}
                      </span>
                    ))}
                    {article.tags.length > 3 && (
                      <span className="text-gray-400 text-xs">+{article.tags.length - 3}</span>
                    )}
                  </div>
                )}

                {/* 阅读更多按钮 */}
                <Link 
                  href={makeArticleUrl({ slug: article.slug, site: article.site })}
                  className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors group"
                >
                  阅读更多
                  <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </article>
        );

      case 'corporate':
        return (
          <article className={`${baseClasses} group relative overflow-hidden animate-scale-in`}>
             <div className="bg-white rounded-2xl border border-gray-100 hover:border-gray-200 transition-colors h-full">
              {/* 特色标签 */}
              {featured && (
                <div className="absolute top-4 right-4 z-10">
                  <span className="bg-gradient-to-r from-green-400 to-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                    🔥 热门
                  </span>
                </div>
              )}

              <div className="p-4 md:p-6">
                {/* 标题 */}
                <Link href={makeArticleUrl({ slug: article.slug, site: article.site })} className="block group">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors duration-300 line-clamp-2">
                    {article.title}
                  </h3>
                </Link>

                {/* 元信息 */}
                <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 mb-6">
                  {article.publishedAt && (
                    <time className="flex items-center gap-2" dateTime={article.publishedAt}>
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      {formatDate(article.publishedAt)}
                    </time>
                  )}
                  {article.author && (
                    <span className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      {article.author}
                    </span>
                  )}
                </div>

                {/* 分类 */}
                {config.showCategories && article.category && (
                  <div className="mb-4">
                    <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-md">
                      {typeof article.category === 'string' ? article.category : article.category?.name || '未分类'}
                    </span>
                  </div>
                )}
                
                {/* 摘要 */}
                {article.summary && (
                  <p className="text-gray-600 mb-6 line-clamp-3 leading-relaxed text-lg">{article.summary}</p>
                )}
                
                {/* 标签 */}
                {config.showTags && article.tags?.length && (
                  <div className="flex flex-wrap gap-3 mb-6">
                    {article.tags.slice(0, 4).map((tag, index) => (
                      <span 
                        key={`tag-${tag}-${index}`}
                        className="bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer border border-gray-200 hover:border-blue-300"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* 阅读更多按钮 */}
                <Link 
                  href={makeArticleUrl({ slug: article.slug, site: article.site })}
                  className="btn-primary"
                >
                  <span>详细阅读</span>
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            </div>
          </article>
        );

      default:
        return (
          <article className={`${baseClasses} group relative overflow-hidden animate-slide-in`}>
            <div className="bg-white h-full rounded-none md:rounded-2xl border border-gray-100 hover:border-gray-200 transition-colors">
              {/* 特色标签 */}
              {featured && (
                <div className="absolute top-4 right-4 z-10">
                  <span className="bg-gradient-to-r from-red-400 to-pink-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg animate-bounce-in">
                    ✨ 推荐
                  </span>
                </div>
              )}

              <div className="p-4 md:p-6">
                {/* 标题 */}
                <Link href={makeArticleUrl({ slug: article.slug, site: article.site })} className="block group">
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-300 line-clamp-2">
                    {article.title}
                  </h3>
                </Link>

                {/* 元信息 */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4">
                  {article.publishedAt && (
                    <time className="flex items-center gap-1" dateTime={article.publishedAt}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {formatDate(article.publishedAt)}
                    </time>
                  )}
                  {article.author && (
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {article.author}
                    </span>
                  )}
                  {config.showCategories && article.category && (
                    <span className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                      {typeof article.category === 'string' ? article.category : article.category?.name || '未分类'}
                    </span>
                  )}
                </div>
                
                {/* 摘要 */}
                {article.summary && (
                  <p className="text-gray-600 mb-4 line-clamp-3 leading-relaxed">{article.summary}</p>
                )}
                
                {/* 标签 */}
                {config.showTags && article.tags?.length && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {article.tags.slice(0, 3).map((tag, index) => (
                      <span 
                        key={`tag-${tag}-${index}`}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer"
                      >
                        #{tag}
                      </span>
                    ))}
                    {article.tags.length > 3 && (
                      <span className="text-gray-400 text-xs">+{article.tags.length - 3}</span>
                    )}
                  </div>
                )}

                {/* 阅读更多按钮 */}
                <Link 
                  href={makeArticleUrl({ slug: article.slug, site: article.site })}
                  className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors group"
                >
                  阅读更多
                  <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </article>
        );
    }
  };

  return (
    <article 
      ref={cardRef}
      className={`${baseClasses} ${isVisible ? 'animate-fade-in' : 'opacity-0'} transition-opacity duration-500 content-visibility`}
      style={{ containIntrinsicSize: 'auto 300px' }}
    >
      {renderCard()}
    </article>
  );
}