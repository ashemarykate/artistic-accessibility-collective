# Mary Kate's manual to-do list

Things only you can do. Claude keeps this current: items get added when Claude
hits something it cannot do alone, and checked off when you tell it they are
done. Anything marked WAITING is holding Claude up. Everything else can wait
until you have a quiet moment.

Last updated: 2026-10-05

---

## Waiting on you (blocks something)

- [ ] **Set `CRON_SECRET` in Vercel, then redeploy.** The calendar has not
  synced for about 4 weeks and the event reminder emails have never run.
  Vercel, your project, Settings, Environment Variables, add `CRON_SECRET` for
  Production. Any long random string. Then redeploy.
  After that: [ ] press **Sync now** once in the admin dashboard to catch the
  calendar up.

- [ ] **Decide the calendar's starting view.** A signed-in member's calendar
  starts filtered to their own city, which for most cities shows "No matches".
  Claude recommends: keep it, but fall back to all events when their city has
  none. Reply "fall back", "never pre-filter", or "leave it".

- [ ] **Give Claude an admin test login to finish the admin dashboard audit.**
  In `.env.local`, change `DEV_AUTO_LOGIN_EMAIL` and `DEV_AUTO_LOGIN_PASSWORD`
  to your admin test account. Type the password there yourself, never in chat.
  Restart the local dev server and tell Claude. Switch the two values back
  after. Claude will only read and do one reversible action, never approve or
  reject a real profile, because the local app uses the real database.

- [ ] **Run the Hot Topics takes migration** (this unblocks testing "What do
  you think?"). Supabase, SQL Editor, open `supabase-migration-v64-hot-topic-takes.sql`
  from the project folder, paste it, Run. It is safe to run twice. Afterwards
  run the three "check it worked" lines at the bottom of the file: expect 4
  policies on topic_takes, 1 on topic_take_meta, no insert policy anywhere.
  Then tell Claude, who will click through the admin Takes tab with you.
  Also confirm `SUPABASE_SERVICE_ROLE_KEY` and `RESEND_API_KEY` are both in
  Vercel (the takes door refuses to open without them).

## Do when you have a minute

- [ ] **Change the `mk-member@` test account password** in Supabase
  (Authentication, Users), then update `DEV_AUTO_LOGIN_PASSWORD` in
  `.env.local`. The old one used to ship in the public code, so treat it as
  known.

- [ ] **Edit the three small print drafts** so they sound like you:
  `/privacy`, `/conduct`, `/access`. Claude wrote first drafts from what the
  site actually does. They are live now.

- [ ] **Describe your own gallery photos.** Edit Profile shows each photo that
  still needs a description. Yours has 8. Two other profiles have one each.

- [ ] **Add one online or hybrid event to the calendar.** Every upcoming event
  is tagged in person, so the "Upcoming Live Events" panel on the member home
  stays empty until one exists.

- [ ] **Hot Topics: send Claude reels.** For each one: the link, the @handle,
  and one line on why it fits the topic. If you watched it, say whether it has
  captions (burned in, or Instagram's own), audio description, ASL. If you
  did not, the card says "Not checked". The eight draft topics are
  inspiration stories, who plays disabled characters, access as art, auto
  captions, open captions, audio description, sign language as art, and access
  labor.

- [ ] **Hot Topics: read the eight drafts before anything goes live.** Run
  `npm run dev` and open `localhost:3000/resources/hot-topics` (drafts show
  there only). The "hot take" framing is public editorial writing Claude drafted
  from the catalogs. Claude listed the sentences to double check. Tell Claude
  which topics to take live, one at a time. Until then the live site shows
  nothing new.

- [ ] **Hot Topics: update `/privacy` and `/conduct` before the first topic
  goes live.** Privacy needs: takes (the words, the optional name, that a
  signed-in visit is noted, a random browser code kept to slow spam, that an
  approved take is public with its date, and how to ask for removal). Conduct
  currently says it covers "everyone with an account", which leaves out
  visitors who post takes. Claude can draft both on request.

## Your business list (not site work)

- [ ] Pick the display font for the client reports and staffing sheets.
- [ ] Confirm or change the Riot Fest rates in `lib/staffing/data/riot-fest.ts`.
- [ ] To open a client document on the live site, set `CLIENT_DOCS_KEY` in
  Vercel and use `/reports/<slug>?key=<that string>`. They are closed by
  default, for everyone, until you do.

## Done

- [x] Ran migrations v56 to v61 (verified live)
