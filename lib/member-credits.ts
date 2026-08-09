import { supabase } from './supabase';

/**
 * Collective Projects on a member profile.
 *
 * Reads the member_production_credits view (migration v41), which already
 * sorts each production into past, current, or future and already respects
 * RLS, so nothing here needs to filter for drafts.
 *
 * Worth knowing: a production team member does not need to be a Collective
 * member. This only ever returns work for people whose production_team row
 * carries a user_id. Someone with no account has no credits here, and that is
 * correct rather than a bug to fix.
 */

export type Timeframe = 'past' | 'current' | 'future';

export interface MemberCredit {
  user_id: string;
  production_id: string;
  slug: string;
  title: string;
  tagline: string | null;
  kind: string;
  status: 'draft' | 'published' | 'archived';
  hero_photo_url: string | null;
  credit: string;
  team_role: 'producer' | 'creator' | 'crew';
  display_name: string;
  first_start: string | null;
  last_end: string | null;
  timeframe: Timeframe;
}

export interface GroupedCredits {
  current: MemberCredit[];
  future: MemberCredit[];
  past: MemberCredit[];
  total: number;
}

/** Where a production's public page lives. */
export function productionHref(slug: string): string {
  return `/projects/${slug}`;
}

/** Every credit for one person, newest work first inside each group. */
export async function fetchMemberCredits(userId: string): Promise<GroupedCredits> {
  const { data, error } = await supabase
    .from('member_production_credits')
    .select('*')
    .eq('user_id', userId);

  const empty: GroupedCredits = { current: [], future: [], past: [], total: 0 };
  if (error || !data) return empty;

  const rows = data as MemberCredit[];

  // Undated work sorts to the top of its group: it is either the thing being
  // made right now or the thing just announced, and both deserve the position.
  const byDate = (a: MemberCredit, b: MemberCredit) => {
    const av = a.first_start ? Date.parse(a.first_start) : Number.POSITIVE_INFINITY;
    const bv = b.first_start ? Date.parse(b.first_start) : Number.POSITIVE_INFINITY;
    return bv - av;
  };

  const grouped: GroupedCredits = {
    current: rows.filter((r) => r.timeframe === 'current').sort(byDate),
    future: rows.filter((r) => r.timeframe === 'future').sort(byDate),
    past: rows.filter((r) => r.timeframe === 'past').sort(byDate),
    total: rows.length,
  };
  return grouped;
}

/**
 * Section headings, in display order.
 *
 * Copy rule from CLAUDE.md applies here as much as anywhere: zero em dashes,
 * plain language, written to a person reading a profile.
 */
export const CREDIT_GROUPS: { key: keyof Omit<GroupedCredits, 'total'>; label: string; blurb: string }[] = [
  {
    key: 'current',
    label: 'Working on now',
    blurb: 'In production, or running at the moment.',
  },
  {
    key: 'future',
    label: 'Coming up',
    blurb: 'Announced, with dates still ahead.',
  },
  {
    key: 'past',
    label: 'Past work',
    blurb: 'Finished and archived. The pages are still there to look at.',
  },
];

/** One line under a credit: what they did, and when. */
export function creditLine(c: MemberCredit): string {
  const when = formatRun(c.first_start, c.last_end);
  if (c.credit && when) return `${c.credit}, ${when}`;
  return c.credit || when || '';
}

function formatRun(start: string | null, end: string | null): string {
  if (!start) return '';
  const s = new Date(start);
  const e = end ? new Date(end) : null;
  const year = s.getFullYear();
  const month = s.toLocaleString(undefined, { month: 'long' });

  if (!e || sameMonth(s, e)) return `${month} ${year}`;
  if (s.getFullYear() === e.getFullYear()) {
    return `${month} to ${e.toLocaleString(undefined, { month: 'long' })} ${year}`;
  }
  return `${month} ${year} to ${e.toLocaleString(undefined, { month: 'long' })} ${e.getFullYear()}`;
}

function sameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}
