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
  if (secret && auth !== `Bearer ${secret}`) {
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

  for (const source of sources) {
    try {
      const res  = await fetch(source.ics_url, { next: { revalidate: 0 } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();

      const parsed = parseICS(text);
      let synced = 0;
      let skipped = 0;

      for (const ev of parsed) {
        // Skip events in the past (more than 24h ago)
        if (ev.end && ev.end < new Date(Date.now() - 86_400_000)) {
          skipped++;
          continue;
        }

        const { error: upsertErr } = await admin
          .from('events')
          .upsert({
            title:         ev.title,
            organization:  source.name,
            description:   ev.description ?? null,
            start_at:      ev.start.toISOString(),
            end_at:        ev.end?.toISOString() ?? null,
            is_all_day:    ev.isAllDay,
            location_name: ev.location ?? null,
            event_url:     ev.url ?? null,
            location_type: 'in-person',   // ICS doesn't reliably encode this
            source:        source.ics_url,
            ics_uid:       ev.uid,
            is_visible:    true,
            tags:          [],
          }, {
            onConflict: 'source,ics_uid',
            ignoreDuplicates: false,   // update title/time if event changes
          });

        if (upsertErr) {
          console.error(`Upsert error for ${ev.uid}:`, upsertErr.message);
          skipped++;
        } else {
          synced++;
        }
      }

      // Update last_synced_at
      await admin
        .from('ics_sources')
        .update({ last_synced_at: new Date().toISOString(), last_error: null })
        .eq('id', source.id);

      results[source.name] = { synced, skipped };

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
