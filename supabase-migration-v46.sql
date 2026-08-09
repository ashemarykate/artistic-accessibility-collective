-- ─────────────────────────────────────────────────────────────────────────────
-- Migration v46 · Blog posts, and the links a production keeps
-- Run in Supabase SQL Editor after v45.
--
-- 1. production_posts: writing by the company that shows up on the public
--    microsite. Same shape of permission as playlists (v40): everyone on the
--    show can read everything, you edit your own, producers edit all.
--
-- 2. Two more links on production_microsite. The company needs somewhere to
--    put the shared drive and, later, the place video submissions live. They
--    are plain columns rather than config JSON because the portal renders them
--    as fixed buttons and empty means "hide the button".
-- ─────────────────────────────────────────────────────────────────────────────


-- ── 1. Posts ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS production_posts (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  production_id  UUID        NOT NULL REFERENCES productions(id) ON DELETE CASCADE,
  created_by     UUID        REFERENCES auth.users(id) ON DELETE SET NULL,

  title          TEXT        NOT NULL DEFAULT '',
  byline         TEXT        NOT NULL DEFAULT '',   -- the screen name it posts under
  body           TEXT        NOT NULL DEFAULT '',   -- plain text, newlines kept

  is_published   BOOLEAN     NOT NULL DEFAULT false,
  pinned         BOOLEAN     NOT NULL DEFAULT false,
  posted_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS production_posts_production_idx
  ON production_posts (production_id, posted_at DESC);

COMMENT ON TABLE production_posts IS
  'Blog entries written by the company, shown on the production microsite.
   Drafts stay invisible to the public until is_published.';

ALTER TABLE production_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Published posts are public"      ON production_posts;
DROP POLICY IF EXISTS "Team reads all posts"            ON production_posts;
DROP POLICY IF EXISTS "Creators write their own posts"  ON production_posts;
DROP POLICY IF EXISTS "Creators edit their own posts"   ON production_posts;
DROP POLICY IF EXISTS "Creators delete their own posts" ON production_posts;
DROP POLICY IF EXISTS "Producers manage all posts"      ON production_posts;

CREATE POLICY "Published posts are public"
  ON production_posts FOR SELECT TO anon, authenticated
  USING (
    is_published
    AND EXISTS (
      SELECT 1 FROM productions p
      WHERE p.id = production_posts.production_id
        AND p.status IN ('published', 'archived')
    )
  );

CREATE POLICY "Team reads all posts"
  ON production_posts FOR SELECT TO authenticated
  USING (is_production_team(production_id));

CREATE POLICY "Creators write their own posts"
  ON production_posts FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND can_curate_production(production_id));

CREATE POLICY "Creators edit their own posts"
  ON production_posts FOR UPDATE TO authenticated
  USING (created_by = auth.uid() AND can_curate_production(production_id))
  WITH CHECK (created_by = auth.uid() AND can_curate_production(production_id));

CREATE POLICY "Creators delete their own posts"
  ON production_posts FOR DELETE TO authenticated
  USING (created_by = auth.uid() AND can_curate_production(production_id));

CREATE POLICY "Producers manage all posts"
  ON production_posts FOR ALL TO authenticated
  USING (can_manage_production(production_id))
  WITH CHECK (can_manage_production(production_id));

DROP TRIGGER IF EXISTS production_posts_touch ON production_posts;
CREATE TRIGGER production_posts_touch BEFORE UPDATE ON production_posts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ── 2. The links a company keeps ──────────────────────────────────────────────

ALTER TABLE production_microsite
  ADD COLUMN IF NOT EXISTS drive_url       TEXT,
  ADD COLUMN IF NOT EXISTS submissions_url TEXT,
  ADD COLUMN IF NOT EXISTS public_url      TEXT;

COMMENT ON COLUMN production_microsite.drive_url IS
  'Shared drive for the company. Shown in Backstage only, never to the public.';
COMMENT ON COLUMN production_microsite.submissions_url IS
  'Where video submissions actually live. A placeholder until the screening
   platform exists.';
COMMENT ON COLUMN production_microsite.public_url IS
  'The audience facing site for this show. For 2006 that is /2006.';

UPDATE production_microsite pm
SET public_url = '/2006'
FROM productions p
WHERE p.id = pm.production_id
  AND p.slug = '2006'
  AND pm.public_url IS NULL;


-- ── 3. Check ──────────────────────────────────────────────────────────────────

SELECT p.slug, pm.public_url, pm.drive_url, pm.submissions_url,
       (SELECT count(*) FROM production_posts x WHERE x.production_id = p.id) AS posts
FROM production_microsite pm
JOIN productions p ON p.id = pm.production_id;
