import { fetchArticlesFiltered, fetchCategories } from "@/lib/cms";
import DynamicArticleCard from "@/components/DynamicArticleCard";
import Pagination from "@/components/Pagination";
import Breadcrumb, { generateCategoryBreadcrumb } from "@/components/Breadcrumb";
import Link from "next/link";

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const categories = await fetchCategories();
  const category = Array.isArray(categories) ? categories.find((c: any) => c.slug === slug) : null;
  const name = category?.name || slug;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return {
    title: `分类：${name} | 技术博客`,
    description: `分类 ${name} 下的最新技术文章列表`,
    alternates: { canonical: `${siteUrl}/c/${slug}` },
    robots: { index: true, follow: true },
  } as any;
}

export default async function CategoryPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams?: Promise<any>; }) {
  const { slug } = await params;
  const s = (await searchParams) || {};
  const page = parseInt(s.page) || 1;
  const pageSize = 20;

  const [categories, articlesData] = await Promise.all([
    fetchCategories(),
    fetchArticlesFiltered({ page, pageSize, category: slug }),
  ]);

  const category = Array.isArray(categories) ? categories.find((c: any) => c.slug === slug) : null;
  const name = category?.name || slug;
  const items = articlesData.items || [];
  const meta = { page: articlesData.pagination.page, pageCount: articlesData.pagination.pageCount };

  const breadcrumbItems = generateCategoryBreadcrumb(name);

  return (
    <div className="mx-auto px-4 md:max-w-7xl md:px-6 py-8">
      <div className="mb-6">
        <Breadcrumb items={breadcrumbItems} />
      </div>

      {items.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((article: any, index: number) => (
            <DynamicArticleCard key={article.id} article={article} featured={false} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🔍</div>
          <h3 className="text-2xl font-bold text-gray-800 mb-4">该分类暂无文章</h3>
          <p className="text-gray-600 mb-8">稍后再来看看，或浏览其他分类。</p>
          <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">返回首页</Link>
        </div>
      )}

      {meta.pageCount > 1 && (
        <div className="flex justify-center mt-12">
          <Pagination meta={meta as any} q="" category="" tag="" pageSize={pageSize} />
        </div>
      )}
    </div>
  );
}