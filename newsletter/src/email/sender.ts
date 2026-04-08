import { Resend } from "resend";
import type { NewsletterConfig } from "../types.js";

export async function sendEmail(
  html: string,
  subject: string,
  config: NewsletterConfig
): Promise<void> {
  if (config.dryRun) {
    console.log("\n=== DRY RUN: Email not sent ===");
    console.log(`To: ${config.toEmail}`);
    console.log(`From: ${config.fromEmail}`);
    console.log(`Subject: ${subject}`);
    console.log(`HTML length: ${html.length} characters`);
    console.log("=== End dry run output ===\n");
    return;
  }

  const resend = new Resend(config.resendApiKey);

  const { data, error } = await resend.emails.send({
    from: config.fromEmail,
    to: config.toEmail,
    subject,
    html,
  });

  if (error) {
    throw new Error(`Resend API error: ${JSON.stringify(error)}`);
  }

  console.log(`Email sent successfully. Message ID: ${data?.id}`);
}
