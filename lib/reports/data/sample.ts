/**
 * SAMPLE REPORT — Harborlight Arts Festival (fictional)
 * ─────────────────────────────────────────────────────
 * This is the demonstration report: a fully written example of the assessment
 * voice and structure, using a placeholder org so nothing here describes a
 * real client. Preview at /reports/sample.
 *
 * It doubles as the working style guide for writing real reports:
 *   - Plain language. No jargon without a translation in the same sentence.
 *   - Warm, never scolding. Findings name what IS working first when true.
 *   - No em dashes or en dashes anywhere (site-wide copy rule).
 *   - Every resource is free, real, and ideally disabled-made.
 *   - Status labels: Working well / Gaps to close / Not found yet / Tell us more.
 */

import type { ReportData } from '../types';

export const sampleReport: ReportData = {
  org: {
    name: 'Harborlight Arts Festival',
    slug: 'sample',
    abbreviation: 'Harborlight',
    location: 'Anywhere, USA',
    type: 'Community arts nonprofit',
    overview:
      'Harborlight Arts Festival is a volunteer-powered community arts nonprofit that produces a two-day summer arts festival on the waterfront, a winter makers market, and free drop-in youth art workshops through the school year. Harborlight describes itself as "art for every neighbor," and admission to everything it runs is free. (Harborlight is a fictional organization. This sample shows what your report will look like.)',
    preparedDate: 'July 2026',
    assessmentDate: 'July 2026',
  },

  // ── Events ─────────────────────────────────────────────────────────────────
  events: [
    {
      name: 'Harborlight Summer Festival',
      when: 'Two days each July, Waterfront Park',
      format: 'Outdoor. 90+ artist booths, two stages, food vendors. Free admission.',
    },
    {
      name: 'Winter Makers Market',
      when: 'First weekend of December, Grange Hall',
      format: 'Indoor, two floors. 40 vendors, live music, all ages.',
    },
    {
      name: 'Youth Open Studios',
      when: 'Saturdays, September to May',
      format: 'Indoor. Free drop-in art making for kids and teens.',
    },
  ],

  // ── Funders & Partners ─────────────────────────────────────────────────────
  funders: [
    {
      name: 'National Endowment for the Arts',
      note: 'Federal money carries Section 504 obligations: access is a grant condition, not a suggestion. The NEA asks about it at application and again at final report.',
    },
    {
      name: 'State Arts Commission',
      note: 'State arts agencies pass through federal funds, which extends those same 504 obligations. Many also offer free access planning help, so this funder is a resource too.',
    },
    {
      name: 'Local Community Foundation',
      note: 'No formal access mandate, but foundations increasingly ask about inclusion in reports. Documented access work strengthens every application you send them.',
    },
  ],

  // ── Assessment Areas ───────────────────────────────────────────────────────
  assessmentAreas: [
    {
      id: 1,
      title: 'Website & Digital Access',
      context:
        'Your website is the first thing most disabled visitors meet. It is either the first welcome or the first barrier, and it decides who even finds out your events exist.',
      status: 'gaps',
      statusLabel: 'Gaps to close',
      priority: 'HIGH',
      whatWeFound: [
        'The site is clean and mobile friendly, and headings are used consistently. That is a real foundation, and it matters.',
        'Most event photos have no alt text, so a screen reader user gets filenames instead of information.',
        'The festival map is a single image with no text alternative. Everything it communicates (stages, restrooms, booths) is invisible to blind visitors.',
        'Text contrast on the schedule page falls below WCAG minimums in several places: light gray text on white.',
      ],
      openQuestions: [
        'Who updates the website, and do they have the access needed to add alt text as part of the normal posting routine?',
        'Is the site on a platform like Squarespace or WordPress, where most fixes are settings, or is it custom code?',
      ],
      recommendations: [
        'Add alt text to event photos as they are posted. Describe what matters: "dancers in red costumes mid-leap on the waterfront stage" beats "IMG_4032".',
        'Publish the festival map\'s information as a plain text list too: stage names, booth sections, restrooms, quiet area, first aid.',
        'Run the free WAVE checker on your five most visited pages and fix what it flags. Most of these fixes take minutes, not days.',
      ],
      resources: [
        { name: 'WAVE, Web Accessibility Evaluation Tool', url: 'https://wave.webaim.org', description: 'Free browser-based checker' },
        { name: 'WebAIM, Web Accessibility In Mind', url: 'https://webaim.org', description: 'The best free practical web accessibility resource' },
        { name: 'The A11y Project', url: 'https://a11yproject.com', description: 'Practical patterns, checklists, and articles' },
        { name: 'Alt Text as Poetry', url: 'https://alt-text-as-poetry.net', description: 'A disabled-made workbook that turns alt text into craft' },
      ],
    },

    {
      id: 2,
      title: 'Physical & Venue Access',
      context:
        'Parking, pathways, surfaces, restrooms: physical access is decided in the planning stage, and for outdoor events the ground itself determines who can attend.',
      status: 'needs-info',
      statusLabel: 'Tell us more',
      priority: 'HIGH',
      whatWeFound: [
        'Event pages name the venues but say nothing about parking, surfaces, seating, or restrooms, so a disabled visitor cannot plan a visit from the information you publish.',
        'Public photos suggest Waterfront Park has paved paths on its north side, but we cannot tell whether booths and stage viewing areas sit on pavement or grass.',
      ],
      openQuestions: [
        'What surface do artist booths and stage viewing areas actually sit on: pavement, packed gravel, or grass?',
        'Are there accessible restrooms (or an accessible portable unit) at both venues, and how far are they from the center of activity?',
        'Is there designated accessible parking, and is the route from it to the entrance step free?',
      ],
      recommendations: [
        'Walk each venue with the free ADA checklist and a tape measure before the next event. An hour of walking answers most of these questions for good.',
        'If parts of the festival sit on grass, rent portable ground mats to create at least one firm route through every section.',
        'Publish what you learn, including the imperfect parts. "The east lawn is grass and can be soft after rain" is genuinely useful information, not an admission of failure.',
      ],
      resources: [
        { name: 'ADA Checklist for Existing Facilities', url: 'https://adachecklist.org', description: 'Free self-evaluation tool, print and walk' },
        { name: 'ADA.gov, Accessible Outdoor Events', url: 'https://ada.gov', description: 'Federal guidance for outdoor event access' },
      ],
    },

    {
      id: 3,
      title: 'Communication Access',
      context:
        'ASL interpretation, live captioning, assistive listening: communication access means Deaf and hard of hearing people can actually participate, not just be present. This is the highest-gap area for most arts organizations, so you are in common company. It is also very fixable.',
      status: 'not-found',
      statusLabel: 'Not found yet',
      priority: 'HIGH',
      whatWeFound: [
        'We found no mention of ASL interpretation, captioning, or assistive listening anywhere in Harborlight\'s public materials.',
        'Stage announcements and performances currently have no visual or text channel at all.',
      ],
      openQuestions: [
        'Has anyone ever requested an interpreter or captions? If the answer is no, that usually means the offer is not visible, not that the need is not there.',
        'Do your stages run through a soundboard? That is the connection point for assistive listening and remote captioning.',
      ],
      recommendations: [
        'Add one line to every event page: "Need an interpreter, captions, or another access service? Email us by [date] and we will arrange it." Then build the muscle to deliver on it.',
        'For anything longer than about 45 minutes, plan on two interpreters working in shifts. Book certified interpreters early and brief them with scripts and set lists a week or two ahead.',
        'Remote CART (live professional captioning, displayed on a monitor or on phones) is often the affordable starting point for panels, readings, and spoken word.',
      ],
      resources: [
        { name: 'Registry of Interpreters for the Deaf', url: 'https://rid.org', description: 'Find certified ASL interpreters near you' },
        { name: 'CART Captioning Providers Directory', url: 'https://actscart.com', description: 'Remote and in-person CART providers' },
        { name: 'Assistive Listening Guide (HLAA)', url: 'https://hearingloss.org', description: 'FM, infrared, and induction loop systems, explained' },
      ],
    },

    {
      id: 4,
      title: 'Sensory & Neurodivergent Access',
      context:
        'Quiet zones, sensory information, predictability: usually the lowest-cost, highest-warmth work on this list. Small moves here matter to autistic attendees, people with PTSD or anxiety, and honestly to overwhelmed parents too.',
      status: 'not-found',
      statusLabel: 'Not found yet',
      priority: 'MEDIUM',
      whatWeFound: [
        'No sensory information is published for any event: nothing about crowds, sound levels, or where to take a break.',
      ],
      openQuestions: [
        'Is there a naturally quieter corner of Waterfront Park that could be designated as a rest area without moving anything else?',
      ],
      recommendations: [
        'Publish a one-paragraph sensory note for each event: expected crowd size, sound levels, whether there is amplified music or strobe lighting, and where the quiet spots are.',
        'Designate a quiet zone with seating and shade. A tent, a few chairs, and a sign is a complete version one. It does not need to be fancy to be real.',
        'Youth Open Studios is a natural place to pilot a sensory-friendly hour: lower lights, smaller group, materials set out in advance.',
      ],
      resources: [
        { name: 'Sensory-Friendly Events Guide', url: 'https://autismspeaks.org/sensory-friendly-guide', description: 'Practical toolkit for event planners' },
        { name: 'IBCCES Sensory Inclusion Resources', url: 'https://ibcces.org/sensory-inclusive', description: 'Training and certification for sensory-inclusive events' },
      ],
    },

    {
      id: 5,
      title: 'Access Information & Contact',
      context:
        'A public access page tells disabled people what to expect, who to ask, and what to do when a need is not listed. Its absence is itself a message, and it is the single fastest thing on this list to fix.',
      status: 'not-found',
      statusLabel: 'Not found yet',
      priority: 'HIGH',
      whatWeFound: [
        'There is no accessibility page or statement anywhere on the site, and no named access contact on any event page.',
      ],
      openQuestions: [
        'Who answers today when someone emails an access question, even informally? That person is your access contact; they just are not named yet.',
      ],
      recommendations: [
        'Publish a plain-language access page this month, even a short one. Say what exists, what does not exist yet, and who to contact. Honesty beats polish, and disabled visitors can tell the difference.',
        'Put the access contact in the footer of every event page, not just on the access page itself.',
      ],
      resources: [
        { name: 'NEA Accessibility Planning Resources', url: 'https://arts.gov/grants/apply-grant/accessibility', description: 'What your federal funder expects, in one place' },
        { name: 'ADA.gov, Reasonable Modifications', url: 'https://ada.gov/topics/reasonable-modifications', description: 'What "reasonable accommodation" means in practice' },
      ],
    },

    {
      id: 6,
      title: 'Staff & Volunteer Training',
      context:
        'The most common access failure is not a missing ramp. It is a well-meaning volunteer who panics and guesses. Training is high leverage, low cost, and it makes volunteers feel more confident too.',
      status: 'needs-info',
      statusLabel: 'Tell us more',
      priority: 'MEDIUM',
      whatWeFound: [
        'Volunteer sign-up is public and welcoming, but nothing published tells us what orientation covers.',
      ],
      openQuestions: [
        'What does volunteer orientation look like today, and how long does it run?',
      ],
      recommendations: [
        'Fold 15 minutes of disability etiquette into the orientation you already run. The free United Spinal guide covers the essentials: ask before helping, speak directly to the person, never touch someone\'s mobility equipment.',
        'Give every volunteer one sentence to memorize: "I don\'t know, but I\'ll find out right now," plus the name of who to radio. That sentence is most of the job.',
      ],
      resources: [
        { name: 'Disability Etiquette, United Spinal Association', url: 'https://unitedspinal.org/disability-etiquette', description: 'The best free introductory guide, print and share' },
        { name: 'ADA National Network, Free Training', url: 'https://adata.org/training', description: 'Free webinars and courses on ADA and disability inclusion' },
      ],
    },

    {
      id: 7,
      title: 'Emergency Procedures',
      context:
        'Disability-inclusive emergency planning is a legal requirement in most places and one of the most commonly skipped parts of event safety. It only works if it is planned before anyone needs it.',
      status: 'needs-info',
      statusLabel: 'Tell us more',
      priority: 'MEDIUM',
      whatWeFound: [
        'No public safety information mentions disabled attendees. That is typical, and it is worth being the org that changes it.',
      ],
      openQuestions: [
        'Does the festival safety plan cover how a Deaf attendee learns about an evacuation, or how a wheelchair user exits the Grange Hall\'s upper floor?',
      ],
      recommendations: [
        'Add disability-specific lines to the safety plan you already have: visual alerts to accompany any audio announcement, a staffed evacuation role, and a meeting point that sits on an accessible route.',
        'Brief stage managers that every emergency announcement gets repeated visually: on screens, on signage, or by a staffer holding a printed card. Decide which before the event, not during.',
      ],
      resources: [
        { name: 'Ready.gov, Access & Functional Needs', url: 'https://ready.gov/individuals-access-functional-needs', description: 'Federal guidance on disability-inclusive emergency planning' },
        { name: 'Emergency Planning Toolkit (ADA National Network)', url: 'https://adata.org/emergency-planning', description: 'Free, practical, event-ready toolkit' },
      ],
    },

    {
      id: 8,
      title: 'Artist & Vendor Inclusion',
      context:
        'Disabled artists and vendors are participants, not just audience. Applications, booth assignments, and load-in all have access dimensions, and disabled makers notice which festivals thought about them.',
      status: 'gaps',
      statusLabel: 'Gaps to close',
      priority: 'MEDIUM',
      whatWeFound: [
        'The artist application form includes images without descriptions, and it never asks applicants about access needs.',
        'Booth assignment information says nothing about accessible load-in options or booth placement requests.',
      ],
      openQuestions: [
        'Has a vendor or performer ever asked for an accessible booth spot or extra load-in help, even informally?',
      ],
      recommendations: [
        'Add one question to the application: "Do you have access needs we should plan for? We ask everyone." That last sentence matters; it makes answering feel normal instead of risky.',
        'Reserve two booth spots nearest accessible parking for vendors who need them, and say so right in the application.',
        'When you book performers, ask for their access rider the same way you ask for their tech rider. Disabled artists who have one will notice; artists who do not will learn they can have one.',
      ],
      resources: [
        { name: 'How to Create an Access Rider (Graeae)', url: 'https://graeae.org/resource/how-to-create-an-access-rider/', description: 'The disabled-led theater company\'s free guide' },
        { name: 'Disability Arts Online', url: 'https://disabilityarts.online', description: 'Platform and community for disabled artists' },
      ],
    },
  ],

  // ── Priority Action Plan ───────────────────────────────────────────────────
  priorityPhases: [
    {
      phase: 'Start Here',
      label: 'Before the Summer Festival',
      actions: [
        'Answer the "questions for you" in this document and send them back. That is the entire first step, and it is free.',
        'Publish a short, honest access page with a named contact person.',
        'Add the access request line to every event page.',
        'Walk Waterfront Park with the ADA checklist and a tape measure.',
      ],
    },
    {
      phase: 'This Season',
      label: 'Build The Muscle',
      actions: [
        'Run WAVE on your five most visited pages and clear what it flags.',
        'Make alt text part of the posting routine, and backfill the festival map with a text version.',
        'Pilot a quiet zone and a published sensory note at one event.',
        'Fold 15 minutes of disability etiquette into volunteer orientation.',
      ],
    },
    {
      phase: 'Ongoing',
      label: 'Make It Practice, Not Project',
      actions: [
        'Name one person as access lead, and put access on the debrief agenda after every event.',
        'Budget access into events from the first draft. A working benchmark is 8 to 12 percent of production budget, planned, not scrambled.',
        'Book interpreters and captioning for headline events by default instead of waiting for requests.',
        'Hire and pay disabled artists, vendors, and consultants. Access work is better when disabled people lead it.',
      ],
    },
  ],

  // ── Legal & Funder Notes ───────────────────────────────────────────────────
  legalNotes: [
    {
      framework: 'ADA Title III',
      description:
        'As a public accommodation, Harborlight is covered by ADA Title III whether an event is ticketed or free. The Department of Justice points to WCAG 2.1 AA as the web accessibility standard, and physical access requirements apply to temporary setups too: booths, stages, and tents, not just buildings.',
      action:
        'Treat every temporary layout decision (booth spacing, cable covers, viewing areas) as an ADA decision, because legally it is one.',
    },
    {
      framework: 'Section 504 (federal funding)',
      description:
        'Any organization that takes federal money, including NEA funds passed through a state arts agency, takes on Section 504 obligations: programs must be accessible to disabled people. Funders ask about this at application and at final report.',
      action:
        'Keep simple records of access work as you go (photos, checklists, the access page) so grant reporting becomes a copy and paste instead of a scramble.',
    },
    {
      framework: 'Effective Communication (ADA)',
      description:
        'The ADA requires "effective communication": interpreters, captioning, or other aids when they are needed for real participation. The obligation starts before anyone asks, because the offer has to be findable for a request to happen at all.',
      action:
        'The access request line on every event page is the legal groundwork. Delivering when someone takes you up on it is the practice.',
    },
  ],

  // ── Key Resources at a Glance ─────────────────────────────────────────────
  keyResources: [
    {
      category: 'Digital & Web Accessibility',
      items: [
        { name: 'WAVE Web Accessibility Evaluator', url: 'https://wave.webaim.org', description: 'Free browser-based checker' },
        { name: 'WebAIM, Web Accessibility In Mind', url: 'https://webaim.org', description: 'Practical web accessibility resource' },
        { name: 'Alt Text as Poetry', url: 'https://alt-text-as-poetry.net', description: 'Disabled-made alt text workbook' },
        { name: 'W3C WAI, WCAG Standards', url: 'https://w3.org/WAI', description: 'The authoritative source for WCAG' },
      ],
    },
    {
      category: 'Physical Access & Venues',
      items: [
        { name: 'ADA Checklist for Existing Facilities', url: 'https://adachecklist.org', description: 'Free self-evaluation tool' },
        { name: 'The Printer, AAC Print Room', url: 'https://artisticaccessibility.com/printer', description: 'Printable checklists, posters, and guides' },
        { name: 'ADA.gov, Accessible Outdoor Events', url: 'https://ada.gov', description: 'Federal guidance for outdoor access' },
      ],
    },
    {
      category: 'Communication Access',
      items: [
        { name: 'Registry of Interpreters for the Deaf', url: 'https://rid.org', description: 'Find certified ASL interpreters' },
        { name: 'CART Providers Directory', url: 'https://actscart.com', description: 'Remote and in-person live captioning' },
        { name: 'Hearing Loss Association, Assistive Listening', url: 'https://hearingloss.org', description: 'FM, infrared, and loop systems' },
      ],
    },
    {
      category: 'Training & Culture',
      items: [
        { name: 'Disability Etiquette, United Spinal', url: 'https://unitedspinal.org/disability-etiquette', description: 'Best free introductory guide' },
        { name: 'ADA National Network, Free Training', url: 'https://adata.org/training', description: 'Free webinars and ADA courses' },
        { name: 'How to Create an Access Rider (Graeae)', url: 'https://graeae.org/resource/how-to-create-an-access-rider/', description: 'For the artists you book' },
      ],
    },
    {
      category: 'Law & Funding',
      items: [
        { name: 'ADA.gov, Official Federal Guidance', url: 'https://ada.gov', description: 'The official ADA resource' },
        { name: 'NEA Accessibility Planning', url: 'https://arts.gov/grants/apply-grant/accessibility', description: 'What your federal funder expects' },
        { name: 'Disability Rights Advocates', url: 'https://dralegal.org', description: 'Legal resources and advocacy' },
      ],
    },
  ],

  // ── Services & Pricing (universal table, same for every org) ───────────────
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
