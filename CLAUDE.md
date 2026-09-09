# CLAUDE.md — Artistic Accessibility Collective

This file gives Claude context for working on this project. Read it at the start of every session.

---

## About the Project

The **Artistic Accessibility Collective (AAC)** is a member directory and community platform for accessibility professionals in the arts — ASL interpreters, captioners, educators, content creators, and others — as well as accessible businesses and events. Built and owned by **Mary Kate Ashe**, the founder. She is not a programmer, and she does all of the technical work herself with Claude's help: Supabase, migrations, deployment, and code. Give her the instructions directly, in plain language. Never route technical work to anyone else.

The app is **live and in beta** with invited testers. The database is live: 57 migrations have been written and applied, and there are real approved members with real accounts. Treat production data as real.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS 4 + custom CSS design system in `app/globals.css` |
| Database | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth (magic link preferred, password as fallback) |
| Email | Resend (contact form and member login links) |
| File storage | Supabase Storage, bucket `profile-photos` (built and in use) |
| Hosting | Vercel |

---

## Design System

All design tokens are CSS custom properties in `app/globals.css`.

**Brand colors:**
- `--aac-blue: #263590` — primary blue, used for headings, buttons, links
- `--aac-navy: #0d1e4a` — dark navy, used as page backgrounds on some pages
- `--aac-blue-dark: #1a2568`
- `--aac-blue-light: #d8dcf5`
- `--aac-yellow: #f5d84a` — focus ring color
- `--aac-cream: #f8f7f4` — default page background

**Page background colors by section:**
- Login, contact pages: `var(--aac-navy)` (`#0d1e4a`)
- Submit/register page: `#0d5c4a` (deep forest teal)
- Members, directory, admin pages: `var(--aac-blue)` via `.page-wrapper`

**Fonts:**
- `--font-display` / `.font-display`: `'AAC Display'` (TAY Big Bird) — used for all major headings and the site wordmark. Font files are in `public/fonts/`.
- `--font-body` / `.font-accent` / `.font-accent-italic`: system-ui stack — subtitles and body text use this. **Do not use `var(--font-accent)` (Highbeams) for subtitles** — it was intentionally replaced with the body font.

**Logo files** (in `public/images/`):
- `logo-across-blue-bg.svg` — horizontal logo, white text on transparent — use on blue/dark/teal backgrounds
- `logo-across-white-bg.svg` — horizontal logo for white backgrounds (currently unused in UI)
- `logo-stacked-white-bg.svg` — stacked logo for white backgrounds (currently unused in UI)

Always use `logo-across-blue-bg.svg` in the site header and on colored-background pages. Logo link always has `aria-label="Artistic Accessibility Collective, home"` and the `<img>` has `alt=""` (decorative, label is on the link).

Logo height: **72px** on most pages. **100px** on the invite code and type-select screens of the submit flow.

---

## Key Files

### Pages
- `app/page.tsx` — Home/landing page
- `app/login/page.tsx` — Member login (magic link + password toggle)
- `app/submit/page.tsx` — **Registration/join form** — the most complex page; see below
- `app/contact/page.tsx` — Public contact form (sends via Resend)
- `app/dashboard/page.tsx` — "My Collective", the member home (requires auth)
- `app/members/page.tsx` — Member directory, searchable (requires auth)
- `app/profile/[username]/page.tsx` — Individual profile view
- `app/admin/page.tsx` — Admin dashboard (requires admin role)
- `app/feedback/page.tsx` — Tester feedback, round 1 (writes to `tester_feedback`)

`app/directory`, `app/hire-us`, and `app/together` are redirect stubs, not pages.

### The other sections (each has its own retro skin)
Calendar, Library, Cinema, Resources, Learning Hub, Make Art, Printer,
Projects (productions), Backstage (production team area), Staffing and Reports
(client documents), Messages, Access Card, My Lists, My Resources.

### API
- `app/api/contact/route.ts` — Handles contact form submissions via Resend

### Database
- `supabase-migration*.sql` — 57 files, applied in order. **Everything through
  v56 is applied to the live database.** Never re-run the `CREATE TABLE` blocks
  in the early files; the tables exist.
- **Live policies have drifted from the files.** Do not trust the `.sql` files
  alone as the source of truth for what the live database allows. When it
  matters, verify empirically with a throwaway script using the keys in
  `.env.local`, then delete the script.
- `lib/supabase.ts` — Supabase client. Throws at startup if the env vars are missing.

---

## The Submit / Registration Page (`app/submit/page.tsx`)

This is the most complex page. It has a 4-step flow:

```
invite → type_select → form → success
```

**Step: `invite`**
User enters their invite code. Validated against the `invite_codes` table in Supabase.
- **Test bypass**: code `AAAC-TEST` skips database validation, but only when
  `NODE_ENV !== 'production'`. It does nothing on the live site.

**Step: `type_select`**
User chooses between "Create Your Profile" (individual) or "Register Your Business" (business/event). Has a Back button to return to invite step.

**Step: `form`**
Single form that renders different sections based on `profileType` state:
- **Individual sections**: About You (name, pronouns, email), Where Are You (city/state/country), What You Do (professions tag input, captioning checkbox for content creators), Brag About Yourself (credentials tag input, years of experience, languages)
- **Business sections**: About Your Business (business name, DBA), Where Are You (same fields), What You Do (business type tag input, services textarea), Accessibility (preset checkboxes + custom tag input)
- **Shared sections** (both types): Find Me Online (website, LinkedIn, Instagram), Anything Else (notes), Tester Feedback (4 questions + community feature checkboxes)

**Required fields:**
- Both types: Full Name / Business Name, Email, City, State/Province, Country
- Individual only: Pronouns, Profession(s), Languages, first two tester feedback questions
- Business only: Business Type, first two tester feedback questions

**Tag input pattern:** Type and press Enter (or comma) to add a tag. Backspace on empty input removes the last tag. Suggestion buttons shown as chips below the input. All tag additions/removals announced via `aria-live` region.

**Step: `success`**
Confirmation screen. Text adapts: "listing" for business, "application" for individual.

---

## Database Schema (key tables)

- **`profiles`** — one row per member or business. Key columns: `full_name`, `email`, `status` (pending/approved/rejected), `public_visible`, `profile_type` (individual/business), `specialties` (TEXT[]), `certifications` (TEXT[]), `languages` (TEXT[]), `accessibility_features` (TEXT[]), `services_provided`, `pronouns`, `user_id` (links to Supabase auth)
- **`invite_codes`** — codes for beta access. Generated in bulk via `SELECT generate_invite_codes(50);`
- **`tester_feedback`** — one row per profile per round of feedback
- **`admin_users`** — user IDs with admin access. RLS policies check this table.

All tables have Row Level Security (RLS) enabled.

---

## Accessibility Standards

This project targets **WCAG 2.1 AA**. Key patterns already implemented:

- All forms use `noValidate` with custom JS validation + `aria-invalid` / `aria-describedby` on error fields
- Error messages use `role="alert"` for immediate announcement
- Status messages (loading, etc.) use `role="status" aria-live="polite"`
- Focus is programmatically managed on step transitions (refs + `.focus()`)
- **Page titles come from a route-level `layout.tsx` exporting `metadata`, never
  from `document.title`.** This is settled. An imperative title set on mount is
  overridden by Next's metadata on load, and its cleanup clobbers the next
  page's title on a soft navigation. Every new page needs a `layout.tsx`.
  (Two deliberate exceptions: a title set from state *after* load, such as
  "Message Sent", and `app/error.tsx`, which cannot export metadata.)
- Success screens focus their heading on mount via `useRef`
- Skip nav link is in the layout
- All interactive elements meet 44×44px minimum touch target
- Focus ring: 3px solid `--aac-yellow` via `:focus-visible`
- Placeholder text color: `#6b7a9e` (passes 4.5:1 contrast against white)
- Logo images use `alt=""` with descriptive `aria-label` on the parent link

---

## Copy Rules

**Zero em dashes.** Never write `—` or `–` or `--` in user-facing copy. This includes visible text, placeholder text, aria-labels, and page titles. Em dashes read as AI-generated and are not the voice of this project.

When an em dash is tempting, rewrite with:
- A comma: "we can help, or connect you with someone who can"
- A colon: "We use a magic link: enter your email"
- A period: split the sentence
- Parentheses: "all Access Card features (plus a directory listing)"

Page title separators use `·` (interpunct, U+00B7), not `—`. Example: `"Help · Artistic Accessibility Collective"`.

Write clearly and casually. No formal punctuation markers that signal AI writing.

---

## Test Accounts (Supabase)

Two accounts exist in Supabase for local testing.

| Email | Role | Goes to |
|---|---|---|
| `mk-admin@artisticaccessibility.com` | super_admin | `/admin` |
| `mk-member@artisticaccessibility.com` | member | `/collective` |

Both have approved individual profiles already inserted.

**Passwords are never written in code or in this file.** Local auto-login reads
`DEV_AUTO_LOGIN_EMAIL` and `DEV_AUTO_LOGIN_PASSWORD` from `.env.local`, which is
not committed, and `components/DevAutoLogin.tsx` does not mount in production.
Set `NEXT_PUBLIC_DEV_AUTO_LOGIN=true` locally to use it.

---

## Admin Setup (done)

Mary Kate is in `admin_users` as `super_admin`. New admins are added from the
admin dashboard's "Add an admin" form, which calls `add_admin_by_email`. The
person must have logged in at least once first.

Admin-only database rules use the `is_admin()` helper. Any new admin policy
must use it rather than an inline `EXISTS` on `admin_users`.

---

## Deployment (done, and live)

The site is deployed on Vercel and connected to the GitHub repo. Migrations are
applied, admins are set, and 50 invite codes were generated.

Environment variables in Vercel: `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`,
and `CRON_SECRET` (the calendar sync route refuses to run without it).

**Push to git after every commit, without being asked.**

---

## Photo Uploads (built)

Three uploaders write to the `profile-photos` Supabase Storage bucket:
`PhotoUploader` (avatars), `GalleryUploader` (profile galleries, capped at 8),
and `ProductionPhotoUploader` (production hero and gallery images).

Alt text is currently optional on production and gallery photos. Making it
required, with an explicit "decorative" choice, is an open decision.

---

## The Live Plan

`SITE-PASS-2026-09.md` in the repo root is the current working plan: a tiered
list from urgent to fun, with DONE markers and a short list of things only
Mary Kate can do. Read it before starting new work, and update it as items land.
`PLAN.md` and `TODO.md` are historical and describe a pre-launch state.

---

## Working with Mary Kate

- Non-technical: explain things in plain language, no jargon
- Design-forward: she has strong visual opinions and will give specific feedback
- Accessibility is a core value of the organization, not an afterthought. Treat it seriously.
- She gives feedback iteratively; expect multiple small rounds of refinement per feature
- When suggesting approaches, give a recommendation + the main tradeoff in 2-3 sentences, then wait for her to agree before implementing
