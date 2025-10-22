"use client";

import { useState } from "react";

export default function CrossCommentButton({ articleId }: { articleId: number }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/cross-comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId }),
      });
      const data = await res.json();
      if (data.ok) setMessage("已生成并提交站群评论");
      else setMessage(data.error || "提交失败");
    } catch (e) {
      setMessage("网络或服务错误");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4">
      <button
        onClick={handleClick}
        disabled={loading}
        className="px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-60"
      >
        {loading ? "提交中..." : "生成站群评论"}
      </button>
      {message && <p className="text-sm mt-2 text-gray-700">{message}</p>}
    </div>
  );
}