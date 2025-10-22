"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CommentForm({ articleId }: { articleId: number }) {
  const [authorName, setAuthorName] = useState("");
  const [authorLink, setAuthorLink] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId, authorName, authorLink, content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "提交失败");
      setMessage("评论已提交");
      setAuthorName("");
      setAuthorLink("");
      setContent("");
      router.refresh();
    } catch (err: any) {
      setMessage(err?.message || "网络或服务错误");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="border rounded p-4">
      <h3 className="font-semibold mb-3">发表新评论</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input
          type="text"
          className="border rounded px-3 py-2"
          placeholder="昵称"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          required
        />
        <input
          type="url"
          className="border rounded px-3 py-2"
          placeholder="个人主页 (可选)"
          value={authorLink}
          onChange={(e) => setAuthorLink(e.target.value)}
        />
      </div>
      <textarea
        className="border rounded px-3 py-2 w-full mt-3"
        rows={4}
        placeholder="评论内容"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        required
      />
      <div className="mt-3 flex items-center gap-3">
        <button type="submit" disabled={loading} className="px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-60">
          {loading ? "提交中..." : "提交评论"}
        </button>
        {message && <span className="text-sm text-gray-700">{message}</span>}
      </div>
    </form>
  );
}