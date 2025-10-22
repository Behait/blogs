import { NextResponse } from "next/server";
import { CMS_URL } from "@/lib/cms";

const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;
const rateBucket = new Map<string, { count: number; windowStart: number }>();

function takeToken(ip: string) {
  const now = Date.now();
  const entry = rateBucket.get(ip) || { count: 0, windowStart: now };
  if (now - entry.windowStart > RATE_WINDOW_MS) {
    entry.count = 0;
    entry.windowStart = now;
  }
  entry.count += 1;
  rateBucket.set(ip, entry);
  return entry.count <= RATE_LIMIT_MAX;
}

export async function POST(req: Request) {
  try {
    const ip = (req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown").split(",")[0].trim();
    if (!takeToken(ip)) {
      return NextResponse.json({ error: "too_many_requests" }, { status: 429 });
    }

    const body = await req.json();
    const { articleId, authorName, authorLink, content } = body || {};
    if (!articleId || !content || !authorName) {
      return NextResponse.json({ error: "articleId, authorName, content 必填" }, { status: 400 });
    }
    const name = String(authorName).trim();
    const text = String(content).trim();
    if (!name || name.length > 60) {
      return NextResponse.json({ error: "authorName 长度不合法" }, { status: 400 });
    }
    if (text.length < 3 || text.length > 5000) {
      return NextResponse.json({ error: "content 长度不合法" }, { status: 400 });
    }
    let link = String(authorLink || "").trim();
    if (link) {
      try {
        const u = new URL(link);
        link = u.href;
      } catch {
        link = "";
      }
    }

    const payload = {
      data: {
        article: { id: articleId },
        authorName: name,
        authorLink: link,
        content: text,
      },
    };

    const res = await fetch(`${CMS_URL}/api/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err || "create failed" }, { status: 500 });
    }

    const json = await res.json();
    return NextResponse.json(json);
  } catch (e) {
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}