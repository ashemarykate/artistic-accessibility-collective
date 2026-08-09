-- ─────────────────────────────────────────────────────────────────────────────
-- Migration v47 · Crew can write too
-- Run in Supabase SQL Editor after v46.
--
-- Why: v40 gated playlists on can_curate_production(), which is producer or
-- creator. v46 copied that for posts. So Alec, who is crew, could reach
-- Backstage and edit his own profile but could not make a playlist or write a
-- post. That was never the intent. If you are on the show at all you should be
-- able to say something.
--
-- The rule this settles, and it is worth stating once:
--
--   Anything that is YOURS  -> anyone on the show      (is_production_team)
--   Anything that is the SHOW'S -> creators and up     (can_curate_production)
--   Anything that changes WHO CAN DO WHAT -> producers (can_manage_production)
--
-- So your own profile, your own playlists, your own posts open up to everyone.
-- Approving somebody else's video submission stays at creator, because that is
-- a decision about the show rather than about yourself.
--
-- Ownership is still enforced: every policy below keeps created_by = auth.uid().
-- Widening the role check does not let anyone touch another person's work.
-- ─────────────────────────────────────────────────────────────────────────────


-- ── Playlists: your own, whatever your role ───────────────────────────────────

DROP POLICY IF EXISTS "Creators make their own playlists"   ON production_playlists;
DROP POLICY IF EXISTS "Creators edit their own playlists"   ON production_playlists;
DROP POLICY IF EXISTS "Creators delete their own playlists" ON production_playlists;

CREATE POLICY "Anyone on the show makes their own playlists"
  ON production_playlists FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND is_production_team(production_id));

CREATE POLICY "Anyone on the show edits their own playlists"
  ON production_playlists FOR UPDATE TO authenticated
  USING (created_by = auth.uid() AND is_production_team(production_id))
  WITH CHECK (created_by = auth.uid() AND is_production_team(production_id));

CREATE POLICY "Anyone on the show deletes their own playlists"
  ON production_playlists FOR DELETE TO authenticated
  USING (created_by = auth.uid() AND is_production_team(production_id));


-- ── Posts: same ───────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Creators write their own posts"  ON production_posts;
DROP POLICY IF EXISTS "Creators edit their own posts"   ON production_posts;
DROP POLICY IF EXISTS "Creators delete their own posts" ON production_posts;

CREATE POLICY "Anyone on the show writes their own posts"
  ON production_posts FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND is_production_team(production_id));

CREATE POLICY "Anyone on the show edits their own posts"
  ON production_posts FOR UPDATE TO authenticated
  USING (created_by = auth.uid() AND is_production_team(production_id))
  WITH CHECK (created_by = auth.uid() AND is_production_team(production_id));

CREATE POLICY "Anyone on the show deletes their own posts"
  ON production_posts FOR DELETE TO authenticated
  USING (created_by = auth.uid() AND is_production_team(production_id));


-- ── Check ─────────────────────────────────────────────────────────────────────
-- Every own-your-own policy should read is_production_team, not
-- can_curate_production. Anything still saying "Creators" here is a leftover.

SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('production_playlists', 'production_posts')
ORDER BY tablename, cmd, policyname;
