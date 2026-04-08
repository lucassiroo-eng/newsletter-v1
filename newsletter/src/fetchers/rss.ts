import Parser from "rss-parser";
import type { RawArticle } from "../types";

const parser = new Parser();

const FEEDS: { name: string; url: string }[] = [
  // Global tech & startups
  { name: "TechCrunch", url: "https://techcrunch.com/category/startups/feed/" },
  { name: "TechCrunch AI", url: "https://techcrunch.com/category/artificial-intelligence/feed/" },
  { name: "VentureBeat", url: "https://venturebeat.com/feed/" },
  { name: "Wired Business", url: "https://www.wired.com/feed/category/business/latest/rss" },
  { name: "MIT Technology Review", url: "https://www.technologyreview.com/feed/" },
  // European startup ecosystem
  { name: "EU-Startups", url: "https://www.eu-startups.com/feed/" },
  { name: "Sifted", url: "https://sifted.eu/feed" },
  { name: "The Next Web", url: "https://thenextweb.com/feed" },
  // VC & funding
  { name: "Y Combinator Blog", url: "https://www.ycombinator.com/blog/rss.xml" },
  { name: "a16z", url: "https://a16z.com/feed/" },
];

const CUTOFF_HOURS = 48;

export async function fetchRssArticles(): Promise<RawArticle[]> {
  const cutoff = new Date(Date.now() - CUTOFF_HOURS * 60 * 60 * 1000);

  const results = await Promise.allSettled(
    FEEDS.map(async ({ name, url }) => {
      const feed = await parser.parseURL(url);
      return feed.items
        .filter((item) => {
          if (!item.isoDate) return true;
          return new Date(item.isoDate) >= cutoff;
        })
        .slice(0, 10)
        .map((item): RawArticle => ({
          title: item.title ?? "(no title)",
          url: item.link ?? "",
          source: name,
          publishedAt: item.isoDate ?? new Date().toISOString(),
          summary: item.contentSnippet?.slice(0, 300),
        }));
    })
  );

  const articles: RawArticle[] = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
      articles.push(...result.value);
    } else {
      console.warn(`RSS fetch failed for one source: ${result.reason}`);
    }
  }

  return articles;
}
