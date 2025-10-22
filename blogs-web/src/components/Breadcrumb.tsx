import Link from 'next/link';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumb({ items, className = "" }: BreadcrumbProps) {
  if (!items || items.length === 0) return null;

  return (
    <nav className={`flex items-center space-x-2 text-sm text-gray-600 ${className}`} aria-label="面包屑导航">
      <Link 
        href="/" 
        className="hover:text-blue-600 transition-colors"
        title="返回首页"
      >
        首页
      </Link>
      
      {items.map((item, index) => (
        <div key={index} className="flex items-center space-x-2">
          <span className="text-gray-400">/</span>
          {item.href ? (
            <Link 
              href={item.href} 
              className="hover:text-blue-600 transition-colors"
              title={`前往${item.label}`}
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-800 font-medium" aria-current="page">
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}

// 工具函数：为文章页面生成面包屑数据
export function generateArticleBreadcrumb(article: {
  title: string;
  category?: string | null;
  categorySlug?: string | null;
}): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = [];
  
  // 添加分类层级
  if (article.category && article.categorySlug) {
    items.push({
      label: article.category,
      href: `/c/${encodeURIComponent(article.categorySlug)}`
    });
  }
  
  // 添加当前文章（不可点击）
  items.push({
    label: article.title
  });
  
  return items;
}

// 工具函数：为分类页面生成面包屑数据
export function generateCategoryBreadcrumb(categoryName: string): BreadcrumbItem[] {
  return [
    {
      label: `分类：${categoryName}`
    }
  ];
}

// 工具函数：为标签页面生成面包屑数据
export function generateTagBreadcrumb(tagName: string): BreadcrumbItem[] {
  return [
    {
      label: `标签：${tagName}`
    }
  ];
}

// 工具函数：为搜索页面生成面包屑数据
export function generateSearchBreadcrumb(query: string): BreadcrumbItem[] {
  return [
    {
      label: `搜索：${query}`
    }
  ];
}