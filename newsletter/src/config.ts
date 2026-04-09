import type { NewsletterConfig } from "./types";

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}\n` +
        `Did you set the GitHub Secret? See .env.example for details.`
    );
  }
  return value;
}

export function loadConfig(): NewsletterConfig {
  return {
    claudeApiKey: getEnv("ANTHROPIC_API_KEY"),
    resendApiKey: getEnv("RESEND_API_KEY"),
    toEmail: getEnv("NEWSLETTER_TO_EMAIL"),
    fromEmail: getEnv("NEWSLETTER_FROM_EMAIL"),
    dryRun: process.env["DRY_RUN"] === "true",
  };
}
