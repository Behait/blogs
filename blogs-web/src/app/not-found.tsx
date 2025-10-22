import Link from "next/link";

export default function NotFound() {
  return (
    <main className="max-w-2xl mx-auto p-6 text-center">
      <h1 className="text-2xl font-bold mb-2">页面未找到</h1>
      <p className="text-gray-600 mb-4">你访问的文章不存在或已被移除。</p>
      <Link href="/" className="text-blue-600 hover:underline">返回首页</Link>
    </main>
  );
}