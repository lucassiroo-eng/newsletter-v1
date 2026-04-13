import type { CuratedStory } from "../types";

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  "European Startup": { bg: "#e8f5e9", text: "#2e7d32" },
  "VC & Funding": { bg: "#e8eaf6", text: "#3949ab" },
  "AI & Technology": { bg: "#e3f2fd", text: "#1565c0" },
  "Product Launch": { bg: "#fff3e0", text: "#e65100" },
  "Market Trends": { bg: "#f3e5f5", text: "#6a1b9a" },
  "Regulation & Policy": { bg: "#fce4ec", text: "#ad1457" },
};

const RANK_COLORS = ["#1a1a2e", "#0066cc", "#0088aa", "#006633", "#884400", "#660099", "#cc0066", "#005566", "#445500", "#770033"];

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function storyCard(story: CuratedStory): string {
  const color = CATEGORY_COLORS[story.category] ?? { bg: "#f5f5f5", text: "#333" };
  const rankColor = RANK_COLORS[(story.rank - 1) % RANK_COLORS.length];

  return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;border-radius:8px;overflow:hidden;border:1px solid #e0e0e0;">
      <tr>
        <td style="padding:20px;background-color:#ffffff;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td width="44" valign="top">
                <div style="width:36px;height:36px;border-radius:50%;background-color:${rankColor};color:#ffffff;font-size:16px;font-weight:bold;text-align:center;line-height:36px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
                  ${story.rank}
                </div>
              </td>
              <td valign="top">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="padding-bottom:6px;">
                      <span style="display:inline-block;padding:2px 10px;border-radius:12px;background-color:${color.bg};color:${color.text};font-size:11px;font-weight:600;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;text-transform:uppercase;letter-spacing:0.5px;">
                        ${story.category}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-bottom:4px;">
                      <a href="${story.url}" style="font-size:17px;font-weight:700;color:#1a1a2e;text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;line-height:1.3;">
                        ${story.title}
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-bottom:12px;">
                      <span style="font-size:12px;color:#888888;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
                        ${story.source} &middot; ${formatDate(story.publishedAt)}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-bottom:12px;">
                      <p style="margin:0;font-size:14px;line-height:1.6;color:#333333;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
                        ${story.summary}
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <a href="${story.url}" style="font-size:13px;color:#0066cc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;text-decoration:none;">
                        Read full article &rarr;
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`;
}

export function buildEmailHtml(stories: CuratedStory[], date: string): string {
  const formattedDate = new Date(date).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>Daily Tech Digest - ${formattedDate}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f4f4f4">
  <tr>
    <td align="center" style="padding:24px 16px;">
      <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td bgcolor="#1a1a2e" style="border-radius:8px 8px 0 0;padding:32px 28px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td>
                  <p style="margin:0 0 4px 0;font-size:11px;color:#7986cb;letter-spacing:2px;text-transform:uppercase;font-weight:600;">DAILY TECH DIGEST</p>
                  <h1 style="margin:0 0 8px 0;font-size:26px;font-weight:800;color:#ffffff;line-height:1.2;">Top 10 Tech &amp; Startup News</h1>
                  <p style="margin:0;font-size:14px;color:#90caf9;">${formattedDate} &nbsp;&middot;&nbsp; Europe &amp; World</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Subtitle bar -->
        <tr>
          <td bgcolor="#0d47a1" style="padding:12px 28px;">
            <p style="margin:0;font-size:13px;color:#e3f2fd;">Your AI-curated daily briefing on European startups, global VC, and tech innovation - powered by Claude.</p>
          </td>
        </tr>

        <!-- Stories -->
        <tr>
          <td bgcolor="#f4f4f4" style="padding:20px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="padding:0 16px;">
                  ${stories.map(storyCard).join("\n")}
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td bgcolor="#1a1a2e" style="border-radius:0 0 8px 8px;padding:24px 28px;">
            <p style="margin:0 0 8px 0;font-size:13px;color:#90caf9;line-height:1.6;">Sources: TechCrunch, EU-Startups, Sifted, The Next Web, VentureBeat, Wired, Hacker News, NewsAPI</p>
            <p style="margin:0;font-size:12px;color:#546e7a;">Curated by Claude AI &nbsp;&middot;&nbsp; Delivered automatically every morning</p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>

</body>
</html>`;
}
