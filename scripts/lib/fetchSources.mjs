import Parser from "rss-parser";

const parser = new Parser({
  timeout: 10_000,
  headers: { "User-Agent": "Mozilla/5.0 (newsletter-bot)" },
});
const CUTOFF_HOURS = 72;

const RSS_PATH_CANDIDATES = [
  "/feed",
  "/feed/",
  "/rss",
  "/rss/",
  "/feed.xml",
  "/atom.xml",
  "/rss.xml",
  "/feeds/all.atom.xml",
  "/index.xml",
];

function getBaseUrl(url) {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.host}`;
  } catch {
    return url;
  }
}

async function tryParseRss(url) {
  const feed = await parser.parseURL(url);
  return feed.items || [];
}

async function discoverAndFetchRss(source) {
  const cutoff = new Date(Date.now() - CUTOFF_HOURS * 60 * 60 * 1000);
  const base = getBaseUrl(source.url);
  const urlsToTry = [source.url, ...RSS_PATH_CANDIDATES.map((p) => base + p)];
  const tried = new Set();

  for (const url of urlsToTry) {
    if (tried.has(url)) continue;
    tried.add(url);
    try {
      const items = await tryParseRss(url);
      if (items.length > 0) {
        console.log(`  [rss] Found feed at ${url} (${items.length} items)`);
        return items
          .filter((item) => {
            if (!item.isoDate) return true;
            return new Date(item.isoDate) >= cutoff;
          })
          .slice(0, 15)
          .map((item) => ({
            title: item.title ?? "(no title)",
            url: item.link ?? "",
            source: source.name,
            publishedAt: item.isoDate ?? new Date().toISOString(),
            summary: item.contentSnippet?.slice(0, 300),
          }));
      }
    } catch {
      // Try next path
    }
  }
  console.log(`  [rss] No feed found for ${source.name} after trying ${tried.size} URLs`);
  return [];
}

export async function fetchFromGoogleNews(query, sourceName) {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en&gl=US&ceid=US:en`;
  try {
    const feed = await parser.parseURL(url);
    const cutoff = new Date(Date.now() - CUTOFF_HOURS * 60 * 60 * 1000);
    return (feed.items || [])
      .filter((item) => {
        if (!item.isoDate) return true;
        return new Date(item.isoDate) >= cutoff;
      })
      .slice(0, 15)
      .map((item) => ({
        title: item.title?.replace(/ - .*$/, "") ?? "(no title)",
        url: item.link ?? "",
        source: sourceName || "Google News",
        publishedAt: item.isoDate ?? new Date().toISOString(),
        summary: item.contentSnippet?.slice(0, 300),
      }));
  } catch (err) {
    console.warn(`  [!] Google News failed for "${query}": ${err.message}`);
    return [];
  }
}

export async function fetchFromHackerNews(query, sourceName) {
  const cutoff = Math.floor(
    (Date.now() - CUTOFF_HOURS * 60 * 60 * 1000) / 1000
  );
  const url =
    `https://hn.algolia.com/api/v1/search?` +
    `query=${encodeURIComponent(query)}&` +
    `tags=story&` +
    `numericFilters=points>=5,created_at_i>=${cutoff}&` +
    `hitsPerPage=25`;

  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return data.hits
      .filter((hit) => hit.url)
      .map((hit) => ({
        title: hit.title,
        url: hit.url,
        source: sourceName || "Hacker News",
        publishedAt: hit.created_at,
        score: hit.points,
      }));
  } catch (err) {
    console.warn(`  [!] HN search failed for "${query}": ${err.message}`);
    return [];
  }
}

async function fetchForSource(source) {
  let articles = [];

  // 1. Try RSS (auto-discover feed if URL is a website)
  if (source.url) {
    articles = await discoverAndFetchRss(source);
    if (articles.length > 0) return articles;
  }

  // 2. Google News search by source name
  console.log(`  [~] Trying Google News for "${source.name}"...`);
  articles = await fetchFromGoogleNews(source.name, source.name);
  if (articles.length > 0) return articles;

  // 3. Hacker News search by source name
  console.log(`  [~] Trying Hacker News for "${source.name}"...`);
  articles = await fetchFromHackerNews(source.name, source.name);
  return articles;
}

function extractKeywords(topic) {
  const cleaned = topic
    .replace(/^(actúa como|act as|you are|eres)[\s\S]{0,80}?(,|\.|\n)/i, "")
    .replace(/[^a-záéíóúñüA-Z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .slice(0, 5)
    .join(" ");
  return cleaned || topic.split(/\s+/).slice(0, 5).join(" ");
}

export async function fetchArticlesForSources(sources, topic) {
  const activeSources = sources.filter((s) => s.is_active);
  const keywords = topic ? extractKeywords(topic) : "";

  // 1. Fetch from explicit sources
  const sourceResults = await Promise.allSettled(
    activeSources.map((s) => fetchForSource(s))
  );

  const articles = [];
  for (const result of sourceResults) {
    if (result.status === "fulfilled") articles.push(...result.value);
  }
  console.log(`  [sources] ${articles.length} articles from explicit sources`);

  // 2. ALWAYS enrich with Google News + HN for the topic (diverse coverage)
  if (keywords) {
    const topicSearches = [
      `${keywords} technology`,
      `${keywords} startup`,
      `${keywords} AI`,
    ];
    for (const query of topicSearches) {
      console.log(`  [enrich] Google News: "${query}"`);
      const gnArticles = await fetchFromGoogleNews(query, "Google News");
      articles.push(...gnArticles);
    }

    console.log(`  [enrich] Hacker News: "${keywords}"`);
    const hnArticles = await fetchFromHackerNews(keywords, "Hacker News");
    articles.push(...hnArticles);
  }

  // 3. Fallback: broad search if still nothing
  if (articles.length === 0) {
    console.log("  [fallback] Broad: AI startup technology");
    const broad = await fetchFromHackerNews("AI startup technology", "Web");
    articles.push(...broad);
  }

  const seen = new Set();
  return articles.filter((a) => {
    if (!a.url || seen.has(a.url)) return false;
    seen.add(a.url);
    return true;
  });
}
