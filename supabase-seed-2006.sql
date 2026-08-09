-- ─────────────────────────────────────────────────────────────────────────────
-- Seed · "2006" production and its company
-- Run AFTER supabase-migration-v40.sql.
--
-- Producers are matched by sign-in email:
--   mk@artisticaccessibility.com   (Mary Kate)
--   mavriklewis90@gmail.com        (Lip Lewis)
--
-- If either person has never signed in to the Collective, there is no row in
-- auth.users to match and that INSERT quietly adds nobody. Step 5 prints the
-- roster back so you can see it happened. Fix is: have them sign in once, then
-- re-run this file. It is safe to run more than once.
-- ─────────────────────────────────────────────────────────────────────────────


-- ── 1. The production ─────────────────────────────────────────────────────────
-- Draft on purpose. Nothing is public until you set status to 'published'.

INSERT INTO productions (slug, title, tagline, kind, status, summary)
VALUES (
  '2006',
  '2006',
  'a play in the form of TRL',
  'show',
  'draft',
  'A new play performed as an episode of TRL. The cast is a buddy list.'
)
ON CONFLICT (slug) DO NOTHING;


-- ── 2. Producers ──────────────────────────────────────────────────────────────
-- Mary Kate and Lip. Producers can do everything on this show and nothing
-- outside it. Lip being a Collective admin already is separate from this: that
-- comes from admin_users, and this file never touches admin_users.
--
-- persona is generated from the live microsite, so what lands here is exactly
-- what the buddy list shows today. Re-running updates it.
--
-- The persona blobs are dollar-quoted ($persona$...$persona$) so apostrophes
-- and backslash escapes inside the JSON pass through untouched no matter how
-- the session has standard_conforming_strings set.

INSERT INTO production_team (production_id, user_id, team_role, display_name, credit, sort_order, persona)
SELECT p.id, u.id, 'producer', 'Mary Kate', 'Writer/Performer/Editor/Tech', 1, $persona${"screen_name": "mkashe9", "status": "away", "idle_min": 23, "away_msg": "not here, prolly back later", "profile": "friends. music. swim.\n\norlando bloom <3", "bg": "#3e7391", "fg": "#c3adaf", "font": "sys"}$persona$::jsonb
FROM productions p, auth.users u
WHERE p.slug = '2006' AND lower(u.email) = 'mk@artisticaccessibility.com'
ON CONFLICT (production_id, user_id) DO UPDATE
  SET team_role = EXCLUDED.team_role, persona = EXCLUDED.persona;

INSERT INTO production_team (production_id, user_id, team_role, display_name, credit, sort_order, persona)
SELECT p.id, u.id, 'producer', 'Lip', 'Writer/Performer/Editor', 3, $persona${"screen_name": "x0x_BlueShellVictim_x0x", "status": "away", "idle_min": 112, "away_msg": "What would you do if your son was at home?", "profile": "Yo listen up here's a story about a little guy that lives in a blue world....\n\n“Chocolate rain, makes the best of friends begin to fight” -Tay Zonday\n\n@(o.0)@", "bg": "#000000", "fg": "#5ce9f5", "font": "sys"}$persona$::jsonb
FROM productions p, auth.users u
WHERE p.slug = '2006' AND lower(u.email) = 'mavriklewis90@gmail.com'
ON CONFLICT (production_id, user_id) DO UPDATE
  SET team_role = EXCLUDED.team_role, persona = EXCLUDED.persona;


-- ── 3. Everyone else ──────────────────────────────────────────────────────────
-- No user_id yet, so the buddy list has content before anyone signs in. When a
-- person makes an account, a producer attaches their user_id to the matching
-- row from the company page and they take over their own profile.
--
-- SmarterChild is in here on purpose. He is not a person and will never have an
-- account, so he never appears on anybody's Collective profile, but he does
-- belong in the company.

INSERT INTO production_team (production_id, team_role, display_name, credit, sort_order, persona)
SELECT p.id, t.team_role, t.display_name, t.credit, t.sort_order, t.persona
FROM productions p,
  (VALUES
    ('creator', 'Jen', 'Writer/Performer/Editor', 2, $persona${"screen_name": "SBconfetti", "status": "away", "idle_min": 0, "away_msg": "BRB I'M NOT HERE RIGHT NOW. PROBABLY DOIN' HW FOR SPEEDY'S CLASS LOL. LEAVE A MESSAGE AFTER THE BEEP. ~~BEEEEEEEEP~~ :-P", "profile": "And when she walks\nAll the wind blows and the angels sing\nShe'll never notice me\nCause she is watchin' wrestling\nCreamin' over tough guys\nListenin' to rap metal\nTurntables in her eyes\nShe likes 'em with a mustache\nRacetrack season pass\nDrivin' in a Trans-Am\nDoes a mullet make a man?", "bg": "#ff00ff", "fg": "#66ff00", "font": "comic"}$persona$::jsonb),
    ('creator', 'Yongwoo', 'Writer/Performer/Editor', 4, $persona${"screen_name": "neodafunky", "status": "idle", "idle_min": 4, "away_msg": "yo. im not here. you can pretend i am if youre weird", "profile": "aka bboy flicker (wild 7 crew)\na/s/l: not telling you/male/not telling you\nfavorite band: streetlight manifesto\nfavorite song: bang on! -propellerheads\nfavorite movie: city of god\nfavorite bboy: bboy baek\n\nemo sux\n\n'Oh, He was really being charitable to us when He gave us pain! Why couldn't He have used a doorbell instead to notify us, or one of His celestial choirs? Or a system of blue-and-red neon tubes right in the middle of each person's forehead. Any jukebox manufacturer worth his salt could have done that. Why couldn't He?'\n'People would certainly look silly walking around with red neon tubes in the middle of their foreheads.'\n'They certainly look beautiful now writhing in agony or stupefied with morphine, don't they?'\n-joseph heller, Catch-22\n\n*trip*", "bg": "#e8912e", "fg": "#ffffff", "font": "square"}$persona$::jsonb),
    ('creator', 'Emma', 'Writer/Performer', 5, $persona${"screen_name": "EmmaIsNine", "status": "away", "idle_min": 57, "away_msg": "[away message coming soon]", "profile": "[bio coming soon]", "bg": "#000000", "fg": "#ffffff", "font": "comic"}$persona$::jsonb),
    ('crew', 'Alec', 'Tech', 6, $persona${"screen_name": "bbulldogs48", "status": "offline", "idle_min": 0, "away_msg": "", "profile": "[bio coming soon]", "bg": "#000000", "fg": "#ffffff", "font": "comic"}$persona$::jsonb),
    ('crew', 'SmarterChild', 'resident robot', 99, $persona${"screen_name": "SmarterChild", "status": "online", "idle_min": 0, "away_msg": "", "profile": "Hi! I'm SmarterChild, your friendly robot pal!\nI know movie times, the weather, and everything about \"2006\" (the play, not the year... ok, also the year).\nType to me! I love that.", "bg": "#dfe8f5", "fg": "#10233f", "font": "sys", "is_bot": true}$persona$::jsonb)
  ) AS t(team_role, display_name, credit, sort_order, persona)
WHERE p.slug = '2006'
  AND NOT EXISTS (
    SELECT 1 FROM production_team pt
    WHERE pt.production_id = p.id
      AND pt.display_name = t.display_name
  );

-- ── 3b. Emails for everyone else ──────────────────────────────────────────────
-- Stored as invited_email, which is just a note saying "this row belongs to
-- whoever signs in with this address". It grants nothing on its own.

UPDATE production_team pt
SET invited_email = v.email
FROM productions p,
  (VALUES
    ('Jen', 'allman.jenn@gmail.com'),
    ('Alec', 'aleccunningham96@gmail.com'),
    ('Emma', 'johnson.emma007@gmail.com'),
    ('Yongwoo', 'bhak.yongwoo@gmail.com')
  ) AS v(display_name, email)
WHERE pt.production_id = p.id
  AND p.slug = '2006'
  AND pt.display_name = v.display_name
  AND pt.invited_email IS DISTINCT FROM v.email;


-- ── 3c. Attach accounts that exist ────────────────────────────────────────────
-- Links a team row to a Collective account when the addresses match. People
-- who have not signed up yet are simply skipped, so re-run this file whenever
-- someone new makes an account and they will be picked up.
--
-- The guards matter: only fills empty rows, and never links a person who is
-- already attached somewhere else on this show, which would break the one
-- row per person rule.

UPDATE production_team pt
SET user_id = u.id
FROM auth.users u, productions p
WHERE pt.production_id = p.id
  AND p.slug = '2006'
  AND pt.user_id IS NULL
  AND pt.invited_email IS NOT NULL
  AND lower(u.email) = lower(pt.invited_email)
  AND NOT EXISTS (
    SELECT 1 FROM production_team other
    WHERE other.production_id = pt.production_id
      AND other.user_id = u.id
  );


-- ── 4. Microsite switches ─────────────────────────────────────────────────────
-- Everything off. Turn show mode on from the portal, on the night.

INSERT INTO production_microsite (production_id, show_mode, voting_open, submissions_open)
SELECT p.id, false, false, true
FROM productions p WHERE p.slug = '2006'
ON CONFLICT (production_id) DO NOTHING;


-- ── 5. Check what actually landed ─────────────────────────────────────────────
-- Run this on its own afterwards. "waiting to sign up" means we have their
-- email but no Collective account exists yet. When they make one, re-run this
-- whole file and they will attach.

SELECT
  pt.sort_order,
  pt.display_name,
  pt.team_role,
  pt.persona->>'screen_name' AS screen_name,
  CASE
    WHEN pt.user_id IS NOT NULL          THEN 'signed in'
    WHEN pt.invited_email IS NOT NULL    THEN 'waiting to sign up'
    ELSE                                      'no email on file'
  END AS account,
  pt.invited_email
FROM production_team pt
JOIN productions p ON p.id = pt.production_id
WHERE p.slug = '2006'
ORDER BY pt.sort_order;
