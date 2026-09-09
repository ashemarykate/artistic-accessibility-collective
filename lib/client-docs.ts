import { notFound } from 'next/navigation';

/**
 * The gate on client-facing documents: accessibility reports and staffing
 * price-outs.
 *
 * These are drafts about named organisations, with real findings and real
 * numbers in them, and Mary Kate is still writing them. Until this gate they
 * were served to anybody who had or guessed the address. `noindex` and
 * robots.txt do not help with that: they ask search engines not to list a
 * page, they do not stop a person opening it.
 *
 * How it works, and why this shape:
 *
 *  - Locally, everything opens as before, so writing a report never involves
 *    a password.
 *
 *  - In production, a document renders only when CLIENT_DOCS_KEY is set in the
 *    environment AND the address carries a matching ?key=. Anything else is a
 *    404, the same 404 a made-up slug gets, so the address does not confirm
 *    that a report for that organisation exists.
 *
 *  - It fails closed. With no CLIENT_DOCS_KEY set, every one of these is a 404
 *    in production, including for Mary Kate. That is deliberate: the safe
 *    state is the default, and opening the door is a decision she makes rather
 *    than one she inherits. Same idea as CRON_SECRET on the scheduled jobs.
 *
 * To use it: set CLIENT_DOCS_KEY in Vercel to a long random string, then visit
 *   /reports/<slug>?key=<that string>
 * and bookmark it. To share one with a client, send that same link. To close
 * everything again, delete the variable.
 *
 * When these documents stop being drafts and need proper per-client access,
 * this is the single place to change.
 */

/** Compares without leaking how much of the key was right, via timing. */
function sameKey(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Call at the top of a client-facing document page, before rendering anything.
 * Returns normally when the visitor may see it, and 404s when they may not.
 */
export function requireClientDocAccess(searchParams: Record<string, string | string[] | undefined>) {
  if (process.env.NODE_ENV !== 'production') return;

  const expected = process.env.CLIENT_DOCS_KEY;
  if (!expected) notFound();

  const raw = searchParams?.key;
  const given = Array.isArray(raw) ? raw[0] : raw;
  if (!given || !sameKey(given, expected)) notFound();
}
