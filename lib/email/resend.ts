import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;

// Singleton — Resend client is fine to reuse across requests.
export const resend = apiKey ? new Resend(apiKey) : null;

export const EMAIL_FROM =
  process.env.EMAIL_FROM ?? "FaliJedan <onboarding@resend.dev>";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/**
 * Fire-and-forget email sender. Never throws — email failures
 * must not break the user flow. Logs to console for ops to see.
 */
export async function sendEmail(args: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set — skipping email", args.subject);
    return;
  }
  try {
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: args.to,
      subject: args.subject,
      html: args.html,
    });
    if (error) console.error("[email] send failed:", error, args.subject);
  } catch (e) {
    console.error("[email] unexpected error:", e);
  }
}
