import type { RawArticle } from "../types.js";

interface NewsApiArticle {
  title: string;
  url: string;
  source: { name: string };
  publishedAt: string;
  description?: string;
}

interface NewsApiResponse {
  status: string;
  articles: NewsApiArticle[];
  message?: string;
}

export async function fetchNewsApiArticles(apiKey: string): Promise<RawArticle[]> {
  const yesterday = new Date(Date.now() - 48 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const query = encodeURIComponent(
    '(startup OR "venture capital" OR "Series A" OR "Series B" OR fintech OR deeptech) AND (Europe OR global OR "tech innovation")'
  );

  const url =
    `https://newsapi.org/v2/everything?` +
    `q=${query}&` +
    `from=${yesterday}&` +
    `language=en&` +
    `sortBy=relevancy&` +
    `pageSize=20&` +
    `apiKey=${apiKey}`;

  const res = await fetch(url);
  if (!res.ok) {
    console.warn(`NewsAPI returned ${res.status}`);
    return [];
  }

  const data = (await res.json()) as NewsApiResponse;

  if (data.status !== "ok") {
    console.warn(`NewsAPI error: ${data.message}`);
    return [];
  }

  return data.articles
    .filter((a) => a.title && a.url && !a.title.includes("[Removed]"))
    .map((a): RawArticle => ({
      title: a.title,
      url: a.url,
      source: a.source.name,
      publishedAt: a.publishedAt,
      summary: a.description?.slice(0, 300),
    }));
}
