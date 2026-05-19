import Parser from "rss-parser";

const parser = new Parser();
const CUTOFF_HOURS = 72;

export async function fetchFromRss(source) {
  const cutoff = new Date(Date.now() - CUTOFF_HOURS * 60 * 60 * 1000);
  try {
    const feed = await parser.parseURL(source.url);
    return feed.items
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
  } catch (err) {
    console.warn(`  [!] RSS parse failed for ${source.name} (${source.url}): ${err.message}`);
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
  // Only attempt RSS parsing for explicit RSS sources with URLs
  if (source.source_type === "rss" && source.url) {
    const rssArticles = await fetchFromRss(source);
    if (rssArticles.length > 0) return rssArticles;
    // RSS failed — fall through to HN search
  }

  // For all other types, or RSS fallback: search Hacker News by source name
  console.log(`  [~] Searching HN for "${source.name}"...`);
  return fetchFromHackerNews(source.name, source.name);
}

function extractKeywords(topic) {
  // Strip common prompt-like prefixes and extract meaningful words
  const cleaned = topic
    .replace(/^(actúa como|act as|you are|eres)[\s\S]{0,50}?(,|\.|\n)/i, "")
    .replace(/[^a-záéíóúñüA-Z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .slice(0, 5)
    .join(" ");
  return cleaned || topic.split(/\s+/).slice(0, 5).join(" ");
}

export async function fetchArticlesForSources(sources, topic) {
  const activeSources = sources.filter((s) => s.is_active);

  const results = await Promise.allSettled(
    activeSources.map((s) => fetchForSource(s))
  );

  const articles = [];
  for (const result of results) {
    if (result.status === "fulfilled") articles.push(...result.value);
  }

  // Fallback: search HN with simplified topic keywords
  if (articles.length === 0 && topic) {
    const keywords = extractKeywords(topic);
    console.log(`  [fallback] Searching HN for topic keywords: "${keywords}"`);
    const topicArticles = await fetchFromHackerNews(keywords, "Web");
    articles.push(...topicArticles);
  }

  // Second fallback: broad tech/startup search
  if (articles.length === 0) {
    console.log("  [fallback] Broad search: AI startup technology");
    const broadArticles = await fetchFromHackerNews("AI startup technology", "Web");
    articles.push(...broadArticles);
  }

  const seen = new Set();
  return articles.filter((a) => {
    if (!a.url || seen.has(a.url)) return false;
    seen.add(a.url);
    return true;
  });
}
