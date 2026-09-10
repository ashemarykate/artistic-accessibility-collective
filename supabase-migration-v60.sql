-- ─────────────────────────────────────────────────────────────────────────────
-- Migration v60 · The audience makes mixes
-- Run in Supabase SQL Editor after v59.
--
-- Playlists on the 2006 site open to the public, the same way the wall and the
-- blog did: a mix goes up the moment somebody presses the button, under their
-- screen name, and the cast can take it down from the public page.
--
-- Same door design. The audience holds no INSERT on production_playlists (v40
-- gave it to creators only, and that stays). The only way in for the public is
-- /api/2006/playlist on our own server, which counts and refuses.
-- ─────────────────────────────────────────────────────────────────────────────


-- ── 1. A mix knows whether the audience made it ──────────────────────────────

ALTER TABLE production_playlists
  ADD COLUMN IF NOT EXISTS is_audience BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS device_tag  TEXT,
  ADD COLUMN IF NOT EXISTS flagged     BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN production_playlists.is_audience IS
  'Made by a member of the audience on the public site, under a screen name.
   Visible on insert like the wall. A cast mix has this off and created_by set.';
COMMENT ON COLUMN production_playlists.device_tag IS
  'Not identity. The random tag the browser keeps, so the handler can count
   mixes per browser for the rate limit.';
COMMENT ON COLUMN production_playlists.flagged IS
  'Hit the wall word list. Still went up; sorts to the top of the cast pile.';


-- ── 2. The starter pack moves from the page into the table ───────────────────
-- The page has carried this one hardcoded since the start and never read the
-- table. From here on it reads the table and keeps the hardcoded list only as
-- a fallback for an empty one, so the cast can edit this from Backstage.

INSERT INTO production_playlists
  (production_id, created_by, title, byline, description, tracks, is_visible, sort_order)
SELECT p.id, NULL, 'the 2006 starter pack', 'a mix by the 2006ers',
       'if you only hear eight songs from that year, hear these.',
       '[
         {"t":"Welcome to the Black Parade","a":"My Chemical Romance","note":"october. the whole year turns."},
         {"t":"SexyBack","a":"Justin Timberlake","note":""},
         {"t":"Crazy","a":"Gnarls Barkley","note":""},
         {"t":"Hips Don''t Lie","a":"Shakira","note":"inescapable. genuinely inescapable."},
         {"t":"Steady, As She Goes","a":"The Raconteurs","note":""},
         {"t":"Over My Head (Cable Car)","a":"The Fray","note":"for crying in the car."},
         {"t":"Dani California","a":"Red Hot Chili Peppers","note":""},
         {"t":"Chasing Cars","a":"Snow Patrol","note":"track 8 is always the sad one."}
       ]'::jsonb,
       true, 1
FROM productions p
WHERE p.slug = '2006'
  AND NOT EXISTS (
    SELECT 1 FROM production_playlists x
    WHERE x.production_id = p.id AND x.title = 'the 2006 starter pack'
  );


-- ── 3. The year, as the company that decides that had it ─────────────────────
-- Billboard's Year-End Hot 100 for 2006, the top fifty, in order. The byline is
-- Billboard because Billboard is who decides that. Taken from the published
-- chart on 2026-09-10. The list is in chart order and the page numbers it, so
-- the tracks carry no note.

INSERT INTO production_playlists
  (production_id, created_by, title, byline, description, tracks, is_visible, sort_order)
SELECT p.id, NULL, 'the top 50 of 2006', 'a mix by Billboard',
       'the year end hot 100, top fifty, in order. this is the official version.',
       '[
         {
                  "t": "Bad Day",
                  "a": "Daniel Powter",
                  "note": ""
         },
         {
                  "t": "Temperature",
                  "a": "Sean Paul",
                  "note": ""
         },
         {
                  "t": "Promiscuous",
                  "a": "Nelly Furtado featuring Timbaland",
                  "note": ""
         },
         {
                  "t": "You''re Beautiful",
                  "a": "James Blunt",
                  "note": ""
         },
         {
                  "t": "Hips Don''t Lie",
                  "a": "Shakira featuring Wyclef Jean",
                  "note": ""
         },
         {
                  "t": "Unwritten",
                  "a": "Natasha Bedingfield",
                  "note": ""
         },
         {
                  "t": "Crazy",
                  "a": "Gnarls Barkley",
                  "note": ""
         },
         {
                  "t": "Ridin''",
                  "a": "Chamillionaire featuring Krayzie Bone",
                  "note": ""
         },
         {
                  "t": "SexyBack",
                  "a": "Justin Timberlake featuring Timbaland",
                  "note": ""
         },
         {
                  "t": "Check on It",
                  "a": "Beyoncé featuring Slim Thug and Bun B",
                  "note": ""
         },
         {
                  "t": "Be Without You",
                  "a": "Mary J. Blige",
                  "note": ""
         },
         {
                  "t": "Grillz",
                  "a": "Nelly featuring Paul Wall and Ali & Gipp",
                  "note": ""
         },
         {
                  "t": "Over My Head (Cable Car)",
                  "a": "The Fray",
                  "note": ""
         },
         {
                  "t": "Me & U",
                  "a": "Cassie",
                  "note": ""
         },
         {
                  "t": "Buttons",
                  "a": "Pussycat Dolls featuring Snoop Dogg",
                  "note": ""
         },
         {
                  "t": "Run It!",
                  "a": "Chris Brown featuring Juelz Santana",
                  "note": ""
         },
         {
                  "t": "So Sick",
                  "a": "Ne-Yo",
                  "note": ""
         },
         {
                  "t": "It''s Goin'' Down",
                  "a": "Yung Joc featuring Nitti",
                  "note": ""
         },
         {
                  "t": "SOS",
                  "a": "Rihanna",
                  "note": ""
         },
         {
                  "t": "I Write Sins Not Tragedies",
                  "a": "Panic! at the Disco",
                  "note": ""
         },
         {
                  "t": "Move Along",
                  "a": "The All-American Rejects",
                  "note": ""
         },
         {
                  "t": "London Bridge",
                  "a": "Fergie",
                  "note": ""
         },
         {
                  "t": "Dani California",
                  "a": "Red Hot Chili Peppers",
                  "note": ""
         },
         {
                  "t": "Snap Yo Fingers",
                  "a": "Lil Jon featuring E-40 and Sean Paul",
                  "note": ""
         },
         {
                  "t": "Lean wit It, Rock wit It",
                  "a": "Dem Franchize Boyz featuring Peanut and Charlay",
                  "note": ""
         },
         {
                  "t": "What Hurts the Most",
                  "a": "Rascal Flatts",
                  "note": ""
         },
         {
                  "t": "How to Save a Life",
                  "a": "The Fray",
                  "note": ""
         },
         {
                  "t": "Unfaithful",
                  "a": "Rihanna",
                  "note": ""
         },
         {
                  "t": "Chasing Cars",
                  "a": "Snow Patrol",
                  "note": ""
         },
         {
                  "t": "Lips of an Angel",
                  "a": "Hinder",
                  "note": ""
         },
         {
                  "t": "Everytime We Touch",
                  "a": "Cascada",
                  "note": ""
         },
         {
                  "t": "Ain''t No Other Man",
                  "a": "Christina Aguilera",
                  "note": ""
         },
         {
                  "t": "Dance, Dance",
                  "a": "Fall Out Boy",
                  "note": ""
         },
         {
                  "t": "Gold Digger",
                  "a": "Kanye West featuring Jamie Foxx",
                  "note": ""
         },
         {
                  "t": "Money Maker",
                  "a": "Ludacris featuring Pharrell",
                  "note": ""
         },
         {
                  "t": "Ms. New Booty",
                  "a": "Bubba Sparxxx featuring Ying Yang Twins",
                  "note": ""
         },
         {
                  "t": "(When You Gonna) Give It Up to Me",
                  "a": "Sean Paul featuring Keyshia Cole",
                  "note": ""
         },
         {
                  "t": "Photograph",
                  "a": "Nickelback",
                  "note": ""
         },
         {
                  "t": "Because of You",
                  "a": "Kelly Clarkson",
                  "note": ""
         },
         {
                  "t": "Stickwitu",
                  "a": "Pussycat Dolls",
                  "note": ""
         },
         {
                  "t": "I''m ''n Luv (wit a Stripper)",
                  "a": "T-Pain featuring Mike Jones",
                  "note": ""
         },
         {
                  "t": "My Humps",
                  "a": "The Black Eyed Peas",
                  "note": ""
         },
         {
                  "t": "Where''d You Go",
                  "a": "Fort Minor featuring Holly Brook and Jonah Matranga",
                  "note": ""
         },
         {
                  "t": "Yo (Excuse Me Miss)",
                  "a": "Chris Brown",
                  "note": ""
         },
         {
                  "t": "Walk Away",
                  "a": "Kelly Clarkson",
                  "note": ""
         },
         {
                  "t": "Laffy Taffy",
                  "a": "D4L",
                  "note": ""
         },
         {
                  "t": "What You Know",
                  "a": "T.I.",
                  "note": ""
         },
         {
                  "t": "Dirty Little Secret",
                  "a": "The All-American Rejects",
                  "note": ""
         },
         {
                  "t": "Savin'' Me",
                  "a": "Nickelback",
                  "note": ""
         },
         {
                  "t": "Don''t Forget About Us",
                  "a": "Mariah Carey",
                  "note": ""
         }
]'::jsonb,
       true, 2
FROM productions p
WHERE p.slug = '2006'
  AND NOT EXISTS (
    SELECT 1 FROM production_playlists x
    WHERE x.production_id = p.id AND x.title = 'the top 50 of 2006'
  );


-- ── Check it worked ───────────────────────────────────────────────────────────
--   select title, byline, is_audience, jsonb_array_length(tracks) from production_playlists
--     join productions on productions.id = production_id where slug = '2006';
