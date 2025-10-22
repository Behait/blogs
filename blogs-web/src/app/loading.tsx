export default function Loading() {
  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">文章列表</h1>
      <ul className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <li key={i} className="border p-4 rounded animate-pulse">
            <div className="h-4 bg-gray-300 rounded w-1/3" />
            <div className="h-3 bg-gray-200 rounded w-2/3 mt-2" />
          </li>
        ))}
      </ul>
    </main>
  );
}