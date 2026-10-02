# Mary Kate's manual to-do list

Things only you can do. Claude keeps this current: items get added when Claude
hits something it cannot do alone, and checked off when you tell it they are
done. Anything marked WAITING is holding Claude up. Everything else can wait
until you have a quiet moment.

Last updated: 2026-10-02

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

## Your business list (not site work)

- [ ] Pick the display font for the client reports and staffing sheets.
- [ ] Confirm or change the Riot Fest rates in `lib/staffing/data/riot-fest.ts`.
- [ ] To open a client document on the live site, set `CLIENT_DOCS_KEY` in
  Vercel and use `/reports/<slug>?key=<that string>`. They are closed by
  default, for everyone, until you do.

## Done

- [x] Ran migrations v56 to v61 (verified live)
