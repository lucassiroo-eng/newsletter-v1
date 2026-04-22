import { mkdirSync, writeFileSync } from "fs";
import { loadConfig } from "./config";
import { fetchRssArticles } from "./fetchers/rss";
import { fetchHackerNewsArticles } from "./fetchers/hackerNews";
import { curateTopStories } from "./curator/claude";
import { buildEmailHtml } from "./email/template";
import { buildWebPageHtml } from "./web/template";
import { sendEmail } from "./email/sender";

async function main(): Promise<void> {
  console.log("=== Daily Tech Newsletter ===");
  const today = new Date().toISOString().split("T")[0]!;
  console.log(`Date: ${today}`);

  const config = loadConfig();
  console.log(`Dry run: ${config.dryRun}`);
  console.log(`Recipient: ${config.toEmail}`);

  console.log("\n[1/4] Fetching news from all sources...");
  const [rssArticles, hnArticles] = await Promise.all([
    fetchRssArticles(),
    fetchHackerNewsArticles(),
  ]);

  const allArticles = [...rssArticles, ...hnArticles];
  console.log(`  RSS: ${rssArticles.length} | HackerNews: ${hnArticles.length}`);
  console.log(`  Total: ${allArticles.length} articles collected`);

  if (allArticles.length === 0) {
    throw new Error("No articles collected from any source. Check network connectivity.");
  }

  console.log("\n[2/4] Curating top 10 stories with Claude AI...");
  const topStories = await curateTopStories(allArticles, today, config.anthropicApiKey);
  console.log(`  Selected ${topStories.length} stories`);
  topStories.forEach((s) => console.log(`  ${s.rank}. [${s.category}] ${s.title}`));

  console.log("\n[3/4] Building email & web page...");
  const html = buildEmailHtml(topStories, today);
  const formattedDate = new Date(today).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const subject = `Daily Tech Digest - ${formattedDate}: Top 10 Startup & Tech Stories`;

  const webHtml = buildWebPageHtml(topStories, today);
  mkdirSync("public", { recursive: true });
  writeFileSync("public/index.html", webHtml, "utf-8");
  console.log("  Web page written → public/index.html");

  console.log("\n[4/4] Sending email...");
  await sendEmail(html, subject, config);

  console.log("\nDone.");
}

main().catch((err) => {
  console.error("\nFatal error:", err instanceof Error ? err.message : err);
  process.exit(1);
});
