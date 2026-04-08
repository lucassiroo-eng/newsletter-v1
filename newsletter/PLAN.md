# Daily Tech Newsletter — Project Plan

## What This Project Does

Every morning at 7:00 AM (Spain time), a robot wakes up automatically and:

1. **Reads tech news** from 8 different sources — TechCrunch, EU-Startups, Sifted, The Next Web, VentureBeat, Wired, Hacker News, and a general news search engine (NewsAPI)
2. **Calls Claude AI** (Anthropic) and says: *"Here are ~80 articles from the last 48 hours — pick the 10 most important for a European startup founder or investor, and explain why each one matters"*
3. **Builds a beautiful email** with the 10 stories, each with a summary and a "why it matters" insight
4. **Sends it to your inbox** automatically via Resend (an email delivery service)

No buttons to push. No website to check. It just arrives in your inbox every morning.

---

## Why This Approach (Instead of Alternatives)

| Approach | Problem |
|---|---|
| Subscribe to newsletters manually | Dozens of tabs, no AI curation, not personalized |
| Build a server (AWS, Google Cloud) | Costs money to run 24/7, needs maintenance |
| Use a SaaS tool | Monthly subscription fee, less control |
| **GitHub Actions (this project)** | **Free, automatic, zero servers, self-alerting if it breaks** |

GitHub Actions is like a free employee that runs code on a schedule. It's used by millions of software teams. For this project, it runs once per day and costs nothing.

---

## Cost Estimate

| Service | Cost |
|---|---|
| GitHub Actions (scheduling + compute) | **Free** |
| News sources (RSS feeds + Hacker News) | **Free** |
| NewsAPI.org | **Free** (100 requests/day, we use 1) |
| Resend (email delivery) | **Free** (3,000 emails/month, we use 30) |
| Claude AI (Anthropic) | **~$0.66–$2.49/month** |

Total: **less than a coffee per month**, and only Claude API is a paid service.

---

## Files in This Project

```
newsletter/
├── package.json              ← Lists the tools/libraries used
├── tsconfig.json             ← TypeScript language configuration
├── .env.example              ← Template showing what secrets are needed
├── .gitignore                ← Tells git to ignore local files and secrets
│
├── .github/
│   └── workflows/
│       ├── daily-newsletter.yml   ← THE ROBOT: runs every morning at 6 AM UTC
│       └── test-newsletter.yml    ← Manual test button in GitHub Actions
│
└── src/
    ├── index.ts              ← Main script: runs everything in order
    ├── config.ts             ← Reads and validates your secret API keys
    ├── types.ts              ← Data structure definitions
    │
    ├── fetchers/
    │   ├── rss.ts            ← Fetches 6 RSS news feeds
    │   ├── hackerNews.ts     ← Fetches popular tech stories from Hacker News
    │   └── newsApi.ts        ← Searches news about startups via NewsAPI.org
    │
    ├── curator/
    │   └── claude.ts         ← Calls Claude AI to pick and summarize top 10
    │
    └── email/
        ├── template.ts       ← Builds the HTML email design
        └── sender.ts         ← Sends the email via Resend
```

---

## What You Need to Set Up (One Time Only)

You need to create accounts on 3 free services and get API keys (like passwords) from each. Then you save those keys as "secrets" in your GitHub repository settings — GitHub stores them safely and uses them automatically every time the robot runs.

### The 5 secrets to configure in GitHub:

| Secret Name | What It Is | Where to Get It |
|---|---|---|
| `ANTHROPIC_API_KEY` | Your Claude AI key | console.anthropic.com → sign up → API Keys |
| `RESEND_API_KEY` | Your email delivery key | resend.com → sign up → API Keys |
| `NEWSLETTER_TO_EMAIL` | The email where you receive the newsletter | Your personal email address |
| `NEWSLETTER_FROM_EMAIL` | The sender email shown in the newsletter | A verified email in Resend |
| `NEWSAPI_KEY` | Your news search key | newsapi.org → sign up → API Key |

**Where to add secrets in GitHub:**
Go to your `newsletter` repository → `Settings` → `Secrets and variables` → `Actions` → `New repository secret`

---

## How to Move These Files to Your Newsletter Repo

The code lives in the `schedule-smith-40` repository under the `newsletter/` folder. To move it to your standalone `newsletter` repository:

1. Clone the `schedule-smith-40` repo to your computer (or use GitHub's web editor)
2. Copy the contents of the `newsletter/` folder to the root of your `newsletter` repo
3. Push to `main`

Or with git commands (if you use Terminal):
```bash
git clone https://github.com/lucassiroo-eng/schedule-smith-40 temp-clone
cd temp-clone
git checkout claude/daily-tech-news-automation-kHUTm
cp -r newsletter/* /path/to/your/newsletter-repo/
cd /path/to/your/newsletter-repo
git add .
git commit -m "Initial newsletter automation"
git push
```

---

## How to Test It Without Waiting for Tomorrow Morning

Once the files are in your `newsletter` repo and secrets are set:

1. Go to your `newsletter` repository on GitHub
2. Click the **"Actions"** tab (top menu)
3. Click **"Test Newsletter (Manual)"** in the left sidebar
4. Click the **"Run workflow"** button on the right
5. Leave **"Dry run"** as `true` if you want to just see the output in logs (no email sent)
6. Or change it to `false` to send a real email to your inbox
7. Click the green **"Run workflow"** button

The test runs in about 1-2 minutes. Click on the running job to watch it in real time.

---

## What Happens If Something Goes Wrong

- **If the robot fails:** GitHub will automatically send you an email notification with a link to the error logs
- **If an email doesn't arrive one morning:** Check the "Actions" tab — you'll see a red X with a clear error message
- **Most common issues:**
  - An API key expired → update the GitHub Secret with a new key
  - A news website changed its RSS feed URL → update `src/fetchers/rss.ts`
  - Claude API credit ran out → add funds at console.anthropic.com

---

## How to Pause or Stop It

- **Pause:** Actions tab → "Daily Tech Newsletter" → three-dot menu → "Disable workflow"
- **Resume:** Same path → "Enable workflow"
- **Change delivery time:** Edit `.github/workflows/daily-newsletter.yml`, change `cron: '0 6 * * *'` (format: `minute hour day month weekday` in UTC)

---

## Note on Delivery Time

The robot runs at **6:00 AM UTC** every day, which translates to:
- **7:00 AM in Spain (winter, November–March)** — CET timezone (UTC+1)
- **8:00 AM in Spain (summer, April–October)** — CEST timezone (UTC+2)

GitHub Actions uses UTC and does not automatically adjust for daylight saving time. This is a known limitation — it's unavoidable without adding a third-party cron service. The maximum "late" it will ever arrive is 8 AM Spain time in summer, which is still before most workdays start.
