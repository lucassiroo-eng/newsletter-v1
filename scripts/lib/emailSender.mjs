import { Resend } from "resend";

let _client;
function getClient() {
  if (!_client) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("RESEND_API_KEY not set");
    _client = new Resend(key);
  }
  return _client;
}

export async function sendNewsletterEmail(html, subject, recipients) {
  const client = getClient();
  const from = process.env.NEWSLETTER_FROM_EMAIL || "newsletter@resend.dev";

  let sent = 0;
  for (const email of recipients) {
    try {
      const { error } = await client.emails.send({
        from,
        to: email,
        subject,
        html,
      });
      if (error) {
        console.warn(`  [!] Email to ${email}: ${JSON.stringify(error)}`);
      } else {
        sent++;
      }
    } catch (err) {
      console.warn(`  [!] Email to ${email} failed: ${err.message}`);
    }
  }
  return sent;
}
