/**
 * POST /api/2006/confess  ·  the only door onto the Confessions & Vibes wall.
 *
 * WHY THIS EXISTS AT ALL, since a page can write to Supabase directly:
 * the anon key is printed in the source of /2006. Anyone can read it in three
 * seconds and post straight past the page with a script. So the wall gives the
 * audience no write permission whatsoever, at the database level, and this
 * handler is the only thing holding the service role key. Every rule below is
 * real precisely because it is here and not in the page.
 *
 * A post still goes public the instant this returns. There is no queue and no
 * approval, which is what was asked for. What this does is count, refuse the
 * obviously automated, and make sure a picture cannot carry somebody's home
 * address in it.
 */

import { NextResponse } from 'next/server';
import sharp from 'sharp';
import {
  adminClient, loadWallSettings, cleanBody, cleanScreenName, cleanDeviceTag,
  hitsWordlist, answerMatches, VIBES, MAX_BODY, MAX_ALT, MAX_IMAGE_BYTES,
  COOLDOWN_MS, HOURLY_CAP,
} from '@/lib/wall';

export const runtime = 'nodejs';

const SLUG = '2006';

function no(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return no('that did not go through. try again?');
  }

  // The honeypot. A person never sees this field and never fills it in. A bot
  // filling every input it finds always does. Answered with the same cheerful
  // success a real post gets, because telling a script exactly which check it
  // failed is how it learns to pass.
  if (String(form.get('website') ?? '').trim() !== '') {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const admin = adminClient();
  const settings = await loadWallSettings(admin, SLUG);
  if (!settings) return no('the wall is not set up yet.', 404);
  if (!settings.wallOpen) return no('the wall is closed right now. come back when the show is up.', 403);
  if (settings.wallFrozen) return no('the wall is paused for a minute. nothing is lost, try again shortly.', 403);

  const device = cleanDeviceTag(form.get('device'));
  if (!device) return no('your browser did not send its tag. reload the page and try again?');

  // ── rate limit, per browser ────────────────────────────────────────────────
  const hourAgo = new Date(Date.now() - 3600_000).toISOString();
  const { data: recent } = await admin
    .from('production_confessions')
    .select('created_at')
    .eq('device_tag', device)
    .gte('created_at', hourAgo)
    .order('created_at', { ascending: false })
    .limit(HOURLY_CAP);

  if (recent && recent.length) {
    const since = Date.now() - new Date(recent[0].created_at).getTime();
    if (since < COOLDOWN_MS) {
      const wait = Math.ceil((COOLDOWN_MS - since) / 1000);
      return no(`hang on ${wait} more second${wait === 1 ? '' : 's'}.`, 429);
    }
    if (recent.length >= HOURLY_CAP) {
      return no('that is the limit for one hour. try again later.', 429);
    }
  }

  // ── the words ──────────────────────────────────────────────────────────────
  const body = cleanBody(form.get('body'), MAX_BODY);
  const isAnon = String(form.get('anon') ?? '') === '1';
  const screenName = isAnon ? null : cleanScreenName(form.get('screenName'));
  const vibeRaw = String(form.get('vibe') ?? '').trim();
  const vibe = (VIBES as readonly string[]).includes(vibeRaw) ? vibeRaw : '';

  if (!isAnon && !screenName) {
    return no('we need a screen name for that one, or post it anonymously instead.');
  }

  const photo = form.get('photo');
  const hasPhoto = photo instanceof File && photo.size > 0;

  if (!body && !hasPhoto) return no('there is nothing in it yet.');
  if (String(form.get('body') ?? '').length > MAX_BODY) {
    return no(`that is longer than ${MAX_BODY} characters. longer writing goes on the blog.`);
  }

  // ── the picture ────────────────────────────────────────────────────────────
  let imagePath: string | null = null;
  let imageAlt: string | null = null;

  if (hasPhoto) {
    // The question. It is answerable by anyone looking at the page, on purpose:
    // it is here to stop crawlers, and crawlers are the actual threat. A person
    // in row F with the program in their hand was never who this was for.
    if (!answerMatches(form.get('answer'), settings.photoAnswer)) {
      return no('not quite. look around.');
    }

    imageAlt = cleanBody(form.get('alt'), MAX_ALT);
    if (!imageAlt) {
      return no('say what is in the picture first. one line is plenty.');
    }
    if (photo.size > MAX_IMAGE_BYTES) {
      return no('that picture is bigger than 5mb.');
    }

    const input = Buffer.from(await photo.arrayBuffer());
    let out: Buffer;
    let ext: string;
    let contentType: string;

    try {
      const probe = sharp(input, { animated: true });
      const meta = await probe.metadata();
      // sharp refuses to identify anything that is not really an image, which
      // is the actual check. A claimed MIME type on an upload means nothing.
      if (!meta.width || !meta.height) throw new Error('not an image');

      if (meta.format === 'gif' && (meta.pages ?? 1) > 1) {
        // Animated. Kept animated, because an animated gif that arrives as a
        // still is the single most disappointing thing that could happen here.
        out = await sharp(input, { animated: true })
          .resize({ width: 800, height: 800, fit: 'inside', withoutEnlargement: true })
          .gif()
          .toBuffer();
        ext = 'gif';
        contentType = 'image/gif';
      } else {
        out = await sharp(input)
          .rotate()                 // honour the orientation flag, then drop it
          .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 82, mozjpeg: true })
          .toBuffer();
        ext = 'jpg';
        contentType = 'image/jpeg';
      }
    } catch {
      return no('that file did not read as a picture. jpg, png or gif?');
    }

    // Re-encoding is what strips the metadata. Phone photos carry the
    // coordinates of where they were taken, so an anonymous confession could
    // otherwise arrive with somebody's house attached to it. sharp does not
    // copy metadata across unless asked, and it is not asked.
    const name = `${settings.productionId}/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await admin.storage
      .from('confession-photos')
      .upload(name, out, { contentType, cacheControl: '31536000', upsert: false });
    if (upErr) return no('the picture would not upload. try once more?', 502);

    const { data: pub } = admin.storage.from('confession-photos').getPublicUrl(name);
    imagePath = pub.publicUrl;
  }

  // ── on the wall ────────────────────────────────────────────────────────────
  const { data: row, error } = await admin
    .from('production_confessions')
    .insert({
      production_id: settings.productionId,
      is_anon: isAnon,
      screen_name: screenName,
      body,
      vibe,
      image_path: imagePath,
      image_alt: imageAlt,
      device_tag: device,
      flagged: hitsWordlist(`${body} ${imageAlt ?? ''}`, settings.wordlist),
    })
    .select('id, is_anon, screen_name, body, vibe, image_path, image_alt, notes_count, posted_at')
    .single();

  if (error) return no('it did not save. that one is on us, try again.', 502);

  return NextResponse.json({ ok: true, post: row });
}
