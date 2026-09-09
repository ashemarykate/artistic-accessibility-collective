/**
 * Server-only email helpers for member notifications.
 *
 * Import this from API routes only. It uses the service role key, which must
 * never reach the browser.
 *
 * The house rules for every email sent from here:
 *
 *  - Say who it is from and why it arrived, in the first line.
 *  - One clear thing to do, as a real link, so it works with images off.
 *  - Never put the content of a private message in the email body. The email
 *    says somebody wrote, not what they wrote. Email is not as private as the
 *    site, and forwarding an inbox should not leak a colleague's words.
 *  - Every email except the login link says how to turn that kind off.
 */

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

export const FROM = 'Artistic Accessibility Collective <contact@artisticaccessibility.com>';

/** Service-role client. Bypasses RLS, so only ever used inside API routes. */
export function adminDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

interface NotificationEmail {
  to: string;
  subject: string;
  /** Big line at the top of the card. */
  heading: string;
  /** One or two short paragraphs. Plain text; it is escaped for you. */
  lines: string[];
  cta?: { label: string; url: string };
  /** Sentence explaining how to stop receiving this kind. */
  offSwitch?: string;
}

/**
 * Sends one notification. Returns true when Resend accepted it.
 * Never throws: a failed notification must not break the action that caused it.
 */
export async function sendNotificationEmail(email: NotificationEmail): Promise<boolean> {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const body = email.lines
    .map((line) => `<p style="font-size:16px;line-height:1.6;margin:0 0 16px;color:#5a6787;">${escapeHtml(line)}</p>`)
    .join('\n');

  const button = email.cta
    ? `<div style="text-align:center;margin:32px 0;">
         <a href="${email.cta.url}" style="display:inline-block;background:#2952C8;color:#ffffff;text-decoration:none;padding:16px 36px;border-radius:12px;font-size:17px;font-weight:700;">
           ${escapeHtml(email.cta.label)}
         </a>
       </div>`
    : '';

  const footer = email.offSwitch
    ? `<p style="font-size:13px;color:#9ba8c4;text-align:center;margin:24px 0 0;line-height:1.5;">
         ${escapeHtml(email.offSwitch)}<br>
         Questions? Reply to this email or write to
         <a href="mailto:contact@artisticaccessibility.com" style="color:#2952C8;">contact@artisticaccessibility.com</a>
       </p>`
    : '';

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: email.to,
      subject: email.subject,
      html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:system-ui,-apple-system,sans-serif;background:#f8f7f4;color:#0d1e4a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(13,30,74,0.10);">
    <tr>
      <td style="background:#2952C8;padding:28px 40px;text-align:center;">
        <p style="margin:0;color:#ffffff;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;font-weight:600;">Artistic Accessibility Collective</p>
      </td>
    </tr>
    <tr>
      <td style="padding:32px 40px;">
        <h1 style="margin:0 0 16px;font-size:22px;line-height:1.25;color:#0d1e4a;">${escapeHtml(email.heading)}</h1>
        ${body}
        ${button}
        ${footer}
      </td>
    </tr>
  </table>
</body>
</html>`,
    });
    if (error) {
      console.error('Notification email failed:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Notification email threw:', err);
    return false;
  }
}

/**
 * Records that a notification went out. Returns false when this exact one has
 * already been sent, which is how duplicates are prevented: the unique
 * constraint in the database decides, not a check in the code.
 *
 * Call it BEFORE sending. A row written for an email that then fails to send is
 * a missed notification; a row written after a send that crashes mid-way is a
 * duplicate. Of the two, missing one is the kinder failure.
 */
export async function claimNotification(
  db: ReturnType<typeof adminDb>,
  profileId: string,
  kind: string,
  refId: string,
): Promise<boolean> {
  const { error } = await db
    .from('notification_log')
    .insert({ profile_id: profileId, kind, ref_id: refId });
  if (!error) return true;
  // 23505 is a unique violation: already sent.
  if (error.code === '23505') return false;
  console.error('Could not claim notification:', error);
  return false;
}

/** The site's own origin, for links inside emails. */
export function siteOrigin(fallbackOrigin: string): string {
  return process.env.NEXT_PUBLIC_SITE_URL || fallbackOrigin;
}
