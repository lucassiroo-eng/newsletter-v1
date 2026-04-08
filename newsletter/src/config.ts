import type { NewsletterConfig } from "./types.js";

function require(name: string): string {
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
    geminiApiKey: require("GEMINI_API_KEY"),
    resendApiKey: require("RESEND_API_KEY"),
    toEmail: require("NEWSLETTER_TO_EMAIL"),
    fromEmail: require("NEWSLETTER_FROM_EMAIL"),
    dryRun: process.env["DRY_RUN"] === "true",
  };
}
