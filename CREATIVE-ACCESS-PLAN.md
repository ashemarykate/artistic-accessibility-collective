# Creative Access Plan

*A roadmap for making artisticaccessibility.com not just compliant, but a living example of creative access. Written July 2026.*

## The guiding idea

The disability arts world draws a line between three levels of access:

1. **Compliance access**: meets WCAG and the law. This is the floor.
2. **Good-practice access**: high-quality, standard deliverables. Captions that are accurate, alt text that is complete.
3. **Creative access**: access designed as part of the art itself. Alt text that reads like poetry. Captions that carry emotion. Access that enriches the experience for everyone.

The July 2026 audit put the site solidly on the road through level 1 and into level 2. This plan is about level 3, which is exactly where an organization called the Artistic Accessibility Collective should live. The site itself should demonstrate what it advocates. Mia Mingus calls this "access is love": care embedded in craft.

A note on models used throughout: **Fable 5** for anything where the writing IS the product (creative alt text, expressive copy, teaching content, community-facing voice). **Opus 4.8** for large structural builds and rewrites. **Sonnet 5** for well-scoped feature work where the pattern already exists in the codebase. Lift sizes: **S** = an afternoon, **M** = a session or two, **L** = a multi-session project.

---

## Round 1: Quick creative wins (all S, one or two sessions total)

### 1. An access statement with a soul
**Page: new, linked from footer and Help.** Most access statements are legal boilerplate. Ours should be a genre piece: written in the site's voice, honest about what works, what does not yet, and how to tell us. Includes the audit story ("we found 370 things and we are fixing them in the open"). Honesty about gaps is itself access practice.
**Model: Fable 5** (voice-critical). **Lift: S.**

### 2. Tag glossary for the Calendar
**Page: Calendar.** Tags like "Relaxed Performance," "Audio Described," and "CART" mean nothing to someone new to access. A plain-language glossary (popover or small page) explaining each tag, what to expect, and who it serves. Doubles as education for venues submitting events.
**Model: Sonnet 5** with Fable 5 drafting the definitions. **Lift: S.**

### 3. Creative access shelf in The Printer
**Page: The Printer (now admin-manageable, no code needed).** Add via the new admin Page Content section: the Access Rider guide is already there; add Sins Invalid access checklist variants, TDF front-of-house training sheets, an access budget worksheet (the 8 to 12 percent framework), and a "describe this image" workshop sheet based on Alt Text as Poetry exercises.
**Model: none needed, this is curation through the admin panel.** **Lift: S.**

### 4. Creative Captioning corner in Cinema
**Page: Cinema.** A featured shelf on caption craft: Caption with Intention (Academy Award of Merit, open source), the Stranger Things captioning story, the University of Sheffield suspense research, Cheryl Green's work. Cinema items already support tags, so a "Creative Access" tag does the grouping.
**Model: curation via admin, plus Fable 5 for descriptions.** **Lift: S.**

---

## Round 2: Creative projects that slot into existing pages (M each)

### 5. Image Description as Art, phase two
**Page: Make Art.** This project already exists on the site and it is the single best fit between the collective's identity and the creative access movement. Phase two gives it infrastructure: a real submission form (replacing email), a small public gallery of member-written poetic image descriptions displayed AS the art (the Kinetic Light model: descriptions as public-facing content, not hidden metadata), and a rotating "description of the month."
**Model: Sonnet 5** for the build (submission and review patterns already exist in the codebase), **Fable 5** for prompts and example descriptions. **Lift: M.** This also creates the art submission review queue for the admin panel that we noted last round.

### 6. Access riders on member profiles
**Pages: Edit Profile, Profile view.** Let artists publish their access rider on their profile: what they need to do their best work. Graeae publishes a free guide on writing one (already linked in The Printer). This normalizes riders as a professional standard and makes the directory more useful to venues hiring members. One new profile field plus a nicely styled profile section.
**Model: Sonnet 5.** **Lift: M** (migration, form, display, plus a short "what is an access rider" explainer by Fable 5).

### 7. Alt Text as Poetry built into photo uploads
**Pages: Submit and Edit Profile, when photo uploads land.** Photo uploads are already planned. When they arrive, do not ship a bare alt text field. Ship a describing experience: prompts drawn from Alt Text as Poetry ("what matters in this image? what does it feel like?"), identity descriptors encouraged rather than avoided, a gentle example. Members learn creative description by doing it. This is the highest-leverage creative move on the whole site because it turns every member into a practitioner.
**Model: Fable 5** for the prompt design and microcopy, **Sonnet 5** for the upload plumbing. **Lift: M on top of the photo upload work itself.**

### 8. Learning Hub: DIY access mini-guides
**Page: Learning Hub.** Short, friendly guides in the hub's voice: "Caption your first video for free" (Whisper, MacWhisper, Subtitle Edit, honest quality tradeoffs), "Your first audio description" (DCMP free modules, Think Outside the Vox), "Where to actually get trained" (a currency-checked training directory; note the Toronto Metropolitan certificate was discontinued in February 2026 and the CAUDES certification is expected from 2026, so this list needs a verified-as-of date on it).
**Model: Fable 5** (teaching content, and the currency checking matters). **Lift: M.**

### 9. ASL and Deaf arts playlist on The Channel
**Page: Make Art, The Channel.** A curated block of ASL poetry and visual vernacular: Clayton Valli, Flying Words Project, Deaf West's Spring Awakening material, CJ Jones. ASL is a complete language with its own poetic devices, and The Channel is the natural home for showing that. Pure curation.
**Model: Fable 5 with web verification of each video's availability and caption quality.** **Lift: S to M.**

---

## Round 3: The bigger, signature builds (L)

### 10. Finish the structural floor (from the July audit)
Not creative, but the creative work stands on it: the admin dashboard's full-reload-after-every-action rewrite (now more valuable since volunteers will live in the new panel), reusing the Modal component for admin delete confirmations, unsaved-changes protection on long forms, and the client-facing reports pages' contrast and mobile issues (clients see those).
**Model: Opus 4.8** (large mechanical rewrite, needs care with focus management). **Lift: L, but divisible.**

### 11. An ASL welcome
**Page: Home.** Deaf-led and Deaf-serving organizations put ASL video front and center; an English-only website quietly says who it is for. A short, captioned, audio-described welcome video in ASL on the home page (or an "ASL" button in the header, the NAD pattern). The build is small; the video is community work, ideally a member commission, which makes it a Make Art project too.
**Model: build is Sonnet 5; the real lift is producing the video.** **Lift: L overall, S in code.**

### 12. Audimance-inspired "choose your description" experiment
**Page: Make Art or Cinema.** Kinetic Light's Audimance lets audiences choose between poetic, screenplay-style, and soundscape description tracks. A small web homage: one artwork or short film with three switchable description styles, letting visitors feel the difference between compliance description and creative description. It is a teaching tool, a portfolio piece, and a genuinely novel thing for a community site to have.
**Model: Fable 5** (the three descriptions are the hard part; the player is simple). **Lift: L, but a delightful one.**

---

## Suggested order

Round 1 in the next session or two (small, visible, and the access statement sets the tone). Then 5 and 6 together, since both touch profiles and submissions. Item 7 rides along with photo uploads whenever that round happens. Item 10 whenever there is appetite for an infrastructure session. Items 11 and 12 are the flagship pieces to aim toward, and both make good stories for the beta community.

Two standing rules from the skill this plan leans on: date every volatile fact (training programs, certifications, funding all shift), and for anything community-facing, disabled voices lead. Where a project involves representing Deaf or blind experience (9, 11, 12), the plan should be built WITH members from those communities, not just for them. That is not a constraint on the creativity. It is where the creativity comes from.
