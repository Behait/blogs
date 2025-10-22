export default function Loading() {
  return (
    <main className="max-w-2xl mx-auto p-6">
      <div className="h-8 bg-gray-300 rounded w-1/2 animate-pulse mb-4" />
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" />
        ))}
      </div>
    </main>
  );
}