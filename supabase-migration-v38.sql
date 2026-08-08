-- ─────────────────────────────────────────────────────────────────────────────
-- Migration v38 · Artistic Accessibility Productions
-- Run in Supabase SQL Editor after v37.
--
-- What this adds: the house-produced projects, shows and workshops that live
-- at /projects on the public site and get written in Admin -> Productions.
-- This is deliberately separate from the existing `events` table, which is a
-- lightweight community listing fed largely by ICS sync. A production carries
-- presenters, ticket tiers, photo galleries, access details and a free-write
-- post body, and one production can run on several dates in several formats.
--
-- Three new tables:
--   1. productions        one row per project/show/workshop
--   2. production_dates   one row per occurrence (Sept 5, Sept 6, Nov 14, ...)
--   3. production_rsvps   one row per person per occurrence ("I'm attending")
--
-- Plus one column on `events` (production_id) so each published occurrence is
-- mirrored onto the community calendar without anyone entering a date twice.
-- The mirror rows are written by the admin panel, not by a trigger, so a
-- production stays fully editable as a draft without leaking onto /calendar.
--
-- Storage: photo uploads go to a PUBLIC bucket named `production-photos`,
-- created in the SUPABASE dashboard (not Vercel Blob, which is a separate
-- product this code never touches). See section 9 at the bottom for the exact
-- click path and a query to confirm it worked.
-- Section 6 at the bottom sets up its access policies and is safe to re-run.
-- ─────────────────────────────────────────────────────────────────────────────

-- ============================================
-- 1. PRODUCTIONS
-- ============================================

CREATE TABLE IF NOT EXISTS productions (
  id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity + routing
  slug              TEXT         NOT NULL UNIQUE,
  title             TEXT         NOT NULL,
  tagline           TEXT,
  kind              TEXT         NOT NULL DEFAULT 'project'
    CHECK (kind IN ('workshop', 'show', 'screening', 'project', 'series', 'other')),

  -- Publishing. Drafts are admin-only; published rows are world readable.
  status            TEXT         NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived')),
  sort_order        INTEGER      NOT NULL DEFAULT 0,

  -- Short summary. Used on cards, the calendar mirror, and page metadata.
  -- Kept as plain text on purpose so it is safe to render anywhere.
  summary           TEXT,

  -- The free-write post. Sanitized HTML from the admin editor. Never render
  -- this without running it through lib/sanitize-html.ts first.
  body_html         TEXT,

  -- Repeatable structured blocks, all shaped in lib/supabase.ts:
  --   presenters   [{ name, role, bio, photo_url, photo_alt, profile_id, link_label, link_url }]
  --   ticket_tiers [{ label, price_text, note, url, sold_out }]
  --   gallery      [{ url, alt, caption }]
  --   links        [{ label, url }]
  presenters        JSONB        NOT NULL DEFAULT '[]'::jsonb,
  ticket_tiers      JSONB        NOT NULL DEFAULT '[]'::jsonb,
  gallery           JSONB        NOT NULL DEFAULT '[]'::jsonb,
  links             JSONB        NOT NULL DEFAULT '[]'::jsonb,

  -- Hero image
  hero_photo_url    TEXT,
  hero_photo_alt    TEXT,

  -- Money, in prose. Individual purchase links live on ticket_tiers.
  price_note        TEXT,

  -- Access. Feature chips render as a list; the note is free text.
  access_features   TEXT[]       NOT NULL DEFAULT '{}',
  access_note       TEXT,

  -- Human-readable schedule line, for when the exact rows read badly on their
  -- own. Example: 'Two half days, September 5 and 6, 10am to 2pm each day.'
  schedule_note     TEXT,

  contact_email     TEXT,

  -- RSVP ("I'm attending") is per production, opt-out-able, optionally capped.
  rsvp_enabled      BOOLEAN      NOT NULL DEFAULT true,
  rsvp_capacity     INTEGER,

  created_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT now()
);

COMMENT ON TABLE productions IS
  'Artistic Accessibility Productions: house-produced shows, workshops and
   projects shown at /projects. Edited in Admin -> Productions. Distinct from
   the `events` table, which is the community calendar.';
COMMENT ON COLUMN productions.body_html IS
  'Sanitized HTML from the admin rich text editor. Render only via
   sanitizeHtml() in lib/sanitize-html.ts.';
COMMENT ON COLUMN productions.rsvp_capacity IS
  'Optional cap on total RSVPs across all dates. NULL means no cap. Advisory
   only: it is enforced in the UI, not by a constraint, so an admin can always
   let one more person in.';

-- ============================================
-- 2. PRODUCTION DATES (occurrences)
-- ============================================

CREATE TABLE IF NOT EXISTS production_dates (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  production_id   UUID         NOT NULL REFERENCES productions(id) ON DELETE CASCADE,

  -- When
  start_at        TIMESTAMPTZ  NOT NULL,
  end_at          TIMESTAMPTZ,
  is_all_day      BOOLEAN      NOT NULL DEFAULT false,

  -- Where. Same vocabulary as events.location_type so the calendar mirror and
  -- the "online only" calendar filter keep working unchanged.
  location_type   TEXT         NOT NULL DEFAULT 'in-person'
    CHECK (location_type IN ('in-person', 'online', 'hybrid')),
  venue_name      TEXT,
  venue_address   TEXT,
  venue_note      TEXT,
  online_url      TEXT,
  online_note     TEXT,

  -- Per-date overrides. A November performance can sell separately from
  -- September, and a date can sell out on its own.
  label           TEXT,
  ticket_url      TEXT,
  is_sold_out     BOOLEAN      NOT NULL DEFAULT false,
  note            TEXT,

  -- Hidden dates stay in the admin list but never publish or mirror.
  is_visible      BOOLEAN      NOT NULL DEFAULT true,

  created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

COMMENT ON TABLE production_dates IS
  'One occurrence of a production. A show running online in September and in
   person in November is one productions row and several rows here.';

-- ============================================
-- 3. RSVPS ("I'm attending")
-- ============================================
-- Keyed to auth.users so it covers both account tiers uniformly: Collective
-- members and Access Card holders are both auth users with a profiles row.
-- Same shape as content_favorites (v13).

CREATE TABLE IF NOT EXISTS production_rsvps (
  id                 UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  production_id      UUID         NOT NULL REFERENCES productions(id) ON DELETE CASCADE,

  -- NULL means "attending this production" without committing to a date, which
  -- is what a production with no dates entered yet can offer.
  production_date_id UUID         REFERENCES production_dates(id) ON DELETE CASCADE,

  -- Free text the attendee can leave for the producers (access needs, plus-ones).
  note               TEXT,

  created_at         TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- One RSVP per person per date. Two partial indexes rather than a UNIQUE
-- constraint, because in Postgres NULLs are distinct: without the second index
-- someone could RSVP "no particular date" repeatedly.
CREATE UNIQUE INDEX IF NOT EXISTS idx_production_rsvps_dated
  ON production_rsvps (user_id, production_date_id)
  WHERE production_date_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_production_rsvps_undated
  ON production_rsvps (user_id, production_id)
  WHERE production_date_id IS NULL;

COMMENT ON TABLE production_rsvps IS
  'A member or Access Card holder marking themselves as attending. The seed of
   the longer-term goal of storing tickets on a profile: an order/ticket table
   would reference this row.';

-- ============================================
-- 4. CALENDAR MIRROR
-- ============================================
-- Each published, visible occurrence gets an `events` row so productions show
-- up on /calendar with no double entry. The admin panel writes these rows and
-- ON DELETE CASCADE cleans them up.

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS production_id UUID
    REFERENCES productions(id) ON DELETE CASCADE;

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS production_date_id UUID
    REFERENCES production_dates(id) ON DELETE CASCADE;

COMMENT ON COLUMN events.production_id IS
  'Set when this event row mirrors an Artistic Accessibility production. Such
   rows carry source = ''production'' and event_url = /projects/<slug>, and are
   written by the admin Productions panel rather than entered by hand.';

-- One mirror row per occurrence, so re-publishing updates instead of duplicating.
CREATE UNIQUE INDEX IF NOT EXISTS idx_events_production_date
  ON events (production_date_id)
  WHERE production_date_id IS NOT NULL;

-- ============================================
-- 5. INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_productions_status_sort
  ON productions (status, sort_order, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_production_dates_production
  ON production_dates (production_id, start_at);

CREATE INDEX IF NOT EXISTS idx_production_dates_start
  ON production_dates (start_at)
  WHERE is_visible = true;

CREATE INDEX IF NOT EXISTS idx_production_rsvps_user
  ON production_rsvps (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_production_rsvps_production
  ON production_rsvps (production_id);

-- ============================================
-- 6. UPDATED-AT TRIGGERS
-- ============================================
-- set_updated_at() is defined in v20.

DROP TRIGGER IF EXISTS trg_productions_updated_at ON productions;
CREATE TRIGGER trg_productions_updated_at
  BEFORE UPDATE ON productions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_production_dates_updated_at ON production_dates;
CREATE TRIGGER trg_production_dates_updated_at
  BEFORE UPDATE ON production_dates
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================
-- 7. ROW LEVEL SECURITY
-- ============================================
-- Admin policies use is_admin() (v21) per the v37 convention: never inline an
-- EXISTS against admin_users, because anon has no access to that table.

ALTER TABLE productions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_dates  ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_rsvps  ENABLE ROW LEVEL SECURITY;

-- ── productions ──────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Published productions are public"  ON productions;
DROP POLICY IF EXISTS "Admins manage productions"         ON productions;

-- Drafts and archived rows stay invisible to everyone but admins.
CREATE POLICY "Published productions are public"
  ON productions FOR SELECT
  USING (status = 'published');

CREATE POLICY "Admins manage productions"
  ON productions FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ── production_dates ─────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Dates of published productions are public" ON production_dates;
DROP POLICY IF EXISTS "Admins manage production dates"            ON production_dates;

CREATE POLICY "Dates of published productions are public"
  ON production_dates FOR SELECT
  USING (
    is_visible = true
    AND EXISTS (
      SELECT 1 FROM productions p
      WHERE p.id = production_dates.production_id
        AND p.status = 'published'
    )
  );

CREATE POLICY "Admins manage production dates"
  ON production_dates FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ── production_rsvps ─────────────────────────────────────────────────────────
-- Deliberately stricter than content_favorites: favorites expose public counts,
-- but an attendee list is personal. You can read your own RSVPs; admins read
-- all of them. Public attendance counts, if we ever want them, should come
-- from a SECURITY DEFINER function returning only a number.

DROP POLICY IF EXISTS "Members read their own RSVPs"   ON production_rsvps;
DROP POLICY IF EXISTS "Members create their own RSVPs" ON production_rsvps;
DROP POLICY IF EXISTS "Members update their own RSVPs" ON production_rsvps;
DROP POLICY IF EXISTS "Members delete their own RSVPs" ON production_rsvps;
DROP POLICY IF EXISTS "Admins manage all RSVPs"        ON production_rsvps;

CREATE POLICY "Members read their own RSVPs"
  ON production_rsvps FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Members create their own RSVPs"
  ON production_rsvps FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Members update their own RSVPs"
  ON production_rsvps FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Members delete their own RSVPs"
  ON production_rsvps FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins manage all RSVPs"
  ON production_rsvps FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================
-- 8. GRANTS
-- ============================================
-- Signed-out visitors read published productions and their dates; they never
-- touch RSVPs.

GRANT SELECT                         ON productions      TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE         ON productions      TO authenticated;
GRANT SELECT                         ON production_dates TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE         ON production_dates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON production_rsvps TO authenticated;

-- ============================================
-- 9. STORAGE POLICIES for the production-photos bucket
-- ============================================
-- Create the bucket first, in the SUPABASE dashboard (supabase.com), not
-- Vercel. Vercel has its own storage product called Blob, and a Blob store of
-- the same name is a different thing that this code never talks to: uploads go
-- through supabase.storage, the same way the existing profile-photos bucket
-- works. Path in Supabase:
--   your project -> Storage (left sidebar) -> New bucket
--   -> name: production-photos -> Public bucket: ON -> Create bucket
--
-- To confirm it exists:  select name, public from storage.buckets;
-- Then this section wires up who can write to it. Safe to re-run.
--
-- If the bucket does not exist yet, these policies are still created and simply
-- have nothing to apply to until it does.

DROP POLICY IF EXISTS "Production photos are publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Admins upload production photos"         ON storage.objects;
DROP POLICY IF EXISTS "Admins update production photos"         ON storage.objects;
DROP POLICY IF EXISTS "Admins delete production photos"         ON storage.objects;

CREATE POLICY "Production photos are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'production-photos');

CREATE POLICY "Admins upload production photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'production-photos' AND is_admin());

CREATE POLICY "Admins update production photos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'production-photos' AND is_admin())
  WITH CHECK (bucket_id = 'production-photos' AND is_admin());

CREATE POLICY "Admins delete production photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'production-photos' AND is_admin());

-- ─────────────────────────────────────────────────────────────────────────────
-- Done. Next steps:
--   1. Create the `production-photos` bucket (see section 9) if you have not.
--   2. Go to Admin -> Productions -> New Production and fill in the workshop
--      and the show. They stay drafts until you hit Publish.
-- ─────────────────────────────────────────────────────────────────────────────
