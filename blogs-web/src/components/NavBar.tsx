"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

// 添加 "use client" 以允许使用 useState hook
export default function NavBar({ categories, tags }: { categories: any[]; tags: any[] }) {
  const topCategories = Array.isArray(categories) ? categories.slice(0, 10) : [];
  const topTags = Array.isArray(tags) ? tags.slice(0, 10) : [];
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  const doSearch = () => {
    const q = searchTerm.trim();
    if (q) {
      router.push(`/?search=${encodeURIComponent(q)}`);
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <nav className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-50 shadow-lg/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo - 重新设计 */}
          <Link href="/" className="flex items-center space-x-4 group">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300">
              <span className="text-white font-bold text-xl">B</span>
            </div>
            <div className="flex flex-col">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text font-bold text-xl group-hover:from-blue-700 group-hover:to-purple-700 transition-all">
                技术博客
              </span>
              <span className="text-xs text-gray-500 font-medium">分享技术，传播知识</span>
            </div>
          </Link>

          {/* Desktop Navigation - 重新设计 */}
          <div className="hidden md:flex items-center space-x-2">
            <Link 
              href="/" 
              className="flex items-center gap-2 px-4 py-3 rounded-xl text-gray-700 hover:text-blue-600 hover:bg-blue-50/50 transition-all duration-200 font-medium group"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg flex items-center justify-center text-white text-sm group-hover:scale-110 transition-transform">
                🏠
              </div>
              首页
            </Link>
            
            {/* Categories Dropdown - 重新设计 */}
            <div className="relative group">
              <button className="flex items-center gap-2 px-4 py-3 rounded-xl text-gray-700 hover:text-blue-600 hover:bg-blue-50/50 transition-all duration-200 font-medium">
                <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-500 rounded-lg flex items-center justify-center text-white text-sm">
                  🏷️
                </div>
                分类
                <svg className="w-4 h-4 ml-1 group-hover:rotate-180 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="absolute top-full left-0 mt-2 w-64 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200/50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 transform origin-top">
                <div className="p-3 space-y-1">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    热门分类
                  </div>
                  {topCategories.slice(0, 10).map((category: any) => (
                    <Link
                      key={category.slug}
                      href={`/c/${encodeURIComponent(category.slug)}`}
                      className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-blue-600 rounded-xl transition-all duration-200 group"
                    >
                      <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-purple-400 rounded-lg flex items-center justify-center text-white text-xs group-hover:scale-110 transition-transform">
                        {category.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{category.name}</div>
                        <div className="text-xs text-gray-500">{category.count || 0} 篇文章</div>
                      </div>
                      <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Tags Dropdown - 重新设计 */}
            <div className="relative group">
              <button className="flex items-center gap-2 px-4 py-3 rounded-xl text-gray-700 hover:text-blue-600 hover:bg-blue-50/50 transition-all duration-200 font-medium">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-400 rounded-lg flex items-center justify-center text-white text-sm">
                  🔖
                </div>
                标签
                <svg className="w-4 h-4 ml-1 group-hover:rotate-180 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="absolute top-full left-0 mt-2 w-64 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200/50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 transform origin-top">
                <div className="p-3 space-y-1">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    热门标签
                  </div>
                  {topTags.slice(0, 10).map((tag: any) => (
                    <Link
                      key={tag.slug}
                      href={`/t/${encodeURIComponent(tag.slug)}`}
                      className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 hover:text-orange-600 rounded-xl transition-all duration-200 group"
                    >
                      <div className="w-6 h-6 bg-gradient-to-br from-orange-400 to-red-400 rounded-lg flex items-center justify-center text-white text-xs group-hover:scale-110 transition-transform">
                        #
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{tag.name}</div>
                        <div className="text-xs text-gray-500">{tag.count || 0} 篇文章</div>
                      </div>
                      <svg className="w-4 h-4 text-gray-400 group-hover:text-orange-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <Link 
              href="/about" 
              className="flex items-center gap-2 px-4 py-3 rounded-xl text-gray-700 hover:text-blue-600 hover:bg-blue-50/50 transition-all duration-200 font-medium group"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg flex items-center justify-center text-white text-sm group-hover:scale-110 transition-transform">
                ℹ️
              </div>
              关于
            </Link>
            
            {/* 桌面端搜索框 */}
            <div className="relative ml-2">
              <input 
                type="text" 
                placeholder="搜索文章..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && doSearch()}
                className="w-64 bg-white/70 border border-gray-300/50 rounded-xl px-4 py-2 pl-10 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all"
              />
              <div className="absolute left-2 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-gradient-to-br from-gray-400 to-gray-500 rounded-md flex items-center justify-center text-white text-xs">
                🔍
              </div>
            </div>
            
            {/* 搜索按钮 */}
            <button onClick={doSearch} className="flex items-center gap-2 px-4 py-3 rounded-xl text-gray-700 hover:text-blue-600 hover:bg-blue-50/50 transition-all duration-200 font-medium group">
              <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-500 rounded-lg flex items-center justify-center text-white text-sm group-hover:scale-110 transition-transform">
                🔍
              </div>
              搜索
            </button>
          </div>

          {/* Mobile menu button - 重新设计 */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl text-white hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation - 重新设计 */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-xl rounded-b-3xl border border-gray-200/50 mt-2 shadow-2xl">
            <div className="px-4 py-4 space-y-2">
              <Link 
                href="/" 
                className="flex items-center gap-3 px-4 py-4 rounded-xl text-gray-700 hover:text-blue-600 hover:bg-blue-50/50 transition-all duration-200 font-medium group"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg flex items-center justify-center text-white text-sm group-hover:scale-110 transition-transform">
                  🏠
                </div>
                首页
              </Link>
              
              <div className="px-4 py-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-500 rounded-lg flex items-center justify-center text-white text-sm">
                    🏷️
                  </div>
                  <p className="text-gray-700 font-medium">分类</p>
                </div>
                <div className="space-y-2 pl-2">
                  {topCategories.slice(0, 8).map((category: any) => (
                    <Link
                      key={category.slug}
                      href={`/c/${encodeURIComponent(category.slug)}`}
                      className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:text-blue-600 hover:bg-blue-50/50 rounded-xl transition-all duration-200 group"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-purple-400 rounded-lg flex items-center justify-center text-white text-xs group-hover:scale-110 transition-transform">
                        {category.name.charAt(0)}
                      </div>
                      {category.name}
                      <span className="text-xs text-gray-400 ml-auto">{category.count || 0}</span>
                    </Link>
                  ))}
                </div>
              </div>
              
              <div className="px-4 py-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-400 rounded-lg flex items-center justify-center text-white text-sm">
                    🔖
                  </div>
                  <p className="text-gray-700 font-medium">标签</p>
                </div>
                <div className="flex flex-wrap gap-2 pl-2">
                  {topTags.slice(0, 12).map((tag: any) => (
                    <Link
                      key={tag.slug}
                      href={`/t/${encodeURIComponent(tag.slug)}`}
                      className="px-3 py-2 bg-gradient-to-r from-orange-100 to-red-100 text-orange-700 hover:from-orange-200 hover:to-red-200 hover:text-orange-800 rounded-xl transition-all duration-200 text-sm font-medium"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      #{tag.name}
                    </Link>
                  ))}
                </div>
              </div>
              
              <Link 
                href="/about" 
                className="flex items-center gap-3 px-4 py-4 rounded-xl text-gray-700 hover:text-blue-600 hover:bg-blue-50/50 transition-all duration-200 font-medium group"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg flex items-center justify-center text-white text-sm group-hover:scale-110 transition-transform">
                  ℹ️
                </div>
                关于
              </Link>
              
              {/* 搜索框 */}
              <div className="px-4 py-4">
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="搜索文章..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && doSearch()}
                    className="w-full bg-white/70 border border-gray-300/50 rounded-xl px-4 py-3 pl-12 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all"
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-500 rounded-lg flex items-center justify-center text-white text-sm">
                    🔍
                  </div>
                </div>
                <button onClick={doSearch} className="mt-3 w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium">
                  <span>搜索</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}