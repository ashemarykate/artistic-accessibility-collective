import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  try {
    const { profileId, next } = await req.json();

    if (!profileId) {
      return NextResponse.json({ error: 'profileId is required' }, { status: 400 });
    }

    // Get the profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email, status')
      .eq('id', profileId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    if (profile.status !== 'approved') {
      return NextResponse.json({ error: 'Profile must be approved before sending login email' }, { status: 400 });
    }

    // Generate a magic link via Supabase Admin API
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: profile.email,
    });

    if (linkError || !linkData) {
      console.error('Magic link error:', linkError);
      return NextResponse.json({ error: 'Could not generate login link' }, { status: 500 });
    }

    // Do NOT email the action_link: it points at Supabase's one-time /verify
    // endpoint, which email security scanners consume by pre-clicking links,
    // leaving members with "expired link" errors on their real click. Instead
    // link to our /auth/confirm page with the token hash; the token is only
    // exchanged when a real person presses the button there.
    // Origin comes from the incoming request (not hardcoded) so it matches
    // whatever domain is serving the app: prod, a Vercel preview, or local.
    const tokenHash = linkData.properties?.hashed_token;
    if (!tokenHash) {
      console.error('Magic link response had no hashed_token');
      return NextResponse.json({ error: 'Could not generate login link' }, { status: 500 });
    }
    // Where this person should land after signing in. Travels in the link
    // rather than in their browser storage, so it still works when the email
    // is opened on a different device from the one that requested it.
    // Same origin paths only: this value ends up in an email we send.
    const requestedNext = typeof next === 'string' ? next : '';
    const safeNext = requestedNext.startsWith('/') && !requestedNext.startsWith('//')
      && !requestedNext.includes('\\') ? requestedNext : '';

    const loginUrl = `${req.nextUrl.origin}/auth/confirm?token_hash=${encodeURIComponent(tokenHash)}&type=magiclink`
      + (safeNext ? `&next=${encodeURIComponent(safeNext)}` : '');

    // Send the email
    const { error: emailError } = await resend.emails.send({
      from: 'Artistic Accessibility Collective <contact@artisticaccessibility.com>',
      to: profile.email,
      subject: "You're in: set up your Artistic Accessibility Collective profile",
      html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:system-ui,-apple-system,sans-serif;background:#f8f7f4;color:#0d1e4a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(13,30,74,0.10);">
    <tr>
      <td style="background:#2952C8;padding:32px 40px;text-align:center;">
        <p style="margin:0;color:#ffffff;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;font-weight:600;">Artistic Accessibility Collective</p>
        <h1 style="margin:12px 0 4px;color:#ffffff;font-size:28px;font-weight:900;letter-spacing:0.01em;line-height:1.1;">
          together, together
        </h1>
      </td>
    </tr>
    <tr>
      <td style="padding:36px 40px;">
        <p style="font-size:17px;line-height:1.6;margin:0 0 16px;">Hi ${profile.full_name},</p>
        <p style="font-size:16px;line-height:1.6;margin:0 0 16px;color:#5a6787;">
          Your profile has been approved and you're officially part of the Artistic Accessibility Collective.
        </p>
        <p style="font-size:16px;line-height:1.6;margin:0 0 28px;color:#5a6787;">
          Click the button below to set up your login and see your profile. Your information is already there; you won't need to fill it in again.
        </p>
        <div style="text-align:center;margin:32px 0;">
          <a href="${loginUrl}"
             style="display:inline-block;background:#2952C8;color:#ffffff;text-decoration:none;padding:16px 36px;border-radius:12px;font-size:17px;font-weight:700;letter-spacing:0.01em;">
            Set Up My Profile
          </a>
        </div>
        <p style="font-size:13px;color:#9ba8c4;text-align:center;margin:24px 0 0;line-height:1.5;">
          This link works once and expires after about an hour, so click it soon. If you didn't expect this email, you can safely ignore it.<br>
          Questions? Reply to this email or reach us at <a href="mailto:contact@artisticaccessibility.com" style="color:#2952C8;">contact@artisticaccessibility.com</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
    });

    if (emailError) {
      console.error('Email send error:', emailError);
      return NextResponse.json({ error: 'Could not send email' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('send-login-email error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
