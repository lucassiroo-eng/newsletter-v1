import { createClient } from "@supabase/supabase-js";
import { fetchArticlesForSources } from "./lib/fetchSources.mjs";
import { curateStories } from "./lib/curate.mjs";
import {
  buildEmailHtml,
  buildEmailSubject,
} from "./lib/emailTemplate.mjs";
import { sendNewsletterEmail } from "./lib/emailSender.mjs";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const today = new Date().toISOString().split("T")[0];
const dayOfWeek = new Date().getDay();
const dayOfMonth = new Date().getDate();

function isDue(frequency) {
  switch (frequency) {
    case "daily":
      return true;
    case "weekly":
      return dayOfWeek === 1; // Monday
    case "biweekly":
      return dayOfWeek === 1 && dayOfMonth <= 14;
    case "monthly":
      return dayOfMonth === 1;
    default:
      return false;
  }
}

async function getRecipients(newsletterId, ownerEmail) {
  const emails = [ownerEmail];
  const { data: subs } = await supabase
    .from("subscriptions")
    .select("user_id")
    .eq("newsletter_id", newsletterId)
    .eq("receive_email", true);

  if (subs?.length) {
    const userIds = subs.map((s) => s.user_id);
    const { data: users } = await supabase.auth.admin.listUsers();
    if (users?.users) {
      for (const u of users.users) {
        if (userIds.includes(u.id) && u.email) {
          emails.push(u.email);
        }
      }
    }
  }
  return [...new Set(emails)];
}

async function processNewsletter(newsletter) {
  console.log(
    `\n  ${"─".repeat(50)}\n  [${newsletter.title}] topic: ${newsletter.topic} | freq: ${newsletter.frequency}`
  );

  const { data: existingIssue } = await supabase
    .from("issues")
    .select("id")
    .eq("newsletter_id", newsletter.id)
    .eq("date", today)
    .maybeSingle();

  if (existingIssue) {
    console.log(`  [skip] Issue already exists for ${today}`);
    return;
  }

  const { data: sources } = await supabase
    .from("sources")
    .select("*")
    .eq("newsletter_id", newsletter.id)
    .eq("is_active", true);

  if (!sources?.length) {
    console.log("  [skip] No active sources");
    return;
  }

  console.log(`  [1] Fetching from ${sources.length} source(s)...`);
  const articles = await fetchArticlesForSources(sources);
  console.log(`  [1] ${articles.length} unique articles collected`);

  if (articles.length === 0) {
    console.log("  [skip] No articles found");
    return;
  }

  console.log("  [2] Curating with Claude...");
  const stories = await curateStories(articles, newsletter, today);
  console.log(`  [2] ${stories.length} stories selected`);

  const subject = buildEmailSubject(newsletter, today);
  const html = buildEmailHtml(stories, newsletter, today);

  console.log("  [3] Saving issue...");
  const { error: insertErr } = await supabase.from("issues").insert({
    newsletter_id: newsletter.id,
    date: today,
    stories,
    html_content: html,
    email_subject: subject,
    status: "generated",
  });
  if (insertErr) throw new Error(`Insert issue: ${insertErr.message}`);

  const { data: owner } = await supabase.auth.admin.getUserById(
    newsletter.owner_id
  );
  const ownerEmail = owner?.user?.email;
  if (!ownerEmail) {
    console.log("  [!] No owner email found, skipping send");
    return;
  }

  console.log("  [4] Sending emails...");
  const recipients = await getRecipients(newsletter.id, ownerEmail);
  const sent = await sendNewsletterEmail(html, subject, recipients);
  console.log(`  [4] Sent to ${sent}/${recipients.length} recipient(s)`);

  await supabase
    .from("issues")
    .update({ status: "sent" })
    .eq("newsletter_id", newsletter.id)
    .eq("date", today);

  console.log("  [done]");
}

async function main() {
  console.log("=".repeat(60));
  console.log(`Newsletter Generator — ${today}`);
  console.log("=".repeat(60));

  const { data: newsletters, error } = await supabase
    .from("newsletters")
    .select("*")
    .eq("is_active", true);

  if (error) throw new Error(`Fetch newsletters: ${error.message}`);
  console.log(`[→] ${newsletters.length} active newsletter(s) found`);

  const due = newsletters.filter((n) => isDue(n.frequency));
  console.log(`[→] ${due.length} newsletter(s) due today`);

  let processed = 0;
  let failed = 0;

  for (const nl of due) {
    try {
      await processNewsletter(nl);
      processed++;
    } catch (err) {
      console.error(`  [!] Error: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(
    `Done — ${processed} processed, ${failed} failed, ${due.length - processed - failed} skipped`
  );

  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
