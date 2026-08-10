-- ─────────────────────────────────────────────────────────────────────────────
-- Migration v53 · Keep the company's drive link out of public reach
-- Run in Supabase SQL Editor after v52, and BEFORE pasting a real drive URL in.
--
-- Same shape as v51. production_microsite is readable by everyone, on purpose:
-- the 2006 site is a signed out page and it needs show_mode, voting_open and
-- the wallpaper. But RLS is row level, so "read this row" has meant "read
-- every column of it", and two of those columns are not for the public:
--
--   drive_url        the company's shared folder
--   submissions_url  wherever submitted videos are collected
--
-- The Backstage UI only ever shows them to the team, which makes it look
-- private. It is not: an anonymous GET on /rest/v1/production_microsite
-- returns them. A Google Drive folder link is a capability, not a secret with
-- a password behind it, so publishing one is close to publishing the folder.
--
-- Column grants fix it without touching the policy, exactly as in v51. The
-- microsite keeps everything it actually reads.
-- ─────────────────────────────────────────────────────────────────────────────

REVOKE SELECT ON production_microsite FROM anon, authenticated;

-- What the public 2006 page genuinely uses.
GRANT SELECT (
  production_id,
  show_mode, voting_open, submissions_open,
  marquee,
  background_url, background_color,
  public_url,
  updated_at
) ON production_microsite TO anon;

-- Signed in users get the same. The company reads drive_url through Backstage,
-- which runs as a producer and is covered by the write grant below plus the
-- v40 policy; nothing client side needs to SELECT it today.
GRANT SELECT (
  production_id,
  show_mode, voting_open, submissions_open,
  marquee,
  background_url, background_color,
  public_url,
  updated_at
) ON production_microsite TO authenticated;

GRANT INSERT, UPDATE, DELETE ON production_microsite TO authenticated;


-- ── The company still needs to read them ──────────────────────────────────────
-- Backstage shows the drive and submissions links so a producer can follow or
-- edit them. Those columns are no longer selectable, so they come back through
-- a function that checks membership itself. SECURITY DEFINER bypasses the
-- grants above, which is the point: the check moves from "which columns" to
-- "who is asking".

CREATE OR REPLACE FUNCTION get_production_links(p_id UUID)
RETURNS TABLE (drive_url TEXT, submissions_url TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Anyone on the show, not just producers: a creator following the link to
  -- the drive is the normal case. Editing is still producer only, enforced by
  -- the v40 policy on the write.
  IF NOT is_production_team(p_id) THEN
    RETURN;                      -- no rows, not an error
  END IF;

  RETURN QUERY
    SELECT pm.drive_url, pm.submissions_url
    FROM production_microsite pm
    WHERE pm.production_id = p_id;
END $$;

GRANT EXECUTE ON FUNCTION get_production_links(UUID) TO authenticated;

COMMENT ON FUNCTION get_production_links(UUID) IS
  'The private links for a production, returned only to people on its team.
   Exists because v53 revoked column access to drive_url and submissions_url,
   which were readable by anonymous callers.';


-- ── Check ─────────────────────────────────────────────────────────────────────
-- Neither role should list drive_url or submissions_url.

SELECT grantee, string_agg(column_name, ', ' ORDER BY column_name) AS readable_columns
FROM information_schema.column_privileges
WHERE table_name = 'production_microsite'
  AND privilege_type = 'SELECT'
  AND grantee IN ('anon', 'authenticated')
GROUP BY grantee;
