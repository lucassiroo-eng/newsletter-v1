export interface RawArticle {
  title: string;
  url: string;
  source: string;
  publishedAt: string; // ISO 8601
  summary?: string;
  score?: number; // HN upvote score
}

export interface CuratedStory {
  rank: number;
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  summary: string;
  whyItMatters: string;
  category:
    | "European Startup"
    | "VC & Funding"
    | "AI & Technology"
    | "Product Launch"
    | "Market Trends"
    | "Regulation & Policy";
}

export interface NewsletterConfig {
  anthropicApiKey: string;
  resendApiKey: string;
  toEmail: string;
  fromEmail: string;
  newsApiKey: string;
  dryRun: boolean;
}
