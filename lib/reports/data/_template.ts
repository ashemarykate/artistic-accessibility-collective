/**
 * AAC ACCESSIBILITY ASSESSMENT TEMPLATE
 * ─────────────────────────────────────
 * To create a new report:
 *   1. Duplicate this file and rename it (e.g. `salt-lake-arts-council.ts`)
 *   2. Fill in every field marked [TODO]
 *   3. Register it in index.ts: add the slug → import to the `reports` object
 *   4. Visit /reports/[your-slug] to preview
 *   5. Click "Print / Save as PDF" or run the export script
 *
 * COVER PHOTO: drop a landscape photo at public/images/reports/[slug]-cover.jpg
 * (any decent-resolution JPEG works — it gets a dark overlay so neon/contrast helps)
 */

import type { ReportData } from '../types';

export const template: ReportData = {
  org: {
    name: '[TODO: Organization Full Name]',
    slug: '[TODO: url-safe-slug]',          // e.g. 'salt-lake-arts-council'
    abbreviation: '[TODO: ABC]',             // optional — used in text
    location: '[TODO: City, State]',
    type: '[TODO: 501(c)(3) nonprofit]',     // or "city agency", "BID", etc.
    overview:
      '[TODO: 2–3 sentence description of the organization — what they do, who they serve, how they describe themselves. Quote their own language where possible.]',
    preparedDate: '[TODO: Month YYYY]',      // e.g. 'June 2026'
    assessmentDate: '[TODO: Month YYYY]',
    coverPhoto: '/images/reports/[TODO: slug]-cover.jpg',
  },

  // ── Events ─────────────────────────────────────────────────────────────────
  // List their main public events. Pull from their website.
  events: [
    {
      name: '[TODO: Event Name]',
      when: '[TODO: Dates / Location]',
      format: '[TODO: Outdoor/indoor. Duration. Rough scale. Any notable features.]',
    },
    // Add more events as needed
  ],

  // ── Funders & Partners ─────────────────────────────────────────────────────
  // Focus on funders with accessibility implications (NEA, public funders, city grants).
  funders: [
    {
      name: '[TODO: Funder Name]',
      note: '[TODO: Note the accessibility obligation or relevance this funder creates.]',
    },
    // Add more as needed
  ],

  // ── Assessment Areas ───────────────────────────────────────────────────────
  // Fill in all 8 areas. Status options: 'good' | 'gaps' | 'not-found' | 'needs-info'
  // Priority options: 'HIGH' | 'MEDIUM' | 'LOW'
  assessmentAreas: [
    {
      id: 1,
      title: 'Website & Digital Access',
      context:
        'Your website often serves as the first barrier or first welcome for disabled visitors.',
      status: '[TODO]' as 'gaps',
      statusLabel: '[TODO: Gaps / Not Found / Needs Info / Good]',
      priority: '[TODO]' as 'HIGH',
      whatWeFound: [
        '[TODO: specific finding from their actual website]',
        '[TODO: specific finding]',
      ],
      openQuestions: [
        '[TODO: question that needs their input to answer]',
      ],
      recommendations: [
        '[TODO: concrete, actionable recommendation]',
        '[TODO: recommendation]',
      ],
      resources: [
        {
          name: 'WAVE, Web Accessibility Evaluation Tool',
          url: 'https://wave.webaim.org',
          description: 'Free browser-based checker',
        },
        {
          name: 'WebAIM, Web Accessibility In Mind',
          url: 'https://webaim.org',
          description: 'Best free practical web accessibility resource',
        },
        {
          name: 'W3C Web Accessibility Initiative (WAI)',
          url: 'https://w3.org/WAI',
          description: 'Authoritative source for WCAG',
        },
        {
          name: 'The A11y Project',
          url: 'https://a11yproject.com',
          description: 'Practical patterns, checklists, and articles',
        },
        {
          name: 'Alt Text as Poetry',
          url: 'https://alt-text-as-poetry.net',
          description: 'Reframes alt text as creative and political practice',
        },
      ],
    },

    {
      id: 2,
      title: 'Physical & Venue Access',
      context:
        'Parking, pathways, restrooms: physical access requires intentional planning. For outdoor events, surface conditions and corridor width determine who can actually attend.',
      status: '[TODO]' as 'needs-info',
      statusLabel: '[TODO]',
      priority: '[TODO]' as 'HIGH',
      whatWeFound: [
        '[TODO: specific finding about their venue(s) or events]',
      ],
      openQuestions: [
        '[TODO: What is the ground surface at each event location?]',
      ],
      recommendations: [
        '[TODO: specific recommendation for this org]',
      ],
      resources: [
        {
          name: 'ADA Checklist for Existing Facilities',
          url: 'https://adachecklist.org',
          description: 'Free self-evaluation tool',
        },
        {
          name: 'ADA.gov, Accessible Outdoor Events',
          url: 'https://ada.gov/resources/outdoor-access',
          description: 'Federal guidance for outdoor event access',
        },
        // Add state/local ADA center if applicable:
        // { name: '[State] ADA Center', url: '...', description: 'Free local technical assistance' },
      ],
    },

    {
      id: 3,
      title: 'Communication Access',
      context:
        'ASL interpretation, CART captioning, assistive listening: this is the highest-gap area for most organizations. Communication access means Deaf and hard of hearing people can fully participate, not just physically attend.',
      status: '[TODO]' as 'not-found',
      statusLabel: '[TODO]',
      priority: '[TODO]' as 'HIGH',
      whatWeFound: [
        '[TODO: finding about communication access at their events]',
      ],
      openQuestions: [
        '[TODO: Have any Deaf or hard of hearing attendees ever requested interpretation or CART?]',
        '[TODO: What is the budget available for communication access?]',
      ],
      recommendations: [
        '[TODO: recommendation specific to their event format]',
      ],
      resources: [
        {
          name: 'GalaPro, Live Captioning App for Arts',
          url: 'https://galapro.com',
          description: 'Free implementation for eligible venues',
        },
        {
          name: 'Registry of Interpreters for the Deaf',
          url: 'https://rid.org',
          description: 'Find certified ASL interpreters',
        },
        {
          name: 'CART Captioning Providers Directory',
          url: 'https://actscart.com',
          description: 'Remote and in-person CART providers',
        },
        {
          name: 'Assistive Listening Systems Guide (HLAA)',
          url: 'https://hearingloss.org/hearing-help/assistive-listening-devices',
          description: 'FM, infrared, and induction loop systems',
        },
      ],
    },

    {
      id: 4,
      title: 'Sensory & Neurodivergent Access',
      context:
        'Quiet zones, sensory info, predictability: often low-cost, high-impact. Even small interventions make a meaningful difference for autistic attendees, people with PTSD or anxiety, and others.',
      status: '[TODO]' as 'not-found',
      statusLabel: '[TODO]',
      priority: '[TODO]' as 'MEDIUM',
      whatWeFound: [
        '[TODO: finding about sensory environment at their events]',
      ],
      openQuestions: [
        '[TODO: Are there naturally quieter areas at events that could be designated as rest areas?]',
      ],
      recommendations: [
        '[TODO: recommendation]',
      ],
      resources: [
        {
          name: 'Autism Speaks, Sensory-Friendly Events Guide',
          url: 'https://autismspeaks.org/sensory-friendly-guide',
          description: 'Practical toolkit for event planners',
        },
        {
          name: 'IBCCES Sensory Certification Resources',
          url: 'https://ibcces.org/sensory-inclusive',
          description: 'Sensory-inclusive event training',
        },
      ],
    },

    {
      id: 5,
      title: 'Accessibility Statements & Documentation',
      context:
        'A public accessibility statement tells disabled people what to expect, who to contact, and what to do if a need isn\'t listed. Its absence is itself a signal.',
      status: '[TODO]' as 'not-found',
      statusLabel: '[TODO]',
      priority: '[TODO]' as 'HIGH',
      whatWeFound: [
        '[TODO: finding about their current documentation or lack thereof]',
      ],
      openQuestions: [
        '[TODO: Is there a staff member who currently handles access requests, even informally?]',
      ],
      recommendations: [
        '[TODO: recommendation]',
      ],
      resources: [
        {
          name: 'Sample Accessibility Statements',
          url: 'https://weareinclusivearts.com/accessibility-statement',
          description: 'Model language you can adapt',
        },
        {
          name: 'NEA Accessibility Planning Resources',
          url: 'https://arts.gov/grants/apply-grant/accessibility',
          description: "NEA's accessibility expectations",
        },
        {
          name: 'ADA Accommodation Request Best Practices',
          url: 'https://ada.gov/topics/reasonable-modifications',
          description: 'What "reasonable accommodation" means in practice',
        },
      ],
    },

    {
      id: 6,
      title: 'Staff & Volunteer Training',
      context:
        "The most common access failure isn't a missing ramp: it's an unprepared volunteer. Training is high-leverage and often low-cost.",
      status: '[TODO]' as 'needs-info',
      statusLabel: '[TODO]',
      priority: '[TODO]' as 'MEDIUM',
      whatWeFound: [
        '[TODO: finding about volunteer/staff training materials]',
      ],
      openQuestions: [
        '[TODO: What does current volunteer orientation look like?]',
      ],
      recommendations: [
        '[TODO: recommendation]',
      ],
      resources: [
        {
          name: 'Disability Etiquette, United Spinal Association',
          url: 'https://unitedspinal.org/disability-etiquette',
          description: 'Best free introductory guide — print and share',
        },
        {
          name: 'ADA National Network, Free Training',
          url: 'https://adata.org/training',
          description: 'Free webinars and courses on ADA and disability inclusion',
        },
      ],
    },

    {
      id: 7,
      title: 'Emergency Procedures',
      context:
        'Disability-inclusive emergency planning is a legal requirement in most jurisdictions and is among the most commonly neglected aspects of event safety.',
      status: '[TODO]' as 'needs-info',
      statusLabel: '[TODO]',
      priority: '[TODO]' as 'MEDIUM',
      whatWeFound: [
        '[TODO: finding about their emergency/evacuation planning]',
      ],
      openQuestions: [
        '[TODO: Does the org have an emergency action plan? Does it include disability-specific provisions?]',
      ],
      recommendations: [
        '[TODO: recommendation]',
      ],
      resources: [
        {
          name: 'FEMA, Access and Functional Needs in Emergency Planning',
          url: 'https://ready.gov/individuals-access-functional-needs',
          description: 'Federal guidance on disability-inclusive emergency planning',
        },
        {
          name: 'ADA Emergency Preparedness Guide',
          url: 'https://ada.gov/resources/emergency-preparedness',
          description: 'ADA guidance specific to events and facilities',
        },
        {
          name: 'Disability-Inclusive Emergency Planning Toolkit',
          url: 'https://adata.org/emergency-planning',
          description: 'ADA National Network free toolkit',
        },
      ],
    },

    {
      id: 8,
      title: 'Artist & Vendor Inclusion',
      context:
        'Disabled artists and vendors are participants, not just attendees. Application processes, booth setups, and performer briefings all have access dimensions.',
      status: '[TODO]' as 'needs-info',
      statusLabel: '[TODO]',
      priority: '[TODO]' as 'MEDIUM',
      whatWeFound: [
        '[TODO: finding about artist/vendor application or participation process]',
      ],
      openQuestions: [
        '[TODO: Has the org received any requests for accessible booth space or load-in accommodation?]',
      ],
      recommendations: [
        '[TODO: recommendation]',
      ],
      resources: [
        {
          name: 'VSA, Art & Disability Resources',
          url: 'https://kennedy-center.org/education/vsa',
          description: 'Programs and resources for disabled artists',
        },
        {
          name: 'Disability Arts Online',
          url: 'https://disabilityarts.online',
          description: 'Platform for disabled artists',
        },
      ],
    },
  ],

  // ── Priority Action Plan ───────────────────────────────────────────────────
  // Customize the labels and actions to match this org's specific timeline.
  priorityPhases: [
    {
      phase: 'Do First',
      label: '[TODO: "Before Your Next Major Event" or specific event name]',
      actions: [
        'Answer the open questions in this document and return to us',
        '[TODO: most urgent, lowest-effort action for this org]',
        '[TODO: action]',
        '[TODO: action]',
      ],
    },
    {
      phase: '6-Month Goals',
      label: '[TODO: specific milestone, e.g. "Before [Event Name] (Month YYYY)"]',
      actions: [
        '[TODO: action]',
        '[TODO: action]',
        '[TODO: action]',
      ],
    },
    {
      phase: 'Ongoing',
      label: 'Building Access as Practice',
      actions: [
        'Train one staff member or lead volunteer as your in-house access champion',
        'Build an annual access review into your event debrief process',
        '[TODO: org-specific ongoing action]',
        '[TODO: connect with local ADA center or state arts accessibility resource]',
      ],
    },
  ],

  // ── Legal & Funder Notes ───────────────────────────────────────────────────
  // Keep ADA Title III as a constant. Swap in the org's specific funders.
  legalNotes: [
    {
      framework: 'ADA Title III',
      description:
        'As a public accommodation, this organization is covered by ADA Title III. The 2024 DOJ rule establishes WCAG 2.1 AA as the web accessibility standard for covered entities. Physical access requirements for events are enforceable under Title III.',
      action:
        'Ensure events held in accessible facilities remain accessible in practice, including temporary setups (vendor booths, stages, tents).',
    },
    {
      framework: '[TODO: Primary Funder, e.g. NEA]',
      description:
        '[TODO: Note the funder\'s specific accessibility requirements and what Section 504 / grant conditions apply.]',
      action:
        '[TODO: Specific action this org should take regarding this funder.]',
    },
    {
      framework: '[TODO: State/Local Funder or Jurisdiction]',
      description:
        '[TODO: Note any state or local accessibility law, grant condition, or relevant technical assistance resource.]',
      action:
        '[TODO: Specific action or resource.]',
    },
  ],

  // ── Key Resources at a Glance ─────────────────────────────────────────────
  // These are mostly universal. Add a state/local resource row if there's
  // a strong local ADA center or state arts accessibility body.
  keyResources: [
    {
      category: 'Digital & Web Accessibility',
      items: [
        { name: 'WAVE Web Accessibility Evaluator', url: 'https://wave.webaim.org', description: 'Free browser-based checker' },
        { name: 'WebAIM, Web Accessibility In Mind', url: 'https://webaim.org', description: 'Practical web accessibility resource' },
        { name: 'The A11y Project', url: 'https://a11yproject.com', description: 'Patterns, checklists, and articles' },
        { name: 'W3C WAI, WCAG Standards', url: 'https://w3.org/WAI', description: 'Authoritative source for WCAG' },
      ],
    },
    {
      category: 'Physical Access & Venues',
      items: [
        { name: 'ADA Checklist for Existing Facilities', url: 'https://adachecklist.org', description: 'Free self-evaluation tool' },
        { name: '[TODO: State] ADA Center', url: 'https://[TODO].org', description: 'Free consultations for [State] orgs' },
        { name: 'ADA.gov, Accessible Outdoor Events', url: 'https://ada.gov', description: 'Federal guidance for outdoor access' },
      ],
    },
    {
      category: 'Communication Access',
      items: [
        { name: 'GalaPro, Live Captioning for Arts', url: 'https://galapro.com', description: 'Free for eligible venues' },
        { name: 'Registry of Interpreters for the Deaf', url: 'https://rid.org', description: 'Find certified ASL interpreters' },
        { name: 'Hearing Loss Association, Assistive Listening', url: 'https://hearingloss.org', description: 'FM, infrared, and loop systems' },
      ],
    },
    {
      category: 'Training & Culture',
      items: [
        { name: 'Disability Etiquette, United Spinal', url: 'https://unitedspinal.org/disability-etiquette', description: 'Best free introductory guide' },
        { name: 'ADA National Network, Free Training', url: 'https://adata.org/training', description: 'Free webinars and ADA courses' },
        { name: 'VSA Arts, Disabled Artists Resources', url: 'https://kennedy-center.org/education/vsa', description: 'Programs and resources' },
      ],
    },
    {
      category: 'Law & Funding',
      items: [
        { name: 'ADA.gov, Official Federal Guidance', url: 'https://ada.gov', description: 'Official ADA resource' },
        { name: 'NEA Accessibility Planning', url: 'https://arts.gov/grants/apply-grant/accessibility', description: "NEA's accessibility expectations" },
        { name: 'Disability Rights Advocates', url: 'https://dralegal.org', description: 'Legal resources and advocacy' },
      ],
    },
  ],

  // ── Services & Pricing ────────────────────────────────────────────────────
  // This table is the same for every org — no edits needed here.
  services: [
    { name: 'Website Accessibility Audit', prices: { community: '$250', small: '$475', established: '$850', large: '$1,500+' } },
    { name: 'Accessibility Statement Writing', prices: { community: '$150', small: '$275', established: '$475', large: '$750+' } },
    { name: 'Custom Written Training Materials', prices: { community: '$175', small: '$325', established: '$550', large: '$900+' } },
    { name: 'Virtual Training Workshop', prices: { community: '$125', small: '$250', established: '$425', large: '$650+' } },
    { name: 'Train-the-Trainer Package', prices: { community: '$325', small: '$575', established: '$950', large: '$1,600+' } },
    { name: 'Walkthrough Readiness Training', prices: { community: '$175', small: '$300', established: '$500', large: '$800+' } },
    { name: 'Event-Specific Access Advising', prices: { community: '$100', small: '$175', established: '$300', large: '$500+' } },
    { name: 'Communication Access Consulting', prices: { community: '$125', small: '$225', established: '$375', large: '$650+' } },
    { name: 'Ongoing Advisory (Annual Package)', prices: { community: '$450/yr', small: '$850/yr', established: '$1,400/yr', large: '$2,500+/yr' } },
    { name: 'Ongoing Advisory (Per Session, 60 min)', prices: { community: '$85', small: '$150', established: '$250', large: '$400+' } },
  ],
};
