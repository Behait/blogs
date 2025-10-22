'use client';

import React from 'react';
import { useTemplate } from './TemplateProvider';
import { getComponentClasses, generateCSSVariables } from '@/lib/template';

interface DynamicLayoutProps {
  children: React.ReactNode;
  navbar?: React.ReactNode;
  sidebar?: React.ReactNode;
  footer?: React.ReactNode;
}

export default function DynamicLayout({ children, navbar, sidebar, footer }: DynamicLayoutProps) {
  const { config, styles, layout, components } = useTemplate();

  // 生成动态CSS
  const cssVariables = generateCSSVariables(styles);

  return (
    <>
      <style jsx global>{`
        ${cssVariables}
      `}</style>
      
      <div className="min-h-screen flex flex-col">
        {/* 动态头部 */}
        <header className={getComponentClasses('header', layout.header.type)}>
          <div className="max-w-7xl mx-auto px-4">
            {navbar}
          </div>
        </header>

        {/* 主要内容区域 */}
        <main className="flex-1">
          <div className="max-w-7xl mx-auto px-4">
            {config.layout === 'single-column' ? (
              // 单列布局
              <div className="max-w-7xl mx-auto">
                {children}
              </div>
            ) : config.layout === 'multi-column' ? (
              // 多列布局
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-3">
                  {children}
                </div>
                {config.showSidebar && sidebar && (
                  <div className="lg:col-span-1">
                    <aside className="sticky top-4">
                      {sidebar}
                    </aside>
                  </div>
                )}
              </div>
            ) : config.layout === 'corporate' ? (
              // 企业布局
              <div className="max-w-6xl mx-auto">
                {children}
              </div>
            ) : (
              // 默认布局
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  {children}
                </div>
                {config.showSidebar && sidebar && layout.sidebar.position !== 'none' && (
                  <div className="lg:col-span-1">
                    <aside 
                      className="sticky top-4"
                      style={{ width: layout.sidebar.width }}
                    >
                      {sidebar}
                    </aside>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>

        {/* 动态页脚 */}
        {footer && (
          <footer className={`border-t mt-8 ${layout.footer.type === 'corporate' ? 'bg-gray-900 text-white' : ''}`}>
            <div className="max-w-7xl mx-auto px-4 py-8">
              {footer}
            </div>
          </footer>
        )}
      </div>
    </>
  );
}