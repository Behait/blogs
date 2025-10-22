'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface Tag {
  id: number;
  name: string;
  slug: string;
}

interface FiltersProps {
  categories: Category[];
  tags: Tag[];
}

export default function Filters({ categories, tags }: FiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // 仅跟踪搜索参数；分类/标签改为路径路由
    setSearchQuery(searchParams.get('search') || '');
  }, [searchParams]);

  const handleCategoryChange = (categorySlug: string) => {
    const newCategory = categorySlug === selectedCategory ? '' : categorySlug;
    setSelectedCategory(newCategory);
    // 跳转到 SEO 友好的分类页
    router.push(newCategory ? `/c/${newCategory}` : '/');
  };

  const handleTagChange = (tagSlug: string) => {
    const newTag = tagSlug === selectedTag ? '' : tagSlug;
    setSelectedTag(newTag);
    // 跳转到 SEO 友好的标签页
    router.push(newTag ? `/t/${newTag}` : '/');
  };

  const handleSearchChange = (search: string) => {
    setSearchQuery(search);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    const queryString = params.toString();
    router.push(queryString ? `/?${queryString}` : '/');
  };

  const clearAllFilters = () => {
    setSelectedCategory('');
    setSelectedTag('');
    setSearchQuery('');
    router.push('/');
  };

  const hasActiveFilters = !!searchQuery; // 分类/标签不在首页显示为激活

  return (
    <div className="glass rounded-2xl p-6 mb-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
          </svg>
          筛选文章
        </h2>
        
        <div className="flex items-center gap-3">
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-sm text-gray-500 hover:text-red-600 transition-colors flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              清除筛选
            </button>
          )}
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="md:hidden btn-secondary text-sm py-2 px-3"
          >
            {isExpanded ? '收起' : '展开'}
            <svg 
              className={`w-4 h-4 ml-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      <div className={`space-y-6 ${isExpanded ? 'block' : 'hidden md:block'}`}>
        {/* 搜索框 */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <div className="h-5 w-5 flex-shrink-0">
              <svg className="w-full h-full text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <input
            type="text"
            placeholder="搜索文章标题或内容..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white/80 backdrop-blur-sm"
          />
          {searchQuery && (
            <button
              onClick={() => handleSearchChange('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 分类筛选 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              分类
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryChange(category.slug)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    selectedCategory === category.slug
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg scale-105'
                      : 'bg-white/80 text-gray-700 border border-gray-200 hover:border-purple-300 hover:bg-purple-50 hover:scale-105'
                  }`}
                >
                  {category.name}
                  {selectedCategory === category.slug && (
                    <svg className="w-4 h-4 ml-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 标签筛选 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              标签
            </label>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => handleTagChange(tag.slug)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${
                    selectedTag === tag.slug
                      ? 'bg-gradient-to-r from-green-600 to-teal-600 text-white shadow-lg scale-105'
                      : 'bg-white/80 text-gray-600 border border-gray-200 hover:border-green-300 hover:bg-green-50 hover:scale-105'
                  }`}
                >
                  #{tag.name}
                  {selectedTag === tag.slug && (
                    <svg className="w-3 h-3 ml-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 活跃筛选器显示 */}
        {hasActiveFilters && (
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium">当前筛选:</span>
              <div className="flex flex-wrap gap-2">
                {searchQuery && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-xs">
                    搜索: "{searchQuery}"
                    <button
                      onClick={() => handleSearchChange('')}
                      className="ml-1 hover:text-blue-600"
                    >
                      ×
                    </button>
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}