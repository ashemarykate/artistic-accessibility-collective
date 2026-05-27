// Shared resource data — imported by both /app/resources/page.tsx and /app/members/page.tsx.
// The `url` field doubles as the stable slug used in the resource_favorites table.
//
// ORGANIZATION: By practitioner use-case — what are you actually trying to do?
// Resources that are specific to a jurisdiction or physical location are marked
// with the `location` field and shown with a 📍 badge in the UI.

export type ResourceType = 'standard' | 'tool' | 'guide' | 'org' | 'media' | 'course';

export type Resource = {
  name: string;
  url: string;
  description: string;
  type: ResourceType;
  tags?: string[];
  /** Physical location required or jurisdiction-specific — shown as a 📍 badge in the UI */
  location?: string;
};

export type Category = {
  id: string;
  title: string;
  emoji: string;
  description: string;
  resources: Resource[];
};

export const CATEGORIES: Category[] = [

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. LAW & POLICY
  // "What am I legally required to do, and under which law?"
  // Standards, compliance frameworks, and jurisdictional guidance.
  // Resources marked with location are jurisdiction-specific.
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'law-policy',
    title: 'Law & Policy',
    emoji: '📋',
    description: 'Legal frameworks, compliance standards, and policy — what you\'re required to do and under which law. Jurisdiction-specific resources are marked. Start here if you\'re navigating grant requirements or legal obligations.',
    resources: [

      { name: 'UN Convention on the Rights of Persons with Disabilities (CRPD)', url: 'https://www.un.org/disabilities/documents/convention/convoptprot-e.pdf', description: 'The foundational international disability rights instrument — entered into force 2008, 190 states parties. Article 30 explicitly requires access to cultural life including theater, film, and museums. Free PDF.', type: 'standard', tags: ['FREE', 'Open Access'] },

      { name: 'W3C Web Accessibility Initiative (WAI)', url: 'https://www.w3.org/WAI', description: 'The authoritative free source for WCAG — the global de facto standard for digital accessibility. Includes WCAG 2.1 and 2.2 specifications, Understanding documents, and tutorials. Referenced in law in the US, EU, UK, Canada, and Australia.', type: 'standard', tags: ['FREE', 'Open Access'] },

      { name: 'ADA.gov', url: 'https://www.ada.gov', description: 'The authoritative free source for all Americans with Disabilities Act guidance. Focus on Title III (public accommodations — most relevant to arts venues). Includes DOJ web accessibility guidance and the 2024 final rule requiring WCAG 2.1 AA for state and local government websites.', type: 'standard', tags: ['FREE'], location: 'United States' },

      { name: 'ADA National Network', url: 'https://adata.org', description: 'Ten regional centers (one per US region) offering free ADA training, webinars, detailed guides, and a live helpline: 1-800-949-4232. The most accessible entry point for arts organizations trying to understand their ADA obligations.', type: 'org', tags: ['FREE'], location: 'United States' },

      { name: 'W3C WCAG — US Legal Context', url: 'https://www.w3.org/WAI/standards-guidelines/wcag', description: 'WCAG 2.1 is the current US legal standard for web accessibility (confirmed by DOJ in 2022 for Title II and III entities). WCAG 2.2 (October 2023) is current best practice. Free and authoritative — this is what you cite for US legal compliance.', type: 'standard', tags: ['FREE', 'Open Access'], location: 'United States' },

      { name: 'FCC — Closed Captioning on Television', url: 'https://www.fcc.gov/consumers/guides/closed-captioning-television', description: 'FCC guide to captioning requirements under the CVAA and the four FCC quality standards: accuracy, synchrony, completeness, and placement. Essential background for film, broadcast, and streaming accessibility work in the US.', type: 'standard', tags: ['FREE'], location: 'United States' },

      { name: 'National Endowment for the Arts — Accessibility', url: 'https://www.arts.gov/impact/accessibility', description: 'Free policy guidance, case studies, and vetted resource links for US arts organizations. Accessibility is increasingly required in NEA grant criteria — this is the place to understand what NEA expects and what they fund. Includes accessible event planning guides and ADA compliance resources.', type: 'org', tags: ['FREE'], location: 'United States' },

      { name: 'UK Equality Act 2010 Guidance', url: 'https://www.gov.uk/guidance/equality-act-2010-guidance', description: 'Free government guidance on the Equality Act 2010 — the UK\'s single national disability rights law. Key feature: an "anticipatory duty" requires arts organizations to proactively plan for disabled access before an individual asks. Stronger model than the US ADA\'s reactive approach.', type: 'standard', tags: ['FREE'], location: 'United Kingdom' },

      { name: 'Accessible Canada Act — Resources', url: 'https://accessible.canada.ca', description: 'Free resources on the Accessible Canada Act (2019) — Canada\'s federal accessibility legislation covering broadcasting, telecommunications, banking, and federal government. The foundation for federal arts organizations and broadcasters in Canada.', type: 'standard', tags: ['FREE'], location: 'Canada' },

      { name: 'ADA Checklist for Existing Facilities', url: 'https://adachecklist.org/checklist', description: 'Free, printable ADA compliance checklist for existing buildings — covers parking, entrances, restrooms, seating, and signage. Developed by the New England ADA Center. The most practical starting point for any arts venue doing a self-assessment of physical access before bringing in a consultant.', type: 'guide', tags: ['FREE'], location: 'United States' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. CAPTIONING
  // "How do I add captions to this video / event / film?"
  // Standards, tools, and guides for creating and delivering captions.
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'captioning',
    title: 'Captioning',
    emoji: '💬',
    description: 'Creating, evaluating, and delivering captions — quality standards, editing tools, and guides for video, streaming, live events, and broadcast. Covers both closed captions and open/expressive approaches.',
    resources: [

      { name: 'Caption with Intention', url: 'https://captionwithintention.org', description: 'The defining open-source resource on expressive/creative captioning — developed with the Deaf community, recipient of the Academy Award of Merit. Explores style, color, animation, and personality in captions beyond compliance defaults. Free and globally applicable.', type: 'standard', tags: ['FREE', 'Open Access', 'Deaf-Centered'] },

      { name: 'DCMP Captioning Key', url: 'https://dcmp.org/learn/captioningkey', description: 'The most detailed and widely-used quality standard for captions in educational media — broadly applied across the industry. Covers accuracy, placement, speaker identification, and sound effects. The US captioner\'s go-to reference.', type: 'standard', tags: ['FREE'], location: 'United States' },

      { name: 'Netflix Timed Text Style Guide', url: 'https://partnerhelp.netflixstudios.com/hc/en-us/articles/215758617', description: 'Publicly available guide required for all Netflix content. A detailed, practical industry reference for anyone producing captions — even for non-Netflix projects. Free to read.', type: 'standard', tags: ['FREE'] },

      { name: '3Play Media Learning Center', url: 'https://www.3playmedia.com/learn', description: 'Extensive free guides on captioning standards, CVAA requirements, platform specifications, and quality. One of the most regularly updated US resources for captioning practitioners.', type: 'guide', tags: ['FREE'] },

      { name: 'WebAIM — Captioning Resources', url: 'https://webaim.org/techniques/captions/', description: 'Practical guidance from Utah State University\'s WebAIM on captioning for web and media: evaluating quality, working with caption files, and platform best practices.', type: 'guide', tags: ['FREE'] },

      { name: 'ACL — Making Captioning Easy', url: 'https://acl.gov/ada/making-captioning-easy', description: 'Administration for Community Living guide to basics of captioning for events, meetings, and media — includes tool comparisons and practical how-to guidance. Good for organizations just getting started.', type: 'guide', tags: ['FREE'], location: 'United States' },

      { name: 'Subtitle Edit', url: 'https://www.nikse.dk/subtitleedit', description: 'Free, open-source caption and subtitle editing software with Whisper AI integration. Works on Windows (and Mac via Wine/Mono). Widely used by independent filmmakers, festivals, and small organizations for creating and editing caption files.', type: 'tool', tags: ['FREE', 'Open Access'] },

      { name: 'Amara', url: 'https://amara.org', description: 'Free online captioning and subtitling platform supporting collaborative caption workflows. Popular with nonprofits, educators, and independent filmmakers who need to create or crowdsource captions without a large budget.', type: 'tool', tags: ['FREE'] },

      { name: 'SUBTXT Creative — Expressive Captions Research', url: 'https://www.subtxt.co.uk', description: 'UK-based research and creative practice on expressive captioning — the approach of encoding acoustic information (whispering, shouting, music, tone) through caption style rather than just text. University of Sheffield research base. Companion to Caption with Intention.', type: 'org', tags: ['FREE'], location: 'United Kingdom' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. AUDIO DESCRIPTION
  // "How do I add audio description to this film / performance / exhibition?"
  // Standards, training, tools, and model organizations for AD.
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'audio-description',
    title: 'Audio Description',
    emoji: '🔊',
    description: 'Creating and delivering audio description for film, video, theater, live dance, and visual art — international standards, training resources, tools, and the organizations that set the field\'s practice.',
    resources: [

      { name: 'ADLAB International Guidelines for Audio Description', url: 'https://www.adlabproject.eu/Docs/adlab%20book/', description: 'EU-funded international reference for audio description standards — covers theory, methodology, and practical guidelines across media formats. The most comprehensive AD guide available.', type: 'standard', tags: ['FREE', 'Open Access'] },

      { name: 'Audio Description Coalition — Quality Standards', url: 'https://audiodescriptioncoalition.org', description: 'Widely referenced international standards document covering best practices for audio description in film, television, and theater. Used as a baseline across many countries.', type: 'standard', tags: ['FREE'] },

      { name: 'DCMP Audio Description Tip Sheet', url: 'https://dcmp.org/learn/227-audio-description-tip-sheet', description: 'One-page guide from the federally-funded Described and Captioned Media Program covering core AD principles: objective language, present tense, visual identity description. A perfect starting handout for workshops.', type: 'guide', tags: ['FREE'], location: 'United States' },

      { name: 'DCMP Style Manual', url: 'https://dcmp.org', description: 'Comprehensive federally-funded style guide for captioning and audio description in educational media. Covers AD script writing, voice talent, and quality review. The most widely referenced US AD standard for educational content.', type: 'standard', tags: ['FREE'], location: 'United States' },

      { name: 'DCMP Professional Development Courses', url: 'https://dcmp.org/learn', description: 'Free federally-funded courses on accessible media in the classroom, educational interpreting, captioning, and video description. No admission requirements, no cost. Among the most accessible AD training available in the US.', type: 'course', tags: ['FREE'], location: 'United States' },

      { name: 'ACB Audio Description Project — Education Resources', url: 'https://adp.acb.org/education.html', description: 'American Council of the Blind training resources, educational guides, and a four-course series in inclusive media. Scholarships available. Core US professional development resource for AD.', type: 'course', tags: ['FREE'], location: 'United States' },

      { name: 'Audio Description for Beginners — Free Course', url: 'https://www.closedcaptioncreator.com/videos/courses/audio-description-for-beginners/', description: 'Introductory free online course: what audio description is, why it matters, and basic script writing principles. A good first step for practitioners new to the field.', type: 'course', tags: ['FREE'] },

      { name: 'Think Outside the Vox — Education', url: 'https://thinkoutsidethevox.org/education', description: 'Free audio description workshops for live events — with a focus on live theater and community performance contexts. Sponsored by the Haymarket People\'s Fund. Accessible entry point for small organizations and community practitioners.', type: 'course', tags: ['FREE'], location: 'United States' },

      { name: 'American Council of the Blind — Audio Description Project', url: 'https://adp.acb.org', description: 'The most important US organization for audio description. Maintains AD quality standards, a database of AD-accessible venues and media nationwide, and training resources. The place to start for US AD advocacy and standards.', type: 'org', tags: ['FREE'], location: 'United States' },

      { name: 'GBH Media Access Group', url: 'https://www.wgbh.org/foundation/media-access', description: 'Created the first broadcast audio description in the US (Described Video Service). Now a leader in captioning and AD research and advocacy. The institutional origin of much US accessibility infrastructure.', type: 'org', tags: ['FREE'], location: 'United States' },

      { name: 'Art Beyond Sight', url: 'https://www.artbeyondsight.org', description: 'US-based organization focused on making visual art, museum collections, and gallery experiences accessible to blind and low-vision audiences through verbal description. Resources, research, and training.', type: 'org', tags: ['FREE'], location: 'United States' },

      { name: 'YouDescribe', url: 'https://youdescribe.org', description: 'Free tool enabling anyone to record audio descriptions for YouTube videos. Community-created descriptions are stored and playable alongside videos — expanding the universe of described content beyond what professional AD services cover.', type: 'tool', tags: ['FREE'] },

      { name: 'Kinetic Light — Audimance', url: 'https://kineticlight.org/audimance', description: 'Multi-track, audience-choice audio description for live dance performance — a landmark in creative access. Kinetic Light\'s app lets audience members choose among multiple AD tracks for the same show, with different voices, styles, and perspectives. Freely documented and open source.', type: 'org', tags: ['FREE', 'Disabled Voice', 'Open Access'] },

      { name: 'VocalEye — Live Performance Audio Description', url: 'https://vocaleye.ca', description: 'Canada\'s leading organization for live performance audio description. Offers freely available guidelines for live theater AD, describer training resources, and guidance for dance and experimental performance. Among the best published live AD resources in the English-speaking world.', type: 'org', tags: ['FREE'], location: 'Canada' },

      { name: 'VocalEyes (UK)', url: 'https://vocaleyes.co.uk', description: 'The UK\'s leading audio description organization for live arts — visual arts, heritage, and live performance. Distinct from VocalEye Canada: VocalEyes UK provides audio description at major UK galleries, museums, and performing arts venues, and offers the most comprehensive free training guidance for live performance AD in the UK context. Operates under the Equality Act 2010\'s anticipatory duty. Essential for any UK practitioner or organization.', type: 'org', tags: ['FREE'], location: 'United Kingdom' },

      { name: 'RNIB — Audio Description Resources', url: 'https://www.rnib.org.uk', description: 'Royal National Institute of Blind People. UK standards and advocacy for AD in theater, film, and broadcasting. Produces guidance documents for venues and broadcasters, and advocates for AD quality and availability under the Equality Act.', type: 'org', tags: ['FREE'], location: 'United Kingdom' },

      { name: 'Audio Description Association UK (ADUK)', url: 'https://adassociation.org.uk', description: 'UK training and standards body for live theater audio description. Guides for describers and theater producers on commissioning and delivering quality live AD — including the specific requirements of the Equality Act 2010.', type: 'org', tags: ['FREE'], location: 'United Kingdom' },

      { name: 'Access2Arts', url: 'https://access2arts.org.au', description: 'Adelaide-based Australian organization offering the country\'s most developed professional training in audio description and captioning for the arts. Their 12-week AD course is a leading professional training program in the Asia-Pacific region. Free introductory resources available.', type: 'org', tags: ['FREE'], location: 'Adelaide, SA' },

      { name: 'ArtSpark', url: 'https://artspark.org', description: 'Austin-based nonprofit dedicated to making live arts accessible through audio description. Provides AD services for theater, dance, and live performance in Central Texas, and advocates for audio description as standard practice at arts venues. A community-rooted model for regional AD infrastructure outside major coastal arts centers.', type: 'org', tags: ['FREE'], location: 'Austin, TX' },

      { name: 'Audio Description Training Retreats', url: 'https://www.adtrainingretreats.com', description: 'Virtual professional training in all aspects of audio description — film, television, live performance, and visual art — taught by blind and sighted professionals. Small classes with individual practice time and peer/expert feedback. Graduate network spans 17+ countries. One of the most accessible professional AD training programs available internationally.', type: 'course', tags: ['FREE'] },

      { name: 'Arts Access North Carolina', url: 'https://artsaccessinc.org', description: 'Raleigh-based nonprofit offering annual audio description training, describer workshops, and AD services for arts organizations. One of the clearest regional models in the US for building local AD infrastructure — with an Artist Link directory and community education programs alongside hands-on training.', type: 'org', tags: ['FREE'], location: 'Raleigh, NC' },

      { name: 'Reid My Mind Radio', url: 'https://reidmymind.com', description: 'Podcast and media platform by Thomas Reid — blind filmmaker, audio description narrator, and educator. Widely regarded as the most important ongoing practitioner resource for audio description craft: interviews with AD writers, blind consultants, and filmmakers. Reid was the narrator for the first open AD screening in Sundance history (Joybubbles, 2026). His framing — "better is better" over perfectionism — is essential for small organizations starting out.', type: 'media', tags: ['FREE', 'Disabled Voice'] },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. DIGITAL ACCESSIBILITY
  // "How do I make my website, app, or digital content accessible?"
  // Testing tools, design guidelines, and practical implementation resources.
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'digital',
    title: 'Digital Accessibility',
    emoji: '💻',
    description: 'Making websites, apps, and digital content accessible — testing tools, design guidelines, screen readers, and media players. The technical layer most digital teams need.',
    resources: [

      { name: 'W3C WAI Tutorials', url: 'https://www.w3.org/WAI/tutorials', description: 'Free authoritative tutorials for making specific content types accessible: images, tables, forms, carousels, and menus. Applicable everywhere.', type: 'guide', tags: ['FREE', 'Open Access'] },

      { name: 'WebAIM — Web Accessibility In Mind', url: 'https://webaim.org', description: 'The best free practical web accessibility resource — run by Utah State University. Articles, guides, the WAVE browser tool, and the Screen Reader User Survey, which is the most important data on how disabled people actually use the web.', type: 'org', tags: ['FREE'] },

      { name: 'The A11y Project', url: 'https://www.a11yproject.com', description: 'Community-maintained free resource with accessibility patterns, checklists, and articles for developers and designers. Practical, current, and well-organized. One of the best free resources for the practical "how do I implement this?" questions.', type: 'guide', tags: ['FREE', 'Open Access'] },

      { name: 'Microsoft Inclusive Design Toolkit', url: 'https://www.microsoft.com/design/inclusive', description: 'Free framework: Recognize Exclusion, Learn from Diversity, Solve for One Extend to Many. Introduces the "persona spectrum" model of permanent, temporary, and situational disability — a powerful reframe for non-disability-specialist designers.', type: 'guide', tags: ['FREE'] },

      { name: 'BBC GEL Accessibility Guidelines', url: 'https://www.bbc.co.uk/gel/guidelines/accessibility', description: 'Among the most thorough publicly available design system accessibility guidelines in the world. The BBC is legally required to meet OFCOM captioning and audio description standards — their guidelines reflect that. Includes disability personas, visual design standards, and content guidelines.', type: 'standard', tags: ['FREE'], location: 'United Kingdom' },

      { name: 'NVDA Screen Reader', url: 'https://www.nvaccess.org', description: 'The most widely used free, open-source screen reader for Windows — developed in Australia, used worldwide. Essential for manual accessibility testing and for understanding how blind users experience the web. Free download.', type: 'tool', tags: ['FREE', 'Open Access'] },

      { name: 'axe DevTools Browser Extension', url: 'https://www.deque.com/axe', description: 'Industry-standard free accessibility testing extension for Chrome and Firefox. Catches approximately 30% of accessibility issues automatically. Used by accessibility professionals worldwide.', type: 'tool', tags: ['FREE'] },

      { name: 'WAVE — Web Accessibility Evaluation Tool', url: 'https://wave.webaim.org', description: 'Free browser-based accessibility checker. Visual overlay shows errors and warnings directly on your page — great for quick checks and for learning what to look for.', type: 'tool', tags: ['FREE'] },

      { name: 'Google Lighthouse', url: 'https://developers.google.com/web/tools/lighthouse', description: 'Free accessibility auditing tool built into Chrome DevTools. No installation needed — open any page in Chrome, open DevTools, go to Lighthouse. Generates an accessibility score and flags common issues.', type: 'tool', tags: ['FREE'] },

      { name: 'Colour Contrast Analyser (TPGi)', url: 'https://www.tpgi.com/color-contrast-checker', description: 'Free desktop tool (Mac and Windows) for checking specific color values against WCAG contrast requirements. Works on any color anywhere on screen — including colors in design software. Essential for designers.', type: 'tool', tags: ['FREE'] },

      { name: 'IBM Equal Access Checker', url: 'https://www.ibm.com/able/toolkit', description: 'Free open-source accessibility checker from IBM with detailed reporting. A strong complement to axe — catches different classes of issues. Includes an accessibility toolkit for teams building accessible products.', type: 'tool', tags: ['FREE', 'Open Access'] },

      { name: 'Able Player', url: 'https://ableplayer.github.io', description: 'Free, MIT-licensed, open-source media player with excellent WCAG compliance. Supports audio description tracks, caption tracks (WebVTT, SRT, SBV), chapter navigation, keyboard control, and transcript view. The best free option for organizations hosting video online.', type: 'tool', tags: ['FREE', 'Open Access'] },

      { name: 'Ace by DAISY — EPUB Accessibility Checker', url: 'https://daisy.org/activities/software/ace/', description: 'Free, open-source tool from the DAISY Consortium for checking EPUB accessibility compliance (EPUB Accessibility 1.1). Essential for any organization publishing digital books or documents. Works on Mac, Windows, Linux.', type: 'tool', tags: ['FREE', 'Open Access'] },

      { name: 'Accessibility Insights', url: 'https://accessibilityinsights.io', description: 'Free browser extension and desktop app from Microsoft for thorough accessibility testing. FastPass catches common WCAG violations instantly; Assessment mode walks testers through a full WCAG 2.1 AA evaluation with step-by-step guidance. More systematic than axe or WAVE — the best free tool for a complete manual audit.', type: 'tool', tags: ['FREE', 'Open Access'] },

      { name: 'Who Can Use', url: 'https://whocanuse.com', description: 'Free color contrast tool that shows how a color combination affects people with different types of color blindness, low vision, and other visual conditions — not just a pass/fail contrast ratio. Uniquely useful for designers: see the real impact of your palette choices across the disability spectrum before you build.', type: 'tool', tags: ['FREE', 'Open Access'] },

      { name: 'Learn Accessibility — web.dev', url: 'https://web.dev/learn/accessibility/', description: 'Google\'s comprehensive free accessibility course — structured, practical, and kept current. Covers ARIA, keyboard navigation, color and contrast, forms, images, video, and testing. One of the best self-paced learning resources for developers and designers building accessible digital content.', type: 'course', tags: ['FREE', 'Open Access'] },

      { name: 'Deque University', url: 'https://dequeuniversity.com', description: 'The most widely recognized professional training program for web accessibility. Paid courses on WCAG, ARIA, screen reader testing, and accessible development — used by accessibility specialists, QA engineers, and designers at organizations of all sizes. Offers free introductory content. If your team is investing in one paid accessibility training, Deque University is the field standard.', type: 'course', tags: [] },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. LIVE EVENTS & THEATER
  // "How do I make my venue, performance, or event accessible?"
  // Physical access, communication access, sensory accommodations, and the
  // organizations that have built models worth studying.
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'live-events',
    title: 'Live Events & Theater',
    emoji: '🎭',
    description: 'Making in-person performances, venues, and events accessible — relaxed performances, hearing loops, GalaPro captions, ASL interpretation, accessible ticketing, sensory accommodations, and the organizations that have built models worth studying.',
    resources: [

      { name: 'Kennedy Center — VSA Arts Access Resources', url: 'https://www.kennedy-center.org/education/vsa', description: 'Free tip sheets, staff training guides, and professional development resources for US arts organizations. Covers physical access, communication access, and programming for disabled audiences and artists. VSA is part of the Kennedy Center\'s national accessibility work.', type: 'guide', tags: ['FREE'], location: 'United States' },

      { name: 'Kennedy Center LEAD Research & Resources', url: 'https://www.kennedy-center.org/education/networks-conferences-and-research/research-and-resources/lead-research-and-resources', description: 'Leadership Exchange in Arts and Disability (LEAD) — free tip sheets, guides, and video resources on physical access, communication access, assistive listening, and programming for diverse disability communities. The US field\'s go-to professional development conference materials.', type: 'guide', tags: ['FREE'], location: 'United States' },

      { name: 'Theatre Development Fund (TDF)', url: 'https://www.tdf.org', description: 'NYC nonprofit and national model for theater accessibility. Resources on captioning, audio description, and Deaf/hard of hearing access. Pioneered open captions and GalaPro integration in New York theater. Their online resources are useful for any US theater.', type: 'org', tags: ['FREE'], location: 'New York City' },

      { name: 'League of Chicago Theatres — Accessibility Resources', url: 'https://leagueofchicagotheatres.org/accessibility-resources', description: 'Free toolkit for theater organizations covering physical access, captioning, audio description, relaxed performances, and sensory-friendly programming. A strong regional model with broad applicability for mid-sized US theater companies.', type: 'guide', tags: ['FREE'], location: 'Chicago, IL' },

      { name: 'GalaPro', url: 'https://galapro.com', description: 'Free smartphone app delivering synchronized captions or audio description to live theater performances. Audience members download the app and receive captions tied to the show in real time. Used at Broadway and major regional venues — allows Deaf/HoH patrons to sit anywhere in the house.', type: 'tool', tags: ['FREE'] },

      { name: 'Society of London Theatre — Relaxed Performance Guidelines', url: 'https://officiallondontheatre.com/access', description: 'Standard UK guidelines for relaxed/sensory-friendly performances — adjusted sensory environment, chill-out rooms, visual stories, and staff briefing. Developed in London theater, now adopted internationally as the benchmark model.', type: 'guide', tags: ['FREE'], location: 'United Kingdom' },

      { name: 'Attitude is Everything — Charter of Best Practice', url: 'https://www.attitudeiseverything.org.uk', description: 'UK benchmark framework for accessible live music venues and festivals. Bronze/Silver/Gold Charter levels — adopted by hundreds of UK venues. Their annual State of Access Reports (based on first-person Deaf and disabled fan data) are the most important evidence base for accessible live music.', type: 'guide', tags: ['FREE'], location: 'United Kingdom' },

      { name: 'Graeae Theatre Company — Access Resources', url: 'https://graeae.org/accessibility', description: 'The foundational UK disability-led theater company (founded 1980). Graeae integrates captioning, BSL, and audio description as theatrical language — not add-ons. Free resources and case study material for any arts organization. Co-directed the 2012 Paralympic Opening Ceremony. Internationally significant.', type: 'org', tags: ['FREE', 'Disabled Voice'], location: 'London, UK' },

      { name: 'Stagetext', url: 'https://www.stagetext.org', description: 'The UK\'s leading organization for live theater captioning for Deaf, deafened, and hard of hearing audiences. Stagetext provides live captioning at hundreds of UK theater performances annually, trains captioners, maintains quality standards, and publishes free guidance for venues on how to caption live theater. The UK counterpart to TDF (New York) — their free resources on commissioning and delivering live theater captions are the best available for UK practitioners.', type: 'org', tags: ['FREE', 'Deaf-Centered'], location: 'United Kingdom' },

      { name: 'HowlRound Theatre Commons — Disability & Accessibility Archive', url: 'https://howlround.com/tags/disability-and-accessibility', description: 'Free, globally accessible archive of essays, articles, and recorded conversations on disability aesthetics, accessibility in theater, and disabled theater artists. HowlRound TV provides free open-access livestreaming and a permanent video archive.', type: 'org', tags: ['FREE'] },

      { name: 'Cultural Access Collaborative', url: 'https://culturalaccesscollaborative.org', description: 'US community of cultural administrators and disabled people working to remove access barriers. Offers free professional development workshops, an equipment loan program, and a shared-access calendar. Strong disability-centered approach.', type: 'org', tags: ['FREE'], location: 'United States' },

      { name: 'Hearing Loss Association of America (HLAA)', url: 'https://www.hearingloss.org', description: 'US advocacy for hearing loop installation in venues nationwide. Includes a free Loopfinder directory of loop-equipped venues. Essential for understanding hearing loop technology as best practice and for advocating for loop installation at US arts venues.', type: 'org', tags: ['FREE'], location: 'United States' },

      { name: 'AccessibilityOnline — Arts-n-Rec Webinar Series', url: 'https://www.accessibilityonline.org/training', description: 'Free ongoing webinar series on ADA issues in arts, performance, museums, zoos, exhibitions, concerts, fairs, and recreation — one of the best free ongoing professional development resources for US arts accessibility professionals.', type: 'course', tags: ['FREE'], location: 'United States' },

      { name: 'ADA National Network — Accessibility Online Webinars', url: 'https://adata.org/training/accessibility-online-webinars', description: 'Free webinars on ADA accessibility topics with recorded sessions available in a searchable archive. The regional ADA Centers host these regularly — accessible professional development for US arts practitioners.', type: 'course', tags: ['FREE'], location: 'United States' },

      { name: 'Mid Atlantic Arts — Disability Justice Webinar Series', url: 'https://www.midatlanticarts.org/opportunity/accessibility-training', description: 'Webinar series for local and state arts agencies going beyond compliance to center disability justice frameworks. Partnered with Americans for the Arts. Free and recorded for later viewing.', type: 'course', tags: ['FREE'], location: 'United States' },

      { name: 'Shape Arts (UK)', url: 'https://shapearts.org.uk', description: 'UK disability arts development organization. Free access consultancy resources, articles, and guidance for cultural organizations. Strong on the intersection of access and artistic identity — particularly useful for UK arts administrators navigating the Equality Act.', type: 'org', tags: ['FREE'], location: 'United Kingdom' },

      { name: 'Arts Access Australia', url: 'https://artsaccessaustralia.org', description: 'Australia\'s national peak body for arts and disability — the equivalent of Americans for the Arts in the US, but with a dedicated disability arts focus. Free resources, sector development guides, and advocacy for accessible arts programming nationwide.', type: 'org', tags: ['FREE'], location: 'Australia' },

      { name: 'Accessible Arts NSW', url: 'https://accessiblearts.org.au', description: 'New South Wales-based arts and disability organization. Free training, resources, and advocacy for accessible arts programming in NSW and applicable more broadly across Australia.', type: 'org', tags: ['FREE'], location: 'New South Wales' },

      { name: 'Arts Access Aotearoa', url: 'https://artsaccess.org.nz', description: 'New Zealand\'s national organization for arts and disability. Free resources and advocacy for accessible arts, accessible venues, and disability arts programming across Aotearoa New Zealand.', type: 'org', tags: ['FREE'], location: 'New Zealand' },

      { name: 'KultureCity', url: 'https://kulturecity.org', description: 'Sensory accessibility certification and training for venues, sports arenas, cultural institutions, and events. Their Sensory Inclusive™ certification is held by hundreds of NFL stadiums, NBA arenas, museums, and concert halls. Free app lets patrons find certified venues nearby and request sensory bags — provided at no cost at certified locations. Practical and scalable model for neurodivergent and sensory-sensitive audiences.', type: 'org', tags: ['FREE', 'Neurodivergent'], location: 'United States' },

      { name: 'ABLE Ensemble', url: 'https://ableensemble.com', description: 'Chicago-based professional performing arts company creating and performing work by and with artists with disabilities. A leading disability-led theater in the Midwest — one of the clearest examples of disabled artists as full creative agents, not subjects.', type: 'org', tags: ['Disabled Voice'], location: 'Chicago, IL' },

      { name: 'Theater Breaking Through Barriers', url: 'https://tbtb.org', description: 'New York professional theater company (formerly Theatre By The Blind) integrating blind, visually impaired, and sighted artists. Productions build integrated visual description into staging and direction — access as artistic form, not retrofit. Over 50 years of practice.', type: 'org', tags: ['FREE', 'Disabled Voice'], location: 'New York City' },

      { name: 'Arts Midwest Accessibility Center', url: 'https://www.artsmidwest.org/resources/accessibility', description: 'Free resource hub from Arts Midwest covering physical access, communication access, sensory accommodations, digital accessibility, and virtual programming — curated specifically for arts and cultural organizations. Includes links to ADA guidance, captioning how-tos, image description resources, and accessible event planning tools. A strong aggregator for any organization starting its accessibility work.', type: 'guide', tags: ['FREE'], location: 'United States' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. FILM & SCREEN MEDIA
  // "I'm making a film / working in film / want to understand disability on screen."
  // Accessible production, representation research, disability-centered festivals,
  // and resources for disabled filmmakers.
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'film-media',
    title: 'Film & Screen Media',
    emoji: '🎬',
    description: 'Accessible film production, disability representation on screen, film festivals that center disabled perspectives and creators, and resources for disabled filmmakers navigating the industry.',
    resources: [

      { name: 'FWD-Doc — Full Resources Hub', url: 'https://fwd-doc.org/resources', description: 'Complete international resources hub from FWD-Doc: a global intersectional community of disabled documentary film creators and allies. Includes a 62-page free toolkit covering disability inclusion across development, production, post-production, and exhibition.', type: 'org', tags: ['FREE'] },

      { name: 'Accessible Filmmaking Guide', url: 'https://accessiblefilmmaking.wordpress.com', description: 'Academic and practical guide on accessible and inclusive filmmaking — developed in part through Canadian and UK research collaboration. Covers accessibility for disabled cast and crew as well as accessible output. Free to read online.', type: 'guide', tags: ['FREE', 'Open Access'] },

      { name: 'IDA Nonfiction Access Initiative', url: 'https://www.documentary.org/nonfiction-access-initiative/resources', description: 'International Documentary Association\'s free resource hub for nonfiction accessibility in the US and internationally. Includes the 2024 report on accessibility and support for disabled nonfiction media makers.', type: 'org', tags: ['FREE'] },

      { name: 'Inevitable Foundation', url: 'https://inevitablefoundation.com', description: 'Mentorship, script development support, and research on disability inclusion for disabled writers in Hollywood. Free guides on disability representation in screenwriting. An important entry point for industry inclusion advocacy.', type: 'org', tags: ['FREE'], location: 'United States' },

      { name: 'USC Annenberg Inclusion Initiative', url: 'https://annenberg.usc.edu/research/aii', description: 'Free research reports on disability representation and hiring in film and television, including the landmark "Inequality in 1,300 Popular Films." Essential data for evidence-based arguments about US industry change.', type: 'org', tags: ['FREE', 'Open Access'], location: 'United States' },

      { name: 'RespectAbility', url: 'https://www.respectability.org', description: 'US coalition with resources on disability inclusion in entertainment. Runs an Entertainment Lab for disabled writers and a free Media Guide for journalists and critics covering disability representation.', type: 'org', tags: ['FREE'], location: 'United States' },

      { name: 'RespectAbility — Media Guide for Journalists', url: 'https://www.respectability.org/representing-disability', description: 'Free US guide for journalists and critics covering language, sourcing, and common mistakes in writing about disability. Accessible and practical — good for newsrooms and arts publications.', type: 'guide', tags: ['FREE'], location: 'United States' },

      { name: 'Superfest Disability Film Festival', url: 'https://sfmcd.org/superfest', description: 'World\'s longest-running disability film festival — based at UCSF/Berkeley. All films are captioned and audio described. Centers disabled perspectives and filmmakers. The benchmark for film festival accessibility practice. Free public screenings.', type: 'org', tags: ['FREE'], location: 'San Francisco Bay Area' },

      { name: 'ReelAbilities Film Festival', url: 'https://reelabilities.org', description: 'US disability-focused film festival with strong access practices, free educational programming, and chapters in 20+ cities. An important showcase for disability-centered storytelling with broad geographic reach.', type: 'org', tags: ['FREE'], location: '20+ US Cities' },

      { name: 'Disability Film Challenge', url: 'https://www.disabilityfilmchallenge.com', description: 'Annual US filmmaking competition promoting authentic disability storytelling by and with disabled creators. Free to enter. Held at Sony Pictures Studios (Los Angeles). Good gateway for emerging disabled filmmakers.', type: 'org', tags: ['FREE'], location: 'Los Angeles, CA' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 7. DEAF CULTURE & ASL
  // "I'm working with Deaf artists or audiences / I want to understand ASL and Deaf identity."
  // Resources centering the Deaf community as a cultural and linguistic community —
  // not just "people who can't hear." Distinct from captioning (which is technique);
  // this is about identity, history, aesthetics, and advocacy.
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'deaf-asl',
    title: 'Deaf Culture & ASL',
    emoji: '🤟',
    description: 'Resources centering the Deaf community as a cultural and linguistic community — history, advocacy, Deaf theater, ASL linguistics. Distinct from the Captioning section (technique); this is about identity and cultural practice.',
    resources: [

      { name: 'National Association of the Deaf (NAD)', url: 'https://www.nad.org', description: 'The leading US Deaf advocacy organization. Free position papers on captioning, cochlear implants, ASL recognition, and Deaf civil rights. Essential reading for understanding the Deaf community\'s own advocacy positions — not what hearing organizations say about Deaf people.', type: 'org', tags: ['FREE', 'Deaf-Centered'], location: 'United States' },

      { name: 'Gallaudet University Press', url: 'https://www.gallaudet.edu/gallaudet-university-press', description: 'The world\'s leading publisher of Deaf-centered academic and cultural writing — based in Washington DC. Some titles available open access. Essential for understanding Deaf culture, ASL linguistics, and Deaf history from the inside.', type: 'org', tags: ['FREE', 'Deaf-Centered', 'Open Access'], location: 'Washington DC' },

      { name: 'Through Deaf Eyes (PBS, 2007)', url: 'https://www.pbs.org/weta/throughdeafeyes', description: 'Free two-hour documentary on 200 years of Deaf culture in America — covers Deaf history, ASL literature, Deaf education, the cochlear implant debate, and Deaf arts. One of the best entry points for hearing practitioners new to Deaf culture.', type: 'media', tags: ['FREE', 'Deaf-Centered'] },

      { name: 'World Federation of the Deaf (WFD)', url: 'https://wfdeaf.org', description: 'International advocacy for sign language recognition and Deaf rights globally. Free resources on international Deaf policy, sign language recognition campaigns, and CRPD Article 30.4 (explicit recognition of Deaf cultural identity in international law).', type: 'org', tags: ['FREE', 'Deaf-Centered'] },

      { name: 'National Theatre of the Deaf', url: 'https://www.ntd.org', description: 'The longest-running professional touring theater company in the US (established 1967). Pioneer of theatrical ASL — their work shaped how theater engages with Deaf communities. Free resources and history available online.', type: 'org', tags: ['FREE', 'Deaf-Centered'], location: 'US — Touring' },

      { name: 'Deaf West Theatre', url: 'https://deafwest.org', description: 'Los Angeles company integrating ASL and spoken English as co-equal theatrical languages. Known for Spring Awakening (Broadway 2015). Foundational case study in Deaf aesthetics as artistic practice — not accessibility as afterthought.', type: 'org', tags: ['FREE', 'Deaf-Centered'], location: 'Los Angeles, CA' },

      { name: 'HowlRound — Disability & Deaf Performance Conversations (UK)', url: 'https://howlround.com/happenings/disability-deaf-performance-conversation', description: 'Free essays and recorded conversations on UK Deaf performance and disability theater, including resources on theatrical interpreting, BSL aesthetics, and integrating access as artistic language.', type: 'media', tags: ['FREE', 'Deaf-Centered'] },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 8. DISABILITY JUSTICE & FRAMEWORKS
  // "I want to understand the why behind the how / ground my work in community knowledge."
  // Foundational texts, theoretical frameworks, and community organizations.
  // Start here before diving into compliance checklists.
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'disability-justice',
    title: 'Disability Justice & Frameworks',
    emoji: '✊',
    description: 'Foundational texts, theoretical frameworks, and community organizations that ground accessibility in disability justice — the why behind the how. Read these before building compliance checklists. Disability justice centers those most marginalized within disability communities.',
    resources: [

      { name: 'Sins Invalid — Skin, Tooth, and Bone', url: 'https://sinsinvalid.org/skin-tooth-and-bone', description: 'Free PDF laying out the 10 Principles of Disability Justice (2016). Short, accessible, visually rich. The foundational text of the Disability Justice framework — should be the first thing read in any accessibility training.', type: 'media', tags: ['FREE', 'Disabled Voice'] },

      { name: 'Mia Mingus — "Access Intimacy: The Missing Link"', url: 'https://leavingevidence.wordpress.com/2011/05/05/access-intimacy-the-missing-link/', description: 'Free foundational essay introducing "access intimacy" — the feeling when someone gets your access needs intuitively, without it being a burden or transaction. One of the most widely assigned pieces in the field, used in courses worldwide.', type: 'media', tags: ['FREE', 'Disabled Voice'] },

      { name: 'Leaving Evidence — Mia Mingus', url: 'https://leavingevidence.wordpress.com', description: 'Free, searchable blog archive by disability justice writer and organizer Mia Mingus. Covers access intimacy, transformative justice, disability and race, pod mapping, and access as love. One of the most important ongoing writing projects in the field.', type: 'media', tags: ['FREE', 'Disabled Voice'] },

      { name: 'Harriet McBryde Johnson — "Unspeakable Conversations"', url: 'https://www.nytimes.com/2003/02/16/magazine/unspeakable-conversations.html', description: 'Free New York Times essay (2003) in which disability rights attorney Harriet McBryde Johnson debates philosopher Peter Singer on the value of disabled lives. A masterpiece of disability rights writing — sophisticated, funny, and essential.', type: 'media', tags: ['FREE', 'Disabled Voice'] },

      { name: 'Stella Young — "I\'m Not Your Inspiration, Thank You Very Much"', url: 'https://www.ted.com/talks/stella_young_i_m_not_your_inspiration_thank_you_very_much', description: 'Free, captioned TED Talk (~9 min) critiquing "inspiration porn" — the use of disabled people\'s existence to inspire non-disabled people. The most accessible entry point to this critique. Essential first viewing in any accessibility training.', type: 'media', tags: ['FREE', 'Disabled Voice'] },

      { name: 'Crip Camp: A Disability Revolution (2020)', url: 'https://www.youtube.com/watch?v=XRqSF85SCV0', description: 'Netflix/Higher Ground documentary on Camp Jened and the 504 Sit-In disability rights movement. Free on YouTube with captions and audio description. Widely praised by disability communities as the most important disability rights documentary in decades.', type: 'media', tags: ['FREE', 'Disabled Voice'] },

      { name: 'Alt Text as Poetry', url: 'https://alt-text-as-poetry.net', description: 'Free online project by Bojana Coklyat and Shannon Finnegan reframing alt text as a creative and political practice, not just a technical requirement. Includes a free workbook, principles, and examples from museums and artists. Changes how you think about image description entirely.', type: 'guide', tags: ['FREE', 'Disabled Voice', 'Open Access'] },

      { name: 'Sins Invalid', url: 'https://sinsinvalid.org/about', description: 'San Francisco-based home organization of Disability Justice as a framework. Free resources, videos, performance archives, and the Skin Tooth and Bone PDF. Annual performance showcases model fully integrated access as artistic practice.', type: 'org', tags: ['FREE', 'Disabled Voice'], location: 'San Francisco, CA' },

      { name: 'Sins Invalid — Performance Videos', url: 'https://sinsinvalid.org/performances', description: 'Free video archives of Sins Invalid\'s annual performance showcases — disability justice as art, performance, and political practice. Among the most important documentation of disability-led artistic work available online.', type: 'media', tags: ['FREE', 'Disabled Voice'] },

      { name: 'Disability Visibility Project', url: 'https://disabilityvisibilityproject.com', description: 'Created by Alice Wong to amplify disability media and culture. Free archive of essays, podcasts, and media criticism — including the Disability Visibility Podcast (100+ episodes) and ongoing cultural commentary. Essential reading.', type: 'org', tags: ['FREE', 'Disabled Voice'] },

      { name: 'Disability Visibility Project — Essays & Media', url: 'https://disabilityvisibilityproject.com/essays', description: 'Curated by Alice Wong. Disability media criticism and cultural commentary — an excellent source of first-person responses to disability representation in film, theater, and media.', type: 'org', tags: ['FREE', 'Disabled Voice'] },

      { name: 'Krip-Hop Nation', url: 'https://kriphopnation.com', description: 'Free archive by Leroy Moore at the intersection of disability, race, and hip-hop. Articles, music, poetry, and advocacy with particular focus on police violence against disabled people of color. Based in the Bay Area; nationally significant.', type: 'org', tags: ['FREE', 'Disabled Voice'], location: 'Bay Area, CA' },

      { name: 'Rooted in Rights', url: 'https://rootedinrights.org', description: 'Disability-centered media organization producing free accessible videos and guides on disability rights topics, including an Access That hub for accessible media production. Disability-led; US-based.', type: 'org', tags: ['FREE', 'Disabled Voice'] },

      { name: 'Autistic Self Advocacy Network (ASAN)', url: 'https://autisticadvocacy.org', description: 'The leading US autistic-led disability rights organization. ASAN is the correct organization to reference for sensory-friendly programming guidance — not Autism Speaks. Free toolkits, policy positions, and guides on neurodivergent inclusion developed by autistic people.', type: 'org', tags: ['FREE', 'Disabled Voice', 'Neurodivergent'] },

      { name: 'Disability Justice Project', url: 'https://disabilityjusticeproject.org', description: 'Free resources, toolkit, and articles grounding access work in Disability Justice principles for activism and organizational practice. A good complement to the Sins Invalid foundational texts.', type: 'org', tags: ['FREE'] },

      { name: 'Fireweed Collective', url: 'https://fireweedcollective.org', description: 'Previously the Icarus Project — a US peer support network and disability justice organization centering people with psychiatric and mental health experiences. Arts-rooted; distributes zines, guides, and mutual aid resources on navigating mental health outside clinical models.', type: 'org', tags: ['FREE', 'Disabled Voice'] },

      { name: 'MindFreedom International', url: 'https://mindfreedom.org', description: 'Oldest psychiatric survivor advocacy organization in the US. Challenges forced psychiatric treatment and institutionalization. Free resources on Mad Pride, psychiatric survivor rights, and disability justice applied to mental health.', type: 'org', tags: ['FREE', 'Disabled Voice'] },

      { name: 'Disability Arts Online', url: 'https://disabilityarts.online', description: 'The UK\'s leading free platform for disability arts criticism — reviews of theater, film, and visual art by disabled critics. Cultural commentary, artist profiles, and industry news. Essential reading for anyone working in UK disability arts or wanting a non-US perspective.', type: 'org', tags: ['FREE', 'Disabled Voice'], location: 'United Kingdom' },

      { name: 'HowlRound — Disability Representation in Storytelling', url: 'https://howlround.com/happenings/disability-representation-storytelling', description: 'Free essays and conversations on disability representation in theater and film, including how disabled artists navigate and push back against representation norms.', type: 'media', tags: ['FREE', 'Disabled Voice'] },

      { name: 'Disability Arts International', url: 'https://www.disabilityartsinternational.org', description: 'International platform for disability arts news, artist profiles, and sector development — with significant coverage of Global South and non-Western disability arts traditions often invisible in US/UK-focused resources.', type: 'org', tags: ['FREE'] },

      { name: 'Unlimited (UK)', url: 'https://weareunlimited.org.uk', description: 'The UK\'s most significant arts commissioning program for disabled artists — funds and develops new work, tours internationally, and publishes free guides on accessible marketing and arts production. Their "Accessible Marketing Guide" (2024) is one of the best practical resources on disability-inclusive communications, alt text, and accessible social media for arts organizations.', type: 'org', tags: ['FREE'], location: 'United Kingdom' },

      { name: 'Kinetic Light', url: 'https://kineticlight.org', description: 'Disability dance company by choreographer Alice Sheppard — their Audimance® multi-track audio description app and their commitment to creative alt text as public-facing content have made them a landmark in access-as-aesthetic practice. Free resources and design documentation available on their website.', type: 'org', tags: ['FREE', 'Disabled Voice'], location: 'United States' },

      { name: 'Wordgathering: A Journal of Disability Poetry and Literature', url: 'https://wordgathering.com', description: 'The only US journal dedicated to poetry and prose by disabled writers — published free online since 2007. A living archive of disability literature across every form: fierce, tender, comic, formally experimental, politically exact. Quarterly; no subscription required. An essential resource for disability arts programs and literary educators.', type: 'media', tags: ['FREE', 'Disabled Voice', 'Open Access'] },

      { name: 'National Disability Theatre', url: 'https://nationaldisabilitytheatre.org', description: 'US professional theater company committed to producing work by and for disabled people in partnership with regional theaters nationwide. Focuses on hiring disabled directors, designers, playwrights, and performers — and on changing systemic hiring practices in professional theater.', type: 'org', tags: ['FREE', 'Disabled Voice'] },

      { name: 'AXIS Dance Company', url: 'https://axisdance.org', description: 'Oakland-based contemporary dance company integrating wheelchair users and standing dancers — one of the longest-running integrated dance companies in the US. Their work makes the strongest possible case that diverse embodiment is not a limitation but an artistic vocabulary: the specificity of different bodies is the aesthetic.', type: 'org', tags: ['FREE', 'Disabled Voice'], location: 'Oakland, CA' },

      { name: 'Disabled and Here', url: 'https://affecttheverb.com/disabledandhere', description: 'Free stock photography and media collection centering disabled Black, Indigenous, and people of color — created by and for disabled BIPOC communities. A direct response to the near-total absence of disabled BIPOC people in stock imagery. Free to download and use. Essential for any organization that wants its visual materials to actually reflect the disability community as it is.', type: 'media', tags: ['FREE', 'Open Access', 'Disabled Voice'] },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 9. RESEARCH, LIBRARIES & PUBLISHING
  // "I need to find a book / read the research / check an academic source."
  // Accessible libraries, open-access journals, and publishing tools.
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'research-libraries',
    title: 'Research, Libraries & Publishing',
    emoji: '📚',
    description: 'Accessible libraries, open-access academic publishing, and tools for finding and producing accessible documents. For researchers, educators, and organizations publishing content.',
    resources: [

      { name: 'Disability Studies Quarterly (DSQ)', url: 'https://dsq-sds.org', description: 'The most important open-access peer-reviewed journal in disability studies. Published by the Society for Disability Studies. Covers arts, culture, media, law, and history — free to read online, no subscription. Searchable archive going back to the 1980s.', type: 'media', tags: ['FREE', 'Open Access'] },

      { name: 'NLS — National Library Service for the Blind and Print Disabled', url: 'https://www.loc.gov/nls', description: 'Free Library of Congress service for any US resident with a print disability — blindness, low vision, physical disability, or dyslexia. Provides digital talking books (via the free BARD app), braille books, and specialized playback devices mailed free. One of the most valuable and underused US accessibility services.', type: 'org', tags: ['FREE'], location: 'United States' },

      { name: 'Bookshare — Accessible Online Library', url: 'https://www.bookshare.org', description: 'The world\'s largest accessible online library — over 1 million titles in DAISY, EPUB, BRF (Braille-ready), and audio. Free for qualifying individuals with print disabilities in the US and in 70+ countries under the Marrakesh Treaty. Organizations can also join. A lifeline for print-disabled readers.', type: 'org', tags: ['FREE'] },

      { name: 'CELA — Centre for Equitable Library Access', url: 'https://celalibrary.ca', description: 'Canada\'s national accessible library service — the equivalent of the US NLS/BARD. Talking books, braille, and DAISY format in English and French, accessible to Canadians with print disabilities. Free with registration through member libraries.', type: 'org', tags: ['FREE'], location: 'Canada' },

      { name: 'WorldCat — World Library Finder', url: 'https://worldcat.org', description: 'The world\'s largest library catalog — search any book and find your nearest library holding it, anywhere on earth. Enter a title and your location to see which libraries near you have it. Essential for finding accessible format books and out-of-print materials globally.', type: 'tool', tags: ['FREE'] },
    ],
  },
];

/** Flat list of all resources with their category info attached — useful for search and lookup. */
export const ALL_RESOURCES = CATEGORIES.flatMap((cat) =>
  cat.resources.map((r) => ({ ...r, categoryId: cat.id, categoryTitle: cat.title, categoryEmoji: cat.emoji }))
);

/** Quick name lookup by URL slug. */
export const RESOURCE_BY_SLUG: Record<string, { name: string; categoryTitle: string; categoryEmoji: string }> =
  Object.fromEntries(
    ALL_RESOURCES.map((r) => [r.url, { name: r.name, categoryTitle: r.categoryTitle, categoryEmoji: r.categoryEmoji }])
  );
