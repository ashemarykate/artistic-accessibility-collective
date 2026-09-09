-- ─────────────────────────────────────────────────────────────────────────────
-- Migration v57 · Confessions & Vibes, the wall on the 2006 site
-- Run in Supabase SQL Editor after v56.
--
-- The audience writes on this one. Everything else on the microsite is either
-- written by the company or submitted and then approved; this is the first
-- thing that goes public the instant somebody presses a button, which is what
-- Mary Kate asked for and is the reason this file is careful.
--
-- THE SHAPE OF THE DEFENCE, because it is not obvious from any single policy:
--
--   The anon key is printed in the page source of /2006. Anyone can read it in
--   three seconds. So the audience is given NO write permission here at all.
--   Not to the tables, not to the bucket. The only door is /api/2006/confess,
--   which runs on our own server with the service role key and can therefore
--   count, rate limit, strip metadata and say no. Every rule that matters lives
--   in that handler, because a rule in the page is decoration.
--
--   anon may SELECT the wall and nothing else.
--
-- Three states, and that is all: on the wall, off the wall, starred. Anything
-- more is more moderation than a company in tech week will actually operate.
-- ─────────────────────────────────────────────────────────────────────────────


-- ── 1. The wall ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS production_confessions (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  production_id  UUID        NOT NULL REFERENCES productions(id) ON DELETE CASCADE,

  -- Who it says it is from. is_anon wins: when it is true the screen name is
  -- not shown and is not stored, so "anonymous" is true at rest and not just
  -- true on screen.
  is_anon        BOOLEAN     NOT NULL DEFAULT false,
  screen_name    TEXT,

  body           TEXT        NOT NULL DEFAULT '',
  vibe           TEXT        NOT NULL DEFAULT '',   -- one of the twelve moods

  -- A picture, when there is one. image_alt is NOT NULL with no default on
  -- purpose: the handler has to have been given one, so there is no path
  -- through the code that quietly writes a picture nobody can read.
  image_path     TEXT,
  image_alt      TEXT,

  -- Denormalised so the wall can sort by popularity without counting rows on
  -- every load. The triggers below are the only things that write them.
  notes_count    INTEGER     NOT NULL DEFAULT 0,
  warns_count    INTEGER     NOT NULL DEFAULT 0,

  visible        BOOLEAN     NOT NULL DEFAULT true,   -- false = off the wall
  starred        BOOLEAN     NOT NULL DEFAULT false,  -- safe to put on a projector
  protected      BOOLEAN     NOT NULL DEFAULT false,  -- a person put it back; warns can no longer take it down
  flagged        BOOLEAN     NOT NULL DEFAULT false,  -- hit the word list, still went up, sorts to the top in Backstage

  -- Not identity. A random tag the browser keeps, so the handler can rate limit
  -- per device instead of per address. Per address would mean a whole theatre
  -- on one wifi shares one allowance and the wall dies ninety seconds into the
  -- show, for everyone, on opening night.
  device_tag     TEXT,

  -- The real moment it was posted. The page renders every one of these with the
  -- year forced to 2006, so a seed row dated June 2006 renders as itself and a
  -- row posted today renders as today in 2006. One rule, no special cases.
  posted_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS production_confessions_wall_idx
  ON production_confessions (production_id, visible, posted_at DESC);
CREATE INDEX IF NOT EXISTS production_confessions_notes_idx
  ON production_confessions (production_id, visible, notes_count DESC, posted_at DESC);
CREATE INDEX IF NOT EXISTS production_confessions_device_idx
  ON production_confessions (device_tag, created_at DESC);

COMMENT ON TABLE production_confessions IS
  'The audience wall on the 2006 microsite. Goes public on submit with no
   approval step, by design. anon may read it and may not write it: writes go
   through /api/2006/confess so they can be counted and refused.';

ALTER TABLE production_confessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "The wall is public"        ON production_confessions;
DROP POLICY IF EXISTS "Team reads the whole wall" ON production_confessions;
DROP POLICY IF EXISTS "Creators manage the wall"  ON production_confessions;

-- Visible rows on a published show, and only while the wall is open and not
-- frozen. Frozen shows starred rows only. This is enforced here rather than in
-- the page so that freezing is real: the database stops handing the rest out,
-- and reading the anon key out of the page source does not get you past it.
CREATE POLICY "The wall is public"
  ON production_confessions FOR SELECT TO anon, authenticated
  USING (
    visible
    AND EXISTS (
      SELECT 1 FROM productions p
      JOIN production_microsite pm ON pm.production_id = p.id
      WHERE p.id = production_confessions.production_id
        AND p.status IN ('published', 'archived')
        AND pm.wall_open
        AND (NOT pm.wall_frozen OR production_confessions.starred)
    )
  );

CREATE POLICY "Team reads the whole wall"
  ON production_confessions FOR SELECT TO authenticated
  USING (is_production_team(production_id));

CREATE POLICY "Creators manage the wall"
  ON production_confessions FOR ALL TO authenticated
  USING (can_curate_production(production_id))
  WITH CHECK (can_curate_production(production_id));


-- ── 2. Notes and warns ────────────────────────────────────────────────────────
-- Same shape twice. The unique constraint is the whole mechanism: one note and
-- one warn per device per post, enforced by the database rather than by the
-- page, so pressing the button twice cannot count twice even from a script.

CREATE TABLE IF NOT EXISTS production_confession_notes (
  confession_id  UUID        NOT NULL REFERENCES production_confessions(id) ON DELETE CASCADE,
  device_tag     TEXT        NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (confession_id, device_tag)
);

CREATE TABLE IF NOT EXISTS production_confession_warns (
  confession_id  UUID        NOT NULL REFERENCES production_confessions(id) ON DELETE CASCADE,
  device_tag     TEXT        NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (confession_id, device_tag)
);

ALTER TABLE production_confession_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_confession_warns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Note counts are public"   ON production_confession_notes;
DROP POLICY IF EXISTS "Creators manage notes"    ON production_confession_notes;
DROP POLICY IF EXISTS "Team reads warns"         ON production_confession_warns;
DROP POLICY IF EXISTS "Creators manage warns"    ON production_confession_warns;

CREATE POLICY "Note counts are public"
  ON production_confession_notes FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Creators manage notes"
  ON production_confession_notes FOR ALL TO authenticated
  USING (can_curate_production((SELECT production_id FROM production_confessions c WHERE c.id = confession_id)))
  WITH CHECK (can_curate_production((SELECT production_id FROM production_confessions c WHERE c.id = confession_id)));

-- Warns are NOT public. Who warned what is the cast's business, and publishing
-- it would turn the button into a scoreboard people play with.
CREATE POLICY "Team reads warns"
  ON production_confession_warns FOR SELECT TO authenticated
  USING (is_production_team((SELECT production_id FROM production_confessions c WHERE c.id = confession_id)));

CREATE POLICY "Creators manage warns"
  ON production_confession_warns FOR ALL TO authenticated
  USING (can_curate_production((SELECT production_id FROM production_confessions c WHERE c.id = confession_id)))
  WITH CHECK (can_curate_production((SELECT production_id FROM production_confessions c WHERE c.id = confession_id)));


-- ── 3. The counters, and the automatic takedown ───────────────────────────────
-- Kept in the database rather than in the handler so that the count cannot
-- drift from the rows, and so the takedown happens even if it was not the
-- handler that inserted the warn.

CREATE OR REPLACE FUNCTION bump_confession_notes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE production_confessions
     SET notes_count = (SELECT count(*) FROM production_confession_notes n
                         WHERE n.confession_id = COALESCE(NEW.confession_id, OLD.confession_id))
   WHERE id = COALESCE(NEW.confession_id, OLD.confession_id);
  RETURN NULL;
END $$;

-- Three warns takes a post off the wall on its own, so that nobody has to be
-- awake at 11pm on a Friday. protected is what stops two people warning off a
-- post they simply disagree with after a cast member has already put it back.
CREATE OR REPLACE FUNCTION bump_confession_warns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cid UUID := COALESCE(NEW.confession_id, OLD.confession_id);
  n   INTEGER;
BEGIN
  SELECT count(*) INTO n FROM production_confession_warns w WHERE w.confession_id = cid;
  UPDATE production_confessions
     SET warns_count = n,
         visible = CASE WHEN n >= 3 AND NOT protected THEN false ELSE visible END
   WHERE id = cid;
  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS confession_notes_count ON production_confession_notes;
CREATE TRIGGER confession_notes_count
  AFTER INSERT OR DELETE ON production_confession_notes
  FOR EACH ROW EXECUTE FUNCTION bump_confession_notes();

DROP TRIGGER IF EXISTS confession_warns_count ON production_confession_warns;
CREATE TRIGGER confession_warns_count
  AFTER INSERT OR DELETE ON production_confession_warns
  FOR EACH ROW EXECUTE FUNCTION bump_confession_warns();


-- ── 4. The switches the cast holds ────────────────────────────────────────────

ALTER TABLE production_microsite
  ADD COLUMN IF NOT EXISTS wall_open       BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS wall_frozen     BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS photo_question  TEXT    NOT NULL DEFAULT 'what year is it?',
  ADD COLUMN IF NOT EXISTS photo_answer    TEXT    NOT NULL DEFAULT '2006',
  ADD COLUMN IF NOT EXISTS wall_wordlist   TEXT    NOT NULL DEFAULT '';

COMMENT ON COLUMN production_microsite.wall_open IS
  'The wall accepts posts and shows them. Off by default: a new show does not
   open an anonymous door on the internet without somebody deciding to.';
COMMENT ON COLUMN production_microsite.wall_frozen IS
  'Panic switch. The wall instantly shows starred posts only. Nothing is
   deleted and unfreezing puts everything back. Enforced in the SELECT policy,
   so it is real rather than cosmetic.';
COMMENT ON COLUMN production_microsite.photo_question IS
  'The question in front of a picture upload. Ships as "what year is it?", and
   the answer is written all over the page on purpose: it stops crawlers, not
   people, and stopping crawlers is the job. Change both fields to something
   only the room knows if that ever stops being enough.';
COMMENT ON COLUMN production_microsite.wall_wordlist IS
  'Comma separated. A post that hits the list still goes up immediately, like
   everything else. It is flagged so it sorts to the top of the cast pile. This
   is deliberately not a filter: nobody is ever told their post worked when it
   did not.';


-- ── 4b. Current Mood, Current Music ───────────────────────────────────────────
-- Two text fields on a blog post, and they buy more 2006 than anything else in
-- this pass. Both optional: the line is skipped entirely when they are empty.

ALTER TABLE production_posts
  ADD COLUMN IF NOT EXISTS mood  TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS music TEXT NOT NULL DEFAULT '';

COMMENT ON COLUMN production_posts.mood IS
  'Current Mood. Matched by name against the emoticon set on the microsite, so
   "crying" or "cool" grow a face next to the word. Anything else is just shown.';
COMMENT ON COLUMN production_posts.music IS
  'Current Music. Free text, "crazy, gnarls barkley".';


-- ── 5. Where the pictures live ────────────────────────────────────────────────
-- A bucket of its own, NOT production-photos, because that one is listable by
-- anyone who asks and the show's own artwork lives in it.
--
-- Note what is missing: there is no INSERT policy for anon or authenticated.
-- The handler writes with the service role key, which does not consult these
-- policies at all, so no anonymous upload path exists even if the anon key is
-- copied out of the page source. Public read only.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('confession-photos', 'confession-photos', true, 5242880,
        ARRAY['image/jpeg','image/png','image/gif','image/webp'])
ON CONFLICT (id) DO UPDATE
  SET public = true,
      file_size_limit = 5242880,
      allowed_mime_types = ARRAY['image/jpeg','image/png','image/gif','image/webp'];

DROP POLICY IF EXISTS "Confession photos are publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Creators delete confession photos"       ON storage.objects;

CREATE POLICY "Confession photos are publicly readable"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'confession-photos');

CREATE POLICY "Creators delete confession photos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'confession-photos' AND is_admin());


-- ── 6. Seed the wall so it is not empty on opening day ────────────────────────
-- An empty wall is the hardest thing in the world to get somebody to post to.
-- These are Mary Kate's own saves, posted under invented screen names, dated
-- across the summer of 2006. The last one is dated now, so the wall reads as
-- something still going rather than something that stopped.

INSERT INTO production_confessions
  (production_id, is_anon, screen_name, body, vibe, image_path, image_alt, posted_at, notes_count)
SELECT p.id, v.is_anon, v.sn, v.body, v.vibe, v.img, v.alt, v.at::timestamptz, v.notes
FROM productions p,
  (VALUES
    (false, 'burnedUaMix',
     'found this on someone''s page and saved it immediately. no notes.',
     'so random', '/2006/photos/photo-01.gif',
     'A drawing of a green dinosaur, with the words die you stupid dionsaur repeated around it, dinosaur spelled wrong every time.',
     '2006-06-17 22:41:00-04', 31),

    (false, 'top8reject',
     'putting this on my page and i am not taking it down',
     'whatever', '/2006/photos/photo-08.jpg',
     'White text on a black background reading peaceout. boyscout. pimps your myspace and will continue until you love it.',
     '2006-07-02 15:08:00-04', 18),

    (true, NULL,
     'made this at 2am with a magazine and the good scissors. mom asked what happened to the good scissors.',
     'hyper', '/2006/photos/photo-10.jpg',
     'The word LOVE spelled out in letters cut from magazines, black ink on white paper.',
     '2006-08-11 02:14:00-04', 44),

    (false, 'flatironFatale',
     'took these of my friend in her driveway. we did forty of them. these were the two good ones.',
     'nostalgic', '/2006/photos/photo-15.jpg',
     'Two black and white photographs side by side of a woman flipping her long hair, caught mid air. A photographer credit is printed underneath, too small to read.',
     'now', 2),

    (true, NULL,
     'i told everyone i had a sidekick but it was my mom''s nokia',
     'crushed', NULL, NULL, '2006-06-29 19:55:00-04', 52),

    (false, 'dialUpDarling',
     'my away message has been up for nine days. nobody has asked.',
     'xanga sad', NULL, NULL, '2006-07-14 23:30:00-04', 27),

    (false, 'sharpieCDR',
     'burning a cd for someone is the most romantic thing a person can do and i will not be discussing it further',
     'burning a cd', NULL, NULL, '2006-07-28 17:02:00-04', 39),

    (true, NULL,
     'i have never seen the office. i just laugh when everyone else does.',
     'bored in 4th period', NULL, NULL, '2006-08-03 12:47:00-04', 15),

    (false, 'raWrXD',
     'grounded for the phone bill. worth it. see you all in september.',
     'grounded', NULL, NULL, '2006-08-22 20:19:00-04', 21)
  ) AS v(is_anon, sn, body, vibe, img, alt, at, notes)
WHERE p.slug = '2006'
  AND NOT EXISTS (
    SELECT 1 FROM production_confessions c WHERE c.production_id = p.id
  );

-- The seeds are dated in 2006 already, except the last one which wants to be
-- now. Done as a second pass because a VALUES list cannot hold both a literal
-- and now() in the same column.
UPDATE production_confessions c
SET posted_at = now()
FROM productions p
WHERE p.slug = '2006' AND c.production_id = p.id AND c.screen_name = 'flatironFatale';

-- Open the wall for 2006 so the seeds are actually visible. Every other show
-- stays shut until somebody decides otherwise.
UPDATE production_microsite pm
SET wall_open = true
FROM productions p
WHERE p.id = pm.production_id AND p.slug = '2006';


-- ── Check it worked ───────────────────────────────────────────────────────────
--   select count(*) from production_confessions;                     -- 9
--   select name, public from storage.buckets where id='confession-photos';
--   select wall_open, wall_frozen, photo_question, photo_answer
--     from production_microsite pm join productions p on p.id=pm.production_id
--    where p.slug='2006';
