# Site pass, September 2026

Quick whole-site survey done 2026-09-03. Ordered from most urgent to fun.
Each item has a "how" note so the next session can pick it up cold.

Baseline at time of survey: TypeScript clean, ESLint 12 errors (all the new
`react-hooks/set-state-in-effect` rule) + 40 warnings, git clean on `main`.

---

## Tier 1: fix first (security and data safety)

1. **Hardcoded member password in the client bundle.**
   `components/DevAutoLogin.tsx:39-42` ships the mk-member email and password
   in production JS, regardless of the env flag.
   Code side DONE 2026-09-04 (commit 406b4c6): credentials now come from
   `DEV_AUTO_LOGIN_EMAIL` / `DEV_AUTO_LOGIN_PASSWORD` in `.env.local` and the
   component never mounts in production. Still needed: MK rotates the password
   and updates `.env.local` plus CLAUDE.md's test account table.

2. DONE 030acfa. **Anyone can trigger login emails.** `app/api/send-login-email/route.ts`
   uses the service role with no auth check and no rate limit. POST any
   `profileId` and a magic link goes out to that member.
   How: read the caller's Supabase session server-side (cookie or bearer
   token), check `admin_users` via `is_admin()`, return 401 otherwise. Add a
   simple per-profile cooldown (store `last_login_email_at` on profiles or use
   an in-memory map). Return the same generic response for missing vs found.

3. DONE 2332261. **`AAAC-TEST` invite bypass is live in production.**
   `app/submit/page.tsx:253` and `:443`. Anyone can join without a code.
   How: wrap both checks in `process.env.NODE_ENV !== 'production'`, or delete
   them and use a dedicated real test code kept in the `invite_codes` table.
   Update CLAUDE.md, PLAN.md, and the beta memory when done.

4. DONE b56cf9b (MK still confirms CRON_SECRET in Vercel). **Calendar sync route fails open.** `app/api/sync-calendars/route.ts:100`
   skips auth if `CRON_SECRET` is unset.
   How: if the secret is missing, return 500 and log. Confirm the secret is set
   in Vercel before deploying.

5. DONE 20e3354. **Contact form is an open relay with HTML injection.**
   `app/api/contact/route.ts:22-30` interpolates name/email/subject/message raw
   into the email HTML.
   How: HTML-escape all four fields, regex-check the email, cap lengths, add a
   honeypot field on the form, and a light IP rate limit.

6. WRITTEN as v56, MK runs it. **`can_request_login_link()` lacks `SET search_path`.**
   `supabase-migration-v55.sql:222`. Sibling functions have it.
   How: write `supabase-migration-v56.sql` that recreates it with
   `SET search_path = public, auth`. Run in the SQL editor.

7. **Admin page gate is client-only.** DONE 2026-09-04: probed live as a
   signed-in non-admin member. Inserts into admin_users, invite_codes,
   resources, ics_sources, back_of_house_notes, and productions are all
   blocked; updates and deletes on other people's profiles and events touch
   zero rows. Members CAN insert events (go live at once, by design since v20)
   and resource_submissions (pending only). Nothing to fix.

8. WRITTEN as v56, MK runs it. **No unique constraint on one approved profile per user.** A recurrence
   signs the member out on login.
   How: migration with
   `CREATE UNIQUE INDEX ... ON profiles (user_id) WHERE status = 'approved'`.
   Check for existing duplicates first.

## Tier 2: correctness and lint

9. DONE 2026-09-04. **12 ESLint errors, `set-state-in-effect`.** Files: StartBar, the four
   Backstage components, profile/edit, home page, make-art, calendar,
   backstage/[slug].
   How: most are "sync state from props/route" effects. Replace with derived
   state, `useSyncExternalStore`, or key-based remounts. For
   `StartBar.tsx:172` (close menu on route change), close the menu in the
   link's onClick instead. Verify with `npx eslint app components lib`.

10. DONE 2026-09-04. **`lib/supabase.ts:4` falls back to `'placeholder-key'`.** A bad deploy
    fails confusingly at runtime.
    How: throw at module load if either env var is missing, with a plain
    message naming the variable.

11. **Dashboard silently swallows missing tables.** `app/dashboard/page.tsx`
    lines 123, 216, 238.
    How: confirm those tables now exist live, then remove the try/catch
    fallbacks or turn them into visible "couldn't load" states.

## Tier 3: accessibility backlog (the code is in good shape; this is the rest)

Clean already: all images have alt, no autoplay, no clickable divs, no em
dashes in copy, Modal component is solid, 51 files use live regions.

12. DONE 2026-09-04 (RTE dialogs verified by types and lint only; they live behind admin). **Replace native `window.prompt` / `confirm` with the Modal component.**
    Worst first:
    - `components/RichTextEditor.tsx:201` collects image alt text via a
      prompt. Build a small dialog that shows the image next to a labeled
      textarea with a "decorative" checkbox.
    - `components/ProductionsPanel.tsx:332` warns about undescribed photos in
      a prompt. Make it a dialog listing the photos with links to fix each.
    - `RichTextEditor.tsx:170, 199` link/image URL prompts.
    - Four Backstage delete confirms (Playlists:82, Graveyard:73,
      VideoLinks:75, Posts:105) and admin confirms (`admin/page.tsx:173, 322`).
    How: write one `useConfirm()` hook returning a promise, built on
    `components/Modal.tsx`, then swap all call sites.

13. **Add `noValidate` and announced errors** to three forms:
    `app/dashboard/page.tsx:688` (refer a colleague), `app/admin/page.tsx:810`
    (add admin), `app/admin/page.tsx:2496` (post).

14. **Dynamic page titles for productions and backstage.**
    `app/projects/[slug]/page.tsx:50` and `app/backstage/[slug]/page.tsx:47`
    set `document.title` after load, so the hard-load title is generic.
    How: add `generateMetadata` in a server `layout.tsx` under each `[slug]`
    folder, copying the pattern in `app/cinema/[slug]/layout.tsx`. Fetch the
    name with the anon client (published productions are readable).

15. **Hard navigations in retro chrome.** `components/BrowserChrome.tsx:186,
    188` and `app/resources/page.tsx:505, 543` set `window.location.href`.
    How: use `router.push`. Leave the Refresh button as a real reload.

16. **Admin dashboard reloads everything after each action** (from the July
    audit, still open). Focus is lost each time.
    How: after each mutation, update local state for that row instead of
    refetching all. Move focus to the next row or a status message.

17. **Small title gaps:** `app/reports/layout.tsx` has no title; `app/dev`
    has no layout (add one with `robots: { index: false }`).

## Tier 4: product gaps (things testers will notice)

18. **Six stubbed dashboard panels** (`app/dashboard/page.tsx:722-917`:
    Discussion Board, Job Board, Learning Portal, two Upcoming Events panels,
    My Lists) and `app/my-lists` is only a "coming soon" form.
    How: decide per panel: wire it (both Upcoming Events panels can read the
    calendar via `lib/events.ts` today), or hide it until built. Don't ship
    six dead panels on the member home.

19. **Calendar empty state has no CTA.** `app/calendar/page.tsx:870`.
    How: add a "Submit an event" link to `/submit-event`.

20. **Learning Hub subject buttons only change color.** `app/learning-hub/page.tsx:252`.
    They are honestly labeled "(coming soon)" for screen readers, but sighted
    users see a toolbar that looks live.
    How: filter the hub's content by subject, or add a visible "coming soon"
    note so both audiences get the same message.

21. **Two feedback forms with different jobs and no explanation.**
    `/feedback` is the logged-in tester round-1 form (writes to
    `tester_feedback`). `/share-feedback` is a public form that emails through
    the contact route. Neither links to the other, and `/share-feedback` has
    no inbound links in the app.
    How: decide whether `/share-feedback` still matters. If yes, link it from
    Help and the Start menu. If no, redirect it to `/contact`.

22. **Alt text is optional on production photos.**
    `components/ProductionPhotoUploader.tsx:149`.
    How: require a description or an explicit "decorative" choice before
    upload completes. Same rule for `GalleryUploader`.

23. **Client documents are placeholders in places.** Reports and staffing
    use a placeholder display font; `lib/staffing/data/riot-fest.ts:9` has
    placeholder rates. `_template.ts` will render `[TODO]` literally.
    How: pick the font, fill the rates, and make the template throw if a
    `[TODO]` string survives.

## Tier 5: missing infrastructure

24. **No SEO or share previews.** No `sitemap.ts`, `robots.ts`, or Open Graph
    image. `app/layout.tsx` has no `metadataBase` or `openGraph`.
    How: add `metadataBase`, a site-wide `openGraph` block with the stacked
    logo on navy as `app/opengraph-image.tsx`, `app/robots.ts` (disallow
    /admin, /dev, /reports, /staffing, /backstage), `app/sitemap.ts` for the
    public sections. Add `robots: { index: false }` to client-document
    layouts.

25. **No password reset or "didn't get the email" path.**
    How: on `/login`, add a resend link with a cooldown, and a
    `resetPasswordForEmail` flow for password users, landing on a small
    `/auth/reset` page.

26. **No email notifications** for new DMs, endorsements, or approvals.
    How: Supabase database webhooks (or a cron route) into Resend. Start with
    profile approved and new message. Add a per-member opt-out column.

27. **No privacy policy, terms, code of conduct, or access statement.** A
    directory with DMs needs at least conduct + privacy. Access statement is
    item 1 in CREATIVE-ACCESS-PLAN.md.
    How: static pages in the retro chrome, linked from the Start menu and the
    login screen. Draft text with MK; she has the voice.

28. **Old planning docs are stale.** PLAN.md still says the database is not
    live and refers work to MK's husband. CLAUDE.md line 9 says the same.
    TODO.md is the original MVP list.
    How: rewrite both to match reality, or fold them into this file and
    delete them. Never reference the husband.

## Tier 6: fun ideas that fit the retro voice

- **Away messages** on profiles, AIM style, shown in the buddy list.
- **Guestbook** on each profile with a moderation queue.
- **Working Recycle Bin** of "access myths we threw out," each restorable
  into a myth-busting card.
- **Screensaver**: after idle, a marquee of members' poetic image
  descriptions.
- **Winamp-style player** for The Channel with a caption-reactive visualizer.
- **Printable Access Card** with a QR code, printed from The Printer.
- **Tip of the Day** popup on the desktop linking into Learning Hub.
- **Clippy-descendant** access assistant that offers Printer checklists.
- **Hit counter and web ring** footer linking allied disability-arts sites.
- **Buddy icon contest** through Make Art; winners become Access Card icons.
- **Retro tooltip balloons** as the calendar tag glossary.

---

## Suggested order for tomorrow

Session 1: items 1 through 6 (about an hour of small edits plus one
migration), then item 9 (lint) so the build is clean. Commit and push after
each item.
Session 2: items 12 and 13 (the confirm/prompt dialog work), then 14 and 15.
Session 3: item 18 (dashboard panels) and item 24 (SEO), then pick fun ideas
with MK.

---

## Split of work (2026-09-04)

**Claude does alone, in this order:** items 1 (code side), 2, 3, 4, 5, 6 and 8
(write the migration), 7 (probe + code), 9, 10, 12, 13, 14, 15, 17, 19, 20, 24.

**MK must do first, or decide:**
- Rotate the mk-member password in Supabase Auth; put the new one in
  `.env.local` as `DEV_AUTO_LOGIN_PASSWORD`, never in chat.
- Run `supabase-migration-v56.sql` once it is pushed.
- Confirm `CRON_SECRET` is set in Vercel.
- Decide item 18 (dashboard panels), 21 (share-feedback), 22 (required alt
  text), 23 (font + Riot Fest rates), 27 (who drafts the policy pages).
