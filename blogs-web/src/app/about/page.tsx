import Breadcrumb from "@/components/Breadcrumb";
export const revalidate = 86400;

export default function AboutPage() {
  return (
    <main className="max-w-7xl mx-auto px-6 py-12">
      {/* 面包屑导航 - 统一为共享组件 */}
      <div className="mb-6">
        <Breadcrumb items={[{ label: "关于本站" }]} />
      </div>

      {/* Hero */}
      <section className="text-center mb-10">
        <h1 className="text-4xl font-bold mb-4">
          <span className="bg-gradient-to-r from-brand-600 to-purple-600 bg-clip-text text-transparent">关于本站</span>
        </h1>
        <p className="text-neutral-600 max-w-2xl mx-auto">
          本站使用 Next.js + Strapi 构建，支持多站点与跨站评论，旨在以简洁高效的方式分发内容并优化搜索引擎收录表现。
        </p>
      </section>

      {/* Info Card */}
      <section className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-200/50 shadow-lg p-8">
        <div className="space-y-4 text-neutral-700">
          <p>
            核心特性包括：文章展示、评论提交与审核、按站点筛选、相关推荐与基本 SEO（robots/sitemap、结构化数据）。
          </p>
          <p>
            欢迎反馈问题与建议，后续将逐步完善站群功能、主动推送与性能优化。
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-neutral-200 p-4 bg-neutral-50">
            <div className="text-sm text-neutral-500">框架</div>
            <div className="text-lg font-semibold text-neutral-800">Next.js</div>
          </div>
          <div className="rounded-xl border border-neutral-200 p-4 bg-neutral-50">
            <div className="text-sm text-neutral-500">后端</div>
            <div className="text-lg font-semibold text-neutral-800">Strapi</div>
          </div>
          <div className="rounded-xl border border-neutral-200 p-4 bg-neutral-50">
            <div className="text-sm text-neutral-500">样式</div>
            <div className="text-lg font-semibold text-neutral-800">Tailwind CSS</div>
          </div>
        </div>
      </section>
    </main>
  );
}