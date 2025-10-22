import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const protocol = process.env.BAIDU_PUSH_PROTOCOL || "https";
  const fallbackSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const siteDomain = fallbackSiteUrl.replace(/^https?:\/\//, "");
  const baseUrl = `${protocol}://${siteDomain}`;
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api/private"] }],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}