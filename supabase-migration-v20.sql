-- ─────────────────────────────────────────────────────────────────────────────
-- Migration v20 · Events calendar infrastructure
-- Run in Supabase SQL Editor after v19
-- Safe to re-run: CREATE TABLE / INDEX use IF NOT EXISTS
--                 all policies use DROP IF EXISTS before CREATE
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Events ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS events (
  id                      UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  title                   TEXT         NOT NULL,
  organization            TEXT,
  description             TEXT,
  start_at                TIMESTAMPTZ  NOT NULL,
  end_at                  TIMESTAMPTZ,
  is_all_day              BOOLEAN      NOT NULL DEFAULT false,
  location_type           TEXT         NOT NULL DEFAULT 'online'
    CHECK (location_type IN ('in-person', 'online', 'hybrid')),
  location_name           TEXT,
  location_url            TEXT,
  event_url               TEXT,
  tags                    TEXT[]       NOT NULL DEFAULT '{}',
  source                  TEXT         NOT NULL DEFAULT 'member',
  ics_uid                 TEXT,
  submitted_by_profile_id UUID         REFERENCES profiles(id) ON DELETE SET NULL,
  is_visible              BOOLEAN      NOT NULL DEFAULT true,
  created_at              TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ  NOT NULL DEFAULT now()
);

COMMENT ON COLUMN events.source IS
  'One of "member", "admin", or the ICS feed URL this event was synced from.';
COMMENT ON COLUMN events.ics_uid IS
  'UID from the ICS VEVENT block — used for deduplication on re-sync.';

-- ── ICS feed sources ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ics_sources (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT         NOT NULL,
  ics_url         TEXT         NOT NULL UNIQUE,
  is_active       BOOLEAN      NOT NULL DEFAULT true,
  last_synced_at  TIMESTAMPTZ,
  last_error      TEXT,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

COMMENT ON TABLE ics_sources IS
  'Curated list of external iCal/ICS feeds to pull into the events table.
   Add rows here and /api/sync-calendars (daily cron) will pick them up.
   Example: name = "AXIS Dance", ics_url = "https://axisdance.org/?ical=1"';

-- ── Indexes ───────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_events_start_at
  ON events (start_at);

CREATE INDEX IF NOT EXISTS idx_events_visible_start
  ON events (is_visible, start_at);

-- Deduplication: same ICS source cannot produce two events with the same UID
CREATE UNIQUE INDEX IF NOT EXISTS idx_events_ics_dedup
  ON events (source, ics_uid)
  WHERE ics_uid IS NOT NULL;

-- ── Updated-at trigger ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_events_updated_at ON events;
CREATE TRIGGER trg_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Row Level Security ────────────────────────────────────────────────────────

ALTER TABLE events      ENABLE ROW LEVEL SECURITY;
ALTER TABLE ics_sources ENABLE ROW LEVEL SECURITY;

-- Calendar is public: anyone can read visible events
DROP POLICY IF EXISTS "events_public_read"    ON events;
CREATE POLICY         "events_public_read"    ON events
  FOR SELECT USING (is_visible = true);

-- Approved members can submit events (go live immediately, no queue)
DROP POLICY IF EXISTS "events_member_insert"  ON events;
CREATE POLICY         "events_member_insert"  ON events
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid()
        AND status  = 'approved'
    )
  );

-- Admins have full access (all operations, visible or not)
DROP POLICY IF EXISTS "events_admin_all"      ON events;
CREATE POLICY         "events_admin_all"      ON events
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- ics_sources is admin-only (sync route uses service role key, bypasses RLS)
DROP POLICY IF EXISTS "ics_sources_admin_all" ON ics_sources;
CREATE POLICY         "ics_sources_admin_all" ON ics_sources
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );
