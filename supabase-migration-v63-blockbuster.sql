-- ─────────────────────────────────────────────────────────────────────────────
-- Migration v63 · OUR 2006 BLOCKBUSTERS
-- Run in Supabase SQL Editor. Needs productions (v38) and the production team
-- helpers (v40). Safe to re-run.
--
-- A list of films, shown on the public site under Reminisce and edited in
-- Backstage. Deliberately plainer than production_videos: no youtube id, no
-- votes, no approval queue. It is a list of titles on a wall.
--
-- `emphasis` is the whole visual idea. A Blockbuster shelf was never uniformly
-- typeset, so each title carries how it should be set: normal, italic, bold, or
-- both. The company picks per title, which is why it is stored rather than
-- derived from position.
--
-- `note` is the aside in brackets, for the Flushed Away case: the memory is the
-- singing slugs in the trailer, not the film.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS production_movies (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  production_id  UUID        NOT NULL REFERENCES productions(id) ON DELETE CASCADE,

  title          TEXT        NOT NULL DEFAULT '',
  note           TEXT        NOT NULL DEFAULT '',

  emphasis       TEXT        NOT NULL DEFAULT 'normal'
    CHECK (emphasis IN ('normal', 'italic', 'bold', 'bolditalic')),

  sort_order     INTEGER     NOT NULL DEFAULT 0,
  is_visible     BOOLEAN     NOT NULL DEFAULT true,

  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS production_movies_production_idx
  ON production_movies (production_id, sort_order);

COMMENT ON TABLE production_movies IS
  'The Blockbuster list on a production microsite. Curated by the company, not
   submitted by the public, so there is no approved flag: is_visible is enough.';

ALTER TABLE production_movies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Visible movies are public"  ON production_movies;
DROP POLICY IF EXISTS "Team reads all movies"      ON production_movies;
DROP POLICY IF EXISTS "Creators manage movies"     ON production_movies;

CREATE POLICY "Visible movies are public"
  ON production_movies FOR SELECT TO anon, authenticated
  USING (is_visible);

CREATE POLICY "Team reads all movies"
  ON production_movies FOR SELECT TO authenticated
  USING (is_production_team(production_id));

CREATE POLICY "Creators manage movies"
  ON production_movies FOR ALL TO authenticated
  USING (can_curate_production(production_id))
  WITH CHECK (can_curate_production(production_id));


-- ── Seed the ones we started with ─────────────────────────────────────────────

INSERT INTO production_movies (production_id, title, note, emphasis, sort_order)
SELECT p.id, v.title, v.note, v.emphasis, v.ord
FROM productions p,
  (VALUES
    ('Nacho Libre',           '',                                                 'bold',       1),
    ('The Devil Wears Prada', '',                                                 'italic',     2),
    ('Monster House',         '',                                                 'normal',     3),
    ('Flushed Away',          'not the movie, the singing guys from the trailer',  'bolditalic', 4),
    ('Tokyo Drift',           '',                                                 'italic',     5)
  ) AS v(title, note, emphasis, ord)
WHERE p.slug = '2006'
  AND NOT EXISTS (
    SELECT 1 FROM production_movies m
    WHERE m.production_id = p.id AND m.title = v.title
  );


-- ── Check ─────────────────────────────────────────────────────────────────────

SELECT m.sort_order, m.title, m.emphasis, m.note
FROM production_movies m
JOIN productions p ON p.id = m.production_id
WHERE p.slug = '2006'
ORDER BY m.sort_order;
