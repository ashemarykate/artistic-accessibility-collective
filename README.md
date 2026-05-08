# Artistic Accessibility Collective

A professional registry and community platform for accessibility professionals in the arts — ASL interpreters, captioners, educators, content creators, accessible businesses, and more.

Built and owned by **Mary Kate Ashe**.

---

## What This Is

The AAC platform has two sides:

**For professionals** — A place to be found. Members create profiles showcasing their work, credentials, languages, and specialties. The directory helps event organizers, venues, and collaborators find the right people.

**For businesses and events** — A place to be recognized. Restaurants, theaters, festivals, and other venues can register their accessibility features so the community knows where they're welcome.

Both sides are invitation-only during beta. Members log in to see the full directory; a curated public view is available to anyone.

---

## Where Things Live

| Page | What It Does |
|---|---|
| `/` | Home / landing page |
| `/submit` | Join the registry (invite code required) |
| `/login` | Member login |
| `/members` | Full member directory (login required) |
| `/directory` | Public directory |
| `/profile/[id]` | Individual profile page |
| `/admin` | Admin dashboard (Mary Kate only) |
| `/contact` | Contact form |
| `/feedback` | Tester feedback |

---

## Current Status

**Beta testing** — The app is built and the code is ready. We're in the process of connecting the database and deploying so we can invite the first 50 testers.

See [PLAN.md](PLAN.md) for what's done, what's next, and what's coming later.

---

## The Stack

Everything runs on two accounts: **Supabase** (database, auth, file storage) and **Vercel** (hosting). Email is handled by **Resend**.

No AWS. No complicated infrastructure. Just those three services.

---

## For Developers

Technical setup instructions, database schema details, and Claude's working context are in:

- [SETUP_GUIDE.md](SETUP_GUIDE.md) — How to run the project locally and deploy
- [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) — Database tables and RLS policies
- [CLAUDE.md](CLAUDE.md) — Context file for AI-assisted development sessions

---

*Started January 2026.*
