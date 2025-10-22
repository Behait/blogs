import sanitizeHtml from "sanitize-html";

function cleanContent(input: string) {
  return sanitizeHtml(input || "", {
    allowedTags: ["b", "i", "em", "strong", "a", "p", "br", "ul", "ol", "li", "code", "pre"],
    allowedAttributes: { a: ["href", "rel"] },
    transformTags: {
      a: (tagName, attribs) => ({ tagName, attribs: { ...attribs, rel: "nofollow" } }),
    },
  });
}

function parseList(envKey: string) {
  return (process.env[envKey] || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export default {
  async beforeCreate(event: any) {
    const data = event?.params?.data || {};

    // 清洗与基础校验
    data.content = cleanContent(String(data.content || ""));
    data.authorName = String(data.authorName || "").trim().slice(0, 60);

    // 域名白名单（authorLink）
    if (data.authorLink) {
      try {
        const u = new URL(String(data.authorLink));
        const domainWhitelist = parseList("COMMENT_DOMAIN_WHITELIST");
        if (domainWhitelist.length && !domainWhitelist.includes(u.hostname)) {
          data.authorLink = "";
        } else {
          data.authorLink = u.href;
        }
      } catch {
        data.authorLink = "";
      }
    }

    // 黑白名单（作者/关键词）
    const authorWhitelist = parseList("COMMENT_AUTHOR_WHITELIST");
    const authorBlacklist = parseList("COMMENT_AUTHOR_BLACKLIST");
    const blockedKeywords = parseList("COMMENT_BLOCKED_KEYWORDS");

    const author = (data.authorName || "").toLowerCase();
    const contentLower = String(data.content || "").toLowerCase();

    if (authorWhitelist.length && authorWhitelist.includes(author)) {
      data.status = "pending"; // 可根据业务改为已审核
    }
    if (
      (authorBlacklist.length && authorBlacklist.includes(author)) ||
      (blockedKeywords.length && blockedKeywords.some((kw) => kw && contentLower.includes(kw.toLowerCase())))
    ) {
      data.status = "pending"; // 命中黑名单，强制待审核
    }

    // 频率限制（同作者/同邮箱，每分钟最多 N 条）
    const maxPerMinute = Number(process.env.COMMENT_MAX_PER_MINUTE || "0");
    const authorEmail = String(data.authorEmail || "").toLowerCase();
    if (maxPerMinute > 0) {
      const sinceIso = new Date(Date.now() - 60 * 1000).toISOString();
      try {
        const filters: any = { createdAt: { $gt: sinceIso } };
        if (author) filters.authorName = data.authorName;
        if (authorEmail) filters.authorEmail = data.authorEmail;
        const count = await (strapi as any).entityService.count("api::comment.comment", { filters });
        if (count >= maxPerMinute) {
          throw new Error("Too many comments in a short time");
        }
      } catch (e) {
        // 抛出错误以阻止创建（超频）
        throw e;
      }
    }

    if (!data.status) data.status = "pending";
    event.params.data = data;
  },
};