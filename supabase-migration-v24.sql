-- ─────────────────────────────────────────────────────────────────────────────
-- Migration v24 · Synced calendars: website column, seed feeds, public list RPC
-- Run in Supabase SQL Editor after v23.
--
-- Lets the public /calendar page show, in its left rail, the external calendars
-- that have actually synced successfully. Pairs with /api/sync-calendars.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Human-facing homepage to link each source to ──────────────────────────
ALTER TABLE ics_sources ADD COLUMN IF NOT EXISTS website TEXT;

-- ── 2. Seed verified accessibility-arts ICS feeds ────────────────────────────
-- Each ics_url was confirmed to return live iCalendar (BEGIN:VCALENDAR / VEVENT)
-- on 2026-06-25. The daily sync (/api/sync-calendars) will pull their events.
-- Idempotent: safe to re-run.
INSERT INTO ics_sources (name, ics_url, website, is_active) VALUES
  ('Chicago Cultural Accessibility Consortium', 'https://chicagoculturalaccess.org/events/?ical=1', 'https://chicagoculturalaccess.org', true),
  ('AXIS Dance Company',                        'https://axisdance.org/calendar/?ical=1',           'https://axisdance.org',           true),
  ('Access Living',                             'https://accessliving.org/events/?ical=1',          'https://accessliving.org',        true)
ON CONFLICT (ics_url) DO UPDATE
  SET website = EXCLUDED.website,
      name    = EXCLUDED.name;

-- Optional broader source (general disability-community events, many cities).
-- Left inactive by default since it is not arts-specific; flip is_active to true
-- to enable, or add other cities from accessevents.org/cities/<city>/events.ics
INSERT INTO ics_sources (name, ics_url, website, is_active) VALUES
  ('Access Events (New York)', 'https://accessevents.org/cities/new-york/events.ics', 'https://accessevents.org', false)
ON CONFLICT (ics_url) DO NOTHING;

-- ── 3. Public RPC: calendars that synced successfully ────────────────────────
-- Returns only active sources with a successful last sync (no error). The
-- /calendar page (anon) calls this to render the "Synced calendars" rail.
-- Before the first cron run, last_synced_at is NULL, so this returns nothing.
CREATE OR REPLACE FUNCTION list_synced_calendars()
RETURNS TABLE (name text, website text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT name, website
  FROM ics_sources
  WHERE is_active = true
    AND last_synced_at IS NOT NULL
    AND last_error IS NULL
  ORDER BY name;
$$;

GRANT EXECUTE ON FUNCTION list_synced_calendars() TO anon, authenticated;
