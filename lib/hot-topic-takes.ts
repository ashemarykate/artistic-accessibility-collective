/**
 * Server helpers for Hot Topics takes. SERVER ONLY: it holds the rules that
 * make a take safe to accept, and it is used by POST /api/hot-topics/takes.
 * Never import it from a client component.
 *
 * WHY THE RULES LIVE HERE AND NOT IN THE PAGE
 * The Supabase anon key is printed in the source of every page, so anyone can
 * skip the form and talk to the database directly. The takes tables therefore
 * give the public no write permission at all (see supabase-migration-v64).
 * The only way a take gets stored is the route that calls this file, which
 * holds the service role key and can count, refuse and flag.
 *
 * WHAT HAPPENS TO A TAKE
 *   1. It is checked and cleaned (validateTake).
 *   2. It is stored as 'pending' and stays hidden until Mary Kate approves it.
 *   3. Its private details (browser tag, signed-in user, spam flag) go in a
 *      second table that the public cannot read.
 *   4. A short email tells the admins one is waiting, at most one per 30 minute
 *      slot. The email never contains the take or the name, the same house rule
 *      as lib/notify.ts.
 */

import { createHash, randomBytes } from 'crypto';
import { after } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { hitsWordlist } from '@/lib/wall';
import { sendNotificationEmail, siteOrigin } from '@/lib/notify';
import {
  HOT_TOPIC_BY_SLUG,
  isTopicOpen,
  TAKE_MAX_LENGTH,
  TAKE_NAME_MAX,
  DEVICE_TAG_PATTERN,
} from '@/lib/hot-topics-data';

// ── limits ───────────────────────────────────────────────────────────────────

/** Per browser tag: one take per thirty seconds, five an hour. */
export const DEVICE_COOLDOWN_MS = 30_000;
export const DEVICE_HOURLY_CAP = 5;

/** When this many takes are waiting for review, new ones are paused. It stops
 *  a script from filling the review queue and the inbox. */
export const PENDING_CAP = 150;

/** At most one alert email goes out in each slot this long. */
export const EMAIL_QUIET_MS = 30 * 60_000;

/** Where the "a take is waiting" alert goes. */
const ALERT_ADDRESSES = ['mk@artisticaccessibility.com', 'contact@artisticaccessibility.com'];

// ── shapes ───────────────────────────────────────────────────────────────────

export type TakeField = 'body' | 'name' | 'topic' | 'agree' | 'device';

export type TakeFailure = {
  ok: false;
  status: 400 | 404 | 429 | 500 | 503;
  error: string;
  field?: TakeField;
};

export type TakeOutcome = { ok: true } | TakeFailure;

/** A take that passed validateTake. Everything in it is cleaned and checked. */
export interface ValidTake {
  topicSlug: string;
  topicTitle: string;
  body: string;
  /** What the person typed, or null for no name. Plain text. */
  name: string | null;
  device: string;
}

type Admin = SupabaseClient;

const fail = (status: TakeFailure['status'], error: string, field?: TakeField): TakeFailure =>
  field ? { ok: false, status, error, field } : { ok: false, status, error };

const MSG_NOT_OPEN = 'Takes are not open yet.';
const MSG_PAUSED = 'Takes are paused for a moment while we catch up. Please try again soon.';
const MSG_BROKEN = 'Something went wrong on our side. Please try again in a little while.';
const MSG_HOUR_LIMIT = 'That is the limit for one hour. Please try again a little later.';

/** "Please wait 12 more seconds before sharing another take." */
function cooldownMessage(msLeft: number): string {
  const wait = Math.max(1, Math.ceil(msLeft / 1000));
  return `Please wait ${wait} more second${wait === 1 ? '' : 's'} before sharing another take.`;
}

// ── cleaning ─────────────────────────────────────────────────────────────────

/** True for characters that have no business in a take: control characters
 *  (everything below space except tab and newline, plus delete and the C1
 *  block), the invisible text direction overrides that can make a line read
 *  backwards, the byte order mark, and characters that draw nothing at all
 *  (zero width space, word joiner, the Hangul and braille blanks, the soft
 *  hyphen, and the invisible "tag" block). Without that last group a take or a
 *  name made only of nothing would pass as text and show up blank.
 *
 *  Kept on purpose: the zero width joiner and non-joiner (U+200D, U+200C) and
 *  the emoji selector (U+FE0F), because Persian, the Indic scripts and emoji
 *  need them, and the left to right and right to left marks (U+200E, U+200F,
 *  U+061C), because Arabic and Hebrew need those.
 *
 *  Done with plain numbers instead of a pattern on purpose. A pattern written
 *  with these characters in it is invisible in an editor, and an earlier one in
 *  this project displayed as garbage. */
function isUnwanted(code: number): boolean {
  return (
    code <= 0x08 ||
    code === 0x0b ||
    code === 0x0c ||
    (code >= 0x0e && code <= 0x1f) ||
    (code >= 0x7f && code <= 0x9f) ||
    code === 0x00ad || // soft hyphen
    code === 0x034f || // combining grapheme joiner
    code === 0x180e || // Mongolian vowel separator
    code === 0x200b || // zero width space
    (code >= 0x202a && code <= 0x202e) ||
    code === 0x2060 || // word joiner
    (code >= 0x2066 && code <= 0x2069) ||
    code === 0x2800 || // braille blank
    code === 0x3164 || // Hangul filler
    code === 0xfeff ||
    // The invisible "tag" block. It can carry hidden text.
    (code >= 0xe0000 && code <= 0xe007f) ||
    // A lone half of an emoji pair. The database refuses text that has one.
    (code >= 0xd800 && code <= 0xdfff)
  );
}

// Something a person can see or hear: a letter, a number or a pictograph. Built
// with new RegExp because the build target is older than these escapes.
const READABLE = new RegExp('[\\p{L}\\p{N}\\p{Extended_Pictographic}]', 'u');

/** Drops unwanted characters, turns tabs into spaces, and turns the two unicode
 *  line separators (0x2028 and 0x2029) into the given line break. */
function tidyChars(text: string, lineBreak: string): string {
  let out = '';
  for (const ch of text) {
    const code = ch.codePointAt(0) ?? 0;
    if (code === 0x2028 || code === 0x2029) out += lineBreak;
    else if (code === 0x09) out += ' ';
    else if (!isUnwanted(code)) out += ch;
  }
  return out;
}

/** The body of a take: plain text, paragraphs kept, runs of blank lines tidied. */
export function cleanTakeBody(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  return tidyChars(raw.replace(/\r\n?/g, '\n'), '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** A display name: one line of plain text, or an empty string. */
export function cleanTakeName(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  return tidyChars(raw.replace(/\r\n?/g, '\n'), ' ')
    .replace(/\n+/g, ' ')
    .replace(/ {2,}/g, ' ')
    .trim();
}

// ── checking ─────────────────────────────────────────────────────────────────

/** The name to store, or null for "no name". A name with nothing readable in it
 *  is no name. So are "A member" and "A reader": those are the labels we show
 *  when nobody typed a name, and a typed copy of "A member" would look like the
 *  real thing. Either way the take just shows under the label it earns. */
function shownName(cleaned: string): string | null {
  if (!cleaned || !READABLE.test(cleaned)) return null;
  if (/^an?\s+(member|reader)$/i.test(cleaned)) return null;
  return cleaned;
}

/**
 * Checks the shape and the words of a take, with no database involved. Order
 * matters a little: the topic first, so a closed or unknown topic is a 404
 * whatever else is wrong with the request.
 */
export function validateTake(input: {
  topic?: unknown;
  body?: unknown;
  name?: unknown;
  device?: unknown;
  agree?: unknown;
}): { ok: true; take: ValidTake } | TakeFailure {
  const slug = typeof input.topic === 'string' ? input.topic : '';
  if (!slug || !isTopicOpen(slug)) {
    return fail(404, 'That topic is not open for takes right now.');
  }

  const body = cleanTakeBody(input.body);
  // A take made only of spaces or invisible characters is no take at all.
  if (!body || !READABLE.test(body)) return fail(400, 'Please write your take first.', 'body');
  if (body.length > TAKE_MAX_LENGTH) {
    return fail(400, `That take is a little long. Please keep it to ${TAKE_MAX_LENGTH} characters or fewer.`, 'body');
  }

  const typedName = cleanTakeName(input.name);
  if (typedName.length > TAKE_NAME_MAX) {
    return fail(400, `That name is a little long. Please keep it to ${TAKE_NAME_MAX} characters or fewer.`, 'name');
  }

  if (input.agree !== true) {
    return fail(400, 'Please tick the box to say you are happy for your take to be shown once we have read it.', 'agree');
  }

  const device = typeof input.device === 'string' ? input.device : '';
  if (!DEVICE_TAG_PATTERN.test(device)) {
    return fail(400, 'Your browser did not send what we need. Please reload the page and try again.', 'device');
  }

  return {
    ok: true,
    take: {
      topicSlug: slug,
      topicTitle: HOT_TOPIC_BY_SLUG[slug]?.title ?? slug,
      body,
      name: shownName(typedName),
      device,
    },
  };
}

// ── flagging ─────────────────────────────────────────────────────────────────

// A hit never blocks a take. Every take waits for a person anyway. A hit only
// sets the flag so the reviewer sees it marked. Add words here as needed.
const FLAG_WORDS = [
  'retard', 'retarded', 'tard', 'spaz', 'cripple', 'crippled',
  'kill yourself', 'kys',
].join(',');

const LINK_PATTERN = /(https?:\/\/|www\.)\S/i;
const EMAIL_PATTERN = /[\w.+-]+@[\w-]+\.[\w.-]+/;

/** True when a take has words on the list, a link, or an email address. Links
 *  and addresses are what spam is made of, and a real take rarely needs one. */
export function shouldFlag(text: string): boolean {
  return hitsWordlist(text, FLAG_WORDS) || LINK_PATTERN.test(text) || EMAIL_PATTERN.test(text);
}

// ── a soft limit per internet address ────────────────────────────────────────

// In memory, so it resets when the server instance does. It is a safety net
// for scripts that change their browser tag on every request, not the main
// limit. It is generous on purpose: a class or a venue shares one address, and
// thirty people sharing takes in ten minutes should not be shut out.
//
// The address is never stored. It is mixed with a random value that exists
// only in this process's memory and kept as a short hash.
const IP_WINDOW_MS = 10 * 60_000;
const IP_LIMIT = 30;
const ipHits = new Map<string, number[]>();
const ipSalt = randomBytes(16).toString('hex');

/**
 * What to count an address as. An IPv4 address counts as itself. An IPv6
 * address counts as its /64 (the first four groups), because one home or phone
 * connection is handed billions of IPv6 addresses and counting each one
 * separately would be no limit at all. An IPv4 address written the IPv6 way
 * (::ffff:1.2.3.4) counts as the IPv4 address. Anything that does not parse is
 * counted as written.
 */
export function networkOf(ip: string): string {
  const addr = ip.trim().toLowerCase().replace(/^\[|\]$/g, '').split('%')[0];
  if (!addr.includes(':')) return addr;

  const mapped = /^(?:0{0,4}:){2,5}ffff:(\d{1,3}(?:\.\d{1,3}){3})$/.exec(addr);
  if (mapped) return mapped[1];

  const halves = addr.split('::');
  if (halves.length > 2) return addr;
  const head = halves[0] ? halves[0].split(':') : [];
  const tail = halves.length === 2 && halves[1] ? halves[1].split(':') : [];
  let groups: string[];
  if (halves.length === 2) {
    const missing = 8 - head.length - tail.length;
    if (missing < 1) return addr;
    groups = [...head, ...Array<string>(missing).fill('0'), ...tail];
  } else {
    groups = head;
  }
  if (groups.length !== 8 || !groups.every((g) => /^[0-9a-f]{1,4}$/.test(g))) return addr;
  return groups.slice(0, 4).map((g) => parseInt(g, 16).toString(16)).join(':') + '::/64';
}

/** Counts this request and returns true when the address is going too fast.
 *  An empty address (no header) is never limited, since everyone without one
 *  would otherwise share a single allowance. */
export function ipTooBusy(ip: string): boolean {
  if (!ip) return false;
  const key = createHash('sha256').update(ipSalt + networkOf(ip)).digest('hex').slice(0, 24);
  const now = Date.now();
  const recent = (ipHits.get(key) ?? []).filter((t) => now - t < IP_WINDOW_MS);
  recent.push(now);
  // Only the newest few are ever needed to answer "more than IP_LIMIT in the
  // window?", so a script hammering from one address cannot grow this list.
  if (recent.length > IP_LIMIT + 1) recent.splice(0, recent.length - (IP_LIMIT + 1));
  ipHits.set(key, recent);

  if (ipHits.size > 2000) {
    for (const [k, times] of ipHits) {
      if (now - times[times.length - 1] >= IP_WINDOW_MS) ipHits.delete(k);
    }
    if (ipHits.size > 5000) ipHits.clear();
  }
  return recent.length > IP_LIMIT;
}

export const MSG_IP_BUSY =
  'Lots of takes are coming from your network right now. Please try again in a few minutes.';

// ── database trouble ─────────────────────────────────────────────────────────

type DbError = { code?: string; message?: string } | null | undefined;

/** True when the takes tables (or a column) are not there, which means the
 *  migration has not been run yet. */
export function isMissingTable(error: DbError): boolean {
  if (!error) return false;
  const code = error.code ?? '';
  if (code === '42P01' || code === '42703' || code === 'PGRST205' || code === 'PGRST204') return true;
  return /does not exist|schema cache/i.test(error.message ?? '');
}

/** Turns a database error into the failure the visitor sees. The real error is
 *  logged here and never sent to the browser. */
function dbFailure(where: string, error: DbError): TakeFailure {
  console.error(`Hot Topics takes: ${where} failed:`, { code: error?.code, message: error?.message });
  return isMissingTable(error) ? fail(503, MSG_NOT_OPEN) : fail(500, MSG_BROKEN);
}

// ── who is asking ────────────────────────────────────────────────────────────

/**
 * Looks at the optional sign-in token the page sends. The browser is never
 * trusted for this: the token is checked with Supabase through the service
 * client, and a take is marked as from a member only when that person has an
 * approved profile. Anything that does not check out is simply a visitor.
 */
async function whoIsAsking(
  admin: Admin,
  bearer: string | undefined,
): Promise<{ userId: string | null; fromMember: boolean }> {
  const visitor = { userId: null, fromMember: false };
  if (!bearer) return visitor;
  try {
    const { data, error } = await admin.auth.getUser(bearer);
    const user = data?.user;
    if (error || !user) return visitor;

    const { data: profile } = await admin
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'approved')
      .limit(1)
      .maybeSingle();
    return { userId: user.id, fromMember: !!profile };
  } catch (err) {
    console.error('Hot Topics takes: could not check the sign-in token:', err);
    return visitor;
  }
}

// ── the alert email ──────────────────────────────────────────────────────────

/** Only hosts that really are ours may appear in the link inside the email. */
function trustedOrigin(requestOrigin: string): string {
  const fallback = 'https://www.artisticaccessibility.com';
  try {
    const url = new URL(requestOrigin);
    const host = url.hostname;
    const ours =
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === 'artisticaccessibility.com' ||
      host.endsWith('.artisticaccessibility.com') ||
      host.endsWith('.vercel.app');
    return ours ? url.origin : fallback;
  } catch {
    return fallback;
  }
}

type SendEmail = typeof sendNotificationEmail;

/** Tells the admins a take is waiting. Never throws and never carries the
 *  take, the name or anything else a visitor typed. */
async function alertAdmins(topicTitle: string, requestOrigin: string, send: SendEmail): Promise<void> {
  try {
    const origin = siteOrigin(trustedOrigin(requestOrigin)).replace(/\/+$/, '');
    await Promise.all(
      ALERT_ADDRESSES.map((to) =>
        send({
          to,
          subject: `A take is waiting for review: ${topicTitle}`,
          heading: 'A take is waiting for review',
          lines: [
            `Someone shared a take on "${topicTitle}". It stays hidden until you approve it.`,
            'Open the admin dashboard, choose Takes under Website Content, then approve or reject it.',
          ],
          cta: { label: 'Open the admin dashboard', url: `${origin}/admin` },
          offSwitch:
            'You get at most one of these every 30 minutes, however many takes arrive. To turn them off for good, ask Claude to remove the Takes alert email.',
        }),
      ),
    );
  } catch (err) {
    console.error('Hot Topics takes: the alert email failed:', err);
  }
}

/**
 * Claims this 30 minute slot for the alert email. The database decides, not a
 * count in the code: the slot number is a primary key, so when several takes
 * arrive together exactly one insert succeeds and only that one sends the
 * email. (Same idea as claimNotification in lib/notify.ts.) A fixed slot, not
 * "30 minutes since the last take", so a slow trickle of junk can never keep
 * the real alerts quiet.
 *
 * If the claims table is missing (the migration was not run in full) there is
 * nothing to throttle with, so the email is sent. Any other trouble skips this
 * one email: a missed alert is kinder than a flood, and the Takes tab in Admin
 * always shows what is waiting.
 */
async function claimAlertSlot(admin: Admin, now: number): Promise<boolean> {
  const { error } = await admin.from('topic_take_alert_claims').insert({ bucket: Math.floor(now / EMAIL_QUIET_MS) });
  if (!error) return true;
  if (error.code === '23505') return false; // this slot already sent its email
  if (isMissingTable(error)) {
    console.error('Hot Topics takes: topic_take_alert_claims is missing, so the alert email is not throttled. Run the v64 migration in full.');
    return true;
  }
  console.error('Hot Topics takes: could not claim the alert email slot:', { code: error.code, message: error.message });
  return false;
}

/** Runs a task once the response has gone out, so a slow email service cannot
 *  hold the visitor up. Outside a request (a script) it simply runs now. */
async function afterResponse(task: () => Promise<void>): Promise<void> {
  try {
    after(task);
    return;
  } catch {
    // Not inside a request.
  }
  await task();
}

// ── the limits, checked again after the insert ───────────────────────────────

/**
 * The limits are read before the insert, so two requests that arrive together
 * both see room and both get in. This is the second look, after the insert, and
 * it is the one that holds. It lines up this browser's takes from the last hour
 * in a fixed order (oldest first, the take id breaking a tie) and asks whether
 * this take is still inside the rules: among the first five, and at least 30
 * seconds after the one before it. Everyone who arrives together runs the same
 * check on the same list, so exactly the earliest one stays.
 *
 * Returns what to tell the visitor when the take should be removed, or null when
 * it can stay. If the check cannot be made, the take stays: it is only a pending
 * take, and a person reads it before anyone else can.
 */
async function lostRace(admin: Admin, take: ValidTake, takeId: string, hourAgo: string): Promise<string | null> {
  const { data, error } = await admin
    .from('topic_take_meta')
    .select('take_id, created_at')
    .eq('device_tag', take.device)
    .gte('created_at', hourAgo)
    .order('created_at', { ascending: true })
    .order('take_id', { ascending: true })
    .limit(DEVICE_HOURLY_CAP);
  if (error) {
    console.error('Hot Topics takes: could not double check the limits:', { code: error.code, message: error.message });
    return null;
  }
  const rows = data ?? [];
  const at = rows.findIndex((r) => r.take_id === takeId);
  if (at === -1) return MSG_HOUR_LIMIT; // not among the first five this hour
  if (at === 0) return null;
  const gap = new Date(rows[at].created_at).getTime() - new Date(rows[at - 1].created_at).getTime();
  if (gap < DEVICE_COOLDOWN_MS) return cooldownMessage(DEVICE_COOLDOWN_MS - gap);
  return null;
}

// ── storing a take ───────────────────────────────────────────────────────────

/**
 * Stores a validated take as pending, or says why not. Takes the service role
 * client from the caller so the caller decides what to do when it is missing.
 *
 * Order of events: the two counts (this browser's recent takes and how many are
 * waiting) in one trip, then the limits, then who is asking, then the take, then
 * its private row, then the limits once more (lostRace, for requests that
 * arrived together), then the alert email. If the private row cannot be written
 * the take is removed again, so a take with no browser tag is not left behind.
 */
export async function submitTake(
  admin: Admin,
  take: ValidTake,
  options: { bearer?: string; origin: string; sendEmail?: SendEmail },
): Promise<TakeOutcome> {
  const now = Date.now();
  const hourAgo = new Date(now - 3_600_000).toISOString();

  const [recent, waiting] = await Promise.all([
    admin
      .from('topic_take_meta')
      .select('created_at')
      .eq('device_tag', take.device)
      .gte('created_at', hourAgo)
      .order('created_at', { ascending: false })
      .limit(DEVICE_HOURLY_CAP),
    admin.from('topic_takes').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
  ]);

  if (recent.error) return dbFailure('reading this browser\'s recent takes', recent.error);
  if (waiting.error) return dbFailure('counting takes waiting for review', waiting.error);

  // This browser: thirty seconds apart, five an hour.
  const rows = recent.data ?? [];
  if (rows.length > 0) {
    const since = now - new Date(rows[0].created_at).getTime();
    if (since < DEVICE_COOLDOWN_MS) return fail(429, cooldownMessage(DEVICE_COOLDOWN_MS - since));
    if (rows.length >= DEVICE_HOURLY_CAP) return fail(429, MSG_HOUR_LIMIT);
  }

  // The whole queue.
  if ((waiting.count ?? 0) >= PENDING_CAP) {
    return fail(503, MSG_PAUSED);
  }

  // Only now, with every limit passed, is it worth asking who this is.
  const { userId, fromMember } = await whoIsAsking(admin, options.bearer);

  const flagged = shouldFlag(`${take.body}\n${take.name ?? ''}`);

  // The take itself: public-safe columns only, always pending.
  const { data: stored, error: takeError } = await admin
    .from('topic_takes')
    .insert({
      topic_slug: take.topicSlug,
      body: take.body,
      display_name: take.name,
      from_member: fromMember,
      status: 'pending',
    })
    .select('id')
    .single();
  if (takeError || !stored) return dbFailure('saving the take', takeError);

  // Removes the take again. The private row goes with it (on delete cascade).
  const takeItBack = async () => {
    try {
      const { error: undoError } = await admin.from('topic_takes').delete().eq('id', stored.id);
      if (undoError) console.error('Hot Topics takes: could not remove a take:', undoError.message);
    } catch (err) {
      console.error('Hot Topics takes: could not remove a take:', err);
    }
  };

  // The private side.
  const { error: metaError } = await admin.from('topic_take_meta').insert({
    take_id: stored.id,
    device_tag: take.device,
    user_id: userId,
    flagged,
  });
  if (metaError) {
    const failure = dbFailure('saving the private details', metaError);
    await takeItBack();
    return failure;
  }

  // Requests that arrived together all passed the checks above. This is the
  // check that holds: only the earliest of them stays.
  const tooMany = await lostRace(admin, take, stored.id, hourAgo);
  if (tooMany) {
    await takeItBack();
    return fail(429, tooMany);
  }

  // One alert per 30 minute slot, sent after the response so a slow email
  // service never holds the visitor up.
  if (await claimAlertSlot(admin, now)) {
    await afterResponse(() => alertAdmins(take.topicTitle, options.origin, options.sendEmail ?? sendNotificationEmail));
  }

  return { ok: true };
}
