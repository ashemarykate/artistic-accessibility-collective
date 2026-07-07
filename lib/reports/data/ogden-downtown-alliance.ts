import type { ReportData } from '../types';

export const ogdenDowntownAlliance: ReportData = {
  org: {
    name: 'Ogden Downtown Alliance',
    slug: 'ogden-downtown-alliance',
    abbreviation: 'ODA',
    location: 'Ogden, Utah',
    type: '501(c)(3) nonprofit',
    overview:
      'The Ogden Downtown Alliance functions as a 501(c)(3) nonprofit committed to increasing economic vitality and community vibrancy throughout Ogden\'s Central Business District. ODA supports local commerce through placemaking, destination marketing, and community events, describing itself as creating "a dynamic epicenter for arts, entertainment and cultural experiences in Ogden\'s downtown."',
    preparedDate: 'May 2026',
    assessmentDate: 'May 2026',
    coverPhoto: '/images/reports/ogden-cover.jpg',
  },

  events: [
    {
      name: 'Farmers Market Ogden',
      when: 'Saturdays May to Sept 2026, Downtown / Historic 25th',
      format: 'Outdoor. Weekly. 100+ vendors. Long duration.',
    },
    {
      name: 'Ogden Arts Festival',
      when: 'July 18 to 19, 2026, Ogden Union Station',
      format: '100+ artists. Live music. Literary/dance performers.',
    },
    {
      name: 'Harvest Moon Celebration',
      when: 'Sept 19, 2026, Historic 25th Street',
      format: 'Outdoor. Free. All-day. Live music. Beer garden.',
    },
    {
      name: 'Historic 25th Street Car Show',
      when: 'June 5, 2026, Historic 25th Street',
      format: 'Outdoor street event.',
    },
    {
      name: 'Dogden',
      when: 'TBD, Downtown',
      format: 'Dog-friendly community event.',
    },
  ],

  funders: [
    {
      name: 'National Endowment for the Arts (NEA)',
      note: 'ODA receives NEA sponsorship. NEA increasingly requires accessibility as a condition of funding, and access costs are eligible grant expenses.',
    },
    {
      name: 'Weber County RAMP',
      note: 'Recreation, Arts, Museums & Parks, publicly funded program. Publicly supported orgs may carry additional accessibility obligations.',
    },
    {
      name: 'Ogden City Arts',
      note: 'City arts funder. Utah ADA Center can provide free technical assistance for Ogden-area organizations.',
    },
    {
      name: 'Utah Arts & Museums (state)',
      note: 'State arts funding. State arts councils generally require accessibility provisions in grant guidelines.',
    },
  ],

  assessmentAreas: [
    {
      id: 1,
      title: 'Website & Digital Access',
      context:
        'Your website often serves as the first barrier or first welcome for disabled visitors.',
      status: 'gaps',
      statusLabel: 'Gaps',
      priority: 'HIGH',
      whatWeFound: [
        'Event pages use many images, most appear to lack descriptive alt text, meaning screen readers skip them or read unhelpful filenames',
        'No accessibility statement or access information page exists anywhere on the site',
        'The site is built on WordPress, many accessibility plugins and WCAG-friendly themes are available at low/no cost',
        'External registration links go to Zapplication, Google Forms, and GivePulse, the accessibility of these third-party forms is variable and untested',
        'The word "accessible" appears on the Arts Festival page to mean "welcoming to all ages", this risks misleading disabled visitors',
        'No phone or alternative booking process is advertised for people who cannot use the website',
      ],
      openQuestions: [
        'Has the site ever been tested with a screen reader (e.g., NVDA, VoiceOver)?',
        'Are the Zapplication and Google Forms application processes accessible to keyboard-only users?',
        'Is there a phone number or email someone can use if the website is inaccessible to them?',
        'What social media platforms does ODA use, and are images posted with alt text?',
      ],
      recommendations: [
        'Run the free WAVE tool (wave.webaim.org) on your homepage and each event page, fix all flagged errors first',
        'Add descriptive alt text to every image on the site',
        'Create a single "Accessibility" page covering: physical access info per event, how to request communication access, your access contact name/email/phone',
        'Install WP Accessibility or the free Accessibility Checker plugin on WordPress to catch ongoing issues',
        'Add an optional "access needs" field to any registration or application form',
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
        'Parking, pathways, restrooms: physical access requires intentional planning. For outdoor events, grass, gravel, and narrow vendor corridors can exclude wheelchair and mobility aid users entirely.',
      status: 'needs-info',
      statusLabel: 'Needs Info',
      priority: 'HIGH',
      whatWeFound: [
        'ODA provides transportation information (OGX express bus, Ogden Trolley, free parking), described as a genuine strength for attendees without cars',
        'No disability-specific access information is provided for any ODA event: no accessible entrance notes, accessible parking, accessible portable restrooms, or pathway surface info',
        'The Harvest Moon page mentions "complimentary bike valet" but no equivalent provision for mobility aid users',
        'No accessible seating, viewing areas, or rest areas are provided for any event',
      ],
      openQuestions: [
        'What is the ground surface at each event location? (Paved, gravel, grass, concrete?)',
        'Are there accessible portable restrooms at outdoor events? How many, and where?',
        'What is the accessible entrance location at Union Station for the Arts Festival?',
        'Are there accessible parking spaces near each event, clearly signed and reserved?',
        'Is vendor/artist booth layout reviewed for pathway width? (ADAAG recommends 36" minimum, 44" preferred)',
      ],
      recommendations: [
        'Create a brief "Access at [Event Name]" section on each event page: accessible entrance, accessible parking, surface type, accessible restrooms, rest areas',
        'Conduct a physical access walkthrough of each event site before setup using the ADA Checklist for Existing Facilities',
        'Designate and sign accessible portable restrooms at every outdoor event, place them on level, firm surfaces',
        'Add pathway width to your artist/vendor layout review, minimum 44" clear width for main corridors',
        'Consider a dedicated accessibility contact on-site at each major event',
      ],
      resources: [
        {
          name: 'ADA Checklist for Existing Facilities',
          url: 'https://adachecklist.org',
          description: 'Free self-evaluation tool',
        },
        {
          name: 'Utah ADA Center, Free Technical Assistance',
          url: 'https://utahadacenter.org',
          description: 'Free consultations for Utah-based organizations',
        },
        {
          name: 'ADA.gov, Accessible Outdoor Events',
          url: 'https://ada.gov/resources/outdoor-access',
          description: 'Federal guidance for outdoor event access',
        },
      ],
    },

    {
      id: 3,
      title: 'Communication Access',
      context:
        'ASL interpretation, CART captioning, assistive listening: this is the highest-gap area. Communication access means Deaf and hard of hearing people can fully participate in your event, not just physically attend.',
      status: 'not-found',
      statusLabel: 'Not Found',
      priority: 'HIGH',
      whatWeFound: [
        'No ASL interpretation, CART captioning, or other communication access is mentioned for any ODA event',
        'The Harvest Moon includes "live local music and dance performances throughout the day" with no communication access provisions',
        'The Arts Festival includes performers across literary, musical, and dance categories, spoken word creates specific communication access needs',
        'No assistive listening devices or FM loop systems are mentioned for any venue',
        'No contact process for requesting communication access accommodations is provided on the website',
        'NEA funding increasingly links to accessibility requirements, communication access for performing arts events is a core expectation',
      ],
      openQuestions: [
        'Have any Deaf or hard of hearing attendees ever requested ASL interpretation or CART at an ODA event?',
        'Does ODA have any existing relationship with ASL interpreters or CART providers in the Ogden/Salt Lake area?',
        'What is the budget available for communication access for the Arts Festival and Harvest Moon?',
        'Are there emceed or announced segments at any ODA events?',
      ],
      recommendations: [
        'Add a standard access request process to every event page: "To request ASL interpretation, CART captioning, or other communication access, contact [name] at [email] by [date]"',
        'For the Arts Festival, prioritize ASL interpretation for spoken word, poetry, and emceed segments, budget for at least one certified interpreter team',
        'Explore GalaPro, a smartphone captioning app used by performing arts venues, with free implementation for eligible organizations',
        'Add communication access costs as a line item in Arts Festival and Harvest Moon budgets, NEA can cover these as eligible grant expenses',
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
        'Quiet zones, sensory info, predictability, often low-cost, high-impact. Outdoor festivals with loud music and crowds are high-sensory environments, small interventions make a significant difference.',
      status: 'not-found',
      statusLabel: 'Not Found',
      priority: 'MEDIUM',
      whatWeFound: [
        'No sensory-friendly options, quiet areas, or sensory information are mentioned in any ODA event listings',
        'The Harvest Moon features "live local music and dance performances throughout the day", a high-sensory environment with no provisions noted',
        'No visual schedules, social stories, or event-preview materials are available for any event',
        'The NUHOPE Suicide Awareness Walk is held immediately before Harvest Moon, attendees may include people for whom a crowded, loud event immediately after could be difficult',
      ],
      openQuestions: [
        'Are there naturally quieter areas at Harvest Moon or Arts Festival that could be designated as rest areas?',
        'Does ODA currently monitor or manage noise levels at events?',
        'Has ODA had any feedback from attendees about sensory overwhelm?',
      ],
      recommendations: [
        'Designate a quiet/rest area at each major event, a tent, table, or shaded area set back from the main performance space',
        'Add a simple sensory guide to each event page: approximate decibel levels, types of sensory input, location of quiet area',
        'Create a one-page "what to expect" visual guide for the Arts Festival, downloadable before the event',
        'Brief volunteers on the quiet area location and how to direct people to it without calling attention to them',
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
        {
          name: 'Sensory Access Foundation',
          url: 'https://sensoryaccess.com',
          description: 'Consulting and resources for sensory-accessible events',
        },
      ],
    },

    {
      id: 5,
      title: 'Accessibility Statements & Documentation',
      context:
        'No access statement, no contact, no request process, priority gap. A public accessibility statement communicates what access you currently provide, what to do if you need something not listed, and who to contact.',
      status: 'not-found',
      statusLabel: 'Not Found',
      priority: 'HIGH',
      whatWeFound: [
        'No public accessibility statement exists on the ODA website or any event page',
        'No access contact person or email is identified anywhere on the site',
        'No process for requesting access accommodations is described for any event',
        'The Arts Festival artist application and performer application do not include accommodation request fields',
        "ODA's About page makes no mention of accessibility or access commitments",
      ],
      openQuestions: [
        'Is there a staff member or volunteer who currently handles accessibility-related requests, even informally?',
        'Has ODA received any formal or informal accommodation requests?',
        'Does ODA have any internal policies that touch on accessibility?',
        'Is ODA subject to any grant conditions that require an accessibility policy?',
      ],
      recommendations: [
        'Create a simple Accessibility page on your website, start with: "To request an accommodation for any ODA event, contact [name] at [email] at least [X] days before the event."',
        'Add an event-specific access section to each major event page: accessible entrance, parking, restrooms, surface type',
        'Add an access needs field to the artist and performer applications',
        'Designate one staff member as the access point of contact',
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
        "The most common access failure isn't a missing ramp, it's an unprepared volunteer. For ODA, with 100+ volunteers at major events, this is a high-leverage area, small training investment, large access impact.",
      status: 'needs-info',
      statusLabel: 'Needs Info',
      priority: 'MEDIUM',
      whatWeFound: [
        "No disability etiquette, accessibility, or access-related content was found in ODA's public volunteer materials",
        'No volunteer guide, handbook, or orientation was publicly accessible to review',
        'ODA appears to recruit volunteers primarily through online signup, no information about how access needs are accommodated for volunteers themselves',
      ],
      openQuestions: [
        'What does your current volunteer orientation or briefing look like?',
        'Have any volunteers received any disability awareness or etiquette training?',
        'Would you be open to a virtual training session for staff and/or volunteer leads before your next major event?',
      ],
      recommendations: [
        'Add a one-page "Accessibility at Our Events" card to volunteer orientation, covers: how to offer help without assuming, sighted guide basics, mobility aid etiquette',
        'Brief volunteer leads on accessible entrance location, accessible restroom location, and who the access contact person is',
        "Add an 'access needs' field to your volunteer signup process",
        'Build toward a Train-the-Trainer model where one staff member owns this year over year',
      ],
      resources: [
        {
          name: 'Disability Etiquette, United Spinal Association',
          url: 'https://unitedspinal.org/disability-etiquette',
          description: 'Best free introductory guide, print and share',
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
        'Disability-inclusive emergency planning is often overlooked until an incident occurs. Disabled people are disproportionately harmed in emergencies when evacuation plans do not account for people who use mobility aids, have visual or hearing impairments, or have conditions that affect response to heat, crowds, or sudden disruption.',
      status: 'needs-info',
      statusLabel: 'Needs Info',
      priority: 'MEDIUM',
      whatWeFound: [
        'No disability-specific emergency or evacuation information is publicly available for any ODA event',
        'The Harvest Moon takes place on a city street, street closures and temporary setups require specific accessible evacuation planning',
        'The Arts Festival runs for two full days in Ogden in July, heat-related illness planning is relevant and disproportionately affects people with certain disabilities',
        'No information about medical or first aid station accessibility was found',
      ],
      openQuestions: [
        'Does ODA have an emergency action plan for major events? Does it include disability-specific provisions?',
        'What is the evacuation procedure for the Arts Festival indoor areas?',
        'Is there a first aid station at major events? Is it in an accessible location?',
        'Does ODA coordinate with Ogden City emergency services for major events?',
      ],
      recommendations: [
        'Add a section on disability-inclusive evacuation to your event emergency action plan',
        'Brief your access contact and at least two volunteers on the disability-inclusive emergency protocol before each major event',
        'Post first aid station location on your event page, and ensure it is accessible',
        'Review your heat-related illness protocol for applicability to attendees with reduced heat tolerance',
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
        'Disabled artists and vendors are participants, not just attendees. Artist and vendor inclusion means ensuring that disabled people can participate in ODA events as creators, performers, and vendors, not just as audience members.',
      status: 'needs-info',
      statusLabel: 'Needs Info',
      priority: 'MEDIUM',
      whatWeFound: [
        'Artist applications go through Zapplication, no specific accommodation request process was found',
        'Performer applications go through Google Forms, no accommodation request field was found',
        'No information about accessible booth setup, load-in/load-out access, or accessible vendor spaces is provided',
        'No mention of accessible parking or loading access for participating artists/vendors',
      ],
      openQuestions: [
        'Do any current regular artists, vendors, or performers at ODA events have disabilities?',
        'Has ODA received any requests for accessible booth space or load-in accommodation?',
        'What is the booth size and surface type for artist/vendor spaces at the Arts Festival and Harvest Moon?',
      ],
      recommendations: [
        'Add an accommodation request field to both the Zapplication artist application and the Google Form performer application',
        'Identify and designate accessible vendor spaces, firm, level surface, close to accessible parking and restrooms',
        'Include accessible load-in/load-out logistics in artist communications',
        'Consider adding "adaptive arts practice" as a recognized approach in jury criteria',
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

  priorityPhases: [
    {
      phase: 'Do First',
      label: 'Before Your Next Major Event',
      actions: [
        'Answer the open questions in this document and return to us',
        'Add a basic access contact to each event page: "For access accommodations, contact [name] at [email]"',
        'Add an "access needs" field to the Arts Festival performer and artist applications',
        'Run WAVE (wave.webaim.org) on your event pages and fix all red-flagged errors',
        'Brief your event leads on: accessible entrance location, accessible restroom location, quiet area location, and who the access contact is',
      ],
    },
    {
      phase: '6-Month Goals',
      label: 'Before Harvest Moon (Sept 2026)',
      actions: [
        'Create an Accessibility page on your website, start with physical access info and the contact process',
        'Add alt text to all images on your event pages',
        'Research ASL interpretation costs for the Arts Festival, get at least two quotes',
        'Conduct a physical access walkthrough of the Harvest Moon footprint using the ADA Checklist',
        'Develop a one-page access card for volunteers to carry at Harvest Moon',
      ],
    },
    {
      phase: 'Ongoing',
      label: 'Building Access as Practice',
      actions: [
        'Train one staff member or lead volunteer as your in-house access champion',
        'Add communication access (ASL or CART) for at least one major Arts Festival performance by 2027',
        'Build an annual access review into your event debrief process',
        'Connect with the Utah ADA Center for free technical assistance and local guidance',
      ],
    },
  ],

  legalNotes: [
    {
      framework: 'ADA Title III',
      description:
        'ODA, as a public accommodation, is covered by ADA Title III. The 2024 DOJ rule establishes WCAG 2.1 AA as the web accessibility standard for covered entities. Physical access requirements for events are enforceable under Title III.',
      action:
        'Ensure events held in accessible facilities remain accessible in practice, including temporary setups (vendor booths, stages, tents).',
    },
    {
      framework: 'National Endowment for the Arts (NEA)',
      description:
        'NEA-funded organizations are required to comply with Section 504 of the Rehabilitation Act, which parallels the ADA. NEA increasingly requires accessibility planning as a grant condition and permits access costs as eligible grant expenses.',
      action:
        'Document access efforts in your NEA reports, this demonstrates compliance and strengthens future applications.',
    },
    {
      framework: 'Weber County RAMP',
      description:
        "RAMP (Recreation, Arts, Museums and Parks) is a publicly-funded program. Organizations receiving public funds may have obligations under Utah's own nondiscrimination framework in addition to federal ADA requirements.",
      action: 'Review your RAMP grant agreement for any specific accessibility provisions.',
    },
    {
      framework: 'Utah ADA Center',
      description:
        'The Utah ADA Center provides free technical assistance to Utah-based organizations, guidance on ADA compliance, free training, and consultation at no cost to ODA.',
      action:
        'Free resource: utahadacenter.org, highly recommended first call for ADA questions specific to Utah.',
    },
  ],

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
        { name: 'Utah ADA Center, Free Technical Assistance', url: 'https://utahadacenter.org', description: 'Free consultations for Utah orgs' },
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
