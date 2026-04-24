import type { CuratedStory } from "../types";

const CAT: Record<string, { bg: string; text: string }> = {
  "European Startup":    { bg: "#dcfce7", text: "#15803d" },
  "VC & Funding":        { bg: "#e0e7ff", text: "#4338ca" },
  "AI & Technology":     { bg: "#dbeafe", text: "#1d4ed8" },
  "Product Launch":      { bg: "#ffedd5", text: "#c2410c" },
  "Market Trends":       { bg: "#f3e8ff", text: "#7e22ce" },
  "Regulation & Policy": { bg: "#fce7f3", text: "#be185d" },
};

const CAT_DARK: Record<string, { bg: string; text: string }> = {
  "European Startup":    { bg: "#14532d", text: "#86efac" },
  "VC & Funding":        { bg: "#1e1b4b", text: "#a5b4fc" },
  "AI & Technology":     { bg: "#1e3a5f", text: "#93c5fd" },
  "Product Launch":      { bg: "#431407", text: "#fdba74" },
  "Market Trends":       { bg: "#3b0764", text: "#d8b4fe" },
  "Regulation & Policy": { bg: "#500724", text: "#f9a8d4" },
};

const RANK_COLORS = [
  "#6366f1","#3b82f6","#0ea5e9","#10b981","#f59e0b",
  "#ef4444","#8b5cf6","#ec4899","#14b8a6","#f97316",
];

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  } catch { return iso; }
}

function featuredCard(s: CuratedStory): string {
  const color = RANK_COLORS[0]!;
  const c = CAT[s.category] ?? { bg: "#f1f5f9", text: "#475569" };
  const cd = CAT_DARK[s.category] ?? { bg: "#1e293b", text: "#94a3b8" };
  return `
  <a href="${s.url}" target="_blank" rel="noopener" class="featured-card" data-cat="${s.category}">
    <div class="featured-inner">
      <div class="featured-top">
        <div class="rank-badge" style="background:${color}">#1</div>
        <span class="cat featured-cat" style="--cat-bg:${c.bg};--cat-bg-d:${cd.bg};--cat-text:${c.text};--cat-text-d:${cd.text}">${s.category}</span>
        <span class="featured-label">Featured Story</span>
      </div>
      <h2 class="featured-title">${s.title}</h2>
      <p class="featured-summary">${s.summary}</p>
      <div class="featured-meta">
        <span class="source-txt">${s.source} &middot; ${formatDate(s.publishedAt)}</span>
        <span class="read-btn">Read full story &rarr;</span>
      </div>
    </div>
  </a>`;
}

function storyCard(s: CuratedStory): string {
  const color = RANK_COLORS[(s.rank - 1) % RANK_COLORS.length]!;
  const c = CAT[s.category] ?? { bg: "#f1f5f9", text: "#475569" };
  const cd = CAT_DARK[s.category] ?? { bg: "#1e293b", text: "#94a3b8" };
  return `
  <a href="${s.url}" target="_blank" rel="noopener" class="card" data-cat="${s.category}">
    <div class="card-top">
      <div class="rank-num" style="color:${color}">${s.rank}</div>
      <span class="cat" style="--cat-bg:${c.bg};--cat-bg-d:${cd.bg};--cat-text:${c.text};--cat-text-d:${cd.text}">${s.category}</span>
    </div>
    <h3 class="card-title">${s.title}</h3>
    <p class="card-summary">${s.summary}</p>
    <div class="card-footer">
      <span class="source-txt">${s.source} &middot; ${formatDate(s.publishedAt)}</span>
      <span class="read-link">Read &rarr;</span>
    </div>
  </a>`;
}

export function buildWebPageHtml(stories: CuratedStory[], date: string): string {
  const formattedDate = new Date(date).toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  const updatedAt = new Date().toLocaleTimeString("en-GB", {
    hour: "2-digit", minute: "2-digit", timeZone: "UTC",
  });

  const [top, ...rest] = stories;
  const categories = [...new Set(stories.map(s => s.category))];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Daily AI-curated tech &amp; startup news">
  <title>Daily Tech Digest &mdash; ${formattedDate}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg: #f8f9fc;
      --bg2: #ffffff;
      --border: #e2e8f0;
      --text: #0f172a;
      --text2: #475569;
      --text3: #94a3b8;
      --accent: #6366f1;
      --shadow-sm: 0 1px 2px rgba(0,0,0,.05);
      --shadow: 0 4px 6px -1px rgba(0,0,0,.07), 0 2px 4px -2px rgba(0,0,0,.05);
      --shadow-lg: 0 10px 15px -3px rgba(0,0,0,.08), 0 4px 6px -4px rgba(0,0,0,.05);
      --radius: 14px;
      --font: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }

    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #0b0f1a;
        --bg2: #111827;
        --border: #1f2937;
        --text: #f1f5f9;
        --text2: #94a3b8;
        --text3: #4b5563;
        --shadow-sm: 0 1px 2px rgba(0,0,0,.3);
        --shadow: 0 4px 6px -1px rgba(0,0,0,.4), 0 2px 4px -2px rgba(0,0,0,.3);
        --shadow-lg: 0 10px 15px -3px rgba(0,0,0,.5), 0 4px 6px -4px rgba(0,0,0,.3);
      }
    }

    html { scroll-behavior: smooth; }
    body {
      font-family: var(--font);
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
    }

    header {
      background: linear-gradient(160deg, #0f0c29 0%, #1a1a4e 40%, #24243e 100%);
      padding: 60px 24px 52px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    header::before {
      content: '';
      position: absolute;
      inset: 0;
      background: radial-gradient(ellipse at 50% 0%, rgba(99,102,241,.25) 0%, transparent 70%);
      pointer-events: none;
    }
    .header-inner { position: relative; max-width: 680px; margin: 0 auto; }
    .header-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(99,102,241,.2);
      border: 1px solid rgba(99,102,241,.35);
      border-radius: 100px;
      padding: 4px 14px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: #a5b4fc;
      margin-bottom: 20px;
    }
    .header-chip::before { content: '●'; font-size: 7px; color: #6366f1; }
    header h1 {
      font-size: clamp(30px, 6vw, 54px);
      font-weight: 900;
      color: #fff;
      letter-spacing: -1.5px;
      line-height: 1.1;
      margin-bottom: 14px;
    }
    header h1 span { color: #818cf8; }
    .header-date { font-size: 15px; color: rgba(255,255,255,.55); font-weight: 500; margin-bottom: 20px; }
    .header-badge {
      display: inline-block;
      font-size: 12px;
      color: rgba(255,255,255,.35);
      border: 1px solid rgba(255,255,255,.12);
      border-radius: 100px;
      padding: 5px 16px;
    }

    .filter-wrap {
      position: sticky;
      top: 0;
      z-index: 100;
      background: var(--bg2);
      border-bottom: 1px solid var(--border);
      box-shadow: var(--shadow-sm);
    }
    .filter-bar {
      max-width: 1200px;
      margin: 0 auto;
      padding: 12px 20px;
      display: flex;
      gap: 8px;
      overflow-x: auto;
      scrollbar-width: none;
    }
    .filter-bar::-webkit-scrollbar { display: none; }
    .filter-btn {
      flex-shrink: 0;
      padding: 6px 16px;
      border-radius: 100px;
      border: 1px solid var(--border);
      background: transparent;
      color: var(--text2);
      font-family: var(--font);
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all .15s;
      white-space: nowrap;
    }
    .filter-btn:hover { border-color: var(--accent); color: var(--accent); }
    .filter-btn.active { background: var(--accent); border-color: var(--accent); color: #fff; }

    main { max-width: 1200px; margin: 0 auto; padding: 36px 20px 64px; }

    .featured-card {
      display: block;
      text-decoration: none;
      color: inherit;
      background: var(--bg2);
      border: 1px solid var(--border);
      border-left: 4px solid #6366f1;
      border-radius: 20px;
      overflow: hidden;
      margin-bottom: 28px;
      box-shadow: var(--shadow);
      transition: box-shadow .25s ease, transform .25s ease;
    }
    .featured-card:hover { box-shadow: var(--shadow-lg); transform: translateY(-3px); }
    .featured-inner { padding: 32px 36px; }
    .featured-top { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; flex-wrap: wrap; }
    .rank-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      font-size: 12px;
      font-weight: 800;
      color: #fff;
      flex-shrink: 0;
    }
    .featured-label { font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #6366f1; }
    .featured-title {
      font-size: clamp(20px, 3vw, 28px);
      font-weight: 800;
      letter-spacing: -0.5px;
      line-height: 1.25;
      margin-bottom: 14px;
      color: var(--text);
    }
    .featured-summary { font-size: 15px; color: var(--text2); line-height: 1.7; margin-bottom: 20px; max-width: 780px; }
    .featured-meta { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }

    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
    @media (max-width: 900px) { .grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 560px) { .grid { grid-template-columns: 1fr; } .featured-inner { padding: 22px 20px; } }

    .card {
      display: flex;
      flex-direction: column;
      gap: 10px;
      text-decoration: none;
      color: inherit;
      background: var(--bg2);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 22px;
      box-shadow: var(--shadow-sm);
      transition: box-shadow .22s ease, transform .22s ease;
    }
    .card:hover { box-shadow: var(--shadow-lg); transform: translateY(-4px); }
    .card-top { display: flex; align-items: center; gap: 10px; }
    .rank-num { font-size: 22px; font-weight: 900; line-height: 1; flex-shrink: 0; width: 32px; }
    .card-title { font-size: 15px; font-weight: 700; line-height: 1.4; letter-spacing: -.2px; color: var(--text); flex: 1; }
    .card-summary { font-size: 13px; color: var(--text2); line-height: 1.65; flex: 1; }
    .card-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding-top: 12px;
      border-top: 1px solid var(--border);
      flex-wrap: wrap;
      margin-top: auto;
    }

    .cat {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 100px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: .3px;
      text-transform: uppercase;
      background: var(--cat-bg);
      color: var(--cat-text);
    }
    .featured-cat { font-size: 12px; padding: 4px 12px; }
    @media (prefers-color-scheme: dark) {
      .cat { background: var(--cat-bg-d); color: var(--cat-text-d); }
    }
    .source-txt { font-size: 12px; color: var(--text3); }
    .read-btn {
      display: inline-flex;
      align-items: center;
      font-size: 14px;
      font-weight: 700;
      color: #6366f1;
      background: rgba(99,102,241,.1);
      padding: 8px 18px;
      border-radius: 8px;
      transition: background .15s;
    }
    .read-btn:hover { background: rgba(99,102,241,.18); }
    .read-link { font-size: 12px; font-weight: 600; color: var(--accent); white-space: nowrap; }

    .card.hidden, .featured-card.hidden { display: none; }
    .empty { display: none; grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text3); font-size: 15px; }
    .empty.show { display: block; }

    footer {
      text-align: center;
      padding: 28px 24px;
      font-size: 13px;
      color: var(--text3);
      border-top: 1px solid var(--border);
      margin-top: 20px;
    }
    footer p + p { margin-top: 6px; }
    footer a { color: var(--accent); text-decoration: none; }
    footer a:hover { text-decoration: underline; }

    .fade-in { opacity: 0; transform: translateY(16px); transition: opacity .4s ease, transform .4s ease; }
    .fade-in.visible { opacity: 1; transform: none; }
  </style>
</head>
<body>

<header>
  <div class="header-inner">
    <div class="header-chip">Daily Tech Digest</div>
    <h1>Top 10 <span>Tech &amp; Startup</span> News</h1>
    <p class="header-date">${formattedDate}</p>
    <span class="header-badge">Updated ${updatedAt} UTC &middot; Europe &amp; World</span>
  </div>
</header>

<div class="filter-wrap">
  <div class="filter-bar">
    <button class="filter-btn active" data-filter="all">All stories</button>
    ${categories.map(c => `<button class="filter-btn" data-filter="${c}">${c}</button>`).join("\n    ")}
  </div>
</div>

<main>
  ${top ? featuredCard(top) : ""}
  <div class="grid">
    ${rest.map(s => `<div class="fade-in">${storyCard(s)}</div>`).join("\n    ")}
    <p class="empty" id="empty">No stories in this category.</p>
  </div>
</main>

<footer>
  <p>Sources: TechCrunch &middot; EU-Startups &middot; Sifted &middot; The Next Web &middot; VentureBeat &middot; Wired &middot; Hacker News</p>
  <p>Curated by <a href="https://anthropic.com" target="_blank" rel="noopener">Claude AI</a> &middot; Delivered automatically every morning</p>
</footer>

<script>
  const btns = document.querySelectorAll('.filter-btn');
  const cards = document.querySelectorAll('.card, .featured-card');
  const empty = document.getElementById('empty');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const f = btn.dataset.filter;
      let visible = 0;
      cards.forEach(card => {
        const match = f === 'all' || card.dataset.cat === f;
        card.classList.toggle('hidden', !match);
        if (match) visible++;
      });
      empty.classList.toggle('show', visible === 0);
    });
  });
  const observer = new IntersectionObserver(
    entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); } }),
    { threshold: 0.08 }
  );
  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
</script>

</body>
</html>`;
}
