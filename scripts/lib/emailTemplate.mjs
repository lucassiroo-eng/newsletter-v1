const RANK_COLORS = [
  "#6366f1", "#3b82f6", "#0ea5e9", "#10b981", "#f59e0b",
  "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316",
];

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

function storyRow(story) {
  const color = RANK_COLORS[(story.rank - 1) % RANK_COLORS.length];
  return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:14px;border-radius:8px;overflow:hidden;border:1px solid #e0e0e0;">
      <tr><td style="padding:18px;background:#fff;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
          <td width="40" valign="top">
            <div style="width:32px;height:32px;border-radius:50%;background:${color};color:#fff;font-size:14px;font-weight:bold;text-align:center;line-height:32px;font-family:Inter,-apple-system,sans-serif;">${story.rank}</div>
          </td>
          <td valign="top">
            <span style="display:inline-block;padding:2px 8px;border-radius:10px;background:#f1f5f9;color:#475569;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">${story.category}</span><br>
            <a href="${story.url}" style="font-size:15px;font-weight:700;color:#0f172a;text-decoration:none;line-height:1.3;">${story.title}</a><br>
            <span style="font-size:11px;color:#94a3b8;">${story.source} &middot; ${formatDate(story.publishedAt)}</span>
            <p style="margin:8px 0 4px;font-size:13px;line-height:1.5;color:#334155;">${story.summary}</p>
            <p style="margin:0;font-size:12px;color:#6366f1;font-weight:600;">${story.whyItMatters}</p>
          </td>
        </tr></table>
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

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${newsletter.title} - ${formattedDate}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f8;font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f4f4f8">
  <tr><td align="center" style="padding:24px 16px;">
    <table width="580" cellpadding="0" cellspacing="0" border="0" style="max-width:580px;width:100%;">
      <tr><td bgcolor="#0f172a" style="border-radius:10px 10px 0 0;padding:28px 24px;">
        <p style="margin:0 0 4px;font-size:11px;color:#818cf8;letter-spacing:1.5px;text-transform:uppercase;font-weight:600;">${newsletter.title}</p>
        <h1 style="margin:0 0 6px;font-size:22px;font-weight:800;color:#fff;line-height:1.2;">${newsletter.topic}</h1>
        <p style="margin:0;font-size:13px;color:rgba(255,255,255,.5);">${formattedDate} &middot; ${stories.length} stories curated by AI</p>
      </td></tr>
      <tr><td bgcolor="#f4f4f8" style="padding:16px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr><td style="padding:0 8px;">${stories.map(storyRow).join("")}</td></tr>
        </table>
      </td></tr>
      <tr><td bgcolor="#0f172a" style="border-radius:0 0 10px 10px;padding:20px 24px;">
        <p style="margin:0;font-size:12px;color:rgba(255,255,255,.35);">Curated by Claude AI &middot; Newsletter Platform</p>
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
  return `${newsletter.title} - ${fmt}`;
}
