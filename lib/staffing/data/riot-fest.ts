/**
 * STAFFING PRICE-OUT — Riot Fest (Chicago)
 * ────────────────────────────────────────
 * First real staffing sheet: ASL interpretation only. Accessibility Staff and
 * the Ops/Production Manager appear on the sheet as N/A so the client sees the
 * fuller menu without this quote covering them.
 *
 * NOTE FOR MK: the dollar figures (interpreter rate, daily minimum, admin flat
 * fee) are market-informed placeholders. Confirm or change them before this
 * sheet goes anywhere near Riot Fest.
 */

import type { StaffingSheetData } from '../types';

export const riotFest: StaffingSheetData = {
  event: {
    name: 'Riot Fest',
    slug: 'riot-fest',
    location: 'Douglass Park · Chicago, IL',
    dates: 'September 2026',
    scope: 'ASL interpretation for live performances',
    overview:
      'This is a price-out for ASL interpretation across Riot Fest\'s live sets: what each role costs, what we handle, and why our bench of interpreters is the right one for this festival. It covers interpreter staffing only. The other roles we offer are listed so you can see the full menu, but they are not part of this quote.',
    preparedDate: 'July 2026',
  },

  // ── Roles & Rates ──────────────────────────────────────────────────────────
  roles: [
    {
      role: 'ASL Interpreter (Performance)',
      covers:
        'Certified interpreters with live music experience, booked in teams of two for any set over 45 minutes. Prep is included: we get set lists and lyrics to the team ahead of the festival, because a great music interpretation is rehearsed, not winged.',
      rate: '$95/hr per interpreter · 4 hour daily minimum',
      engagement: 'In this quote',
      included: true,
    },
    {
      role: 'Accessibility Staff',
      covers:
        'General event workers with accessibility training: access entrances, viewing platforms, wayfinding, and guest questions, handled by people who know how to answer them.',
      rate: 'Scoped per event',
      engagement: 'N/A for this quote',
      included: false,
    },
    {
      role: 'Accessibility Ops / Production Manager',
      covers:
        'A lead who runs the whole access operation: staffing, radios, vendor coordination, and day-of problem solving, so access issues never have to climb your chain of command.',
      rate: 'Scoped per event',
      engagement: 'N/A for this quote',
      included: false,
    },
    {
      role: 'Scheduling & Invoicing Admin',
      covers:
        'We build the interpreter schedule around your set times, handle swaps and cancellations, and take on every interpreter invoice. You get one invoice: ours.',
      rate: '$450 flat, per festival',
      engagement: 'In this quote',
      included: true,
    },
  ],

  // ── What you get with us (universal) ───────────────────────────────────────
  whyUs: [
    'Vetted professionals, not a directory dump. Every interpreter we book is someone we know and have seen work. If they are on your stage, we would put them on ours.',
    'One point of contact, one invoice. We do the scheduling, the swaps, the cancellations, and all the interpreter invoicing, so your production office deals with exactly one vendor.',
    'The Collective comes with us. Our free library of verified accessibility resources, the printable checklists in The Printer, and our community events calendar are open to your whole team, whether or not you ever hire us again.',
    'Access knowledge is part of the crew. Our people notice things while they work, and we pass along the quick wins we spot, free, because that is the point of all this.',
  ],

  // ── Why this works for Riot Fest specifically ──────────────────────────────
  whyThisEvent: [
    'We are long time locals, and we went to college alongside many of the arts interpreters working in Chicago today. That means we are not cold-emailing a directory: we are choosing your team from the largest pool of performance-experienced interpreters in the city, on relationships built over years.',
    'And Riot Fest sets are fast, loud, and full of crowd work. That is exactly the kind of show where interpreter quality is visible from the back of the field, and exactly the kind of show our people love to work.',
  ],

  // ── How it works, start to finish ──────────────────────────────────────────
  steps: [
    {
      step: 'You send the lineup',
      detail: 'Set times, stages, and which sets need coverage. A draft is fine; schedules move and so do we.',
    },
    {
      step: 'We build the team',
      detail: 'Interpreters matched to stages and genres, with set lists and lyrics in their hands ahead of the festival.',
    },
    {
      step: 'Show days run themselves',
      detail: 'Teams of two, scheduled breaks, and a named lead your production office can radio.',
    },
    {
      step: 'One invoice',
      detail: 'After the festival, we pay every interpreter and send you a single itemized invoice.',
    },
  ],

  validityNote: 'Numbers on this sheet hold for 60 days from the prepared date.',
};
