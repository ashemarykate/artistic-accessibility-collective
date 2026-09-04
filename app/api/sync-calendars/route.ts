/**
 * /api/sync-calendars
 *
 * Daily cron job: fetches every active ICS feed from ics_sources,
 * parses VEVENT blocks, and upserts events into the events table.
 *
 * Protected by CRON_SECRET — Vercel Cron adds this header automatically.
 * You can also call it manually with:
 *   curl -H "Authorization: Bearer $CRON_SECRET" https://yourdomain.com/api/sync-calendars
 *
 * Required env vars (add to Vercel):
 *   NEXT_PUBLIC_SUPABASE_URL       — already required
 *   SUPABASE_SERVICE_ROLE_KEY      — NEW: needed to bypass RLS for sync writes
 *   CRON_SECRET                    — NEW: any random string, set in Vercel too
 */

import { createClient } from '@supabase/supabase-js';
import { NextResponse }  from 'next/server';

// ── ICS parser ───────────────────────────────────────────────────────────────

interface ParsedEvent {
  uid:          string;
  title:        string;
  start:        Date;
  end:          Date | null;
  isAllDay:     boolean;
  description?: string;
  location?:    string;
  url?:         string;
}

function parseICSDate(value: string): { date: Date; isAllDay: boolean } {
  // All-day: YYYYMMDD (8 chars, no T)
  if (!value.includes('T')) {
    const y = value.slice(0, 4);
    const m = value.slice(4, 6);
    const d = value.slice(6, 8);
    return { date: new Date(`${y}-${m}-${d}T00:00:00Z`), isAllDay: true };
  }
  // Date-time: YYYYMMDDTHHMMSS or YYYYMMDDTHHMMSSZ
  const clean = value
    .replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/, '$1-$2-$3T$4:$5:$6');
  const isUTC = value.endsWith('Z');
  return { date: new Date(isUTC ? clean + 'Z' : clean), isAllDay: false };
}

function parseICS(text: string): ParsedEvent[] {
  const results: ParsedEvent[] = [];
  // Unfold continuation lines (CRLF or LF followed by space/tab)
  const unfolded = text.replace(/\r?\n[ \t]/g, '');
  const blocks   = unfolded.split(/BEGIN:VEVENT/);

  for (const block of blocks.slice(1)) {
    const end = block.indexOf('END:VEVENT');
    if (end === -1) continue;
    const content = block.substring(0, end);

    const get = (key: string): string | undefined => {
      // Match KEY or KEY;PARAM=VAL: value
      const m = content.match(new RegExp(`^${key}(?:;[^:]*)?:(.+)$`, 'm'));
      return m ? m[1].trim() : undefined;
    };

    const uid   = get('UID');
    const summ  = get('SUMMARY');
    const dtRaw = get('DTSTART');
    if (!uid || !summ || !dtRaw) continue;

    const { date: start, isAllDay } = parseICSDate(dtRaw);
    const dtEndRaw = get('DTEND');
    const end2 = dtEndRaw ? parseICSDate(dtEndRaw).date : null;

    const unescape = (s: string) =>
      s.replace(/\\n/g, '\n').replace(/\\,/g, ',').replace(/\;/g, ';').replace(/\\\\/g, '\\');

    results.push({
      uid:         unescape(uid),
      title:       unescape(summ),
      start,
      end:         end2,
      isAllDay,
      description: get('DESCRIPTION') ? unescape(get('DESCRIPTION')!) : undefined,
      location:    get('LOCATION')    ? unescape(get('LOCATION')!)    : undefined,
      url:         get('URL')         ? unescape(get('URL')!)          : undefined,
    });
  }

  return results;
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  // Verify cron secret
  const secret = process.env.CRON_SECRET;
  const auth   = request.headers.get('authorization');
  if (!secret) {
    console.error('sync-calendars: CRON_SECRET is not set, refusing to run');
    return NextResponse.json({ error: 'CRON_SECRET not set' }, { status: 500 });
  }
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json(
      { error: 'SUPABASE_SERVICE_ROLE_KEY not set' },
      { status: 500 }
    );
  }

  // Service-role client bypasses RLS
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { persistSession: false } }
  );

  // Fetch active ICS sources
  const { data: sources, error: srcErr } = await admin
    .from('ics_sources')
    .select('*')
    .eq('is_active', true);

  if (srcErr) {
    return NextResponse.json({ error: srcErr.message }, { status: 500 });
  }
  if (!sources || sources.length === 0) {
    return NextResponse.json({ message: 'No active ICS sources configured.' });
  }

  const results: Record<string, { synced: number; skipped: number; error?: string }> = {};

  // Keep events recent enough to fall within the calendar's own lookback window.
  const cutoff = Date.now() - 7 * 86_400_000;

  for (const source of sources) {
    try {
      const res  = await fetch(source.ics_url, { next: { revalidate: 0 } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();

      const parsed = parseICS(text);
      let skipped = 0;
      const rows: Record<string, unknown>[] = [];
      const seen = new Set<string>();

      for (const ev of parsed) {
        const startMs = ev.start.getTime();
        // Skip events we can't place: an unparseable start date. Guarding per
        // event means one bad date no longer aborts the whole feed.
        if (Number.isNaN(startMs)) { skipped++; continue; }
        const endMs  = ev.end ? ev.end.getTime() : NaN;
        const hasEnd = !Number.isNaN(endMs);
        // Skip anything that already ended before the calendar's window.
        if ((hasEnd ? endMs : startMs) < cutoff) { skipped++; continue; }
        // Collapse exact duplicates within a feed (same event listed twice).
        const key = `${ev.uid}|${startMs}`;
        if (seen.has(key)) { skipped++; continue; }
        seen.add(key);

        rows.push({
          title:         ev.title,
          organization:  source.name,
          description:   ev.description ?? null,
          start_at:      ev.start.toISOString(),
          end_at:        hasEnd ? ev.end!.toISOString() : null,
          is_all_day:    ev.isAllDay,
          location_name: ev.location ?? null,
          event_url:     ev.url ?? null,
          location_type: 'in-person',   // ICS doesn't reliably encode this
          source:        source.ics_url,
          ics_uid:       ev.uid,
          is_visible:    true,
          tags:          [],
        });
      }

      // Replace this feed's events wholesale: delete its existing rows, then
      // insert the current batch. Simpler and more correct than an upsert (it
      // also drops events the organiser has since removed), and it needs no
      // matching unique constraint for ON CONFLICT. Only touches this feed's
      // own rows, so member- and admin-added events are never affected.
      const { error: delErr } = await admin.from('events').delete().eq('source', source.ics_url);
      if (delErr) throw delErr;
      if (rows.length > 0) {
        const { error: insErr } = await admin.from('events').insert(rows);
        if (insErr) throw insErr;
      }

      await admin
        .from('ics_sources')
        .update({ last_synced_at: new Date().toISOString(), last_error: null })
        .eq('id', source.id);

      results[source.name] = { synced: rows.length, skipped };

    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await admin
        .from('ics_sources')
        .update({ last_error: msg })
        .eq('id', source.id);
      results[source.name] = { synced: 0, skipped: 0, error: msg };
    }
  }

  return NextResponse.json({ ok: true, results });
}
