// Small helpers shared by the Hot Topics components. No imports, safe on the
// server and in the browser.

/** "2026-10-05" becomes "October 5, 2026". Always read as UTC so the server and
 *  the browser can never disagree about the day. Anything else comes back as is. */
export function formatDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { timeZone: 'UTC', year: 'numeric', month: 'long', day: 'numeric' });
}

/** What Heat means, shown on the topic list and on every topic page. Heat is
 *  an editor's judgment, so it is never described as a count or a vote. */
export const HEAT_EXPLAINER =
  'Heat is our rough sense of how much people disagree and how strongly. It is not a vote, and it does not say who is right.';

/** plural(1, 'reel') is "1 reel", plural(3, 'reel') is "3 reels". */
export function plural(n: number, one: string, many?: string): string {
  return `${n} ${n === 1 ? one : (many ?? `${one}s`)}`;
}

/** True only for http and https addresses. Links we render from data go through this. */
export function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}
