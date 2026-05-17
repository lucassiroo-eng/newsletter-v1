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

export async function fetchFromHackerNews(source) {
  const cutoff = Math.floor(
    (Date.now() - CUTOFF_HOURS * 60 * 60 * 1000) / 1000
  );
  const query = source.name || "technology";
  const url =
    `https://hn.algolia.com/api/v1/search?` +
    `query=${encodeURIComponent(query)}&` +
    `tags=story&` +
    `numericFilters=points>=30,created_at_i>=${cutoff}&` +
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
        source: "Hacker News",
        publishedAt: hit.created_at,
        score: hit.points,
      }));
  } catch (err) {
    console.warn(`  [!] HN fetch failed: ${err.message}`);
    return [];
  }
}

export async function fetchArticlesForSources(sources) {
  const results = await Promise.allSettled(
    sources
      .filter((s) => s.is_active)
      .map((s) => {
        if (s.source_type === "hackernews") return fetchFromHackerNews(s);
        return fetchFromRss(s);
      })
  );

  const articles = [];
  for (const result of results) {
    if (result.status === "fulfilled") articles.push(...result.value);
  }

  const seen = new Set();
  return articles.filter((a) => {
    if (!a.url || seen.has(a.url)) return false;
    seen.add(a.url);
    return true;
  });
}
