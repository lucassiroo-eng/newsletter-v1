import Parser from "rss-parser";

const parser = new Parser();
const CUTOFF_HOURS = 48;

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
    console.warn(`  [!] RSS fetch failed for ${source.name}: ${err.message}`);
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
    `numericFilters=points>=10,created_at_i>=${cutoff}&` +
    `hitsPerPage=20`;

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

function fetchForSource(source) {
  if (source.url) {
    if (source.source_type === "hackernews") {
      return fetchFromHackerNews(source.name, source.name);
    }
    return fetchFromRss(source);
  }
  // No URL — search Hacker News by source name
  return fetchFromHackerNews(source.name, source.name);
}

export async function fetchArticlesForSources(sources, topic) {
  const activeSources = sources.filter((s) => s.is_active);

  // Fetch from each source
  const results = await Promise.allSettled(
    activeSources.map((s) => fetchForSource(s))
  );

  const articles = [];
  for (const result of results) {
    if (result.status === "fulfilled") articles.push(...result.value);
  }

  // If no articles from sources, search HN by newsletter topic as fallback
  if (articles.length === 0 && topic) {
    console.log(`  [fallback] Searching Hacker News for topic: "${topic}"`);
    const topicArticles = await fetchFromHackerNews(topic, "Web");
    articles.push(...topicArticles);
  }

  const seen = new Set();
  return articles.filter((a) => {
    if (!a.url || seen.has(a.url)) return false;
    seen.add(a.url);
    return true;
  });
}
