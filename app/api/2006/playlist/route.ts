/**
 * POST /api/2006/playlist  ·  a mix from the audience.
 *
 * Same door as the wall and the blog: the audience holds no INSERT on
 * production_playlists, this handler does, and it counts. A mix goes up the
 * moment this returns, under the screen name, and the cast can take it down
 * from the public page.
 *
 * The songs arrive as plain text, one per line, "song - artist". That is how
 * a burned CD's track list was written on the sleeve and it is the least
 * machinery a person can be asked for. Anything after a second dash is the
 * note. Lines with no dash are a song with no artist.
 */

import { NextResponse } from 'next/server';
import {
  adminClient, loadWallSettings, cleanBody, cleanScreenName, cleanDeviceTag, hitsWordlist,
} from '@/lib/wall';

export const runtime = 'nodejs';

const SLUG = '2006';
const MAX_TITLE = 60;
const MAX_DESC = 200;
const MAX_TRACKS = 30;
const MAX_FIELD = 80;
const COOLDOWN_MS = 120_000;
const HOURLY_CAP = 5;

function no(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

type Track = { t: string; a: string; note: string };

/** "song - artist - note" per line. Hyphens inside a song title survive because
 *  only the FIRST two dashes surrounded by spaces split anything. */
function parseTracks(raw: string): Track[] {
  return String(raw ?? '')
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean)
    .slice(0, MAX_TRACKS)
    .map(line => {
      const parts = line.split(/\s+[-–—]\s+/, 3);
      const clean = (s: string | undefined) => cleanBody(s ?? '', MAX_FIELD);
      return { t: clean(parts[0]), a: clean(parts[1]), note: clean(parts[2]) };
    })
    .filter(tr => tr.t);
}

export async function POST(req: Request) {
  let payload: { title?: string; description?: string; tracks?: string; screenName?: string; device?: string; website?: string };
  try { payload = await req.json(); } catch { return no('that did not go through.'); }

  if (String(payload.website ?? '').trim() !== '') return NextResponse.json({ ok: true, skipped: true });

  const admin = adminClient();
  const settings = await loadWallSettings(admin, SLUG);
  if (!settings) return no('playlists are not set up yet.', 404);

  const device = cleanDeviceTag(payload.device);
  if (!device) return no('reload the page and try again?');
  const screenName = cleanScreenName(payload.screenName);
  if (!screenName) return no('sign on with a screen name first, so the mix has a name on it.');

  const hourAgo = new Date(Date.now() - 3600_000).toISOString();
  const { data: recent } = await admin
    .from('production_playlists')
    .select('created_at')
    .eq('device_tag', device)
    .gte('created_at', hourAgo)
    .order('created_at', { ascending: false })
    .limit(HOURLY_CAP);
  if (recent && recent.length) {
    const since = Date.now() - new Date(recent[0].created_at).getTime();
    if (since < COOLDOWN_MS) {
      return no(`give it ${Math.ceil((COOLDOWN_MS - since) / 1000)} more seconds before the next one.`, 429);
    }
    if (recent.length >= HOURLY_CAP) return no('that is the limit for one hour. try again later.', 429);
  }

  const title = cleanBody(payload.title, MAX_TITLE);
  const description = cleanBody(payload.description, MAX_DESC);
  const tracks = parseTracks(String(payload.tracks ?? ''));
  if (!title) return no('give the mix a name.');
  if (!tracks.length) return no('add at least one song. one per line, song - artist.');

  const { data: row, error } = await admin
    .from('production_playlists')
    .insert({
      production_id: settings.productionId,
      created_by: null,
      title,
      byline: `a mix by ${screenName}`,
      description,
      tracks,
      is_visible: true,
      is_audience: true,
      device_tag: device,
      flagged: hitsWordlist(`${title} ${description} ${tracks.map(t => `${t.t} ${t.a} ${t.note}`).join(' ')}`, settings.wordlist),
    })
    .select('id, title, byline, description, tracks, is_audience, created_at')
    .single();
  if (error) return no('it did not save. that one is on us, try again.', 502);

  return NextResponse.json({ ok: true, playlist: row });
}
