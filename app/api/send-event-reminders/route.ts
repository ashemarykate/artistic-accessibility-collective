/**
 * The day-before reminder for anything a member said they are attending.
 *
 * Runs on a schedule (see vercel.json), not from the browser. Like the calendar
 * sync it fails closed: no CRON_SECRET set means it refuses to run rather than
 * standing open to anyone who guesses the path.
 *
 * It looks two days ahead rather than at "tomorrow" exactly, because a daily
 * cron that looks at a narrow window drops anything scheduled in the gap when a
 * run is late or skipped. Sending twice is prevented by the notification log,
 * not by the window being tight, so the window can afford to be generous.
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, claimNotification, sendNotificationEmail, siteOrigin } from '@/lib/notify';

const HOURS_AHEAD = 48;

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get('authorization');
  if (!secret) {
    console.error('send-event-reminders: CRON_SECRET is not set, refusing to run');
    return NextResponse.json({ error: 'CRON_SECRET not set' }, { status: 500 });
  }
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = adminDb();
  const origin = siteOrigin(req.nextUrl.origin);
  const now = new Date();
  const until = new Date(now.getTime() + HOURS_AHEAD * 3600_000);

  const result = { checked: 0, sent: 0, skipped: 0, failed: 0 };

  try {
    // Dates coming up, with the production they belong to.
    const { data: dates, error: datesError } = await db
      .from('production_dates')
      .select('id, production_id, start_at, is_all_day, location_type, venue_name, online_url, label')
      .gte('start_at', now.toISOString())
      .lte('start_at', until.toISOString())
      .order('start_at');
    if (datesError) throw datesError;
    if (!dates || dates.length === 0) return NextResponse.json({ ...result, note: 'nothing coming up' });

    const { data: productions, error: prodError } = await db
      .from('productions')
      .select('id, title, slug, status')
      .in('id', [...new Set(dates.map((d) => d.production_id))]);
    if (prodError) throw prodError;
    const productionById = new Map((productions ?? []).map((p) => [p.id, p]));

    for (const date of dates) {
      const production = productionById.get(date.production_id);
      // A production pulled back to draft should stop reminding people.
      if (!production || production.status !== 'published') continue;

      const { data: rsvps, error: rsvpError } = await db
        .from('production_rsvps')
        .select('id, user_id')
        .eq('production_date_id', date.id);
      if (rsvpError) throw rsvpError;
      if (!rsvps || rsvps.length === 0) continue;

      const { data: people, error: peopleError } = await db
        .from('profiles')
        .select('id, email, full_name, display_name, notify_event_reminders')
        .in('user_id', rsvps.map((r) => r.user_id))
        .eq('status', 'approved');
      if (peopleError) throw peopleError;

      for (const person of people ?? []) {
        result.checked++;
        if (!person.email || !person.notify_event_reminders) { result.skipped++; continue; }

        // Claimed before sending, so two overlapping runs cannot both send.
        const fresh = await claimNotification(db, person.id, 'event_reminder', date.id);
        if (!fresh) { result.skipped++; continue; }

        const when = new Date(date.start_at);
        const dayText = when.toLocaleDateString('en-US', {
          weekday: 'long', month: 'long', day: 'numeric', timeZone: 'America/New_York',
        });
        const timeText = date.is_all_day
          ? ''
          : ` at ${when.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' })} Eastern`;
        const whereText = date.location_type === 'online'
          ? 'It is online.'
          : date.venue_name
            ? `It is at ${date.venue_name}.`
            : '';

        const name = person.display_name?.trim() || person.full_name;
        const ok = await sendNotificationEmail({
          to: person.email,
          subject: `Coming up: ${production.title}, ${dayText}`,
          heading: `${production.title} is coming up`,
          lines: [
            `Hi ${name},`,
            `You said you are attending ${production.title}${date.label ? ` (${date.label})` : ''}. It is on ${dayText}${timeText}. ${whereText}`.trim(),
            'If your plans have changed, you can take yourself off the list on the production page.',
          ],
          cta: { label: 'See the details', url: `${origin}/projects/${production.slug}` },
          offSwitch: 'To stop these, turn off event reminders in Edit Profile.',
        });
        if (ok) result.sent++; else result.failed++;
      }
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error('send-event-reminders failed:', err);
    return NextResponse.json({ ...result, error: 'Reminder run failed' }, { status: 500 });
  }
}
