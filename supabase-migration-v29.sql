-- ─────────────────────────────────────────────────────────────────────────────
-- Migration v29 · Expand synced calendars: verified accessible-arts ICS feeds
-- Run in Supabase SQL Editor after v28.
--
-- Each ics_url below was actually fetched and confirmed to return live
-- iCalendar data (BEGIN:VCALENDAR / BEGIN:VEVENT with real, current events) on
-- 2026-07-02. Sourced from a research pass covering Chicago, Austin, NYC,
-- Portland, the wider US, Canada, UK, and Australia/international accessible
-- arts organizations. Idempotent: safe to re-run.
--
-- After running this, click "Sync Now" in the admin ICS Calendar Sources
-- panel (or wait for the daily cron) to pull in events from these feeds.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Chicago Cultural Accessibility Consortium rebranded ───────────────────
-- The organization seeded in v24 has renamed to "Cultural Access Collaborative"
-- and moved domains. Update the existing row in place rather than duplicate it.
UPDATE ics_sources
SET name    = 'Cultural Access Collaborative (formerly Chicago Cultural Accessibility Consortium)',
    ics_url = 'https://culturalaccesscollaborative.org/?post_type=tribe_events&ical=1&eventDisplay=list',
    website = 'https://culturalaccesscollaborative.org/',
    is_active = true
WHERE ics_url = 'https://chicagoculturalaccess.org/events/?ical=1';

-- If the row above didn't exist for some reason (e.g. v24 was never run, or the
-- URL already changed), insert it fresh instead. ON CONFLICT makes this a no-op
-- if the UPDATE above already handled it.
INSERT INTO ics_sources (name, ics_url, website, is_active) VALUES
  ('Cultural Access Collaborative (formerly Chicago Cultural Accessibility Consortium)', 'https://culturalaccesscollaborative.org/?post_type=tribe_events&ical=1&eventDisplay=list', 'https://culturalaccesscollaborative.org/', true)
ON CONFLICT (ics_url) DO UPDATE
  SET name = EXCLUDED.name, website = EXCLUDED.website, is_active = true;

-- ── 2. Newly verified accessible-arts ICS feeds ──────────────────────────────
-- Note: Access Living's org-wide events feed was independently re-verified
-- during this pass but is not included again here (already seeded in v24 under
-- a slightly different URL path); its feed is org-wide advocacy/organizing
-- events rather than arts-specific, so it wasn't worth adding a second row.
INSERT INTO ics_sources (name, ics_url, website, is_active) VALUES
  ('Arts of Life', 'https://artsoflife.org/upcoming/?ical=1', 'https://artsoflife.org/', true),
  ('Interact Center for the Visual and Performing Arts (Saint Paul/Minneapolis, MN)', 'https://interactcenterarts.org/civicrm/event/ical?reset=1', 'https://interactcenterarts.org/', true),
  ('Art Spark Texas', 'https://www.artsparktx.org/calendar/?ical=1', 'https://www.artsparktx.org/', true),
  ('UT Austin Disability Cultural Center Art Gallery', 'https://calendar.google.com/calendar/ical/c_5a1a4e88338bfeccb73b28dd0f6ee8fc833f30dd8694613a4f7124e80e999b44%40group.calendar.google.com/public/basic.ics', 'https://dcc.disability.utexas.edu/dcc-art-gallery/', true),
  ('Texas School for the Deaf Performing Arts', 'https://www.tsd.texas.gov/apps/events/ical/', 'https://www.tsd.texas.gov/apps/pages/performingarts', true),
  ('Performing Arts Interpreting Alliance (PAIA)', 'https://calendar.google.com/calendar/ical/18vag51ucoc3ndbsr5goqsfn04%40group.calendar.google.com/public/basic.ics', 'http://www.performing-arts-interpreting-alliance.com/', true),
  ('Portland Art Museum (Accessibility Programs)', 'https://portlandartmuseum.org/calendar/?ical=1', 'https://portlandartmuseum.org/accessibility/', true),
  ('AXIS Dance Company', 'https://axisdance.org/calendar/?ical=1', 'https://axisdance.org/', true),
  ('Tierra del Sol Foundation', 'https://www.tierradelsol.org/?plugin=all-in-one-event-calendar&controller=ai1ec_exporter_controller&action=export_events&no_html=true', 'https://www.tierradelsol.org/', true),
  ('Young Dance', 'https://youngdance.org/calendar/month/?ical=1', 'https://www.youngdance.org/', true),
  ('VSA Minnesota / Minnesota Access Alliance (Accessible Arts Calendar)', 'https://calendar.mnaccess.org/feed/my-calendar-ics/', 'https://mnaccess.org/', true),
  ('Detroit Disability Power - DanceAbility', 'https://calendar.google.com/calendar/ical/c_fv3li7m2tl3hi0bqtr711csnt0%40group.calendar.google.com/public/basic.ics', 'https://www.detroitdisabilitypower.org/danceability', true),
  ('NTPA Starcatchers', 'https://ntpa.org/organizer/starcatchers/?ical=1', 'https://ntpa.org/starcatchers/', true),
  ('Borderless Arts Tennessee', 'https://calendar.google.com/calendar/ical/vsaartstn%40gmail.com/public/basic.ics', 'https://borderlessartstn.org/', true),
  ('Detour Company Theatre', 'https://calendar.google.com/calendar/ical/admin%40detourcompanytheatre.org/public/basic.ics', 'https://www.detourcompanytheatre.org/', true),
  ('Propeller Dance', 'https://propellerdance.com/events/?ical=1', 'https://propellerdance.com/', true),
  ('National accessArts Centre (NaAC)', 'https://accessarts.ca/whats-on/?ical=1', 'https://accessarts.ca/', true),
  ('Arts AccessAbility Network Manitoba (AANM)', 'https://aanm.ca/events/list/?ical=1', 'https://aanm.ca/', true),
  ('Auslan Stage Left', 'https://auslanstageleft.com.au/upcoming-shows/?ical=1', 'https://auslanstageleft.com.au/', true),
  ('Arts Project Australia', 'https://www.artsproject.org.au/events/?ical=1', 'https://www.artsproject.org.au/events/', true)
ON CONFLICT (ics_url) DO UPDATE
  SET name = EXCLUDED.name, website = EXCLUDED.website, is_active = true;
