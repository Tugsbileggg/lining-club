// Provider-abstracted email sender (server only). EMAIL_PROVIDER switches the
// backend:
//   - "console" (default): logs only — works with zero config, never sends.
//   - "resend": real delivery via the Resend HTTP API (needs RESEND_API_KEY
//     and a verified sender domain in EMAIL_FROM).
// Sending must never throw to the caller — a failed email must not fail the
// order. All functions return a boolean and swallow their own errors.
import "server-only";

export interface SendEmailArgs {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

const FROM = process.env.EMAIL_FROM || "Lining Club <orders@example.com>";

function provider(): string {
  return (process.env.EMAIL_PROVIDER || "console").toLowerCase();
}

/** True when the current provider can actually deliver (or is the safe console no-op). */
export function isEmailConfigured(): boolean {
  const p = provider();
  if (p === "console") return true;
  if (p === "resend") return Boolean(process.env.RESEND_API_KEY);
  return false;
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: SendEmailArgs): Promise<boolean> {
  if (!to) return false;
  const p = provider();

  if (p === "resend") {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
      console.warn(
        `[email] EMAIL_PROVIDER=resend but RESEND_API_KEY missing — skipping send to ${to}`,
      );
      return false;
    }
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ from: FROM, to, subject, html, text }),
      });
      if (!res.ok) {
        console.error(
          "[email] resend send failed:",
          res.status,
          await res.text().catch(() => ""),
        );
        return false;
      }
      return true;
    } catch (err) {
      console.error("[email] resend send error:", err);
      return false;
    }
  }

  // Default "console" provider — log a preview, deliver nothing.
  console.log(`[email:console] → ${to} | "${subject}"`);
  return true;
}
