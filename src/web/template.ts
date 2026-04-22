import type { CuratedStory } from "../types";

const CATEGORY_STYLES: Record<string, { bg: string; text: string }> = {
  "European Startup":    { bg: "#e8f5e9", text: "#2e7d32" },
  "VC & Funding":        { bg: "#e8eaf6", text: "#3949ab" },
  "AI & Technology":     { bg: "#e3f2fd", text: "#1565c0" },
  "Product Launch":      { bg: "#fff3e0", text: "#e65100" },
  "Market Trends":       { bg: "#f3e5f5", text: "#6a1b9a" },
  "Regulation & Policy": { bg: "#fce4ec", text: "#ad1457" },
};

const RANK_COLORS = [
  "#1a1a2e", "#0066cc", "#0088aa", "#006633", "#884400",
  "#660099", "#cc0066", "#005566", "#445500", "#770033",
];

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric", month: "short", year: "numeric",
    });
  } catch {
    return iso;
  }
}

function storyCard(story: CuratedStory): string {
  const cat = CATEGORY_STYLES[story.category] ?? { bg: "#f5f5f5", text: "#333" };
  const rankColor = RANK_COLORS[(story.rank - 1) % RANK_COLORS.length]!;

  return `
    <article class="card">
      <div class="card-top">
        <div class="rank" style="background:${rankColor}">${story.rank}</div>
        <span class="category" style="background:${cat.bg};color:${cat.text}">${story.category}</span>
      </div>
      <h2><a href="${story.url}" target="_blank" rel="noopener">${story.title}</a></h2>
      <p class="summary">${story.summary}</p>
      <div class="card-footer">
        <span class="source">${story.source} &middot; ${formatDate(story.publishedAt)}</span>
        <a href="${story.url}" target="_blank" rel="noopener" class="read-btn">Read &rarr;</a>
      </div>
    </article>`;
}

export function buildWebPageHtml(stories: CuratedStory[], date: string): string {
  const formattedDate = new Date(date).toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  const updatedAt = new Date().toLocaleTimeString("en-GB", {
    hour: "2-digit", minute: "2-digit", timeZone: "UTC",
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Daily curated tech &amp; startup news — ${formattedDate}">
  <title>Daily Tech Digest — ${formattedDate}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --navy: #1a1a2e;
      --blue: #0066cc;
      --bg: #f0f2f5;
      --card: #fff;
      --text: #111827;
      --muted: #6b7280;
      --border: #e5e7eb;
      --radius: 16px;
      --shadow: 0 1px 3px rgba(0,0,0,.06), 0 4px 16px rgba(0,0,0,.05);
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
    }

    header {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%);
      color: #fff;
      padding: 56px 24px 48px;
      text-align: center;
    }
    .header-label {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 3px;
      text-transform: uppercase;
      color: #7986cb;
      margin-bottom: 14px;
    }
    header h1 {
      font-size: clamp(26px, 5vw, 46px);
      font-weight: 800;
      letter-spacing: -0.5px;
      margin-bottom: 12px;
    }
    .header-date { font-size: 16px; color: #90caf9; margin-bottom: 10px; }
    .header-sub {
      font-size: 14px;
      color: rgba(255,255,255,.55);
      max-width: 480px;
      margin: 0 auto 20px;
    }
    .updated-badge {
      display: inline-block;
      font-size: 12px;
      color: rgba(255,255,255,.45);
      border: 1px solid rgba(255,255,255,.15);
      border-radius: 20px;
      padding: 4px 14px;
    }

    main {
      max-width: 1120px;
      margin: 0 auto;
      padding: 44px 20px 60px;
    }
    .section-title {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: var(--muted);
      margin-bottom: 24px;
      padding-bottom: 12px;
      border-bottom: 2px solid var(--border);
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(460px, 1fr));
      gap: 20px;
    }
    @media (max-width: 540px) { .grid { grid-template-columns: 1fr; } }

    .card {
      background: var(--card);
      border-radius: var(--radius);
      border: 1px solid var(--border);
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      box-shadow: var(--shadow);
      transition: box-shadow .2s ease, transform .2s ease;
    }
    .card:hover {
      box-shadow: 0 4px 14px rgba(0,0,0,.1), 0 12px 32px rgba(0,0,0,.08);
      transform: translateY(-3px);
    }
    .card-top { display: flex; align-items: center; gap: 10px; }
    .rank {
      flex-shrink: 0;
      width: 34px;
      height: 34px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: 800;
      color: #fff;
    }
    .category {
      display: inline-block;
      padding: 3px 11px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: .4px;
      text-transform: uppercase;
    }
    .card h2 { font-size: 17px; font-weight: 700; line-height: 1.35; letter-spacing: -.2px; }
    .card h2 a { color: var(--navy); text-decoration: none; }
    .card h2 a:hover { color: var(--blue); text-decoration: underline; }
    .summary { font-size: 14px; color: #374151; line-height: 1.65; flex: 1; }
    .card-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding-top: 14px;
      border-top: 1px solid var(--border);
      flex-wrap: wrap;
    }
    .source { font-size: 12px; color: var(--muted); }
    .read-btn {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 13px;
      font-weight: 600;
      color: var(--blue);
      text-decoration: none;
      padding: 6px 14px;
      border-radius: 8px;
      background: #e8f0fe;
      white-space: nowrap;
      transition: background .15s;
    }
    .read-btn:hover { background: #d2e3fc; }

    footer {
      text-align: center;
      padding: 28px 24px;
      font-size: 13px;
      color: var(--muted);
      border-top: 1px solid var(--border);
    }
    footer p + p { margin-top: 6px; }
    footer a { color: var(--blue); text-decoration: none; }
  </style>
</head>
<body>
  <header>
    <p class="header-label">Daily Tech Digest</p>
    <h1>Top 10 Tech &amp; Startup News</h1>
    <p class="header-date">${formattedDate}</p>
    <p class="header-sub">AI-curated daily briefing on European startups, global VC &amp; tech innovation</p>
    <span class="updated-badge">Updated at ${updatedAt} UTC</span>
  </header>

  <main>
    <p class="section-title">Today's top stories</p>
    <div class="grid">
      ${stories.map(storyCard).join("\n")}
    </div>
  </main>

  <footer>
    <p>Sources: TechCrunch &middot; EU-Startups &middot; Sifted &middot; The Next Web &middot; VentureBeat &middot; Wired &middot; Hacker News</p>
    <p>Curated by <a href="https://anthropic.com" target="_blank" rel="noopener">Claude AI</a> &middot; Delivered automatically every morning</p>
  </footer>
</body>
</html>`;
}
