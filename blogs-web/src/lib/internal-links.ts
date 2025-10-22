import { fetchArticles, makeArticleUrl } from './cms';
import { ensureCurrentSiteIdFromDomain } from './sites';

interface Article {
  id: number;
  title: string;
  slug: string;
  site?: string | null;
  tags?: string[];
  category?: string | null;
}

interface InternalLinkOptions {
  maxLinks?: number;
  minKeywordLength?: number;
  excludeCurrentSlug?: string;
}

const DEFAULT_STOP_WORDS = [
  // 中文常见停用词
  '我们','你','我','是','的','和','或','一个','一些','非常','可能','可以','文章','内容','博客','技术','开发','学习','教程',
  // 英文停用词
  'the','and','or','with','from','into','about','click','read','here','article','content','blog'
];

/**
 * 在HTML内容中自动添加内链
 * @param content 原始HTML内容
 * @param options 配置选项
 * @returns 处理后的HTML内容
 */
export async function addInternalLinks(
  content: string, 
  options: InternalLinkOptions = {}
): Promise<string> {
  const {
    maxLinks = 5,
    minKeywordLength = 2,
    excludeCurrentSlug
  } = options;

  try {
    // 根据域名确保 CURRENT_SITE_ID（用于精准过滤）
    ensureCurrentSiteIdFromDomain();

    // 获取所有文章用于匹配（优先按站点ID过滤）
    const response = await fetchArticles({ pageSize: 200, siteFilter: true });
    const articles = response?.data || [];

    if (!articles || articles.length === 0) {
      return content;
    }

    // 当前站点域名
    const fallbackSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const siteDomain = fallbackSiteUrl.replace(/^https?:\/\//, '');

    // 过滤掉当前文章，且仅保留同域文章
    const availableArticles = articles.filter(
      (article: Article) => article.slug !== excludeCurrentSlug && (!article.site || article.site === siteDomain)
    );

    if (availableArticles.length === 0) {
      return content;
    }

    // 词频统计（用于权重与相似度估算）
    const wordCounts = getWordCounts(content, minKeywordLength);

    // 先屏蔽已有的 <a> 标签，防止重复包装
    const anchorPlaceholders: string[] = [];
    let processedContent = content.replace(/<a\b[^>]*>[\s\S]*?<\/a>/gi, (match) => {
      const key = `__ANCHOR_PLACEHOLDER_${anchorPlaceholders.length}__`;
      anchorPlaceholders.push(match);
      return key;
    });

    let addedLinksCount = 0;
    const usedArticles = new Set<string>();

    // 为每篇文章创建关键词匹配规则（加入词频/相似度评分）
    const MIN_ARTICLE_SCORE = 2; // 低于该分则不插入，避免泛词

    const articleKeywords: ArticleKeyword[] = availableArticles.map((article: Article) => {
      const keywords: { text: string; priority: number; article: Article; weight: number; articleScore: number }[] = [];

       const lower = (s: string) => s.trim().toLowerCase();
       let articleScore = 0;

      // 基于标题/标签/分类在当前内容中的出现频次估算相似度（标题采用分词累加）
      if (article.title) articleScore += countTokensScore(article.title, wordCounts, minKeywordLength) * 4;
      if (article.tags && article.tags.length) {
        for (const t of article.tags) articleScore += (wordCounts[lower(t)] || 0) * 2;
      }
      if (article.category) articleScore += (wordCounts[lower(article.category)] || 0) * 1;

      // 若文章与当前内容几乎无相关性，则跳过
      if (articleScore < MIN_ARTICLE_SCORE) return keywords;

      // 使用文章标题作为主要关键词
      if (article.title && article.title.length >= minKeywordLength && !isStopWord(article.title)) {
        const freq = countTokensScore(article.title, wordCounts, minKeywordLength);
        const weight = 10 + Math.min(freq, 5);
        keywords.push({ text: article.title, priority: 10, article, weight, articleScore });

        // 提取标题中的高频词作为备选关键词（提升匹配成功率，避免过泛）
        const titleTokens = extractTokensFromText(article.title, minKeywordLength);
        for (const t of titleTokens) {
          const tf = wordCounts[t] || 0;
          if (tf > 0) {
            const w = 7 + Math.min(tf, 5);
            keywords.push({ text: t, priority: 8, article, weight: w, articleScore });
          }
        }
      }

      // 使用标签作为关键词
      if (article.tags) {
        article.tags.forEach(tag => {
          if (tag.length >= minKeywordLength && !isStopWord(tag)) {
            const freq = wordCounts[lower(tag)] || 0;
            const weight = 5 + Math.min(freq, 5);
            keywords.push({ text: tag, priority: 5, article, weight, articleScore });
          }
        });
      }

      // 使用分类作为关键词
      if (article.category && article.category.length >= minKeywordLength && !isStopWord(article.category)) {
        const freq = wordCounts[lower(article.category)] || 0;
        const weight = 3 + Math.min(freq, 5);
        keywords.push({ text: article.category, priority: 3, article, weight, articleScore });
      }

      return keywords;
    }).flat();

    // 按文章相似度与关键词权重排序
    articleKeywords.sort((a, b) => {
      if (b.articleScore !== a.articleScore) return b.articleScore - a.articleScore;
      if (b.weight !== a.weight) return b.weight - a.weight;
      return b.priority - a.priority;
    });

    // 在内容中查找并替换关键词
    for (const keyword of articleKeywords) {
      if (addedLinksCount >= maxLinks) break;
      if (usedArticles.has(keyword.article.slug)) continue;

      const regex = buildKeywordRegex(keyword.text);
      const articleUrl = makeInternalArticleUrl(keyword.article);
      const replacement = `<a href="${articleUrl}" class="internal-link" title="${escapeHtml(keyword.article.title)}">$1</a>`;

      // 只替换第一个匹配项
      const prev = processedContent;
      processedContent = processedContent.replace(regex, replacement);

      if (processedContent !== prev) {
        usedArticles.add(keyword.article.slug);
        addedLinksCount++;
      }
    }

    // 恢复原先的链接标签
    anchorPlaceholders.forEach((original, index) => {
      const key = `__ANCHOR_PLACEHOLDER_${index}__`;
      processedContent = processedContent.replace(key, original);
    });

    return processedContent;
  } catch (error) {
    console.error('Error adding internal links:', error);
    return content;
  }
}

/**
 * 转义正则表达式特殊字符
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * 生成文章URL
 */
function makeInternalArticleUrl(article: Article): string {
  return makeArticleUrl({ slug: article.slug, site: article.site });
}

function isStopWord(word: string): boolean {
  const normalized = word.trim().toLowerCase();
  return DEFAULT_STOP_WORDS.includes(normalized);
}

function buildKeywordRegex(text: string): RegExp {
  const hasAscii = /[A-Za-z0-9]/.test(text);
  const escaped = escapeRegExp(text);
  const pattern = hasAscii ? `\\b(${escaped})\\b` : `(${escaped})`;
  return new RegExp(pattern, 'i');
}

/**
 * 提取文本内容中的关键词（用于更智能的匹配）
 */
export function extractKeywords(content: string, minLength = 2): string[] {
  // 移除HTML标签
  const textContent = content.replace(/<[^>]*>/g, ' ');
  
  // 提取中文词汇和英文单词
  const chineseWords = textContent.match(/[\u4e00-\u9fa5]{2,}/g) || [];
  const englishWords = textContent.match(/[a-zA-Z]{3,}/g) || [];
  
  const allWords = [...chineseWords, ...englishWords]
    .filter(word => word.length >= minLength)
    .map(word => word.toLowerCase());
  
  // 统计词频并返回高频词汇
  const wordCount = allWords.reduce((acc, word) => {
    acc[word] = (acc[word] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return Object.entries(wordCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 20)
    .map(([word]) => word);
}

/**
 * 统计词频映射（含 HTML 去除与大小写归一）
 */
function getWordCounts(content: string, minLength = 2): Record<string, number> {
  const textContent = content.replace(/<[^>]*>/g, ' ');
  const lower = textContent.toLowerCase();
  const chineseWords = lower.match(/[\u4e00-\u9fa5]{2,}/g) || [];
  const englishWords = lower.match(/[a-zA-Z]{3,}/g) || [];
  const words = [...chineseWords, ...englishWords].filter(w => w.length >= minLength);
  const counts: Record<string, number> = {};
  for (const w of words) {
    if (isStopWord(w)) continue;
    counts[w] = (counts[w] || 0) + 1;
  }
  return counts;
}

// 从任意文本中提取分词（中文2+字或英文3+字），并去重与停用词过滤
function extractTokensFromText(text: string, minLength = 2): string[] {
  const lower = (text || '').toLowerCase();
  const chineseTokens = lower.match(/[\u4e00-\u9fa5]{2,}/g) || [];
  const englishTokens = lower.match(/[a-zA-Z]{3,}/g) || [];
  const tokens = [...chineseTokens, ...englishTokens].filter(t => t.length >= minLength).filter(t => !isStopWord(t));
  return Array.from(new Set(tokens));
}

// 计算文本分词在词频映射中的总出现次数（用于文章相似度估算）
function countTokensScore(text: string, counts: Record<string, number>, minLength = 2): number {
  const tokens = extractTokensFromText(text, minLength);
  let s = 0;
  for (const t of tokens) s += counts[t] || 0;
  return s;
}

type ArticleKeyword = {
  text: string;
  priority: number;
  article: Article;
  weight: number;
  articleScore: number;
};