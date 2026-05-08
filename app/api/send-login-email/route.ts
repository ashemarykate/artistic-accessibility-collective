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
    const { profileId } = await req.json();

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

    const loginUrl = linkData.properties?.action_link;

    // Send the email
    const { error: emailError } = await resend.emails.send({
      from: 'Artistic Accessibility Collective <contact@artisticaccessibility.com>',
      to: profile.email,
      subject: "You're in — set up your Artistic Accessibility Collective profile",
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
          Click the button below to set up your login and see your profile. Your information is already there — you won't need to fill it in again.
        </p>
        <div style="text-align:center;margin:32px 0;">
          <a href="${loginUrl}"
             style="display:inline-block;background:#2952C8;color:#ffffff;text-decoration:none;padding:16px 36px;border-radius:12px;font-size:17px;font-weight:700;letter-spacing:0.01em;">
            Set Up My Profile
          </a>
        </div>
        <p style="font-size:13px;color:#9ba8c4;text-align:center;margin:24px 0 0;line-height:1.5;">
          This link expires in 24 hours. If you didn't expect this email, you can safely ignore it.<br>
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
