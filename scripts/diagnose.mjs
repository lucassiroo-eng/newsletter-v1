import { createClient } from "@supabase/supabase-js";
import { fetchArticlesForSources } from "./lib/fetchSources.mjs";
import { curateStories } from "./lib/curate.mjs";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function diagnose() {
  const steps = [];
  function log(step, status, detail) {
    const msg = `[${status}] ${step}: ${detail}`;
    console.log(msg);
    steps.push({ step, status, detail });
  }

  // 1. Check env vars
  console.log("=== ENVIRONMENT ===");
  const envVars = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "AZURE_CONFIG", "RESEND_API_KEY", "NEWSLETTER_ID"];
  for (const v of envVars) {
    const val = process.env[v];
    if (val) {
      log(`ENV ${v}`, "OK", `set (${val.length} chars, starts with "${val.slice(0, 8)}...")`);
    } else {
      log(`ENV ${v}`, "MISSING", "not set");
    }
  }

  // 2. Supabase connection
  console.log("\n=== SUPABASE CONNECTION ===");
  try {
    const { data, error } = await supabase.from("newsletters").select("count");
    if (error) throw error;
    log("Supabase connection", "OK", "connected");
  } catch (err) {
    log("Supabase connection", "FAIL", err.message);
    return steps;
  }

  // 3. List all newsletters
  console.log("\n=== NEWSLETTERS ===");
  const { data: newsletters, error: nlErr } = await supabase
    .from("newsletters")
    .select("id, title, topic, frequency, is_active, owner_id");
  if (nlErr) {
    log("Fetch newsletters", "FAIL", nlErr.message);
    return steps;
  }
  log("Newsletters found", "OK", `${newsletters.length} total`);
  for (const nl of newsletters) {
    console.log(`  - "${nl.title}" (${nl.id}) active=${nl.is_active} freq=${nl.frequency} topic="${nl.topic}"`);
  }

  // 4. Pick target newsletter
  const targetId = process.env.NEWSLETTER_ID;
  let newsletter;
  if (targetId) {
    newsletter = newsletters.find((n) => n.id === targetId);
    if (!newsletter) {
      log("Target newsletter", "FAIL", `ID "${targetId}" not found in ${newsletters.length} newsletters`);
      return steps;
    }
    log("Target newsletter", "OK", `"${newsletter.title}"`);
  } else {
    newsletter = newsletters[0];
    if (!newsletter) {
      log("Target newsletter", "FAIL", "No newsletters exist");
      return steps;
    }
    log("Target newsletter", "OK", `Using first: "${newsletter.title}"`);
  }

  // 5. Check sources
  console.log("\n=== SOURCES ===");
  const { data: sources, error: srcErr } = await supabase
    .from("sources")
    .select("*")
    .eq("newsletter_id", newsletter.id);
  if (srcErr) {
    log("Fetch sources", "FAIL", srcErr.message);
    return steps;
  }
  log("Sources found", "OK", `${sources?.length || 0} total`);
  for (const s of sources || []) {
    console.log(`  - "${s.name}" type=${s.source_type} url=${s.url || "(none)"} active=${s.is_active}`);
  }

  const activeSources = (sources || []).filter((s) => s.is_active);
  if (activeSources.length === 0) {
    log("Active sources", "FAIL", "No active sources — script would skip this newsletter");
    return steps;
  }
  log("Active sources", "OK", `${activeSources.length}`);

  // 6. Fetch articles
  console.log("\n=== ARTICLE FETCHING ===");
  try {
    const articles = await fetchArticlesForSources(activeSources, newsletter.topic);
    log("Articles fetched", articles.length > 0 ? "OK" : "FAIL", `${articles.length} articles`);
    if (articles.length > 0) {
      console.log("  First 3 articles:");
      for (const a of articles.slice(0, 3)) {
        console.log(`    - "${a.title}" from ${a.source} (${a.url?.slice(0, 60)})`);
      }
    } else {
      log("Articles", "FAIL", "0 articles — script would skip, NO ISSUE CREATED");
      return steps;
    }

    // 7. Test Claude
    console.log("\n=== CLAUDE CURATION ===");
    try {
      const stories = await curateStories(articles, newsletter, new Date().toISOString().split("T")[0]);
      log("Claude curation", "OK", `${stories.length} stories curated`);
      if (stories.length > 0) {
        console.log(`  First story: "${stories[0].title}"`);
      }
    } catch (err) {
      log("Claude curation", "FAIL", err.message);
    }

  } catch (err) {
    log("Article fetching", "FAIL", err.message);
  }

  // 8. Check existing issues
  console.log("\n=== EXISTING ISSUES ===");
  const { data: issues } = await supabase
    .from("issues")
    .select("id, newsletter_id, date, status, email_subject")
    .order("created_at", { ascending: false })
    .limit(5);
  log("Issues in DB", "OK", `${issues?.length || 0} total`);
  for (const i of issues || []) {
    console.log(`  - ${i.date} status=${i.status} subject="${i.email_subject}" (${i.id})`);
  }

  // 9. Check owner email
  console.log("\n=== OWNER ===");
  const { data: owner } = await supabase.auth.admin.getUserById(newsletter.owner_id);
  if (owner?.user?.email) {
    log("Owner email", "OK", owner.user.email);
  } else {
    log("Owner email", "FAIL", "Could not find owner email");
  }

  // Summary
  console.log("\n=== SUMMARY ===");
  const failures = steps.filter((s) => s.status === "FAIL");
  if (failures.length === 0) {
    console.log("All checks passed! Generation should work.");
  } else {
    console.log(`${failures.length} FAILURE(S):`);
    for (const f of failures) {
      console.log(`  ✗ ${f.step}: ${f.detail}`);
    }
  }

  return steps;
}

diagnose().catch((err) => {
  console.error("Diagnostic fatal error:", err.message);
  console.error(err.stack);
  process.exit(1);
});
