-- ─────────────────────────────────────────────────────────────────────────────
-- Migration v48 · The Graveyard, and the video links on the public page
-- Run in Supabase SQL Editor after v47.
--
-- 1. production_graves: things the show misses. The public can submit, nothing
--    appears until somebody on the company approves it, and one entry can be
--    pinned to the top.
--
-- 2. production_video_links: the categorised list of videos shown on the
--    public Videos page. A table rather than JSON because the company will add
--    to it constantly and order matters within a category.
--
-- Both follow the rule settled in v47:
--   yours            -> anyone on the show
--   the show's       -> creators and up
--   who can do what  -> producers
-- Approving a stranger's graveyard submission is a decision about the show, so
-- it sits at creator. Same as video approvals did.
-- ─────────────────────────────────────────────────────────────────────────────


-- ── 1. The Graveyard ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS production_graves (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  production_id  UUID        NOT NULL REFERENCES productions(id) ON DELETE CASCADE,

  name           TEXT        NOT NULL,               -- "MySpace Top 8"
  dates          TEXT        NOT NULL DEFAULT '',    -- "2003 to 2009"
  epitaph        TEXT        NOT NULL DEFAULT '',    -- "u were always #1"

  submitted_by   TEXT,                               -- audience screen name, if any
  approved       BOOLEAN     NOT NULL DEFAULT false,
  pinned         BOOLEAN     NOT NULL DEFAULT false,
  sort_order     INTEGER     NOT NULL DEFAULT 0,

  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS production_graves_production_idx
  ON production_graves (production_id, pinned DESC, sort_order);

COMMENT ON TABLE production_graves IS
  'Things we miss, shown in the Graveyard on the production microsite. Public
   submissions land unapproved. At most one row should be pinned; that is a
   convention the portal enforces, not a constraint, so a producer can always
   swap it without a race.';

ALTER TABLE production_graves ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Approved graves are public"   ON production_graves;
DROP POLICY IF EXISTS "Team reads all graves"        ON production_graves;
DROP POLICY IF EXISTS "Anyone may submit a grave"    ON production_graves;
DROP POLICY IF EXISTS "Creators manage graves"       ON production_graves;

CREATE POLICY "Approved graves are public"
  ON production_graves FOR SELECT TO anon, authenticated
  USING (approved);

CREATE POLICY "Team reads all graves"
  ON production_graves FOR SELECT TO authenticated
  USING (is_production_team(production_id));

-- Submissions arrive unapproved and unpinned. The WITH CHECK is what stops
-- someone posting a pre-approved row straight onto the public page.
CREATE POLICY "Anyone may submit a grave"
  ON production_graves FOR INSERT TO anon, authenticated
  WITH CHECK (approved = false AND pinned = false);

CREATE POLICY "Creators manage graves"
  ON production_graves FOR ALL TO authenticated
  USING (can_curate_production(production_id))
  WITH CHECK (can_curate_production(production_id));


-- ── 2. Video links on the public page ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS production_video_links (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  production_id  UUID        NOT NULL REFERENCES productions(id) ON DELETE CASCADE,

  category       TEXT        NOT NULL DEFAULT '',    -- free text, "emo hours"
  title          TEXT        NOT NULL DEFAULT '',
  youtube_id     TEXT        NOT NULL DEFAULT '',    -- just the id, not the URL

  sort_order     INTEGER     NOT NULL DEFAULT 0,
  is_visible     BOOLEAN     NOT NULL DEFAULT true,

  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS production_video_links_production_idx
  ON production_video_links (production_id, category, sort_order);

COMMENT ON TABLE production_video_links IS
  'The categorised video list on the public Videos page. Distinct from
   production_videos, which is the votable countdown: this one is a reading
   list the company curates, nothing is submitted to it.';

ALTER TABLE production_video_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Visible video links are public" ON production_video_links;
DROP POLICY IF EXISTS "Team reads all video links"     ON production_video_links;
DROP POLICY IF EXISTS "Creators manage video links"    ON production_video_links;

CREATE POLICY "Visible video links are public"
  ON production_video_links FOR SELECT TO anon, authenticated
  USING (is_visible);

CREATE POLICY "Team reads all video links"
  ON production_video_links FOR SELECT TO authenticated
  USING (is_production_team(production_id));

CREATE POLICY "Creators manage video links"
  ON production_video_links FOR ALL TO authenticated
  USING (can_curate_production(production_id))
  WITH CHECK (can_curate_production(production_id));


-- ── 3. Seed the Graveyard with what the site already shows ────────────────────

INSERT INTO production_graves (production_id, name, dates, epitaph, approved, sort_order)
SELECT p.id, v.name, v.dates, v.epitaph, true, v.ord
FROM productions p,
  (VALUES
    ('MySpace Top 8', '2003 to 2009',    'u were always #1',       1),
    ('Burned CDs',    'sharpie titles',  '"summer mix vol. 4"',    2),
    ('Sidekick Flip', 'click. clack.',   'we heard u in class',    3),
    ('TRL',           '1998 to 2008',    'total. request. live.',  4)
  ) AS v(name, dates, epitaph, ord)
WHERE p.slug = '2006'
  AND NOT EXISTS (
    SELECT 1 FROM production_graves g
    WHERE g.production_id = p.id AND g.name = v.name
  );


-- ── 4. Check ──────────────────────────────────────────────────────────────────

SELECT
  (SELECT count(*) FROM production_graves g
     JOIN productions p ON p.id = g.production_id WHERE p.slug = '2006') AS graves,
  (SELECT count(*) FROM production_video_links l
     JOIN productions p ON p.id = l.production_id WHERE p.slug = '2006') AS video_links;
