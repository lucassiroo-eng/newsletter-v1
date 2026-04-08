import { GoogleGenerativeAI } from "@google/generative-ai";
import type { RawArticle, CuratedStory } from "../types";

const SYSTEM_PROMPT = `You are an expert tech journalist and startup ecosystem analyst who curates a daily newsletter for a sophisticated European reader: a founder, operator, or investor who wants to stay informed about European startups, global VC trends, AI breakthroughs, and meaningful product launches. You have high standards — you prefer substance over hype. You are concise, insightful, and always explain why something matters for people building or funding companies.`;

function deduplicateByUrl(articles: RawArticle[]): RawArticle[] {
  const seen = new Set<string>();
  return articles.filter((a) => {
    if (!a.url || seen.has(a.url)) return false;
    seen.add(a.url);
    return true;
  });
}

export async function curateTopStories(
  articles: RawArticle[],
  date: string,
  apiKey: string
): Promise<CuratedStory[]> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: SYSTEM_PROMPT,
  });

  const unique = deduplicateByUrl(articles);
  console.log(`Sending ${unique.length} unique articles to Gemini for curation...`);

  const prompt = `Today is ${date}. Below are ${unique.length} news articles collected from tech sources in the last 48 hours.

Your job is to:
1. Select the 10 most important, interesting, or actionable stories for a tech founder audience.
   Prioritize: European startup news, significant funding rounds (Series B+), AI/ML breakthroughs with real applications, notable product launches, and market trends that affect how companies are built or funded.
   Deprioritize: minor product updates, generic opinion pieces, US political tech coverage unless directly startup-relevant.

2. For each selected story, produce a JSON object with exactly these fields:
   - "rank": integer 1-10 (1 = most important)
   - "title": the article title, corrected for clarity if needed (keep it short and punchy)
   - "url": exact URL from input, unchanged
   - "source": publication name from input
   - "publishedAt": date string from input, unchanged
   - "summary": 2-3 factual sentences summarizing what happened
   - "whyItMatters": 1 sentence — why a European founder or investor should care today
   - "category": one of exactly: "European Startup" | "VC & Funding" | "AI & Technology" | "Product Launch" | "Market Trends" | "Regulation & Policy"

Return ONLY a valid JSON array of 10 objects. No commentary before or after. No markdown code fences.

ARTICLES:
${JSON.stringify(unique, null, 2)}`;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();

  // Parse JSON — with fallback to strip markdown fences
  let parsed: unknown;
  try {
    parsed = JSON.parse(responseText);
  } catch {
    const match = responseText.match(/\[[\s\S]*\]/);
    if (!match) {
      throw new Error("Gemini did not return a JSON array. Raw response:\n" + responseText.slice(0, 500));
    }
    parsed = JSON.parse(match[0]);
  }

  if (!Array.isArray(parsed)) {
    throw new Error("Gemini returned non-array JSON");
  }

  const stories = parsed as CuratedStory[];
  if (stories.length === 0) {
    throw new Error("Gemini returned an empty array");
  }

  return stories.slice(0, 10);
}
