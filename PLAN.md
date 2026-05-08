# AAC — Plan & Progress

Running list of what's built, what's next, and what's coming later.

---

## What's Built

### Registration & Onboarding
- [x] Invite code system — beta access gated by codes
- [x] Type-select screen — choose Personal Profile or Business/Event Profile
- [x] Individual registration form — name, pronouns, location, professions, credentials, languages, social links, bio
- [x] Business registration form — business name, location, type, services, accessibility features
- [x] Tester feedback section embedded in registration form
- [x] Tag-based inputs for professions, credentials, business types, and custom accessibility features
- [x] `AAAC-TEST` bypass code for testing without a live database

### Member Experience
- [x] Member login (magic link + password)
- [x] Member directory — full directory for logged-in members
- [x] Public directory — curated view, no login needed
- [x] Individual profile pages
- [x] Peer endorsement system

### Admin
- [x] Admin dashboard — review pending profiles, approve or reject
- [x] Invite code management tab
- [x] Public visibility toggle for approved profiles

### Design & Accessibility
- [x] Brand design system — AAC colors, fonts (TAY Big Bird), logo SVGs
- [x] Navy/teal backgrounds on key pages
- [x] WCAG AA accessibility throughout — focus management, aria labels, keyboard nav, screen reader support
- [x] Responsive / mobile-friendly

### Infrastructure
- [x] Contact form with email delivery via Resend
- [x] Supabase database schema (migration files ready to run)
- [x] Row-level security — controls who can see what
- [x] Vercel deployment ready

---

## To Do Before Testers

These are the things Mary Kate's husband needs to handle:

- [ ] Run `supabase-migration.sql` in Supabase SQL Editor
- [ ] Run `supabase-migration-v2.sql` in Supabase SQL Editor
- [ ] Add Mary Kate's user ID to `admin_users` table
- [ ] Add environment variables to Vercel (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `RESEND_API_KEY`)
- [ ] Connect GitHub repo to Vercel and deploy
- [ ] Test end-to-end with `AAAC-TEST` code
- [ ] Run `SELECT generate_invite_codes(50);` to create beta invite codes

---

## Round 2 — After Beta Feedback

These are planned but intentionally deferred until we hear from testers:

- [ ] **Photo uploads** — profile photos for individuals and businesses (Supabase Storage is already in the stack, just needs the UI and a storage bucket)
- [ ] **Profile editing** — members can update their own profiles after joining
- [ ] **Email notifications** — confirmation when a profile is approved/rejected
- [ ] **Grant Admin button** — UI in the admin dashboard to promote a member to admin without using SQL
- [ ] **Remove `AAAC-TEST` bypass** — once the database is live and real codes are generated
- [ ] **Password reset flow** — forgot password page (Supabase supports it, just needs the UI)

---

## Future / Longer Term

Ideas for after a successful beta:

- **Learning resources** — video library, workshops, educational materials (database tables are already in the schema, just needs UI)
- **Full-text search** — better search across the directory
- **Location-based search** — find professionals within a certain distance
- **Endorsement notes** — add context when endorsing someone
- **Direct messaging** — contact members through the platform
- **Event board** — post and find accessibility-related gigs
- **Public API** — let other organizations integrate with the directory

---

## Known Issues

- First admin user must be created via SQL (no UI for this yet — see To Do above)
- `AAAC-TEST` bypass should be removed once real invite codes are live
- Client-side search may be slow if the directory grows very large (fixable later with server-side search)
