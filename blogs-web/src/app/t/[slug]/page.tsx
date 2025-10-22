import { fetchArticlesFiltered, fetchTags } from "@/lib/cms";
import DynamicArticleCard from "@/components/DynamicArticleCard";
import Pagination from "@/components/Pagination";
import Breadcrumb, { generateTagBreadcrumb } from "@/components/Breadcrumb";
import Link from "next/link";
import type { Metadata } from 'next';

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { slug } = params;
  const tags = await fetchTags();
  const tag = Array.isArray(tags) ? tags.find((t: any) => t.slug === slug) : null;
  const name = tag?.name || slug;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return {
    title: `标签：${name} | 技术博客`,
    description: `标签 ${name} 下的最新技术文章列表`,
    alternates: { canonical: `${siteUrl}/t/${slug}` },
    robots: { index: true, follow: true },
  };
}

export default async function TagPage({ params, searchParams }: { params: { slug: string }; searchParams?: { [key: string]: string | string[] | undefined } }) {
  const { slug } = params;
  const s = searchParams || {};
  const page = parseInt(String((s as any).page || "1")) || 1;
  const pageSize = 20;

  const [tags, articlesData] = await Promise.all([
    fetchTags(),
    fetchArticlesFiltered({ page, pageSize, tag: slug }),
  ]);

  const tag = Array.isArray(tags) ? tags.find((t: any) => t.slug === slug) : null;
  const name = tag?.name || slug;
  const items = articlesData.items || [];
  const meta = { page: articlesData.pagination.page, pageCount: articlesData.pagination.pageCount };

  const breadcrumbItems = generateTagBreadcrumb(name);

  return (
    <div className="mx-auto px-4 md:max-w-7xl md:px-6 py-8">
      <div className="mb-6">
        <Breadcrumb items={breadcrumbItems} />
      </div>

      {items.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((article: any) => (
            <DynamicArticleCard key={article.id} article={article} featured={false} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🏷️</div>
          <h3 className="text-2xl font-bold text-gray-800 mb-4">该标签暂无文章</h3>
          <p className="text-gray-600 mb-8">稍后再来看看，或浏览其他标签。</p>
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