"use client";
import { useRouter } from "next/navigation";

export default function Pagination({ meta, q, category, tag, pageSize }: { meta: any; q: string; category: string; tag: string; pageSize: number }) {
  const router = useRouter();
  const page = meta?.page || 1;
  const pageCount = meta?.pageCount || 1;

  function go(to: number) {
    const basePath = category
      ? `/c/${category}`
      : tag
      ? `/t/${tag}`
      : `/`;

    const sp = new URLSearchParams();
    sp.set("page", String(to));
    sp.set("pageSize", String(pageSize));

    // 仅在首页保留搜索参数（新键为 search）
    if (!category && !tag && q) {
      sp.set("search", q);
    }

    router.push(`${basePath}?${sp.toString()}`);
  }

  const pages: number[] = [];
  const maxShown = 7;
  const start = Math.max(1, page - Math.floor(maxShown / 2));
  const end = Math.min(pageCount, start + maxShown - 1);
  for (let i = Math.max(1, end - maxShown + 1); i <= end; i++) pages.push(i);

  return (
    <nav className="flex items-center justify-center gap-2" aria-label="分页导航">
      <button
        className="px-3 py-2 rounded-xl border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
        disabled={page <= 1}
        onClick={() => go(page - 1)}
      >
        上一页
      </button>

      {start > 1 && (
        <>
          <button
            className="px-3 py-2 rounded-xl border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
            onClick={() => go(1)}
            aria-label="前往第1页"
          >
            1
          </button>
          {start > 2 && <span className="px-2 text-neutral-400">…</span>}
        </>
      )}

      {pages.map((p) => (
        <button
          key={p}
          className={`px-3 py-2 rounded-xl border ${p === page ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'}`}
          onClick={() => go(p)}
          aria-current={p === page ? 'page' : undefined}
        >
          {p}
        </button>
      ))}

      {end < pageCount && (
        <>
          {end < pageCount - 1 && <span className="px-2 text-neutral-400">…</span>}
          <button
            className="px-3 py-2 rounded-xl border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
            onClick={() => go(pageCount)}
            aria-label={`前往第${pageCount}页`}
          >
            {pageCount}
          </button>
        </>
      )}

      <button
        className="px-3 py-2 rounded-xl border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
        disabled={page >= pageCount}
        onClick={() => go(page + 1)}
      >
        下一页
      </button>
    </nav>
  );
}