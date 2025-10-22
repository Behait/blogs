'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { SiteTemplate, SiteConfig, TemplateConfig, TemplateStyles, TemplateLayout, TemplateComponents, mergeTemplateConfig, DEFAULT_TEMPLATE, getTemplateByName } from '@/lib/template';

interface TemplateContextType {
  template: SiteTemplate;
  siteConfig: SiteConfig;
  config: TemplateConfig;
  styles: TemplateStyles;
  layout: TemplateLayout;
  components: TemplateComponents;
}

const TemplateContext = createContext<TemplateContextType | null>(null);

interface TemplateProviderProps {
  children: ReactNode;
  templateName?: string | null;
  siteConfig?: SiteConfig;
}

export function TemplateProvider({ children, templateName, siteConfig }: TemplateProviderProps) {
  const template = templateName ? getTemplateByName(templateName) : DEFAULT_TEMPLATE;
  const finalSiteConfig = siteConfig || { templateId: 'default' };
  const mergedConfig = mergeTemplateConfig(template, finalSiteConfig);
  
  const contextValue: TemplateContextType = {
    template,
    siteConfig: finalSiteConfig,
    ...mergedConfig,
  };

  return (
    <TemplateContext.Provider value={contextValue}>
      {children}
    </TemplateContext.Provider>
  );
}

export function useTemplate(): TemplateContextType {
  const context = useContext(TemplateContext);
  if (!context) {
    throw new Error('useTemplate must be used within a TemplateProvider');
  }
  return context;
}

// 高阶组件，用于包装需要模板配置的组件
export function withTemplate<P extends object>(Component: React.ComponentType<P>) {
  return function TemplateWrappedComponent(props: P) {
    const templateContext = useTemplate();
    return <Component {...props} templateContext={templateContext} />;
  };
}