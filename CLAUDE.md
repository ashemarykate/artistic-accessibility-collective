# CLAUDE.md — Artistic Accessibility Collective

This file gives Claude context for working on this project. Read it at the start of every session.

---

## About the Project

The **Artistic Accessibility Collective (AAC)** is a member directory and community platform for accessibility professionals in the arts — ASL interpreters, captioners, educators, content creators, and others — as well as accessible businesses and events. Built and owned by **Mary Kate Ashe**, who is the founder and a non-technical user. Her husband helps with technical/infrastructure tasks.

The app is currently in **beta testing** with ~50 invited testers. The database is not yet live — migrations still need to be run.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS 4 + custom CSS design system in `app/globals.css` |
| Database | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth (magic link preferred, password as fallback) |
| Email | Resend (via `/api/contact` route) |
| File storage | Supabase Storage (planned for photo uploads — not yet built) |
| Hosting | Vercel |

---

## Design System

All design tokens are CSS custom properties in `app/globals.css`.

**Brand colors:**
- `--aac-blue: #2952C8` — primary blue, used for headings, buttons, links
- `--aac-navy: #0d1e4a` — dark navy, used as page backgrounds on some pages
- `--aac-blue-dark: #1a3280`
- `--aac-blue-light: #dde6ff`
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

Always use `logo-across-blue-bg.svg` in the site header and on colored-background pages. Logo link always has `aria-label="Artistic Accessibility Collective — Home"` and the `<img>` has `alt=""` (decorative, label is on the link).

Logo height: **72px** on most pages. **100px** on the invite code and type-select screens of the submit flow.

---

## Key Files

### Pages
- `app/page.tsx` — Home/landing page
- `app/login/page.tsx` — Member login (magic link + password toggle)
- `app/submit/page.tsx` — **Registration/join form** — the most complex page; see below
- `app/contact/page.tsx` — Public contact form (sends via Resend)
- `app/members/page.tsx` — Member dashboard (requires auth)
- `app/directory/page.tsx` — Public member directory
- `app/profile/[id]/page.tsx` — Individual profile view
- `app/admin/page.tsx` — Admin dashboard (requires admin role)
- `app/feedback/page.tsx` — Tester feedback page

### API
- `app/api/contact/route.ts` — Handles contact form submissions via Resend

### Database
- `supabase-migration.sql` — **Run first** — creates all core tables
- `supabase-migration-v2.sql` — **Run second** — adds columns for beta features (invite codes, tester feedback table, business profile columns, etc.)
- `lib/supabase.ts` — Supabase client

---

## The Submit / Registration Page (`app/submit/page.tsx`)

This is the most complex page. It has a 4-step flow:

```
invite → type_select → form → success
```

**Step: `invite`**
User enters their invite code. Validated against the `invite_codes` table in Supabase.
- **Test bypass**: code `AAAC-TEST` skips DB validation entirely. Remove this once the database is live and real codes are generated.

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
- Every page sets `document.title` on mount and restores it on unmount
- Success screens focus their heading on mount via `useRef`
- Skip nav link is in the layout
- All interactive elements meet 44×44px minimum touch target
- Focus ring: 3px solid `--aac-yellow` via `:focus-visible`
- Placeholder text color: `#6b7a9e` (passes 4.5:1 contrast against white)
- Logo images use `alt=""` with descriptive `aria-label` on the parent link

---

## Admin Setup (not yet done)

After migrations are run:
1. Find Mary Kate's auth user ID in Supabase → Authentication → Users
2. Run: `INSERT INTO admin_users (user_id) VALUES ('her-id-here');`

---

## Deployment Checklist (not yet done)

1. Run `supabase-migration.sql` in Supabase SQL Editor
2. Run `supabase-migration-v2.sql` in Supabase SQL Editor
3. Insert Mary Kate's user ID into `admin_users`
4. Add env vars to Vercel: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `RESEND_API_KEY`
5. Connect GitHub repo to Vercel and deploy
6. Test end-to-end with `AAAC-TEST` code
7. Run `SELECT generate_invite_codes(50);` to generate beta invite codes
8. Remove `AAAC-TEST` bypass from `app/submit/page.tsx` (or leave for ongoing testing)

---

## Photo Uploads (not yet built)

Deferred to a future round. Will use **Supabase Storage** — a bucket needs to be created in the Supabase dashboard first. The UI for uploading on the profile/submit pages does not yet exist. Tester feedback will inform how profiles should display photos before building this.

---

## Working with Mary Kate

- Non-technical — explain things in plain language, no jargon
- Design-forward — she has strong visual opinions and will give specific feedback
- Accessibility is a core value of the organization, not an afterthought — treat it seriously
- She gives feedback iteratively; expect multiple small rounds of refinement per feature
- When suggesting approaches, give a recommendation + the main tradeoff in 2–3 sentences, then wait for her to agree before implementing
