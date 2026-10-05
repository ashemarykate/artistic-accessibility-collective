/**
 * POST /api/hot-topics/takes  ·  the only door for a "What do you think?" take.
 *
 * Anyone can post here, signed in or not, and nothing a person posts is shown
 * until Mary Kate approves it in Admin, then Takes. The takes tables give the
 * public no write permission at all (supabase-migration-v64), so every rule is
 * real because it is here. The rules themselves live in lib/hot-topic-takes.ts.
 *
 * Body (JSON, sent with Content-Type: application/json):
 *   { topic, body, name?, website?, device, agree }
 *   website is a hidden field a person never fills in. A script that fills in
 *   every input does, and gets the same cheerful 200 a real take gets, with
 *   nothing stored, so it learns nothing about which check it failed.
 *
 * Optional header: Authorization: Bearer <sign-in token>. It only decides
 * whether the take is marked as from a member. It is checked, never trusted.
 *
 * Answers (always one of these shapes, never an internal error):
 *   200 { ok: true }
 *   400 { error, field? }   404 { error }   429 { error }
 *   500 { error }           503 { error }
 *
 * Only a JSON request is accepted. A web page on another site cannot send one
 * without the browser first asking us for permission, and we never give it, so
 * nobody can use their visitors' browsers to post takes from somewhere else.
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/lib/wall';
import { validateTake, ipTooBusy, submitTake, MSG_IP_BUSY } from '@/lib/hot-topic-takes';

export const runtime = 'nodejs';

/** A real take is well under 2 KB. Anything much bigger is not one. */
const MAX_PAYLOAD_CHARS = 8 * 1024;

function fail(status: number, error: string, field?: string) {
  return NextResponse.json(field ? { error, field } : { error }, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function POST(req: NextRequest) {
  // ── read the request ───────────────────────────────────────────────────────
  // A page on another site can post a plain text body to us without any
  // permission check from the browser. It cannot post JSON that way, so asking
  // for JSON shuts that door.
  if (!(req.headers.get('content-type') ?? '').toLowerCase().startsWith('application/json')) {
    return fail(400, 'That did not go through. Please try again.');
  }

  let payload: Record<string, unknown>;
  try {
    // Refuse a body that says up front it is far too big, before reading it.
    const declared = Number(req.headers.get('content-length') ?? 0);
    if (declared > MAX_PAYLOAD_CHARS * 4) {
      return fail(400, 'That was too much to send at once. Please shorten your take and try again.', 'body');
    }
    const text = await req.text();
    if (text.length > MAX_PAYLOAD_CHARS) {
      return fail(400, 'That was too much to send at once. Please shorten your take and try again.', 'body');
    }
    const parsed: unknown = JSON.parse(text);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('not an object');
    payload = parsed as Record<string, unknown>;
  } catch {
    return fail(400, 'That did not go through. Please try again.');
  }

  // ── the honeypot ───────────────────────────────────────────────────────────
  // Anything but an empty value is a trap that was sprung. Checked by type, never
  // by turning the value into text, which throws for some hand-made values.
  const trap = payload.website;
  const sprung = typeof trap === 'string' ? trap.trim() !== '' : trap !== undefined && trap !== null;
  if (sprung) {
    return NextResponse.json({ ok: true });
  }

  // ── the words, with no database yet ────────────────────────────────────────
  const checked = validateTake(payload);
  if (!checked.ok) return fail(checked.status, checked.error, checked.field);

  // ── a soft limit per internet address ──────────────────────────────────────
  // The address is read, counted in memory under a hash and never stored.
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '';
  if (ipTooBusy(ip)) return fail(429, MSG_IP_BUSY);

  // ── the database, failing closed and clearly ───────────────────────────────
  let admin: ReturnType<typeof adminClient>;
  try {
    admin = adminClient();
  } catch {
    console.error(
      'Hot Topics takes are off: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing. ' +
      'Set both in Vercel as well as in .env.local.',
    );
    return fail(503, 'Takes are not open yet.');
  }

  const bearer = /^Bearer\s+(\S+)$/i.exec(req.headers.get('authorization') ?? '')?.[1];

  try {
    const outcome = await submitTake(admin, checked.take, { bearer, origin: req.nextUrl.origin });
    if (outcome.ok) {
      return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
    }
    return fail(outcome.status, outcome.error, outcome.field);
  } catch (err) {
    console.error('Hot Topics takes: unexpected failure:', err);
    return fail(500, 'Something went wrong on our side. Please try again in a little while.');
  }
}
