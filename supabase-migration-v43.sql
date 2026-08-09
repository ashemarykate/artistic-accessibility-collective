-- ─────────────────────────────────────────────────────────────────────────────
-- Migration v43 · A production's wallpaper, and two persona fields I missed
-- Run in Supabase SQL Editor after v42.
--
-- Two unrelated small things, kept together because both are one line fixes to
-- work already in flight.
--
-- 1. Every production gets a background image. The microsite already uses one
--    (the 2006 desk collage). Putting it in the database means the Production
--    Admin can wear it too, so anyone working in the portal can tell at a
--    glance which show they are editing, and can tell the Production Admin
--    apart from the Collective admin without reading the header.
--
-- 2. The 2006 personas are missing two keys the microsite now reads. They were
--    added to the site after the seed was written, so every persona in the
--    database is one revision behind. Section 2 backfills them.
-- ─────────────────────────────────────────────────────────────────────────────


-- ── 1. Wallpaper ──────────────────────────────────────────────────────────────

ALTER TABLE production_microsite
  ADD COLUMN IF NOT EXISTS background_url   TEXT,
  ADD COLUMN IF NOT EXISTS background_color TEXT;

COMMENT ON COLUMN production_microsite.background_url IS
  'Full bleed wallpaper for this production. Worn by the public microsite AND
   by the Production Admin, so the portal looks like the show you are editing
   rather than like the Collective admin. Upload to the production-photos
   bucket. Decorative, so it never needs alt text.';
COMMENT ON COLUMN production_microsite.background_color IS
  'Flat colour behind the wallpaper, and the fallback while it loads or if it
   is missing. For 2006 this is the Windows XP desktop blue, #3a6ea5.';

-- Producers upload their own show's wallpaper. v38 gave the production-photos
-- bucket to is_admin() only, which would mean Lip could not change the 2006
-- background without being a Collective admin. Add a parallel policy; v38's
-- own policies are untouched and keep working.

DROP POLICY IF EXISTS "Producers upload production photos" ON storage.objects;
CREATE POLICY "Producers upload production photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'production-photos'
    AND EXISTS (
      SELECT 1 FROM production_team pt
      WHERE pt.user_id = auth.uid()
        AND pt.team_role = 'producer'
    )
  );

DROP POLICY IF EXISTS "Producers update production photos" ON storage.objects;
CREATE POLICY "Producers update production photos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'production-photos'
    AND EXISTS (
      SELECT 1 FROM production_team pt
      WHERE pt.user_id = auth.uid()
        AND pt.team_role = 'producer'
    )
  );

-- Set 2006's, so the portal has something to wear the moment it is built.
UPDATE production_microsite pm
SET background_color = '#3a6ea5'
FROM productions p
WHERE p.id = pm.production_id
  AND p.slug = '2006'
  AND pm.background_color IS NULL;


-- ── 2. Backfill the two missing persona keys ──────────────────────────────────
-- `about` is what that person thinks the show is about, shown in the chat room
-- on the show page. `size` is their text size in that room, because everybody
-- picking their own size is half of why those rooms looked the way they did.
--
-- Only fills keys that are absent. Anything already written is left alone, so
-- this is safe to run after people have started editing.

UPDATE production_team pt
SET persona = jsonb_build_object('about', '') || pt.persona
FROM productions p
WHERE p.id = pt.production_id
  AND p.slug = '2006'
  AND NOT (pt.persona ? 'about');

UPDATE production_team pt
SET persona = jsonb_build_object('size', 13) || pt.persona
FROM productions p
WHERE p.id = pt.production_id
  AND p.slug = '2006'
  AND NOT (pt.persona ? 'size');

-- The sizes the site is actually using today.
UPDATE production_team pt
SET persona = pt.persona || jsonb_build_object('size', v.size)
FROM productions p,
  (VALUES
    ('SBconfetti', 16),
    ('x0x_BlueShellVictim_x0x', 12),
    ('neodafunky', 12),
    ('SmarterChild', 12)
  ) AS v(screen_name, size)
WHERE p.id = pt.production_id
  AND p.slug = '2006'
  AND pt.persona->>'screen_name' = v.screen_name;

UPDATE production_team pt
SET persona = pt.persona || jsonb_build_object('about', 'OK, now this is getting personal.')
FROM productions p
WHERE p.id = pt.production_id
  AND p.slug = '2006'
  AND pt.persona->>'screen_name' = 'SmarterChild';


-- ── 3. Check ──────────────────────────────────────────────────────────────────
-- Every row should list all eleven keys. A short list means a persona is stale.

SELECT
  pt.display_name,
  pt.persona->>'screen_name' AS screen_name,
  (SELECT count(*) FROM jsonb_object_keys(pt.persona)) AS keys,
  (pt.persona ? 'about') AS has_about,
  (pt.persona ? 'size')  AS has_size
FROM production_team pt
JOIN productions p ON p.id = pt.production_id
WHERE p.slug = '2006'
ORDER BY pt.sort_order;
