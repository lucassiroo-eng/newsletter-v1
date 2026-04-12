import type { RawArticle } from "../types";

interface HNHit {
  title: string;
  url?: string;
  points: number;
  created_at: string;
  objectID: string;
}

interface HNResponse {
  hits: HNHit[];
}

const KEYWORDS = [
  "startup",
  "venture capital",
  "Series A",
  "Series B",
  "funding round",
  "European tech",
  "AI startup",
  "fintech",
  "deeptech",
];

const MIN_SCORE = 50;

export async function fetchHackerNewsArticles(): Promise<RawArticle[]> {
  const query = KEYWORDS.slice(0, 3).join(" OR ");
  const cutoff = Math.floor((Date.now() - 48 * 60 * 60 * 1000) / 1000);

  const url =
    `https://hn.algolia.com/api/v1/search?` +
    `query=${encodeURIComponent(query)}&` +
    `tags=story&` +
    `numericFilters=points>=${MIN_SCORE},created_at_i>=${cutoff}&` +
    `hitsPerPage=20`;

  const res = await fetch(url);
  if (!res.ok) {
    console.warn(`HN API returned ${res.status}`);
    return [];
  }

  const data = (await res.json()) as HNResponse;

  return data.hits
    .filter((hit) => hit.url)
    .map((hit): RawArticle => ({
      title: hit.title,
      url: hit.url!,
      source: "Hacker News",
      publishedAt: hit.created_at,
      score: hit.points,
    }));
}
