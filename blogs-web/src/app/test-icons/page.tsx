export default function TestIcons() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">图标大小测试页面</h1>
        
        {/* 调试信息 */}
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-8">
          <h2 className="font-bold">调试信息:</h2>
          <p>如果所有图标都显示为相同大小，说明Tailwind CSS的宽度/高度类没有生效</p>
          <div className="mt-2">
            <div className="w-4 h-4 bg-blue-500 inline-block mr-2"></div>
            <span>这个蓝色方块应该是16px × 16px</span>
          </div>
          <div className="mt-2">
            <div style={{width: '16px', height: '16px'}} className="bg-green-500 inline-block mr-2"></div>
            <span>这个绿色方块使用内联样式，应该是16px × 16px</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* w-3 h-3 - 强制约束 */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-4">w-3 h-3 (12px) - 强制约束</h2>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 flex-shrink-0">
                <svg className="w-full h-full text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <span>搜索图标 (容器约束)</span>
            </div>
          </div>

          {/* w-4 h-4 */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-4">w-4 h-4 (16px)</h2>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>搜索图标</span>
            </div>
          </div>

          {/* w-5 h-5 */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-4">w-5 h-5 (20px)</h2>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>搜索图标</span>
            </div>
          </div>

          {/* w-6 h-6 */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-4">w-6 h-6 (24px)</h2>
            <div className="flex items-center gap-2">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>搜索图标</span>
            </div>
          </div>

          {/* w-8 h-8 */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-4">w-8 h-8 (32px)</h2>
            <div className="flex items-center gap-2">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>搜索图标</span>
            </div>
          </div>

          {/* w-12 h-12 */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-4">w-12 h-12 (48px)</h2>
            <div className="flex items-center gap-2">
              <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>搜索图标</span>
            </div>
          </div>
        </div>

        <div className="mt-12 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">实际页面中的搜索图标</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">筛选器中的搜索图标 (h-5 w-5):</h3>
              <div className="relative max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="搜索文章标题或内容..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">按钮中的搜索图标 (w-5 h-5):</h3>
              <button className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                开始探索
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <a href="/" className="text-blue-600 hover:text-blue-800 underline">
            返回首页
          </a>
        </div>
      </div>
    </div>
  );
}