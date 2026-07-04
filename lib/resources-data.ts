// Shared resource data, imported by both /app/resources/page.tsx and /app/members/page.tsx.
// The `url` field doubles as the stable slug used in the resource_favorites table.
//
// ORGANIZATION: By practitioner use-case, what are you actually trying to do?
// Resources that are specific to a jurisdiction or physical location are marked
// with the `location` field and shown with a 📍 badge in the UI.

export type ResourceType = 'standard' | 'tool' | 'guide' | 'org' | 'media' | 'course';

export type Resource = {
  name: string;
  url: string;
  description: string;
  type: ResourceType;
  tags?: string[];
  /** Physical location required or jurisdiction-specific, shown as a 📍 badge in the UI */
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
    description: 'Legal frameworks, compliance standards, and policy, what you\'re required to do and under which law. Jurisdiction-specific resources are marked. Start here if you\'re navigating grant requirements or legal obligations.',
    resources: [

      { name: 'UN Convention on the Rights of Persons with Disabilities (CRPD)', url: 'https://www.un.org/disabilities/documents/convention/convoptprot-e.pdf', description: 'The foundational international disability rights instrument, entered into force 2008, 190 states parties. Article 30 explicitly requires access to cultural life including theater, film, and museums. Free PDF.', type: 'standard', tags: ['FREE', 'Open Access'] },

      { name: 'W3C Web Accessibility Initiative (WAI)', url: 'https://www.w3.org/WAI', description: 'The authoritative free source for WCAG, the global de facto standard for digital accessibility. Includes WCAG 2.1 and 2.2 specifications, Understanding documents, and tutorials. Referenced in law in the US, EU, UK, Canada, and Australia.', type: 'standard', tags: ['FREE', 'Open Access'] },

      { name: 'ADA.gov', url: 'https://www.ada.gov', description: 'The authoritative free source for all Americans with Disabilities Act guidance. Focus on Title III (public accommodations, most relevant to arts venues). Includes DOJ web accessibility guidance and the 2024 final rule requiring WCAG 2.1 AA for state and local government websites.', type: 'standard', tags: ['FREE'], location: 'United States' },

      { name: 'ADA National Network', url: 'https://adata.org', description: 'Ten regional centers (one per US region) offering free ADA training, webinars, detailed guides, and a live helpline: 1-800-949-4232. The most accessible entry point for arts organizations trying to understand their ADA obligations.', type: 'org', tags: ['FREE'], location: 'United States' },

      { name: 'W3C WCAG, US Legal Context', url: 'https://www.w3.org/WAI/standards-guidelines/wcag', description: 'WCAG 2.1 is the current US legal standard for web accessibility (confirmed by DOJ in 2022 for Title II and III entities). WCAG 2.2 (October 2023) is current best practice. Free and authoritative, this is what you cite for US legal compliance.', type: 'standard', tags: ['FREE', 'Open Access'], location: 'United States' },

      { name: 'FCC, Closed Captioning on Television', url: 'https://www.fcc.gov/consumers/guides/closed-captioning-television', description: 'FCC guide to captioning requirements under the CVAA and the four FCC quality standards: accuracy, synchrony, completeness, and placement. Essential background for film, broadcast, and streaming accessibility work in the US.', type: 'standard', tags: ['FREE'], location: 'United States' },

      { name: 'National Endowment for the Arts, Accessibility', url: 'https://www.arts.gov/impact/accessibility', description: 'Free policy guidance, case studies, and vetted resource links for US arts organizations. Accessibility is increasingly required in NEA grant criteria, this is the place to understand what NEA expects and what they fund. Includes accessible event planning guides and ADA compliance resources.', type: 'org', tags: ['FREE'], location: 'United States' },

      { name: 'UK Equality Act 2010 Guidance', url: 'https://www.gov.uk/guidance/equality-act-2010-guidance', description: 'Free government guidance on the Equality Act 2010, the UK\'s single national disability rights law. Key feature: an "anticipatory duty" requires arts organizations to proactively plan for disabled access before an individual asks. Stronger model than the US ADA\'s reactive approach.', type: 'standard', tags: ['FREE'], location: 'United Kingdom' },

      { name: 'Accessible Canada Act, Resources', url: 'https://accessible.canada.ca', description: 'Free resources on the Accessible Canada Act (2019), Canada\'s federal accessibility legislation covering broadcasting, telecommunications, banking, and federal government. The foundation for federal arts organizations and broadcasters in Canada.', type: 'standard', tags: ['FREE'], location: 'Canada' },

      { name: 'ADA Checklist for Existing Facilities', url: 'https://adachecklist.org/checklist', description: 'Free, printable ADA compliance checklist for existing buildings, covers parking, entrances, restrooms, seating, and signage. Developed by the New England ADA Center. The most practical starting point for any arts venue doing a self-assessment of physical access before bringing in a consultant.', type: 'guide', tags: ['FREE'], location: 'United States' },

      { name: 'Section508.gov', url: 'https://www.section508.gov', description: 'The official US government hub for Section 508 of the Rehabilitation Act, which requires federal agencies and federally funded programs to make their technology accessible. Free guidance, training, and checklists on buying, building, and managing accessible digital content. Relevant for any arts organization receiving federal funds or selling to federal agencies.', type: 'standard', tags: ['FREE'], location: 'United States' },
      { name: 'U.S. Access Board', url: 'https://www.access-board.gov', description: 'The federal agency that writes the accessibility standards behind the ADA, the Architectural Barriers Act, and Section 508. Free guidance documents, technical assistance, and webinars on accessible buildings, sites, and technology. This is the authoritative source for the actual design standards (ramps, signage, ICT) that arts venues must meet.', type: 'standard', tags: ['FREE'], location: 'United States' },
      { name: 'Marrakesh Treaty (WIPO)', url: 'https://www.wipo.int/en/web/marrakesh-treaty', description: 'The international treaty that lets organizations create and share accessible-format copies (braille, audio, large print) of published works across borders without seeking copyright permission. Directly relevant for accessible scripts, theater programs, educational texts, and film materials. Free official WIPO resource, including the Accessible Books Consortium.', type: 'standard', tags: ['FREE', 'Open Access'] },
      { name: 'European Accessibility Act (European Commission)', url: 'https://commission.europa.eu/strategy-and-policy/policies/justice-and-fundamental-rights/disability/european-accessibility-act-eaa_en', description: 'The official European Commission page for the European Accessibility Act, in force since June 2025. Covers accessibility requirements for products and services including e-books, e-commerce, ticketing, and audiovisual media services across all EU member states. The key reference for any arts platform or service operating in the EU.', type: 'standard', tags: ['FREE'], location: 'European Union' },
      { name: 'AccessibleEU Centre', url: 'https://accessible-eu-centre.ec.europa.eu', description: 'The EU\'s official resource centre for accessibility, covering the built environment, transport, and information and communication technology. Free guidelines, an online training campus, a digital library, and a community of practice. The most practical starting point for understanding European Accessibility Act and Web Accessibility Directive obligations.', type: 'org', tags: ['FREE'], location: 'European Union' },
      { name: 'AODA Resource Centre (Ontario)', url: 'https://www.aoda.ca', description: 'A long-running resource hub for the Accessibility for Ontarians with Disabilities Act, the most developed provincial accessibility law in Canada. Free online training, plain-language guides to the Act, and articles on the five accessibility standards (customer service, information and communications, employment, transportation, built environment). Ontario arts organizations with 50 or more employees must meet WCAG for their websites under this law.', type: 'standard', tags: ['FREE'], location: 'Ontario, Canada' },
      { name: 'Australian Human Rights Commission: Web Access Guidance', url: 'https://humanrights.gov.au/our-work/disability-rights/world-wide-web-access-disability-discrimination-act-advisory-notes', description: 'Official guidance from the Australian Human Rights Commission on web accessibility obligations under the Disability Discrimination Act 1992. Recommends WCAG Level AA as the standard and explains how the DDA applies to websites, apps, and digital content. The authoritative reference for Australian arts organizations.', type: 'standard', tags: ['FREE'], location: 'Australia' },
      { name: 'Americans for the Arts: Accessibility', url: 'https://www.americansforthearts.org/by-topic/cultural-equity/accessibility', description: 'The national arts advocacy organization\'s accessibility hub, with free webinars, research, and policy resources on welcoming disabled audiences and artists. Frames access as going beyond ADA baseline compliance. A useful US-wide complement to the NEA\'s grant-focused guidance.', type: 'org', tags: ['FREE'], location: 'United States' },
      { name: 'Disability Rights Education and Defense Fund (DREDF)', url: 'https://dredf.org', description: 'A leading national disability rights law and policy center, directed by disabled people, founded 1979. Free legal information, technical assistance, and policy analysis on the ADA, Section 504, and current threats to disability rights. The place to understand the law from a civil-rights and movement perspective, not just a compliance checklist.', type: 'org', tags: ['FREE', 'Disabled Voice'], location: 'United States' },
      { name: 'EN 301 549 (ETSI Standard)', url: 'https://www.etsi.org/deliver/etsi_en/301500_301599/301549/', description: 'The harmonized European standard for accessibility of ICT products and services, aligned with WCAG and referenced by the EU Web Accessibility Directive and the European Accessibility Act. Free to download from ETSI. This is the technical standard EU public bodies and many private services are measured against.', type: 'standard', tags: ['FREE'], location: 'European Union' },
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
    description: 'Creating, evaluating, and delivering captions, quality standards, editing tools, and guides for video, streaming, live events, and broadcast. Covers both closed captions and open/expressive approaches.',
    resources: [

      { name: 'Caption with Intention', url: 'https://captionwithintention.org', description: 'The defining open-source resource on expressive/creative captioning, developed with the Deaf community, recipient of the Academy Award of Merit. Explores style, color, animation, and personality in captions beyond compliance defaults. Free and globally applicable.', type: 'standard', tags: ['FREE', 'Open Access', 'Deaf-Centered'] },

      { name: 'DCMP Captioning Key', url: 'https://dcmp.org/learn/captioningkey', description: 'The most detailed and widely-used quality standard for captions in educational media, broadly applied across the industry. Covers accuracy, placement, speaker identification, and sound effects. The US captioner\'s go-to reference.', type: 'standard', tags: ['FREE'], location: 'United States' },

      { name: 'Netflix Timed Text Style Guide', url: 'https://partnerhelp.netflixstudios.com/hc/en-us/articles/215758617', description: 'Publicly available guide required for all Netflix content. A detailed, practical industry reference for anyone producing captions, even for non-Netflix projects. Free to read.', type: 'standard', tags: ['FREE'] },

      { name: '3Play Media Learning Center', url: 'https://www.3playmedia.com/learn', description: 'Extensive free guides on captioning standards, CVAA requirements, platform specifications, and quality. One of the most regularly updated US resources for captioning practitioners.', type: 'guide', tags: ['FREE'] },

      { name: 'WebAIM, Captioning Resources', url: 'https://webaim.org/techniques/captions/', description: 'Practical guidance from Utah State University\'s WebAIM on captioning for web and media: evaluating quality, working with caption files, and platform best practices.', type: 'guide', tags: ['FREE'] },

      { name: 'ACL, Making Captioning Easy', url: 'https://acl.gov/ada/making-captioning-easy', description: 'Administration for Community Living guide to basics of captioning for events, meetings, and media, includes tool comparisons and practical how-to guidance. Good for organizations just getting started.', type: 'guide', tags: ['FREE'], location: 'United States' },

      { name: 'Subtitle Edit', url: 'https://www.nikse.dk/subtitleedit', description: 'Free, open-source caption and subtitle editing software with Whisper AI integration. Works on Windows (and Mac via Wine/Mono). Widely used by independent filmmakers, festivals, and small organizations for creating and editing caption files.', type: 'tool', tags: ['FREE', 'Open Access'] },

      { name: 'Amara', url: 'https://amara.org', description: 'Free online captioning and subtitling platform supporting collaborative caption workflows. Popular with nonprofits, educators, and independent filmmakers who need to create or crowdsource captions without a large budget.', type: 'tool', tags: ['FREE'] },

      { name: 'SUBTXT Creative, Expressive Captions Research', url: 'https://www.subtxt.co.uk', description: 'UK-based research and creative practice on expressive captioning, the approach of encoding acoustic information (whispering, shouting, music, tone) through caption style rather than just text. University of Sheffield research base. Companion to Caption with Intention.', type: 'org', tags: ['FREE'], location: 'United Kingdom' },

      { name: 'W3C WAI: Making Audio and Video Media Accessible', url: 'https://www.w3.org/WAI/media/av/', description: 'The W3C\'s free, authoritative guide to captions, audio description, transcripts, and sign language for online media, with project-planning advice and links to the relevant WCAG criteria. The best single starting point for understanding which media access features your video needs and how they fit together.', type: 'guide', tags: ['FREE', 'Open Access'] },
      { name: 'CADET: Caption and Description Editing Tool', url: 'https://www.wgbh.org/foundation/services/ncam/tools-resources/cadet', description: 'Free, downloadable caption-authoring software from GBH\'s National Center for Accessible Media (NCAM). Runs locally in your browser with no internet required, so private content never leaves your computer. Imports and exports WebVTT, SRT, TTML, SCC, and more, and can also generate audio-description scripts. Won an FCC Chairman\'s Award for accessibility.', type: 'tool', tags: ['FREE'] },
      { name: 'Aegisub', url: 'https://aegisub.org', description: 'Free, open-source, cross-platform subtitle editor (Windows, Mac, Linux) built for precise timing to audio and rich visual styling, with a real-time video preview. Long favored by fansubbing communities for fine-grained control. A powerful option when you need more styling and timing precision than basic caption tools offer.', type: 'tool', tags: ['FREE', 'Open Access'] },
      { name: 'OpenAI Whisper', url: 'https://github.com/openai/whisper', description: 'Free, open-source speech recognition that runs locally and handles many languages and accents well. Independent filmmakers, festivals, and small organizations use it to generate first-draft captions from audio without paying for a service. Not real-time and the output always needs human editing, but a strong, private, no-cost starting point for transcription.', type: 'tool', tags: ['FREE', 'Open Access'] },
      { name: 'Otter.ai', url: 'https://otter.ai', description: 'AI transcription and live-caption tool that displays captions for online meetings (Zoom, Teams, Google Meet) and exports SRT files for video. Freemium: a free tier covers limited monthly minutes, with paid plans for more. Not CART-quality, but useful for captioning panels, interviews, and meetings on a small budget, and for producing an editable transcript to publish alongside video.', type: 'tool', tags: ['Freemium'] },
      { name: 'Netflix Audio Description Style Guide', url: 'https://partnerhelp.netflixstudios.com/hc/en-us/articles/215510667-Audio-Description-Style-Guide-v2-5', description: 'Netflix\'s publicly readable audio description style guide, a companion to its Timed Text (caption) guide. A clear, practical industry reference for AD scriptwriting conventions, useful well beyond Netflix projects. Free to read.', type: 'standard', tags: ['FREE'] },
      { name: 'Pope Tech: Guide to Adding Captions to YouTube Videos', url: 'https://blog.pope.tech/2024/05/24/a-complete-guide-for-adding-captions-to-youtube-videos/', description: 'A clear, current walkthrough of correcting YouTube\'s auto-captions and uploading your own caption files, written from an accessibility standpoint. Practical and free, aimed exactly at the small organization or creator captioning their own video for the first time.', type: 'guide', tags: ['FREE'] },
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
    description: 'Creating and delivering audio description for film, video, theater, live dance, and visual art, international standards, training resources, tools, and the organizations that set the field\'s practice.',
    resources: [

      { name: 'ADLAB International Guidelines for Audio Description', url: 'https://www.adlabproject.eu/Docs/adlab%20book/', description: 'EU-funded international reference for audio description standards, covers theory, methodology, and practical guidelines across media formats. The most comprehensive AD guide available.', type: 'standard', tags: ['FREE', 'Open Access'] },

      { name: 'Audio Description Coalition, Quality Standards', url: 'https://audiodescriptionsolutions.com/the-standards/', description: 'Widely referenced standards document covering best practices for audio description in film, television, theater, and museums, written by working describers. The original coalition site is no longer maintained; the standards live on at Audio Description Solutions. Free PDF.', type: 'standard', tags: ['FREE'] },

      { name: 'DCMP Audio Description Tip Sheet', url: 'https://dcmp.org/learn/227-audio-description-tip-sheet', description: 'One-page guide from the federally-funded Described and Captioned Media Program covering core AD principles: objective language, present tense, visual identity description. A perfect starting handout for workshops.', type: 'guide', tags: ['FREE'], location: 'United States' },

      { name: 'DCMP Style Manual', url: 'https://dcmp.org', description: 'Comprehensive federally-funded style guide for captioning and audio description in educational media. Covers AD script writing, voice talent, and quality review. The most widely referenced US AD standard for educational content.', type: 'standard', tags: ['FREE'], location: 'United States' },

      { name: 'DCMP Professional Development Courses', url: 'https://dcmp.org/learn', description: 'Free federally-funded courses on accessible media in the classroom, educational interpreting, captioning, and video description. No admission requirements, no cost. Among the most accessible AD training available in the US.', type: 'course', tags: ['FREE'], location: 'United States' },

      { name: 'ACB Audio Description Project, Education Resources', url: 'https://adp.acb.org/education.html', description: 'American Council of the Blind training resources, educational guides, and a four-course series in inclusive media. Scholarships available. Core US professional development resource for AD.', type: 'course', tags: ['FREE'], location: 'United States' },

      { name: 'Audio Description for Beginners, Free Course', url: 'https://www.closedcaptioncreator.com/videos/courses/audio-description-for-beginners/', description: 'Introductory free online course: what audio description is, why it matters, and basic script writing principles. A good first step for practitioners new to the field.', type: 'course', tags: ['FREE'] },

      { name: 'Think Outside the Vox, Education', url: 'https://thinkoutsidethevox.org/education', description: 'Free audio description workshops for live events, with a focus on live theater and community performance contexts. Sponsored by the Haymarket People\'s Fund. Accessible entry point for small organizations and community practitioners.', type: 'course', tags: ['FREE'], location: 'United States' },

      { name: 'American Council of the Blind, Audio Description Project', url: 'https://adp.acb.org', description: 'The most important US organization for audio description. Maintains AD quality standards, a database of AD-accessible venues and media nationwide, and training resources. The place to start for US AD advocacy and standards.', type: 'org', tags: ['FREE'], location: 'United States' },

      { name: 'GBH Media Access Group', url: 'https://www.wgbh.org/foundation/media-access', description: 'Created the first broadcast audio description in the US (Described Video Service). Now a leader in captioning and AD research and advocacy. The institutional origin of much US accessibility infrastructure.', type: 'org', tags: ['FREE'], location: 'United States' },

      { name: 'YouDescribe', url: 'https://youdescribe.org', description: 'Free tool enabling anyone to record audio descriptions for YouTube videos. Community-created descriptions are stored and playable alongside videos, expanding the universe of described content beyond what professional AD services cover.', type: 'tool', tags: ['FREE'] },

      { name: 'Kinetic Light, Audimance', url: 'https://kineticlight.org/audimance', description: 'Multi-track, audience-choice audio description for live dance performance, a landmark in creative access. Kinetic Light\'s app lets audience members choose among multiple AD tracks for the same show, with different voices, styles, and perspectives. Freely documented and open source.', type: 'org', tags: ['FREE', 'Disabled Voice', 'Open Access'] },

      { name: 'VocalEye, Live Performance Audio Description', url: 'https://vocaleye.ca', description: 'Canada\'s leading organization for live performance audio description. Offers freely available guidelines for live theater AD, describer training resources, and guidance for dance and experimental performance. Among the best published live AD resources in the English-speaking world.', type: 'org', tags: ['FREE'], location: 'Canada' },

      { name: 'VocalEyes (UK)', url: 'https://vocaleyes.co.uk', description: 'The UK\'s leading audio description organization for live arts, visual arts, heritage, and live performance. Distinct from VocalEye Canada: VocalEyes UK provides audio description at major UK galleries, museums, and performing arts venues, and offers the most comprehensive free training guidance for live performance AD in the UK context. Operates under the Equality Act 2010\'s anticipatory duty. Essential for any UK practitioner or organization.', type: 'org', tags: ['FREE'], location: 'United Kingdom' },

      { name: 'RNIB, Audio Description Resources', url: 'https://www.rnib.org.uk', description: 'Royal National Institute of Blind People. UK standards and advocacy for AD in theater, film, and broadcasting. Produces guidance documents for venues and broadcasters, and advocates for AD quality and availability under the Equality Act.', type: 'org', tags: ['FREE'], location: 'United Kingdom' },

      { name: 'Audio Description Association UK (ADUK)', url: 'https://adassociation.org.uk', description: 'UK training and standards body for live theater audio description. Guides for describers and theater producers on commissioning and delivering quality live AD, including the specific requirements of the Equality Act 2010.', type: 'org', tags: ['FREE'], location: 'United Kingdom' },

      { name: 'Access2Arts', url: 'https://access2arts.org.au', description: 'Adelaide-based Australian organization offering the country\'s most developed professional training in audio description and captioning for the arts. Their 12-week AD course is a leading professional training program in the Asia-Pacific region. Free introductory resources; the longer courses are paid professional training.', type: 'org', tags: ['FREE'], location: 'Adelaide, SA' },

      { name: 'ArtSpark', url: 'https://www.artsparktx.org', description: 'Austin-based nonprofit dedicated to making live arts accessible through audio description. Provides AD services for theater, dance, and live performance in Central Texas, and advocates for audio description as standard practice at arts venues. A community-rooted model for regional AD infrastructure outside major coastal arts centers.', type: 'org', tags: ['FREE'], location: 'Austin, TX' },

      { name: 'Audio Description Training Retreats', url: 'https://www.adtrainingretreats.com', description: 'Virtual professional training in all aspects of audio description, film, television, live performance, and visual art, taught by blind and sighted professionals. Small classes with individual practice time and peer/expert feedback. Graduate network spans 17+ countries. One of the most accessible professional AD training programs available internationally.', type: 'course', tags: ['FREE'] },

      { name: 'Arts Access North Carolina', url: 'https://artsaccessinc.org', description: 'Raleigh-based nonprofit offering annual audio description training, describer workshops, and AD services for arts organizations. One of the clearest regional models in the US for building local AD infrastructure, with an Artist Link directory and community education programs alongside hands-on training.', type: 'org', tags: ['FREE'], location: 'Raleigh, NC' },

      { name: 'Reid My Mind Radio', url: 'https://reidmymind.com', description: 'Podcast and media platform by Thomas Reid, blind filmmaker, audio description narrator, and educator. Widely regarded as the most important ongoing practitioner resource for audio description craft: interviews with AD writers, blind consultants, and filmmakers. Reid was the narrator for the first open AD screening in Sundance history (Joybubbles, 2026). His framing, "better is better" over perfectionism, is essential for small organizations starting out.', type: 'media', tags: ['FREE', 'Disabled Voice'] },

      { name: 'DCMP Description Key', url: 'https://dcmp.org/learn/descriptionkey', description: 'The detailed, free companion to the DCMP Captioning Key: a thorough standard for writing description of educational media, developed with the American Foundation for the Blind. Covers what to describe, word choice, timing, and voicing. Among the most-referenced AD writing standards in the US, and a strong free training text.', type: 'standard', tags: ['FREE'], location: 'United States' },
      { name: 'VocalEyes: Describing Diversity', url: 'https://vocaleyes.co.uk/research/describing-diversity/', description: 'A free, field-shaping research report on when and how to describe people\'s visible characteristics (race, gender, disability, age, body) in theater audio description, produced with Royal Holloway, University of London. Includes twelve principles for describers and recommendations for theaters. Essential reading for anyone wrestling with identity and representation in AD.', type: 'guide', tags: ['FREE'], location: 'United Kingdom' },
      { name: 'UniDescription Project', url: 'https://unidescription.org', description: 'A free, open-access, open-source research project (University of Hawaii with the National Park Service) advancing audio description of the visual world. The free UniD app delivers audio-described park brochures for 200 or more National Park sites, and the UniD Academy and library offer training. A leading model for describing places and printed materials, not just film.', type: 'org', tags: ['FREE', 'Open Access'] },
      { name: 'Audio Description Associates (Joel Snyder)', url: 'https://audiodescribe.com/training/', description: 'Audio description training from Joel Snyder, one of the first US describers (working since 1981) and author of The Visual Made Verbal. Offers workshops from 45 minutes to multi-day intensives for communities building AD services for live performing arts. One of the longest-established AD training providers in the country.', type: 'course' },
      { name: 'Cheryl Green: Media Access (Who Am I To Stop It)', url: 'https://whoamitostopit.com/media-accessibility/', description: 'Resources and practical writing from Cheryl Green, an access artist who frames captioning and audio description as creative, justice-centered craft rather than a technical add-on. Free articles (including "Audio Description as a Tool for Equity") and credit-line templates. A vital practitioner perspective for arts organizations who want access done with care.', type: 'guide', tags: ['FREE', 'Disabled Voice'] },
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
    description: 'Making websites, apps, and digital content accessible, testing tools, design guidelines, screen readers, and media players. The technical layer most digital teams need.',
    resources: [

      { name: 'W3C WAI Tutorials', url: 'https://www.w3.org/WAI/tutorials', description: 'Free authoritative tutorials for making specific content types accessible: images, tables, forms, carousels, and menus. Applicable everywhere.', type: 'guide', tags: ['FREE', 'Open Access'] },

      { name: 'WebAIM, Web Accessibility In Mind', url: 'https://webaim.org', description: 'The best free practical web accessibility resource, run by Utah State University. Articles, guides, the WAVE browser tool, and the Screen Reader User Survey, which is the most important data on how disabled people actually use the web.', type: 'org', tags: ['FREE'] },

      { name: 'The A11y Project', url: 'https://www.a11yproject.com', description: 'Community-maintained free resource with accessibility patterns, checklists, and articles for developers and designers. Practical, current, and well-organized. One of the best free resources for the practical "how do I implement this?" questions.', type: 'guide', tags: ['FREE', 'Open Access'] },

      { name: 'Microsoft Inclusive Design Toolkit', url: 'https://www.microsoft.com/design/inclusive', description: 'Free framework: Recognize Exclusion, Learn from Diversity, Solve for One Extend to Many. Introduces the "persona spectrum" model of permanent, temporary, and situational disability, a powerful reframe for non-disability-specialist designers.', type: 'guide', tags: ['FREE'] },

      { name: 'BBC GEL Accessibility Guidelines', url: 'https://www.bbc.co.uk/gel/guidelines/accessibility', description: 'Among the most thorough publicly available design system accessibility guidelines in the world. The BBC is legally required to meet OFCOM captioning and audio description standards, their guidelines reflect that. Includes disability personas, visual design standards, and content guidelines.', type: 'standard', tags: ['FREE'], location: 'United Kingdom' },

      { name: 'NVDA Screen Reader', url: 'https://www.nvaccess.org', description: 'The most widely used free, open-source screen reader for Windows, developed in Australia, used worldwide. Essential for manual accessibility testing and for understanding how blind users experience the web. Free download.', type: 'tool', tags: ['FREE', 'Open Access'] },

      { name: 'axe DevTools Browser Extension', url: 'https://www.deque.com/axe', description: 'Industry-standard free accessibility testing extension for Chrome and Firefox. Catches approximately 30% of accessibility issues automatically. Used by accessibility professionals worldwide.', type: 'tool', tags: ['FREE'] },

      { name: 'WAVE, Web Accessibility Evaluation Tool', url: 'https://wave.webaim.org', description: 'Free browser-based accessibility checker. Visual overlay shows errors and warnings directly on your page, great for quick checks and for learning what to look for.', type: 'tool', tags: ['FREE'] },

      { name: 'Google Lighthouse', url: 'https://developers.google.com/web/tools/lighthouse', description: 'Free accessibility auditing tool built into Chrome DevTools. No installation needed, open any page in Chrome, open DevTools, go to Lighthouse. Generates an accessibility score and flags common issues.', type: 'tool', tags: ['FREE'] },

      { name: 'Colour Contrast Analyser (TPGi)', url: 'https://www.tpgi.com/color-contrast-checker', description: 'Free desktop tool (Mac and Windows) for checking specific color values against WCAG contrast requirements. Works on any color anywhere on screen, including colors in design software. Essential for designers.', type: 'tool', tags: ['FREE'] },

      { name: 'IBM Equal Access Checker', url: 'https://www.ibm.com/able/toolkit', description: 'Free open-source accessibility checker from IBM with detailed reporting. A strong complement to axe, catches different classes of issues. Includes an accessibility toolkit for teams building accessible products.', type: 'tool', tags: ['FREE', 'Open Access'] },

      { name: 'Able Player', url: 'https://ableplayer.github.io/ableplayer/', description: 'Free, MIT-licensed, open-source media player with excellent WCAG compliance. Supports audio description tracks, caption tracks (WebVTT, SRT, SBV), chapter navigation, keyboard control, and transcript view. The best free option for organizations hosting video online.', type: 'tool', tags: ['FREE', 'Open Access'] },

      { name: 'Ace by DAISY, EPUB Accessibility Checker', url: 'https://daisy.org/activities/software/ace/', description: 'Free, open-source tool from the DAISY Consortium for checking EPUB accessibility compliance (EPUB Accessibility 1.1). Essential for any organization publishing digital books or documents. Works on Mac, Windows, Linux.', type: 'tool', tags: ['FREE', 'Open Access'] },

      { name: 'Accessibility Insights', url: 'https://accessibilityinsights.io', description: 'Free browser extension and desktop app from Microsoft for thorough accessibility testing. FastPass catches common WCAG violations instantly; Assessment mode walks testers through a full WCAG 2.1 AA evaluation with step-by-step guidance. More systematic than axe or WAVE, the best free tool for a complete manual audit.', type: 'tool', tags: ['FREE', 'Open Access'] },

      { name: 'Who Can Use', url: 'https://whocanuse.com', description: 'Free color contrast tool that shows how a color combination affects people with different types of color blindness, low vision, and other visual conditions, not just a pass/fail contrast ratio. Uniquely useful for designers: see the real impact of your palette choices across the disability spectrum before you build.', type: 'tool', tags: ['FREE', 'Open Access'] },

      { name: 'Learn Accessibility, web.dev', url: 'https://web.dev/learn/accessibility/', description: 'Google\'s comprehensive free accessibility course, structured, practical, and kept current. Covers ARIA, keyboard navigation, color and contrast, forms, images, video, and testing. One of the best self-paced learning resources for developers and designers building accessible digital content.', type: 'course', tags: ['FREE', 'Open Access'] },

      { name: 'Deque University', url: 'https://dequeuniversity.com', description: 'The most widely recognized professional training program for web accessibility. Paid courses on WCAG, ARIA, screen reader testing, and accessible development, used by accessibility specialists, QA engineers, and designers at organizations of all sizes. Offers free introductory content. If your team is investing in one paid accessibility training, Deque University is the field standard.', type: 'course', tags: [] },

      { name: 'ARIA Authoring Practices Guide (APG)', url: 'https://www.w3.org/WAI/ARIA/apg/', description: 'The W3C\'s free library of accessible UI patterns (menus, dialogs, tabs, accordions, comboboxes) with keyboard interaction models and working code examples. The go-to reference when you need to build a custom component correctly instead of guessing at ARIA. Authoritative and continuously maintained.', type: 'guide', tags: ['FREE', 'Open Access'] },
      { name: 'How to Meet WCAG (Quick Reference)', url: 'https://www.w3.org/WAI/WCAG22/quickref/', description: 'The W3C\'s filterable, customizable WCAG checklist: every success criterion with techniques, filterable by level (A, AA, AAA) and technology. Essentially the working WCAG checklist most teams actually use for audits and sign-off. Free and authoritative.', type: 'standard', tags: ['FREE', 'Open Access'] },
      { name: 'WebAIM Contrast Checker', url: 'https://webaim.org/resources/contrastchecker/', description: 'The most widely used free web tool for checking text color contrast against WCAG AA and AAA. Enter two hex values and instantly see pass or fail for normal and large text. The fastest way to settle a color-contrast question, and a companion Link Contrast Checker covers the 3:1 link rule.', type: 'tool', tags: ['FREE'] },
      { name: 'Pa11y', url: 'https://pa11y.org', description: 'Free, open-source command-line accessibility testing tool. Built for automation: run WCAG and Section 508 checks across your pages in a CI pipeline and get JSON, CSV, or HTML reports. The standard free choice for teams that want accessibility regressions caught automatically on every build.', type: 'tool', tags: ['FREE', 'Open Access'] },
      { name: 'Sa11y', url: 'https://sa11y.netlify.app', description: 'Free, open-source accessibility checker built for content authors rather than developers. A small bookmarklet or CMS plugin (WordPress, Drupal, Joomla) visually flags issues like missing alt text and bad heading order right on the page, with plain-language fixes. No tracking or data collection. Maintained by Toronto Metropolitan University.', type: 'tool', tags: ['FREE', 'Open Access'] },
      { name: 'Editoria11y', url: 'https://editoria11y.com', description: 'Free, open-source accessibility checker that gives content authors live feedback as they type in CKEditor, TinyMCE, and Gutenberg, with site-wide reporting for admins. Built in parallel with Sa11y and focused on the mistakes a content author can actually fix. Plugins for Drupal, WordPress, and more. A great fit for arts organizations with non-technical staff updating the site.', type: 'tool', tags: ['FREE', 'Open Access'] },
      { name: 'GOV.UK Design System: Accessibility', url: 'https://design-system.service.gov.uk/accessibility/', description: 'The accessibility guidance behind the UK government\'s widely admired design system: how to use semantic HTML, test with assistive technology, and avoid introducing barriers even with accessible components. Free, practical, and battle-tested at enormous scale. A strong model for any team building or maintaining a design system.', type: 'guide', tags: ['FREE'], location: 'United Kingdom' },
      { name: 'GOV.UK Accessibility: Dos and Don\'ts Posters', url: 'https://accessibility.blog.gov.uk/2016/09/02/dos-and-donts-on-designing-for-accessibility/', description: 'The UK Home Office\'s famous set of one-page posters distilling design dos and don\'ts for users who are autistic, blind, low-vision, D/deaf, dyslexic, or have motor impairments. Free, Creative Commons licensed, translated into many languages, and ideal for putting accessibility principles in front of a whole team at a glance.', type: 'guide', tags: ['FREE', 'Open Access'], location: 'United Kingdom' },
      { name: 'Coyote', url: 'https://coyote.pics', description: 'Free, open-source image-description tool and API born from a partnership between the Museum of Contemporary Art Chicago and Prime Access Consulting. Supports a distributed workflow for authoring, reviewing, and publishing alt text and long descriptions at scale. Built for cultural institutions with large image collections to describe.', type: 'tool', tags: ['FREE', 'Open Access'] },
      { name: 'Cooper Hewitt: Guidelines for Image Description', url: 'https://www.cooperhewitt.org/cooper-hewitt-guidelines-for-image-description/', description: 'A free, thoughtful framework from the Smithsonian\'s design museum for writing image descriptions and alt text, covering subject, color, medium, and the sensitive question of how to describe people. Goes beyond mechanics into sensory and narrative description. One of the best museum-developed references for writing alt text with craft.', type: 'guide', tags: ['FREE'] },
      { name: 'PAC: PDF Accessibility Checker', url: 'https://pac.pdf-accessibility.org/en', description: 'The standard free tool for checking PDF accessibility against PDF/UA and WCAG, maintained by the PDF Association. Drag in a file and get an instant report. Essential for any organization publishing PDF programs, reports, or documents, since inaccessible PDFs are one of the most common access failures. Windows only.', type: 'tool', tags: ['FREE'] },
      { name: 'Apple VoiceOver: Getting Started Guide', url: 'https://support.apple.com/guide/voiceover/welcome/mac', description: 'Apple\'s official user guide for VoiceOver, the screen reader built into every Mac, iPhone, and iPad. Free and essential for manual testing: VoiceOver is the screen reader many disabled people use on Apple devices, so testing with it (alongside NVDA on Windows) is part of any real accessibility check. The iPhone version includes a built-in practice mode.', type: 'guide', tags: ['FREE'] },
      { name: 'Accessible Social', url: 'https://www.accessible-social.com', description: 'A free resource hub by social media strategist Alexa Heinrich on making social media content accessible: writing alt text, captioning video, camel-case hashtags, emoji use, and platform-specific quirks. Includes free guidebooks and a checklist. Directly useful for arts organizations promoting events and artists online.', type: 'guide', tags: ['FREE'] },
      { name: 'Stark', url: 'https://www.getstark.co', description: 'An accessibility tool suite that plugs into design tools (Figma, Sketch, Adobe XD) to check color contrast, simulate color blindness and low vision, set focus order, and suggest alt text while you design. Freemium: a free tier covers basic contrast and vision simulation, with paid plans for the full suite. Catching issues at the design stage is far cheaper than fixing them later.', type: 'tool', tags: ['Freemium'] },
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
    description: 'Making in-person performances, venues, and events accessible, relaxed performances, hearing loops, GalaPro captions, ASL interpretation, accessible ticketing, sensory accommodations, and the organizations that have built models worth studying.',
    resources: [

      { name: 'Kennedy Center, VSA Arts Access Resources', url: 'https://www.kennedy-center.org/education/vsa', description: 'Free tip sheets, staff training guides, and professional development resources for US arts organizations. Covers physical access, communication access, and programming for disabled audiences and artists. VSA is part of the Kennedy Center\'s national accessibility work.', type: 'guide', tags: ['FREE'], location: 'United States' },

      { name: 'Kennedy Center LEAD Research & Resources', url: 'https://www.kennedy-center.org/education/networks-conferences-and-research/research-and-resources/lead-research-and-resources', description: 'Leadership Exchange in Arts and Disability (LEAD), free tip sheets, guides, and video resources on physical access, communication access, assistive listening, and programming for diverse disability communities. The US field\'s go-to professional development conference materials.', type: 'guide', tags: ['FREE'], location: 'United States' },

      { name: 'Theatre Development Fund (TDF)', url: 'https://www.tdf.org', description: 'NYC nonprofit and national model for theater accessibility. Resources on captioning, audio description, and Deaf/hard of hearing access. Pioneered open captions and GalaPro integration in New York theater. Their online resources are useful for any US theater.', type: 'org', tags: ['FREE'], location: 'New York City' },

      { name: 'League of Chicago Theatres, Accessibility Resources', url: 'https://leagueofchicagotheatres.org/accessibility-resources', description: 'Free toolkit for theater organizations covering physical access, captioning, audio description, relaxed performances, and sensory-friendly programming. A strong regional model with broad applicability for mid-sized US theater companies.', type: 'guide', tags: ['FREE'], location: 'Chicago, IL' },

      { name: 'GalaPro', url: 'https://galapro.com', description: 'Free smartphone app delivering synchronized captions or audio description to live theater performances. Audience members download the app and receive captions tied to the show in real time. Used at Broadway and major regional venues, allows Deaf/HoH patrons to sit anywhere in the house.', type: 'tool', tags: ['FREE'] },

      { name: 'Society of London Theatre, Relaxed Performance Guidelines', url: 'https://officiallondontheatre.com/access', description: 'Standard UK guidelines for relaxed/sensory-friendly performances, adjusted sensory environment, chill-out rooms, visual stories, and staff briefing. Developed in London theater, now adopted internationally as the benchmark model.', type: 'guide', tags: ['FREE'], location: 'United Kingdom' },

      { name: 'Attitude is Everything, Charter of Best Practice', url: 'https://www.attitudeiseverything.org.uk', description: 'UK benchmark framework for accessible live music venues and festivals. Bronze/Silver/Gold Charter levels, adopted by hundreds of UK venues. Their annual State of Access Reports (based on first-person Deaf and disabled fan data) are the most important evidence base for accessible live music.', type: 'guide', tags: ['FREE'], location: 'United Kingdom' },

      { name: 'Graeae Theatre Company, Access Resources', url: 'https://graeae.org/accessibility', description: 'The foundational UK disability-led theater company (founded 1980). Graeae integrates captioning, BSL, and audio description as theatrical language, not add-ons. Free resources and case study material for any arts organization. Co-directed the 2012 Paralympic Opening Ceremony. Internationally significant.', type: 'org', tags: ['FREE', 'Disabled Voice'], location: 'London, UK' },

      { name: 'Stagetext', url: 'https://www.stagetext.org', description: 'The UK\'s leading organization for live theater captioning for Deaf, deafened, and hard of hearing audiences. Stagetext provides live captioning at hundreds of UK theater performances annually, trains captioners, maintains quality standards, and publishes free guidance for venues on how to caption live theater. The UK counterpart to TDF (New York), their free resources on commissioning and delivering live theater captions are the best available for UK practitioners.', type: 'org', tags: ['FREE', 'Deaf-Centered'], location: 'United Kingdom' },

      { name: 'HowlRound Theatre Commons, Disability & Accessibility Archive', url: 'https://howlround.com/tags/disability-and-accessibility', description: 'Free, globally accessible archive of essays, articles, and recorded conversations on disability aesthetics, accessibility in theater, and disabled theater artists. HowlRound TV provides free open-access livestreaming and a permanent video archive.', type: 'org', tags: ['FREE'] },

      { name: 'Cultural Access Collaborative', url: 'https://culturalaccesscollaborative.org', description: 'US community of cultural administrators and disabled people working to remove access barriers. Offers free professional development workshops, an equipment loan program, and a shared-access calendar. Strong disability-centered approach.', type: 'org', tags: ['FREE'], location: 'United States' },

      { name: 'Hearing Loss Association of America (HLAA)', url: 'https://www.hearingloss.org', description: 'US advocacy for hearing loop installation in venues nationwide. Includes a free Loopfinder directory of loop-equipped venues. Essential for understanding hearing loop technology as best practice and for advocating for loop installation at US arts venues.', type: 'org', tags: ['FREE'], location: 'United States' },

      { name: 'AccessibilityOnline, Arts-n-Rec Webinar Series', url: 'https://www.accessibilityonline.org/training', description: 'Free ongoing webinar series on ADA issues in arts, performance, museums, zoos, exhibitions, concerts, fairs, and recreation, one of the best free ongoing professional development resources for US arts accessibility professionals.', type: 'course', tags: ['FREE'], location: 'United States' },

      { name: 'ADA National Network, Accessibility Online Webinars', url: 'https://adata.org/training/accessibility-online-webinars', description: 'Free webinars on ADA accessibility topics with recorded sessions available in a searchable archive. The regional ADA Centers host these regularly, accessible professional development for US arts practitioners.', type: 'course', tags: ['FREE'], location: 'United States' },

      { name: 'Mid Atlantic Arts, Disability Justice Webinar Series', url: 'https://www.midatlanticarts.org/opportunity/accessibility-training', description: 'Webinar series for local and state arts agencies going beyond compliance to center disability justice frameworks. Partnered with Americans for the Arts. Free and recorded for later viewing.', type: 'course', tags: ['FREE'], location: 'United States' },

      { name: 'Shape Arts (UK)', url: 'https://shapearts.org.uk', description: 'UK disability arts development organization. Free access consultancy resources, articles, and guidance for cultural organizations. Strong on the intersection of access and artistic identity, particularly useful for UK arts administrators navigating the Equality Act.', type: 'org', tags: ['FREE'], location: 'United Kingdom' },

      { name: 'Accessible Arts NSW', url: 'https://aarts.net.au', description: 'New South Wales-based arts and disability organization. Free training, resources, and advocacy for accessible arts programming in NSW and applicable more broadly across Australia.', type: 'org', tags: ['FREE'], location: 'New South Wales' },

      { name: 'Arts Access Aotearoa', url: 'https://artsaccess.org.nz', description: 'New Zealand\'s national organization for arts and disability. Free resources and advocacy for accessible arts, accessible venues, and disability arts programming across Aotearoa New Zealand.', type: 'org', tags: ['FREE'], location: 'New Zealand' },

      { name: 'KultureCity', url: 'https://kulturecity.org', description: 'Sensory accessibility certification and training for venues, sports arenas, cultural institutions, and events. Their Sensory Inclusive™ certification is held by hundreds of NFL stadiums, NBA arenas, museums, and concert halls. Free app lets patrons find certified venues nearby and request sensory bags, provided at no cost at certified locations. Practical and scalable model for neurodivergent and sensory-sensitive audiences.', type: 'org', tags: ['FREE', 'Neurodivergent'], location: 'United States' },

      { name: 'ABLE Ensemble', url: 'https://ableensemble.com', description: 'Chicago-based professional performing arts company creating and performing work by and with artists with disabilities. A leading disability-led theater in the Midwest, one of the clearest examples of disabled artists as full creative agents, not subjects.', type: 'org', tags: ['Disabled Voice'], location: 'Chicago, IL' },

      { name: 'Theater Breaking Through Barriers', url: 'https://tbtb.org', description: 'New York professional theater company (formerly Theatre By The Blind) integrating blind, visually impaired, and sighted artists. Productions build integrated visual description into staging and direction, access as artistic form, not retrofit. Over 50 years of practice.', type: 'org', tags: ['FREE', 'Disabled Voice'], location: 'New York City' },

      { name: 'Arts Midwest Accessibility Center', url: 'https://www.artsmidwest.org/resources/accessibility', description: 'Free resource hub from Arts Midwest covering physical access, communication access, sensory accommodations, digital accessibility, and virtual programming, curated specifically for arts and cultural organizations. Includes links to ADA guidance, captioning how-tos, image description resources, and accessible event planning tools. A strong aggregator for any organization starting its accessibility work.', type: 'guide', tags: ['FREE'], location: 'United States' },

      { name: 'Society of London Theatre (SOLT): Access', url: 'https://solt.co.uk/access/', description: 'SOLT maintains the central access hub for London theatre, including a regularly updated diary of captioned, audio described, BSL-interpreted, and relaxed performances across West End and member venues. The reference point for how the UK industry coordinates and publicizes access performances. Free to use.', type: 'guide', tags: ['FREE'], location: 'United Kingdom' },
      { name: 'UK Theatre: Access Resources', url: 'https://uktheatre.org/resource-tag/access/', description: 'Free sector guidance from UK Theatre on running accessible and relaxed performances, inclusive casting, and disability inclusion for theatres outside London. Connects venues with access providers like Graeae and Create Access. A practical companion to the SOLT access diary.', type: 'guide', tags: ['FREE'], location: 'United Kingdom' },
      { name: 'Candoco Dance Company', url: 'https://candoco.co.uk', description: 'The UK\'s leading company creating dance by and with disabled and non-disabled artists (founded 1991). Candoco treats access as artistic material and runs widely respected artist development and education programs. A foundational case study for integrated dance internationally. Free resources and performance documentation online.', type: 'org', tags: ['FREE', 'Disabled Voice'], location: 'United Kingdom' },
      { name: 'Theater HORA', url: 'https://www.theater-hora.ch', description: 'Zurich-based professional theatre whose ensemble members all have cognitive disabilities, widely regarded as one of the most artistically rigorous disability-led companies in continental Europe. Their collaboration with Jerome Bel, Disabled Theater (2012), is a landmark in disability performance studies. Winner of the Swiss Grand Prix Theatre.', type: 'org', tags: ['Disabled Voice'], location: 'Switzerland' },
      { name: 'Theater RambaZamba', url: 'https://rambazamba-theater.de/en', description: 'Berlin inclusive theatre (founded 1991) bringing professional actors with and without disabilities together for roughly 100 performances a season, with a repertoire spanning contemporary and classical work performed with full theatrical seriousness. A model emerging from the German disability rights movement. Free education programs for schools.', type: 'org', tags: ['Disabled Voice'], location: 'Germany' },
      { name: 'Nalaga\'at Center', url: 'https://nalagaat.org.il', description: 'Jaffa-based arts center run by and for Deaf, blind, and DeafBlind people. Their production Not by Bread Alone, performed entirely by DeafBlind actors, is one of the most original works of disability theatre anywhere, and the center also runs a dark restaurant and tactile workshops. DeafBlind self-representation as artistic practice.', type: 'org', tags: ['Disabled Voice'], location: 'Israel' },
      { name: 'Europe Beyond Access', url: 'https://www.europebeyondaccess.com', description: 'Major Creative Europe program supporting disabled artists to push the boundaries of theatre and dance across the continent. Publishes free resources, research, and artist profiles, and runs international showcases and professional development. The most significant pan-European disability performing-arts initiative. Free to read.', type: 'org', tags: ['FREE', 'Disabled Voice'] },
      { name: 'Art-Reach', url: 'https://www.art-reach.org', description: 'Philadelphia nonprofit removing economic and disability barriers to cultural participation. Runs the ACCESS Card program offering deeply discounted museum and arts admission for people with disabilities and those on public assistance, plus accessibility consulting and training for cultural organizations. A leading US regional model for cultural access infrastructure.', type: 'org', tags: ['FREE'], location: 'Philadelphia, PA' },
      { name: 'National Arts and Disability Center (NADC), UCLA', url: 'https://www.nadc.ucla.edu', description: 'University-based national center providing free resources, technical assistance, and a directory of disabled artists. Covers arts programming, careers for disabled artists, and accessible cultural organizations. A core US research-and-referral hub for the arts and disability field.', type: 'org', tags: ['FREE'], location: 'United States' },
      { name: 'National Court Reporters Association (NCRA)', url: 'https://www.ncra.org', description: 'The US professional body for stenographic captioners. Maintains the Certified Realtime Captioner (CRC) credential and a searchable directory for finding qualified CART providers for live events, theatre, and conferences. The place to source vetted live captioners in the US.', type: 'org', tags: [], location: 'United States' },
      { name: 'Half Access', url: 'https://halfaccess.org', description: 'Disability-led nonprofit making live music more accessible. Maintains a crowdsourced database of venue accessibility details (entrances, seating, bathrooms, parking) submitted by disabled concertgoers, and advocates directly with venues and promoters. The US counterpart to the UK\'s Attitude is Everything, built from first-person experience.', type: 'org', tags: ['FREE', 'Disabled Voice'], location: 'United States' },

      { name: 'Access Docs for Artists', url: 'https://www.accessdocsforartists.com', description: 'A free guide to writing an access doc (access rider), created by disabled artists Leah Clements, Alice Hattrick, and Lizzy Rose. Explains what an access doc is, why artists need one, and how to write and send one, with real examples. The go-to starting point for any disabled artist formalizing their access needs with venues and institutions.', type: 'guide', tags: ['FREE', 'Disabled Voice'] },

      { name: 'Hidden Disabilities Sunflower', url: 'https://hdsunflower.com', description: 'The Sunflower lanyard scheme is a globally recognized, discreet signal that a person has a non-visible disability and may need extra time or support. Widely adopted by airports, transit, and increasingly arts venues. Their site offers free guidance for organizations on training staff to recognize and respond to the Sunflower.', type: 'guide', tags: ['FREE'] },
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

      { name: 'FWD-Doc, Full Resources Hub', url: 'https://fwd-doc.org/resources', description: 'Complete international resources hub from FWD-Doc: a global intersectional community of disabled documentary film creators and allies. Includes a 62-page free toolkit covering disability inclusion across development, production, post-production, and exhibition.', type: 'org', tags: ['FREE'] },

      { name: 'Accessible Filmmaking Guide', url: 'https://accessiblefilmmaking.wordpress.com', description: 'Academic and practical guide on accessible and inclusive filmmaking, developed in part through Canadian and UK research collaboration. Covers accessibility for disabled cast and crew as well as accessible output. Free to read online.', type: 'guide', tags: ['FREE', 'Open Access'] },

      { name: 'IDA Nonfiction Access Initiative', url: 'https://www.documentary.org/nonfiction-access-initiative/resources', description: 'International Documentary Association\'s free resource hub for nonfiction accessibility in the US and internationally. Includes the 2024 report on accessibility and support for disabled nonfiction media makers.', type: 'org', tags: ['FREE'] },

      { name: 'Inevitable Foundation', url: 'https://inevitable.foundation', description: 'Mentorship, script development support, and research on disability inclusion for disabled writers in Hollywood. Free guides on disability representation in screenwriting. An important entry point for industry inclusion advocacy.', type: 'org', tags: ['FREE'], location: 'United States' },

      { name: 'USC Annenberg Inclusion Initiative', url: 'https://annenberg.usc.edu/research/aii', description: 'Free research reports on disability representation and hiring in film and television, including the landmark "Inequality in 1,300 Popular Films." Essential data for evidence-based arguments about US industry change.', type: 'org', tags: ['FREE', 'Open Access'], location: 'United States' },

      { name: 'RespectAbility', url: 'https://www.respectability.org', description: 'US coalition with resources on disability inclusion in entertainment. Runs an Entertainment Lab for disabled writers and a free Media Guide for journalists and critics covering disability representation.', type: 'org', tags: ['FREE'], location: 'United States' },

      { name: 'RespectAbility, Media Guide for Journalists', url: 'https://www.respectability.org/representing-disability', description: 'Free US guide for journalists and critics covering language, sourcing, and common mistakes in writing about disability. Accessible and practical, good for newsrooms and arts publications.', type: 'guide', tags: ['FREE'], location: 'United States' },

      { name: 'Superfest Disability Film Festival', url: 'https://longmoreinstitute.sfsu.edu/superfest', description: 'World\'s longest-running disability film festival, hosted by the Paul K. Longmore Institute on Disability at San Francisco State University. All films are captioned and audio described. Centers disabled perspectives and filmmakers. The benchmark for film festival accessibility practice. Free public screenings.', type: 'org', tags: ['FREE'], location: 'San Francisco Bay Area' },

      { name: 'ReelAbilities Film Festival', url: 'https://reelabilities.org', description: 'US disability-focused film festival with strong access practices, free educational programming, and chapters in 20+ cities. An important showcase for disability-centered storytelling with broad geographic reach.', type: 'org', tags: ['FREE'], location: '20+ US Cities' },

      { name: 'Disability Film Challenge', url: 'https://www.disabilityfilmchallenge.com', description: 'Annual US filmmaking competition promoting authentic disability storytelling by and with disabled creators. Free to enter. Held at Sony Pictures Studios (Los Angeles). Good gateway for emerging disabled filmmakers.', type: 'org', tags: ['FREE'], location: 'Los Angeles, CA' },

      { name: 'FilmDis', url: 'https://www.filmdis.com', description: 'Disability media-monitoring organization founded by filmmaker Dom Evans (it began as a Twitter conversation in 2014). Researches representation of disabled people in film, TV, and games, and consults for studios and journalists on authentic portrayal. A disabled-led watchdog and education resource. Free to read.', type: 'org', tags: ['FREE', 'Disabled Voice'] },
      { name: '1IN4 Coalition', url: 'https://www.1in4coalition.org', description: 'Coalition of disabled creatives working to change representation and hiring in film and television, named for the roughly one in four people who are disabled. Advocacy, community, and industry resources centering disabled writers, directors, and crew. Free to access.', type: 'org', tags: ['FREE', 'Disabled Voice'], location: 'United States' },
      { name: 'Sprout Film Festival', url: 'https://gosprout.org/film/', description: 'Long-running festival presenting films by and about people with intellectual and developmental disabilities, touring screenings nationally. One of the few festivals centering intellectual and developmental disability representation, an area often overlooked in disability film culture. Run by the nonprofit Sprout.', type: 'org', tags: [], location: 'New York City' },
      { name: 'Disability Belongs: Entertainment and News Media', url: 'https://disabilitybelongs.org/entertainment/', description: 'Disability Belongs (formerly RespectAbility) runs an entertainment program with a Hollywood lab for disabled creatives and free guides for studios, journalists, and critics on authentic disability representation. The entertainment industry arm of one of the most active US disability inclusion organizations. Free resources.', type: 'org', tags: ['FREE'], location: 'United States' },
      { name: 'Audio Description Project: Described Media Database', url: 'https://adp.acb.org/adp-search', description: 'The American Council of the Blind\'s continually updated master list of audio described films, DVDs and Blu-rays, and streaming titles, with notes on where AD is available. The single best place to find which films have audio description and how to access it. Free.', type: 'tool', tags: ['FREE'], location: 'United States' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 7. DEAF CULTURE & ASL
  // "I'm working with Deaf artists or audiences / I want to understand ASL and Deaf identity."
  // Resources centering the Deaf community as a cultural and linguistic community,   // not just "people who can't hear." Distinct from captioning (which is technique);
  // this is about identity, history, aesthetics, and advocacy.
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'deaf-asl',
    title: 'Deaf Culture & ASL',
    emoji: '🤟',
    description: 'Resources centering the Deaf community as a cultural and linguistic community, history, advocacy, Deaf theater, ASL linguistics. Distinct from the Captioning section (technique); this is about identity and cultural practice.',
    resources: [

      { name: 'National Association of the Deaf (NAD)', url: 'https://www.nad.org', description: 'The leading US Deaf advocacy organization. Free position papers on captioning, cochlear implants, ASL recognition, and Deaf civil rights. Essential reading for understanding the Deaf community\'s own advocacy positions, not what hearing organizations say about Deaf people.', type: 'org', tags: ['FREE', 'Deaf-Centered'], location: 'United States' },

      { name: 'Gallaudet University Press', url: 'https://gupress.gallaudet.edu', description: 'The world\'s leading publisher of Deaf-centered academic and cultural writing, based in Washington DC. Some titles available open access. Essential for understanding Deaf culture, ASL linguistics, and Deaf history from the inside.', type: 'org', tags: ['FREE', 'Deaf-Centered', 'Open Access'], location: 'Washington DC' },

      { name: 'Through Deaf Eyes (PBS, 2007)', url: 'https://www.pbs.org/weta/throughdeafeyes', description: 'Free two-hour documentary on 200 years of Deaf culture in America, covers Deaf history, ASL literature, Deaf education, the cochlear implant debate, and Deaf arts. One of the best entry points for hearing practitioners new to Deaf culture.', type: 'media', tags: ['FREE', 'Deaf-Centered'] },

      { name: 'World Federation of the Deaf (WFD)', url: 'https://wfdeaf.org', description: 'International advocacy for sign language recognition and Deaf rights globally. Free resources on international Deaf policy, sign language recognition campaigns, and CRPD Article 30.4 (explicit recognition of Deaf cultural identity in international law).', type: 'org', tags: ['FREE', 'Deaf-Centered'] },

      { name: 'National Theatre of the Deaf', url: 'https://www.ntd.org', description: 'The longest-running professional touring theater company in the US (established 1967). Pioneer of theatrical ASL, their work shaped how theater engages with Deaf communities. Free resources and history available online.', type: 'org', tags: ['FREE', 'Deaf-Centered'], location: 'US, Touring' },

      { name: 'Deaf West Theatre', url: 'https://deafwest.org', description: 'Los Angeles company integrating ASL and spoken English as co-equal theatrical languages. Known for Spring Awakening (Broadway 2015). Foundational case study in Deaf aesthetics as artistic practice, not accessibility as afterthought.', type: 'org', tags: ['FREE', 'Deaf-Centered'], location: 'Los Angeles, CA' },

      { name: 'HowlRound, Disability & Deaf Performance Conversations (UK)', url: 'https://howlround.com/happenings/disability-deaf-performance-conversation', description: 'Free essays and recorded conversations on UK Deaf performance and disability theater, including resources on theatrical interpreting, BSL aesthetics, and integrating access as artistic language.', type: 'media', tags: ['FREE', 'Deaf-Centered'] },

      { name: 'Gallaudet University', url: 'https://gallaudet.edu', description: 'The world\'s only university designed to be barrier-free for Deaf and hard of hearing students, and a global center of Deaf culture, ASL linguistics, and Deaf studies scholarship since 1864. A bilingual ASL/English institution whose research and public resources shape the field. Free public resources.', type: 'org', tags: ['FREE', 'Deaf-Centered'], location: 'Washington DC' },
      { name: 'Gallaudet ASL Connect', url: 'https://gallaudet.edu/asl-connect/', description: 'Gallaudet\'s ASL learning hub, including free, topic-organized video lessons for basic vocabulary taught by Deaf instructors, alongside paid structured courses. One of the most authoritative free entry points for learning ASL from a Deaf-centered institution.', type: 'course', tags: ['FREE', 'Deaf-Centered'], location: 'United States' },
      { name: 'ASL University (Lifeprint)', url: 'https://www.lifeprint.com', description: 'Dr. Bill Vicars\' free, comprehensive ASL curriculum: lessons, a large video sign dictionary, fingerspelling practice, and culture notes. Used worldwide by self-learners and ASL classes. Among the most widely referenced free ASL learning resources on the web.', type: 'course', tags: ['FREE'] },
      { name: 'HandSpeak', url: 'https://www.handspeak.com', description: 'Long-running online ASL dictionary and Deaf culture resource created by native signer and ASL instructor Jolanta Lapiak. Includes a searchable sign dictionary, grammar and culture tutorials, and baby sign content. Core site free to use (optional ad-free membership).', type: 'tool', tags: ['FREE', 'Deaf-Centered'] },
      { name: 'Deaf Studies Digital Journal (DSDJ)', url: 'https://journals.publishing.umich.edu/dsdj/', description: 'The first peer-reviewed academic journal published bilingually and bimodally in American Sign Language and English. Showcases Deaf scholarship, ASL literature, and visual-language creative work in a Deaf-centered format. Open access, free to read.', type: 'media', tags: ['FREE', 'Open Access', 'Deaf-Centered'] },
      { name: 'Sign Language Studies (Gallaudet University Press)', url: 'https://gupress.gallaudet.edu/Journals/Sign-Language-Studies', description: 'The seminal scholarly journal on signed languages and signing communities, founded by William Stokoe in 1972. Covers signed-language linguistics, Deaf culture, history, and literature from communities worldwide. The reference journal for ASL and signed-language research.', type: 'media', tags: ['Deaf-Centered'], location: 'Washington DC' },
      { name: 'ASL SLAM', url: 'https://www.aslslam.org', description: 'A space for Deaf performance, ASL storytelling, poetry, and rap, hosting open-mic-style events that celebrate creative expression in sign language. Centers ASL as a living art form and the Deaf signing community as its artists. Free to participate and attend.', type: 'org', tags: ['FREE', 'Deaf-Centered'], location: 'New York City' },
      { name: 'LumoTV (formerly BSL Zone)', url: 'https://lumotv.co.uk', description: 'Free streaming platform of British Sign Language programming made by and for Deaf people, running since 2008 (rebranded from BSL Zone). Drama, comedy, documentary, and children\'s content in BSL. A rare example of sustained Deaf-led broadcast media. Free to watch.', type: 'media', tags: ['FREE', 'Deaf-Centered'], location: 'United Kingdom' },
      { name: 'D-PAN.TV (Deaf Professional Arts Network)', url: 'https://dpan.tv', description: 'Deaf-led media network co-founded by Sean Forbes making music and culture accessible in ASL. Known for its ASL music videos, Deaf-produced news and entertainment, and for putting Deaf musicians and performers at the center of music culture rather than at its edges. Free to watch.', type: 'media', tags: ['FREE', 'Deaf-Centered'], location: 'Detroit, MI' },

      { name: 'Registry of Interpreters for the Deaf (RID)', url: 'https://rid.org', description: 'The US national certifying and membership body for sign language interpreters and Certified Deaf Interpreters (CDIs). Its position papers and standards articulate professional and ethical interpreting practice, and its directory locates certified interpreters. Essential for understanding qualified interpreting in Deaf cultural contexts.', type: 'org', tags: [], location: 'United States' },
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
    description: 'Foundational texts, theoretical frameworks, and community organizations that ground accessibility in disability justice, the why behind the how. Read these before building compliance checklists. Disability justice centers those most marginalized within disability communities.',
    resources: [

      { name: 'Sins Invalid, Skin, Tooth, and Bone', url: 'https://www.sinsinvalid.org', description: 'Free PDF laying out the 10 Principles of Disability Justice (2016). Short, accessible, visually rich. The foundational text of the Disability Justice framework, should be the first thing read in any accessibility training.', type: 'media', tags: ['FREE', 'Disabled Voice'] },

      { name: 'Mia Mingus, "Access Intimacy: The Missing Link"', url: 'https://leavingevidence.wordpress.com/2011/05/05/access-intimacy-the-missing-link/', description: 'Free foundational essay introducing "access intimacy", the feeling when someone gets your access needs intuitively, without it being a burden or transaction. One of the most widely assigned pieces in the field, used in courses worldwide.', type: 'media', tags: ['FREE', 'Disabled Voice'] },

      { name: 'Leaving Evidence, Mia Mingus', url: 'https://leavingevidence.wordpress.com', description: 'Free, searchable blog archive by disability justice writer and organizer Mia Mingus. Covers access intimacy, transformative justice, disability and race, pod mapping, and access as love. One of the most important ongoing writing projects in the field.', type: 'media', tags: ['FREE', 'Disabled Voice'] },

      { name: 'Harriet McBryde Johnson, "Unspeakable Conversations"', url: 'https://www.nytimes.com/2003/02/16/magazine/unspeakable-conversations.html', description: 'Free New York Times essay (2003) in which disability rights attorney Harriet McBryde Johnson debates philosopher Peter Singer on the value of disabled lives. A masterpiece of disability rights writing, sophisticated, funny, and essential.', type: 'media', tags: ['FREE', 'Disabled Voice'] },

      { name: 'Stella Young, "I\'m Not Your Inspiration, Thank You Very Much"', url: 'https://www.ted.com/talks/stella_young_i_m_not_your_inspiration_thank_you_very_much', description: 'Free, captioned TED Talk (~9 min) critiquing "inspiration porn", the use of disabled people\'s existence to inspire non-disabled people. The most accessible entry point to this critique. Essential first viewing in any accessibility training.', type: 'media', tags: ['FREE', 'Disabled Voice'] },

      { name: 'Crip Camp: A Disability Revolution (2020)', url: 'https://www.youtube.com/watch?v=OFS8SpwioZ4', description: 'Netflix/Higher Ground documentary on Camp Jened and the 504 Sit-In disability rights movement. Free on YouTube with captions and audio description. Widely praised by disability communities as the most important disability rights documentary in decades.', type: 'media', tags: ['FREE', 'Disabled Voice'] },

      { name: 'Alt Text as Poetry', url: 'https://alt-text-as-poetry.net', description: 'Free online project by Bojana Coklyat and Shannon Finnegan reframing alt text as a creative and political practice, not just a technical requirement. Includes a free workbook, principles, and examples from museums and artists. Changes how you think about image description entirely.', type: 'guide', tags: ['FREE', 'Disabled Voice', 'Open Access'] },

      { name: 'Sins Invalid', url: 'https://sinsinvalid.org/about', description: 'San Francisco-based home organization of Disability Justice as a framework. Free resources, videos, performance archives, and the Skin Tooth and Bone PDF. Annual performance showcases model fully integrated access as artistic practice.', type: 'org', tags: ['FREE', 'Disabled Voice'], location: 'San Francisco, CA' },

      { name: 'Sins Invalid, Performance Videos', url: 'https://vimeo.com/sinsinvalid', description: 'Video archives of Sins Invalid\'s performance showcases on Vimeo, disability justice as art, performance, and political practice. Among the most important documentation of disability-led artistic work available online. Some films are free; full showcases rent through Vimeo On Demand.', type: 'media', tags: ['Disabled Voice'] },

      { name: 'Disability Visibility Project', url: 'https://disabilityvisibilityproject.com', description: 'Created by Alice Wong to amplify disability media and culture. Free archive of essays, podcasts, and media criticism, including the Disability Visibility Podcast (100+ episodes) and ongoing cultural commentary. Essential reading.', type: 'org', tags: ['FREE', 'Disabled Voice'] },

      { name: 'Disability Visibility Project, Essays & Media', url: 'https://disabilityvisibilityproject.com/essays', description: 'Curated by Alice Wong. Disability media criticism and cultural commentary, an excellent source of first-person responses to disability representation in film, theater, and media.', type: 'org', tags: ['FREE', 'Disabled Voice'] },

      { name: 'Krip-Hop Nation', url: 'https://kriphopnation.com', description: 'Free archive by Leroy Moore at the intersection of disability, race, and hip-hop. Articles, music, poetry, and advocacy with particular focus on police violence against disabled people of color. Based in the Bay Area; nationally significant.', type: 'org', tags: ['FREE', 'Disabled Voice'], location: 'Bay Area, CA' },

      { name: 'Rooted in Rights', url: 'https://rootedinrights.org', description: 'Disability-centered media organization producing free accessible videos and guides on disability rights topics, including an Access That hub for accessible media production. Disability-led; US-based.', type: 'org', tags: ['FREE', 'Disabled Voice'] },

      { name: 'Autistic Self Advocacy Network (ASAN)', url: 'https://autisticadvocacy.org', description: 'The leading US autistic-led disability rights organization. ASAN is the correct organization to reference for sensory-friendly programming guidance, not Autism Speaks. Free toolkits, policy positions, and guides on neurodivergent inclusion developed by autistic people.', type: 'org', tags: ['FREE', 'Disabled Voice', 'Neurodivergent'] },

      { name: 'Disability Justice Project', url: 'https://disabilityjusticeproject.org', description: 'A global nonprofit platform for disability-led storytelling and journalism, featuring documentary and reporting by disabled creators, including from the Global South. A source of first-person disability media and news from the frontlines of the movement.', type: 'org', tags: ['FREE', 'Disabled Voice'] },

      { name: 'Fireweed Collective', url: 'https://fireweedcollective.org', description: 'Previously the Icarus Project, a US peer support network and disability justice organization centering people with psychiatric and mental health experiences. Arts-rooted; distributes zines, guides, and mutual aid resources on navigating mental health outside clinical models.', type: 'org', tags: ['FREE', 'Disabled Voice'] },

      { name: 'MindFreedom International', url: 'https://mindfreedom.org', description: 'A long-running psychiatric survivor advocacy organization in the US. Challenges forced psychiatric treatment and institutionalization. Free resources on Mad Pride, psychiatric survivor rights, and disability justice applied to mental health.', type: 'org', tags: ['FREE', 'Disabled Voice'] },

      { name: 'Disability Arts Online', url: 'https://disabilityarts.online', description: 'The UK\'s leading free platform for disability arts criticism, reviews of theater, film, and visual art by disabled critics. Cultural commentary, artist profiles, and industry news. Essential reading for anyone working in UK disability arts or wanting a non-US perspective.', type: 'org', tags: ['FREE', 'Disabled Voice'], location: 'United Kingdom' },

      { name: 'HowlRound, Disability Representation in Storytelling', url: 'https://howlround.com/happenings/disability-representation-storytelling', description: 'Free essays and conversations on disability representation in theater and film, including how disabled artists navigate and push back against representation norms.', type: 'media', tags: ['FREE', 'Disabled Voice'] },

      { name: 'Unlimited (UK)', url: 'https://weareunlimited.org.uk', description: 'The UK\'s most significant arts commissioning program for disabled artists, funds and develops new work, tours internationally, and publishes free guides on accessible marketing and arts production. Their "Accessible Marketing Guide" (2024) is one of the best practical resources on disability-inclusive communications, alt text, and accessible social media for arts organizations.', type: 'org', tags: ['FREE'], location: 'United Kingdom' },

      { name: 'Kinetic Light', url: 'https://kineticlight.org', description: 'Disability dance company by choreographer Alice Sheppard, their Audimance® multi-track audio description app and their commitment to creative alt text as public-facing content have made them a landmark in access-as-aesthetic practice. Free resources and design documentation available on their website.', type: 'org', tags: ['FREE', 'Disabled Voice'], location: 'United States' },

      { name: 'Wordgathering: A Journal of Disability Poetry and Literature', url: 'https://wordgathering.com', description: 'The only US journal dedicated to poetry and prose by disabled writers, published free online since 2007. A living archive of disability literature across every form: fierce, tender, comic, formally experimental, politically exact. Quarterly; no subscription required. An essential resource for disability arts programs and literary educators.', type: 'media', tags: ['FREE', 'Disabled Voice', 'Open Access'] },

      { name: 'National Disability Theatre', url: 'https://nationaldisabilitytheatre.org', description: 'US professional theater company committed to producing work by and for disabled people in partnership with regional theaters nationwide. Focuses on hiring disabled directors, designers, playwrights, and performers, and on changing systemic hiring practices in professional theater.', type: 'org', tags: ['FREE', 'Disabled Voice'] },

      { name: 'AXIS Dance Company', url: 'https://axisdance.org', description: 'Oakland-based contemporary dance company integrating wheelchair users and standing dancers, one of the longest-running integrated dance companies in the US. Their work makes the strongest possible case that diverse embodiment is not a limitation but an artistic vocabulary: the specificity of different bodies is the aesthetic.', type: 'org', tags: ['FREE', 'Disabled Voice'], location: 'Oakland, CA' },

      { name: 'Disabled and Here', url: 'https://affecttheverb.com/disabledandhere', description: 'Free stock photography and media collection centering disabled Black, Indigenous, and people of color, created by and for disabled BIPOC communities. A direct response to the near-total absence of disabled BIPOC people in stock imagery. Free to download and use. Essential for any organization that wants its visual materials to actually reflect the disability community as it is.', type: 'media', tags: ['FREE', 'Open Access', 'Disabled Voice'] },

      { name: 'National Disability Arts Collection and Archive (NDACA)', url: 'https://the-ndaca.org', description: 'Free Heritage Lottery-funded archive documenting the UK Disability Arts Movement: artworks, artifacts, films, and oral histories of the disabled artists and activists who helped change the law and culture. An essential, freely browsable record of disability arts history. Open access.', type: 'org', tags: ['FREE', 'Open Access', 'Disabled Voice'], location: 'United Kingdom' },
      { name: 'Project LETS', url: 'https://projectlets.org', description: 'Peer-led, disability-justice-rooted organization building alternatives to the clinical mental health system through peer support and education on madness, trauma, and neurodivergence. A current, youth-driven complement to older psychiatric survivor organizations. Free toolkits and resources.', type: 'org', tags: ['FREE', 'Disabled Voice'] },
      { name: 'Detroit Disability Power', url: 'https://www.detroitdisabilitypower.org', description: 'Disability-led organizing group building the political power of disabled people, with a notable focus on accessible community events and an access-checking practice for venues. A model of disability justice applied to local civic and cultural life. Free resources.', type: 'org', tags: ['FREE', 'Disabled Voice'], location: 'Detroit, MI' },
      { name: 'Bodies of Work', url: 'https://bow.ahs.uic.edu', description: 'Chicago network advancing disability arts and culture through residencies, public programs, and field-building, anchored at the University of Illinois Chicago. A key Midwest hub connecting disabled artists, scholars, and audiences. Free programming and resources.', type: 'org', tags: ['Disabled Voice'], location: 'Chicago, IL' },
      { name: 'Disabled List', url: 'https://disabledlist.org', description: 'A network surfacing disabled creative and design talent so organizations can hire disabled people as experts rather than consult them as an afterthought. Embodies the "nothing about us without us" principle in design and the arts. Free to browse.', type: 'org', tags: ['Disabled Voice'] },
      { name: 'Sins Invalid, Resources & Access Guidance', url: 'https://sinsinvalid.org/resources/', description: 'Sins Invalid\'s resource hub, including their widely shared access suggestions for public events, grounded in disability justice rather than minimum compliance: fragrance-free practice, ASL and CART, image description, mobility access, and more. A free, copy-ready starting point for organizers.', type: 'guide', tags: ['FREE', 'Disabled Voice'] },
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

      { name: 'Disability Studies Quarterly (DSQ)', url: 'https://dsq-sds.org', description: 'The most important open-access peer-reviewed journal in disability studies. Published by the Society for Disability Studies. Covers arts, culture, media, law, and history, free to read online, no subscription. Searchable archive going back to the 1980s.', type: 'media', tags: ['FREE', 'Open Access'] },

      { name: 'NLS, National Library Service for the Blind and Print Disabled', url: 'https://www.loc.gov/nls', description: 'Free Library of Congress service for any US resident with a print disability, blindness, low vision, physical disability, or dyslexia. Provides digital talking books (via the free BARD app), braille books, and specialized playback devices mailed free. One of the most valuable and underused US accessibility services.', type: 'org', tags: ['FREE'], location: 'United States' },

      { name: 'Bookshare, Accessible Online Library', url: 'https://www.bookshare.org', description: 'The world\'s largest accessible online library, over 1 million titles in DAISY, EPUB, BRF (Braille-ready), and audio. Free for qualifying individuals with print disabilities in the US and in 70+ countries under the Marrakesh Treaty. Organizations can also join. A lifeline for print-disabled readers.', type: 'org', tags: ['FREE'] },

      { name: 'CELA, Centre for Equitable Library Access', url: 'https://celalibrary.ca', description: 'Canada\'s national accessible library service, the equivalent of the US NLS/BARD. Talking books, braille, and DAISY format in English and French, accessible to Canadians with print disabilities. Free with registration through member libraries.', type: 'org', tags: ['FREE'], location: 'Canada' },

      { name: 'WorldCat, World Library Finder', url: 'https://worldcat.org', description: 'The world\'s largest library catalog, search any book and find your nearest library holding it, anywhere on earth. Enter a title and your location to see which libraries near you have it. Essential for finding accessible format books and out-of-print materials globally.', type: 'tool', tags: ['FREE'] },

      { name: 'Review of Disability Studies: An International Journal (RDS)', url: 'https://rdsjournal.org', description: 'Peer-reviewed, fully open-access journal from the Center on Disability Studies at the University of Hawaii (since 2003). Interdisciplinary scholarship including disability arts, culture, and the lived experience of disability, with an international scope. Free to read, no subscription.', type: 'media', tags: ['FREE', 'Open Access'] },
      { name: 'Canadian Journal of Disability Studies (CJDS)', url: 'https://cjds.uwaterloo.ca', description: 'Peer-reviewed, open-access journal of the Canadian Disability Studies Association, hosted at the University of Waterloo. No reading or publishing fees. Strong on Canadian disability culture, arts, and policy, with international relevance. Free to read.', type: 'media', tags: ['FREE', 'Open Access'], location: 'Canada' },
      { name: 'Journal of Literary and Cultural Disability Studies (JLCDS)', url: 'https://www.liverpooluniversitypress.co.uk/journal/jlcds', description: 'The leading peer-reviewed journal on literary and cultural representations of disability, published by Liverpool University Press and edited from the Centre for Culture and Disability Studies. Essential for arts and humanities scholars working on disability. Subscription or library access (no author fees).', type: 'media', tags: [], location: 'United Kingdom' },
      { name: 'DAISY Consortium', url: 'https://daisy.org', description: 'The international body developing accessible-reading standards (DAISY, and the accessibility of EPUB) used by libraries for the blind worldwide. Offers free self-study courses and tools for producing accessible digital books and documents. The technical backbone of accessible publishing.', type: 'org', tags: ['FREE', 'Open Access'] },
      { name: 'Inclusive Publishing', url: 'https://inclusivepublishing.org', description: 'A DAISY Consortium hub of free guidance, news, and resources on born-accessible publishing for authors, publishers, and producers. Practical reference for making EPUBs, documents, and digital books accessible from the start. Free to read.', type: 'guide', tags: ['FREE', 'Open Access'] },
      { name: 'Accessible Books Consortium (ABC)', url: 'https://www.accessiblebooksconsortium.org', description: 'WIPO-led global partnership working to end the "book famine" for blind and print-disabled readers. Runs an international library-to-library book exchange (the Global Book Service, over one million accessible titles), capacity building, and inclusive-publishing promotion. Free to participating organizations worldwide.', type: 'org', tags: ['FREE'] },
      { name: 'Benetech', url: 'https://benetech.org', description: 'The nonprofit behind Bookshare, the world\'s largest accessible ebook library, and a leader in born-accessible publishing and digital accessibility for education. Their tools and standards work help make reading materials usable by people who read differently. Free and low-cost services for qualifying readers and institutions.', type: 'org', tags: ['FREE'], location: 'United States' },
      { name: 'Smithsonian Office of Visitor Accessibility: For Museum Professionals', url: 'https://access.si.edu/museum-professionals', description: 'Free, authoritative guidance from the Smithsonian, including the Smithsonian Guidelines for Accessible Exhibition Design (label design, fonts, color, wayfinding, interactives, seating, egress) plus toolkits for accessible digital interactives. The most widely used free reference for accessible exhibition and museum design.', type: 'guide', tags: ['FREE'], location: 'United States' },
      { name: 'Atelier Incurve', url: 'https://incurve.jp', description: 'Osaka studio (founded 1999) supporting artists with intellectual disabilities, whose members have exhibited internationally and entered major collections. An influential model worldwide for disability art studios and for valuing disabled artists\' work on its own aesthetic terms. Free to read about online.', type: 'org', tags: ['Disabled Voice'], location: 'Japan' },
      { name: 'Disability and Culture (Ingstad and Whyte, UC Press)', url: 'https://www.ucpress.edu/books/disability-and-culture/paper', description: 'A foundational anthropological collection documenting how disability is understood very differently across African, Asian, and other non-Western cultures. Essential for practitioners working internationally and for resisting the assumption that Western disability frameworks are universal. Publisher page; available through libraries.', type: 'media', tags: [] },
    ],
  },
];

/** Flat list of all resources with their category info attached, useful for search and lookup. */
export const ALL_RESOURCES = CATEGORIES.flatMap((cat) =>
  cat.resources.map((r) => ({ ...r, categoryId: cat.id, categoryTitle: cat.title, categoryEmoji: cat.emoji }))
);

/** Quick name lookup by URL slug. */
export const RESOURCE_BY_SLUG: Record<string, { name: string; categoryTitle: string; categoryEmoji: string }> =
  Object.fromEntries(
    ALL_RESOURCES.map((r) => [r.url, { name: r.name, categoryTitle: r.categoryTitle, categoryEmoji: r.categoryEmoji }])
  );
