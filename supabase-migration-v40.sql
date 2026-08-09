-- ─────────────────────────────────────────────────────────────────────────────
-- Migration v40 · Production Admin (scoped, per-production team permissions)
-- Run in Supabase SQL Editor after v39.
--
-- Why: productions (v38) are managed today by is_admin() only, which is global.
-- Adding a show's cast to admin_users so they can edit their own bio would hand
-- them the entire Collective: member approvals, the directory, the calendar,
-- and the power to appoint more admins. There is no middle tier.
--
-- This migration adds that middle tier WITHOUT touching a single existing
-- policy or function. Everything here is additive:
--
--   * production_team          who is on a given production, and in what role
--   * can_manage_production()  is_admin() OR producer on THAT production
--   * can_curate_production()  the Creator tier: producer or creator
--   * is_production_team()     on THAT production in any role
--
-- THE INVARIANT, and the whole point of this file:
--   A creator or crew member NEVER gets a row in admin_users.
--   They get a production_team row scoped to one production. That is the only
--   thing standing between "Alec edits his own away message" and "Alec can
--   approve Collective members." If you ever find yourself adding a performer
--   to admin_users to fix a permissions problem, the fix is wrong.
--
-- Also here: the per-production microsite tables (show switches, video
-- countdown, votes, audience messages). They all carry production_id so the
-- next show reuses the same code instead of forking it. The 2006 buddy-list
-- site is the first consumer; it reads this project with the anon key from its
-- own front end.
-- ─────────────────────────────────────────────────────────────────────────────


-- ── 1. Team membership ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS production_team (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  production_id  UUID        NOT NULL REFERENCES productions(id) ON DELETE CASCADE,
  user_id        UUID        REFERENCES auth.users(id) ON DELETE SET NULL,

  -- 'producer' runs the show: the whole production, its team, everything below.
  -- 'creator' is the working tier: their own profile, video approvals, playlists.
  -- 'crew' edits their own profile and nothing else.
  team_role      TEXT        NOT NULL DEFAULT 'creator'
    CHECK (team_role IN ('producer', 'creator', 'crew')),

  -- Credit line, shown publicly. Kept here rather than on profiles because a
  -- person's billing changes from show to show.
  display_name   TEXT        NOT NULL DEFAULT '',
  credit         TEXT        NOT NULL DEFAULT '',
  sort_order     INTEGER     NOT NULL DEFAULT 0,
  is_visible     BOOLEAN     NOT NULL DEFAULT true,

  -- Per-show presentation. For 2006 this is the AIM buddy-list card: screen
  -- name, away message, status, and the colors that person picked. Another
  -- show would use the same column for something else entirely, which is why
  -- it is JSONB and not thirty typed columns.
  persona        JSONB       NOT NULL DEFAULT '{}'::jsonb,

  invited_email  TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (production_id, user_id)
);

CREATE INDEX IF NOT EXISTS production_team_production_idx ON production_team (production_id);
CREATE INDEX IF NOT EXISTS production_team_user_idx       ON production_team (user_id);

COMMENT ON TABLE production_team IS
  'Who works on a production and what they may edit. Scoped permission layer:
   a row here grants rights to ONE production only. Never grants Collective
   admin. See can_manage_production().';
COMMENT ON COLUMN production_team.persona IS
  'Per-show presentation blob, shape defined by that production''s microsite.
   For "2006": { screen_name, status, idle_min, away_msg, profile, bg, fg,
   font }. Validated by the app, not the database, so a new show does not
   need a migration.';


-- ── 2. Scoped permission helpers ──────────────────────────────────────────────
-- SECURITY DEFINER for the same reason as v21: these get called from RLS
-- policies on tables that production_team policies also read, and a plain
-- query would recurse. Never inline an EXISTS against production_team in a
-- policy; call these instead.

CREATE OR REPLACE FUNCTION is_production_team(p_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM production_team
    WHERE production_id = p_id
      AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION can_manage_production(p_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT is_admin() OR EXISTS (
    SELECT 1 FROM production_team
    WHERE production_id = p_id
      AND user_id = auth.uid()
      AND team_role = 'producer'
  );
$$;

-- The Creator tier. Producers are creators too, so this is the check for
-- anything a creator may touch: video approvals, playlists.
CREATE OR REPLACE FUNCTION can_curate_production(p_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT is_admin() OR EXISTS (
    SELECT 1 FROM production_team
    WHERE production_id = p_id
      AND user_id = auth.uid()
      AND team_role IN ('producer', 'creator')
  );
$$;

GRANT EXECUTE ON FUNCTION is_production_team(UUID)    TO authenticated, anon;
GRANT EXECUTE ON FUNCTION can_manage_production(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION can_curate_production(UUID) TO authenticated, anon;

COMMENT ON FUNCTION can_manage_production(UUID) IS
  'True for Collective admins, and for producers of THIS production only.
   Use in place of is_admin() on anything production-scoped.';
COMMENT ON FUNCTION can_curate_production(UUID) IS
  'True for Collective admins, producers, and creators of THIS production.
   The Creator tier: approve videos, build playlists.';


-- ── 3. Team RLS ───────────────────────────────────────────────────────────────

ALTER TABLE production_team ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Visible team of published productions is public" ON production_team;
DROP POLICY IF EXISTS "Team members read their production roster"       ON production_team;
DROP POLICY IF EXISTS "Team members update their own row"               ON production_team;
DROP POLICY IF EXISTS "Producers manage their production team"          ON production_team;

-- Patrons see the credits of a published show.
CREATE POLICY "Visible team of published productions is public"
  ON production_team FOR SELECT TO anon, authenticated
  USING (
    is_visible
    AND EXISTS (
      SELECT 1 FROM productions p
      WHERE p.id = production_team.production_id
        AND p.status = 'published'
    )
  );

-- Anyone on the show can see the whole roster, including hidden rows, so the
-- buddy list still renders during a draft rehearsal.
CREATE POLICY "Team members read their production roster"
  ON production_team FOR SELECT TO authenticated
  USING (is_production_team(production_id));

-- The core grant: edit yourself, and only yourself.
CREATE POLICY "Team members update their own row"
  ON production_team FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Producers manage their production team"
  ON production_team FOR ALL TO authenticated
  USING (can_manage_production(production_id))
  WITH CHECK (can_manage_production(production_id));

-- Postgres RLS is row-level, not column-level, so the policy above would
-- happily let a cast member UPDATE their own row and set team_role to
-- 'producer'. Hiding the field in the UI is not a control: anyone holding the
-- anon key can call the API directly. This trigger is the actual boundary.
--
-- It does not breach the file's invariant (nobody here can reach admin_users),
-- but without it any performer could promote themselves to producer of their
-- own show and then edit the entire company's rows.

CREATE OR REPLACE FUNCTION guard_production_team_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Producers and Collective admins may change anything.
  IF can_manage_production(NEW.production_id) THEN
    RETURN NEW;
  END IF;

  IF NEW.team_role     IS DISTINCT FROM OLD.team_role
  OR NEW.production_id IS DISTINCT FROM OLD.production_id
  OR NEW.user_id       IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION
      'Only a producer of this production can change role or assignment.';
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS production_team_guard ON production_team;
CREATE TRIGGER production_team_guard BEFORE UPDATE ON production_team
  FOR EACH ROW EXECUTE FUNCTION guard_production_team_fields();


-- ── 4. Producers may edit their own production ────────────────────────────────
-- v38 gave productions to is_admin() only. Add a parallel policy so a producer
-- can edit the show they run. The v38 policies are left exactly as they are.

DROP POLICY IF EXISTS "Producers manage their own production" ON productions;
CREATE POLICY "Producers manage their own production"
  ON productions FOR ALL TO authenticated
  USING (can_manage_production(id))
  WITH CHECK (can_manage_production(id));

DROP POLICY IF EXISTS "Producers manage their own production dates" ON production_dates;
CREATE POLICY "Producers manage their own production dates"
  ON production_dates FOR ALL TO authenticated
  USING (can_manage_production(production_id))
  WITH CHECK (can_manage_production(production_id));


-- ── 5. Microsite state ────────────────────────────────────────────────────────
-- One row per production. These are the switches a producer flips from a phone
-- in the wings, which is why they are a table and not a config file.

CREATE TABLE IF NOT EXISTS production_microsite (
  production_id     UUID        PRIMARY KEY REFERENCES productions(id) ON DELETE CASCADE,

  show_mode         BOOLEAN     NOT NULL DEFAULT false,  -- audience may message the cast
  voting_open       BOOLEAN     NOT NULL DEFAULT false,
  submissions_open  BOOLEAN     NOT NULL DEFAULT true,
  marquee           TEXT        NOT NULL DEFAULT '',     -- live note to the audience

  -- Everything the microsite needs that is not a switch: links, palette,
  -- copy. Shape belongs to the microsite, not to this table.
  config            JSONB       NOT NULL DEFAULT '{}'::jsonb,

  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE production_microsite IS
  'Live switches and config for a production''s standalone site. Readable by
   anon so the microsite works signed out; writable only by that production''s
   producers.';

ALTER TABLE production_microsite ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Microsite state is public"        ON production_microsite;
DROP POLICY IF EXISTS "Producers manage microsite state" ON production_microsite;

CREATE POLICY "Microsite state is public"
  ON production_microsite FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Producers manage microsite state"
  ON production_microsite FOR ALL TO authenticated
  USING (can_manage_production(production_id))
  WITH CHECK (can_manage_production(production_id));


-- ── 6. Video countdown and votes ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS production_videos (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  production_id  UUID        NOT NULL REFERENCES productions(id) ON DELETE CASCADE,

  title          TEXT        NOT NULL,
  artist         TEXT        NOT NULL DEFAULT '',
  youtube_id     TEXT,
  submitted_by   TEXT,                                  -- audience screen name

  approved       BOOLEAN     NOT NULL DEFAULT false,    -- nothing appears unvetted
  is_inspo       BOOLEAN     NOT NULL DEFAULT false,    -- inspiration wall vs. votable
  sort_order     INTEGER     NOT NULL DEFAULT 0,

  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS production_videos_production_idx ON production_videos (production_id);

ALTER TABLE production_videos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Approved videos are public"    ON production_videos;
DROP POLICY IF EXISTS "Anyone may submit a video"     ON production_videos;
DROP POLICY IF EXISTS "Producers manage videos"       ON production_videos;
DROP POLICY IF EXISTS "Creators manage videos"        ON production_videos;

CREATE POLICY "Approved videos are public"
  ON production_videos FOR SELECT TO anon, authenticated
  USING (approved);

-- Submissions land unapproved. The WITH CHECK is what stops someone posting a
-- pre-approved row straight onto the countdown.
CREATE POLICY "Anyone may submit a video"
  ON production_videos FOR INSERT TO anon, authenticated
  WITH CHECK (approved = false);

-- Approving submissions is a Creator job, not just a producer one.
CREATE POLICY "Creators manage videos"
  ON production_videos FOR ALL TO authenticated
  USING (can_curate_production(production_id))
  WITH CHECK (can_curate_production(production_id));


-- Votes are APPEND-ONLY for the audience. Changing your vote inserts a new
-- row; the countdown counts only your most recent one. This matters: the
-- audience is anonymous, so there is no way for a policy to prove a given
-- person owns a given vote row. If anon could UPDATE or DELETE, one person
-- could rewrite or erase the whole room's votes. Append-only means the worst
-- case is ballot stuffing under invented screen names, which is visible in
-- the data and survivable in a theatre.

CREATE TABLE IF NOT EXISTS production_votes (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  production_id  UUID        NOT NULL REFERENCES productions(id) ON DELETE CASCADE,
  video_id       UUID        NOT NULL REFERENCES production_videos(id) ON DELETE CASCADE,

  -- Audience identity is a self-chosen screen name, not an account. Good
  -- enough for a theatre full of people; not a security boundary.
  screen_name    TEXT        NOT NULL,

  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS production_votes_video_idx ON production_votes (video_id);
CREATE INDEX IF NOT EXISTS production_votes_latest_idx
  ON production_votes (production_id, screen_name, created_at DESC);

ALTER TABLE production_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Vote tallies are public"   ON production_votes;
DROP POLICY IF EXISTS "Anyone may vote"           ON production_votes;
DROP POLICY IF EXISTS "Anyone may change a vote"  ON production_votes;
DROP POLICY IF EXISTS "Producers manage votes"    ON production_votes;

CREATE POLICY "Vote tallies are public"
  ON production_votes FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone may vote"
  ON production_votes FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Deliberately no anon UPDATE or DELETE. See the note above.

CREATE POLICY "Producers manage votes"
  ON production_votes FOR ALL TO authenticated
  USING (can_manage_production(production_id))
  WITH CHECK (can_manage_production(production_id));


-- ── 7. Audience messages ──────────────────────────────────────────────────────
-- The audience IMs the cast during the show. Anyone may write; only the show's
-- team may read. That asymmetry is the moderation model: a stranger cannot
-- enumerate what the room is saying, and hidden rows never reach a projector.

CREATE TABLE IF NOT EXISTS production_messages (
  id             BIGSERIAL   PRIMARY KEY,
  production_id  UUID        NOT NULL REFERENCES productions(id) ON DELETE CASCADE,

  from_name      TEXT        NOT NULL,   -- audience screen name
  to_name        TEXT        NOT NULL,   -- cast screen name
  body           TEXT        NOT NULL,

  hidden         BOOLEAN     NOT NULL DEFAULT false,
  from_team      BOOLEAN     NOT NULL DEFAULT false,  -- true = a reply from the cast

  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS production_messages_prod_idx ON production_messages (production_id, id);

ALTER TABLE production_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone may send a message"      ON production_messages;
DROP POLICY IF EXISTS "Cast replies are public"        ON production_messages;
DROP POLICY IF EXISTS "Team reads their show messages" ON production_messages;
DROP POLICY IF EXISTS "Producers manage messages"      ON production_messages;

CREATE POLICY "Anyone may send a message"
  ON production_messages FOR INSERT TO anon, authenticated
  WITH CHECK (hidden = false AND from_team = false);

-- Replies FROM the cast are readable by everyone, because they are the
-- performance: the audience has to receive them for show mode to work at all,
-- and a cast member typing in character on stage is not saying anything
-- private. The microsite filters to the reader's own screen name for display.
-- Audience-sent messages stay unreadable to anon, so nobody can sit in the
-- house and enumerate what the whole room is confessing.
CREATE POLICY "Cast replies are public"
  ON production_messages FOR SELECT TO anon, authenticated
  USING (from_team AND NOT hidden);

CREATE POLICY "Team reads their show messages"
  ON production_messages FOR SELECT TO authenticated
  USING (is_production_team(production_id));

CREATE POLICY "Producers manage messages"
  ON production_messages FOR ALL TO authenticated
  USING (can_manage_production(production_id))
  WITH CHECK (can_manage_production(production_id));


-- ── 7b. Playlists ─────────────────────────────────────────────────────────────
-- Creators build their own playlists. Everyone on the team can see everyone's,
-- but you can only edit your own unless you are a producer. Tracks live in
-- JSONB because a playlist is a list, not a relational problem, and nobody
-- needs to query across individual songs.

CREATE TABLE IF NOT EXISTS production_playlists (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  production_id  UUID        NOT NULL REFERENCES productions(id) ON DELETE CASCADE,
  created_by     UUID        REFERENCES auth.users(id) ON DELETE SET NULL,

  title          TEXT        NOT NULL,
  byline         TEXT        NOT NULL DEFAULT '',   -- "a mix by mkashe9"
  description    TEXT        NOT NULL DEFAULT '',

  -- [{ title, artist, note, youtube_id }]
  tracks         JSONB       NOT NULL DEFAULT '[]'::jsonb,

  is_visible     BOOLEAN     NOT NULL DEFAULT true,
  sort_order     INTEGER     NOT NULL DEFAULT 0,

  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS production_playlists_production_idx
  ON production_playlists (production_id);

COMMENT ON TABLE production_playlists IS
  'Mixes made by the team, shown on the production microsite. For "2006" these
   are the iPod playlists.';

ALTER TABLE production_playlists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Visible playlists are public"        ON production_playlists;
DROP POLICY IF EXISTS "Team reads all playlists"            ON production_playlists;
DROP POLICY IF EXISTS "Creators make their own playlists"   ON production_playlists;
DROP POLICY IF EXISTS "Creators edit their own playlists"   ON production_playlists;
DROP POLICY IF EXISTS "Creators delete their own playlists" ON production_playlists;
DROP POLICY IF EXISTS "Producers manage all playlists"      ON production_playlists;

CREATE POLICY "Visible playlists are public"
  ON production_playlists FOR SELECT TO anon, authenticated
  USING (
    is_visible
    AND EXISTS (
      SELECT 1 FROM productions p
      WHERE p.id = production_playlists.production_id
        AND p.status = 'published'
    )
  );

CREATE POLICY "Team reads all playlists"
  ON production_playlists FOR SELECT TO authenticated
  USING (is_production_team(production_id));

CREATE POLICY "Creators make their own playlists"
  ON production_playlists FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND can_curate_production(production_id));

CREATE POLICY "Creators edit their own playlists"
  ON production_playlists FOR UPDATE TO authenticated
  USING (created_by = auth.uid() AND can_curate_production(production_id))
  WITH CHECK (created_by = auth.uid() AND can_curate_production(production_id));

CREATE POLICY "Creators delete their own playlists"
  ON production_playlists FOR DELETE TO authenticated
  USING (created_by = auth.uid() AND can_curate_production(production_id));

CREATE POLICY "Producers manage all playlists"
  ON production_playlists FOR ALL TO authenticated
  USING (can_manage_production(production_id))
  WITH CHECK (can_manage_production(production_id));


-- ── 8. Realtime ───────────────────────────────────────────────────────────────
-- So the countdown reorders and messages arrive without anyone refreshing.

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE production_votes;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE production_messages;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE production_microsite;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ── 9. Tally view ─────────────────────────────────────────────────────────────
-- The countdown, ready to render. security_invoker so the caller's RLS applies
-- and this cannot become a way to read unapproved rows.

DROP VIEW IF EXISTS production_countdown;
CREATE VIEW production_countdown
WITH (security_invoker = true) AS
  WITH latest_vote AS (
    -- Votes are append-only, so one screen name may have several rows.
    -- Only the newest counts.
    SELECT DISTINCT ON (production_id, screen_name)
           production_id, screen_name, video_id
    FROM production_votes
    ORDER BY production_id, screen_name, created_at DESC, id DESC
  )
  SELECT
    v.id,
    v.production_id,
    v.title,
    v.artist,
    v.youtube_id,
    v.is_inspo,
    v.sort_order,
    COUNT(lv.screen_name) AS votes
  FROM production_videos v
  LEFT JOIN latest_vote lv ON lv.video_id = v.id
  WHERE v.approved
  GROUP BY v.id;

GRANT SELECT ON production_countdown TO anon, authenticated;


-- ── 10. updated_at triggers ───────────────────────────────────────────────────
-- set_updated_at() is defined in v20; reuse it rather than adding a third
-- spelling of the same function.

DROP TRIGGER IF EXISTS production_team_touch ON production_team;
CREATE TRIGGER production_team_touch BEFORE UPDATE ON production_team
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS production_microsite_touch ON production_microsite;
CREATE TRIGGER production_microsite_touch BEFORE UPDATE ON production_microsite
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS production_playlists_touch ON production_playlists;
CREATE TRIGGER production_playlists_touch BEFORE UPDATE ON production_playlists
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
