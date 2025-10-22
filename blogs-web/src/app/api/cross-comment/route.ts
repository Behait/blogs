import { NextResponse } from "next/server";
import { CMS_URL, makeArticleUrl } from "@/lib/cms";

const CURRENT_SITE_ID = process.env.CURRENT_SITE_ID ?? "";
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 3;
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
    const { articleId } = body || {};
    if (!articleId) {
      return NextResponse.json({ error: "articleId required" }, { status: 400 });
    }

    const fields = `fields=title,slug,summary`;
    const populate = `populate[site][fields]=domain`;
    const filters = `filters[site][id][$ne]=${encodeURIComponent(CURRENT_SITE_ID)}`;
    const url = `${CMS_URL}/api/articles?${fields}&${populate}&${filters}&pagination[pageSize]=50&sort=publishedAt:desc`;
    const sourceRes = await fetch(url, { cache: "no-store" });
    if (!sourceRes.ok) {
      return NextResponse.json({ error: "source_fetch_failed" }, { status: 500 });
    }
    const sourceJson = await sourceRes.json();
    const list = sourceJson?.data || [];
    if (!list.length) {
      return NextResponse.json({ error: "no source article" }, { status: 400 });
    }

    const pick = list[Math.floor(Math.random() * list.length)];
    const authorLink = makeArticleUrl({ slug: pick.slug, site: pick.site?.domain ?? null });

    const payload = {
      data: {
        article: articleId,
        authorName: pick.title,
        authorLink,
        content: `${pick.summary || ""} <a href="${authorLink}" rel="nofollow">阅读全文</a>`,
      },
    };

    const createRes = await fetch(`${CMS_URL}/api/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!createRes.ok) {
      const err = await createRes.text();
      return NextResponse.json({ error: err || "create_failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}