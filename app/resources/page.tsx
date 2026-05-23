'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

// ── Types ─────────────────────────────────────────────────────────────────────

type ResourceType = 'standard' | 'tool' | 'guide' | 'org' | 'media' | 'course';

type Resource = {
  name: string;
  url: string;          // also used as the stable resource_slug in the DB
  description: string;
  type: ResourceType;
  tags?: string[];      // e.g. ['FREE', 'Open Access', 'Deaf-Centered']
};

type Category = {
  id: string;
  title: string;
  emoji: string;
  description: string;
  resources: Resource[];
};

// ── Type tag helpers ──────────────────────────────────────────────────────────

const TYPE_LABELS: Record<ResourceType, string> = {
  standard: 'Standard',
  tool:     'Free Tool',
  guide:    'Guide',
  org:      'Organization',
  media:    'Article / Video',
  course:   'Course / Training',
};

const TYPE_CLASS: Record<ResourceType, string> = {
  standard: 'tag-blue',
  tool:     'tag-green',
  guide:    'tag-yellow',
  org:      'tag-gray',
  media:    'tag-rose',
  course:   'tag-blue',
};

// ── Resource data ─────────────────────────────────────────────────────────────

const CATEGORIES: Category[] = [
  {
    id: 'audio-description',
    title: 'Audio Description',
    emoji: '🎙️',
    description: 'Standards, training, tools, and organizations for audio description in film, theater, and media.',
    resources: [
      {
        name: 'DCMP Audio Description Tip Sheet',
        url: 'https://dcmp.org/learn/227-audio-description-tip-sheet',
        description: 'One-page guide from the Described and Captioned Media Program covering core AD principles: objective language, present tense, visual identity description.',
        type: 'standard',
        tags: ['FREE'],
      },
      {
        name: 'DCMP Style Manual',
        url: 'https://dcmp.org',
        description: 'Comprehensive federally-funded style guide for captioning and audio description in educational media. Covers AD script writing, voice talent, and quality review.',
        type: 'standard',
        tags: ['FREE'],
      },
      {
        name: 'Audio Description Coalition — Quality Standards',
        url: 'https://audiodescriptioncoalition.org',
        description: 'Widely referenced standards document (2009) covering best practices for audio description in film, television, and theater.',
        type: 'standard',
        tags: ['FREE'],
      },
      {
        name: 'ADLAB International Guidelines for Audio Description',
        url: 'https://www.adlabproject.eu/Docs/adlab%20book/',
        description: 'EU-funded international reference for AD standards. The most comprehensive guide available — covers theory, methodology, and practical guidelines across media formats.',
        type: 'standard',
        tags: ['FREE', 'Open Access'],
      },
      {
        name: 'Audio Description for Beginners — Free Course',
        url: 'https://www.closedcaptioncreator.com/videos/courses/audio-description-for-beginners/',
        description: 'Introductory free course: what AD is, why it matters, and basic script writing principles.',
        type: 'course',
        tags: ['FREE'],
      },
      {
        name: 'ACB Audio Description Project — Education Resources',
        url: 'https://adp.acb.org/education.html',
        description: 'American Council of the Blind offers training resources, educational guides, and a four-course series in inclusive media. Scholarships available.',
        type: 'course',
        tags: ['FREE'],
      },
      {
        name: 'Think Outside the Vox — Education',
        url: 'https://thinkoutsidethevox.org/education',
        description: 'Free audio description workshops for live events, with a focus on live theater and performance contexts. Sponsored by the Haymarket People\'s Fund.',
        type: 'course',
        tags: ['FREE'],
      },
      {
        name: 'DCMP Professional Development Courses',
        url: 'https://dcmp.org/learn',
        description: 'Free courses on accessible media in the classroom, educational interpreting, captioning and video description. No admission requirements.',
        type: 'course',
        tags: ['FREE'],
      },
      {
        name: 'YouDescribe',
        url: 'https://youdescribe.org',
        description: 'NIDILRR-funded free tool enabling anyone to record audio descriptions for YouTube videos, expanding described content access for blind and low-vision viewers.',
        type: 'tool',
        tags: ['FREE'],
      },
      {
        name: 'American Council of the Blind — Audio Description Project',
        url: 'https://adp.acb.org',
        description: 'The most important US organization for audio description. Maintains AD standards, a database of AD-accessible venues and media, and training resources.',
        type: 'org',
        tags: ['FREE'],
      },
      {
        name: 'GBH Media Access Group',
        url: 'https://www.wgbh.org/foundation/media-access',
        description: 'Created the first broadcast audio description in the US (Described Video Service). Now a leader in captioning and AD research and advocacy.',
        type: 'org',
        tags: ['FREE'],
      },
      {
        name: 'VocalEye — Live Performance Audio Description',
        url: 'https://vocaleye.ca',
        description: 'Canada\'s leading organization for live performance audio description. Offers freely available guidelines for live theater AD, describer training, and guidance for dance and experimental performance.',
        type: 'org',
        tags: ['FREE'],
      },
      {
        name: 'RNIB — Audio Description Resources',
        url: 'https://www.rnib.org.uk',
        description: 'Royal National Institute of Blind People. UK standards and advocacy for AD in theater and film. Produces guidance documents and advocates for AD quality and availability.',
        type: 'org',
        tags: ['FREE'],
      },
      {
        name: 'Art Beyond Sight',
        url: 'https://www.artbeyondsight.org',
        description: 'Focuses on making visual art, museum and gallery collections accessible to blind and low-vision audiences through verbal description methods.',
        type: 'org',
        tags: ['FREE'],
      },
    ],
  },
  {
    id: 'captioning',
    title: 'Captioning & CART',
    emoji: '💬',
    description: 'Standards, free tools, and guides for captions, real-time text, and subtitling across platforms and events.',
    resources: [
      {
        name: 'DCMP Captioning Key',
        url: 'https://dcmp.org/learn/captioningkey',
        description: 'The most detailed and widely-used quality standard for captions in educational media — broadly applied across the industry. Covers accuracy, placement, speaker ID, and sound effects.',
        type: 'standard',
        tags: ['FREE'],
      },
      {
        name: 'Netflix Timed Text Style Guide',
        url: 'https://partnerhelp.netflixstudios.com/hc/en-us/articles/215758617',
        description: 'Publicly available guide required for all Netflix content. An excellent industry reference even for non-Netflix projects.',
        type: 'standard',
        tags: ['FREE'],
      },
      {
        name: 'FCC Consumer Guide — Closed Captioning on Television',
        url: 'https://www.fcc.gov/consumers/guides/closed-captioning-television',
        description: 'Federal Communications Commission guide to captioning requirements, the four FCC quality standards, and how to file complaints.',
        type: 'standard',
        tags: ['FREE'],
      },
      {
        name: '3Play Media Learning Center',
        url: 'https://www.3playmedia.com/learn',
        description: 'Extensive free guides on captioning standards, CVAA requirements, platform specifications, and quality standards. Clearly distinguishes closed captions, SDH, and open captions.',
        type: 'guide',
        tags: ['FREE'],
      },
      {
        name: 'Amara',
        url: 'https://amara.org',
        description: 'Free online captioning and subtitling platform. Popular with nonprofits, educators, and independent filmmakers. Supports collaborative captioning workflows.',
        type: 'tool',
        tags: ['FREE'],
      },
      {
        name: 'CADET — Caption and Description Editing Tool',
        url: 'https://ncam.wgbh.org/invent_build/web_multimedia/tools-guidelines/cadet',
        description: 'Free downloadable caption-authoring software from GBH National Center for Accessible Media (NCAM). Can also generate audio description scripts. One of the few fully free professional-grade caption tools.',
        type: 'tool',
        tags: ['FREE'],
      },
      {
        name: 'WebAIM — Captioning Resources',
        url: 'https://webaim.org/techniques/captions/',
        description: 'Practical guidance on captioning for web and media: evaluating caption quality, working with caption files, and platform best practices.',
        type: 'guide',
        tags: ['FREE'],
      },
      {
        name: 'ACL — Making Captioning Easy',
        url: 'https://acl.gov/ada/making-captioning-easy',
        description: 'Administration for Community Living guide to basics of captioning for events, meetings, and media. Includes tool comparisons and practical how-to guidance.',
        type: 'guide',
        tags: ['FREE'],
      },
      {
        name: 'ADA National Network — Captioning Resources',
        url: 'https://adata.org',
        description: 'Free webinars and guides on captioning requirements under the ADA, CVAA, and Section 508. A definitive free resource hub for US disability law applied to captioning.',
        type: 'org',
        tags: ['FREE'],
      },
    ],
  },
  {
    id: 'theater',
    title: 'Theater & Live Performance',
    emoji: '🎭',
    description: 'Organizations, toolkits, and best practices for accessible theater — including relaxed performances, sensory-friendly programming, and Deaf theater.',
    resources: [
      {
        name: 'HowlRound Theatre Commons — Disability & Accessibility Archive',
        url: 'https://howlround.com/tags/disability-and-accessibility',
        description: 'Freely accessible archive of essays, articles, and recorded conversations on disability aesthetics, accessibility in theater, and disabled theater artists. HowlRound TV provides free open-access livestreaming and video archive.',
        type: 'org',
        tags: ['FREE'],
      },
      {
        name: 'Graeae Theatre Company — Access Resources',
        url: 'https://graeae.org/accessibility',
        description: 'UK-based disability-led theater company (founded 1980) that integrates captioning, BSL, and audio description as theatrical language, not add-ons. Free resources and case study material for arts organizations.',
        type: 'org',
        tags: ['FREE'],
      },
      {
        name: 'National Endowment for the Arts — Accessibility',
        url: 'https://www.arts.gov/impact/accessibility',
        description: 'Free policy guidance, resources, case studies, and vetted tool links for arts organizations navigating ADA compliance and inclusive programming.',
        type: 'org',
        tags: ['FREE'],
      },
      {
        name: 'Kennedy Center — VSA Arts Access Resources',
        url: 'https://www.kennedy-center.org/education/vsa',
        description: 'Free tip sheets, staff training guides, and professional development resources covering physical access, communication access, and programming for disabled audiences and artists.',
        type: 'guide',
        tags: ['FREE'],
      },
      {
        name: 'Shape Arts (UK)',
        url: 'https://shapearts.org.uk',
        description: 'Disability arts development organization. Free access consultancy resources, articles, and guidance for cultural organizations — strong on the intersection of access and artistic identity.',
        type: 'org',
        tags: ['FREE'],
      },
      {
        name: 'Disability Arts Online',
        url: 'https://disabilityarts.online',
        description: 'UK\'s leading free platform for disability arts. Reviews, criticism, artist profiles, and cultural commentary from disabled perspectives. Essential for understanding disability arts practice as artistic practice.',
        type: 'org',
        tags: ['FREE', 'Disabled Voice'],
      },
      {
        name: 'Theatre Development Fund (TDF)',
        url: 'https://www.tdf.org',
        description: 'NYC nonprofit with resources on captioning, audio description, and Deaf/hard of hearing access in theater. Pioneered open captions and GalaPro integration in New York.',
        type: 'org',
        tags: ['FREE'],
      },
      {
        name: 'National Theatre of the Deaf',
        url: 'https://www.ntd.org',
        description: 'The longest-running professional touring theater company in the US (est. 1967). Pioneer of theatrical ASL. Free resources and history available.',
        type: 'org',
        tags: ['FREE', 'Deaf-Centered'],
      },
      {
        name: 'Deaf West Theatre',
        url: 'https://deafwest.org',
        description: 'Los Angeles company that integrates ASL and spoken English as co-equal theatrical languages. Known for Spring Awakening (Broadway 2015). Foundational case study in Deaf aesthetics.',
        type: 'org',
        tags: ['FREE', 'Deaf-Centered'],
      },
      {
        name: 'Attitude is Everything — Charter of Best Practice',
        url: 'https://www.attitudeiseverything.org.uk',
        description: 'UK benchmark documents for accessible live music venues and festivals. Bronze/Silver/Gold Charter of Best Practice and annual State of Access Reports based on first-person Deaf/disabled music fan data.',
        type: 'guide',
        tags: ['FREE'],
      },
      {
        name: 'League of Chicago Theatres — Accessibility Resources',
        url: 'https://leagueofchicagotheatres.org/accessibility-resources',
        description: 'Free toolkit for theater organizations covering physical access, captioning, audio description, relaxed performances, and sensory-friendly programming. A strong regional model with broad applicability.',
        type: 'guide',
        tags: ['FREE'],
      },
      {
        name: 'Audio Description Association UK (ADUK)',
        url: 'https://adassociation.org.uk',
        description: 'Training and standards for live theater audio description. Guides for describers and theater producers on commissioning and delivering quality live AD.',
        type: 'org',
        tags: ['FREE'],
      },
      {
        name: 'Society of London Theatre — Relaxed Performance Guidelines',
        url: 'https://officiallondontheatre.com/access',
        description: 'Standard guidelines for relaxed/sensory-friendly performances: adjusted sensory environment, chill-out rooms, visual stories, staff briefing. Now widely adopted internationally.',
        type: 'guide',
        tags: ['FREE'],
      },
      {
        name: 'GalaPro',
        url: 'https://galapro.com',
        description: 'Free smartphone app delivering synchronized captions or audio description to live performances. Allows Deaf/HoH patrons to sit anywhere rather than restricted captioned zones. Used at Broadway and major regional venues.',
        type: 'tool',
        tags: ['FREE'],
      },
    ],
  },
  {
    id: 'film',
    title: 'Film & Video Production',
    emoji: '🎬',
    description: 'Production toolkits, inclusion guides, organizations supporting disabled filmmakers, and film festivals with strong access practices.',
    resources: [
      {
        name: 'FWD-Doc — Toolkit for Inclusion & Accessibility',
        url: 'https://fwd-doc.org/resources/toolkit',
        description: '62-page free toolkit (partnered with Doc Society and Netflix) covering disability inclusion across development, production, post-production, distribution, and exhibition. Includes an accessible film event scorecard.',
        type: 'guide',
        tags: ['FREE'],
      },
      {
        name: 'FWD-Doc — Recommended Practices',
        url: 'https://fwd-doc.org/resources/recommended-practices',
        description: 'Free companion guide on disability representation, accessible sets, and crew inclusion.',
        type: 'guide',
        tags: ['FREE'],
      },
      {
        name: 'FWD-Doc — Full Resources Hub',
        url: 'https://fwd-doc.org/resources',
        description: 'Complete resources hub from a global intersectional community of disabled creators and allies rooted in documentary film. Free resources on accessibility, representation, and inclusion.',
        type: 'org',
        tags: ['FREE'],
      },
      {
        name: 'Accessible Filmmaking Guide',
        url: 'https://accessiblefilmmaking.wordpress.com',
        description: 'Academic and practical guide by Dr. Pablo Romero-Fresco and Dr. Louise Fryer. Covers accessible and inclusive filmmaking practices and processes.',
        type: 'guide',
        tags: ['FREE', 'Open Access'],
      },
      {
        name: 'IDA Nonfiction Access Initiative',
        url: 'https://www.documentary.org/nonfiction-access-initiative/resources',
        description: 'International Documentary Association\'s free resource hub for nonfiction accessibility. Includes the 2024 report on enhancing accessibility and support for disabled nonfiction media makers.',
        type: 'org',
        tags: ['FREE'],
      },
      {
        name: 'Rooted in Rights — Access That: Accessible Media Resources',
        url: 'https://rootedinrights.org/resources/accessthat',
        description: 'Disability-led guides on producing accessible digital media: captions, audio description, accessible event streaming, and social media accessibility.',
        type: 'guide',
        tags: ['FREE', 'Disabled Voice'],
      },
      {
        name: 'Inevitable Foundation',
        url: 'https://inevitablefoundation.com',
        description: 'Mentorship and script development support for disabled writers in Hollywood. Free guides on disability representation in screenwriting. An important entry point for industry inclusion.',
        type: 'org',
        tags: ['FREE'],
      },
      {
        name: 'USC Annenberg Inclusion Initiative',
        url: 'https://annenberg.usc.edu/research/aii',
        description: 'Free research reports on disability representation and hiring in film and television, including the landmark report "Inequality in 1,300 Popular Films." Essential data for arguments about industry change.',
        type: 'org',
        tags: ['FREE', 'Open Access'],
      },
      {
        name: 'RespectAbility',
        url: 'https://www.respectability.org',
        description: 'Coalition organization with resources on disability inclusion in entertainment. Runs an Entertainment Lab for disabled writers and a Media Guide for journalists covering disability.',
        type: 'org',
        tags: ['FREE'],
      },
      {
        name: 'Superfest Disability Film Festival',
        url: 'https://sfmcd.org/superfest',
        description: 'World\'s longest-running disability film festival (UCSF/Berkeley). All films are captioned and audio described. Centers disabled perspectives and filmmakers — the benchmark for other festivals.',
        type: 'org',
        tags: ['FREE'],
      },
      {
        name: 'ReelAbilities Film Festival',
        url: 'https://reelabilities.org',
        description: 'US disability-focused film festival with strong access practices, free educational programming, and multiple city chapters. An important showcase for disability-centered storytelling.',
        type: 'org',
        tags: ['FREE'],
      },
      {
        name: 'Disability Film Challenge',
        url: 'https://www.disabilityfilmchallenge.com',
        description: 'Annual filmmaking competition promoting authentic disability storytelling. Free entry information and best practices resources.',
        type: 'org',
        tags: ['FREE'],
      },
    ],
  },
  {
    id: 'live-events',
    title: 'Live Events & Festivals',
    emoji: '🎪',
    description: 'Frameworks, free webinar series, assistive listening resources, and best practices for accessible concerts, festivals, and public events.',
    resources: [
      {
        name: 'Attitude is Everything — State of Access Reports',
        url: 'https://www.attitudeiseverything.org.uk/resources',
        description: 'Annual survey reports based on first-person evidence from Deaf and disabled music fans on access successes and failures. Free PDF download. The most important evidence base for accessible live music.',
        type: 'guide',
        tags: ['FREE'],
      },
      {
        name: 'Kennedy Center LEAD Research & Resources',
        url: 'https://www.kennedy-center.org/education/networks-conferences-and-research/research-and-resources/lead-research-and-resources',
        description: 'Leadership Exchange in Arts and Disability (LEAD) free tip sheets, guides, and video resources on physical access, communication access, assistive listening, and diverse disability communities.',
        type: 'guide',
        tags: ['FREE'],
      },
      {
        name: 'Cultural Access Collaborative',
        url: 'https://culturalaccesscollaborative.org',
        description: 'Community of cultural administrators and disabled people working to remove access barriers. Offers free professional development workshops, an equipment loan program, and an access calendar.',
        type: 'org',
        tags: ['FREE'],
      },
      {
        name: 'AccessibilityOnline — Arts-n-Rec Webinar Series',
        url: 'https://www.accessibilityonline.org/training',
        description: 'Free ongoing webinar series on ADA issues in arts, performance, museums, zoos, exhibitions, concerts, fairs, and recreation. Among the best free ongoing professional development available.',
        type: 'course',
        tags: ['FREE'],
      },
      {
        name: 'ADA National Network — Accessibility Online Webinars',
        url: 'https://adata.org/training/accessibility-online-webinars',
        description: 'Free webinars on accessibility topics with recorded sessions available in an archive.',
        type: 'course',
        tags: ['FREE'],
      },
      {
        name: 'Mid Atlantic Arts — Disability Justice Webinar Series',
        url: 'https://www.midatlanticarts.org/opportunity/accessibility-training',
        description: 'Webinar series for local and state arts agencies going beyond compliance to center disability justice frameworks. Partnered with Americans for the Arts.',
        type: 'course',
        tags: ['FREE'],
      },
      {
        name: 'South Carolina Arts Commission — Disability Arts Webinar Series',
        url: 'https://www.southcarolinaarts.com/about-the-scac/accessibility/disability-arts-webinars',
        description: 'Free monthly webinar series (first Wednesday via Zoom) developed with disability community partners.',
        type: 'course',
        tags: ['FREE'],
      },
      {
        name: 'Pacific ADA Center — Free ADA Webinars',
        url: 'https://www.adapacific.org/ada-webinars',
        description: 'Free webinars on ADA compliance topics including accessible facilities, events, and venues. Archived sessions available.',
        type: 'course',
        tags: ['FREE'],
      },
      {
        name: 'Hearing Loss Association of America (HLAA)',
        url: 'https://www.hearingloss.org',
        description: 'Advocacy for hearing loop installation in US venues. Includes a free Loopfinder directory of loop-equipped venues. Essential resource for understanding hearing loop technology as best practice.',
        type: 'org',
        tags: ['FREE'],
      },
    ],
  },
  {
    id: 'digital',
    title: 'Digital & Web Accessibility',
    emoji: '💻',
    description: 'WCAG standards, free testing tools, accessible media players, and design frameworks for digital products and websites.',
    resources: [
      {
        name: 'W3C Web Accessibility Initiative (WAI)',
        url: 'https://www.w3.org/WAI',
        description: 'The authoritative free source for WCAG. Includes WCAG 2.1 and 2.2 specifications, Understanding documents, Techniques, and comprehensive tutorials. If you read one resource on digital accessibility, make it this one.',
        type: 'standard',
        tags: ['FREE', 'Open Access'],
      },
      {
        name: 'WebAIM — Web Accessibility In Mind',
        url: 'https://webaim.org',
        description: 'The best free practical web accessibility resource. Articles, guides, the WAVE browser tool, and the Screen Reader User Survey — the most important data on how disabled people actually use the web.',
        type: 'org',
        tags: ['FREE'],
      },
      {
        name: 'The A11y Project',
        url: 'https://www.a11yproject.com',
        description: 'Community-maintained free resource with accessibility patterns, checklists, and articles for developers and designers. Practical, current, and well-organized.',
        type: 'guide',
        tags: ['FREE', 'Open Access'],
      },
      {
        name: 'Microsoft Inclusive Design Toolkit',
        url: 'https://www.microsoft.com/design/inclusive',
        description: 'Free framework and methodology: Recognize Exclusion, Learn from Diversity, Solve for One Extend to Many. Introduces the powerful "persona spectrum" model of permanent, temporary, and situational disability.',
        type: 'guide',
        tags: ['FREE'],
      },
      {
        name: 'BBC GEL Accessibility Guidelines',
        url: 'https://www.bbc.co.uk/gel/guidelines/accessibility',
        description: 'Among the most thorough publicly available design system accessibility guidelines. Includes disability personas for testing, visual design standards, and content guidelines. Regularly updated.',
        type: 'standard',
        tags: ['FREE'],
      },
      {
        name: 'W3C WAI Tutorials',
        url: 'https://www.w3.org/WAI/tutorials',
        description: 'Free authoritative tutorials for making specific content types accessible: images, tables, forms, carousels, menus.',
        type: 'guide',
        tags: ['FREE', 'Open Access'],
      },
      {
        name: 'WAVE — Web Accessibility Evaluation Tool',
        url: 'https://wave.webaim.org',
        description: 'Free browser-based accessibility checker from WebAIM. Visual overlay shows errors and warnings directly on your page — great for quick checks and learning.',
        type: 'tool',
        tags: ['FREE'],
      },
      {
        name: 'axe DevTools Browser Extension',
        url: 'https://www.deque.com/axe',
        description: 'Industry-standard free accessibility testing extension for Chrome and Firefox. Catches approximately 30% of accessibility issues automatically. The free tier is robust and widely used by professionals.',
        type: 'tool',
        tags: ['FREE'],
      },
      {
        name: 'Google Lighthouse',
        url: 'https://developers.google.com/web/tools/lighthouse',
        description: 'Free accessibility auditing tool built into Chrome DevTools. Generates an accessibility score and flags common issues. No installation or accounts needed.',
        type: 'tool',
        tags: ['FREE'],
      },
      {
        name: 'Colour Contrast Analyser (TPGi)',
        url: 'https://www.tpgi.com/color-contrast-checker',
        description: 'Free desktop tool for checking specific color values against WCAG contrast requirements. Works on any color on screen, including design software. Essential for designers.',
        type: 'tool',
        tags: ['FREE'],
      },
      {
        name: 'IBM Equal Access Checker',
        url: 'https://www.ibm.com/able/toolkit',
        description: 'Free open-source accessibility checker from IBM with detailed reporting and remediation guidance. A strong complement to axe for catching different classes of issues.',
        type: 'tool',
        tags: ['FREE', 'Open Access'],
      },
      {
        name: 'NVDA Screen Reader',
        url: 'https://www.nvaccess.org',
        description: 'The most widely used free screen reader for Windows. Essential for manual accessibility testing — every accessibility practitioner should know how to navigate with NVDA.',
        type: 'tool',
        tags: ['FREE', 'Open Access'],
      },
      {
        name: 'Able Player',
        url: 'https://ableplayer.github.io',
        description: 'Free, MIT-licensed, open-source media player with excellent WCAG compliance. Supports audio description tracks, caption tracks (WebVTT, SRT, SBV), chapter navigation, keyboard control, and transcript view. The best free option for organizations hosting video.',
        type: 'tool',
        tags: ['FREE', 'Open Access'],
      },
    ],
  },
  {
    id: 'disability-justice',
    title: 'Disability Justice',
    emoji: '✊',
    description: 'Foundational texts, blogs, and open-access journals centering disability justice as a framework — not just compliance.',
    resources: [
      {
        name: 'Sins Invalid — Skin, Tooth, and Bone',
        url: 'https://sinsinvalid.org',
        description: 'Free PDF laying out the 10 Principles of Disability Justice (2016). Short, accessible, visually rich. Should be the first text assigned in any accessibility or disability studies course.',
        type: 'media',
        tags: ['FREE', 'Disabled Voice'],
      },
      {
        name: 'Mia Mingus — "Access Intimacy: The Missing Link"',
        url: 'https://leavingevidence.wordpress.com/2011/05/05/access-intimacy-the-missing-link/',
        description: 'Free foundational essay introducing "access intimacy" — the feeling when someone gets your access needs intuitively, without it being a burden or transaction. One of the most widely assigned pieces in the field.',
        type: 'media',
        tags: ['FREE', 'Disabled Voice'],
      },
      {
        name: 'Harriet McBryde Johnson — "Unspeakable Conversations"',
        url: 'https://www.nytimes.com/2003/02/16/magazine/unspeakable-conversations.html',
        description: 'Free New York Times essay (2003) in which disability rights attorney Harriet McBryde Johnson debates philosopher Peter Singer on the value of disabled lives. Essential reading for understanding disability rights arguments at their most sophisticated.',
        type: 'media',
        tags: ['FREE', 'Disabled Voice'],
      },
      {
        name: 'Stella Young — "I\'m Not Your Inspiration, Thank You Very Much"',
        url: 'https://www.ted.com/talks/stella_young_i_m_not_your_inspiration_thank_you_very_much',
        description: 'Free, captioned TED Talk (~9 min) critiquing "inspiration porn" — the use of disabled people\'s existence to inspire non-disabled people. The most accessible entry point to this critique and essential first viewing for anyone in this field.',
        type: 'media',
        tags: ['FREE', 'Disabled Voice'],
      },
      {
        name: 'Disability Visibility Project',
        url: 'https://disabilityvisibilityproject.com',
        description: 'Free archive created by Alice Wong to create, share, and amplify disability media and culture. Includes podcasts, first-person essays, the Disability Visibility Podcast resource guide (100 episodes), and ongoing cultural commentary.',
        type: 'org',
        tags: ['FREE', 'Disabled Voice'],
      },
      {
        name: 'Leaving Evidence — Mia Mingus',
        url: 'https://leavingevidence.wordpress.com',
        description: 'Free, searchable blog archive by Mia Mingus covering access intimacy, transformative justice, disability and race, and access as love. One of the most important ongoing writing projects in disability justice.',
        type: 'media',
        tags: ['FREE', 'Disabled Voice'],
      },
      {
        name: 'Sins Invalid',
        url: 'https://sinsinvalid.org/about',
        description: 'Home organization for Disability Justice as a framework. Free resources, videos, articles, performance videos from annual showcases, and the Skin Tooth and Bone PDF.',
        type: 'org',
        tags: ['FREE', 'Disabled Voice'],
      },
      {
        name: 'Krip-Hop Nation',
        url: 'https://kriphopnation.com',
        description: 'Free archive by Leroy Moore at the intersection of disability, race, and hip-hop. Articles, music, poetry, and advocacy with particular emphasis on police violence against disabled people of color.',
        type: 'org',
        tags: ['FREE', 'Disabled Voice'],
      },
      {
        name: 'Rooted in Rights',
        url: 'https://rootedinrights.org',
        description: 'Disability-centered media organization producing free accessible videos and guides on disability rights topics.',
        type: 'org',
        tags: ['FREE', 'Disabled Voice'],
      },
      {
        name: 'Disability Justice Project',
        url: 'https://disabilityjusticeproject.org',
        description: 'Free resources, toolkit, and articles grounding access work in community-generated disability justice principles for activism and organizational practice.',
        type: 'org',
        tags: ['FREE'],
      },
      {
        name: 'Disability Studies Quarterly (DSQ)',
        url: 'https://dsq-sds.org',
        description: 'The most important open-access peer-reviewed journal in disability studies. Covers arts, culture, media, law, education, and history. Published by the Society for Disability Studies.',
        type: 'media',
        tags: ['FREE', 'Open Access'],
      },
    ],
  },
  {
    id: 'deaf-culture',
    title: 'Deaf Culture & ASL',
    emoji: '👐',
    description: 'Organizations, free media, and resources centering Deaf culture, ASL, and the linguistic minority model of Deafness.',
    resources: [
      {
        name: 'National Association of the Deaf (NAD)',
        url: 'https://www.nad.org',
        description: 'The leading US Deaf advocacy organization. Free position papers on captioning, cochlear implants, ASL recognition, and Deaf civil rights — essential reading for the Deaf community\'s own advocacy positions.',
        type: 'org',
        tags: ['FREE', 'Deaf-Centered'],
      },
      {
        name: 'World Federation of the Deaf (WFD)',
        url: 'https://wfdeaf.org',
        description: 'International advocacy for sign language recognition and Deaf rights. Free resources on international sign language policy. UN CRPD Article 30.4 recognizes Deaf cultural identity.',
        type: 'org',
        tags: ['FREE', 'Deaf-Centered'],
      },
      {
        name: 'Gallaudet University Press — Open Access Resources',
        url: 'https://www.gallaudet.edu/gallaudet-university-press',
        description: 'The most important publisher of Deaf-centered academic and cultural writing. Some titles available open access.',
        type: 'org',
        tags: ['FREE', 'Deaf-Centered', 'Open Access'],
      },
      {
        name: 'Deaf West Theatre',
        url: 'https://deafwest.org',
        description: 'Professional theater company integrating ASL and spoken English as co-equal theatrical languages. Known for Spring Awakening (Broadway 2015) and Big River. Free resources on their approach and practice.',
        type: 'org',
        tags: ['FREE', 'Deaf-Centered'],
      },
      {
        name: 'Through Deaf Eyes (PBS, 2007)',
        url: 'https://www.pbs.org/weta/throughdeafeyes',
        description: 'Free two-hour documentary on 200 years of Deaf culture in America. Covers Deaf history, ASL literature, Deaf education, the cochlear implant debate, and Deaf arts. One of the best introductory resources in the field.',
        type: 'media',
        tags: ['FREE', 'Deaf-Centered'],
      },
      {
        name: 'HowlRound — Disability & Deaf Performance Conversations',
        url: 'https://howlround.com/happenings/disability-deaf-performance-conversation',
        description: 'Free conversations and articles on the intersection of Deaf performance and disability theater, including resources on theatrical interpreting and Deaf aesthetics.',
        type: 'media',
        tags: ['FREE', 'Deaf-Centered'],
      },
    ],
  },
  {
    id: 'representation',
    title: 'Disability Representation in Media',
    emoji: '📽️',
    description: 'Critical frameworks, free films, and research reports on authentic disability representation in theater, film, and journalism.',
    resources: [
      {
        name: 'Disability Arts Online — Reviews & Criticism',
        url: 'https://disabilityarts.online',
        description: 'UK\'s leading free platform for disability arts criticism. Reviews of theater, film, and visual art by disabled critics — an essential complement to mainstream criticism.',
        type: 'org',
        tags: ['FREE', 'Disabled Voice'],
      },
      {
        name: 'HowlRound — Disability Representation in Storytelling',
        url: 'https://howlround.com/happenings/disability-representation-storytelling',
        description: 'Free conversations and essays on disability representation in theater and film, including how disabled artists navigate representation.',
        type: 'media',
        tags: ['FREE', 'Disabled Voice'],
      },
      {
        name: 'USC Annenberg Inclusion Initiative — Disability Reports',
        url: 'https://annenberg.usc.edu/research/aii',
        description: 'Free research reports on disability representation on screen, including "Inequality in 1,300 Popular Films." Quantitative data essential for evidence-based arguments about industry change.',
        type: 'org',
        tags: ['FREE', 'Open Access'],
      },
      {
        name: 'RespectAbility — Media Guide for Journalists',
        url: 'https://www.respectability.org/representing-disability',
        description: 'Free guide for journalists and critics covering language, sourcing, and common mistakes in writing about disability. Accessible and practical, available for free download.',
        type: 'guide',
        tags: ['FREE'],
      },
      {
        name: 'Disability Visibility Project — Essays & Media',
        url: 'https://disabilityvisibilityproject.com/essays',
        description: 'Curated by Alice Wong. Disability media criticism and cultural commentary — an excellent source of first-person responses to disability representation.',
        type: 'org',
        tags: ['FREE', 'Disabled Voice'],
      },
      {
        name: 'Crip Camp: A Disability Revolution (2020)',
        url: 'https://www.youtube.com/watch?v=XRqSF85SCV0',
        description: 'Netflix/Higher Ground documentary on Camp Jened and the disability rights movement. Free on YouTube. Captioned and audio described. Widely praised by the disability community as essential viewing.',
        type: 'media',
        tags: ['FREE', 'Disabled Voice'],
      },
      {
        name: 'Sins Invalid Performance Videos',
        url: 'https://sinsinvalid.org/performances',
        description: 'Free video archives of annual performance showcases presenting disability justice as art, performance, and political practice. Among the most important documentation of disability-led artistic work.',
        type: 'media',
        tags: ['FREE', 'Disabled Voice'],
      },
    ],
  },
  {
    id: 'legal',
    title: 'Legal & Policy',
    emoji: '⚖️',
    description: 'US and international legal frameworks — ADA, Section 508, CVAA, WCAG standards, and global disability rights instruments.',
    resources: [
      {
        name: 'ADA.gov',
        url: 'https://www.ada.gov',
        description: 'The authoritative free source for all ADA guidance. Focus on Title III (public accommodations — most relevant to arts venues). Includes 2022 DOJ web accessibility guidance and 2024 final rule requiring WCAG 2.1 AA for Title II entities.',
        type: 'standard',
        tags: ['FREE'],
      },
      {
        name: 'ADA National Network',
        url: 'https://adata.org',
        description: 'Ten regional centers offering free training, webinars, guides, and a helpline (1-800-949-4232). The arts and recreation webinar series is particularly relevant for AAC members.',
        type: 'org',
        tags: ['FREE'],
      },
      {
        name: 'FCC — Closed Captioning on Television',
        url: 'https://www.fcc.gov/consumers/guides/closed-captioning-television',
        description: 'FCC guide to captioning requirements and the four quality standards (accuracy, synchrony, completeness, placement). Essential background for film and broadcast accessibility work.',
        type: 'standard',
        tags: ['FREE'],
      },
      {
        name: 'National Endowment for the Arts — Accessibility Policy',
        url: 'https://www.arts.gov/impact/accessibility',
        description: 'Free policy guidance on ADA compliance, accessibility in grant-funded projects, and NEA\'s own requirements. Accessibility is increasingly required in NEA grant criteria.',
        type: 'guide',
        tags: ['FREE'],
      },
      {
        name: 'W3C WCAG Standards',
        url: 'https://www.w3.org/WAI/standards-guidelines/wcag',
        description: 'WCAG 2.1 is the current legal standard (confirmed by DOJ in 2022 for Title II and III entities). WCAG 2.2 (October 2023) is current best practice. Free and authoritative.',
        type: 'standard',
        tags: ['FREE', 'Open Access'],
      },
      {
        name: 'UN Convention on the Rights of Persons with Disabilities (CRPD)',
        url: 'https://www.un.org/disabilities/documents/convention/convoptprot-e.pdf',
        description: 'Foundational international disability rights instrument (entered into force 2008, 190 states parties). Article 30 requires access to cultural life including theater, film, and museums. Free PDF.',
        type: 'standard',
        tags: ['FREE', 'Open Access'],
      },
      {
        name: 'UK Equality Act 2010 Guidance',
        url: 'https://www.gov.uk/guidance/equality-act-2010-guidance',
        description: 'Free government guidance. Key feature: an "anticipatory duty" to make reasonable adjustments — a stronger model than the ADA\'s reactive approach. Essential for anyone working with UK arts organizations.',
        type: 'standard',
        tags: ['FREE'],
      },
      {
        name: 'Accessible Canada — Accessible Canada Act Resources',
        url: 'https://accessible.canada.ca',
        description: 'Free resources on the Accessible Canada Act (2019) and federal accessibility standards. Important for Canadian arts organizations and broadcasters.',
        type: 'standard',
        tags: ['FREE'],
      },
    ],
  },
];

// ── All resources flat list for search ───────────────────────────────────────

const ALL_RESOURCES = CATEGORIES.flatMap((cat) =>
  cat.resources.map((r) => ({ ...r, categoryId: cat.id, categoryTitle: cat.title }))
);

// ── Tag badge ─────────────────────────────────────────────────────────────────

function TagBadge({ tag }: { tag: string }) {
  const style: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '1px 6px',
    fontSize: '0.625rem',
    fontWeight: 'bold',
    border: '1px solid',
    whiteSpace: 'nowrap',
  };
  if (tag === 'Disabled Voice')  return <span style={{ ...style, background: '#fce7f3', borderColor: '#f9a8d4', color: '#9d174d' }}>{tag}</span>;
  if (tag === 'Deaf-Centered')   return <span style={{ ...style, background: '#d8dcf5', borderColor: '#a0b0e8', color: '#1a2568' }}>{tag}</span>;
  if (tag === 'Open Access')     return <span style={{ ...style, background: '#d4f0e0', borderColor: '#7dd6a4', color: '#1a5e38' }}>{tag}</span>;
  return <span style={{ ...style, background: '#fff8c0', borderColor: '#e0c840', color: '#6b5200' }}>{tag}</span>;
}

// ── Heart / favorite button ───────────────────────────────────────────────────

function FavoriteButton({
  slug,
  count,
  isFaved,
  isLoggedIn,
  onToggle,
}: {
  slug: string;
  count: number;
  isFaved: boolean;
  isLoggedIn: boolean;
  onToggle: (slug: string) => void;
}) {
  if (!isLoggedIn) {
    return (
      <span
        title="Log in to save favorites"
        aria-label={count > 0 ? `${count} member${count !== 1 ? 's' : ''} saved this resource. Log in to save it too.` : 'Log in to save this resource'}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: 'rgba(0,0,0,0.2)', fontSize: '0.75rem', cursor: 'default', userSelect: 'none', flexShrink: 0 }}
      >
        <span aria-hidden="true">♡</span>
        {count > 0 && <span style={{ fontSize: '0.6875rem' }}>{count}</span>}
      </span>
    );
  }

  return (
    <button
      onClick={() => onToggle(slug)}
      aria-label={isFaved ? `Remove from favorites (${count} saved)` : `Save to favorites${count > 0 ? ` (${count} saved)` : ''}`}
      aria-pressed={isFaved}
      title={isFaved ? 'Remove from favorites' : 'Save to favorites'}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '3px',
        color: isFaved ? '#be123c' : 'rgba(0,0,0,0.3)',
        fontSize: '0.75rem',
        padding: '2px 4px',
        borderRadius: '4px',
        lineHeight: 1,
        flexShrink: 0,
        transition: 'color 0.15s',
      }}
      onMouseEnter={(e) => { if (!isFaved) (e.currentTarget as HTMLElement).style.color = '#be123c'; }}
      onMouseLeave={(e) => { if (!isFaved) (e.currentTarget as HTMLElement).style.color = 'rgba(0,0,0,0.3)'; }}
    >
      <span aria-hidden="true" style={{ fontSize: '0.9rem' }}>{isFaved ? '♥' : '♡'}</span>
      {count > 0 && <span style={{ fontSize: '0.6875rem', fontWeight: 600 }}>{count}</span>}
    </button>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ResourcesPage() {
  const [search, setSearch]               = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [sortPopular, setSortPopular]     = useState(false);

  // Favorites state
  const [userId, setUserId]             = useState<string | null>(null);
  const [favCounts, setFavCounts]       = useState<Record<string, number>>({});
  const [userFavs, setUserFavs]         = useState<Set<string>>(new Set());
  const [favPending, setFavPending]     = useState<Set<string>>(new Set());

  // Submission form state
  const [showSubmitForm, setShowSubmitForm]     = useState(false);
  const [submitName, setSubmitName]             = useState('');
  const [submitUrl, setSubmitUrl]               = useState('');
  const [submitCategory, setSubmitCategory]     = useState('');
  const [submitDescription, setSubmitDescription] = useState('');
  const [submitTags, setSubmitTags]             = useState<string[]>([]);
  const [submitterName, setSubmitterName]       = useState('');
  const [submitterEmail, setSubmitterEmail]     = useState('');
  const [submitLoading, setSubmitLoading]       = useState(false);
  const [submitStatus, setSubmitStatus]         = useState<'idle' | 'success' | 'error'>('idle');
  const [submitError, setSubmitError]           = useState('');

  // ── Load auth + favorites on mount ────────────────────────────────────────
  useEffect(() => {
    loadFavoritesData();
  }, []);

  const loadFavoritesData = useCallback(async () => {
    // Fetch all counts in one query
    const { data: counts } = await supabase
      .from('resource_favorites')
      .select('resource_slug');

    if (counts) {
      const tally: Record<string, number> = {};
      for (const row of counts) {
        tally[row.resource_slug] = (tally[row.resource_slug] ?? 0) + 1;
      }
      setFavCounts(tally);
    }

    // Check if logged in
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    // Fetch this user's favorites
    const { data: mine } = await supabase
      .from('resource_favorites')
      .select('resource_slug')
      .eq('user_id', user.id);

    if (mine) {
      setUserFavs(new Set(mine.map((r) => r.resource_slug)));
    }
  }, []);

  // ── Toggle favorite ────────────────────────────────────────────────────────
  const toggleFavorite = useCallback(async (slug: string) => {
    if (!userId || favPending.has(slug)) return;

    setFavPending((prev) => new Set(prev).add(slug));
    const isFaved = userFavs.has(slug);

    // Optimistic update
    setUserFavs((prev) => {
      const next = new Set(prev);
      if (isFaved) next.delete(slug); else next.add(slug);
      return next;
    });
    setFavCounts((prev) => ({
      ...prev,
      [slug]: Math.max(0, (prev[slug] ?? 0) + (isFaved ? -1 : 1)),
    }));

    // Persist
    if (isFaved) {
      await supabase
        .from('resource_favorites')
        .delete()
        .eq('user_id', userId)
        .eq('resource_slug', slug);
    } else {
      await supabase
        .from('resource_favorites')
        .insert({ user_id: userId, resource_slug: slug });
    }

    setFavPending((prev) => { const next = new Set(prev); next.delete(slug); return next; });
  }, [userId, userFavs, favPending]);

  // ── Submit a resource ────────────────────────────────────────────────────────
  const handleResourceSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submitName.trim() || !submitUrl.trim()) {
      setSubmitError('Resource name and URL are required.');
      return;
    }
    setSubmitLoading(true);
    setSubmitError('');

    const { error } = await supabase.from('resource_submissions').insert({
      resource_name:     submitName.trim(),
      resource_url:      submitUrl.trim(),
      description:       submitDescription.trim() || null,
      category:          submitCategory || null,
      special_tags:      submitTags,
      submitter_name:    submitterName.trim() || null,
      submitter_email:   submitterEmail.trim() || null,
      submitter_user_id: userId || null,
    });

    if (error) {
      setSubmitError('Something went wrong. Please try again.');
      setSubmitLoading(false);
      return;
    }

    setSubmitStatus('success');
    setSubmitLoading(false);
    // Reset form
    setSubmitName(''); setSubmitUrl(''); setSubmitCategory('');
    setSubmitDescription(''); setSubmitTags([]);
    setSubmitterName(''); setSubmitterEmail('');
  }, [submitName, submitUrl, submitCategory, submitDescription, submitTags, submitterName, submitterEmail, userId]);

  const toggleSubmitTag = (tag: string) => {
    setSubmitTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const openSubmitForm = () => {
    setShowSubmitForm(true);
    setSubmitStatus('idle');
    setSubmitError('');
  };

  // ── Filtering + sorting ────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return ALL_RESOURCES.filter((r) => {
      const matchSearch =
        !q ||
        r.name.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        (r.tags ?? []).some((t) => t.toLowerCase().includes(q)) ||
        r.categoryTitle.toLowerCase().includes(q);
      const matchCat = activeCategory === 'all' || r.categoryId === activeCategory;
      return matchSearch && matchCat;
    });
  }, [search, activeCategory]);

  const visibleCategories = useMemo(() => {
    if (search) {
      const ids = new Set(filtered.map((r) => r.categoryId));
      return CATEGORIES.filter((c) => ids.has(c.id));
    }
    if (activeCategory !== 'all') return CATEGORIES.filter((c) => c.id === activeCategory);
    return CATEGORIES;
  }, [search, activeCategory, filtered]);

  // Sort a resource list by popularity when that toggle is on
  const sortResources = useCallback((resources: Resource[]) => {
    if (!sortPopular) return resources;
    return [...resources].sort((a, b) => {
      const ca = favCounts[a.url] ?? 0;
      const cb = favCounts[b.url] ?? 0;
      return cb - ca;
    });
  }, [sortPopular, favCounts]);

  const totalCount = ALL_RESOURCES.length;
  const isLoggedIn = userId !== null;

  return (
    <main style={{ background: 'var(--aac-blue)', minHeight: '100vh', paddingBottom: '24px' }}>

      {/* Header */}
      <header>
        <div className="site-header">
          <a href="/" className="site-header-logo" aria-label="Artistic Accessibility Collective — Home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo-across-blue-bg.svg" alt="" />
          </a>
          <nav className="site-nav" aria-label="Main navigation">
            <a href="/directory" className="nav-link">Directory</a>
            <a href="/contact" className="nav-link">Contact</a>
            <a href="/login" className="nav-link">Log In</a>
          </nav>
        </div>
      </header>

      {/* Page header */}
      <div style={{ maxWidth: '980px', margin: '0 auto', padding: '14px 10px 4px' }}>
        <h1 style={{ color: '#fff', fontWeight: 'bold', fontSize: 'clamp(1.25rem, 3vw, 1.75rem)', marginBottom: '4px' }}>
          📚 Accessibility Resource Directory
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.8125rem', marginBottom: '10px' }}>
          {totalCount} free resources across {CATEGORIES.length} categories — compiled May 2026 · all verified free to access
        </p>

        {/* Tag legend */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px', alignItems: 'center' }}>
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.6875rem' }}>Tags:</span>
          <TagBadge tag="Disabled Voice" />
          <TagBadge tag="Deaf-Centered" />
          <TagBadge tag="Open Access" />
          <TagBadge tag="FREE" />
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.6875rem', marginLeft: '4px' }}>All resources are free unless otherwise noted.</span>
        </div>

        {/* Favorites note for logged-out visitors */}
        {!isLoggedIn && (
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.75rem', marginBottom: '4px' }}>
            <a href="/login" style={{ color: 'rgba(255,255,255,0.75)', textDecoration: 'underline' }}>Log in</a> to save favorites and see what your colleagues recommend most. ♡
          </p>
        )}
      </div>

      {/* Search + category nav */}
      <div style={{ maxWidth: '980px', margin: '0 auto', padding: '0 10px 10px' }}>
        <div className="ms-box" style={{ marginBottom: '0' }}>
          <div className="ms-box-header">
            <span>Search & Filter</span>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {search && (
                <button
                  onClick={() => setSearch('')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b8ccff', fontSize: '0.6875rem', padding: 0 }}
                >
                  [clear]
                </button>
              )}
              <button
                onClick={() => { setShowSubmitForm((v) => !v); setSubmitStatus('idle'); }}
                aria-expanded={showSubmitForm}
                aria-controls="suggest-form"
                style={{ background: 'none', border: '1px solid rgba(255,255,255,0.4)', borderRadius: '4px', cursor: 'pointer', color: '#fff', fontSize: '0.6875rem', padding: '2px 8px', fontWeight: 600, whiteSpace: 'nowrap' }}
              >
                {showSubmitForm ? '✕ Close' : '✚ Suggest a Resource'}
              </button>
            </div>
          </div>
          <div style={{ padding: '8px 10px' }}>
            <label htmlFor="resource-search" className="sr-only">Search resources</label>
            <input
              id="resource-search"
              type="search"
              className="form-input"
              placeholder="Search by name, description, or category…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ marginBottom: '8px' }}
            />

            {/* Filter + sort row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center' }}>
              <div role="group" aria-label="Filter by category" style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', flex: 1 }}>
                <button
                  onClick={() => setActiveCategory('all')}
                  className="btn btn-sm"
                  style={{
                    background: activeCategory === 'all' ? 'var(--aac-blue)' : 'var(--aac-white)',
                    color: activeCategory === 'all' ? 'var(--aac-white)' : 'var(--aac-blue)',
                    border: '1px solid var(--ms-border)',
                    minHeight: '32px',
                    fontSize: '0.6875rem',
                  }}
                  aria-pressed={activeCategory === 'all'}
                >
                  All ({totalCount})
                </button>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(activeCategory === cat.id ? 'all' : cat.id)}
                    className="btn btn-sm"
                    style={{
                      background: activeCategory === cat.id ? 'var(--aac-blue)' : 'var(--aac-white)',
                      color: activeCategory === cat.id ? 'var(--aac-white)' : 'var(--aac-blue)',
                      border: '1px solid var(--ms-border)',
                      minHeight: '32px',
                      fontSize: '0.6875rem',
                    }}
                    aria-pressed={activeCategory === cat.id}
                  >
                    {cat.emoji} {cat.title} ({cat.resources.length})
                  </button>
                ))}
              </div>

              {/* Popular sort toggle — separated visually */}
              <button
                onClick={() => setSortPopular((v) => !v)}
                className="btn btn-sm"
                aria-pressed={sortPopular}
                title="Sort by most favorited by members"
                style={{
                  background: sortPopular ? '#be123c' : 'var(--aac-white)',
                  color: sortPopular ? '#fff' : '#be123c',
                  border: `1px solid ${sortPopular ? '#be123c' : '#f9a8d4'}`,
                  minHeight: '32px',
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  flexShrink: 0,
                  alignSelf: 'flex-start',
                }}
              >
                ♥ Popular
              </button>
            </div>

            {/* ── Suggest a Resource form ─────────────────────────────── */}
            {showSubmitForm && (
              <div
                id="suggest-form"
                style={{ marginTop: '12px', borderTop: '1px solid var(--ms-border)', paddingTop: '12px' }}
              >
                <p style={{ fontWeight: 'bold', fontSize: '0.8125rem', color: 'var(--aac-blue-dark)', marginBottom: '2px' }}>
                  ✚ Suggest a Resource
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '10px' }}>
                  Know a free resource that belongs here? Share it — every suggestion is reviewed before being added.
                </p>

                {submitStatus === 'success' ? (
                  <div role="status" style={{ background: '#d4f0e0', border: '1px solid #7dd6a4', borderRadius: '4px', padding: '10px 12px', fontSize: '0.8125rem', color: '#1a5e38' }}>
                    <strong>Thank you!</strong> Your suggestion has been received. We&apos;ll review it and add it if it&apos;s a good fit.{' '}
                    <button
                      onClick={() => { setSubmitStatus('idle'); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1a5e38', textDecoration: 'underline', font: 'inherit', padding: 0 }}
                    >
                      Suggest another
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleResourceSubmit} noValidate aria-label="Suggest a resource form">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>

                      {/* Resource name */}
                      <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label htmlFor="sub-name" className="form-label form-label-required" style={{ fontSize: '0.75rem' }}>
                          Resource Name
                        </label>
                        <input
                          id="sub-name"
                          type="text"
                          className="form-input"
                          style={{ fontSize: '0.8125rem' }}
                          placeholder="e.g. DCMP Captioning Key"
                          value={submitName}
                          onChange={(e) => setSubmitName(e.target.value)}
                          required
                          aria-required="true"
                        />
                      </div>

                      {/* URL */}
                      <div className="form-group">
                        <label htmlFor="sub-url" className="form-label form-label-required" style={{ fontSize: '0.75rem' }}>
                          URL
                        </label>
                        <input
                          id="sub-url"
                          type="url"
                          className="form-input"
                          style={{ fontSize: '0.8125rem' }}
                          placeholder="https://…"
                          value={submitUrl}
                          onChange={(e) => setSubmitUrl(e.target.value)}
                          required
                          aria-required="true"
                        />
                      </div>

                      {/* Category */}
                      <div className="form-group">
                        <label htmlFor="sub-category" className="form-label" style={{ fontSize: '0.75rem' }}>
                          Best Category
                        </label>
                        <select
                          id="sub-category"
                          className="form-input"
                          style={{ fontSize: '0.8125rem' }}
                          value={submitCategory}
                          onChange={(e) => setSubmitCategory(e.target.value)}
                        >
                          <option value="">— pick one —</option>
                          {CATEGORIES.map((c) => (
                            <option key={c.id} value={c.id}>{c.emoji} {c.title}</option>
                          ))}
                          <option value="other">Other / Not sure</option>
                        </select>
                      </div>

                      {/* Description */}
                      <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label htmlFor="sub-desc" className="form-label" style={{ fontSize: '0.75rem' }}>
                          Why is it valuable? <span style={{ fontWeight: 400, color: 'var(--color-text-muted)' }}>(the more detail, the better)</span>
                        </label>
                        <textarea
                          id="sub-desc"
                          className="form-input form-textarea"
                          rows={3}
                          style={{ fontSize: '0.8125rem' }}
                          placeholder="What does it cover? Who is it for? What makes it worth adding?"
                          value={submitDescription}
                          onChange={(e) => setSubmitDescription(e.target.value)}
                        />
                      </div>

                      {/* Special tags */}
                      <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
                          <legend className="form-label" style={{ fontSize: '0.75rem', marginBottom: '6px' }}>
                            Special tags <span style={{ fontWeight: 400, color: 'var(--color-text-muted)' }}>(check all that apply)</span>
                          </legend>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {['Disabled Voice', 'Deaf-Centered', 'Open Access'].map((tag) => (
                              <label key={tag} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', cursor: 'pointer' }}>
                                <input
                                  type="checkbox"
                                  checked={submitTags.includes(tag)}
                                  onChange={() => toggleSubmitTag(tag)}
                                  style={{ accentColor: 'var(--aac-blue)' }}
                                />
                                <TagBadge tag={tag} />
                              </label>
                            ))}
                          </div>
                        </fieldset>
                      </div>

                      {/* Divider */}
                      <div style={{ gridColumn: '1 / -1', borderTop: '1px dashed var(--ms-border)', margin: '2px 0' }} />

                      {/* Submitter info — optional */}
                      <div className="form-group">
                        <label htmlFor="sub-person-name" className="form-label" style={{ fontSize: '0.75rem' }}>
                          Your Name <span style={{ fontWeight: 400, color: 'var(--color-text-muted)' }}>(optional)</span>
                        </label>
                        <input
                          id="sub-person-name"
                          type="text"
                          className="form-input"
                          style={{ fontSize: '0.8125rem' }}
                          placeholder="So we can credit you!"
                          value={submitterName}
                          onChange={(e) => setSubmitterName(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="sub-person-email" className="form-label" style={{ fontSize: '0.75rem' }}>
                          Your Email <span style={{ fontWeight: 400, color: 'var(--color-text-muted)' }}>(optional)</span>
                        </label>
                        <input
                          id="sub-person-email"
                          type="email"
                          className="form-input"
                          style={{ fontSize: '0.8125rem' }}
                          placeholder="In case we have questions"
                          value={submitterEmail}
                          onChange={(e) => setSubmitterEmail(e.target.value)}
                        />
                      </div>
                    </div>

                    {submitError && (
                      <p role="alert" style={{ color: 'var(--color-error)', fontSize: '0.8125rem', marginTop: '6px' }}>
                        {submitError}
                      </p>
                    )}

                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                      <button type="submit" className="btn btn-primary btn-sm" disabled={submitLoading}>
                        {submitLoading
                          ? <><span className="spinner" aria-hidden="true" style={{ width: 14, height: 14, borderWidth: 2 }} /> Submitting…</>
                          : 'Submit Suggestion'}
                      </button>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowSubmitForm(false)}>
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search results count */}
      {search && (
        <div style={{ maxWidth: '980px', margin: '0 auto', padding: '0 10px 6px' }}>
          <p aria-live="polite" aria-atomic="true" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem' }}>
            {filtered.length === 0
              ? 'No resources match your search.'
              : `Showing ${filtered.length} resource${filtered.length !== 1 ? 's' : ''} matching "${search}"`}
          </p>
        </div>
      )}

      {/* Resource sections */}
      <div style={{ maxWidth: '980px', margin: '0 auto', padding: '0 10px' }}>
        {filtered.length === 0 && search ? (
          <div className="ms-box">
            <div className="ms-box-body">
              <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '16px 0' }}>
                No resources found for &ldquo;{search}&rdquo;.{' '}
                <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--aac-blue)', textDecoration: 'underline', font: 'inherit', padding: 0 }}>
                  Clear search
                </button>
              </p>
            </div>
          </div>
        ) : (
          visibleCategories.map((cat) => {
            const rawResources = search
              ? filtered.filter((r) => r.categoryId === cat.id)
              : cat.resources;
            if (rawResources.length === 0) return null;
            const catResources = sortResources(rawResources);

            // Count how many resources in this category have any favorites
            const catFavTotal = rawResources.reduce((sum, r) => sum + (favCounts[r.url] ?? 0), 0);

            return (
              <section key={cat.id} aria-labelledby={`cat-${cat.id}`}>
                <div className="ms-box">
                  <div className="ms-box-header">
                    <span id={`cat-${cat.id}`}>
                      {cat.emoji} {cat.title}
                      <span style={{ fontWeight: 'normal', color: '#b8ccff', marginLeft: '6px', fontSize: '0.6875rem' }}>
                        {catResources.length} resource{catResources.length !== 1 ? 's' : ''}
                      </span>
                      {catFavTotal > 0 && (
                        <span style={{ fontWeight: 'normal', color: '#fca5a5', marginLeft: '6px', fontSize: '0.6875rem' }}>
                          · ♥ {catFavTotal} save{catFavTotal !== 1 ? 's' : ''}
                        </span>
                      )}
                    </span>
                  </div>

                  {/* Category description */}
                  <div style={{ padding: '5px 10px 0', borderBottom: '1px solid var(--ms-border)', background: 'var(--ms-row-alt)' }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '0 0 5px' }}>{cat.description}</p>
                  </div>

                  {/* Resources list */}
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {catResources.map((resource, i) => {
                      const count  = favCounts[resource.url] ?? 0;
                      const isFaved = userFavs.has(resource.url);
                      return (
                        <li
                          key={resource.url}
                          style={{
                            padding: '8px 10px',
                            borderBottom: i < catResources.length - 1 ? '1px solid var(--ms-border)' : 'none',
                            background: i % 2 === 0 ? '#fff' : 'var(--ms-row-alt)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', flexWrap: 'wrap', marginBottom: '3px' }}>
                            {/* Type badge */}
                            <span className={`tag ${TYPE_CLASS[resource.type]}`} style={{ fontSize: '0.625rem', flexShrink: 0, marginTop: '1px' }}>
                              {TYPE_LABELS[resource.type]}
                            </span>
                            {/* Name / link */}
                            <a
                              href={resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ fontWeight: 'bold', fontSize: '0.8125rem', color: 'var(--aac-blue)', flex: 1, minWidth: '200px' }}
                            >
                              {resource.name}
                              <span className="sr-only"> (opens in new tab)</span>
                            </a>
                            {/* Extra tags */}
                            {resource.tags && resource.tags.filter(t => t !== 'FREE').map((tag) => (
                              <TagBadge key={tag} tag={tag} />
                            ))}
                            {/* Favorite button */}
                            <FavoriteButton
                              slug={resource.url}
                              count={count}
                              isFaved={isFaved}
                              isLoggedIn={isLoggedIn}
                              onToggle={toggleFavorite}
                            />
                          </div>
                          <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--color-text)', lineHeight: 1.5 }}>
                            {resource.description}
                          </p>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </section>
            );
          })
        )}
      </div>

      {/* Footer */}
      <footer aria-label="Site footer" className="ms-footer" style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)', borderTop: '1px solid rgba(255,255,255,0.2)', maxWidth: '980px', margin: '16px auto 0' }}>
        <p style={{ margin: '0 0 4px' }}>
          Resources compiled May 2026 · All resources verified free to access at time of publication.
        </p>
        <nav aria-label="Footer links" style={{ display: 'inline' }}>
          <a href="/" style={{ color: 'inherit' }}>Home</a>
          <span className="ms-footer-pipe" aria-hidden="true">|</span>
          <a href="/directory" style={{ color: 'inherit' }}>Member Directory</a>
          <span className="ms-footer-pipe" aria-hidden="true">|</span>
          <a href="/contact" style={{ color: 'inherit' }}>Contact Us</a>
        </nav>
        <br />
        <span style={{ marginTop: '4px', display: 'block' }}>
          ©{new Date().getFullYear()} Artistic Accessibility Collective. All Rights Reserved.
        </span>
      </footer>

    </main>
  );
}
