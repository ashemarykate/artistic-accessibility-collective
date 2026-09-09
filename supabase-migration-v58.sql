-- ─────────────────────────────────────────────────────────────────────────────
-- Migration v58 · Give the seeded wall posts real notes
-- Run in Supabase SQL Editor after v57.
--
-- WHAT WENT WRONG IN v57, because the shape of the mistake is worth keeping.
--
-- v57 seeded nine posts and wrote a notes_count straight onto each row: 44
-- notes on one, 52 on another, so the wall would not look dead on opening day.
-- But notes_count is maintained by a trigger that recomputes it as
-- count(*) FROM production_confession_notes, and v57 inserted no note rows at
-- all. So those numbers were decoration sitting on top of an empty table.
--
-- The first person to press the heart on the 44 note post would have watched it
-- become 1. Pressing again would have made it 0. Found by pressing it.
--
-- The fix is not to make the trigger cleverer. It is to make the seeded numbers
-- true: insert the note rows the counts were always claiming existed. After
-- this the trigger and the number agree, and they keep agreeing forever.
--
-- The device tags below are synthetic and obviously so. A device tag is not
-- identity anyway, it is a counter key, and these exist so that a real person
-- pressing the heart is the 45th note rather than the 1st.
-- ─────────────────────────────────────────────────────────────────────────────


-- Each seeded post has a distinct vibe, which makes vibe a safe key here and
-- avoids matching on body text with apostrophes in it.
INSERT INTO production_confession_notes (confession_id, device_tag)
SELECT c.id, 'seed-' || c.vibe || '-' || g
FROM production_confessions c
JOIN productions p ON p.id = c.production_id
CROSS JOIN LATERAL generate_series(1, (CASE c.vibe
    WHEN 'crushed'             THEN 52
    WHEN 'so random'           THEN 31
    WHEN 'hyper'               THEN 44
    WHEN 'burning a cd'        THEN 39
    WHEN 'xanga sad'           THEN 27
    WHEN 'grounded'            THEN 21
    WHEN 'whatever'            THEN 18
    WHEN 'bored in 4th period' THEN 15
    WHEN 'nostalgic'           THEN 2
    ELSE 0
  END)) AS g
WHERE p.slug = '2006'
  AND c.device_tag IS NULL          -- seeded rows only, never anything a person posted
ON CONFLICT (confession_id, device_tag) DO NOTHING;


-- The trigger fires per inserted row and has already recomputed every count.
-- This is belt and braces for the one row whose count was knocked to 0 while
-- the bug was being found, and for any future re-run.
UPDATE production_confessions c
SET notes_count = (SELECT count(*) FROM production_confession_notes n
                    WHERE n.confession_id = c.id)
FROM productions p
WHERE p.id = c.production_id AND p.slug = '2006';


-- ── Check it worked ───────────────────────────────────────────────────────────
-- Both columns must match on every row:
--
--   select c.vibe, c.notes_count,
--          (select count(*) from production_confession_notes n
--            where n.confession_id = c.id) as real_notes
--     from production_confessions c
--     join productions p on p.id = c.production_id
--    where p.slug = '2006'
--    order by c.notes_count desc;
