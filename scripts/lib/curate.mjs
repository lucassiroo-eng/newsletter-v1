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

  throw lastError || new Error("All Azure endpoint URL patterns returned 404");
}

export async function curateStories(articles, newsletter, date) {
  console.log(
    `  Sending ${articles.length} articles to Claude for "${newsletter.title}"...`
  );

  const system = `You are an expert curator for a newsletter called "${newsletter.title}" focused on: ${newsletter.topic}. You select the most relevant, interesting, and actionable stories for readers interested in this topic. You are concise, insightful, and always explain why something matters.`;

  const user = `Today is ${date}. Below are ${articles.length} articles collected from the subscriber's chosen sources in the last 72 hours.

Select the top 10 most relevant stories for the topic "${newsletter.topic}".

For each story, produce a JSON object with exactly these fields:
- "rank": integer 1-10
- "title": the article title, corrected for clarity if needed
- "url": exact URL from input
- "source": publication name from input
- "publishedAt": date string from input
- "summary": 2-3 factual sentences summarizing what happened
- "whyItMatters": 1 sentence explaining why a reader interested in "${newsletter.topic}" should care
- "category": a short category label relevant to the topic (2-3 words max)

Return ONLY a valid JSON array of up to 10 objects. No commentary. No code fences.

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

  return parsed.slice(0, 10);
}
