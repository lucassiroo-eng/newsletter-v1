function formatDate(iso) {
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

function storyCard(story) {
  const categoryColors = {
    default: { bg: "#eef2ff", text: "#4338ca" },
  };
  const cat = categoryColors.default;

  return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;">
      <tr><td style="background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;">
        <!-- Rank bar -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding:20px 20px 0 20px;">
              <table cellpadding="0" cellspacing="0" border="0"><tr>
                <td style="background:#6366f1;color:#ffffff;font-size:12px;font-weight:700;padding:3px 10px;border-radius:20px;font-family:Inter,-apple-system,sans-serif;">
                  #${story.rank}
                </td>
                <td style="padding-left:10px;">
                  <span style="display:inline-block;padding:3px 10px;border-radius:20px;background:${cat.bg};color:${cat.text};font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.3px;font-family:Inter,-apple-system,sans-serif;">${story.category || ""}</span>
                </td>
              </tr></table>
            </td>
          </tr>
        </table>
        <!-- Content -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr><td style="padding:12px 20px 6px;">
            <a href="${story.url}" style="font-size:17px;font-weight:700;color:#0f172a;text-decoration:none;line-height:1.35;font-family:Inter,-apple-system,sans-serif;">${story.title}</a>
          </td></tr>
          <tr><td style="padding:0 20px;">
            <span style="font-size:13px;color:#94a3b8;font-family:Inter,-apple-system,sans-serif;">${story.source} &middot; ${formatDate(story.publishedAt)}</span>
          </td></tr>
          <tr><td style="padding:10px 20px 4px;">
            <p style="margin:0;font-size:15px;line-height:1.55;color:#334155;font-family:Inter,-apple-system,sans-serif;">${story.summary}</p>
          </td></tr>
          <tr><td style="padding:8px 20px 18px;">
            <table cellpadding="0" cellspacing="0" border="0"><tr>
              <td style="width:3px;background:#6366f1;border-radius:2px;">&nbsp;</td>
              <td style="padding-left:12px;">
                <p style="margin:0;font-size:14px;line-height:1.45;color:#4338ca;font-weight:600;font-style:italic;font-family:Inter,-apple-system,sans-serif;">${story.whyItMatters}</p>
              </td>
            </tr></table>
          </td></tr>
        </table>
      </td></tr>
    </table>`;
}

export function buildEmailHtml(stories, newsletter, date) {
  const formattedDate = new Date(date).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const preheader = stories.length > 0
    ? `${stories[0].title} + ${stories.length - 1} more stories`
    : newsletter.title;

  return `<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="format-detection" content="telephone=no,date=no,address=no,email=no,url=no">
<title>${newsletter.title}</title>
<style>
  @media only screen and (max-width: 600px) {
    .outer-table { width: 100% !important; }
    .inner-pad { padding-left: 12px !important; padding-right: 12px !important; }
    .header-pad { padding: 28px 20px !important; }
    .story-title { font-size: 16px !important; }
  }
  a { color: #4338ca; }
  a:hover { color: #3730a3; }
</style>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;-webkit-font-smoothing:antialiased;">
<!-- Preheader -->
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>

<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f1f5f9" role="presentation">
  <tr><td align="center" style="padding:20px 12px 32px;">

    <!-- Main container -->
    <table class="outer-table" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;">

      <!-- Header -->
      <tr><td class="header-pad" bgcolor="#0f172a" style="border-radius:16px 16px 0 0;padding:36px 32px 28px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
          <td>
            <p style="margin:0 0 8px;font-size:13px;color:#818cf8;letter-spacing:1px;text-transform:uppercase;font-weight:700;font-family:Inter,-apple-system,sans-serif;">${newsletter.title}</p>
            <h1 style="margin:0 0 12px;font-size:24px;font-weight:800;color:#ffffff;line-height:1.25;font-family:Inter,-apple-system,sans-serif;">Your weekly digest</h1>
            <p style="margin:0;font-size:14px;color:rgba(255,255,255,.45);font-family:Inter,-apple-system,sans-serif;">${formattedDate} &middot; ${stories.length} stories curated by AI</p>
          </td>
        </tr></table>
      </td></tr>

      <!-- Divider accent -->
      <tr><td style="height:3px;background:linear-gradient(90deg,#6366f1,#818cf8,#a5b4fc);font-size:0;line-height:0;">&nbsp;</td></tr>

      <!-- Stories -->
      <tr><td class="inner-pad" bgcolor="#f1f5f9" style="padding:20px 16px 4px;">
        ${stories.map(storyCard).join("")}
      </td></tr>

      <!-- Footer -->
      <tr><td class="header-pad" bgcolor="#0f172a" style="border-radius:0 0 16px 16px;padding:24px 32px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
          <td>
            <p style="margin:0 0 6px;font-size:13px;color:rgba(255,255,255,.3);font-family:Inter,-apple-system,sans-serif;">Curated by Claude AI &middot; Newsletter Platform</p>
            <p style="margin:0;font-size:12px;color:rgba(255,255,255,.2);font-family:Inter,-apple-system,sans-serif;">You received this because you subscribed. Reply to unsubscribe.</p>
          </td>
        </tr></table>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

export function buildEmailSubject(newsletter, date) {
  const fmt = new Date(date).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  return `${newsletter.title} — ${fmt}`;
}
