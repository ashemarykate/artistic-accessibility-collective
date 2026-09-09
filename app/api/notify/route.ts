/**
 * Tells a member that something happened: somebody wrote to them, or somebody
 * endorsed them.
 *
 * The browser calls this straight after the insert that caused it, passing the
 * id of the row it just wrote. It is not a trusted caller, so this route never
 * takes its word for anything: it re-reads the row with the service role and
 * checks that the signed-in person really is the sender or the endorser. The
 * only thing the caller gets to choose is which of its own rows to announce.
 *
 * Failures here are logged and swallowed. Sending a message must not appear to
 * fail because an email did.
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, claimNotification, sendNotificationEmail, siteOrigin } from '@/lib/notify';

type Recipient = {
  id: string;
  email: string;
  full_name: string;
  display_name: string | null;
  username: string | null;
  notify_messages: boolean;
  notify_endorsements: boolean;
};

const RECIPIENT_FIELDS = 'id, email, full_name, display_name, username, notify_messages, notify_endorsements';

/** What we call somebody in an email. */
const nameOf = (p: { full_name: string; display_name: string | null }) =>
  p.display_name?.trim() || p.full_name;

export async function POST(req: NextRequest) {
  const db = adminDb();
  try {
    const bearer = req.headers.get('authorization') ?? '';
    const token = bearer.startsWith('Bearer ') ? bearer.slice(7) : '';
    if (!token) return NextResponse.json({ sent: false, reason: 'not signed in' }, { status: 401 });

    const { data: { user }, error: userError } = await db.auth.getUser(token);
    if (userError || !user) {
      return NextResponse.json({ sent: false, reason: 'not signed in' }, { status: 401 });
    }

    const { kind, refId } = await req.json();
    if (typeof refId !== 'string' || !refId) {
      return NextResponse.json({ sent: false, reason: 'refId is required' }, { status: 400 });
    }

    // The caller's own profile. Everything below is checked against this.
    const { data: me } = await db
      .from('profiles')
      .select('id, full_name, display_name, username')
      .eq('user_id', user.id)
      .eq('status', 'approved')
      .maybeSingle();
    if (!me) return NextResponse.json({ sent: false, reason: 'no approved profile' }, { status: 403 });

    const origin = siteOrigin(req.nextUrl.origin);

    // ── Somebody sent a message ─────────────────────────────────────────────
    if (kind === 'message') {
      const { data: message } = await db
        .from('messages')
        .select('id, conversation_id, sender_profile_id')
        .eq('id', refId)
        .maybeSingle();
      if (!message) return NextResponse.json({ sent: false, reason: 'no such message' }, { status: 404 });
      if (message.sender_profile_id !== me.id) {
        return NextResponse.json({ sent: false, reason: 'not your message' }, { status: 403 });
      }

      const { data: conversation } = await db
        .from('conversations')
        .select('id, profile_a_id, profile_b_id')
        .eq('id', message.conversation_id)
        .maybeSingle();
      if (!conversation) return NextResponse.json({ sent: false, reason: 'no such conversation' }, { status: 404 });

      const recipientId = conversation.profile_a_id === me.id
        ? conversation.profile_b_id
        : conversation.profile_a_id;

      const { data: recipient } = await db
        .from('profiles').select(RECIPIENT_FIELDS).eq('id', recipientId).maybeSingle<Recipient>();
      if (!recipient?.email) return NextResponse.json({ sent: false, reason: 'no recipient' });
      if (!recipient.notify_messages) return NextResponse.json({ sent: false, reason: 'switched off' });

      // One email per conversation until they read it. If they already have
      // another unread message here, they have already been told once, and a
      // fast back and forth should not fill an inbox.
      const { count: unread } = await db
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('conversation_id', conversation.id)
        .neq('sender_profile_id', recipientId)
        .is('read_at', null);
      if ((unread ?? 0) > 1) return NextResponse.json({ sent: false, reason: 'already told about this conversation' });

      // Deliberately no message text: email is less private than the site.
      const sent = await sendNotificationEmail({
        to: recipient.email,
        subject: `${nameOf(me)} sent you a message`,
        heading: `${nameOf(me)} sent you a message`,
        lines: [
          `Hi ${nameOf(recipient)},`,
          `${nameOf(me)} wrote to you on the Artistic Accessibility Collective. We have kept the message on the site rather than putting it in this email.`,
        ],
        cta: { label: 'Read and reply', url: `${origin}/messages/${conversation.id}` },
        offSwitch: 'To stop these, turn off message emails in Edit Profile.',
      });
      return NextResponse.json({ sent });
    }

    // ── Somebody endorsed a member ──────────────────────────────────────────
    if (kind === 'endorsement') {
      const { data: endorsement } = await db
        .from('endorsements')
        .select('id, endorser_id, endorsed_id')
        .eq('id', refId)
        .maybeSingle();
      if (!endorsement) return NextResponse.json({ sent: false, reason: 'no such endorsement' }, { status: 404 });
      if (endorsement.endorser_id !== me.id) {
        return NextResponse.json({ sent: false, reason: 'not your endorsement' }, { status: 403 });
      }

      const { data: recipient } = await db
        .from('profiles').select(RECIPIENT_FIELDS).eq('id', endorsement.endorsed_id).maybeSingle<Recipient>();
      if (!recipient?.email) return NextResponse.json({ sent: false, reason: 'no recipient' });
      if (!recipient.notify_endorsements) return NextResponse.json({ sent: false, reason: 'switched off' });

      // Endorsements can be removed and given again. The log keys on the
      // endorsement row, so re-endorsing after a removal mails once more,
      // and a double submit of the same row does not.
      const fresh = await claimNotification(db, recipient.id, 'endorsement', endorsement.id);
      if (!fresh) return NextResponse.json({ sent: false, reason: 'already sent' });

      const sent = await sendNotificationEmail({
        to: recipient.email,
        subject: `${nameOf(me)} endorsed you`,
        heading: `${nameOf(me)} endorsed you`,
        lines: [
          `Hi ${nameOf(recipient)},`,
          `${nameOf(me)} endorsed you on the Artistic Accessibility Collective. Endorsements show on your profile, so people can see who vouches for your work.`,
        ],
        cta: {
          label: 'See your profile',
          url: `${origin}/profile/${recipient.username ?? recipient.id}`,
        },
        offSwitch: 'To stop these, turn off endorsement emails in Edit Profile.',
      });
      return NextResponse.json({ sent });
    }

    return NextResponse.json({ sent: false, reason: 'unknown kind' }, { status: 400 });
  } catch (err) {
    console.error('notify route error:', err);
    // Deliberately not an error status: the caller already did its real work.
    return NextResponse.json({ sent: false, reason: 'internal error' });
  }
}
