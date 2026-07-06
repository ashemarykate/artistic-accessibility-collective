import { supabase, type CalEvent } from './supabase';

// Which calendar events count as "educational" for the Learning Hub. Two
// signals so it works for both curated events (which carry accessibility tags)
// and ICS-synced events (which have no tags, only a title/description):
//   1. an explicit Workshop / Lecture-Talk tag, or
//   2. an education keyword in the title or description.
// This is the same idea as the calendar's classifyEvent 'education' bucket,
// kept here as a small standalone predicate so the Learning Hub doesn't need to
// import the whole calendar page.
const EDU_TAGS = ['Workshop', 'Lecture / Talk'];
const EDU_RE = /\b(workshop|class(?:es)?|camp|course|lesson|seminar|training|lecture|panel|masterclass|intensive|webinar|conference)\b/i;

export function isEducational(ev: CalEvent): boolean {
  if (Array.isArray(ev.tags) && ev.tags.some(t => EDU_TAGS.includes(t))) return true;
  return EDU_RE.test(`${ev.title ?? ''} ${ev.description ?? ''}`);
}

/** Upcoming educational events, soonest first. One event, entered once on the
 *  calendar, surfaces here too. Returns [] on any error (the card just hides). */
export async function fetchUpcomingEducationalEvents(limit = 6): Promise<CalEvent[]> {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('is_visible', true)
    .gte('start_at', startOfToday.toISOString())
    .order('start_at')
    .limit(200);
  if (error || !data) return [];
  return (data as CalEvent[]).filter(isEducational).slice(0, limit);
}
