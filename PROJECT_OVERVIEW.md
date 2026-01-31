# Artistic Accessibility Collective - Project Overview

**Owner:** MK (Mary Kate Ashe-Cunningham)  
**Started:** 2026-01-30  
**Status:** Planning / Schema design  

---

## Vision

A dual-purpose platform for the accessibility community:

1. **Professional Registry** — Directory of accessibility professionals (ASL interpreters, captioners, creative designers, event workers, etc.)
2. **Learning Resources** — Training videos, workshops, and educational materials

**Core goal:** Help MK staff events + help the community find quality professionals and training.

---

## Key Features

### Professional Registry

- ✅ **Submission form** → admin approval → published profile
- ✅ **Two visibility tiers:**
  - Public directory (opt-in)
  - Member-only directory (all approved profiles)
- ✅ **Peer endorsements:** Verified members can vouch for each other
  - Display endorser avatars on profile pages
  - Shows community trust
- ✅ **Specialties:** Tagging system for different accessibility fields
- ✅ **Location + travel willingness**
- ✅ **Contact info** (visible to members only)

### Learning Resources

- ✅ **Video library** with categorization
- ✅ **Three visibility levels:**
  - Public (anyone)
  - Members-only (registry members)
  - Custom access (specific training cohorts)
- ✅ **Creator attribution:** Link resources to registry professionals
- ✅ **Tagging + difficulty levels**
- ✅ **Admin approval workflow**

### Admin Panel

- ✅ **Unified dashboard** for both systems
- ✅ **Review pending submissions** (profiles + resources)
- ✅ **Approve/reject with notes**
- ✅ **Manage visibility settings**
- ✅ **View analytics** (future)

---

## Architecture

**Backend:** Supabase  
- PostgreSQL database (see `DATABASE_SCHEMA.md`)
- Row-level security (RLS) for visibility control
- Auth (email/password + magic link?)
- Storage (avatars, thumbnails)

**Frontends:** (TBD - Next.js? Astro? Plain HTML?)
- `yoursite.com/directory` — Public + member registry
- `yoursite.com/learn` — Training resources
- `admin.yoursite.com` — Admin panel

**Shared:**
- Same Supabase project
- Cross-reference data (trainings by specific professionals)
- Single admin login

---

## Workflow

### New Professional Joins

1. Fill out public submission form
2. Form creates `profiles` record with `status='pending'`
3. Admin reviews in admin panel
4. Admin approves → `status='approved'`
5. Profile visible to members
6. Professional opts into public visibility if desired

### Endorsements

1. Member A logs in
2. Views Member B's profile
3. Clicks "Endorse" → creates `endorsements` record
4. Member B's profile shows Member A's avatar in endorsement cluster

### Resource Publishing

1. Admin (or creator) uploads resource
2. Sets visibility level (public/members/custom)
3. Tags creators from registry
4. Approves → visible to appropriate audience

---

## Tech Stack (TBD)

**Confirmed:**
- Supabase (backend, auth, database)
- PostgreSQL
- Row-level security

**To decide:**
- Frontend framework
- Form builder (custom vs Tally/Typeform)
- Video hosting (YouTube embeds? Vimeo? Self-hosted?)
- Domain setup

---

## Next Steps

1. ✅ Database schema designed
2. ⬜ Set up Supabase project
3. ⬜ Run SQL migrations
4. ⬜ Create GitHub repo
5. ⬜ Build submission form (HTML prototype?)
6. ⬜ Build admin approval interface
7. ⬜ Design public directory view
8. ⬜ Add endorsement UI
9. ⬜ Layer in learning resources

---

## Files

- `DATABASE_SCHEMA.md` — Full SQL schema + RLS policies
- `PROJECT_OVERVIEW.md` — This file
- (more to come)

---

## Notes

- Keep both systems separate on frontend, unified on backend
- Endorsements are peer-to-peer trust signals, not reviews
- Custom trainings use access lists (important for paid workshops)
- Start with registry, add resources later
- Mobile-friendly is critical (people staff events on the go)

