function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });
  } catch {
    return iso;
  }
}

function storyRow(story) {
  return `
    <tr><td style="padding:16px 0;border-bottom:1px solid #e2e8f0;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
        <td width="36" valign="top" style="padding-right:12px;">
          <div style="width:28px;height:28px;border-radius:8px;background:#6366f1;color:#fff;font-size:13px;font-weight:700;text-align:center;line-height:28px;font-family:Inter,-apple-system,sans-serif;">${story.rank}</div>
        </td>
        <td valign="top">
          <a href="${story.url}" style="font-size:16px;font-weight:700;color:#0f172a;text-decoration:none;line-height:1.3;font-family:Inter,-apple-system,sans-serif;">${story.title}</a>
          <div style="margin-top:4px;font-size:12px;color:#94a3b8;font-family:Inter,-apple-system,sans-serif;">${story.source} &middot; ${formatDate(story.publishedAt)}</div>
          <div style="margin-top:6px;font-size:14px;line-height:1.4;color:#475569;font-family:Inter,-apple-system,sans-serif;">${story.whyItMatters}</div>
        </td>
      </tr></table>
    </td></tr>`;
}

export function buildEmailHtml(stories, newsletter, date) {
  const formattedDate = new Date(date).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const preheader = stories.length > 0
    ? stories.slice(0, 3).map((s) => s.title).join(" | ")
    : newsletter.title;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="format-detection" content="telephone=no,date=no,address=no,email=no,url=no">
<title>${newsletter.title}</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;-webkit-font-smoothing:antialiased;">
<div style="display:none;max-height:0;overflow:hidden;">${preheader}</div>

<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f8fafc" role="presentation">
  <tr><td align="center" style="padding:16px 12px 32px;">
    <table width="520" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;width:100%;">

      <!-- Header -->
      <tr><td style="padding:24px 20px 20px;background:#0f172a;border-radius:12px 12px 0 0;">
        <p style="margin:0 0 4px;font-size:11px;color:#818cf8;letter-spacing:1.5px;text-transform:uppercase;font-weight:700;font-family:Inter,-apple-system,sans-serif;">${newsletter.title}</p>
        <p style="margin:0;font-size:13px;color:rgba(255,255,255,.4);font-family:Inter,-apple-system,sans-serif;">${formattedDate} &middot; ${stories.length} stories</p>
      </td></tr>
      <tr><td style="height:2px;background:#6366f1;font-size:0;">&nbsp;</td></tr>

      <!-- Stories -->
      <tr><td style="padding:4px 20px 8px;background:#ffffff;border-radius:0 0 12px 12px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          ${stories.map(storyRow).join("")}
        </table>
      </td></tr>

      <!-- Footer -->
      <tr><td style="padding:20px 0 0;">
        <p style="margin:0;font-size:11px;color:#94a3b8;text-align:center;font-family:Inter,-apple-system,sans-serif;">Curated by AI &middot; Reply to unsubscribe</p>
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
