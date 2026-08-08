import {
  supabase,
  type Production,
  type ProductionDate,
  type ProductionWithDates,
  type ProductionRsvp,
  PRODUCTION_KIND_LABELS,
} from './supabase';

/**
 * Data layer for Artistic Accessibility Productions (migration v38).
 *
 * Two rules worth knowing before editing this file:
 *
 *  1. Drafts are protected by RLS, not by these queries. The "published only"
 *     filter exists so an admin browsing /projects sees the same thing a
 *     patron does; the actual guarantee is the policy in v38. The one
 *     deliberate exception is fetchProductionBySlug(includeDrafts), used by
 *     the admin preview link, which only returns a draft to a signed-in admin
 *     because RLS refuses everyone else.
 *
 *  2. Publishing mirrors each visible date onto the `events` table so
 *     productions appear on /calendar without being entered twice. That mirror
 *     is written from here (syncProductionToCalendar), not by a database
 *     trigger, so a draft can be edited all week without leaking.
 */

// ── Slugs ─────────────────────────────────────────────────────────────────────

/** Title to URL segment. 'Creative Access: A Workshop!' -> 'creative-access-a-workshop' */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')  // strip accents left by NFKD
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/** Appends -2, -3 ... until the slug is free. Pass the row's own id when
 *  editing so a production doesn't collide with itself. */
export async function uniqueSlug(base: string, selfId?: string): Promise<string> {
  const root = slugify(base) || 'production';
  let candidate = root;
  for (let n = 2; n < 50; n++) {
    let q = supabase.from('productions').select('id').eq('slug', candidate).limit(1);
    if (selfId) q = q.neq('id', selfId);
    const { data } = await q;
    if (!data || data.length === 0) return candidate;
    candidate = `${root}-${n}`;
  }
  return `${root}-${Date.now()}`;
}

// ── Reading ───────────────────────────────────────────────────────────────────

/** Rows come back as JSON; normalize the repeatable blocks so callers can map
 *  over them without guarding every field. */
function normalize(row: Production): Production {
  return {
    ...row,
    presenters:      Array.isArray(row.presenters) ? row.presenters : [],
    ticket_tiers:    Array.isArray(row.ticket_tiers) ? row.ticket_tiers : [],
    gallery:         Array.isArray(row.gallery) ? row.gallery : [],
    links:           Array.isArray(row.links) ? row.links : [],
    access_features: Array.isArray(row.access_features) ? row.access_features : [],
  };
}

async function attachDates(productions: Production[]): Promise<ProductionWithDates[]> {
  if (productions.length === 0) return [];
  const { data } = await supabase
    .from('production_dates')
    .select('*')
    .in('production_id', productions.map((p) => p.id))
    .order('start_at');
  const dates = (data ?? []) as ProductionDate[];
  return productions.map((p) => ({
    ...normalize(p),
    dates: dates.filter((d) => d.production_id === p.id),
  }));
}

/** Everything published, for the /projects index. Returns [] on error so the
 *  page shows its empty state rather than breaking. */
export async function fetchPublishedProductions(): Promise<ProductionWithDates[]> {
  const { data, error } = await supabase
    .from('productions')
    .select('*')
    .eq('status', 'published')
    .order('sort_order')
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return attachDates(data as Production[]);
}

/** One production for /projects/[slug]. `includeDrafts` only succeeds for an
 *  admin, since RLS hides drafts from everyone else. */
export async function fetchProductionBySlug(
  slug: string,
  includeDrafts = false,
): Promise<ProductionWithDates | null> {
  let q = supabase.from('productions').select('*').eq('slug', slug).limit(1);
  if (!includeDrafts) q = q.eq('status', 'published');
  const { data, error } = await q;
  if (error || !data || data.length === 0) return null;
  const withDates = await attachDates([data[0] as Production]);
  return withDates[0] ?? null;
}

/** Drafts included. Only returns rows to an admin (RLS). */
export async function fetchAllProductions(): Promise<ProductionWithDates[]> {
  const { data, error } = await supabase
    .from('productions')
    .select('*')
    .order('sort_order')
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return attachDates(data as Production[]);
}

// ── Dates ─────────────────────────────────────────────────────────────────────

const startOfToday = (): Date => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

/** Visible dates that haven't finished yet, soonest first. A date counts as
 *  still upcoming through the end of its own day, so an event that started at
 *  10am doesn't vanish from "upcoming" at lunchtime. */
export function upcomingDates(dates: ProductionDate[]): ProductionDate[] {
  const cutoff = startOfToday().getTime();
  return dates
    .filter((d) => d.is_visible)
    .filter((d) => {
      const end = new Date(d.end_at ?? d.start_at);
      end.setHours(23, 59, 59, 999);
      return end.getTime() >= cutoff;
    })
    .sort((a, b) => a.start_at.localeCompare(b.start_at));
}

export function nextDate(p: ProductionWithDates): ProductionDate | null {
  return upcomingDates(p.dates)[0] ?? null;
}

/** A production with dates entered, all of which have passed. Productions with
 *  no dates at all are treated as current (an ongoing project, or one still
 *  being scheduled) rather than past. */
export function isPast(p: ProductionWithDates): boolean {
  const visible = p.dates.filter((d) => d.is_visible);
  return visible.length > 0 && upcomingDates(p.dates).length === 0;
}

/** Sorts current productions by their next date, undated ones first (they're
 *  usually the ongoing projects worth leading with). */
export function sortByNextDate(list: ProductionWithDates[]): ProductionWithDates[] {
  return [...list].sort((a, b) => {
    const na = nextDate(a);
    const nb = nextDate(b);
    if (!na && !nb) return 0;
    if (!na) return -1;
    if (!nb) return 1;
    return na.start_at.localeCompare(nb.start_at);
  });
}

// ── Formatting ────────────────────────────────────────────────────────────────

const DATE_OPTS: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' };
const TIME_OPTS: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' };

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** Includes the year only when it isn't the current one, the way a person
 *  would write it. */
function withYear(d: Date): string {
  const base = d.toLocaleDateString('en-US', DATE_OPTS);
  return d.getFullYear() === new Date().getFullYear()
    ? base
    : `${base}, ${d.getFullYear()}`;
}

const fmtTime = (d: Date) =>
  d.toLocaleTimeString('en-US', TIME_OPTS).replace(':00', '').toLowerCase();

/**
 * One occurrence as a sentence, no em dashes anywhere:
 *   'Friday, September 5, 10am to 2pm'
 *   'Friday, September 5 to Saturday, September 6'
 *   'Friday, September 5, all day'
 */
export function formatDate(d: ProductionDate): string {
  const start = new Date(d.start_at);
  const end   = d.end_at ? new Date(d.end_at) : null;

  if (d.is_all_day) {
    if (end && !sameDay(start, end)) return `${withYear(start)} to ${withYear(end)}`;
    return `${withYear(start)}, all day`;
  }
  if (end && !sameDay(start, end)) {
    return `${withYear(start)}, ${fmtTime(start)} to ${withYear(end)}, ${fmtTime(end)}`;
  }
  if (end) return `${withYear(start)}, ${fmtTime(start)} to ${fmtTime(end)}`;
  return `${withYear(start)}, ${fmtTime(start)}`;
}

/** Compact form for cards and chips: 'Sep 5, 10am'. */
export function formatDateShort(d: ProductionDate): string {
  const start = new Date(d.start_at);
  const day = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return d.is_all_day ? day : `${day}, ${fmtTime(start)}`;
}

export const LOCATION_TYPE_LABELS: Record<ProductionDate['location_type'], string> = {
  'in-person': 'In person',
  'online':    'Online',
  'hybrid':    'Online and in person',
};

/** 'Online', 'In person at The Wilma', 'Online and in person'. */
export function formatWhere(d: ProductionDate): string {
  const base = LOCATION_TYPE_LABELS[d.location_type];
  if (d.venue_name && d.location_type !== 'online') return `${base} at ${d.venue_name}`;
  return base;
}

/** How a production describes itself in one phrase, for cards and page titles. */
export function kindLabel(p: Production): string {
  return PRODUCTION_KIND_LABELS[p.kind] ?? 'Event';
}

// ── Calendar mirror ───────────────────────────────────────────────────────────

/**
 * Rewrites this production's rows in the `events` table so /calendar and the
 * Learning Hub see it. Called after every admin save.
 *
 * Published: one events row per visible date. Draft or archived: no rows.
 * Implemented as delete-then-insert rather than an upsert because the mirror's
 * uniqueness comes from a partial index, which Postgres won't let ON CONFLICT
 * target. Nothing references these ids, so the churn is harmless.
 *
 * A failure here is reported but never blocks the save: the production itself
 * is already stored, and the next save retries the mirror.
 */
export async function syncProductionToCalendar(
  p: Production,
  dates: ProductionDate[],
): Promise<{ mirrored: number; error: string | null }> {
  const { error: delErr } = await supabase.from('events').delete().eq('production_id', p.id);
  if (delErr) return { mirrored: 0, error: delErr.message };

  if (p.status !== 'published') return { mirrored: 0, error: null };

  const visible = dates.filter((d) => d.is_visible);
  if (visible.length === 0) return { mirrored: 0, error: null };

  const rows = visible.map((d) => ({
    title:         d.label ? `${p.title}: ${d.label}` : p.title,
    organization:  'Artistic Accessibility',
    description:   p.summary,
    start_at:      d.start_at,
    end_at:        d.end_at,
    is_all_day:    d.is_all_day,
    location_type: d.location_type,
    location_name: d.venue_name ?? (d.location_type === 'online' ? 'Online' : null),
    location_url:  d.online_url,
    // Internal link. The calendar opens same-tab links in place (see the
    // isInternal check in app/calendar/page.tsx).
    event_url:     `/projects/${p.slug}`,
    // 'Workshop' is what lib/events.ts looks for, so a production of that kind
    // shows up in the Learning Hub with nothing extra to fill in.
    tags:          [kindLabel(p)],
    source:        'production',
    is_visible:    true,
    production_id: p.id,
    production_date_id: d.id,
  }));

  const { error: insErr } = await supabase.from('events').insert(rows);
  return { mirrored: insErr ? 0 : rows.length, error: insErr?.message ?? null };
}

// ── RSVPs ─────────────────────────────────────────────────────────────────────

/** This person's RSVPs. RLS already restricts reads to the caller's own rows;
 *  the explicit user_id filter keeps the query honest if that ever loosens. */
export async function fetchMyRsvps(userId: string): Promise<ProductionRsvp[]> {
  const { data, error } = await supabase
    .from('production_rsvps')
    .select('*')
    .eq('user_id', userId);
  if (error || !data) return [];
  return data as ProductionRsvp[];
}

/**
 * Upcoming productions this person said they're attending, soonest first, for
 * the reminder strip on the Access Card and the Collective dashboard.
 * Undated RSVPs are included, since there's nothing to have passed yet.
 */
export type AttendingRow = {
  production: ProductionWithDates;
  date: ProductionDate | null;
  rsvpId: string;
};

export async function fetchMyUpcomingAttending(userId: string): Promise<AttendingRow[]> {
  const rsvps = await fetchMyRsvps(userId);
  if (rsvps.length === 0) return [];

  const { data } = await supabase
    .from('productions')
    .select('*')
    .in('id', Array.from(new Set(rsvps.map((r) => r.production_id))));
  if (!data || data.length === 0) return [];

  const productions = await attachDates(data as Production[]);
  const cutoff = startOfToday().getTime();

  const out = rsvps.flatMap<AttendingRow>((r) => {
    const production = productions.find((p) => p.id === r.production_id);
    if (!production) return [];
    if (!r.production_date_id) return [{ production, date: null, rsvpId: r.id }];
    const date = production.dates.find((d) => d.id === r.production_date_id);
    if (!date) return [];
    const end = new Date(date.end_at ?? date.start_at);
    end.setHours(23, 59, 59, 999);
    if (end.getTime() < cutoff) return [];
    return [{ production, date, rsvpId: r.id }];
  });

  return out.sort((a, b) => {
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;   // undated sinks below things with a real date
    if (!b.date) return -1;
    return a.date.start_at.localeCompare(b.date.start_at);
  });
}
