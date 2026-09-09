/**
 * POST /api/2006/essay  ·  an audience entry on the blog.
 *
 * People write these live during the show, typed straight into the Xanga
 * screen, and they go up on the spot under the screen name they signed on
 * with. Same door design as the wall: the audience holds no INSERT on
 * production_posts, this handler does, and it counts.
 *
 * The text is plain. It arrives as a textarea, gets escaped, and becomes
 * paragraphs. So the only tags that ever reach the blog from the audience are
 * the ones paragraphs() wrote, and the page's sanitizer would drop anything
 * else on the way to the screen regardless.
 */

import { NextResponse } from 'next/server';
import {
  adminClient, loadWallSettings, cleanBody, cleanScreenName, cleanDeviceTag,
  hitsWordlist, paragraphs,
} from '@/lib/wall';

export const runtime = 'nodejs';

const SLUG = '2006';
const MAX_TITLE = 80;
const MAX_ESSAY = 6000;
const COOLDOWN_MS = 120_000;   // two minutes: an essay is not a chat message
const HOURLY_CAP = 5;

function no(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

export async function POST(req: Request) {
  let payload: { title?: string; body?: string; screenName?: string; device?: string; website?: string };
  try { payload = await req.json(); } catch { return no('that did not go through.'); }

  if (String(payload.website ?? '').trim() !== '') return NextResponse.json({ ok: true, skipped: true });

  const admin = adminClient();
  const settings = await loadWallSettings(admin, SLUG);
  if (!settings) return no('the blog is not set up yet.', 404);
  // One switch for "the audience can write on this site". If the wall is shut,
  // the essay box is shut with it, and the cast has one thing to remember.
  if (!settings.wallOpen) return no('the blog is closed to new entries right now.', 403);

  const device = cleanDeviceTag(payload.device);
  if (!device) return no('reload the page and try again?');
  const screenName = cleanScreenName(payload.screenName);
  if (!screenName) return no('sign on with a screen name first, so the entry has a name on it.');

  const hourAgo = new Date(Date.now() - 3600_000).toISOString();
  const { data: recent } = await admin
    .from('production_posts')
    .select('created_at')
    .eq('device_tag', device)
    .gte('created_at', hourAgo)
    .order('created_at', { ascending: false })
    .limit(HOURLY_CAP);
  if (recent && recent.length) {
    const since = Date.now() - new Date(recent[0].created_at).getTime();
    if (since < COOLDOWN_MS) {
      const wait = Math.ceil((COOLDOWN_MS - since) / 1000);
      return no(`give it ${wait} more seconds before the next one.`, 429);
    }
    if (recent.length >= HOURLY_CAP) return no('that is the limit for one hour. try again later.', 429);
  }

  const title = cleanBody(payload.title, MAX_TITLE);
  const text = cleanBody(payload.body, MAX_ESSAY);
  if (!text) return no('there is nothing in it yet.');
  if (String(payload.body ?? '').length > MAX_ESSAY) {
    return no(`that is over ${MAX_ESSAY} characters.`);
  }

  const { data: row, error } = await admin
    .from('production_posts')
    .insert({
      production_id: settings.productionId,
      created_by: null,
      title: title || 'untitled',
      byline: screenName,
      body: paragraphs(text),
      is_published: true,
      pinned: false,
      is_audience: true,
      device_tag: device,
      mood: '', music: '',
      // The wordlist is the wall's list. Same list, same meaning: it goes up,
      // it is flagged for the cast, nobody is told no.
      flagged: hitsWordlist(`${title} ${text}`, settings.wordlist),
    })
    .select('id, title, byline, body, pinned, posted_at, mood, music, is_audience')
    .single();
  if (error) return no('it did not save. that one is on us, try again.', 502);

  return NextResponse.json({ ok: true, post: row });
}
