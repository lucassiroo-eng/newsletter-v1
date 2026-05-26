function parseAzureConfig() {
  const raw = process.env.AZURE_CONFIG;
  if (!raw) throw new Error("AZURE_CONFIG env var not set");
  const parts = raw.split("|").map((p) => p.trim());
  if (parts.length !== 3)
    throw new Error("AZURE_CONFIG must be 'endpoint|model|key'");
  const [endpoint, model, key] = parts;
  const base = endpoint.replace(/\/+$/, "");
  return { base, model, key };
}

function buildCandidateUrls(base, model) {
  return [
    // Azure AI Foundry (models.ai.azure.com)
    `${base}/v1/messages`,
    // Azure AI Foundry with model path
    `${base}/models/${model}/v1/messages`,
    // Azure AI Services
    `${base}/anthropic/v1/messages?api-version=2025-01-01-preview`,
    // Azure AI Services older version
    `${base}/anthropic/v1/messages?api-version=2024-06-01`,
    // Direct Anthropic-compatible
    `${base}/messages`,
    // If base already includes /v1
    ...(base.endsWith("/v1") ? [`${base}/messages`] : []),
  ];
}

async function callClaude(system, user) {
  const { base, model, key } = parseAzureConfig();
  const urls = buildCandidateUrls(base, model);

  const body = JSON.stringify({
    model,
    max_tokens: 4096,
    system,
    messages: [{ role: "user", content: user }],
  });

  const headers = {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    "anthropic-version": "2023-06-01",
    "api-key": key,
  };

  let workingUrl = null;
  let lastError;

  for (const url of urls) {
    try {
      console.log(`  [claude] Trying: ${url}`);
      const res = await fetch(url, {
        method: "POST",
        headers,
        body,
        signal: AbortSignal.timeout(120_000),
      });

      if (res.status === 404) {
        console.log(`  [claude] 404 at ${url}, trying next...`);
        continue;
      }

      if (res.status === 429) {
        workingUrl = url;
        const retryAfter = parseInt(res.headers.get("retry-after") || "40", 10);
        console.log(`  [claude] Rate limited, waiting ${retryAfter}s...`);
        await new Promise((r) => setTimeout(r, retryAfter * 1000));
        break;
      }

      if (!res.ok) {
        const errBody = await res.text().catch(() => "");
        throw new Error(`Claude API ${res.status}: ${errBody.slice(0, 300)}`);
      }

      console.log(`  [claude] Success at ${url}`);
      const data = await res.json();
      return data.content?.[0]?.text ?? "";
    } catch (err) {
      if (err.message.includes("404")) {
        lastError = err;
        continue;
      }
      throw err;
    }
  }

  // Retry loop for the working URL (handles 429 rate limits)
  const retryUrl = workingUrl || urls[0];
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`  [claude] Retry ${attempt}/3 at ${retryUrl}`);
      const res = await fetch(retryUrl, {
        method: "POST",
        headers,
        body,
        signal: AbortSignal.timeout(120_000),
      });

      if (res.status === 429) {
        const wait = parseInt(res.headers.get("retry-after") || "45", 10);
        console.log(`  [claude] Still rate limited, waiting ${wait}s...`);
        await new Promise((r) => setTimeout(r, wait * 1000));
        continue;
      }

      if (!res.ok) {
        const errBody = await res.text().catch(() => "");
        throw new Error(`Claude API ${res.status}: ${errBody.slice(0, 300)}`);
      }

      console.log(`  [claude] Success on retry ${attempt}`);
      const data = await res.json();
      return data.content?.[0]?.text ?? "";
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error("All Azure endpoint URL patterns failed");
}

export async function curateStories(articles, newsletter, date) {
  console.log(
    `  Sending ${articles.length} articles to Claude for "${newsletter.title}"...`
  );

  const system = `You are a sharp, no-BS newsletter curator for "${newsletter.title}". Topic: ${newsletter.topic}. Write like a smart friend texting — punchy, zero filler.`;

  const user = `Today is ${date}. ${articles.length} articles below.

Pick the 8 best. For each, return a JSON object:
- "rank": 1-8
- "title": short punchy headline (max 10 words, rewrite if needed)
- "url": exact URL from input
- "source": publication name
- "publishedAt": date from input
- "summary": ONE sentence, max 20 words. What happened.
- "whyItMatters": ONE sentence, max 15 words. Why should I care.
- "category": 1-2 word label

IMPORTANT: Keep it SHORT. This is read on mobile. No fluff.

Return ONLY a JSON array. No commentary. No code fences.

ARTICLES:
${JSON.stringify(articles, null, 2)}`;

  const text = await callClaude(system, user);

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) throw new Error("Claude did not return a JSON array");
    parsed = JSON.parse(match[0]);
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("Claude returned empty or non-array response");
  }

  return parsed.slice(0, 8);
}
