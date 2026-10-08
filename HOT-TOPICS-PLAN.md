# Hot Topics page: plan (2026-10-05)

**Status (2026-10-05): BUILT, HIDDEN, NOT LIVE.** Phases 1 and 2 are in the
code. Every topic is a draft, so on the live site the pages 404 and no link,
sitemap entry or nav item exists. Takes cannot work until Mary Kate runs
`supabase-migration-v64-hot-topic-takes.sql`. The rest of this file is the
research and design the build followed. Anything marked "verified" was checked
against the repo or live endpoints on 2026-10-05.

## How it works now (read this first)

- **Preview drafts locally:** `npm run dev`, open
  `http://localhost:3000/resources/hot-topics`. Drafts show automatically when
  not in production. To preview a production build: set
  `NEXT_PUBLIC_HOT_TOPICS_SHOW_DRAFTS=1` for BOTH `npm run build` and
  `npm run start -- -p 3200`. **Never set that variable on Vercel Production.**
- **Go live, one topic at a time:** add its slug to `LIVE_TOPIC_SLUGS` in
  `lib/hot-topics-status.ts`, push. A topic not on that list stays hidden. The
  status file is tiny on purpose: the draft text lives in
  `lib/hot-topics-data.ts` and is kept out of the JavaScript every page loads.
  The nav, desktop, StartBar and sitemap entries appear by themselves once one
  topic is live. A typo in `LIVE_TOPIC_SLUGS` is silent in production (dev logs a
  warning) and would link to an empty list, so check the page after pushing.
- **Takes (anyone, including visitors, approved first):** POST
  `/api/hot-topics/takes`, rules in `lib/hot-topic-takes.ts`, review in Admin,
  Takes. Spam trap, per-browser and per-network limits, a cap of 150 waiting
  takes, one alert email per half hour. Public tables hold only public columns,
  the private details live in `topic_take_meta` (admin read only).
- **Decision 2026-10-08:** keep it hidden and treat it as work in progress; it goes public only when everything in the "Done means" list in `SITE-PASS-2026-09.md` (section "In progress, NOT public yet") is checked. That list includes making the GitHub repository private, because the repository is public and holds the draft text.
- **Before the first topic goes live:** run v64; confirm `SUPABASE_SERVICE_ROLE_KEY`
  and `RESEND_API_KEY` exist in Vercel; update `/privacy` and `/conduct` (see
  `MK-TO-DO.md`); read every topic's framing text (it is unread editorial
  writing); submit one real take, check the alert email, approve it in Admin,
  delete it. Open the admin Takes tab once: it was written but never opened in a
  browser (it needs an admin login).
- **Reels:** every topic has `videos: []` until Mary Kate sends links. Send a
  link, the @handle, and one line on why it fits, plus caption/description/ASL
  notes if she watched it, otherwise the card says "Not checked".
- **Open decisions on takes abuse** (the review raised these, nothing is
  broken): (A) a database-backed per-address limit using a keyed hash purged
  after about 24 hours (strongest, needs a migration and a privacy sentence),
  or (B) a per-member limit plus part of the queue reserved for signed-in
  members. Today the per-address limit is in memory per server instance.
  Admin has "Reject all waiting" and "Reject all flagged" for a flood.
- **Known small things:** a visitor who chose Plain sees Punk for a moment
  before the page loads; Unicode tag characters are stripped from takes, which
  also strips the England, Scotland and Wales flag emoji; a crash between the
  two inserts of one take could leave a hidden take with no private row.
- **Catalog fixes noticed:** `lib/library-data.ts` entry
  `stella-young-not-your-inspiration-lib` says her talk "gave the world a name
  for inspiration porn"; she named it in a 2012 essay and the 2014 talk made it
  famous. The topic text was corrected, the catalog line was not. The Ruderman
  white papers are typed 'standard' in `lib/resources-data.ts`.
- The inspiration topic's slug was changed from `inspiration-porn` to
  `inspiration-stories` so the address is not caught by web filters.

## What Mary Kate asked for

A new page under Resources called "Hot Topics", styled like the Hot Topic
retailer (punk mall look) but still very readable. A list of topics. Opening a
topic shows (1) videos, ideally Instagram reels, linked or embedded without
looking bad, (2) links to books in the Library, films in the Cinema, and
entries in Resources that touch the topic, and (3) a "What do you think?" box
at the bottom where people submit their take.

## Decisions

- [x] Route: `/resources/hot-topics` (list) and `/resources/hot-topics/[slug]`.
- [ ] **Who can post a take, and is it approved first?** Recommended: signed-in
  members only, a person approves each take before it shows.
- [ ] **Reels:** recommended link-first cards (our styled card, a plain "Watch
  on Instagram" link, nothing from Instagram loads on page view). Optional
  "Play here" button later.
- [ ] **Which topics launch.** Starter list below, 8 to 10 is plenty.
- [ ] Name: "Hot Topics" is close to a retailer's name. Evoke the look (black,
  red, checker, studs, price tags), never their logo, wordmark or flame/heart
  marks. Not legal advice. The Resources page also already shows a small "HOT"
  badge meaning "saved by 2 or more people", so the word would mean two things.

## Build phases (each one shippable alone)

1. **Topics, cross-links, reel cards. No database.** `lib/hot-topics-data.ts`
   (typed array plus a BY_SLUG record, like library-data). Server page with
   `generateStaticParams` and `notFound()` (Library and Cinema detail pages
   return a soft 404 for unknown slugs, do not copy that). Titles come from
   `layout.tsx` metadata, with a `generateMetadata` for `[slug]`. Cross-links by
   library/cinema slug (static items only) and by resource URL (resolve on the
   server, drop and warn on an unknown URL). Nav entries (below), sitemap,
   privacy page edit.
2. **Takes.** New migration. Check the highest number right before writing:
   v64 was next on 2026-10-05, v57 to v63 files exist, confirm what is live.
3. **"Play here" facade** for reels, after Mary Kate tests two or three reels
   she knows are captioned, on desktop and iPhone, with VoiceOver and keyboard.

## Takes design (recommended, phase 2)

Do NOT reuse `ItemComments` as is. It has no admin delete, no approval step, no
rate limit, no honeypot, no result limit, and any signed-in user can set
`display_name` and the "AAC" badge flag through the REST API. Use its look and
interaction as the template, not its table.

- New table `topic_takes` with `status` pending/approved/rejected. RLS: public
  SELECT only where `status = 'approved'`; admin everything via `is_admin()`
  (never an inline EXISTS on admin_users).
- Insert only through a server route (service role), like the 2006 wall:
  verify the bearer token, require an approved profile, take the display name
  from the profile (never from the browser), length cap, honeypot field
  `website`, per-user rate limit read from the table.
- Admin: a "Takes" tab in the Website Content group (copy the Suggestions tab
  pattern in `app/admin/page.tsx`): approve, reject, delete.
- Tell the admin a take is waiting: `sendNotificationEmail` straight to an
  admin address, no take text in the email (house rule in `lib/notify.ts`).
  `SUPABASE_SERVICE_ROLE_KEY` and `RESEND_API_KEY` must exist in Vercel; check
  the first real submission after deploy (memory: fail-closed guards).
- Anonymous posting is a much bigger job (every rule must live in a server
  route, DB-backed per-device limits). Not recommended for v1.
- Update `/privacy` (takes are public, what is stored, how to get one removed)
  and `/conduct` (scope now includes takes, moderated by removal).

## Reel card design

One shared card for Instagram, TikTok, YouTube and Vimeo. Visible: platform
name as text, our title (h3), creator handle linked to their profile, one line
we write about what happens in the video, access flags as words (Captions:
burned in / Instagram auto captions, app only / none / not checked; Audio
description; ASL; transcript link), "Checked on <date>", and the primary link
"Watch on Instagram (opens in new tab)". No thumbnails: Instagram image URLs
expire in about 4 days and Meta's terms do not clearly allow copying them, so
use our own artwork.

Mary Kate hands over: the reel link, the @handle, one line on why it fits, and
the access flags if she watched it (otherwise the card says "Not checked").
No platform tells us whether a video has captions. Link health check: a
tokenless Instagram oEmbed call returns HTTP 400, subcode 2207045, when a reel
is gone, private, or has embeds turned off.

Facts that shaped this (verified 2026-10-05): the Instagram embed still works
without a Meta app, but it is a fixed white card about 830px tall that cannot
be restyled, it contacts Instagram and sets cookies on page load, its iframe has
no title, its Play button is out of the tab order, and no caption control
showed. Instagram closed captions do not show on desktop at all (RNID, June
2026), only burned-in captions are reliable.

## Look (see `design/hot-topics-mock.html`, placeholder content only)

Palette contrast was computed: 38 of 38 pairs pass, lowest text ratio 5.3. Red
is a fill with white text, never red text on black. AAC Display is capitals
only and thin: punch comes from size, hard offset shadows and color blocks;
never put `&`, quotes or contractions in titles, never below 24px for tile
titles. Body 17px, nothing under 13px. Normal-flow page on black (not the fixed
window Resources uses), with bottom padding for the StartBar. Each tile is one
link. A "heat" meter (five boxes plus words like "4 of 5, spicy") says how split
the field is, not who is right. A **Plain** switch strips every decorative
layer. No motion by default, no marquee (the Resources one scrolls with no
pause control, see SITE-PASS). Decoration is CSS or aria-hidden SVG only.

Tokens: `--ht-black #0a0a0c`, `--ht-coal #17171c`, `--ht-paper #f5f1e8`,
`--ht-ink #101014`, `--ht-red #d8002f` (fill only), `--ht-red-deep #a30026`
(red text on paper), `--ht-pink #ff5c9d`, `--ht-yellow #f5d84a`,
`--ht-fog #cfcfd8`.

## Where to add links (phase 1)

- `app/resources/page.tsx` ~372-378 NAV_LINKS (the links bar wraps, so one more
  is safe) and ~795-802 footer WebButtons.
- `components/StartBar.tsx` ~49-52 RESOURCES folder (needs an icon number from
  `public/images/desktop-icons`).
- `app/page.tsx` ~73-100 ITEMS, ~105-113 TREE, ~923 DIRECT_NAV, ~486-506
  Resources explorer rows (it has hard-coded "4 items" text).
- `app/sitemap.ts` 9-13 and 23-27. `robots.ts` needs no change.
- Optional: a "Part of these Hot Topics" strip on `/library/[slug]` and
  `/cinema/[slug]`.

## Starter topics

Seed file with every verified slug and URL: `design/hot-topics-seed.json`.
Titles, pitches and prompts in it are drafts for Mary Kate to edit. The counts
below are library / cinema / resources items. Counts are not the whole story:
see the caveats under the table.

| id | title | library / cinema / resources |
|---|---|---|
| cripping-up | Who gets to play disabled characters? | 5 / 11 / 9 |
| access-as-art | Access is not an add-on | 7 / 7 / 8 |
| race-and-disability | Race, disability, and who the movement forgets | 6 / 8 / 6 |
| inspiration-stories | Inspiration porn and the feel-good disability story | 6 / 10 / 3 |
| deaf-culture-medical-model | Deaf culture or hearing loss? Who decides | 8 / 6 / 5 |
| access-labor | Who does the work of access, and who gets paid? | 7 / 4 / 7 |
| sign-language-as-art | Sign language is art, not just access | 4 / 7 / 5 |
| audio-description-craft | Audio description is a craft, not a checkbox | 5 / 4 / 7 |
| open-captions | Open captions, closed captions, or a gadget? | 4 / 5 / 7 |
| ai-captions | Are auto captions good enough? | 4 / 2 / 8 |
| autistic-voices | Who speaks for autistic people? | 3 / 7 / 2 |
| alt-text | Alt text: checkbox or creative writing? | 3 / 2 / 6 |
| asl-at-big-events | Who is actually signing at the concert? | 2 / 4 / 5 |
| relaxed-performances | Relaxed performances, explained | 2 / 0 / 8 |

Caveats:
- Best opener: inspiration-stories (one free 9 minute captioned talk anchors it).
- ai-captions: the argument side is thinner than the count, most items are
  tools. alt-text cinema items are only adjacent. asl-at-big-events has two
  truly on-topic items. relaxed-performances has no cinema item yet.
- Topics people expect that the catalogs do not cover: AI audio description
  and synthetic voices (ACB guidance page), website accessibility overlays
  (Overlay Fact Sheet, the FTC action against accessiBe), caption glasses (NAD
  page on caption access in theaters). Each needs new catalog items first,
  added with the usual verify-then-add workflow (the FTC page was found by
  search but not opened, confirm before citing).
- Assisted dying is sensitive and needs Mary Kate's editorial call before it
  gets a public comment box.
- Deaf culture and autistic voices take editorial stances (the catalogs hold
  both sides on Deaf; the ASAN entry says to cite ASAN, not Autism Speaks).
  Mary Kate must be comfortable repeating them publicly.
- Respectability and Disability Belongs are the same organization under old and
  new names, and both are separate Resources entries: show only one.
- None of the three catalogs contains an Instagram URL, so every reel is new.

## Every topic needs

A short "hot take" framing: what the argument is, the two camps in plain words,
no side named as right. Claude drafts, Mary Kate edits. All copy: zero em
dashes.
