/**
 * POST /api/2006/vote  ·  a real vote on the countdown.
 *
 * Only accepted while the cast has voting_open switched on, which they flip
 * the day before the first show and off again the day after the last. The
 * rest of the time the page runs the practice vote, which never reaches here.
 *
 * Each screen name's most recent vote is the one that counts, so changing your
 * mind is one press. The standings view does that arithmetic; this handler
 * only appends. Same reasoning as the wall for why it is a handler at all: the
 * anon key is public, so a rule in the page is a suggestion.
 */

import { NextResponse } from 'next/server';
import { adminClient, cleanDeviceTag, cleanScreenName } from '@/lib/wall';

export const runtime = 'nodejs';

const SLUG = '2006';
const COOLDOWN_MS = 10_000;   // changing your mind is fine, a script is not

function no(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

export async function POST(req: Request) {
  let payload: { videoId?: string; screenName?: string; device?: string; website?: string };
  try { payload = await req.json(); } catch { return no('that did not arrive in one piece.'); }

  // The honeypot, same as the wall. Cheerful fake success for a bot.
  if (String(payload.website ?? '').trim() !== '') return NextResponse.json({ ok: true, skipped: true });

  const device = cleanDeviceTag(payload.device);
  const screenName = cleanScreenName(payload.screenName);
  const videoId = String(payload.videoId ?? '');
  if (!device) return no('reload the page and try again?');
  if (!screenName) return no('sign on with a screen name first. anyone will do, it is 2006.');
  if (!/^[0-9a-f-]{36}$/i.test(videoId)) return no('that video does not look real.');

  const admin = adminClient();
  const { data: site } = await admin
    .from('production_microsite')
    .select('production_id, voting_open, productions!inner(slug, status)')
    .eq('productions.slug', SLUG)
    .maybeSingle();
  if (!site) return no('the countdown is not set up yet.', 404);
  if (!site.voting_open) return no('voting is not open yet. it opens the day before the show.', 403);

  // The video has to be a real, approved, votable row on THIS show.
  const { data: video } = await admin
    .from('production_videos')
    .select('id')
    .eq('id', videoId)
    .eq('production_id', site.production_id)
    .eq('approved', true)
    .eq('is_inspo', false)
    .maybeSingle();
  if (!video) return no('that video is not on the countdown.', 404);

  const { data: last } = await admin
    .from('production_votes')
    .select('created_at')
    .eq('device_tag', device)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (last) {
    const since = Date.now() - new Date(last.created_at).getTime();
    if (since < COOLDOWN_MS) {
      return no(`hang on ${Math.ceil((COOLDOWN_MS - since) / 1000)} more seconds.`, 429);
    }
  }

  const { error } = await admin.from('production_votes').insert({
    production_id: site.production_id,
    video_id: videoId,
    screen_name: screenName,
    device_tag: device,
  });
  if (error) return no('it did not count. that one is on us, try again.', 502);

  return NextResponse.json({ ok: true });
}
